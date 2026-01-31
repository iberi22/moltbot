import { describe, expect, it, vi, beforeEach } from "vitest";
import { googleHandlers } from "./google.js";
import type { GatewayContext } from "./types.js";
import * as configMod from "../../config/config.js";

// Mock the GoogleComputeService
const mocks = vi.hoisted(() => {
    return {
        deployInstance: vi.fn().mockImplementation((cb) => {
            if (cb) cb({ step: "deploying", message: "Deploying..." });
            return Promise.resolve();
        })
    };
});

vi.mock("../../infra/google-compute.js", () => ({
  GoogleComputeService: class {
    deployInstance(cb: any) {
      return mocks.deployInstance(cb);
    }
  }
}));

describe("Google Gateway Handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(configMod, "loadConfig").mockReturnValue({
            gateway: {
                google: {
                    projectId: "test-project",
                    serviceAccountKey: "{}",
                    zone: "test-zone",
                    machineType: "test-machine"
                }
            }
        });
    });

  it("handles google.deploy request", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const context = { broadcast } as unknown as GatewayContext;

    await googleHandlers["google.deploy"]({
      params: { zone: "us-west1-a" },
      respond,
      context
    });

    if (respond.mock.calls.length > 0 && respond.mock.calls[0][0] === false) {
        console.error("Handler failed with:", JSON.stringify(respond.mock.calls[0][2], null, 2));
    }

    expect(respond).toHaveBeenCalledWith(true, { started: true });
    expect(mocks.deployInstance).toHaveBeenCalled();
  });
});
