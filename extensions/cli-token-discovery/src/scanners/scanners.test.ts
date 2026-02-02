import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KimiCliScanner } from "./kimi-scanner.js";
import { CodexCliScanner } from "./codex-scanner.js";
import { QwenCliScanner } from "./qwen-scanner.js";
import { GeminiCliScanner } from "./gemini-scanner.js";

// Mock fs module
vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { readFileSync, existsSync } from "node:fs";

const mockedReadFileSync = vi.mocked(readFileSync);
const mockedExistsSync = vi.mocked(existsSync);

describe("KimiCliScanner", () => {
  let scanner: KimiCliScanner;

  beforeEach(() => {
    scanner = new KimiCliScanner();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should detect token from credentials file", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({ apiKey: "sk-kimi-test123" }));

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("sk-kimi-test123");
    expect(result.token?.provider).toBe("kimi-code");
  });

  it("should detect token from environment variable", async () => {
    mockedExistsSync.mockReturnValue(false);
    vi.stubEnv("KIMI_API_KEY", "sk-kimi-env123");

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("sk-kimi-env123");
  });

  it("should return error when no token found", async () => {
    mockedExistsSync.mockReturnValue(false);

    const result = await scanner.scan();

    expect(result.found).toBe(false);
    expect(result.error).toContain("No kimi-cli credentials");
  });
});

describe("CodexCliScanner", () => {
  let scanner: CodexCliScanner;

  beforeEach(() => {
    scanner = new CodexCliScanner();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should detect token from auth.json", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({ apiKey: "sk-openai-test123" }));

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("sk-openai-test123");
    expect(result.token?.provider).toBe("openai");
  });

  it("should detect token from environment variable", async () => {
    mockedExistsSync.mockReturnValue(false);
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-env123");

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("sk-openai-env123");
  });
});

describe("QwenCliScanner", () => {
  let scanner: QwenCliScanner;

  beforeEach(() => {
    scanner = new QwenCliScanner();
    vi.resetAllMocks();
  });

  it("should detect OAuth token", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        accessToken: "qwen-access-token",
        refreshToken: "qwen-refresh-token",
        expiresAt: Date.now() + 3600000,
      })
    );

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("qwen-access-token");
    expect(result.token?.tokenType).toBe("oauth");
  });

  it("should report expired token", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        accessToken: "expired-token",
        expiresAt: Date.now() - 3600000,
      })
    );

    const result = await scanner.scan();

    expect(result.found).toBe(false);
    expect(result.error).toContain("expired");
  });
});

describe("GeminiCliScanner", () => {
  let scanner: GeminiCliScanner;

  beforeEach(() => {
    scanner = new GeminiCliScanner();
    vi.resetAllMocks();
  });

  it("should detect OAuth token with metadata", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        access_token: "gemini-access-token",
        refresh_token: "gemini-refresh-token",
        expires_at: Date.now() + 3600000,
        email: "user@example.com",
      })
    );

    const result = await scanner.scan();

    expect(result.found).toBe(true);
    expect(result.token?.token).toBe("gemini-access-token");
    expect(result.token?.metadata?.email).toBe("user@example.com");
  });
});
