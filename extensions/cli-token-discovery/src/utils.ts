/**
 * Utility functions for CLI Token Discovery
 */

import { createHash } from "node:crypto";

/**
 * Generate a SHA-256 hash of a token
 */
export function hashToken(token: string): string {
  return `sha256:${createHash("sha256").update(token).digest("hex")`;
}

/**
 * Truncate a hash for display
 */
export function truncateHash(hash: string, length: number = 16): string {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...`;
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Never";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format a date for display
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString();
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Check if a file path is safe (within home directory)
 */
export function isSafePath(path: string): boolean {
  // Simple check - in production this would be more robust
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  
  // Block suspicious patterns
  const blockedPatterns = [
    "..",
    "~/.ssh",
    "~/.gnupg",
    "/etc",
    "/usr",
    "c:\\windows",
    "c:\\program files",
  ];
  
  return !blockedPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitive(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) return "***";
  return `${data.slice(0, visibleChars)}...${data.slice(-visibleChars)}`;
}

/**
 * Parse a TOML-like config file (simplified)
 */
export function parseSimpleConfig(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;
    
    // Parse key = value
    const match = trimmed.match(/^([\w_]+)\s*=\s*["']?([^"']+)["']?$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  
  return result;
}
