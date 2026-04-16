#!/usr/bin/env node

import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { binaryFileName } from "../scripts/platform.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const binaryPath =
  process.env.AGENT_ASCII_BINARY_PATH ||
  path.join(packageRoot, "vendor", binaryFileName());

try {
  accessSync(binaryPath, constants.X_OK);
} catch {
  console.error(
    [
      "agent-ascii native binary is missing.",
      "Run `npm rebuild agent-ascii` to re-run the installer, or set AGENT_ASCII_BINARY_PATH.",
      `Expected binary at: ${binaryPath}`
    ].join("\n")
  );
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`Failed to launch agent-ascii: ${error.message}`);
  process.exit(1);
});
