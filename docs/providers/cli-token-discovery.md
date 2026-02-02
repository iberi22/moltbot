---
summary: "Auto-discover and import authentication tokens from installed AI CLIs"
---

# CLI Token Auto-Discovery

The CLI Token Auto-Discovery plugin automatically detects and imports authentication tokens from AI CLIs already installed on your system (kimi-cli, codex-cli, qwen-cli, gemini-cli). This eliminates the need for manual re-authentication and enables intelligent multi-agent workload distribution.

## Features

- 🔍 **Auto-discovery**: Scans for existing CLI authentications at startup
- ✅ **Validation**: Verifies tokens before import
- 🔄 **Token Refresh**: Re-authenticate expired/invalid tokens with one click
- 📊 **History tracking**: Maintains usage statistics per token
- 🔄 **Multi-agent rotation**: Distributes load across available tokens
- 🖥️ **Control UI**: Visual management in the OpenClaw dashboard

## Supported CLIs

| CLI | Provider | Auth Type | Refresh Method |
|-----|----------|-----------|----------------|
| [kimi-cli](https://docs.kimi.com/) | `kimi-code` | API Key | Web platform |
| [codex-cli](https://github.com/openai/codex) | `openai` | API Key / OAuth | CLI login or web |
| [qwen-cli](https://github.com/QwenLM/qwen-code) | `qwen-portal` | OAuth | Browser login |
| [gemini-cli](https://github.com/google-gemini/gemini-cli) | `google-gemini-cli` | OAuth | Browser or CLI |

## Installation

This is a bundled plugin (shipped with OpenClaw). Enable it:

```bash
openclaw plugins enable cli-token-discovery
```

Restart the gateway after enabling.

## Configuration

Add to your `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "cli-token-discovery": {
        enabled: true,
        config: {
          // Run discovery on gateway startup
          scanOnStartup: true,
          
          // Automatically import discovered tokens
          autoImport: true,
          
          // Validate tokens before import (recommended)
          validateTokens: true,
          
          // Strategy for multi-agent distribution
          rotationStrategy: "round-robin", // "least-used" | "priority" | "health-based"
          
          // Per-CLI configuration
          cliSources: {
            "kimi-cli": { enabled: true, priority: 1 },
            "codex-cli": { enabled: true, priority: 2 },
            "qwen-cli": { enabled: true, priority: 3 },
            "gemini-cli": { enabled: true, priority: 4 }
          }
        }
      }
    }
  }
}
```

## Usage

### Initial Setup

```bash
# Enable the plugin
openclaw plugins enable cli-token-discovery

# Restart gateway
openclaw gateway restart

# Run initial scan
openclaw token-discovery scan
```

### Manual Scan

Trigger a discovery scan manually:

```bash
# Scan only (shows what would be imported)
openclaw token-discovery scan

# Scan and import
openclaw token-discovery scan --import

# Show discovery history
openclaw token-discovery history

# Clear history
openclaw token-discovery history --clear
```

### Token Refresh

When a token expires or becomes invalid, you can refresh it:

```bash
# Refresh a specific CLI token
openclaw token-discovery refresh kimi-cli
openclaw token-discovery refresh codex-cli

# With specific method
openclaw token-discovery refresh kimi-cli --method api-key-web
openclaw token-discovery refresh codex-cli --method cli-command
```

#### Refresh Methods

| Method | Description | Best For |
|--------|-------------|----------|
| `oauth-browser` | Opens browser for OAuth login | qwen-cli, gemini-cli |
| `api-key-web` | Opens platform website to generate key | kimi-cli, codex-cli (API key) |
| `cli-command` | Runs CLI's native login command | codex-cli, gemini-cli |
| `manual` | Enter token manually | Any CLI |

### Manual Token Import

If you already have a token, import it directly:

```bash
openclaw token-discovery import-manual kimi-cli sk-your-api-key
openclaw token-discovery import-manual codex-cli sk-your-api-key
```

### Gateway RPC

For programmatic access:

```bash
# Trigger scan
openclaw gateway rpc tokenDiscovery.scan

# Get status
openclaw gateway rpc tokenDiscovery.status

# Get history
openclaw gateway rpc tokenDiscovery.getHistory

# Refresh a token
openclaw gateway rpc tokenDiscovery.refreshToken --params '{"cli": "kimi-cli", "tokenHash": "sha256:..."}'

# Import manual token
openclaw gateway rpc tokenDiscovery.importManual --params '{"cli": "kimi-cli", "token": "sk-..."}'
```

## Control UI

Navigate to the Control UI dashboard (`http://localhost:18789`) and select **Token Discovery** from the sidebar to:

- View discovered tokens with status indicators
- See usage statistics per token
- Trigger manual scans
- **Refresh expired/invalid tokens** (click the 🔄 button)
- Configure auto-import settings
- View token rotation statistics

### Refresh Flow in UI

1. Tokens with issues show a 🔄 **Refresh** button
2. Click to open the refresh modal
3. Select your preferred method:
   - **Generate New API Key**: Opens platform website
   - **Browser Login**: Opens OAuth flow
   - **CLI Command**: Runs native login
   - **Manual Entry**: Paste token directly
4. Follow prompts to complete authentication
5. New token is automatically imported

## Token History

Discovery history is stored in `~/.openclaw/cli-token-history.json`:

```json
{
  "version": 1,
  "lastScanAt": "2026-01-31T22:56:40Z",
  "discovered": [
    {
      "cli": "kimi-cli",
      "provider": "kimi-code",
      "profileId": "kimi-code:default",
      "detectedAt": "2026-01-31T22:00:00Z",
      "lastUsedAt": "2026-01-31T22:30:00Z",
      "usageCount": 15,
      "tokenHash": "sha256:abc123...",
      "status": "active",
      "consecutiveFailures": 0
    }
  ]
}
```

**Security note**: Only SHA-256 hashes of tokens are stored, never the actual tokens.

## Multi-Agent Distribution

When multiple tokens are available, the plugin can distribute workload to respect rate limits:

### Rotation Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `round-robin` | Cycle through tokens sequentially | Balanced usage across all tokens |
| `least-used` | Prefer tokens with lowest usage count | Even wear distribution |
| `priority` | Use highest priority token first | Cost optimization (prefer cheaper APIs) |
| `health-based` | Skip tokens with recent failures | Reliability priority |

### Configuration Example

```json5
{
  plugins: {
    entries: {
      "cli-token-discovery": {
        config: {
          rotationStrategy: "priority",
          cliSources: {
            "gemini-cli": { enabled: true, priority: 1 },  // Use first (often free tier)
            "kimi-cli": { enabled: true, priority: 2 },    // Fallback
            "codex-cli": { enabled: true, priority: 3 },   // Last resort (expensive)
            "qwen-cli": { enabled: false }                 // Disabled
          }
        }
      }
    }
  }
}
```

## Token Refresh URLs

When refreshing tokens via the web method, these URLs are opened:

| CLI | URL |
|-----|-----|
| kimi-cli | https://platform.moonshot.cn/console/api-keys |
| codex-cli | https://platform.openai.com/api-keys |
| qwen-cli | https://bailian.console.aliyun.com/?apiKey=1#/api-key |
| gemini-cli | https://aistudio.google.com/app/apikey |

## Troubleshooting

### Token Not Detected

1. Verify CLI is installed: `which kimi`, `which codex`, etc.
2. Check CLI is authenticated: `kimi config get api_key`
3. Verify config file exists at expected location
4. Check OpenClaw logs: `openclaw logs --follow`

### Token Import Fails

1. Enable validation to see error details:
   ```json5
   { validateTokens: true }
   ```
2. Check token hasn't expired in the source CLI
3. Verify network connectivity to provider
4. Try refreshing the token manually

### Refresh Fails

1. Check your browser allows popups for the OAuth flow
2. For API key methods, ensure you're logged into the platform
3. Try a different refresh method:
   ```bash
   openclaw token-discovery refresh kimi-cli --method manual
   ```
4. Check the CLI documentation for specific auth requirements

### Rate Limits Still Hit

1. Enable multiple CLIs in configuration
2. Use `round-robin` or `least-used` strategy
3. Check token usage in history: `openclaw token-discovery history`
4. Ensure all tokens are active (refresh expired ones)

## Security

- **No token storage**: Only hashes are stored in history
- **Secure file permissions**: History file uses 0o600
- **Opt-in import**: `autoImport: false` requires manual approval
- **Validation**: Tokens are validated before import
- **Isolation**: Each token maintains separate auth profile
- **Automatic cleanup**: Revoked tokens can be cleared from history

## Uninstall

Disable the plugin:

```bash
openclaw plugins disable cli-token-discovery
```

Clear discovery history:

```bash
openclaw token-discovery history --clear
rm ~/.openclaw/cli-token-history.json
```

## See Also

- [Model Providers](/providers) - Full list of supported providers
- [Multi-Agent](/concepts/multi-agent) - Multi-agent workload distribution
- [Authentication](/gateway/authentication) - Auth profile management
