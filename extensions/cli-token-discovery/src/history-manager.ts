import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { TokenHistory, TokenHistoryEntry, DiscoveredToken } from "./types.js";

const HISTORY_VERSION = 1;
const HISTORY_FILE_NAME = "cli-token-history.json";

/**
 * Manages the token discovery history
 */
export class HistoryManager {
  private filePath: string;
  private history: TokenHistory;

  constructor(filePath?: string) {
    this.filePath = filePath || this.getDefaultPath();
    this.history = this.load();
  }

  private getDefaultPath(): string {
    return join(homedir(), ".openclaw", HISTORY_FILE_NAME);
  }

  private load(): TokenHistory {
    try {
      if (!existsSync(this.filePath)) {
        return { version: HISTORY_VERSION, discovered: [] };
      }
      const content = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(content) as TokenHistory;
      
      // Migrate if needed
      if (parsed.version !== HISTORY_VERSION) {
        return this.migrate(parsed);
      }
      
      return parsed;
    } catch {
      return { version: HISTORY_VERSION, discovered: [] };
    }
  }

  private migrate(old: unknown): TokenHistory {
    // Simple migration: reset to empty history
    // In production, this would handle version upgrades
    return { version: HISTORY_VERSION, discovered: [] };
  }

  private async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.history, null, 2), { mode: 0o600 });
  }

  /**
   * Get the current history
   */
  getHistory(): TokenHistory {
    return { ...this.history };
  }

  /**
   * Check if a token is already in history
   */
  hasToken(tokenHash: string): boolean {
    return this.history.discovered.some((e) => e.tokenHash === tokenHash);
  }

  /**
   * Get a specific token entry by hash
   */
  getEntry(tokenHash: string): TokenHistoryEntry | undefined {
    return this.history.discovered.find((e) => e.tokenHash === tokenHash);
  }

  /**
   * Add or update a token in history
   */
  async addOrUpdate(token: DiscoveredToken): Promise<void> {
    const existingIndex = this.history.discovered.findIndex(
      (e) => e.tokenHash === token.tokenHash
    );

    const entry: TokenHistoryEntry = {
      cli: token.cli,
      provider: token.provider,
      profileId: token.profileId,
      tokenType: token.tokenType,
      tokenHash: token.tokenHash,
      detectedAt: token.detectedAt,
      lastUsedAt: token.lastUsedAt,
      usageCount: token.usageCount,
      status: token.status,
      consecutiveFailures: 0,
    };

    if (existingIndex >= 0) {
      // Preserve usage stats from existing entry
      const existing = this.history.discovered[existingIndex];
      entry.usageCount = existing.usageCount;
      entry.lastUsedAt = existing.lastUsedAt;
      entry.consecutiveFailures = existing.consecutiveFailures;
      this.history.discovered[existingIndex] = entry;
    } else {
      this.history.discovered.push(entry);
    }

    await this.save();
  }

  /**
   * Record a token usage
   */
  async recordUsage(tokenHash: string): Promise<void> {
    const entry = this.history.discovered.find((e) => e.tokenHash === tokenHash);
    if (entry) {
      entry.usageCount++;
      entry.lastUsedAt = new Date().toISOString();
      await this.save();
    }
  }

  /**
   * Record a token failure
   */
  async recordFailure(tokenHash: string, error: string): Promise<void> {
    const entry = this.history.discovered.find((e) => e.tokenHash === tokenHash);
    if (entry) {
      entry.consecutiveFailures++;
      entry.lastError = error;
      if (entry.consecutiveFailures >= 3) {
        entry.status = "invalid";
      }
      await this.save();
    }
  }

  /**
   * Update token status
   */
  async updateStatus(tokenHash: string, status: TokenHistoryEntry["status"]): Promise<void> {
    const entry = this.history.discovered.find((e) => e.tokenHash === tokenHash);
    if (entry) {
      entry.status = status;
      if (status === "active") {
        entry.consecutiveFailures = 0;
        entry.lastError = undefined;
      }
      await this.save();
    }
  }

  /**
   * Mark scan as completed
   */
  async markScanComplete(): Promise<void> {
    this.history.lastScanAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Clear all history
   */
  async clear(): Promise<void> {
    this.history = { version: HISTORY_VERSION, discovered: [] };
    await this.save();
  }

  /**
   * Get tokens suitable for rotation (active status)
   */
  getActiveTokens(): TokenHistoryEntry[] {
    return this.history.discovered.filter((e) => e.status === "active");
  }

  /**
   * Get next token based on rotation strategy
   */
  getNextTokenForRotation(strategy: "least-used" | "priority" = "least-used"): TokenHistoryEntry | undefined {
    const active = this.getActiveTokens();
    if (active.length === 0) return undefined;

    if (strategy === "least-used") {
      return active.reduce((min, curr) => 
        curr.usageCount < min.usageCount ? curr : min
      );
    }

    // Default: return first active
    return active[0];
  }
}
