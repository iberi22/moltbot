import type { PluginAPI } from "openclaw/plugin-sdk";
import { DiscoveryEngine } from "./discovery-engine.js";
import { ImportEngine } from "./import-engine.js";
import { HistoryManager } from "./history-manager.js";
import { TokenRotator } from "./token-rotator.js";
import { TokenRefresher, type RefreshResult } from "./token-refresher.js";
import type { CliType, DiscoveredToken, PluginConfig } from "./types.js";

/**
 * Background service that manages token discovery and refresh
 * Runs as a registered gateway service
 */
export class DiscoveryService {
  private api: PluginAPI;
  private config: PluginConfig;
  private history: HistoryManager;
  private discovery: DiscoveryEngine;
  private importEngine: ImportEngine;
  private rotator?: TokenRotator;
  private refresher: TokenRefresher;
  private isRunning: boolean = false;

  constructor(api: PluginAPI, config: PluginConfig) {
    this.api = api;
    this.config = config;
    this.history = new HistoryManager();
    this.discovery = new DiscoveryEngine(config, this.history);
    this.importEngine = new ImportEngine(this.history, this.upsertAuthProfile.bind(this));
    this.refresher = new TokenRefresher(this.openUrl.bind(this));

    // Setup rotator if we have multiple tokens
    if (config.rotationStrategy) {
      const priorityMap = new Map<CliType, number>();
      for (const [cli, cliConfig] of Object.entries(config.cliSources)) {
        priorityMap.set(cli as CliType, cliConfig.priority);
      }
      this.rotator = new TokenRotator(this.history, config.rotationStrategy, priorityMap);
    }
  }

  /**
   * Start the discovery service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.api.logger?.info("[cli-token-discovery] Service starting...");

    // Run initial scan if configured
    if (this.config.scanOnStartup) {
      await this.runDiscovery();
    }

    this.api.logger?.info("[cli-token-discovery] Service started");
  }

  /**
   * Stop the discovery service
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.api.logger?.info("[cli-token-discovery] Service stopped");
  }

  /**
   * Run a discovery scan
   */
  async runDiscovery(): Promise<{
    found: number;
    imported: number;
    errors: string[];
  }> {
    this.api.logger?.info("[cli-token-discovery] Running discovery scan...");

    const result = await this.discovery.scan();
    
    this.api.logger?.info(
      `[cli-token-discovery] Scan complete: ${result.found}/${result.scanned} tokens found`
    );

    // Log errors
    for (const error of result.errors) {
      this.api.logger?.warn(`[cli-token-discovery] ${error}`);
    }

    let imported = 0;

    // Auto-import if configured
    if (this.config.autoImport && result.tokens.length > 0) {
      // Validate tokens if configured
      let tokensToImport = result.tokens;
      
      if (this.config.validateTokens) {
        this.api.logger?.info("[cli-token-discovery] Validating tokens...");
        
        const validationResults = await Promise.all(
          tokensToImport.map(async (t) => ({
            token: t,
            valid: await this.discovery.validateToken(t),
          }))
        );
        
        tokensToImport = validationResults.filter((r) => r.valid).map((r) => r.token);
        
        this.api.logger?.info(
          `[cli-token-discovery] ${tokensToImport.length}/${result.tokens.length} tokens valid`
        );
      }

      // Import tokens
      const importResult = await this.importEngine.importTokens(tokensToImport);
      imported = importResult.imported;

      this.api.logger?.info(
        `[cli-token-discovery] Import complete: ${importResult.imported} imported, ` +
        `${importResult.skipped} skipped, ${importResult.failed} failed`
      );
    }

    return {
      found: result.found,
      imported,
      errors: result.errors,
    };
  }

  /**
   * Refresh a token
   */
  async refreshToken(
    cli: CliType,
    tokenHash: string,
    method?: string
  ): Promise<{
    success: boolean;
    error?: string;
    needsManualInput?: boolean;
  }> {
    this.api.logger?.info(`[cli-token-discovery] Refreshing token for ${cli}...`);

    // Get the current token entry
    const entry = this.history.getEntry(tokenHash);
    if (!entry) {
      return { success: false, error: "Token not found in history" };
    }

    // Determine the best refresh method
    const refreshMethod = method as Parameters<TokenRefresher["refresh"]>[0]["method"] 
      || this.refresher.getRefreshMethod(cli, entry.tokenType);

    // Start the refresh process
    const result: RefreshResult = await this.refresher.refresh({
      cli,
      method: refreshMethod,
      openUrl: this.openUrl.bind(this),
      onProgress: (msg) => {
        this.api.logger?.info(`[cli-token-discovery] ${msg}`);
      },
    });

    if (result.success && result.token) {
      // Import the new token
      const importResult = await this.importEngine.importToken(result.token);
      
      if (importResult.success) {
        // Mark old token as revoked
        await this.history.updateStatus(tokenHash, "revoked");
        return { success: true };
      }
      
      return { 
        success: false, 
        error: importResult.error || "Failed to import refreshed token" 
      };
    }

    // Special handling for API key web method - needs manual input
    if (refreshMethod === "api-key-web") {
      return {
        success: false,
        error: result.error,
        needsManualInput: true,
      };
    }

    return {
      success: false,
      error: result.error || "Refresh failed",
    };
  }

  /**
   * Import a manually entered token
   */
  async importManualToken(cli: CliType, token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    this.api.logger?.info(`[cli-token-discovery] Importing manual token for ${cli}...`);

    // Get scanner for this CLI
    const { getScanner } = await import("./scanners/index.js");
    const scanner = getScanner(cli);

    if (!scanner) {
      return { success: false, error: `Unknown CLI: ${cli}` };
    }

    // Validate the token
    const isValid = await scanner.validate(token);
    if (!isValid) {
      return { success: false, error: "Token validation failed" };
    }

    // Create discovered token
    const discovered: DiscoveredToken = {
      cli,
      provider: scanner.provider,
      profileId: `${scanner.provider}:default`,
      tokenType: scanner.tokenType,
      token,
      tokenHash: await import("./utils.js").then(m => m.hashToken(token)),
      detectedAt: new Date().toISOString(),
      usageCount: 0,
      status: "active",
    };

    // Add to history
    await this.history.addOrUpdate(discovered);

    // Import
    const result = await this.importEngine.importToken(discovered);
    return result;
  }

  /**
   * Get a token for rotation
   */
  getTokenForRotation(): { token: string; provider: string; profileId: string } | undefined {
    if (!this.rotator) return undefined;

    const entry = this.rotator.getNextToken();
    if (!entry) return undefined;

    // Note: In a real implementation, we'd need to store the actual token
    // This is a simplified version - the actual token would be retrieved
    // from the auth store
    return {
      token: "[RETRIEVED_FROM_AUTH_STORE]",
      provider: entry.provider,
      profileId: entry.profileId,
    };
  }

  /**
   * Record token usage
   */
  async recordTokenUsage(tokenHash: string): Promise<void> {
    await this.history.recordUsage(tokenHash);
    if (this.rotator) {
      await this.rotator.recordUsage(tokenHash);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    const stats = this.discovery.getStats();
    const rotatorStats = this.rotator?.getStats();

    return {
      ...stats,
      rotation: rotatorStats,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get discovery history
   */
  getHistory() {
    return this.history.getHistory();
  }

  /**
   * Clear history
   */
  async clearHistory(): Promise<void> {
    await this.history.clear();
  }

  /**
   * Open URL using the system browser or gateway's opener
   */
  private async openUrl(url: string): Promise<void> {
    // Try to use the gateway's URL opener if available
    if (this.api.runtime?.openUrl) {
      await this.api.runtime.openUrl(url);
      return;
    }

    // Fallback to system opener
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
   * Upsert auth profile using OpenClaw's API
   */
  private upsertAuthProfile(profile: {
    profileId: string;
    credential: {
      type: string;
      provider: string;
      [key: string]: unknown;
    };
  }): void {
    // Try to use the runtime API
    if (this.api.runtime?.upsertAuthProfile) {
      this.api.runtime.upsertAuthProfile(profile);
      return;
    }

    // Fallback: try to use internal method
    this.api.logger?.info(
      `[cli-token-discovery] Would upsert profile: ${profile.profileId}`
    );
  }
}
