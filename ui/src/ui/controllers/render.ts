import type { MoltbotApp } from "../app";

export async function deployRenderService(app: MoltbotApp, opts?: { serviceId?: string }) {
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
