
import { loadWorkspaceSkillEntries } from "../src/agents/skills/workspace";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../src/agents/agent-scope";
import { loadConfig } from "../src/config/config";
import path from "path";
import process from "process";
import { shouldIncludeSkill } from "../src/agents/skills/config";

async function main() {
    console.log("Debugging Skills Loading...");
    const cwd = process.cwd();
    console.log(`CWD: ${cwd}`);

    try {
        const cfg = loadConfig();
        const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
        console.log(`Workspace Dir: ${workspaceDir}`);

        const skillsDir = path.join(workspaceDir, "skills");
        console.log(`Skills Dir expected at: ${skillsDir}`);

        try {
             const stat = await import("fs").then(fs => fs.promises.stat(skillsDir));
             console.log(`Skills dir exists: ${stat.isDirectory()}`);
        } catch(e) {
             console.log(`Skills dir does not exist or not accessible: ${e.message}`);
        }

        const entries = loadWorkspaceSkillEntries(workspaceDir, { config: cfg });
        console.log(`Found ${entries.length} skills.`);

        const automationSkill = entries.find(e => e.skill.name === "desktop-automation");

        if (automationSkill) {
            console.log("FOUND desktop-automation skill!");
            console.log("Metadata:", JSON.stringify(automationSkill.metadata, null, 2));

            const isIncluded = shouldIncludeSkill({ entry: automationSkill, config: cfg });
            console.log(`shouldIncludeSkill result: ${isIncluded}`);

            // Check binaries manually mimics
            const requiredBins = automationSkill.metadata?.requires?.bins || [];
            console.log(`Required bins: ${requiredBins.join(", ")}`);

        } else {
            console.log("desktop-automation skill NOT FOUND in entries.");
            console.log("Listing all found skills:");
            entries.forEach(e => console.log(`- ${e.skill.name} (Source: ${e.skill.source})`));
        }

    } catch (error) {
        console.error("Error during debug:", error);
    }
}

main();
