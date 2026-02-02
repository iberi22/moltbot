import { loadConfig } from "../../config/config.js";
import { AwsEc2Service } from "../../infra/aws-ec2.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function getEc2Service() {
  const cfg = loadConfig();
  const ec2Cfg = cfg.gateway?.ec2;
  const accessKeyId = ec2Cfg?.accessKeyId || process.env.AWS_EC2_ACCESS_KEY_ID;
  const secretAccessKey = ec2Cfg?.secretAccessKey || process.env.AWS_EC2_SECRET_ACCESS_KEY;
  const region = ec2Cfg?.region || process.env.AWS_EC2_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS EC2 credentials not configured. Please add gateway.ec2 section to moltbot.json or set AWS_EC2_ACCESS_KEY_ID/AWS_EC2_SECRET_ACCESS_KEY env vars.",
    );
  }

  return new AwsEc2Service({ accessKeyId, secretAccessKey, region });
}

export const ec2Handlers: GatewayRequestHandlers = {
  "ec2.list": async ({ respond }) => {
    try {
      const service = getEc2Service();
      const instances = await service.describeInstances();
      respond(true, { instances });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
  "ec2.deploy": async ({ respond, context }) => {
    try {
      const service = getEc2Service();
      // We don't await the deployment because it takes a while.
      // We start it and broadcast progress.
      service
        .deployFreeTierVps((status) => {
          context.broadcast("ec2.deploy.status", status);
        })
        .catch((err) => {
          context.broadcast("ec2.deploy.status", {
            step: "error",
            message: `Deployment failed: ${err.message}`,
          });
        });

      respond(true, { started: true });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
  "ec2.terminate": async ({ params, respond }) => {
    try {
      const instanceId = params.instanceId as string;
      if (!instanceId) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "instanceId required"));
        return;
      }
      const service = getEc2Service();
      await service.terminateInstance(instanceId);
      respond(true, { ok: true });
    } catch (err: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
    }
  },
};
