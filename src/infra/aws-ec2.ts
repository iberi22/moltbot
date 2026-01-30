import { loadConfig } from "../config/config.js";
import {
  EC2Client,
  RunInstancesCommand,
  CreateKeyPairCommand,
  DescribeInstancesCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateSecurityGroupCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface DeploymentStatus {
  step: "idle" | "creating-key" | "creating-security-group" | "launching" | "booting" | "ready" | "error";
  message: string;
  instanceId?: string;
  publicIp?: string;
  keyMaterial?: string;
}

export class AwsEc2Service {
  private client: EC2Client;

  constructor(creds: AwsCredentials) {
    this.client = new EC2Client({
      region: creds.region,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    });
  }

  async deployFreeTierVps(onStatus: (status: DeploymentStatus) => void) {
    try {
      // 1. Create Key Pair
      onStatus({ step: "creating-key", message: "Generando llave SSH segura..." });
      const keyName = `moltbot-key-${Date.now()}`;
      const keyResponse = await this.client.send(new CreateKeyPairCommand({ KeyName: keyName }));
      const keyMaterial = keyResponse.KeyMaterial;

      // 2. Setup Security Group
      onStatus({ step: "creating-security-group", message: "Configurando firewall (puertos 22, 80, 443)..." });
      const sgName = `moltbot-sg-${Date.now()}`;
      const sgResponse = await this.client.send(
        new CreateSecurityGroupCommand({
          GroupName: sgName,
          Description: "Security group for Moltbot VPS",
        })
      );
      const groupId = sgResponse.GroupId!;

      await this.client.send(
        new AuthorizeSecurityGroupIngressCommand({
          GroupId: groupId,
          IpPermissions: [
            {
              IpProtocol: "tcp",
              FromPort: 22,
              ToPort: 22,
              IpRanges: [{ CidrIp: "0.0.0.0/0" }], // SSH
            },
            {
              IpProtocol: "tcp",
              FromPort: 80,
              ToPort: 80,
              IpRanges: [{ CidrIp: "0.0.0.0/0" }], // HTTP
            },
            {
              IpProtocol: "tcp",
              FromPort: 443,
              ToPort: 443,
              IpRanges: [{ CidrIp: "0.0.0.0/0" }], // HTTPS
            },
          ],
        })
      );

      const cfg = loadConfig();
      const ami = cfg.gateway?.ec2?.ami;

      // 3. Launch Instance (t2.micro - Ubuntu 24.04 LTS in us-east-1)
      onStatus({ step: "launching", message: "Lanzando instancia t2.micro (Free Tier)..." });
      const runResponse = await this.client.send(
        new RunInstancesCommand({
          ImageId: ami || "ami-0e2c8ccd4e1ffc351", // Ubuntu 24.04 LTS in us-east-1
          InstanceType: "t2.micro",
          KeyName: keyName,
          MaxCount: 1,
          MinCount: 1,
          SecurityGroupIds: [groupId],
        })
      );

      const instanceId = runResponse.Instances![0].InstanceId!;
      onStatus({ step: "booting", message: "Esperando a que el servidor asigne una IP...", instanceId });

      // 4. Poll for IP
      let publicIp: string | undefined;
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const descResponse = await this.client.send(
          new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        );
        publicIp = descResponse.Reservations![0].Instances![0].PublicIpAddress;
        if (publicIp) break;
      }

      if (!publicIp) throw new Error("No se pudo obtener la IP pública después de varios intentos.");

      onStatus({
        step: "ready",
        message: "¡VPS Desplegado con éxito!",
        instanceId,
        publicIp,
        keyMaterial,
      });
    } catch (error: any) {
      onStatus({ step: "error", message: `Error en el despliegue: ${error.message}` });
      throw error;
    }
  }
  async terminateInstance(instanceId: string) {
    await this.client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
  }

  async describeInstances(instanceIds?: string[]) {
    const response = await this.client.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
    return response.Reservations?.flatMap((r) => r.Instances || []) || [];
  }
}

