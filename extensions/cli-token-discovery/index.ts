import type { PluginAPI } from "openclaw/plugin-sdk";
import { DiscoveryService } from "./src/discovery-service.js";
import type { PluginConfig as CliTokenConfig, CliType } from "./src/types.js";
import { DEFAULT_CONFIG } from "./src/types.js";

const PLUGIN_ID = "cli-token-discovery";

// Global service instance
let service: DiscoveryService | null = null;

/**
 * Merge user config with defaults
 */
function mergeConfig(userConfig: Partial<CliTokenConfig> = {}): CliTokenConfig {
  return {
    scanOnStartup: userConfig.scanOnStartup ?? DEFAULT_CONFIG.scanOnStartup,
    autoImport: userConfig.autoImport ?? DEFAULT_CONFIG.autoImport,
    validateTokens: userConfig.validateTokens ?? DEFAULT_CONFIG.validateTokens,
    rotationStrategy: userConfig.rotationStrategy ?? DEFAULT_CONFIG.rotationStrategy,
    cliSources: {
      "kimi-cli": { ...DEFAULT_CONFIG.cliSources["kimi-cli"], ...userConfig.cliSources?.["kimi-cli"] },
      "codex-cli": { ...DEFAULT_CONFIG.cliSources["codex-cli"], ...userConfig.cliSources?.["codex-cli"] },
      "qwen-cli": { ...DEFAULT_CONFIG.cliSources["qwen-cli"], ...userConfig.cliSources?.["qwen-cli"] },
      "gemini-cli": { ...DEFAULT_CONFIG.cliSources["gemini-cli"], ...userConfig.cliSources?.["gemini-cli"] },
    },
  };
}

/**
 * Main plugin registration
 */
export default function cliTokenDiscoveryPlugin(api: PluginAPI): void {
  // Get config from plugin entries
  const userConfig = (api.config?.plugins?.entries?.[PLUGIN_ID]?.config || {}) as Partial<CliTokenConfig>;
  const config = mergeConfig(userConfig);

  // Create service instance
  service = new DiscoveryService(api, config);

  // Register as background service
  api.registerService({
    id: PLUGIN_ID,
    start: async () => {
      await service?.start();
    },
    stop: async () => {
      await service?.stop();
    },
  });

  // Register gateway RPC methods
  registerGatewayMethods(api);

  // Register CLI commands
  registerCliCommands(api);

  api.logger?.info(`[${PLUGIN_ID}] Plugin registered`);
}

/**
 * Register gateway RPC methods
 */
function registerGatewayMethods(api: PluginAPI): void {
  // Scan for tokens
  api.registerGatewayMethod("tokenDiscovery.scan", async ({ respond }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    try {
      const result = await service.runDiscovery();
      respond(true, result);
    } catch (err) {
      respond(false, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Get status
  api.registerGatewayMethod("tokenDiscovery.status", ({ respond }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    respond(true, service.getStatus());
  });

  // Get history
  api.registerGatewayMethod("tokenDiscovery.getHistory", ({ respond }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    respond(true, service.getHistory());
  });

  // Clear history
  api.registerGatewayMethod("tokenDiscovery.clearHistory", async ({ respond }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    try {
      await service.clearHistory();
      respond(true, { cleared: true });
    } catch (err) {
      respond(false, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Get token for rotation (for multi-agent distribution)
  api.registerGatewayMethod("tokenDiscovery.getRotationToken", ({ respond }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    const token = service.getTokenForRotation();
    if (!token) {
      respond(false, { error: "No active tokens available" });
      return;
    }

    respond(true, {
      provider: token.provider,
      profileId: token.profileId,
    });
  });

  // Refresh a token
  api.registerGatewayMethod("tokenDiscovery.refreshToken", async ({ respond, params }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    const cli = params?.cli as CliType;
    const tokenHash = params?.tokenHash as string;
    const method = params?.method as string | undefined;

    if (!cli || !tokenHash) {
      respond(false, { error: "Missing required parameters: cli, tokenHash" });
      return;
    }

    try {
      const result = await service.refreshToken(cli, tokenHash, method);
      respond(result.success, result);
    } catch (err) {
      respond(false, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Import manual token
  api.registerGatewayMethod("tokenDiscovery.importManual", async ({ respond, params }) => {
    if (!service) {
      respond(false, { error: "Service not initialized" });
      return;
    }

    const cli = params?.cli as CliType;
    const token = params?.token as string;

    if (!cli || !token) {
      respond(false, { error: "Missing required parameters: cli, token" });
      return;
    }

    try {
      const result = await service.importManualToken(cli, token);
      respond(result.success, result);
    } catch (err) {
      respond(false, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

/**
 * Register CLI commands
 */
function registerCliCommands(api: PluginAPI): void {
  api.registerCli(({ program }) => {
    const cmd = program
      .command("token-discovery")
      .description("CLI token discovery and management");

    // Scan command
    cmd
      .command("scan")
      .description("Scan for available CLI tokens")
      .option("--import", "Auto-import discovered tokens")
      .option("--validate", "Validate tokens before import")
      .action(async (options) => {
        if (!service) {
          console.error("Service not initialized");
          process.exit(1);
        }

        console.log("🔍 Scanning for CLI tokens...\n");
        
        const startTime = Date.now();
        const result = await service.runDiscovery();
        const duration = Date.now() - startTime;

        console.log(`\n✅ Scan complete in ${duration}ms`);
        console.log(`   Sources scanned: ${result.found + result.errors.length}`);
        console.log(`   Tokens found: ${result.found}`);
        console.log(`   Tokens imported: ${result.imported}`);

        if (result.errors.length > 0) {
          console.log(`\n⚠️  ${result.errors.length} errors:`);
          for (const error of result.errors) {
            console.log(`   - ${error}`);
          }
        }
      });

    // Status command
    cmd
      .command("status")
      .description("Show token discovery status")
      .action(() => {
        if (!service) {
          console.error("Service not initialized");
          process.exit(1);
        }

        const status = service.getStatus();

        console.log("Token Discovery Status");
        console.log("======================");
        console.log(`Service: ${status.isRunning ? "🟢 Running" : "🔴 Stopped"}`);
        console.log(`Enabled CLIs: ${status.enabledClis}`);
        console.log(`Discovered tokens: ${status.discoveredTokens}`);
        console.log(`Active tokens: ${status.activeTokens}`);
        console.log(`Last scan: ${status.lastScanAt || "Never"}`);

        if (status.rotation) {
          console.log(`\nRotation Strategy: ${status.rotation.strategy}`);
          console.log(`Total usage: ${status.rotation.totalUsage}`);
          
          if (Object.keys(status.rotation.byCli).length > 0) {
            console.log("\nUsage by CLI:");
            for (const [cli, stats] of Object.entries(status.rotation.byCli)) {
              console.log(`  ${cli}: ${stats.usage} uses (${stats.count} tokens)`);
            }
          }
        }
      });

    // History command
    cmd
      .command("history")
      .description("Show token discovery history")
      .option("--clear", "Clear all history")
      .action(async (options) => {
        if (!service) {
          console.error("Service not initialized");
          process.exit(1);
        }

        if (options.clear) {
          await service.clearHistory();
          console.log("✅ History cleared");
          return;
        }

        const history = service.getHistory();

        console.log("Token Discovery History");
        console.log("=======================");
        console.log(`Last scan: ${history.lastScanAt || "Never"}`);
        console.log(`Total entries: ${history.discovered.length}\n`);

        if (history.discovered.length === 0) {
          console.log("No tokens discovered yet. Run 'openclaw token-discovery scan' to find tokens.");
          return;
        }

        // Group by CLI
        const byCli: Record<string, typeof history.discovered> = {};
        for (const entry of history.discovered) {
          if (!byCli[entry.cli]) byCli[entry.cli] = [];
          byCli[entry.cli].push(entry);
        }

        for (const [cli, entries] of Object.entries(byCli)) {
          console.log(`\n${cli}:`);
          for (const entry of entries) {
            const statusIcon = entry.status === "active" ? "🟢" :
                              entry.status === "invalid" ? "🔴" :
                              entry.status === "expired" ? "🟡" : "⚪";
            console.log(`  ${statusIcon} ${entry.provider} (${entry.profileId})`);
            console.log(`     Hash: ${entry.tokenHash.slice(0, 16)}...`);
            console.log(`     Usage: ${entry.usageCount}`);
            console.log(`     Detected: ${new Date(entry.detectedAt).toLocaleString()}`);
            if (entry.lastUsedAt) {
              console.log(`     Last used: ${new Date(entry.lastUsedAt).toLocaleString()}`);
            }
            if (entry.lastError) {
              console.log(`     Error: ${entry.lastError}`);
            }
          }
        }
      });

    // Refresh command
    cmd
      .command("refresh <cli>")
      .description("Refresh authentication for a specific CLI")
      .option("--method <method>", "Refresh method (oauth-browser, api-key-web, cli-command, manual)")
      .action(async (cli: string, options) => {
        if (!service) {
          console.error("Service not initialized");
          process.exit(1);
        }

        const validClis = ["kimi-cli", "codex-cli", "qwen-cli", "gemini-cli"];
        if (!validClis.includes(cli)) {
          console.error(`Unknown CLI: ${cli}. Valid options: ${validClis.join(", ")}`);
          process.exit(1);
        }

        console.log(`🔄 Refreshing token for ${cli}...\n`);

        // Get the token hash from history
        const history = service.getHistory();
        const entry = history.discovered.find((e) => e.cli === cli);

        if (!entry) {
          console.error(`No token found for ${cli}. Run 'openclaw token-discovery scan' first.`);
          process.exit(1);
        }

        const result = await service.refreshToken(cli as CliType, entry.tokenHash, options.method);

        if (result.success) {
          console.log("✅ Token refreshed successfully!");
        } else {
          console.error(`❌ Failed: ${result.error}`);
          if (result.needsManualInput) {
            console.log("\nPlease generate a new API key and run:");
            console.log(`  openclaw token-discovery import-manual ${cli} <your-api-key>`);
          }
          process.exit(1);
        }
      });

    // Import manual token command
    cmd
      .command("import-manual <cli> <token>")
      .description("Manually import a token for a CLI")
      .action(async (cli: string, token: string) => {
        if (!service) {
          console.error("Service not initialized");
          process.exit(1);
        }

        const validClis = ["kimi-cli", "codex-cli", "qwen-cli", "gemini-cli"];
        if (!validClis.includes(cli)) {
          console.error(`Unknown CLI: ${cli}. Valid options: ${validClis.join(", ")}`);
          process.exit(1);
        }

        console.log(`📥 Importing manual token for ${cli}...`);

        const result = await service.importManualToken(cli as CliType, token);

        if (result.success) {
          console.log("✅ Token imported successfully!");
        } else {
          console.error(`❌ Failed: ${result.error}`);
          process.exit(1);
        }
      });

  }, { commands: ["token-discovery"] });
}

// Also export as object for alternative registration
export const plugin = {
  id: PLUGIN_ID,
  name: "CLI Token Auto-Discovery",
  description: "Auto-discover and import authentication tokens from installed AI CLIs",
  configSchema: {},
  register: cliTokenDiscoveryPlugin,
};
