import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync } from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

import extract from "extract-zip";
import tar from "tar";

import { binaryFileName, releaseAssetName } from "./platform.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(packageRoot, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const version = packageJson.version;
const binaryName = binaryFileName();
const vendorDir = path.join(packageRoot, "vendor");
const outputPath = path.join(vendorDir, binaryName);
const isGitCheckout = existsSync(path.join(packageRoot, ".git"));

async function main() {
  if (process.env.AGENT_ASCII_SKIP_INSTALL === "1") {
    return;
  }

  await mkdir(vendorDir, { recursive: true });

  if (existsSync(outputPath)) {
    return;
  }

  if (buildFromSource()) {
    return;
  }

  try {
    await downloadReleaseBinary();
  } catch (error) {
    if (isGitCheckout) {
      console.warn(
        `Skipping binary installation in git checkout: ${error.message}`
      );
      return;
    }

    throw error;
  }
}

function buildFromSource() {
  if (!existsSync(path.join(packageRoot, "go.mod"))) {
    return false;
  }

  const goVersion = spawnSync("go", ["version"], {
    cwd: packageRoot,
    stdio: "ignore"
  });

  if (goVersion.status !== 0) {
    return false;
  }

  const build = spawnSync(
    "go",
    [
      "build",
      "-ldflags",
      `-s -w -X github.com/Vinniai/agent-ascii/internal/version.Version=${version}`,
      "-o",
      outputPath,
      "."
    ],
    {
      cwd: packageRoot,
      stdio: "inherit"
    }
  );

  if (build.status !== 0) {
    throw new Error("failed to build agent-ascii from local source");
  }

  return true;
}

async function downloadReleaseBinary() {
  const baseUrl =
    process.env.AGENT_ASCII_RELEASE_BASE_URL ||
    "https://github.com/Vinniai/agent-ascii/releases/download";
  const assetName = releaseAssetName(version);
  const archiveUrl = `${baseUrl}/v${version}/${assetName}`;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-ascii-"));
  const archivePath = path.join(tempDir, assetName);

  try {
    const response = await fetch(archiveUrl);
    if (!response.ok || !response.body) {
      throw new Error(`download failed from ${archiveUrl} (${response.status})`);
    }

    await pipeline(response.body, createWriteStream(archivePath));

    if (archivePath.endsWith(".zip")) {
      await extract(archivePath, { dir: tempDir });
    } else {
      await tar.x({
        cwd: tempDir,
        file: archivePath
      });
    }

    const extractedBinary = await findBinary(tempDir);
    if (!extractedBinary) {
      throw new Error(`did not find ${binaryName} inside ${assetName}`);
    }

    await copyFile(extractedBinary, outputPath);
    if (process.platform !== "win32") {
      await chmod(outputPath, 0o755);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function findBinary(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === binaryName) {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const nested = await findBinary(entryPath);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

await main();
