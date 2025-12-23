// Minimal, MV3-safe Buffer shim.
//
// Why: the npm `buffer` package includes `new Function("return this")()` for global detection,
// which is blocked by MV3 CSP (no unsafe-eval) and causes `importScripts()` to fail.
//
// This shim only implements what this codebase currently needs:
// - `Buffer.from(Uint8Array | ArrayBuffer | number[] | string)`
// - `Buffer.isBuffer()`
// - behaves like a Uint8Array

export class Buffer extends Uint8Array {
  static from(
    input:
      | ArrayBuffer
      | ArrayBufferView
      | ArrayLike<number>
      | string,
    encoding?: "utf8" | "utf-8" | "base64"
  ): Buffer {
    if (typeof input === "string") {
      // Only UTF-8 and base64 are implemented; extend if needed.
      if (encoding === "base64") {
        const bytes = base64ToBytes(input);
        return new Buffer(bytes);
      }

      const enc = new TextEncoder();
      return new Buffer(enc.encode(input));
    }

    if (input instanceof ArrayBuffer) {
      return new Buffer(new Uint8Array(input));
    }

    if (ArrayBuffer.isView(input)) {
      return new Buffer(
        new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      );
    }

    return new Buffer(Uint8Array.from(input));
  }

  static isBuffer(value: unknown): value is Buffer {
    return value instanceof Buffer;
  }
}

function base64ToBytes(b64: string): Uint8Array {
  // atob is available in browsers/service workers.
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
