import { describe, it, expect } from "vitest";
import { getStartupScript } from "./provisioning.js";

describe("getStartupScript", () => {
  it("should generate a script with default options", () => {
    const script = getStartupScript();
    expect(script).toContain("#!/bin/bash");
    // Using a very specific unique string that definitely exists
    expect(script).toContain("docker-buildx-plugin");
    expect(script).toContain("setup_22.x");
    expect(script).toContain("https://github.com/mariozechner/clawdbot.git");
    expect(script).toContain("pm2 start moltbot.mjs");
  });

  it("should support custom repo url and branch", () => {
    const script = getStartupScript({
      repoUrl: "https://github.com/test/repo.git",
      branch: "feature/test",
    });
    expect(script).toContain('git clone -b "feature/test" "https://github.com/test/repo.git"');
    expect(script).toContain('git pull origin "feature/test"');
  });

  it("should inject environment variables", () => {
    const script = getStartupScript({
      env: {
        MY_VAR: "my-value",
        ANOTHER_VAR: "123",
      },
    });
    expect(script).toContain('MY_VAR="my-value"');
    expect(script).toContain('ANOTHER_VAR="123"');
    expect(script).toContain("PORT=18789");
  });
});
