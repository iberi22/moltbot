import { BaseScanner } from "./base.js";
import type { CliType, ScanResult } from "../types.js";

/**
 * Scanner for kimi-cli authentication
 * Looks for API key in ~/.kimi/credentials/kimi-code.json
 */
export class KimiCliScanner extends BaseScanner {
  readonly cliType: CliType = "kimi-cli";
  readonly provider = "kimi-code";
  readonly tokenType = "api_key" as const;

  private readonly configPaths = [
    this.getHomePath(".kimi", "credentials", "kimi-code.json"),
    this.getHomePath(".kimi", "config.toml"),
  ];

  async scan(): Promise<ScanResult> {
    // Try credentials file first (preferred)
    const credsPath = this.configPaths[0];
    const creds = this.readJson<{ apiKey?: string }>(credsPath);
    
    if (creds?.apiKey) {
      return this.success(this.createToken(creds.apiKey, { source: credsPath }));
    }

    // Fallback: check environment variable
    const envKey = process.env.KIMI_API_KEY;
    if (envKey) {
      return this.success(this.createToken(envKey, { source: "env:KIMI_API_KEY" }));
    }

    return this.fail("No kimi-cli credentials found");
  }

  async validate(token: string): Promise<boolean> {
    try {
      // Lightweight validation: make a simple API call
      const response = await fetch("https://api.kimi.com/coding/v1/models", {
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
