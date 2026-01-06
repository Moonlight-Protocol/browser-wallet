import browser from "webextension-polyfill";
import type { EncryptionAdapter } from "@/persistence/types.ts";
import { VaultStore } from "@/persistence/stores/vault.ts";
import { MetaStore } from "@/persistence/stores/meta.ts";
import { ChainStore } from "@/persistence/stores/chain.ts";
import { PrivateChannelsStore } from "@/persistence/stores/private-channels.ts";
import { PrivateUtxosStore } from "@/persistence/stores/private-utxos.ts";
import { SigningRequestManager } from "@/background/services/signing-manager.ts";
import { base64ToBytes } from "@/common/utils/base64-to-bytes.ts";
import { bytesToBase64 } from "@/common/utils/bytes-to-base64.ts";

const DEFAULT_TTL_MS = 3 * 60 * 1000;
const SALT_STORAGE_KEY = "vault.crypto.salt";

let lockTimer: number | undefined;
let unlockedUntil = 0;

// Single instance for background lifetime.
export const vault = new VaultStore();
export const meta = new MetaStore();
export const chain = new ChainStore();
export const privateChannels = new PrivateChannelsStore();
export const privateUtxos = new PrivateUtxosStore();
export const signingManager = new SigningRequestManager();

let hydrated = false;
let hydrating: Promise<void> | undefined;

const HYDRATE_TIMEOUT_MS = 5_000;

export function ensureSessionHydrated(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;

  const startedAt = Date.now();

  hydrating = (async () => {
    try {
      await Promise.race([
        Promise.all([
          meta.hydrateFromStorage(),
          chain.hydrateFromStorage(),
          privateChannels.hydrateFromStorage(),
          privateUtxos.hydrateFromStorage(),
        ]),
        new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Session hydration timed out"));
          }, HYDRATE_TIMEOUT_MS);
        }),
      ]);

      hydrated = true;
    } catch (err) {
      hydrated = false;
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to hydrate session", {
        message,
        ms: Date.now() - startedAt,
      });
      throw err;
    } finally {
      hydrating = undefined;
    }
  })();

  return hydrating;
}

function clearLockTimer() {
  if (lockTimer !== undefined) {
    clearTimeout(lockTimer);
    lockTimer = undefined;
  }
}

function scheduleAutoLock(ttlMs: number) {
  clearLockTimer();
  unlockedUntil = Date.now() + ttlMs;
  lockTimer = setTimeout(() => {
    vault.lock();
    unlockedUntil = 0;
    lockTimer = undefined;
  }, ttlMs) as unknown as number;
}

async function getOrCreateSalt(): Promise<Uint8Array> {
  const result = await browser.storage.local.get(SALT_STORAGE_KEY);
  const existing = result[SALT_STORAGE_KEY];

  if (typeof existing === "string" && existing.length > 0) {
    return base64ToBytes(existing);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  await browser.storage.local.set({ [SALT_STORAGE_KEY]: bytesToBase64(salt) });
  return salt;
}

async function deriveAesKeyFromPassword(password: string): Promise<CryptoKey> {
  const salt = await getOrCreateSalt();
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as unknown as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function makeAdapter(key: CryptoKey): EncryptionAdapter {
  return {
    encrypt: async (plain: string) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plain);
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        key,
        encoded as unknown as BufferSource
      );
      return `v1:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipher))}`;
    },
    decrypt: async (cipher: string) => {
      const parts = cipher.split(":");
      if (parts.length !== 3 || parts[0] !== "v1") {
        throw new Error("Invalid ciphertext");
      }
      const iv = base64ToBytes(parts[1]);
      const data = base64ToBytes(parts[2]);
      const plainBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        key,
        data as unknown as BufferSource
      );
      return new TextDecoder().decode(new Uint8Array(plainBuf));
    },
  };
}

export function isUnlocked(): boolean {
  return !vault.isLocked() && Date.now() < unlockedUntil;
}

export async function unlockVault(params: {
  password: string;
  ttlMs?: number;
}) {
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const key = await deriveAesKeyFromPassword(params.password);
  const adapter = makeAdapter(key);

  await vault.unlock(adapter);
  meta.setPasswordSet(true);

  // One-time migration/backfill: if the user already has wallets but no
  // persisted main key yet, pick the first wallet/account as main.
  const currentMeta = meta.store.getValue();
  if (!currentMeta.mainKey) {
    const v = vault.store.getValue();
    const firstWallet = v.wallets[0];
    const firstAccount = firstWallet?.accounts?.[0];
    if (firstWallet && firstAccount) {
      meta.setMainKey({ walletId: firstWallet.id, accountId: firstAccount.id });
      if (!currentMeta.lastSelectedAccount) {
        meta.setLastSelectedAccount({
          walletId: firstWallet.id,
          accountId: firstAccount.id,
        });
      }
    }
  }

  await meta.flush();
  scheduleAutoLock(ttlMs);
}

export function lockVault() {
  clearLockTimer();
  unlockedUntil = 0;
  vault.lock();
}

export function extendVaultSession(params?: { ttlMs?: number }): boolean {
  if (vault.isLocked()) return false;
  const ttlMs = params?.ttlMs ?? DEFAULT_TTL_MS;
  scheduleAutoLock(ttlMs);
  return true;
}
