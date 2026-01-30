export type GatewayGoogleConfig = {
  /** Google Cloud Project ID. */
  projectId?: string;
  /** Service Account JSON key content (stringified). */
  serviceAccountKey?: string;
  /** Google Cloud Zone (default: us-central1-a). */
  zone?: string;
  /** Machine Type for Free Tier (default: e2-micro). */
  machineType?: string;
};
