import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadWorkspaceSkillEntries } from "../skills.js";

describe("Integrated Skills Loading", () => {
  it("loads all new integrated skills from the bundled directory", () => {
    const bundledSkillsDir = path.resolve(process.cwd(), "skills");

    const entries = loadWorkspaceSkillEntries("/tmp/dummy-workspace", {
      managedSkillsDir: "/tmp/dummy-managed",
      bundledSkillsDir: bundledSkillsDir,
    });

    const skillNames = entries.map((entry) => entry.skill.name);

    // Verify previously added skills
    expect(skillNames).toContain("context-manager");
    expect(skillNames).toContain("admin-assistant");

    // Verify newly added skills from PR #2 and #4
    expect(skillNames).toContain("jules");
    expect(skillNames).toContain("copilot");
    expect(skillNames).toContain("git");
    expect(skillNames).toContain("supabase");
    expect(skillNames).toContain("vercel");
    expect(skillNames).toContain("cloudflare");

    // Verify basic properties of a few key skills
    const jules = entries.find((e) => e.skill.name === "jules");
    expect(jules).toBeDefined();

    const cloudflare = entries.find((e) => e.skill.name === "cloudflare");
    expect(cloudflare).toBeDefined();

    const supabase = entries.find((e) => e.skill.name === "supabase");
    expect(supabase).toBeDefined();
  });
});
