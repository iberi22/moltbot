import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleComputeService } from "./google-compute.js";
import child_process from "node:child_process";
import fs from "node:fs";

// Hoist the mock function
const { mockSpawn } = vi.hoisted(() => ({ mockSpawn: vi.fn() }));

// Mock child_process.spawn properly
vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    default: { spawn: mockSpawn },
    spawn: mockSpawn,
  };
});

// Mock fs
vi.mock("node:fs", () => ({
  default: {
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    existsSync: vi.fn(),
  },
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("GoogleComputeService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation for spawn to succeed
    mockSpawn.mockReturnValue({
      stdout: { on: (evt: string, cb: (d: string) => void) => { if (evt === "data") cb("success output"); } },
      stderr: { on: vi.fn() },
      on: (evt: string, cb: (code: number) => void) => {
        if (evt === "close") cb(0);
      },
    });
    (fs.existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should construct with valid parameters", () => {
    const service = new GoogleComputeService("proj", "{}", "us-central1-a", "e2-micro");
    expect(service).toBeDefined();
  });

  it("should throw on invalid zone format", () => {
    expect(() => new GoogleComputeService("proj", "{}", "invalid zone", "e2-micro")).toThrow(/Invalid zone format/);
  });

  it("should execute deployment sequence", async () => {
    const service = new GoogleComputeService("proj", "{}", "us-central1-a", "e2-micro");
    const onStatus = vi.fn();

    await service.deployInstance(onStatus);

    // Expect at least 5 calls (version, auth, config, create, describe)
    // Firewall might be skipped or included.
    expect(mockSpawn).toHaveBeenCalled();

    // Verify gcloud create args
    const createCall = mockSpawn.mock.calls.find((call: any) => call[1].includes("instances") && call[1].includes("create"));
    expect(createCall).toBeDefined();
    const args = createCall[1];
    expect(args).toContain("--zone=us-central1-a");
    expect(args).toContain("--machine-type=e2-micro");

    // Verify status updates
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ step: "ready" }));
  });
});
