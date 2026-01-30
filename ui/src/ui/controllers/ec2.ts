import type { MoltbotApp } from "../app";

export async function loadEc2Instances(app: MoltbotApp) {
  if (!app.client || !app.connected) return;
  if (app.ec2Loading) return;
  app.ec2Loading = true;
  app.ec2Error = null;
  try {
    const res = (await app.client.request("ec2.list", {})) as { instances?: any[] };
    app.ec2Instances = Array.isArray(res.instances) ? res.instances : [];
  } catch (err) {
    app.ec2Error = String(err);
  } finally {
    app.ec2Loading = false;
  }
}

export async function deployEc2Instance(app: MoltbotApp) {
  if (!app.client || !app.connected) return;
  app.ec2Loading = true;
  app.ec2Error = null;
  app.ec2DeploymentStatus = { step: "launching", message: "Starting deployment..." };
  try {
    await app.client.request("ec2.deploy", {});
    // Deployment status will be updated via ec2.deploy.status event
  } catch (err) {
    app.ec2Error = String(err);
    app.ec2DeploymentStatus = { step: "error", message: String(err) };
  } finally {
    app.ec2Loading = false;
  }
}

export async function terminateEc2Instance(app: MoltbotApp, instanceId: string) {
  if (!app.client || !app.connected) return;
  app.ec2Loading = true;
  try {
    await app.client.request("ec2.terminate", { instanceId });
    void loadEc2Instances(app);
  } catch (err) {
    app.ec2Error = String(err);
  } finally {
    app.ec2Loading = false;
  }
}
