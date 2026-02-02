/**
 * Token Discovery Panel for OpenClaw Control UI
 * 
 * This component renders in the Control UI dashboard and allows users to:
 * - View discovered tokens
 * - Trigger manual scans
 * - Configure auto-import settings
 * - View usage statistics
 * - Refresh expired/invalid tokens
 */

import React, { useState, useEffect, useCallback } from "react";

// Types matching the backend API
interface TokenEntry {
  cli: string;
  provider: string;
  profileId: string;
  tokenType: "api_key" | "oauth";
  tokenHash: string;
  detectedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  status: "active" | "expired" | "invalid" | "revoked";
  consecutiveFailures: number;
  lastError?: string;
}

interface DiscoveryStatus {
  enabledClis: number;
  discoveredTokens: number;
  activeTokens: number;
  lastScanAt?: string;
  rotation?: {
    strategy: string;
    totalActive: number;
    totalUsage: number;
    byCli: Record<string, { count: number; usage: number }>;
  };
}

interface ScanResult {
  scanned: number;
  found: number;
  tokens: Array<{
    cli: string;
    provider: string;
    profileId: string;
    tokenType: string;
    tokenHash: string;
    detectedAt: string;
  }>;
  errors: string[];
}

// Lazy load the refresh modal
const TokenRefreshModal = React.lazy(() => import("./token-refresh-modal.js"));

// Status badge component
const StatusBadge: React.FC<{ status: TokenEntry["status"] }> = ({ status }) => {
  const colors = {
    active: "#22c55e",
    expired: "#f97316",
    invalid: "#ef4444",
    revoked: "#6b7280",
  };

  const labels = {
    active: "Active",
    expired: "Expired",
    invalid: "Invalid",
    revoked: "Revoked",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: `${colors[status]}20`,
        color: colors[status],
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: colors[status],
          marginRight: "6px",
        }}
      />
      {labels[status]}
    </span>
  );
};

// Main panel component
export const TokenDiscoveryPanel: React.FC = () => {
  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [history, setHistory] = useState<TokenEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshingToken, setRefreshingToken] = useState<TokenEntry | null>(null);
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);

  // Fetch status and history
  const fetchData = useCallback(async () => {
    try {
      const statusRes = await fetch("/api/gateway/rpc/tokenDiscovery.status");
      const historyRes = await fetch("/api/gateway/rpc/tokenDiscovery.getHistory");

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.result) {
          setStatus(statusData.result);
        }
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.result?.discovered) {
          setHistory(historyData.result.discovered);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Trigger scan
  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    try {
      const res = await fetch("/api/gateway/rpc/tokenDiscovery.scan", {
        method: "POST",
      });
      const data = await res.json();

      if (data.result) {
        setScanResult(data.result);
        await fetchData();
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  // Open refresh modal
  const handleRefreshClick = (token: TokenEntry) => {
    setRefreshingToken(token);
    setIsRefreshModalOpen(true);
  };

  // Handle token refresh
  const handleRefresh = async (method: string): Promise<{
    success: boolean;
    error?: string;
    needsManualInput?: boolean;
  }> => {
    if (!refreshingToken) return { success: false, error: "No token selected" };

    try {
      const res = await fetch("/api/gateway/rpc/tokenDiscovery.refreshToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cli: refreshingToken.cli,
          tokenHash: refreshingToken.tokenHash,
          method,
        }),
      });

      const data = await res.json();

      if (data.result?.success) {
        await fetchData(); // Refresh the list
        return { success: true };
      }

      return {
        success: false,
        error: data.error || data.result?.error,
        needsManualInput: data.result?.needsManualInput,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Refresh failed",
      };
    }
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  // Format relative time
  const formatRelative = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Check if token needs refresh
  const needsRefresh = (token: TokenEntry): boolean => {
    return token.status === "expired" || token.status === "invalid" || token.consecutiveFailures >= 3;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
            Token Discovery
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
            Auto-discover and manage CLI authentication tokens
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: isScanning ? "#9ca3af" : "#3b82f6",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            cursor: isScanning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isScanning ? (
            <>
              <span className="spinner" />
              Scanning...
            </>
          ) : (
            "🔍 Scan Now"
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {/* Scan result */}
      {scanResult && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#dbeafe",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>
            ✅ Scan Complete
          </h3>
          <p style={{ margin: 0, color: "#374151" }}>
            Scanned {scanResult.scanned} sources, found {scanResult.found} tokens
          </p>
          {scanResult.errors.length > 0 && (
            <details style={{ marginTop: "12px" }}>
              <summary style={{ color: "#6b7280", cursor: "pointer" }}>
                {scanResult.errors.length} errors
              </summary>
              <ul style={{ marginTop: "8px", color: "#dc2626" }}>
                {scanResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Stats cards */}
      {status && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            label="Enabled CLIs"
            value={status.enabledClis}
            subtitle="Sources configured"
          />
          <StatCard
            label="Discovered"
            value={status.discoveredTokens}
            subtitle="Total tokens found"
          />
          <StatCard
            label="Active"
            value={status.activeTokens}
            subtitle="Ready to use"
            highlight
          />
          <StatCard
            label="Needs Refresh"
            value={history.filter(needsRefresh).length}
            subtitle="Expired or invalid"
            warning={history.filter(needsRefresh).length > 0}
          />
          <StatCard
            label="Last Scan"
            value={formatRelative(status.lastScanAt)}
            subtitle={formatDate(status.lastScanAt)}
          />
        </div>
      )}

      {/* Token list */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Discovered Tokens
          </h2>
        </div>

        {history.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <p>No tokens discovered yet.</p>
            <p style={{ fontSize: "14px" }}>
              Click "🔍 Scan Now" to search for CLI authentications.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={tableHeaderStyle}>CLI</th>
                <th style={tableHeaderStyle}>Provider</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Usage</th>
                <th style={tableHeaderStyle}>Last Used</th>
                <th style={tableHeaderStyle}>Detected</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr
                  key={entry.tokenHash}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                  }}
                >
                  <td style={tableCellStyle}>
                    <code
                      style={{
                        padding: "2px 6px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {entry.cli}
                    </code>
                  </td>
                  <td style={tableCellStyle}>{entry.provider}</td>
                  <td style={tableCellStyle}>
                    <StatusBadge status={entry.status} />
                  </td>
                  <td style={tableCellStyle}>{entry.usageCount}</td>
                  <td style={tableCellStyle}>
                    {formatRelative(entry.lastUsedAt)}
                  </td>
                  <td style={tableCellStyle}>
                    {formatRelative(entry.detectedAt)}
                  </td>
                  <td style={tableCellStyle}>
                    {needsRefresh(entry) && (
                      <button
                        onClick={() => handleRefreshClick(entry)}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={entry.lastError || "Token needs refresh"}
                      >
                        🔄 Refresh
                      </button>
                    )}
                    {entry.status === "active" && (
                      <button
                        onClick={() => handleRefreshClick(entry)}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "transparent",
                          color: "#6b7280",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        🔄 Re-auth
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rotation stats */}
      {status?.rotation && status.rotation.totalActive > 1 && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>
            🔄 Rotation Strategy: {status.rotation.strategy}
          </h3>
          <p style={{ margin: "0 0 12px", color: "#374151" }}>
            Total usage: {status.rotation.totalUsage} requests distributed across{" "}
            {status.rotation.totalActive} active tokens
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {Object.entries(status.rotation.byCli).map(([cli, stats]) => (
              <div
                key={cli}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <code>{cli}</code>: {stats.usage} uses
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Modal */}
      {isRefreshModalOpen && refreshingToken && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <TokenRefreshModal
            token={refreshingToken}
            isOpen={isRefreshModalOpen}
            onClose={() => {
              setIsRefreshModalOpen(false);
              setRefreshingToken(null);
            }}
            onRefresh={handleRefresh}
          />
        </React.Suspense>
      )}
    </div>
  );
};

// Stat card component
const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtitle: string;
  highlight?: boolean;
  warning?: boolean;
}> = ({ label, value, subtitle, highlight, warning }) => (
  <div
    style={{
      padding: "16px",
      backgroundColor: highlight ? "#eff6ff" : warning ? "#fef3c7" : "white",
      border: `1px solid ${highlight ? "#bfdbfe" : warning ? "#fcd34d" : "#e5e7eb"}`,
      borderRadius: "8px",
    }}
  >
    <p
      style={{
        margin: "0 0 4px",
        fontSize: "12px",
        fontWeight: 500,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: "0 0 4px",
        fontSize: "28px",
        fontWeight: 700,
        color: highlight ? "#2563eb" : warning ? "#b45309" : "#111827",
      }}
    >
      {value}
    </p>
    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>{subtitle}</p>
  </div>
);

// Styles
const tableHeaderStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "14px",
  color: "#374151",
};

export default TokenDiscoveryPanel;
