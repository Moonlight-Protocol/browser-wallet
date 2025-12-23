// Browser/MV3-safe replacement for the `randombytes` npm package.
// Provides the same function signature (`randomBytes(size, cb?)`) but uses
// Web Crypto instead of Node's `crypto` module.

export default function randomBytes(
  size: number,
  cb?: (err: unknown, buf: Uint8Array) => void
): Uint8Array {
  const out = new Uint8Array(size);
  crypto.getRandomValues(out);
  if (typeof cb === "function") {
    // Match node-style callback signature.
    queueMicrotask(() => cb(null, out));
  }
  return out;
}
