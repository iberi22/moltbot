import type { OpenClawConfig } from "../config/config.js";

import { hasBinary } from "./skills/config.js";

export {
  hasBinary,
  isBundledSkillAllowed,
  isConfigPathTruthy,
  resolveBundledAllowlist,
  resolveConfigPath,
  resolveRuntimePlatform,
  resolveSkillConfig,
} from "./skills/config.js";
export {
  applySkillEnvOverrides,
  applySkillEnvOverridesFromSnapshot,
} from "./skills/env-overrides.js";
export type {
  OpenClawSkillMetadata,
  SkillEligibilityContext,
  SkillCommandSpec,
  SkillEntry,
  SkillInstallSpec,
  SkillSnapshot,
  SkillsInstallPreferences,
} from "./skills/types.js";
export {
  buildWorkspaceSkillSnapshot,
  buildWorkspaceSkillsPrompt,
  buildWorkspaceSkillCommandSpecs,
  filterWorkspaceSkillEntries,
  loadWorkspaceSkillEntries,
  resolveSkillsPromptForRun,
  syncSkillsToWorkspace,
} from "./skills/workspace.js";

export function resolveSkillsInstallPreferences(config?: OpenClawConfig) {
  const isWin = process.platform === "win32";
  const raw = config?.skills?.install;
  const preferBrew = raw?.preferBrew ?? (isWin ? false : true);
  const managerRaw = typeof raw?.nodeManager === "string" ? raw.nodeManager.trim() : "";
  const manager = managerRaw.toLowerCase();

  let nodeManager: "npm" | "pnpm" | "yarn" | "bun" = "npm";
  if (manager === "pnpm" || manager === "yarn" || manager === "bun" || manager === "npm") {
    nodeManager = manager as "npm" | "pnpm" | "yarn" | "bun";
  } else {
    // Auto-detect
    if (hasBinary("pnpm")) nodeManager = "pnpm";
    else if (hasBinary("yarn")) nodeManager = "yarn";
    else if (hasBinary("bun")) nodeManager = "bun";
  }

  return { preferBrew, nodeManager };
}
