import { html, nothing } from "lit";
import { formatAgo } from "../format";
import { icons } from "../icons";
import { renderTutorialModal } from "../components/tutorial-modal";

export type DeployProps = {
  activeTab: "aws" | "google" | "render";
  showTutorial: boolean;

  // AWS State
  loading: boolean;
  instances: any[];
  error: string | null;
  deploymentStatus: any | null;

  // Google State
  googleLoading: boolean;
  googleError: string | null;
  googleDeploymentStatus: any | null;

  // Render State
  renderLoading: boolean;
  renderError: string | null;
  renderDeploymentStatus: any | null;

  // Actions
  onTabChange: (tab: "aws" | "google" | "render") => void;
  onToggleTutorial: (show: boolean) => void;
  onRefresh: () => void;
  onDeploy: () => void;
  onTerminate: (instanceId: string) => void;

  onGoogleDeploy: (opts?: { zone?: string; machineType?: string }) => void;
  onRenderDeploy: (opts?: { serviceId?: string }) => void;
  onRenderCreate: (repoUrl: string) => void;
  onSaveConfig: (path: string[], value: unknown) => void;
  onSave: () => void;
};

export function renderDeploy(props: DeployProps) {
  return html`
    <div class="deploy-view">
      ${props.showTutorial ? renderTutorialModal(() => props.onToggleTutorial(false)) : nothing}

      <div class="tabs" style="margin-bottom: 20px; border-bottom: 1px solid var(--c-border);">
        <button
          class="tab ${props.activeTab === 'aws' ? 'active' : ''}"
          @click=${() => props.onTabChange('aws')}
          style="padding: 8px 16px; background: none; border: none; cursor: pointer; border-bottom: 2px solid ${props.activeTab === 'aws' ? 'var(--c-primary)' : 'transparent'};"
        >
          AWS EC2
        </button>
        <button
          class="tab ${props.activeTab === 'google' ? 'active' : ''}"
          @click=${() => props.onTabChange('google')}
          style="padding: 8px 16px; background: none; border: none; cursor: pointer; border-bottom: 2px solid ${props.activeTab === 'google' ? 'var(--c-primary)' : 'transparent'};"
        >
          Google Cloud
        </button>
        <button
          class="tab ${props.activeTab === 'render' ? 'active' : ''}"
          @click=${() => props.onTabChange('render')}
          style="padding: 8px 16px; background: none; border: none; cursor: pointer; border-bottom: 2px solid ${props.activeTab === 'render' ? 'var(--c-primary)' : 'transparent'};"
        >
          Render
        </button>
        <button
          class="btn btn--icon"
          @click=${() => props.onToggleTutorial(true)}
          style="margin-left: auto;"
          title="Setup Guide"
        >
          ?
        </button>
      </div>

      ${props.activeTab === 'aws' ? renderAwsTab(props) : nothing}
      ${props.activeTab === 'google' ? renderGoogleTab(props) : nothing}
      ${props.activeTab === 'render' ? renderRenderTab(props) : nothing}
    </div>
  `;
}

function renderAwsTab(props: DeployProps) {
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Cloud Deployment (AWS Free Tier)</div>
          <div class="card-sub">Provision and manage Ubuntu 24.04 VPS instances.</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? "Loading..." : "Refresh"}
          </button>
          <button class="btn primary" ?disabled=${props.loading} @click=${props.onDeploy}>
            Launch Free Tier VPS
          </button>
        </div>
      </div>

      ${props.error
        ? html`<div class="callout danger" style="margin-top: 16px;">${props.error}</div>`
        : nothing}

      ${props.deploymentStatus
        ? html`
            <div class="callout info" style="margin-top: 16px;">
              <div class="row" style="gap: 8px; align-items: center;">
                ${props.deploymentStatus.step === "ready"
                  ? icons.check
                  : props.deploymentStatus.step === "error"
                    ? icons.x
                    : icons.loader}
                <strong>${props.deploymentStatus.message}</strong>
              </div>
              ${props.deploymentStatus.instanceId
                ? html`<div class="muted" style="margin-top: 4px;">Instance ID: ${props.deploymentStatus.instanceId}</div>`
                : nothing}
              ${props.deploymentStatus.publicIp
                ? html`<div class="stat-value ok" style="margin-top: 4px;">IP: ${props.deploymentStatus.publicIp}</div>`
                : nothing}
            </div>
          `
        : nothing}

      <div class="list" style="margin-top: 24px;">
        ${props.instances.length === 0 && !props.loading
          ? html`<div class="muted">No active EC2 instances found.</div>`
          : props.instances.map((inst) => renderInstance(inst, props))}
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Free Tier Info</div>
      <div class="card-sub">Ubuntu 24.04 LTS · t2.micro · 1 vCPU · 1 GiB RAM</div>
      <div class="callout" style="margin-top: 12px;">
        AWS Free Tier includes 750 hours of t2.micro/t3.micro per month for the first year.
        Always terminate instances you are no longer using to avoid charges.
      </div>
    </section>
  `;
}

function renderGoogleTab(props: DeployProps) {
  const handleDeployClick = () => {
    const zoneSelect = document.getElementById("google-zone") as HTMLSelectElement;
    const machineSelect = document.getElementById("google-machine") as HTMLSelectElement;
    props.onGoogleDeploy({
      zone: zoneSelect?.value,
      machineType: machineSelect?.value
    });
  };

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Google Cloud Deployment (Free Tier)</div>
          <div class="card-sub">Deploy e2-micro instance in us-central1 (Free Tier eligible).</div>
        </div>
      </div>

      <div class="row" style="gap: 16px; margin-top: 16px; align-items: end;">
        <label class="field" style="flex: 1;">
          <span class="field-label">Region (Always Free Eligible)</span>
          <select id="google-zone" class="input">
            <option value="us-central1-a" selected>us-central1-a (Iowa)</option>
            <option value="us-central1-b">us-central1-b (Iowa)</option>
            <option value="us-central1-f">us-central1-f (Iowa)</option>
            <option value="us-west1-a">us-west1-a (Oregon)</option>
            <option value="us-west1-b">us-west1-b (Oregon)</option>
            <option value="us-east1-b">us-east1-b (South Carolina)</option>
            <option value="us-east1-c">us-east1-c (South Carolina)</option>
            <option value="us-east1-d">us-east1-d (South Carolina)</option>
          </select>
        </label>

        <label class="field" style="flex: 1;">
          <span class="field-label">Machine Type</span>
          <select id="google-machine" class="input">
            <option value="e2-micro" selected>e2-micro (2 vCPU, 1 GB RAM) - Free Tier</option>
            <option value="e2-small">e2-small (2 vCPU, 2 GB RAM)</option>
            <option value="e2-medium">e2-medium (2 vCPU, 4 GB RAM)</option>
          </select>
        </label>

        <button class="btn primary" ?disabled=${props.googleLoading} @click=${handleDeployClick}>
          Launch VM
        </button>
      </div>

      ${props.googleError
        ? html`<div class="callout danger" style="margin-top: 16px;">${props.googleError}</div>`
        : nothing}

      ${props.googleDeploymentStatus
        ? html`
            <div class="callout info" style="margin-top: 16px;">
               <div class="row" style="gap: 8px; align-items: center;">
                ${props.googleDeploymentStatus.step === "ready"
                  ? icons.check
                  : props.googleDeploymentStatus.step === "error"
                    ? icons.x
                    : icons.loader}
                <strong>${props.googleDeploymentStatus.message}</strong>
              </div>
            </div>`
        : nothing}

      <div class="callout" style="margin-top: 12px;">
        Google Cloud Free Tier includes an e2-micro instance in us-central1, us-west1, or us-east1.
      </div>

      <!-- Credentials Form -->
      <details class="config-diff" style="margin-top: 16px;">
        <summary class="config-diff__summary">
          <span>Configure Credentials</span>
          <svg class="config-diff__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div class="config-diff__content">
          <label class="field">
            <span class="field-label">Project ID</span>
            <input
              type="text"
              class="input"
              placeholder="my-project-id"
              @change=${(e: Event) => props.onSaveConfig(["gateway", "google", "projectId"], (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span class="field-label">Service Account Key (JSON)</span>
            <textarea
              class="input"
              rows="5"
              placeholder="{ ... }"
              @change=${(e: Event) => props.onSaveConfig(["gateway", "google", "serviceAccountKey"], (e.target as HTMLInputElement).value)}
            ></textarea>
          </label>
          <div class="row" style="margin-top: 8px;">
            <button class="btn btn--sm primary" @click=${props.onSave}>Save Credentials</button>
          </div>
        </div>
      </details>
    </section>
  `;
}

function renderRenderTab(props: DeployProps) {
  const handleDeployClick = () => {
    const serviceInput = document.getElementById("render-service-id") as HTMLInputElement;
    const val = serviceInput?.value?.trim();
    props.onRenderDeploy(val ? { serviceId: val } : undefined);
  };

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Render Deployment</div>
          <div class="card-sub">Deploy or Redeploy services on Render.com.</div>
        </div>
      </div>

      <div class="row" style="gap: 16px; margin-top: 16px; align-items: end;">
         <label class="field" style="flex: 1;">
          <span class="field-label">Service ID (Override)</span>
          <input type="text" id="render-service-id" class="input" placeholder="srv-..." />
        </label>

        <button class="btn primary" ?disabled=${props.renderLoading} @click=${handleDeployClick}>
          Trigger Deploy
        </button>
      </div>

      <details class="config-diff" style="margin-top: 16px;">
        <summary class="config-diff__summary">
          <span>Create New Service</span>
          <svg class="config-diff__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div class="config-diff__content">
          <label class="field">
            <span class="field-label">Git Repository URL</span>
            <input
              type="text"
              class="input"
              id="render-repo-url"
              placeholder="https://github.com/username/repo"
            />
          </label>
          <div class="row" style="margin-top: 8px;">
            <button class="btn btn--sm primary" ?disabled=${props.renderLoading} @click=${() => {
              const repo = (document.getElementById("render-repo-url") as HTMLInputElement).value;
              if (repo) props.onRenderCreate(repo);
            }}>Create Service</button>
          </div>
        </div>
      </details>

      ${props.renderError
        ? html`<div class="callout danger" style="margin-top: 16px;">${props.renderError}</div>`
        : nothing}

      ${props.renderDeploymentStatus
        ? html`
            <div class="callout info" style="margin-top: 16px;">
               <div class="row" style="gap: 8px; align-items: center;">
                ${props.renderDeploymentStatus.step === "ready"
                  ? icons.check
                  : props.renderDeploymentStatus.step === "error"
                    ? icons.x
                    : icons.loader}
                <strong>${props.renderDeploymentStatus.message}</strong>
              </div>
            </div>`
        : nothing}

      <!-- Credentials Form -->
      <details class="config-diff" style="margin-top: 16px;">
        <summary class="config-diff__summary">
          <span>Configure Credentials</span>
          <svg class="config-diff__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div class="config-diff__content">
          <label class="field">
            <span class="field-label">API Key</span>
            <input
              type="password"
              class="input"
              placeholder="rnd_..."
              @change=${(e: Event) => props.onSaveConfig(["gateway", "render", "apiKey"], (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="field">
            <span class="field-label">Default Service ID</span>
            <input
              type="text"
              class="input"
              placeholder="srv-..."
              @change=${(e: Event) => props.onSaveConfig(["gateway", "render", "serviceId"], (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="row" style="margin-top: 8px;">
            <button class="btn btn--sm primary" @click=${props.onSave}>Save Credentials</button>
          </div>
        </div>
      </details>
    </section>
  `;
}

function renderInstance(inst: any, props: DeployProps) {
  const state = inst.State?.Name || "unknown";
  const instanceId = inst.InstanceId;
  const publicIp = inst.PublicIpAddress || "no IP";
  const launchTime = inst.LaunchTime ? new Date(inst.LaunchTime).getTime() : null;
  const isRunning = state === "running";

  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          <span class="stat-value ${isRunning ? "ok" : "warn"}" style="font-size: 0.8em; margin-right: 8px;">
            ●
          </span>
          ${instanceId}
        </div>
        <div class="list-sub">${publicIp} · ${inst.InstanceType} · ${inst.Placement?.AvailabilityZone}</div>
        <div class="muted" style="margin-top: 4px;">
          Status: ${state} · Launched ${launchTime ? formatAgo(launchTime) : "n/a"}
        </div>
      </div>
      <div class="list-meta">
        <button
          class="btn btn--sm danger"
          ?disabled=${state === "shutting-down" || state === "terminated"}
          @click=${() => {
            if (confirm(`Are you sure you want to TERMINATE instance ${instanceId}?`)) {
              props.onTerminate(instanceId);
            }
          }}
        >
          Terminate
        </button>
      </div>
    </div>
  `;
}
