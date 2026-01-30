import { html, nothing } from "lit";
import { formatAgo } from "../format";
import { icons } from "../icons";

export type DeployProps = {
  loading: boolean;
  instances: any[];
  error: string | null;
  deploymentStatus: any | null;
  onRefresh: () => void;
  onDeploy: () => void;
  onTerminate: (instanceId: string) => void;
};

export function renderDeploy(props: DeployProps) {
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
