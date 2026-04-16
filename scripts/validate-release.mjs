import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PLATFORM_PACKAGES } from "./platform.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const rootPackage = await readJson("package.json");
const rootVersion = rootPackage.version;

for (const platformPackage of PLATFORM_PACKAGES) {
  const workspacePackage = await readJson(
    path.join(platformPackage.workspaceDir, "package.json")
  );

  if (workspacePackage.version !== rootVersion) {
    throw new Error(
      `${workspacePackage.name} has version ${workspacePackage.version}; expected ${rootVersion}`
    );
  }

  const expectedOptionalVersion =
    rootPackage.optionalDependencies?.[workspacePackage.name];
  if (expectedOptionalVersion !== rootVersion) {
    throw new Error(
      `optionalDependencies entry for ${workspacePackage.name} is ${expectedOptionalVersion}; expected ${rootVersion}`
    );
  }
}

console.log(`Validated release metadata for ${rootPackage.name}@${rootVersion}`);

async function readJson(relativePath) {
  const filePath = path.join(packageRoot, relativePath);
  return JSON.parse(await readFile(filePath, "utf8"));
}
