import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHandlers } from "./render.js";
import type { GatewayContext } from "./types.js";
import * as configMod from "../../config/config.js";

// Mock the RenderService
const mocks = vi.hoisted(() => {
    return {
        deployService: vi.fn().mockImplementation((cb) => {
            if (cb) cb({ step: "deploying", message: "Deploying..." });
            return Promise.resolve();
        }),
        createService: vi.fn().mockImplementation((repo, cb) => {
            if (cb) cb({ step: "creating", message: "Creating..." });
            return Promise.resolve();
        })
    };
});

vi.mock("../../infra/render.js", () => ({
  RenderService: class {
    deployService(cb: any) {
      return mocks.deployService(cb);
    }
    createService(repo: string, cb: any) {
      return mocks.createService(repo, cb);
    }
  }
}));

describe("Render Gateway Handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(configMod, "loadConfig").mockReturnValue({
            gateway: {
                render: {
                    apiKey: "test-api-key",
                    serviceId: "test-service-id"
                }
            }
        });
    });

  it("handles render.deploy request", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const context = { broadcast } as unknown as GatewayContext;

    await renderHandlers["render.deploy"]({
      params: { serviceId: "override-service-id" },
      respond,
      context
    });

    expect(respond).toHaveBeenCalledWith(true, { started: true });
    expect(mocks.deployService).toHaveBeenCalled();
  });

  it("handles render.create request", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const context = { broadcast } as unknown as GatewayContext;

    await renderHandlers["render.create"]({
      params: { repoUrl: "https://github.com/test/repo" },
      respond,
      context
    });

    expect(respond).toHaveBeenCalledWith(true, { started: true });
    expect(mocks.createService).toHaveBeenCalledWith("https://github.com/test/repo", expect.any(Function));
  });
});
