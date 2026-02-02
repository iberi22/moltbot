import { BaseScanner } from "./base.js";
import type { CliType, ScanResult } from "../types.js";

/**
 * Scanner for codex-cli authentication
 * Looks for API key in ~/.codex/auth.json or ~/.codex/config.json
 */
export class CodexCliScanner extends BaseScanner {
  readonly cliType: CliType = "codex-cli";
  readonly provider = "openai";
  readonly tokenType = "api_key" as const;

  private readonly configPaths = [
    this.getHomePath(".codex", "auth.json"),
    this.getHomePath(".codex", "config.json"),
  ];

  async scan(): Promise<ScanResult> {
    // Try auth.json first
    for (const configPath of this.configPaths) {
      const config = this.readJson<{ apiKey?: string; openaiApiKey?: string }>(configPath);
      
      const apiKey = config?.apiKey || config?.openaiApiKey;
      if (apiKey) {
        return this.success(this.createToken(apiKey, { source: configPath }));
      }
    }

    // Fallback: check environment variable
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      return this.success(this.createToken(envKey, { source: "env:OPENAI_API_KEY" }));
    }

    return this.fail("No codex-cli credentials found");
  }

  async validate(token: string): Promise<boolean> {
    try {
      // Lightweight validation: list models
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
