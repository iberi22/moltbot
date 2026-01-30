import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadWorkspaceSkillEntries } from "../skills.js";

describe("New Skills Loading", () => {
  it("loads context-manager and admin-assistant skills from the bundled directory", () => {
    // Resolve the actual skills directory in the repo
    const bundledSkillsDir = path.resolve(process.cwd(), "skills");

    // We don't need a real workspace or managed dir for this test,
    // just the bundled dir where we added our skills.
    const entries = loadWorkspaceSkillEntries("/tmp/dummy-workspace", {
      managedSkillsDir: "/tmp/dummy-managed",
      bundledSkillsDir: bundledSkillsDir,
    });

    const skillNames = entries.map((entry) => entry.skill.name);

    expect(skillNames).toContain("context-manager");
    expect(skillNames).toContain("admin-assistant");

    const contextManager = entries.find(e => e.skill.name === "context-manager");
    expect(contextManager?.skill.description).toContain("Manage separate chat contexts");

    const adminAssistant = entries.find(e => e.skill.name === "admin-assistant");
    expect(adminAssistant?.skill.description).toContain("specialized agent for administrative tasks");
  });
});
