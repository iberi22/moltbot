# CLI Token Auto-Discovery Plugin

Automatically discovers and imports authentication tokens from AI CLIs already installed on your system (kimi-cli, codex-cli, qwen-cli, gemini-cli). Features one-click token refresh when tokens expire.

## Features

- 🔍 **Auto-discovery**: Scans for existing CLI authentications at startup
- ✅ **Validation**: Verifies tokens before import
- 🔄 **Token Refresh**: Re-authenticate expired/invalid tokens with one click
- 📊 **History tracking**: Maintains usage statistics per token
- 🔄 **Multi-agent rotation**: Distributes load across available tokens
- 🖥️ **Control UI**: Visual management with refresh buttons

## Installation

This is a bundled plugin. Enable it:

```bash
openclaw plugins enable cli-token-discovery
```

Restart the gateway after enabling.

## Supported CLIs

| CLI | Provider | Auth Type | Refresh Method |
|-----|----------|-----------|----------------|
| kimi-cli | kimi-code | API Key | Web platform |
| codex-cli | openai | API Key / OAuth | CLI login or web |
| qwen-cli | qwen-portal | OAuth | Browser login |
| gemini-cli | google-gemini-cli | OAuth | Browser or CLI |

## Quick Start

```bash
# Run initial scan
openclaw token-discovery scan

# View status
openclaw token-discovery status

# Refresh an expired token
openclaw token-discovery refresh kimi-cli

# Import token manually
openclaw token-discovery import-manual kimi-cli sk-your-key
```

## Configuration

```json5
{
  plugins: {
    entries: {
      "cli-token-discovery": {
        enabled: true,
        config: {
          scanOnStartup: true,
          autoImport: true,
          validateTokens: true,
          rotationStrategy: "round-robin",
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

## Token Refresh

When a token expires, the Control UI shows a 🔄 **Refresh** button. Click it to:

1. **Generate New API Key** - Opens platform website (kimi, openai, etc.)
2. **Browser Login** - OAuth flow for qwen/gemini
3. **CLI Command** - Runs `codex login` or `gemini login`
4. **Manual Entry** - Paste token directly

### CLI Refresh

```bash
# Auto-detect best method
openclaw token-discovery refresh kimi-cli

# Specify method
openclaw token-discovery refresh codex-cli --method cli-command
openclaw token-discovery refresh qwen-cli --method oauth-browser
```

## Architecture

```
src/
├── types.ts              # Shared types
├── discovery-service.ts  # Gateway service
├── discovery-engine.ts   # Scan orchestration
├── import-engine.ts      # Auth profile import
├── history-manager.ts    # Token history
├── token-rotator.ts      # Load distribution
├── token-refresher.ts    # Token refresh logic ⭐
├── scanners/             # CLI scanners
└── ui/                   # Control UI components
    ├── token-discovery-panel.tsx
    └── token-refresh-modal.tsx ⭐
```

## Security

- Only SHA-256 hashes stored in history
- Import is opt-in
- Tokens validated before import
- History file: 0o600 permissions

## Documentation

Full docs: [CLI Token Discovery](/docs/providers/cli-token-discovery.md)
