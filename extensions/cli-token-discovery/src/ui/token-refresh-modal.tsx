/**
 * Token Refresh Modal - UI for re-authenticating expired/invalid tokens
 */

import React, { useState, useCallback } from "react";

export type RefreshMethod = "oauth-browser" | "api-key-web" | "cli-command" | "manual";

interface TokenEntry {
  cli: string;
  provider: string;
  profileId: string;
  tokenType: "api_key" | "oauth";
  tokenHash: string;
  status: "active" | "expired" | "invalid" | "revoked";
  lastError?: string;
}

interface RefreshModalProps {
  token: TokenEntry;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (method: RefreshMethod) => Promise<{
    success: boolean;
    error?: string;
    needsManualInput?: boolean;
  }>;
}

interface RefreshMethodInfo {
  id: RefreshMethod;
  label: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

const getRefreshMethods = (cli: string, tokenType: string): RefreshMethodInfo[] => {
  const methods: Record<string, RefreshMethodInfo[]> = {
    "kimi-cli": [
      {
        id: "api-key-web",
        label: "Generate New API Key",
        description: "Open the Moonshot platform to create a new API key",
        icon: "🔑",
        recommended: true,
      },
      {
        id: "manual",
        label: "Manual Entry",
        description: "Enter a new API key manually",
        icon: "✏️",
      },
    ],
    "codex-cli": [
      {
        id: "cli-command",
        label: "Run codex login",
        description: "Execute 'codex login' in terminal",
        icon: "💻",
        recommended: true,
      },
      {
        id: "api-key-web",
        label: "OpenAI Platform",
        description: "Open platform.openai.com to generate a new key",
        icon: "🔑",
      },
      {
        id: "manual",
        label: "Manual Entry",
        description: "Enter API key or token manually",
        icon: "✏️",
      },
    ],
    "qwen-cli": [
      {
        id: "oauth-browser",
        label: "Browser Login",
        description: "Open Qwen website and log in",
        icon: "🌐",
        recommended: true,
      },
      {
        id: "api-key-web",
        label: "Bailian Platform",
        description: "Open Alibaba Cloud Bailian console",
        icon: "🔑",
      },
    ],
    "gemini-cli": [
      {
        id: "oauth-browser",
        label: "Google Login",
        description: "Sign in with your Google account",
        icon: "🌐",
        recommended: true,
      },
      {
        id: "cli-command",
        label: "Run gemini login",
        description: "Execute 'gemini login' in terminal",
        icon: "💻",
      },
    ],
  };

  return methods[cli] || [
    {
      id: "manual",
      label: "Manual Refresh",
      description: "Re-authenticate manually",
      icon: "✏️",
    },
  ];
};

export const TokenRefreshModal: React.FC<RefreshModalProps> = ({
  token,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<RefreshMethod | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    needsManualInput?: boolean;
  } | null>(null);
  const [manualKey, setManualKey] = useState("");

  const methods = getRefreshMethods(token.cli, token.tokenType);

  const handleRefresh = useCallback(async () => {
    if (!selectedMethod) return;

    setIsRefreshing(true);
    setResult(null);

    try {
      const response = await onRefresh(selectedMethod);
      setResult(response);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Refresh failed",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedMethod, onRefresh]);

  const handleManualSubmit = useCallback(async () => {
    if (!manualKey.trim()) return;

    setIsRefreshing(true);
    
    try {
      // Submit manual key via RPC
      const res = await fetch("/api/gateway/rpc/tokenDiscovery.importManual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cli: token.cli,
          token: manualKey.trim(),
        }),
      });
      
      const data = await res.json();
      setResult({
        success: data.result?.success ?? false,
        error: data.error,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Import failed",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [manualKey, token.cli]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            Refresh Token
          </h2>
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "14px" }}>
            Re-authenticate <code>{token.cli}</code> ({token.provider})
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {/* Status warning */}
          {token.status !== "active" && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fee2e2",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p style={{ margin: 0, color: "#dc2626", fontSize: "14px" }}>
                ⚠️ Token status: <strong>{token.status}</strong>
              </p>
              {token.lastError && (
                <p style={{ margin: "4px 0 0", color: "#991b1b", fontSize: "12px" }}>
                  {token.lastError}
                </p>
              )}
            </div>
          )}

          {/* Result display */}
          {result && (
            <div
              style={{
                padding: "16px",
                backgroundColor: result.success ? "#dcfce7" : "#fee2e2",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: result.success ? "#166534" : "#dc2626",
                  fontWeight: 500,
                }}
              >
                {result.success ? "✅ Success!" : "❌ Failed"}
              </p>
              {result.error && (
                <p
                  style={{
                    margin: "8px 0 0",
                    color: result.success ? "#166534" : "#991b1b",
                    fontSize: "14px",
                  }}
                >
                  {result.error}
                </p>
              )}
              {result.needsManualInput && (
                <p style={{ margin: "8px 0 0", color: "#92400e", fontSize: "14px" }}>
                  Please paste your new API key below after generating it.
                </p>
              )}
            </div>
          )}

          {/* Manual input */}
          {result?.needsManualInput || selectedMethod === "manual" ? (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Enter API Key / Token
              </label>
              <textarea
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualKey.trim() || isRefreshing}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "12px",
                  backgroundColor: manualKey.trim() ? "#3b82f6" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: manualKey.trim() ? "pointer" : "not-allowed",
                }}
              >
                {isRefreshing ? "Importing..." : "Import Token"}
              </button>
            </div>
          ) : (
            <>
              {/* Method selection */}
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Choose refresh method:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={isRefreshing}
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      border: "2px solid",
                      borderColor: selectedMethod === method.id ? "#3b82f6" : "#e5e7eb",
                      backgroundColor: selectedMethod === method.id ? "#eff6ff" : "white",
                      textAlign: "left",
                      cursor: isRefreshing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      opacity: isRefreshing ? 0.6 : 1,
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{method.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: selectedMethod === method.id ? "#1e40af" : "#111827",
                          }}
                        >
                          {method.label}
                        </span>
                        {method.recommended && (
                          <span
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                          lineHeight: 1.4,
                        }}
                      >
                        {method.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={!selectedMethod || isRefreshing}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "14px",
                  backgroundColor: selectedMethod ? "#3b82f6" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: selectedMethod ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isRefreshing ? (
                  <>
                    <span className="spinner" />
                    Refreshing...
                  </>
                ) : (
                  "Start Refresh"
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenRefreshModal;
