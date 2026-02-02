import { BaseScanner } from "./base.js";
import type { CliType, ScanResult } from "../types.js";

/**
 * Scanner for qwen-cli authentication
 * Looks for OAuth credentials in ~/.qwen/oauth_creds.json
 */
export class QwenCliScanner extends BaseScanner {
  readonly cliType: CliType = "qwen-cli";
  readonly provider = "qwen-portal";
  readonly tokenType = "oauth" as const;

  private readonly configPath = this.getHomePath(".qwen", "oauth_creds.json");

  async scan(): Promise<ScanResult> {
    const creds = this.readJson<{ accessToken?: string; refreshToken?: string; expiresAt?: number }>(
      this.configPath
    );

    if (!creds?.accessToken) {
      return this.fail("No qwen-cli OAuth credentials found");
    }

    // Check if token is expired
    if (creds.expiresAt && creds.expiresAt < Date.now()) {
      return this.fail("qwen-cli OAuth token is expired");
    }

    return this.success(
      this.createToken(creds.accessToken, {
        source: this.configPath,
        refreshToken: creds.refreshToken ? "[REDACTED]" : undefined,
        expiresAt: creds.expiresAt,
      })
    );
  }

  async validate(token: string): Promise<boolean> {
    try {
      // Qwen API validation endpoint
      const response = await fetch("https://chat.qwen.ai/api/user/info", {
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
