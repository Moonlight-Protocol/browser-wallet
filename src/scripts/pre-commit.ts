#!/usr/bin/env -S deno run --allow-run --allow-read

interface CheckResult {
  name: string;
  success: boolean;
  message?: string;
}

async function runCheck(
  name: string,
  command: string,
  args: string[],
  hint?: string,
): Promise<CheckResult> {
  console.log(`  → ${name}...`);
 
  const cmd = new Deno.Command(command, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();

  if (!result.success) {
    return {
      name,
      success: false,
      message: hint,
    };
  }

  return { name, success: true };
}

async function main() {
  console.log("🔍 Running pre-commit checks...\n");

  const checks: CheckResult[] = [];

  // Format check
  checks.push(
    await runCheck(
      "Checking code formatting",
      "deno",
      ["fmt", "--check"],
      "💡 Run 'deno task fmt' to fix formatting issues",
    ),
  );

  // Linting
  checks.push(
    await runCheck(
      "Running linter",
      "deno",
      ["lint"],
      "💡 Run 'deno task lint:fix' to auto-fix issues",
    ),
  );

  // Type checking
  // checks.push(
  //   await runCheck(
  //     "Type checking",
  //     "deno",
  //     ["check", "src/**/*.ts"],
  //     "💡 Fix the TypeScript errors shown above",
  //   ),
  // );

  console.log("");
  const failed = checks.filter((c) => !c.success);

  if (failed.length > 0) {
    console.log("❌ Pre-commit checks failed:\n");
    failed.forEach((check) => {
      console.log(`  ✗ ${check.name}`);
      if (check.message) {
        console.log(`    ${check.message}`);
      }
    });
    console.log("");
    Deno.exit(1);
  }

  console.log("✅ All pre-commit checks passed!\n");
  Deno.exit(0);
}

main();
