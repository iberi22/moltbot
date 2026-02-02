import type { 
  Scanner, 
  ScanResult, 
  DiscoveredToken, 
  PluginConfig, 
  CliType 
} from "./types.js";
import { getAllScanners } from "./scanners/index.js";
import { HistoryManager } from "./history-manager.js";

export interface DiscoveryResult {
  scanned: number;
  found: number;
  imported: number;
  errors: string[];
  tokens: DiscoveredToken[];
}

/**
 * Engine that orchestrates CLI token discovery
 */
export class DiscoveryEngine {
  private config: PluginConfig;
  private history: HistoryManager;
  private scanners: Map<CliType, Scanner>;

  constructor(config: PluginConfig, history?: HistoryManager) {
    this.config = config;
    this.history = history || new HistoryManager();
    this.scanners = new Map();
    
    // Initialize scanners based on config
    const allScanners = getAllScanners();
    for (const scanner of allScanners) {
      const cliConfig = config.cliSources[scanner.cliType];
      if (cliConfig?.enabled) {
        this.scanners.set(scanner.cliType, scanner);
      }
    }
  }

  /**
   * Run discovery scan on all enabled CLIs
   */
  async scan(): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      scanned: 0,
      found: 0,
      imported: 0,
      errors: [],
      tokens: [],
    };

    const scanPromises: Promise<void>[] = [];

    for (const [cliType, scanner] of this.scanners) {
      scanPromises.push(
        this.scanCli(cliType, scanner, result).catch((err) => {
          result.errors.push(`${cliType}: ${err instanceof Error ? err.message : String(err)}`);
        })
      );
    }

    await Promise.all(scanPromises);
    await this.history.markScanComplete();

    return result;
  }

  private async scanCli(
    cliType: CliType, 
    scanner: Scanner, 
    result: DiscoveryResult
  ): Promise<void> {
    result.scanned++;

    const scanResult = await scanner.scan();
    
    if (!scanResult.found) {
      if (scanResult.error) {
        result.errors.push(`${cliType}: ${scanResult.error}`);
      }
      return;
    }

    if (!scanResult.token) {
      result.errors.push(`${cliType}: Scan returned no token`);
      return;
    }

    result.found++;
    result.tokens.push(scanResult.token);

    // Add to history
    await this.history.addOrUpdate(scanResult.token);
  }

  /**
   * Validate a discovered token
   */
  async validateToken(token: DiscoveredToken): Promise<boolean> {
    const scanner = this.scanners.get(token.cli);
    if (!scanner) return false;

    try {
      const isValid = await scanner.validate(token.token);
      
      if (isValid) {
        await this.history.updateStatus(token.tokenHash, "active");
      } else {
        await this.history.updateStatus(token.tokenHash, "invalid");
      }
      
      return isValid;
    } catch (err) {
      await this.history.recordFailure(
        token.tokenHash, 
        err instanceof Error ? err.message : String(err)
      );
      return false;
    }
  }

  /**
   * Get discovery statistics
   */
  getStats(): {
    enabledClis: number;
    discoveredTokens: number;
    activeTokens: number;
    lastScanAt?: string;
  } {
    const history = this.history.getHistory();
    const activeTokens = history.discovered.filter((e) => e.status === "active");

    return {
      enabledClis: this.scanners.size,
      discoveredTokens: history.discovered.length,
      activeTokens: activeTokens.length,
      lastScanAt: history.lastScanAt,
    };
  }

  /**
   * Get the history manager
   */
  getHistoryManager(): HistoryManager {
    return this.history;
  }
}
