'use client';

import { useState } from 'react';

const API_BASE = 'http://localhost:4000';

interface AdminPanelProps {
  onRefresh?: () => void;
  collectionData?: Map<string, any>;
  topLevelSlugs?: string[];
}

export default function AdminPanel({ onRefresh, collectionData, topLevelSlugs }: AdminPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  async function resetRateLimit() {
    setLoading('rate-limit');
    setResult(null);
    setError(null);

    console.log(`[Admin] POST ${API_BASE}/api/admin/reset-rate-limit`);

    try {
      const response = await fetch(`${API_BASE}/api/admin/reset-rate-limit`, { method: 'POST' });
      const data = await response.json();

      console.log(`[Admin] Response:`, data);

      if (data.success) {
        setResult(`✓ Rate limit reset for IP: ${data.data?.ip || 'current'}`);
      } else {
        setError(data.message || 'Failed to reset rate limit');
      }
    } catch (err) {
      console.error('[Admin] Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(null);
    }
  }

  async function scanAllCollections() {
    setLoading('scan-all');
    setResult(null);
    setError(null);

    console.log(`[Admin] POST ${API_BASE}/api/admin/scan`);

    try {
      const response = await fetch(`${API_BASE}/api/admin/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      console.log(`[Admin] Response:`, data);

      if (data.success) {
        setResult(`✓ Content scan initiated at ${data.data?.startedAt || 'now'}`);
        // Refresh collections after scan starts
        setTimeout(() => onRefresh?.(), 2000);
      } else {
        setError(data.message || 'Failed to start scan');
      }
    } catch (err) {
      console.error('[Admin] Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(null);
    }
  }

  async function checkHealth() {
    setLoading('health');
    setResult(null);
    setError(null);

    console.log(`[Admin] GET ${API_BASE}/api/health`);

    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();

      console.log(`[Admin] Response:`, data);

      if (data.status === 'healthy') {
        const uptimeSeconds = data.uptime || 0;
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const uptimeDays = Math.floor(uptimeHours / 24);

        let uptimeStr = '';
        if (uptimeDays > 0) uptimeStr += `${uptimeDays}d `;
        if (uptimeHours % 24 > 0) uptimeStr += `${uptimeHours % 24}h `;
        if (uptimeMinutes % 60 > 0) uptimeStr += `${uptimeMinutes % 60}m `;
        uptimeStr += `${Math.floor(uptimeSeconds % 60)}s`;

        setResult(`✓ Server healthy | Uptime: ${uptimeStr} | DB: ${data.database || 'connected'}`);
      } else {
        setError(`Server status: ${data.status}`);
      }
    } catch (err) {
      console.error('[Admin] Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(null);
    }
  }

  function exportCollectionTree() {
    if (!collectionData || !topLevelSlugs) {
      setError('No collection data available to export');
      return;
    }

    // Build tree structure
    function buildTree(slug: string): any {
      const data = collectionData.get(slug);
      if (!data) return null;

      const node: any = {
        slug: data.slug,
        name: data.name,
        imageCount: data.imageCount,
        videoCount: data.videoCount,
        hasHero: !!data.heroImage,
        hasConfig: !!data.config,
      };

      if (data.subcollections && data.subcollections.length > 0) {
        node.subcollections = data.subcollections.map((subSlug: string) => buildTree(subSlug)).filter(Boolean);
      }

      return node;
    }

    const tree = topLevelSlugs.map(slug => buildTree(slug)).filter(Boolean);
    const json = JSON.stringify({ collections: tree }, null, 2);

    // Download as JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-tree-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setResult(`✓ Collection tree exported (${topLevelSlugs.length} collections)`);
    console.log('[Admin] Exported collection tree:', tree);
  }

  function exportAllConfigs() {
    if (!collectionData) {
      setError('No collection data available to export');
      return;
    }

    const configs: any = {};
    let count = 0;

    collectionData.forEach((data, slug) => {
      if (data.config) {
        configs[slug] = data.config;
        count++;
      }
    });

    if (count === 0) {
      setError('No configs found to export');
      return;
    }

    const json = JSON.stringify(configs, null, 2);

    // Download as JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-configs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setResult(`✓ Exported ${count} configs`);
    console.log('[Admin] Exported configs:', configs);
  }

  return (
    <div style={{
      background: '#001a00',
      border: '2px solid #00ff00',
      padding: '16px',
      marginBottom: '20px',
      borderRadius: '4px',
    }}>
      {/* Header with twistie */}
      <div
        style={{
          borderBottom: '1px solid #00ff00',
          paddingBottom: '8px',
          marginBottom: isCollapsed ? '0' : '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#00ff00',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0',
          }}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#00ffff', fontSize: '18px', margin: 0 }}>
            ⚙️ ADMIN PANEL
          </h2>
          <p style={{ color: '#888', fontSize: '11px', margin: '4px 0 0 0' }}>
            Backend administration and diagnostics
          </p>
        </div>
      </div>

      {/* Action buttons - only shown when not collapsed */}
      {!isCollapsed && (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          onClick={resetRateLimit}
          disabled={loading !== null}
          style={{
            background: '#003300',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            opacity: loading !== null ? 0.5 : 1,
          }}
        >
          {loading === 'rate-limit' ? 'Resetting...' : '🔄 Reset Rate Limit'}
        </button>

        <button
          onClick={scanAllCollections}
          disabled={loading !== null}
          style={{
            background: '#003300',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            opacity: loading !== null ? 0.5 : 1,
          }}
        >
          {loading === 'scan-all' ? 'Scanning...' : '📁 Scan All Collections'}
        </button>

        <button
          onClick={checkHealth}
          disabled={loading !== null}
          style={{
            background: '#003300',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            opacity: loading !== null ? 0.5 : 1,
          }}
        >
          {loading === 'health' ? 'Checking...' : '💚 Server Health'}
        </button>

        <button
          onClick={exportCollectionTree}
          disabled={loading !== null || !collectionData || !topLevelSlugs}
          style={{
            background: '#001a33',
            border: '1px solid #4488ff',
            color: '#4488ff',
            cursor: loading !== null || !collectionData ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            opacity: loading !== null || !collectionData ? 0.5 : 1,
          }}
          title="Export collection tree as JSON"
        >
          📊 Export Tree
        </button>

        <button
          onClick={exportAllConfigs}
          disabled={loading !== null || !collectionData}
          style={{
            background: '#331a00',
            border: '1px solid #ffaa00',
            color: '#ffaa00',
            cursor: loading !== null || !collectionData ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            opacity: loading !== null || !collectionData ? 0.5 : 1,
          }}
          title="Download all config.json files as single JSON"
        >
          📦 Export Configs
        </button>
      </div>
      )}

      {/* Result/Error display */}
      {result && (
        <div style={{
          background: '#002200',
          border: '1px solid #00ff00',
          color: '#00ff00',
          padding: '8px 12px',
          fontSize: '12px',
          marginTop: '8px',
        }}>
          {result}
        </div>
      )}

      {error && (
        <div style={{
          background: '#330000',
          border: '1px solid #ff0000',
          color: '#ff1493',
          padding: '8px 12px',
          fontSize: '12px',
          marginTop: '8px',
        }}>
          ERROR: {error}
        </div>
      )}
    </div>
  );
}
