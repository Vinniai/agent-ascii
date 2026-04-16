import process from "node:process";

const PLATFORM_MAP = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows"
};

const ARCH_MAP = {
  x64: "amd64",
  arm64: "arm64"
};

export function resolveReleaseTarget() {
  const os = PLATFORM_MAP[process.platform];
  const arch = ARCH_MAP[process.arch];

  if (!os || !arch) {
    throw new Error(
      `Unsupported platform for agent-ascii: ${process.platform}/${process.arch}`
    );
  }

  return { os, arch };
}

export function binaryFileName() {
  return process.platform === "win32" ? "agent-ascii.exe" : "agent-ascii";
}

export function releaseAssetName(version) {
  const { os, arch } = resolveReleaseTarget();
  const extension = process.platform === "win32" ? "zip" : "tar.gz";
  return `agent-ascii_${version}_${os}_${arch}.${extension}`;
}
