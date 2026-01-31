import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RenderService } from "./render.js";

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("RenderService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should deploy existing service", async () => {
    const service = new RenderService("key", "srv-123");
    const onStatus = vi.fn();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "dep-123" }),
    });

    await service.deployService(onStatus);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.render.com/v1/services/srv-123/deploys",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer key" }),
      })
    );
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ step: "ready" }));
  });

  it("should fail deploy if serviceId missing", async () => {
    const service = new RenderService("key");
    await expect(service.deployService(vi.fn())).rejects.toThrow("Service ID is required");
  });

  it("should create new service", async () => {
    const service = new RenderService("key");
    const onStatus = vi.fn();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "srv-new",
        service: { serviceDetails: { url: "https://new.onrender.com" } },
      }),
    });

    await service.createService("https://github.com/me/repo", onStatus);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.render.com/v1/services",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("https://github.com/me/repo"),
      })
    );
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ step: "ready" }));
  });

  it("should handle API errors", async () => {
    const service = new RenderService("key", "srv-123");

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Bad token",
    });

    await expect(service.deployService(vi.fn())).rejects.toThrow("Render API failed: 401");
  });
});
