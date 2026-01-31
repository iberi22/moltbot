export type StartupScriptOptions = {
  repoUrl?: string;
  branch?: string;
  env?: Record<string, string>;
};

export function getStartupScript(opts: StartupScriptOptions = {}): string {
  const repoUrl = opts.repoUrl || "https://github.com/mariozechner/clawdbot.git"; // Defaulting to main repo
  const branch = opts.branch || "main";
  const envVars = Object.entries(opts.env || {})
    .map(([k, v]) => `${k}="${v}"`)
    .join("\n");

  return `#!/bin/bash
# Moltbot Auto-Provisioning Script for Ubuntu 24.04
set -e

# 1. Update and Install Dependencies
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git build-essential python3

# 2. Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 4. Install Global Tools
npm install -g pnpm pm2

# 5. Clone and Setup Moltbot
mkdir -p /app
cd /app
if [ ! -d ".git" ]; then
  git clone -b "${branch}" "${repoUrl}" .
else
  git pull origin "${branch}"
fi

# 6. Configure Environment
cat <<EOF > .env
${envVars}
PORT=18789
NODE_ENV=production
EOF

# 7. Build and Start
pnpm install --frozen-lockfile
pnpm build
# Force pnpm for UI (sometimes bun fails in mixed envs)
export CLAWDBOT_PREFER_PNPM=1
pnpm ui:install
pnpm ui:build

# Start with PM2
pm2 start moltbot.mjs --name moltbot --interpreter node
pm2 save
pm2 startup systemd -u root --hp /root

echo "Moltbot provisioning completed successfully." > /var/log/moltbot-provision.log
`;
}
