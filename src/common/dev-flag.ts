// Compile-time dev flag injected by esbuild in src/build.ts
// (so it works in browser bundles without relying on process.env).
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __DEV__: boolean;

export const DEV = __DEV__;
