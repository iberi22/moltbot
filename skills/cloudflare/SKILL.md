---
name: cloudflare
description: Use cloudflared to create secure tunnels to expose local services to the internet.
metadata: {"moltbot":{"emoji":"☁️"}}
---

# Cloudflare Tunnel (cloudflared)

Use the `bash` tool to interact with `cloudflared`.

## Check Installation

To check if `cloudflared` is installed:
```bash
cloudflared --version
```

## Install (if missing)

If `cloudflared` is not found, you can download it.

**Linux (amd64):**
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb
```

**macOS:**
```bash
brew install cloudflared
```

## Start a Quick Tunnel (The Bridge)

To expose the local Gateway (port 18789) to the internet so the Flutter App can connect:

```bash
cloudflared tunnel --url http://localhost:18789
```

**Important:**
1. This command normally blocks the terminal. You may need to run it in a way that allows you to see the output (to get the `trycloudflare.com` URL) but keeps it running.
2. The output will show a URL ending in `.trycloudflare.com`. This is the "Bridge URL".
3. The Flutter App needs this URL to connect.

## Advanced: Authenticated Tunnels

For persistent tunnels (recommended for production):
1. `cloudflared tunnel login`
2. `cloudflared tunnel create <name>`
3. `cloudflared tunnel run <name>`
