import type { OpenClawApp } from "../app";

export async function deployRenderService(app: OpenClawApp, opts?: { serviceId?: string }) {
  if (!app.client || !app.connected) return;
  app.renderLoading = true;
  app.renderError = null;
  app.renderDeploymentStatus = { step: "launching", message: "Starting Render deployment..." };
  try {
    await app.client.request("render.deploy", opts ?? {});
  } catch (err) {
    app.renderError = String(err);
    app.renderDeploymentStatus = { step: "error", message: String(err) };
  } finally {
    app.renderLoading = false;
  }
}

export async function createRenderService(app: OpenClawApp, repoUrl: string) {
  if (!app.client || !app.connected) return;
  app.renderLoading = true;
  app.renderError = null;
  app.renderDeploymentStatus = { step: "launching", message: "Creating Render service..." };
  try {
    await app.client.request("render.create", { repoUrl });
  } catch (err) {
    app.renderError = String(err);
    app.renderDeploymentStatus = { step: "error", message: String(err) };
  } finally {
    app.renderLoading = false;
  }
}
