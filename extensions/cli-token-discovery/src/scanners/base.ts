import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CliType, DiscoveredToken, ScanResult, Scanner, TokenType } from "../types.js";

/**
 * Base class for CLI scanners with common utilities
 */
export abstract class BaseScanner implements Scanner {
  abstract readonly cliType: CliType;
  abstract readonly provider: string;
  abstract readonly tokenType: TokenType;

  /**
   * Get the path to a file in the user's home directory
   */
  protected getHomePath(...segments: string[]): string {
    return join(homedir(), ...segments);
  }

  /**
   * Read and parse a JSON file if it exists
   */
  protected readJson<T>(path: string): T | null {
    try {
      if (!existsSync(path)) return null;
      const content = readFileSync(path, "utf8");
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Read a text file if it exists
   */
  protected readFile(path: string): string | null {
    try {
      if (!existsSync(path)) return null;
      return readFileSync(path, "utf8").trim();
    } catch {
      return null;
    }
  }

  /**
   * Generate SHA-256 hash of a token
   */
  protected hashToken(token: string): string {
    return `sha256:${createHash("sha256").update(token).digest("hex")}`;
  }

  /**
   * Create a discovered token object
   */
  protected createToken(token: string, metadata?: Record<string, unknown>): DiscoveredToken {
    const now = new Date().toISOString();
    return {
      cli: this.cliType,
      provider: this.provider,
      profileId: `${this.provider}:default`,
      tokenType: this.tokenType,
      token,
      tokenHash: this.hashToken(token),
      detectedAt: now,
      usageCount: 0,
      status: "active",
      metadata,
    };
  }

  /**
   * Create a failed scan result
   */
  protected fail(error: string): ScanResult {
    return {
      cli: this.cliType,
      found: false,
      error,
    };
  }

  /**
   * Create a successful scan result
   */
  protected success(token: DiscoveredToken): ScanResult {
    return {
      cli: this.cliType,
      found: true,
      token,
    };
  }

  /**
   * Abstract method: implement in subclass to scan for token
   */
  abstract scan(): Promise<ScanResult>;

  /**
   * Abstract method: implement in subclass to validate a token
   */
  abstract validate(token: string): Promise<boolean>;
}
