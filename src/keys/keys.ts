import "@/common/polyfills/node-globals.ts";

import { mnemonicToSeed, generateMnemonic, validateMnemonic } from "bip39";
import { Keypair } from "stellar-sdk";

const ED25519_CURVE_SEED = new TextEncoder().encode("ed25519 seed");
const HARDENED_OFFSET = 0x80000000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function u32be(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = (value >>> 24) & 0xff;
  out[1] = (value >>> 16) & 0xff;
  out[2] = (value >>> 8) & 0xff;
  out[3] = value & 0xff;
  return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

async function hmacSha512(
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    data as unknown as BufferSource
  );
  return new Uint8Array(sig);
}

type ExtendedKey = {
  key: Uint8Array; // 32 bytes
  chainCode: Uint8Array; // 32 bytes
};

async function slip10MasterKeyFromSeed(seed: Uint8Array): Promise<ExtendedKey> {
  const i = await hmacSha512(ED25519_CURVE_SEED, seed);
  return { key: i.slice(0, 32), chainCode: i.slice(32, 64) };
}

async function ckdPriv(
  parent: ExtendedKey,
  index: number
): Promise<ExtendedKey> {
  if (index < HARDENED_OFFSET) {
    throw new Error("ed25519 derivation requires hardened index");
  }

  // Data = 0x00 || key || index
  const data = concatBytes(new Uint8Array([0]), parent.key, u32be(index));
  const i = await hmacSha512(parent.chainCode, data);
  return { key: i.slice(0, 32), chainCode: i.slice(32, 64) };
}

function parseHardenedPath(path: string): number[] {
  const clean = path.trim();
  if (!clean) throw new Error("Empty derivation path");

  const parts = clean.split("/");
  if (parts[0] !== "m") throw new Error("Path must start with m");

  const indices: number[] = [];
  for (const part of parts.slice(1)) {
    if (!part.endsWith("'")) {
      throw new Error(
        "ed25519 derivation only supports hardened segments (must end with ')"
      );
    }

    const raw = part.slice(0, -1);
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 0x7fffffff) {
      throw new Error(`Invalid path segment: ${part}`);
    }
    indices.push(n + HARDENED_OFFSET);
  }

  return indices;
}

async function deriveEd25519SeedFromMnemonic(
  mnemonic: string,
  derivationPath: string
): Promise<Uint8Array> {
  const seed = await mnemonicToSeed(mnemonic);
  const seedBytes = new Uint8Array(seed);

  let node = await slip10MasterKeyFromSeed(seedBytes);
  for (const index of parseHardenedPath(derivationPath)) {
    node = await ckdPriv(node, index);
  }

  return node.key;
}

export class Keys {
  // Default to 12 words (128 bits entropy) for onboarding UX.
  static generateMnemonic(strength = 128): string {
    return generateMnemonic(strength);
  }

  static validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
  }

  static async deriveStellarKeypairFromMnemonic(
    mnemonic: string,
    index = 0
  ): Promise<Keypair> {
    const derivationPath = `m/44'/148'/${index}'`;
    const rawSeed = await deriveEd25519SeedFromMnemonic(
      mnemonic,
      derivationPath
    );
    return Keypair.fromRawEd25519Seed(rawSeed);
  }

  static async deriveStellarAccountFromMnemonic(
    mnemonic: string,
    index = 0
  ): Promise<{
    publicKey: string;
    secret: string;
    derivationPath: string;
    index: number;
  }> {
    const derivationPath = `m/44'/148'/${index}'`;
    const keypair = await this.deriveStellarKeypairFromMnemonic(
      mnemonic,
      index
    );
    return {
      publicKey: keypair.publicKey(),
      secret: keypair.secret(),
      derivationPath,
      index,
    };
  }

  static generateRandomSecret(): string {
    return Keypair.random().secret();
  }

  static keypairFromSecret(secret: string): Keypair {
    return Keypair.fromSecret(secret);
  }

  static publicKeyFromSecret(secret: string): string {
    return this.keypairFromSecret(secret).publicKey();
  }

  static fingerprintPublicKey(publicKey: string): string {
    // Simple stable short identifier for UI/logs.
    const bytes = new TextEncoder().encode(publicKey);
    return bytesToHex(bytes).slice(0, 12);
  }
}
