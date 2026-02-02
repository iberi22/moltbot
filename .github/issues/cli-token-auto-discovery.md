---
title: "CLI Token Auto-Discovery System"
labels: ["enhancement", "auth", "multi-agent", "plugin"]
assignees: []
status: "implemented"
---

# CLI Token Auto-Discovery System ✅ IMPLEMENTED

## Problem Statement

Users often have multiple AI CLIs installed and authenticated (kimi-cli, codex-cli, qwen-cli, gemini-cli), but OpenClaw doesn't automatically detect these existing authentications. This leads to:

1. **Manual re-authentication**: Users must re-run `openclaw login` for each provider
2. **API rate limit issues**: Single provider gets overwhelmed without distribution
3. **Underutilized resources**: Existing authenticated sessions go unused
4. **Token expiration**: No easy way to refresh expired tokens

## Solution Overview

A **proactive token discovery system** that:
1. ✅ Scans for existing CLI authentications at gateway startup
2. ✅ Auto-imports valid tokens into OpenClaw's auth profile system
3. ✅ Maintains a history for multi-agent workload distribution
4. ✅ **Provides one-click token refresh** for expired/invalid tokens
5. ✅ Shows UI with refresh buttons and multiple auth methods

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TokenDiscoveryService                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Detect    │  │   Import    │  │   History   │              │
│  │   Engine    │→ │   Engine    │→ │   Manager   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         ↑               ↑                               ↓        │
│  ┌─────────────┐  ┌─────────────┐              ┌─────────────┐  │
│  │ CLI Config  │  │   Token     │              │  AuthStore  │  │
│  │   Scanners  │  │  Refresher  │              │  Integration│  │
│  └─────────────┘  └─────────────┘              └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │   Control UI     │
                    │  Token Dashboard │
                    │  + Refresh Modal │
                    └──────────────────┘
```

## Implementation Status

### ✅ Phase 1: Core Detection Engine
- [x] Create `extensions/cli-token-discovery/` plugin structure
- [x] Implement scanners for each CLI type:
  - `KimiCliScanner`: `~/.kimi/credentials/kimi-code.json`
  - `CodexCliScanner`: `~/.codex/config.json`, `~/.codex/auth.json`
  - `QwenCliScanner`: `~/.qwen/oauth_creds.json`
  - `GeminiCliScanner`: `~/.gemini/oauth_creds.json`
- [x] Token validation with lightweight API pings
- [x] Environment variable fallback detection

### ✅ Phase 2: Token Refresh System
- [x] `TokenRefresher` class with multiple refresh methods
- [x] OAuth browser-based refresh
- [x] API key web platform redirect
- [x] CLI command execution (`codex login`, etc.)
- [x] Manual token entry
- [x] Credential file watching for auto-detection
- [x] Support for all 4 CLIs with appropriate methods

### ✅ Phase 3: Import & History System
- [x] Import detected tokens into auth profiles
- [x] `~/.openclaw/cli-token-history.json` with SHA-256 hashes only
- [x] Track usage count, last used, consecutive failures
- [x] Token status management (active, expired, invalid, revoked)
- [x] Rotation strategy for multi-agent distribution

### ✅ Phase 4: UI Integration
- [x] "Token Discovery" section in Control UI
- [x] Show discovered tokens with status indicators
- [x] 🔄 Refresh button for expired/invalid tokens
- [x] Refresh modal with method selection:
  - Browser OAuth login
  - Web platform API key generation
  - CLI command execution
  - Manual token entry
- [x] Manual scan trigger button
- [x] Configure auto-import settings
- [x] Usage statistics dashboard

### ✅ Phase 5: Gateway Integration
- [x] Run discovery on gateway startup (configurable)
- [x] Background service registration
- [x] RPC methods:
  - `tokenDiscovery.scan()`
  - `tokenDiscovery.status()`
  - `tokenDiscovery.getHistory()`
  - `tokenDiscovery.clearHistory()`
  - `tokenDiscovery.refreshToken()` ⭐ NEW
  - `tokenDiscovery.importManual()` ⭐ NEW
- [x] CLI commands:
  - `openclaw token-discovery scan`
  - `openclaw token-discovery status`
  - `openclaw token-discovery history`
  - `openclaw token-discovery refresh <cli>` ⭐ NEW
  - `openclaw token-discovery import-manual <cli> <token>` ⭐ NEW

## Supported CLIs & Refresh Methods

| CLI | Config Location | Token Type | Refresh Methods |
|-----|-----------------|------------|-----------------|
| kimi-cli | `~/.kimi/credentials/kimi-code.json` | API Key | Web platform, Manual |
| codex-cli | `~/.codex/auth.json` | API Key / OAuth | CLI login, Web platform, Manual |
| qwen-cli | `~/.qwen/oauth_creds.json` | OAuth | Browser OAuth, Web platform |
| gemini-cli | `~/.gemini/oauth_creds.json` | OAuth | Browser OAuth, CLI login |

### Platform URLs for Refresh

| CLI | Platform URL |
|-----|--------------|
| kimi-cli | https://platform.moonshot.cn/console/api-keys |
| codex-cli | https://platform.openai.com/api-keys |
| qwen-cli | https://bailian.console.aliyun.com/?apiKey=1#/api-key |
| gemini-cli | https://aistudio.google.com/app/apikey |

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
          rotationStrategy: "round-robin", // or "least-used", "priority", "health-based"
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

## Multi-Agent Distribution Strategy

The history system enables intelligent workload distribution:

1. **Round-robin**: Cycle through available tokens
2. **Least-used**: Prefer tokens with lower `usageCount`
3. **Priority**: Use explicit priority configuration
4. **Health-based**: Skip tokens with recent failures

## Security Considerations

- ✅ Token hashes stored (SHA-256), never the full token
- ✅ Import is opt-in (configurable `autoImport`)
- ✅ Tokens validated before import
- ✅ History file permissions: 0o600
- ✅ Clear history command available

## Testing

- [x] Unit tests for each CLI scanner (`scanners.test.ts`)
- [x] Manual testing checklist:
  - [x] Scan detects tokens from all CLIs
  - [x] Import creates correct auth profiles
  - [x] History tracks usage correctly
  - [x] Refresh opens correct URLs/commands
  - [x] UI shows correct status badges
  - [x] Modal allows method selection

## Files Created

```
extensions/cli-token-discovery/
├── package.json
├── openclaw.plugin.json
├── README.md
├── index.ts
└── src/
    ├── types.ts
    ├── discovery-service.ts
    ├── discovery-engine.ts
    ├── import-engine.ts
    ├── history-manager.ts
    ├── token-rotator.ts
    ├── token-refresher.ts ⭐ NEW
    ├── utils.ts
    ├── scanners/
    │   ├── base.ts
    │   ├── kimi-scanner.ts
    │   ├── codex-scanner.ts
    │   ├── qwen-scanner.ts
    │   ├── gemini-scanner.ts
    │   ├── index.ts
    │   └── scanners.test.ts
    └── ui/
        ├── index.ts
        ├── token-discovery-panel.tsx
        └── token-refresh-modal.tsx ⭐ NEW

docs/providers/cli-token-discovery.md
.github/issues/cli-token-auto-discovery.md
```

## Acceptance Criteria

- [x] Gateway startup detects existing CLI tokens within 5 seconds
- [x] Valid tokens are auto-imported as auth profiles
- [x] History file tracks usage per token
- [x] Control UI shows discovered token status
- [x] CLI command allows manual scan
- [x] Multi-agent mode distributes load across available tokens
- [x] **Expired tokens show refresh button in UI** ⭐ NEW
- [x] **Multiple refresh methods available per CLI** ⭐ NEW
- [x] **Manual token import supported** ⭐ NEW

## Future Enhancements

- [ ] Token expiration monitoring and alerts
- [ ] Automatic token refresh for OAuth providers (using refresh tokens)
- [ ] Usage analytics dashboard with graphs
- [ ] Support for additional CLIs (aider, continue.dev, etc.)
- [ ] Token sharing across multiple OpenClaw instances
