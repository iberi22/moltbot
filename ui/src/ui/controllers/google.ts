import type { MoltbotApp } from "../app";

export async function deployGoogleInstance(app: MoltbotApp, opts?: { zone?: string; machineType?: string }) {
  if (!app.client || !app.connected) return;
  app.googleLoading = true;
  app.googleError = null;
  app.googleDeploymentStatus = { step: "launching", message: "Starting Google Cloud deployment..." };
  try {
    await app.client.request("google.deploy", opts ?? {});
  } catch (err) {
    app.googleError = String(err);
    app.googleDeploymentStatus = { step: "error", message: String(err) };
  } finally {
    app.googleLoading = false;
  }
}
