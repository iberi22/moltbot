/**
 * Types for CLI Token Discovery plugin
 */

export type CliType = "kimi-cli" | "codex-cli" | "qwen-cli" | "gemini-cli";

export type TokenType = "api_key" | "oauth";

export type TokenStatus = "active" | "expired" | "invalid" | "revoked";

export type RotationStrategy = "round-robin" | "least-used" | "priority" | "health-based";

export interface DiscoveredToken {
  cli: CliType;
  provider: string;
  profileId: string;
  tokenType: TokenType;
  token: string; // The actual token (only in memory, never stored)
  tokenHash: string; // SHA-256 hash for tracking
  detectedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  status: TokenStatus;
  metadata?: Record<string, unknown>;
}

export interface TokenHistoryEntry {
  cli: CliType;
  provider: string;
  profileId: string;
  tokenType: TokenType;
  tokenHash: string;
  detectedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  status: TokenStatus;
  lastError?: string;
  consecutiveFailures: number;
}

export interface TokenHistory {
  version: number;
  lastScanAt?: string;
  discovered: TokenHistoryEntry[];
}

export interface CliSourceConfig {
  enabled: boolean;
  priority: number;
}

export interface PluginConfig {
  scanOnStartup: boolean;
  autoImport: boolean;
  validateTokens: boolean;
  rotationStrategy: RotationStrategy;
  cliSources: Record<CliType, CliSourceConfig>;
}

export interface ScanResult {
  cli: CliType;
  found: boolean;
  token?: DiscoveredToken;
  error?: string;
}

export interface Scanner {
  readonly cliType: CliType;
  readonly provider: string;
  scan(): Promise<ScanResult>;
  validate(token: string): Promise<boolean>;
}

// Default configuration
export const DEFAULT_CONFIG: PluginConfig = {
  scanOnStartup: true,
  autoImport: true,
  validateTokens: true,
  rotationStrategy: "round-robin",
  cliSources: {
    "kimi-cli": { enabled: true, priority: 1 },
    "codex-cli": { enabled: true, priority: 2 },
    "qwen-cli": { enabled: true, priority: 3 },
    "gemini-cli": { enabled: true, priority: 4 },
  },
};

// Provider mappings
export const PROVIDER_MAP: Record<CliType, string> = {
  "kimi-cli": "kimi-code",
  "codex-cli": "openai",
  "qwen-cli": "qwen-portal",
  "gemini-cli": "google-gemini-cli",
};

// Default models per provider
export const DEFAULT_MODELS: Record<string, string> = {
  "kimi-code": "kimi-code/kimi-k2.5",
  openai: "openai/gpt-4o",
  "qwen-portal": "qwen-portal/qwen-coder-plus",
  "google-gemini-cli": "google-gemini-cli/gemini-3-pro-preview",
};
