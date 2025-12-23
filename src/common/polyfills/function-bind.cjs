"use strict";

// CSP-safe replacement for the `function-bind` package.
// The original package falls back to an implementation that uses the Function
// constructor to preserve `.length`, which MV3 CSP forbids.
module.exports = Function.prototype.bind;
