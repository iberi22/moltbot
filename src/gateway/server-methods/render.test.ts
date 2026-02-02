import { describe, it, expect, vi, beforeEach } from "vitest";

// Use doMock to avoid hoisting issues with the config module
vi.doMock("../../config/config.js", () => ({
  loadConfig: vi.fn().mockReturnValue({
    gateway: {
      render: {
        apiKey: "test-key",
      },
    },
  }),
}));

const mockDeployService = vi.fn().mockImplementation(function (cb: any) {
  cb({ step: "ready", message: "Deployed" });
  return Promise.resolve();
});

const mockCreateService = vi.fn().mockImplementation(function (url: string, cb: any) {
  cb({ step: "ready", message: "Created" });
  return Promise.resolve();
});

vi.doMock("../../infra/render.js", () => {
  return {
    RenderService: vi.fn().mockImplementation(function (this: any) {
      this.deployService = mockDeployService;
      this.createService = mockCreateService;
    }),
  };
});

describe("render handlers", () => {
  let renderHandlers: any;
  let RenderService: any;

  beforeEach(async () => {
    vi.resetModules(); // Reset modules to ensure fresh mocks
    const renderModule = await import("./render.js");
    renderHandlers = renderModule.renderHandlers;
    const infraModule = await import("../../infra/render.js");
    RenderService = infraModule.RenderService;
  });

  it("render.deploy should call deployService with serviceId", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const params = { serviceId: "srv-999" };

    await renderHandlers["render.deploy"]({
      params,
      respond,
      context: { broadcast } as any,
    } as any);

    expect(RenderService).toHaveBeenCalledWith("test-key", "srv-999");
    expect(respond).toHaveBeenCalledWith(true, { started: true });
    expect(broadcast).toHaveBeenCalledWith("render.deploy.status", {
      step: "ready",
      message: "Deployed",
    });
  });

  it("render.create should call createService with repoUrl", async () => {
    const respond = vi.fn();
    const broadcast = vi.fn();
    const params = { repoUrl: "git://repo" };

    await renderHandlers["render.create"]({
      params,
      respond,
      context: { broadcast } as any,
    } as any);

    expect(respond).toHaveBeenCalledWith(true, { started: true });
    expect(broadcast).toHaveBeenCalledWith("render.deploy.status", {
      step: "ready",
      message: "Created",
    });
  });

  it("render.create should validate params", async () => {
    const respond = vi.fn();
    await renderHandlers["render.create"]({
      params: {},
      respond,
    } as any);
    expect(respond).toHaveBeenCalledWith(
      false,
      undefined,
      expect.objectContaining({ message: "repoUrl required" }),
    );
  });
});
