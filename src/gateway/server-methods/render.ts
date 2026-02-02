import { loadConfig } from "../../config/config.js";
import { RenderService } from "../../infra/render.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function getRenderService(overrides?: { serviceId?: string }) {
  const cfg = loadConfig();
  const renderCfg = cfg.gateway?.render;
  const apiKey = renderCfg?.apiKey;
  const serviceId = overrides?.serviceId || renderCfg?.serviceId;

  if (!apiKey) {
    throw new Error(
      "Render credentials not configured. Please add gateway.render section to moltbot.json.",
    );
  }

  return new RenderService(apiKey, serviceId);
}

export const renderHandlers: GatewayRequestHandlers = {
  "render.deploy": async ({ params, respond, context }) => {
    try {
      const serviceId = params.serviceId as string | undefined;
      const service = getRenderService({ serviceId });
      service
        .deployService((status) => {
          context.broadcast("render.deploy.status", status);
        })
        .catch((err) => {
          context.broadcast("render.deploy.status", {
            step: "error",
            message: `Deployment failed: ${err.message}`,
          });
        });

      respond(true, { started: true });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
  "render.create": async ({ params, respond, context }) => {
    try {
      const repoUrl = params.repoUrl as string | undefined;
      if (!repoUrl) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "repoUrl required"));
        return;
      }
      const service = getRenderService();
      service
        .createService(repoUrl, (status) => {
          context.broadcast("render.deploy.status", status);
        })
        .catch((err) => {
          context.broadcast("render.deploy.status", {
            step: "error",
            message: `Creation failed: ${err.message}`,
          });
        });

      respond(true, { started: true });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
};
