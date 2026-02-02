import type { TokenHistoryEntry, RotationStrategy, CliType } from "./types.js";
import { HistoryManager } from "./history-manager.js";

/**
 * Manages token rotation for multi-agent distribution
 */
export class TokenRotator {
  private history: HistoryManager;
  private strategy: RotationStrategy;
  private cliPriorities: Map<CliType, number>;
  private lastUsedIndex: number = 0;

  constructor(
    history: HistoryManager,
    strategy: RotationStrategy = "round-robin",
    cliPriorities?: Map<CliType, number>
  ) {
    this.history = history;
    this.strategy = strategy;
    this.cliPriorities = cliPriorities || new Map();
  }

  /**
   * Get the next token based on rotation strategy
   */
  getNextToken(): TokenHistoryEntry | undefined {
    const active = this.history.getActiveTokens();
    if (active.length === 0) return undefined;

    switch (this.strategy) {
      case "round-robin":
        return this.roundRobin(active);
      case "least-used":
        return this.leastUsed(active);
      case "priority":
        return this.byPriority(active);
      case "health-based":
        return this.healthBased(active);
      default:
        return active[0];
    }
  }

  /**
   * Round-robin: cycle through tokens sequentially
   */
  private roundRobin(active: TokenHistoryEntry[]): TokenHistoryEntry {
    this.lastUsedIndex = (this.lastUsedIndex + 1) % active.length;
    return active[this.lastUsedIndex];
  }

  /**
   * Least-used: prefer tokens with lowest usage count
   */
  private leastUsed(active: TokenHistoryEntry[]): TokenHistoryEntry {
    return active.reduce((min, curr) =>
      curr.usageCount < min.usageCount ? curr : min
    );
  }

  /**
   * Priority: use highest priority token first
   */
  private byPriority(active: TokenHistoryEntry[]): TokenHistoryEntry {
    // Sort by priority (highest first), then by usage
    const sorted = [...active].sort((a, b) => {
      const priorityA = this.cliPriorities.get(a.cli) ?? 999;
      const priorityB = this.cliPriorities.get(b.cli) ?? 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, prefer least used
      return a.usageCount - b.usageCount;
    });

    return sorted[0];
  }

  /**
   * Health-based: skip tokens with recent failures
   */
  private healthBased(active: TokenHistoryEntry[]): TokenHistoryEntry {
    // Filter out tokens with recent failures
    const healthy = active.filter((t) => t.consecutiveFailures === 0);
    
    if (healthy.length === 0) {
      // All tokens have failures, pick the one with least failures
      return active.reduce((min, curr) =>
        curr.consecutiveFailures < min.consecutiveFailures ? curr : min
      );
    }

    // Among healthy tokens, use least-used
    return this.leastUsed(healthy);
  }

  /**
   * Record that a token was used
   */
  async recordUsage(tokenHash: string): Promise<void> {
    await this.history.recordUsage(tokenHash);
  }

  /**
   * Record a token failure
   */
  async recordFailure(tokenHash: string, error: string): Promise<void> {
    await this.history.recordFailure(tokenHash, error);
  }

  /**
   * Update rotation strategy
   */
  setStrategy(strategy: RotationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Update CLI priorities
   */
  setPriorities(priorities: Map<CliType, number>): void {
    this.cliPriorities = priorities;
  }

  /**
   * Get current rotation statistics
   */
  getStats(): {
    strategy: RotationStrategy;
    totalActive: number;
    totalUsage: number;
    byCli: Record<CliType, { count: number; usage: number }>;
  } {
    const active = this.history.getActiveTokens();
    const history = this.history.getHistory();

    const byCli: Record<string, { count: number; usage: number }> = {};
    
    for (const entry of history.discovered) {
      if (!byCli[entry.cli]) {
        byCli[entry.cli] = { count: 0, usage: 0 };
      }
      byCli[entry.cli].count++;
      byCli[entry.cli].usage += entry.usageCount;
    }

    return {
      strategy: this.strategy,
      totalActive: active.length,
      totalUsage: history.discovered.reduce((sum, e) => sum + e.usageCount, 0),
      byCli: byCli as Record<CliType, { count: number; usage: number }>,
    };
  }
}
