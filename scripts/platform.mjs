import path from "node:path";
import process from "node:process";

export const PLATFORM_PACKAGES = [
  {
    packageName: "@agent-ascii/darwin-arm64",
    workspaceDir: "packages/npm/darwin-arm64",
    nodeOs: "darwin",
    nodeArch: "arm64",
    goOs: "darwin",
    goArch: "arm64",
    binaryName: "agent-ascii",
    binaryRelativePath: "bin/agent-ascii"
  },
  {
    packageName: "@agent-ascii/darwin-x64",
    workspaceDir: "packages/npm/darwin-x64",
    nodeOs: "darwin",
    nodeArch: "x64",
    goOs: "darwin",
    goArch: "amd64",
    binaryName: "agent-ascii",
    binaryRelativePath: "bin/agent-ascii"
  },
  {
    packageName: "@agent-ascii/linux-arm64",
    workspaceDir: "packages/npm/linux-arm64",
    nodeOs: "linux",
    nodeArch: "arm64",
    goOs: "linux",
    goArch: "arm64",
    binaryName: "agent-ascii",
    binaryRelativePath: "bin/agent-ascii"
  },
  {
    packageName: "@agent-ascii/linux-x64",
    workspaceDir: "packages/npm/linux-x64",
    nodeOs: "linux",
    nodeArch: "x64",
    goOs: "linux",
    goArch: "amd64",
    binaryName: "agent-ascii",
    binaryRelativePath: "bin/agent-ascii"
  },
  {
    packageName: "@agent-ascii/win32-x64",
    workspaceDir: "packages/npm/win32-x64",
    nodeOs: "win32",
    nodeArch: "x64",
    goOs: "windows",
    goArch: "amd64",
    binaryName: "agent-ascii.exe",
    binaryRelativePath: "bin/agent-ascii.exe"
  }
];

export function currentPlatformPackage() {
  const platformPackage = PLATFORM_PACKAGES.find(
    ({ nodeOs, nodeArch }) =>
      nodeOs === process.platform && nodeArch === process.arch
  );

  if (!platformPackage) {
    throw new Error(
      `Unsupported platform for agent-ascii: ${process.platform}/${process.arch}`
    );
  }

  return platformPackage;
}

export function localFallbackBinaryPath(packageRoot) {
  const binaryName = process.platform === "win32" ? "agent-ascii.exe" : "agent-ascii";
  return path.join(packageRoot, "vendor", binaryName);
}

export function releaseAssetName(version) {
  const { goOs, goArch } = currentPlatformPackage();
  const extension = process.platform === "win32" ? "zip" : "tar.gz";
  return `agent-ascii_${version}_${goOs}_${goArch}.${extension}`;
}
