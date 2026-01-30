import { html, nothing } from "lit";
import { icons } from "../icons";

export function renderTutorialModal(onClose: () => void) {
  return html`
    <div class="modal-backdrop" @click=${onClose}>
      <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">Cloud Deployment Setup Guide</h2>
          <button class="btn btn--icon" @click=${onClose}>${icons.x}</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <h3>AWS Free Tier (EC2)</h3>
          <ol>
            <li>Create an AWS Account at aws.amazon.com.</li>
            <li>Go to IAM Dashboard -> Users -> Create User.</li>
            <li>Attach existing policies directly: "AmazonEC2FullAccess".</li>
            <li>Create Access Key for the user (CLI/SDK use case).</li>
            <li>Copy Access Key ID and Secret Access Key.</li>
          </ol>

          <h3>Google Cloud Free Tier</h3>
          <p class="callout warning">
            <strong>Note:</strong> Google Cloud requires a credit card or bank account for identity verification,
            even for Free Tier usage. You will not be charged if you stay within the Always Free limits.
          </p>
          <ol>
            <li>Create a Google Cloud Project.</li>
            <li>Enable "Compute Engine API".</li>
            <li>Go to IAM & Admin -> Service Accounts.</li>
            <li>Create Service Account, grant "Compute Admin" role.</li>
            <li>Create Key (JSON) for the service account and download it.</li>
            <li>Open the JSON file and copy its content.</li>
            <li>Select an Always Free eligible region (e.g., <code>us-west1</code>, <code>us-central1</code>, or <code>us-east1</code>) and machine type (<code>e2-micro</code>).</li>
          </ol>

          <h3>Render</h3>
          <ol>
            <li>Create a Render account at render.com.</li>
            <li>Go to Account Settings -> API Keys -> Create API Key.</li>
            <li>Copy the API Key.</li>
            <li>For redeployment, you will need the Service ID from the dashboard URL (e.g., srv-xxxxx).</li>
          </ol>
        </div>
        <div class="modal-footer">
          <button class="btn primary" @click=${onClose}>Close</button>
        </div>
      </div>
    </div>
  `;
}
