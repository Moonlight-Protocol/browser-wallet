import * as esbuild from "esbuild";
import { denoPlugins } from "esbuild-deno-loader";
import { copy, exists } from "@std/fs";
import tailwindcss from "tailwindcss";
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
    { from: "src/popup/style.css", to: `${buildDir}/style.css` }
  );
  await Deno.writeTextFile(`${buildDir}/style.css`, result.css);

  const configPath = new URL("../deno.json", import.meta.url).pathname;

  // Build Background Script
  await esbuild.build({
    plugins: [...denoPlugins({ configPath })],
    entryPoints: ["./src/background/handler.ts"],
    bundle: true,
    outfile: `${buildDir}/background.js`,
    format: "esm",
    platform: "browser",
    define: { __DEV__: DEV ? "true" : "false" },
    minify: MINIFY,
    sourcemap: DEV,
  });

  // Build Popup Script
  await esbuild.build({
    plugins: [...denoPlugins({ configPath })],
    entryPoints: ["./src/popup/main.tsx"],
    bundle: true,
    outfile: `${buildDir}/popup.js`,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "react",
    define: { __DEV__: DEV ? "true" : "false" },
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
