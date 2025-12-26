import * as esbuild from "esbuild";
import { denoPlugins } from "esbuild-deno-loader";
import { copy, exists } from "@std/fs";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import postcss from "postcss";

const buildDir = "dist";

function envFlag(name: string, defaultValue = false): boolean {
  const raw = Deno.env.get(name);
  if (raw === undefined) return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

async function build() {
  const DEV = envFlag("DEV", false);
  const MINIFY = envFlag("MINIFY", false);

  const repoRoot = new URL("..", import.meta.url).pathname;
  const stellarSdkRoot = `${repoRoot}node_modules/.deno/@stellar+stellar-sdk@14.4.2/node_modules/@stellar/stellar-sdk/`;
  const stellarSdkMinimalEntry = `${stellarSdkRoot}lib/minimal/index.js`;
  const stellarSdkRpcEntry = `${stellarSdkRoot}lib/rpc/index.js`;
  const stellarSdkContractEntry = `${stellarSdkRoot}lib/contract/index.js`;

  const nodeCryptoShimPlugin: esbuild.Plugin = {
    name: "node-crypto-shim",
    setup(build) {
      build.onResolve({ filter: /^node:crypto$/ }, () => {
        return {
          path: new URL("./common/polyfills/node-crypto.ts", import.meta.url)
            .pathname,
        };
      });
      build.onResolve({ filter: /^crypto$/ }, () => {
        return {
          path: new URL("./common/polyfills/node-crypto.ts", import.meta.url)
            .pathname,
        };
      });
    },
  };

  const cspSafeDepsPlugin: esbuild.Plugin = {
    name: "csp-safe-deps",
    setup(build) {
      build.onResolve({ filter: /^(npm:)?randombytes$/ }, () => {
        return {
          path: new URL("./common/polyfills/randombytes.ts", import.meta.url)
            .pathname,
        };
      });

      build.onResolve({ filter: /^(npm:)?axios$/ }, () => {
        return {
          path: new URL("./common/polyfills/axios.ts", import.meta.url)
            .pathname,
        };
      });
      build.onResolve({ filter: /^(npm:)?process$/ }, () => {
        return {
          path: new URL("./common/polyfills/process.ts", import.meta.url)
            .pathname,
        };
      });
      build.onResolve({ filter: /^(npm:)?function-bind$/ }, () => {
        return {
          path: new URL("./common/polyfills/function-bind.cjs", import.meta.url)
            .pathname,
        };
      });
      build.onResolve({ filter: /^(npm:)?get-intrinsic$/ }, () => {
        return {
          path: new URL("./common/polyfills/get-intrinsic.cjs", import.meta.url)
            .pathname,
        };
      });

      // Force 'buffer' to resolve to the npm package (instead of Node built-in)
      // This fixes "Dynamic require of 'buffer' is not supported"
      build.onResolve({ filter: /^buffer$/ }, () => {
        return {
          path: new URL(import.meta.resolve("buffer")).pathname,
        };
      });
    },
  };

  // Keep the extension root folder stable.
  // Removing the loaded extension directory during rebuild can cause browsers
  // to treat it as removed and wipe/lose extension storage.
  if (!(await exists(buildDir))) {
    await Deno.mkdir(buildDir);
  }

  // Copy static assets
  await copy("manifest.json", `${buildDir}/manifest.json`, { overwrite: true });
  await copy("src/popup/index.html", `${buildDir}/popup.html`, {
    overwrite: true,
  });

  // Create icons directory if it doesn't exist (placeholder)
  const iconsDir = `${buildDir}/icons`;
  if (!(await exists(iconsDir))) {
    await Deno.mkdir(iconsDir);
  }

  // Build Tailwind CSS
  const cssInput = await Deno.readTextFile("src/popup/style.css");
  const result = await postcss([tailwindcss(), autoprefixer()]).process(
    cssInput,
    {
      from: "src/popup/style.css",
      to: `${buildDir}/style.css`,
    }
  );
  await Deno.writeTextFile(`${buildDir}/style.css`, result.css);

  const configPath = new URL("../deno.json", import.meta.url).pathname;

  // Build Background Script
  // NOTE: The MV3 service worker is configured as a classic script (no "type":"module"),
  // because this environment blocks dynamic `import()` via CSP and module service workers
  // do not support `importScripts()`. Classic SW + IIFE bundle keeps startup reliable.
  await esbuild.build({
    plugins: [
      nodeCryptoShimPlugin,
      cspSafeDepsPlugin,
      ...denoPlugins({ configPath }),
    ],
    entryPoints: ["./src/background/handler.ts"],
    bundle: true,
    outfile: `${buildDir}/background.js`,
    format: "iife",
    // Keep background CSP-safe by avoiding `package.json#browser` remapping.
    platform: "neutral",
    splitting: false,
    mainFields: ["module", "main"],
    conditions: ["worker", "default"],
    define: { __DEV__: DEV ? "true" : "false", global: "globalThis" },
    minify: MINIFY,
    sourcemap: DEV,
  });

  // Build Private Tracking bundle (loaded lazily by the background SW).
  // NOTE: output is classic (IIFE) so it can be loaded via importScripts().
  await esbuild.build({
    plugins: [
      nodeCryptoShimPlugin,
      cspSafeDepsPlugin,
      ...denoPlugins({ configPath }),
    ],
    entryPoints: ["./src/background/private-tracking-entry.ts"],
    bundle: true,
    outfile: `${buildDir}/private-tracking.js`,
    format: "iife",
    globalName: "MoonlightPrivateTracking",
    // IMPORTANT: `platform: "browser"` makes esbuild apply `package.json#browser`
    // field remapping, which pulls in webpacked `dist/*.min.js` bundles for Stellar
    // that contain CSP-unsafe `new Function(...)`.
    // `platform: "neutral"` avoids that remapping while still letting us bundle for
    // the MV3 service worker environment.
    platform: "neutral",
    // IMPORTANT: MV3 CSP can reject bundles that contain/execute `new Function(...)`.
    // Some upstream deps (notably Stellar SDK/base) publish webpacked browser bundles
    // via the `browser` field/condition that include this pattern.
    // For the private-tracking bundle, prefer non-browser entrypoints to avoid it.
    mainFields: ["module", "main"],
    // Include "default" so package.json `exports` can fall back properly.
    conditions: ["worker", "default"],
    define: { __DEV__: DEV ? "true" : "false", global: "globalThis" },
    minify: MINIFY,
    sourcemap: DEV,
  });

  // Build Popup Script
  await esbuild.build({
    plugins: [
      nodeCryptoShimPlugin,
      cspSafeDepsPlugin,
      ...denoPlugins({ configPath }),
    ],
    entryPoints: ["./src/popup/main.tsx"],
    bundle: true,
    outfile: `${buildDir}/popup.js`,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "react",
    define: { __DEV__: DEV ? "true" : "false", global: "globalThis" },
    minify: MINIFY,
    sourcemap: DEV,
  });

  console.log("Build complete! Load the 'dist' folder in your browser.");

  // Stop esbuild if not in watch mode
  esbuild.stop();
}

build().catch((err) => {
  console.error("Build failed:", err);
  Deno.exit(1);
});
