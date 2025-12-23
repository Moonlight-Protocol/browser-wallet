type NextTick = (cb: (...args: unknown[]) => void, ...args: unknown[]) => void;

// Minimal CSP-safe `process` shim for browser/MV3 worker environments.
// Avoids depending on the `process` npm package which assumes a Node `global`.
const nextTick: NextTick = (cb, ...args) => {
  // Microtask queue is close enough for our usage.
  Promise.resolve().then(() => cb(...args));
};

const processShim = {
  env: {} as Record<string, string>,
  argv: [] as string[],
  browser: true,
  versions: {} as Record<string, string>,
  version: "",
  cwd: () => "/",
  nextTick,
};

export default processShim;
