#!/usr/bin/env -S deno run --allow-read --allow-write

const hookContent = `#!/bin/sh
exec deno run --allow-run --allow-read src/scripts/pre-commit.ts
`;

const hookPath = ".git/hooks/pre-commit";

console.log("📦 Installing pre-commit hook...");

try {
  await Deno.stat(".git");
} catch {
  console.error("❌ Error: Not a git repository");
  Deno.exit(1);
}

try {
  await Deno.mkdir(".git/hooks", { recursive: true });
} catch {
  // Directory exists
}

await Deno.writeTextFile(hookPath, hookContent);
await Deno.chmod(hookPath, 0o755);

console.log("✅ Pre-commit hook installed successfully!");
console.log("");
console.log("The hook will run automatically on every commit.");
console.log("To skip the hook: git commit --no-verify");
