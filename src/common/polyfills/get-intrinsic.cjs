"use strict";

// CSP-safe replacement for the `get-intrinsic` package.
// The upstream package uses the Function constructor for feature detection,
// which violates MV3 CSP (unsafe-eval). This simplified implementation covers
// the intrinsic lookups used by our dependency graph.

/**
 * @param {string} name
 * @param {boolean=} allowMissing
 */
module.exports = function GetIntrinsic(name, allowMissing) {
  if (typeof name !== "string" || name.length === 0) {
    throw new TypeError("GetIntrinsic: name must be a non-empty string");
  }

  let intrinsicName = name;
  if (
    intrinsicName[0] === "%" &&
    intrinsicName[intrinsicName.length - 1] === "%"
  ) {
    intrinsicName = intrinsicName.slice(1, -1);
  }

  // Common callers sometimes pass e.g. "String.prototype.indexOf" without %.
  const parts = intrinsicName.split(".");

  /** @type {any} */
  let value = globalThis;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (!key) continue;
    if (value == null) {
      value = void 0;
      break;
    }
    value = value[key];
  }

  if (value === void 0) {
    if (allowMissing) return void 0;
    throw new TypeError("GetIntrinsic: intrinsic not found: " + name);
  }

  return value;
};
