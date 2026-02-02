import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { getStartupScript } from "./provisioning.js";

export interface GoogleDeploymentStatus {
  step: "idle" | "launching" | "ready" | "error";
  message: string;
}

export class GoogleComputeService {
  private projectId: string;
  private keyJson: string;
  private zone: string;
  private machineType: string;

  constructor(projectId: string, keyJson: string, zone: string, machineType: string) {
    this.projectId = projectId;
    this.keyJson = keyJson;
    this.zone = this.validateZone(zone);
    this.machineType = this.validateMachineType(machineType);
  }

  private validateZone(zone: string): string {
    if (!/^[a-z]+-[a-z]+\d+-[a-z]$/.test(zone)) {
      throw new Error(`Invalid zone format: ${zone}`);
    }
    return zone;
  }

  private validateMachineType(type: string): string {
    if (!/^[a-z0-9-]+$/.test(type)) {
      throw new Error(`Invalid machine type format: ${type}`);
    }
    return type;
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // Security: shell: false prevents command injection
      const proc = spawn(command, args, { shell: false });
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => (stdout += data.toString()));
      proc.stderr.on("data", (data) => (stderr += data.toString()));

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async deployInstance(onStatus: (status: GoogleDeploymentStatus) => void) {
    const keyFilePath = path.join(os.tmpdir(), `gcloud-key-${Date.now()}.json`);
    try {
      // 1. Setup Auth
      onStatus({ step: "launching", message: "Configuring Google Cloud credentials..." });

      // Check if gcloud is installed
      try {
        await this.runCommand("gcloud", ["--version"]);
      } catch {
        throw new Error("gcloud CLI is not installed or not in PATH.");
      }

      // Write key file
      fs.writeFileSync(keyFilePath, this.keyJson, { mode: 0o600 });

      // Activate service account
      await this.runCommand("gcloud", [
        "auth",
        "activate-service-account",
        `--key-file=${keyFilePath}`,
      ]);

      // Set project
      await this.runCommand("gcloud", ["config", "set", "project", this.projectId]);

      // 2. Deploy Instance
      const instanceName = `moltbot-${Date.now()}`;
      onStatus({
        step: "launching",
        message: `Creating instance ${instanceName} (${this.machineType}) in ${this.zone}...`,
      });

      // Create instance (Ubuntu 24.04 LTS equivalent or similar)
      // Using standard image family for ubuntu-2204-lts as 24.04 might need specific name
      // Free tier is e2-micro.
      const startupScript = getStartupScript();
      await this.runCommand("gcloud", [
        "compute",
        "instances",
        "create",
        instanceName,
        `--zone=${this.zone}`,
        `--machine-type=${this.machineType}`,
        "--image-family=ubuntu-2204-lts",
        "--image-project=ubuntu-os-cloud",
        "--tags=http-server,https-server",
        `--metadata=startup-script=${startupScript}`,
      ]);

      // 3. Get IP
      onStatus({ step: "launching", message: "Waiting for IP address..." });
      const ipOutput = await this.runCommand("gcloud", [
        "compute",
        "instances",
        "describe",
        instanceName,
        `--zone=${this.zone}`,
        "--format=get(networkInterfaces[0].accessConfigs[0].natIP)",
      ]);

      onStatus({
        step: "ready",
        message: `Instance deployed! IP: ${ipOutput}`,
      });
    } catch (error: any) {
      onStatus({ step: "error", message: `Google Cloud deployment error: ${error.message}` });
      throw error;
    } finally {
      if (fs.existsSync(keyFilePath)) {
        try {
          fs.unlinkSync(keyFilePath);
        } catch {
          // ignore
        }
      }
    }
  }
}
