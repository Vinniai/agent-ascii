#!/usr/bin/env node

import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  currentPlatformPackage,
  localFallbackBinaryPath
} from "../scripts/platform.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const require = createRequire(import.meta.url);
const binaryPath =
  process.env.AGENT_ASCII_BINARY_PATH || resolveInstalledBinaryPath();

try {
  accessSync(binaryPath, constants.X_OK);
} catch {
  console.error(
    [
      "agent-ascii native binary is missing.",
      "This package expects an OS-specific optional dependency with a bundled binary.",
      "If you are running from a git checkout, build locally with `./scripts/test-local.sh` or set AGENT_ASCII_BINARY_PATH.",
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

function resolveInstalledBinaryPath() {
  try {
    const platformPackage = currentPlatformPackage();
    const packageJsonPath = require.resolve(
      `${platformPackage.packageName}/package.json`
    );

    return path.join(
      path.dirname(packageJsonPath),
      platformPackage.binaryRelativePath
    );
  } catch (error) {
    const fallbackPath = localFallbackBinaryPath(packageRoot);

    try {
      accessSync(fallbackPath, constants.X_OK);
      return fallbackPath;
    } catch {
      if (error instanceof Error) {
        console.error(error.message);
      }
      return fallbackPath;
    }
  }
}
