import { Buffer as BufferPolyfill } from "buffer";
import processPolyfill from "process";

// Some npm packages (e.g. bip39) expect Node globals even when bundled for the browser.
const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.Buffer === "undefined") {
  g.Buffer = BufferPolyfill;
}

if (typeof g.process === "undefined") {
  g.process = processPolyfill;
}
