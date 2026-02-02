export { BaseScanner } from "./base.js";
export { KimiCliScanner } from "./kimi-scanner.js";
export { CodexCliScanner } from "./codex-scanner.js";
export { QwenCliScanner } from "./qwen-scanner.js";
export { GeminiCliScanner } from "./gemini-scanner.js";

import { KimiCliScanner } from "./kimi-scanner.js";
import { CodexCliScanner } from "./codex-scanner.js";
import { QwenCliScanner } from "./qwen-scanner.js";
import { GeminiCliScanner } from "./gemini-scanner.js";
import type { Scanner, CliType } from "../types.js";

/**
 * Get all available scanners
 */
export function getAllScanners(): Scanner[] {
  return [
    new KimiCliScanner(),
    new CodexCliScanner(),
    new QwenCliScanner(),
    new GeminiCliScanner(),
  ];
}

/**
 * Get scanner for a specific CLI type
 */
export function getScanner(cliType: CliType): Scanner | undefined {
  const scanners = getAllScanners();
  return scanners.find((s) => s.cliType === cliType);
}
