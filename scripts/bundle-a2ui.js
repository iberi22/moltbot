import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const HASH_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/.bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor/a2ui/renderers/lit");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps/shared/OpenClawKit/Tools/CanvasA2UI");

async function checkSources() {
  try {
    await fs.access(A2UI_RENDERER_DIR);
    await fs.access(A2UI_APP_DIR);
    return true;
  } catch {
    return false;
  }
}

const inputPaths = [
  path.join(ROOT_DIR, "package.json"),
  path.join(ROOT_DIR, "pnpm-lock.yaml"),
  A2UI_RENDERER_DIR,
  A2UI_APP_DIR,
];

async function walk(entryPath, files = []) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry), files);
    }
    return files;
  }
  files.push(entryPath);
  return files;
}

async function computeHash() {
  const allFiles = [];
  for (const input of inputPaths) {
    await walk(input, allFiles);
  }

  function normalize(p) {
    return p.split(path.sep).join("/");
  }

  allFiles.sort((a, b) => normalize(a).localeCompare(normalize(b)));

  const hash = createHash("sha256");
  for (const filePath of allFiles) {
    const rel = normalize(path.relative(ROOT_DIR, filePath));
    hash.update(rel);
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }

  return hash.digest("hex");
}

async function run() {
  if (!(await checkSources())) {
    console.log("A2UI sources missing; keeping prebuilt bundle.");
    process.exit(0);
  }

  const currentHash = await computeHash();
  try {
    const previousHash = await fs.readFile(HASH_FILE, "utf8");
    if (previousHash.trim() === currentHash && (await fs.access(OUTPUT_FILE).then(() => true).catch(() => false))) {
      console.log("A2UI bundle up to date; skipping.");
      process.exit(0);
    }
  } catch {
    // Hash file missing or other error, proceed to bundle
  }

  console.log("Bundling A2UI...");

  const isWindows = process.platform === "win32";
  const pnpm = isWindows ? "pnpm.cmd" : "pnpm";
  const rolldown = isWindows ? "rolldown.cmd" : "rolldown";

  const tscResult = spawnSync(pnpm, ["-s", "exec", "tsc", "-p", path.join(A2UI_RENDERER_DIR, "tsconfig.json")], { stdio: "inherit", shell: true });
  if (tscResult.status !== 0) {
    console.error("A2UI bundling failed at TSC step.");
    process.exit(1);
  }

  const rollResult = spawnSync(rolldown, ["-c", path.join(A2UI_APP_DIR, "rolldown.config.mjs")], { stdio: "inherit", shell: true });
  if (rollResult.status !== 0) {
    console.error("A2UI bundling failed at Rolldown step.");
    process.exit(1);
  }

  await fs.writeFile(HASH_FILE, currentHash);
  console.log("A2UI bundling completed.");
}

run().catch(err => {
  console.error("A2UI bundling failed:", err);
  process.exit(1);
});
