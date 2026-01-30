import { loadConfig } from "../config/config.js";

export interface DeploymentStatus {
  step: "idle" | "launching" | "ready" | "error";
  message: string;
}

export class RenderService {
  private apiKey: string;
  private serviceId: string | undefined;

  constructor(apiKey: string, serviceId?: string) {
    this.apiKey = apiKey;
    this.serviceId = serviceId;
  }

  async deployService(onStatus: (status: DeploymentStatus) => void) {
    if (!this.serviceId) {
      throw new Error("Service ID is required for redeployment.");
    }
    try {
      onStatus({ step: "launching", message: "Triggering Render deployment..." });

      const url = `https://api.render.com/v1/services/${this.serviceId}/deploys`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Render API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      onStatus({
        step: "ready",
        message: `Deployment triggered successfully! ID: ${data.id}`,
      });
    } catch (error: any) {
      onStatus({ step: "error", message: `Render deployment error: ${error.message}` });
      throw error;
    }
  }

  async createService(repoUrl: string, onStatus: (status: DeploymentStatus) => void) {
    try {
      onStatus({ step: "launching", message: "Creating new Render service..." });

      const url = "https://api.render.com/v1/services";
      const body = {
        type: "web_service",
        name: `moltbot-${Date.now()}`,
        ownerId: undefined, // Defaults to user
        repo: repoUrl,
        autoDeploy: "yes",
        branch: "main",
        serviceDetails: {
          region: "oregon", // Free tier eligible region
          plan: "free",
          runtime: "docker",
          env: "docker",
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Render API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const newServiceId = data.id;
      const serviceUrl = data.service.serviceDetails.url;

      onStatus({
        step: "ready",
        message: `Service created! ID: ${newServiceId}. URL: ${serviceUrl}`,
      });
    } catch (error: any) {
      onStatus({ step: "error", message: `Render creation error: ${error.message}` });
      throw error;
    }
  }
}
