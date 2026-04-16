/**
 * Postinstall script: downloads the agent-ascii binary from GitHub releases
 * for the current platform and places it in vendor/
 */
import { existsSync, mkdirSync, chmodSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import https from "node:https";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

// Skip download in development / when binary already provided
if (process.env.AGENT_ASCII_BINARY_PATH || process.env.AGENT_ASCII_SKIP_DOWNLOAD) {
  process.exit(0);
}

const pkg = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
const version = pkg.version;

const PLATFORM_MAP = {
  "darwin/arm64": { goOs: "darwin",  goArch: "arm64", ext: "tar.gz", binaryName: "agent-ascii" },
  "darwin/x64":   { goOs: "darwin",  goArch: "amd64", ext: "tar.gz", binaryName: "agent-ascii" },
  "linux/arm64":  { goOs: "linux",   goArch: "arm64", ext: "tar.gz", binaryName: "agent-ascii" },
  "linux/x64":    { goOs: "linux",   goArch: "amd64", ext: "tar.gz", binaryName: "agent-ascii" },
  "win32/x64":    { goOs: "windows", goArch: "amd64", ext: "zip",    binaryName: "agent-ascii.exe" },
};

const platformKey = `${process.platform}/${process.arch}`;
const platformInfo = PLATFORM_MAP[platformKey];

if (!platformInfo) {
  console.warn(`agent-ascii: unsupported platform ${platformKey}, skipping binary download.`);
  console.warn("Set AGENT_ASCII_BINARY_PATH to point to a pre-built binary.");
  process.exit(0);
}

const { goOs, goArch, ext, binaryName } = platformInfo;
const assetName = `agent-ascii_${version}_${goOs}_${goArch}.${ext}`;
const downloadUrl = `https://github.com/Vinniai/agent-ascii/releases/download/v${version}/${assetName}`;

const vendorDir = path.join(packageRoot, "vendor");
const binaryDest = path.join(vendorDir, binaryName);

if (existsSync(binaryDest)) {
  process.exit(0);
}

mkdirSync(vendorDir, { recursive: true });

console.log(`agent-ascii: downloading ${assetName}...`);

const archivePath = path.join(vendorDir, assetName);

// Download with redirect support
async function download(url, dest) {
  return new Promise((resolve, reject) => {
    function get(url) {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
        }
        const out = fs.createWriteStream(dest);
        res.pipe(out);
        out.on("finish", resolve);
        out.on("error", reject);
      }).on("error", reject);
    }
    get(url);
  });
}

try {
  await download(downloadUrl, archivePath);

  if (ext === "tar.gz") {
    execSync(`tar -xzf "${archivePath}" -C "${vendorDir}" "${binaryName}"`, { stdio: "inherit" });
  } else {
    // Windows: use PowerShell
    execSync(
      `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${vendorDir}' -Force"`,
      { stdio: "inherit" }
    );
  }

  fs.unlinkSync(archivePath);

  if (process.platform !== "win32") {
    chmodSync(binaryDest, 0o755);
  }

  console.log(`agent-ascii: binary ready at ${binaryDest}`);
} catch (err) {
  console.error(`agent-ascii: failed to install binary: ${err.message}`);
  console.error(`Download URL: ${downloadUrl}`);
  console.error("Set AGENT_ASCII_BINARY_PATH to use a local binary, or AGENT_ASCII_SKIP_DOWNLOAD to skip.");
  // Non-fatal: allow package install to succeed so user can still set AGENT_ASCII_BINARY_PATH
  process.exit(0);
}
