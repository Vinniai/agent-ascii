import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const rootPackage = await readJson("package.json");
const rootVersion = rootPackage.version;
const requiredFiles = [
  "AGENTS.md",
  "action.yml",
  ".agents/skills/agent-ascii/SKILL.md",
  "skills/agent-ascii/SKILL.md",
  "scripts/install-binary.mjs",
  "scripts/install-skill.sh",
  "scripts/ci-smoke.sh"
];

for (const requiredFile of requiredFiles) {
  await readText(requiredFile);
}

console.log(`Validated release metadata for ${rootPackage.name}@${rootVersion}`);

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

async function readText(relativePath) {
  const filePath = path.join(packageRoot, relativePath);
  return await readFile(filePath, "utf8");
}
