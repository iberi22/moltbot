/**
 * Token Refresher - Handles re-authentication flows for each CLI
 * 
 * This module provides:
 * 1. Detection of expired/invalid tokens
 * 2. Browser-based re-authentication flows
 * 3. Automatic token refresh where supported
 * 4. UI integration for manual refresh triggers
 */

import { spawn } from "node:child_process";
import { readFileSync, existsSync, watch } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { sleep } from "./utils.js";
import type { CliType, DiscoveredToken, TokenType } from "./types.js";

export type RefreshMethod = "oauth-browser" | "api-key-web" | "cli-command" | "manual";

export interface RefreshOptions {
  cli: CliType;
  method: RefreshMethod;
  openUrl?: (url: string) => Promise<void>;
  onProgress?: (message: string) => void;
}

export interface RefreshResult {
  success: boolean;
  token?: DiscoveredToken;
  error?: string;
  method: RefreshMethod;
}

/**
 * Platform URLs for generating new API keys
 */
const API_KEY_URLS: Record<string, string> = {
  "kimi-code": "https://platform.moonshot.cn/console/api-keys",
  "openai": "https://platform.openai.com/api-keys",
  "qwen-portal": "https://bailian.console.aliyun.com/?apiKey=1#/api-key",
  "google-gemini-cli": "https://aistudio.google.com/app/apikey",
};

/**
 * OAuth login URLs for each CLI
 */
const OAUTH_LOGIN_URLS: Record<string, string> = {
  "qwen-portal": "https://chat.qwenlm.ai/",
  "google-gemini-cli": "https://accounts.google.com/o/oauth2/auth",
};

/**
 * Token Refresher class - manages token refresh for all supported CLIs
 */
export class TokenRefresher {
  private openUrl: (url: string) => Promise<void>;

  constructor(openUrlFn?: (url: string) => Promise<void>) {
    // Default opener uses the system's default browser
    this.openUrl = openUrlFn || this.defaultOpenUrl;
  }

  /**
   * Check if a token can be refreshed automatically
   */
  canAutoRefresh(token: DiscoveredToken): boolean {
    // OAuth tokens with refresh tokens can be auto-refreshed
    if (token.tokenType === "oauth" && token.metadata?.refreshToken) {
      return true;
    }
    return false;
  }

  /**
   * Get the best refresh method for a CLI
   */
  getRefreshMethod(cli: CliType, tokenType: TokenType): RefreshMethod {
    switch (cli) {
      case "kimi-cli":
        return "api-key-web"; // Need to generate new API key from web
      case "codex-cli":
        return tokenType === "oauth" ? "cli-command" : "api-key-web";
      case "qwen-cli":
        return "oauth-browser"; // OAuth with auto-refresh
      case "gemini-cli":
        return "oauth-browser"; // Google OAuth
      default:
        return "manual";
    }
  }

  /**
   * Get the URL for refreshing a token
   */
  getRefreshUrl(cli: CliType, provider: string, tokenType: TokenType): string | undefined {
    if (tokenType === "api_key") {
      return API_KEY_URLS[provider];
    }
    return OAUTH_LOGIN_URLS[provider];
  }

  /**
   * Refresh a token using the appropriate method
   */
  async refresh(options: RefreshOptions): Promise<RefreshResult> {
    const { cli, method, onProgress } = options;

    onProgress?.(`Starting ${method} refresh for ${cli}...`);

    switch (method) {
      case "oauth-browser":
        return this.refreshOAuthBrowser(options);
      case "api-key-web":
        return this.refreshApiKeyWeb(options);
      case "cli-command":
        return this.refreshViaCli(options);
      case "manual":
        return { success: false, error: "Manual refresh required", method };
      default:
        return { success: false, error: `Unknown refresh method: ${method}`, method };
    }
  }

  /**
   * OAuth browser-based refresh
   * Opens the login page and waits for credential file updates
   */
  private async refreshOAuthBrowser(options: RefreshOptions): Promise<RefreshResult> {
    const { cli, onProgress } = options;

    // Get the appropriate URL
    const url = this.getOAuthUrl(cli);
    if (!url) {
      return { success: false, error: "No OAuth URL available", method: "oauth-browser" };
    }

    // Watch for credential file changes
    const credPath = this.getCredentialPath(cli);
    const watcher = this.watchCredentials(cli, credPath);

    try {
      // Open browser
      onProgress?.("Opening browser for authentication...");
      await this.openUrl(url);

      // Wait for credential update (up to 5 minutes)
      onProgress?.("Waiting for authentication to complete...");
      const newToken = await Promise.race([
        watcher,
        this.timeout(5 * 60 * 1000, "Authentication timeout"),
      ]);

      if (newToken) {
        return { success: true, token: newToken, method: "oauth-browser" };
      }

      return { success: false, error: "No new token detected", method: "oauth-browser" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        method: "oauth-browser",
      };
    }
  }

  /**
   * API Key web-based refresh
   * Opens the platform website to generate a new key
   */
  private async refreshApiKeyWeb(options: RefreshOptions): Promise<RefreshResult> {
    const { cli, onProgress } = options;
    const provider = this.getProviderForCli(cli);
    const url = API_KEY_URLS[provider];

    if (!url) {
      return { success: false, error: "No API key URL available", method: "api-key-web" };
    }

    onProgress?.(`Opening ${provider} platform to generate new API key...`);
    await this.openUrl(url);

    return {
      success: true,
      method: "api-key-web",
      error: "Please generate a new API key on the website and run 'openclaw token-discovery scan' to import it.",
    };
  }

  /**
   * CLI command-based refresh
   * Runs the CLI's native login command
   */
  private async refreshViaCli(options: RefreshOptions): Promise<RefreshResult> {
    const { cli, onProgress } = options;
    const command = this.getCliCommand(cli);

    if (!command) {
      return { success: false, error: "No CLI command available", method: "cli-command" };
    }

    onProgress?.(`Running ${cli} login command...`);

    return new Promise((resolve) => {
      const child = spawn(command.cmd, command.args, {
        stdio: "pipe",
        shell: true,
      });

      let output = "";
      let errorOutput = "";

      child.stdout?.on("data", (data) => {
        output += data.toString();
        onProgress?.(data.toString().trim());
      });

      child.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          // Re-scan for the new token
          this.rescanAfterCliLogin(cli).then((token) => {
            if (token) {
              resolve({ success: true, token, method: "cli-command" });
            } else {
              resolve({
                success: false,
                error: "Login succeeded but couldn't find new token. Please run 'openclaw token-discovery scan'.",
                method: "cli-command",
              });
            }
          });
        } else {
          resolve({
            success: false,
            error: `CLI command failed: ${errorOutput || output}`,
            method: "cli-command",
          });
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        child.kill();
        resolve({ success: false, error: "CLI command timeout", method: "cli-command" });
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Watch credential files for changes
   */
  private watchCredentials(cli: CliType, credPath: string): Promise<DiscoveredToken | null> {
    return new Promise((resolve) => {
      if (!existsSync(credPath)) {
        // If file doesn't exist, check periodically
        let attempts = 0;
        const interval = setInterval(() => {
          const token = this.readTokenFromPath(cli, credPath);
          if (token) {
            clearInterval(interval);
            resolve(token);
          }
          if (++attempts > 60) { // 1 minute of polling
            clearInterval(interval);
            resolve(null);
          }
        }, 1000);
        return;
      }

      // Watch existing file for changes
      const watcher = watch(credPath, (eventType) => {
        if (eventType === "change") {
          const token = this.readTokenFromPath(cli, credPath);
          if (token) {
            watcher.close();
            resolve(token);
          }
        }
      });

      // Timeout
      setTimeout(() => {
        watcher.close();
        resolve(null);
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Read token from credential file after CLI login
   */
  private readTokenFromPath(cli: CliType, path: string): DiscoveredToken | null {
    try {
      if (!existsSync(path)) return null;

      const content = readFileSync(path, "utf8");
      const data = JSON.parse(content);

      switch (cli) {
        case "kimi-cli":
          if (data.apiKey) {
            return this.createToken("kimi-cli", "kimi-code", "api_key", data.apiKey, { source: path });
          }
          break;
        case "codex-cli":
          if (data.accessToken || data.apiKey) {
            return this.createToken("codex-cli", "openai", data.accessToken ? "oauth" : "api_key", 
              data.accessToken || data.apiKey, { source: path });
          }
          break;
        case "qwen-cli":
          if (data.accessToken) {
            return this.createToken("qwen-cli", "qwen-portal", "oauth", data.accessToken, {
              source: path,
              refreshToken: data.refreshToken,
              expiresAt: data.expiresAt,
            });
          }
          break;
        case "gemini-cli":
          if (data.access_token) {
            return this.createToken("gemini-cli", "google-gemini-cli", "oauth", data.access_token, {
              source: path,
              refreshToken: data.refresh_token,
              expiresAt: data.expires_at,
              email: data.email,
            });
          }
          break;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }

  /**
   * Re-scan after CLI login completes
   */
  private async rescanAfterCliLogin(cli: CliType): Promise<DiscoveredToken | null> {
    // Wait a moment for file writes to complete
    await sleep(1000);

    const credPath = this.getCredentialPath(cli);
    return this.readTokenFromPath(cli, credPath);
  }

  /**
   * Create a DiscoveredToken object
   */
  private createToken(
    cli: CliType,
    provider: string,
    tokenType: TokenType,
    token: string,
    metadata?: Record<string, unknown>
  ): DiscoveredToken {
    const { hashToken } = await import("./utils.js");
    
    return {
      cli,
      provider,
      profileId: `${provider}:default`,
      tokenType,
      token,
      tokenHash: hashToken(token),
      detectedAt: new Date().toISOString(),
      usageCount: 0,
      status: "active",
      metadata,
    };
  }

  /**
   * Get OAuth URL for a CLI
   */
  private getOAuthUrl(cli: CliType): string | undefined {
    switch (cli) {
      case "qwen-cli":
        return "https://chat.qwenlm.ai/";
      case "gemini-cli":
        // Google's OAuth requires more complex setup
        return "https://accounts.google.com/o/oauth2/auth";
      case "codex-cli":
        return "https://chat.openai.com/";
      default:
        return undefined;
    }
  }

  /**
   * Get credential file path for a CLI
   */
  private getCredentialPath(cli: CliType): string {
    const home = homedir();
    switch (cli) {
      case "kimi-cli":
        return join(home, ".kimi", "credentials", "kimi-code.json");
      case "codex-cli":
        return join(home, ".codex", "auth.json");
      case "qwen-cli":
        return join(home, ".qwen", "oauth_creds.json");
      case "gemini-cli":
        return join(home, ".gemini", "oauth_creds.json");
      default:
        return "";
    }
  }

  /**
   * Get CLI login command
   */
  private getCliCommand(cli: CliType): { cmd: string; args: string[] } | null {
    switch (cli) {
      case "codex-cli":
        return { cmd: "codex", args: ["login"] };
      case "kimi-cli":
        return { cmd: "kimi", args: ["login"] };
      case "qwen-cli":
        return { cmd: "qwen-code", args: ["--auth"] };
      case "gemini-cli":
        return { cmd: "gemini", args: ["login"] };
      default:
        return null;
    }
  }

  /**
   * Get provider for a CLI
   */
  private getProviderForCli(cli: CliType): string {
    const map: Record<CliType, string> = {
      "kimi-cli": "kimi-code",
      "codex-cli": "openai",
      "qwen-cli": "qwen-portal",
      "gemini-cli": "google-gemini-cli",
    };
    return map[cli];
  }

  /**
   * Default URL opener using system browser
   */
  private async defaultOpenUrl(url: string): Promise<void> {
    const { exec } = await import("node:child_process");
    const platform = process.platform;

    const cmd = platform === "darwin" ? "open" :
                platform === "win32" ? "start" :
                "xdg-open";

    return new Promise((resolve, reject) => {
      exec(`${cmd} "${url}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Create a timeout promise
   */
  private timeout(ms: number, message: string): Promise<null> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }).then(() => null);
  }
}

/**
 * Factory function to create a refresher
 */
export function createTokenRefresher(openUrl?: (url: string) => Promise<void>): TokenRefresher {
  return new TokenRefresher(openUrl);
}
