import { BaseScanner } from "./base.js";
import type { CliType, ScanResult } from "../types.js";

/**
 * Scanner for gemini-cli authentication
 * Looks for OAuth credentials in ~/.gemini/oauth_creds.json
 */
export class GeminiCliScanner extends BaseScanner {
  readonly cliType: CliType = "gemini-cli";
  readonly provider = "google-gemini-cli";
  readonly tokenType = "oauth" as const;

  private readonly configPath = this.getHomePath(".gemini", "oauth_creds.json");

  async scan(): Promise<ScanResult> {
    const creds = this.readJson<{
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      email?: string;
    }>(this.configPath);

    if (!creds?.access_token) {
      return this.fail("No gemini-cli OAuth credentials found");
    }

    // Check if token is expired (with 5-minute buffer)
    if (creds.expires_at && creds.expires_at < Date.now() + 5 * 60 * 1000) {
      return this.fail("gemini-cli OAuth token is expired or about to expire");
    }

    return this.success(
      this.createToken(creds.access_token, {
        source: this.configPath,
        refreshToken: creds.refresh_token ? "[REDACTED]" : undefined,
        expiresAt: creds.expires_at,
        email: creds.email,
      })
    );
  }

  async validate(token: string): Promise<boolean> {
    try {
      // Use Google UserInfo endpoint for validation
      const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
