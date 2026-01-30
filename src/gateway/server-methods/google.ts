import { loadConfig } from "../../config/config.js";
import { GoogleComputeService } from "../../infra/google-compute.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function getGoogleService(overrides?: { zone?: string; machineType?: string }) {
  const cfg = loadConfig();
  const googleCfg = cfg.gateway?.google;
  const projectId = googleCfg?.projectId;
  const keyJson = googleCfg?.serviceAccountKey;
  const zone = overrides?.zone || googleCfg?.zone || "us-central1-a";
  const machineType = overrides?.machineType || googleCfg?.machineType || "e2-micro";

  if (!projectId || !keyJson) {
    throw new Error(
      "Google Cloud credentials not configured. Please add gateway.google section to moltbot.json."
    );
  }

  return new GoogleComputeService(projectId, keyJson, zone, machineType);
}

export const googleHandlers: GatewayRequestHandlers = {
  "google.deploy": async ({ params, respond, context }) => {
    try {
      const zone = params.zone as string | undefined;
      const machineType = params.machineType as string | undefined;
      const service = getGoogleService({ zone, machineType });
      service
        .deployInstance((status) => {
          context.broadcast("google.deploy.status", status);
        })
        .catch((err) => {
          context.broadcast("google.deploy.status", {
            step: "error",
            message: `Deployment failed: ${err.message}`,
          });
        });

      respond(true, { started: true });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
};
