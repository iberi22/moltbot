import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist the mock variable
const { mockLoadConfig, mockDeployInstance } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn(),
  mockDeployInstance: vi.fn().mockImplementation(function(cb: any) {
    cb({ step: "ready", message: "Done" });
    return Promise.resolve();
  }),
}));

vi.mock("../../config/config.js", () => ({
  loadConfig: mockLoadConfig,
}));

// IMPORTANT: Mocking the class constructor using a regular function
vi.mock("../../infra/google-compute.js", () => {
  return {
    GoogleComputeService: vi.fn().mockImplementation(function(this: any) {
      this.deployInstance = mockDeployInstance;
    }),
  };
});

import { googleHandlers } from "./google.js";
import { GoogleComputeService } from "../../infra/google-compute.js";

describe("google.deploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockReturnValue({
      gateway: {
        google: {
          projectId: "test-proj",
          serviceAccountKey: "{}",
        },
      },
    });
  });

  it("should call deployInstance with params", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const params = { zone: "us-west1-a", machineType: "e2-small" };

    await googleHandlers["google.deploy"]({
      params,
      respond,
      context: { broadcast } as any,
    } as any);

    expect(GoogleComputeService).toHaveBeenCalledWith("test-proj", "{}", "us-west1-a", "e2-small");
    expect(respond).toHaveBeenCalledWith(true, { started: true });
    // Verify broadcast callback (simulated in mock)
    expect(broadcast).toHaveBeenCalledWith("google.deploy.status", { step: "ready", message: "Done" });
  });
});
  });
});
