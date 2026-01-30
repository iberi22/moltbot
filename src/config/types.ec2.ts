export type GatewayEc2Config = {
  /** AWS Access Key ID for EC2 management. */
  accessKeyId?: string;
  /** AWS Secret Access Key for EC2 management. */
  secretAccessKey?: string;
  /** AWS Region for EC2 instances (default: us-east-1). */
  region?: string;
  /** Hardcoded AMI for Free Tier Ubuntu 24.04 (optional override). */
  ami?: string;
};
