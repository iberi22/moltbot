import { loadConfig } from "../config/config.js";

export interface DeploymentStatus {
  step: "idle" | "launching" | "ready" | "error";
  message: string;
}

export class RenderService {
  private apiKey: string;
  private serviceId: string;

  constructor(apiKey: string, serviceId: string) {
    this.apiKey = apiKey;
    this.serviceId = serviceId;
  }

  async deployService(onStatus: (status: DeploymentStatus) => void) {
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
}
