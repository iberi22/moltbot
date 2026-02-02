import type { DiscoveredToken, TokenType } from "./types.js";
import { DEFAULT_MODELS } from "./types.js";
import { HistoryManager } from "./history-manager.js";

// Type definitions for OpenClaw's auth profile system
// These match the expected credential format
interface ApiKeyCredential {
  type: "api_key";
  provider: string;
  key: string;
}

interface OAuthCredential {
  type: "oauth";
  provider: string;
  access: string;
  refresh?: string;
  expires?: number;
  email?: string;
}

type Credential = ApiKeyCredential | OAuthCredential;

interface AuthProfile {
  profileId: string;
  credential: Credential;
}

interface ImportResult {
  success: boolean;
  profileId?: string;
  error?: string;
  alreadyExists?: boolean;
}

/**
 * Engine that imports discovered tokens into OpenClaw's auth system
 */
export class ImportEngine {
  private history: HistoryManager;
  private upsertAuthProfile: (profile: AuthProfile) => void;

  constructor(
    history: HistoryManager,
    upsertAuthProfileFn?: (profile: AuthProfile) => void
  ) {
    this.history = history;
    // In production, this would be injected from the plugin API
    this.upsertAuthProfile = upsertAuthProfileFn || this.defaultUpsertAuthProfile;
  }

  /**
   * Import a discovered token into OpenClaw's auth system
   */
  async importToken(token: DiscoveredToken): Promise<ImportResult> {
    try {
      // Check if already imported (by hash)
      const existing = this.history.getEntry(token.tokenHash);
      if (existing && existing.status === "active") {
        return {
          success: true,
          profileId: token.profileId,
          alreadyExists: true,
        };
      }

      // Convert to auth profile credential
      const credential = this.createCredential(token);

      // Create auth profile
      const profile: AuthProfile = {
        profileId: token.profileId,
        credential,
      };

      // Import into OpenClaw
      this.upsertAuthProfile(profile);

      // Update history
      await this.history.updateStatus(token.tokenHash, "active");

      return {
        success: true,
        profileId: token.profileId,
        alreadyExists: false,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.history.recordFailure(token.tokenHash, error);
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Import multiple tokens
   */
  async importTokens(tokens: DiscoveredToken[]): Promise<{
    imported: number;
    failed: number;
    skipped: number;
    results: ImportResult[];
  }> {
    const results: ImportResult[] = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;

    for (const token of tokens) {
      const result = await this.importToken(token);
      results.push(result);

      if (result.success) {
        if (result.alreadyExists) {
          skipped++;
        } else {
          imported++;
        }
      } else {
        failed++;
      }
    }

    return { imported, failed, skipped, results };
  }

  /**
   * Create credential object based on token type
   */
  private createCredential(token: DiscoveredToken): Credential {
    if (token.tokenType === "api_key") {
      return {
        type: "api_key",
        provider: token.provider,
        key: token.token,
      };
    } else {
      // OAuth
      const oauthCreds: OAuthCredential = {
        type: "oauth",
        provider: token.provider,
        access: token.token,
      };

      // Add optional OAuth fields from metadata
      if (token.metadata) {
        if (token.metadata.refreshToken && typeof token.metadata.refreshToken === "string") {
          oauthCreds.refresh = token.metadata.refreshToken;
        }
        if (token.metadata.expiresAt && typeof token.metadata.expiresAt === "number") {
          oauthCreds.expires = token.metadata.expiresAt;
        }
        if (token.metadata.email && typeof token.metadata.email === "string") {
          oauthCreds.email = token.metadata.email;
        }
      }

      return oauthCreds;
    }
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(provider: string): string | undefined {
    return DEFAULT_MODELS[provider];
  }

  /**
   * Default upsert function (placeholder)
   * In production, this is replaced by the actual OpenClaw API
   */
  private defaultUpsertAuthProfile(profile: AuthProfile): void {
    // This is a placeholder - the actual implementation
    // will be injected from the plugin API
    console.log(`[ImportEngine] Would import profile: ${profile.profileId}`);
  }
}
