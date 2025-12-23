// Browser-safe shim for the minimal subset of `node:crypto` we need.
// Some upstream deps (e.g. Stellar SDK utils) import `randomBytes`.

export function randomBytes(size: number): Uint8Array {
  if (!Number.isFinite(size) || size < 0) {
    throw new RangeError(
      `randomBytes size must be a non-negative number, got: ${size}`
    );
  }

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("WebCrypto is not available in this environment");
  }

  const out = new Uint8Array(size);
  cryptoObj.getRandomValues(out);
  return out;
}
