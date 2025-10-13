'use client';

import { useState, useEffect } from 'react';
import AdminPanel from './admin-panel';

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  heroImage?: string;
  imageCount: number;
  videoCount: number;
  subcollections: string[]; // Array of slug names
  config?: any; // Config.json data (if exists)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const API_BASE = 'http://localhost:4000';

export default function APIExplorer() {
  const [topLevelSlugs, setTopLevelSlugs] = useState<string[]>([]);
  const [collectionData, setCollectionData] = useState<Map<string, CollectionData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set());
  const [fetchingSet, setFetchingSet] = useState<Set<string>>(new Set());
  const [collapsedDetails, setCollapsedDetails] = useState<Set<string>>(new Set()); // Track collapsed collection details

  // Fetch all top-level collections on mount
  useEffect(() => {
    fetchTopLevelCollections();
  }, []);

  async function fetchTopLevelCollections() {
    setLoading(true);
    setError(null);

    console.log(`[API Explorer] GET ${API_BASE}/api/content/collections`);

    try {
      const response = await fetch(`${API_BASE}/api/content/collections`);
      const data = await response.json();

      console.log(`[API Explorer] Response:`, data);

      if (data.success) {
        const collections = data.data.collections;
        const slugs = collections.map((c: any) => c.slug);
        setTopLevelSlugs(slugs);

        // Store initial data for top-level collections
        const newData = new Map<string, CollectionData>();
        collections.forEach((c: any) => {
          newData.set(c.slug, {
            id: c.id,
            name: c.name,
            slug: c.slug,
            heroImage: c.heroImage,
            imageCount: c.imageCount,
            videoCount: c.videoCount,
            subcollections: c.subcollections || [],
            config: c.config, // Store config if present
          });
        });
        setCollectionData(newData);

        // Start with all collections collapsed for clean initial view
        setCollapsedDetails(new Set(slugs));

        // Fetch detailed data (including pagination) for all top-level collections
        console.log(`[API Explorer] Fetching pagination data for ${slugs.length} collections...`);
        slugs.forEach((slug: string) => {
          fetchCollectionDetails(slug);
        });
      } else {
        setError(data.message || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('[API Explorer] Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCollectionDetails(slug: string) {
    // Prevent duplicate fetches
    if (fetchingSet.has(slug)) {
      console.log(`[API Explorer] Already fetching ${slug}, skipping...`);
      return;
    }

    setFetchingSet(prev => new Set(prev).add(slug));

    console.log(`[API Explorer] GET ${API_BASE}/api/content/collections/${slug}`);

    try {
      const response = await fetch(`${API_BASE}/api/content/collections/${slug}`);
      const data = await response.json();

      console.log(`[API Explorer] Response:`, data);

      if (data.success) {
        const collection = data.data.collection;
        setCollectionData(prev => new Map(prev).set(slug, {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          heroImage: collection.heroImage,
          imageCount: collection.imageCount,
          videoCount: collection.videoCount,
          subcollections: collection.subcollections || [],
          config: collection.config, // Store config if present
          pagination: collection.pagination,
        }));
      }
    } catch (err) {
      console.error(`[API Explorer] Error fetching ${slug}:`, err);
    } finally {
      setFetchingSet(prev => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  }

  function toggleExpanded(slug: string) {
    setExpandedSlugs(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
        // Fetch details when expanding (for pagination info)
        if (!collectionData.get(slug)?.pagination) {
          fetchCollectionDetails(slug);
        }
        // Fetch all subcollections
        const data = collectionData.get(slug);
        if (data?.subcollections) {
          data.subcollections.forEach(subSlug => {
            if (!collectionData.has(subSlug)) {
              fetchCollectionDetails(subSlug);
            }
          });
        }
      }
      return next;
    });
  }

  function toggleCollapsedDetails(slug: string) {
    setCollapsedDetails(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function openHeroImage(heroImagePath: string) {
    // heroImagePath already contains the full API path like "/api/media/scientists/hero.jfif"
    const url = `${API_BASE}${heroImagePath}`;
    console.log(`[API Explorer] Opening hero image: ${url}`);
    window.open(url, '_blank');
  }

  function openPage(slug: string, page: number) {
    const url = `${API_BASE}/api/content/collections/${slug}?page=${page}&limit=100`;
    console.log(`[API Explorer] Opening page ${page}: ${url}`);
    window.open(url, '_blank');
  }

  function openGalleryView(slug: string, page: number = 1) {
    const url = `/api-explorer/gallery?slug=${slug}&page=${page}`;
    console.log(`[API Explorer] Opening gallery view for page ${page}: ${url}`);
    window.open(url, '_blank');
  }

  function openConfig(slug: string, config: any) {
    // Open a new tab with formatted JSON and download button
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      const configJson = JSON.stringify(config, null, 2);
      newWindow.document.write(`
        <html>
          <head>
            <title>Config: ${slug}</title>
            <style>
              body {
                background: #000;
                color: #00ff00;
                font-family: monospace;
                padding: 20px;
              }
              pre {
                background: #001100;
                border: 1px solid #00ff00;
                padding: 20px;
                overflow: auto;
              }
              button {
                background: #003300;
                border: 1px solid #00ff00;
                color: #00ff00;
                cursor: pointer;
                font-family: monospace;
                font-size: 14px;
                padding: 8px 16px;
                margin-top: 16px;
              }
              button:hover {
                background: #004400;
              }
            </style>
          </head>
          <body>
            <h1 style="color: #00ffff;">Config: ${slug}</h1>
            <button onclick="downloadConfig()">💾 Download config.json</button>
            <pre>${configJson}</pre>
            <script>
              function downloadConfig() {
                const blob = new Blob([${JSON.stringify(configJson)}], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '${slug}-config.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
    console.log(`[API Explorer] Opening config for ${slug}:`, config);
  }

  function downloadConfig(slug: string, config: any) {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[API Explorer] Downloaded config for ${slug}`);
  }

  async function rescanCollection(slug: string, mode: 'full' | 'lightweight') {
    console.log(`[API Explorer] POST ${API_BASE}/api/admin/scan/${slug}?mode=${mode}`);

    try {
      const response = await fetch(`${API_BASE}/api/admin/scan/${slug}?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      console.log(`[API Explorer] Rescan response:`, data);

      if (data.success) {
        alert(`✓ ${mode === 'full' ? 'Full' : 'Lightweight'} rescan initiated for ${slug}`);
        // Refresh collection data after a delay
        setTimeout(() => fetchCollectionDetails(slug), 2000);
      } else {
        alert(`Error: ${data.message || 'Scan failed'}`);
      }
    } catch (err) {
      console.error(`[API Explorer] Error rescanning ${slug}:`, err);
      alert(`Network error: ${err}`);
    }
  }

  function renderCollection(slug: string, depth: number = 0) {
    const data = collectionData.get(slug);

    if (!data) {
      // Still loading this collection
      return (
        <div key={slug} style={{ marginLeft: `${depth * 20}px`, color: '#888', fontSize: '12px' }}>
          Loading {slug}...
        </div>
      );
    }

    const isExpanded = expandedSlugs.has(slug);
    const hasSubcollections = data.subcollections && data.subcollections.length > 0;
    const hasHero = data.heroImage !== null && data.heroImage !== undefined;
    const hasConfig = data.config !== null && data.config !== undefined;
    const isDetailsCollapsed = collapsedDetails.has(slug);

    return (
      <div key={slug} style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '4px' }}>
        {/* Collection name and toggle */}
        <div style={{ marginLeft: `${depth * 20}px`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Details collapse twistie - ALWAYS shown */}
          <button
            onClick={() => toggleCollapsedDetails(slug)}
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff00',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 4px',
            }}
            title={isDetailsCollapsed ? 'Expand details' : 'Collapse details'}
          >
            {isDetailsCollapsed ? '▶' : '▼'}
          </button>

          {/* Subcollections expand twistie - only for collections with subcollections */}
          {hasSubcollections && (
            <button
              onClick={() => toggleExpanded(slug)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffaa00',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 4px',
              }}
              title={isExpanded ? 'Collapse subcollections' : 'Expand subcollections'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}

          <span style={{ color: '#00ffff' }}>
            {depth > 0 ? '├─ ' : ''}{data.name}
          </span>

          <span style={{ color: '#888', fontSize: '12px' }}>
            ({data.slug})
          </span>
        </div>

        {/* Collection info row - only shown when NOT collapsed */}
        {!isDetailsCollapsed && (
        <>
          {/* Hero image thumbnail - shown when expanded and has hero */}
          {hasHero && data.heroImage && (
            <div style={{ marginLeft: `${depth * 20 + 30}px`, marginTop: '8px', marginBottom: '8px' }}>
              <img
                src={`${API_BASE}${data.heroImage}?size=thumbnail`}
                alt={`${data.name} hero`}
                style={{
                  maxWidth: '120px',
                  maxHeight: '80px',
                  border: '2px solid #00ff00',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
                onClick={() => openHeroImage(data.heroImage!)}
                title="Click to open full-resolution hero image"
              />
            </div>
          )}

        <div style={{ marginLeft: `${depth * 20 + 30}px`, display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
          {/* Hero image indicator */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: hasHero ? '#00ff00' : '#ff1493', fontSize: '16px' }}>
              {hasHero ? '✓' : '✗'}
            </span>
            <span style={{ color: '#888', fontSize: '12px' }}>Hero</span>
            {hasHero && data.heroImage && (
              <button
                onClick={() => openHeroImage(data.heroImage!)}
                style={{
                  background: 'none',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 6px',
                  textDecoration: 'underline',
                }}
              >
                View Hero
              </button>
            )}
          </div>

          {/* Config indicator */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: hasConfig ? '#00ff00' : '#ff1493', fontSize: '16px' }}>
              {hasConfig ? '✓' : '✗'}
            </span>
            <span style={{ color: '#888', fontSize: '12px' }}>Config</span>
            {hasConfig && data.config && (
              <>
                <button
                  onClick={() => openConfig(slug, data.config)}
                  style={{
                    background: 'none',
                    border: '1px solid #00ff00',
                    color: '#00ff00',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 6px',
                    textDecoration: 'underline',
                  }}
                >
                  View Config
                </button>
                <button
                  onClick={() => downloadConfig(slug, data.config)}
                  style={{
                    background: 'none',
                    border: '1px solid #00ff00',
                    color: '#00ff00',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 6px',
                  }}
                  title="Download config.json"
                >
                  💾
                </button>
              </>
            )}
          </div>

          {/* Image count */}
          <span style={{ color: '#ffff00' }}>
            {data.imageCount} images
          </span>

          {/* Video count */}
          {data.videoCount > 0 && (
            <span style={{ color: '#ff8800' }}>
              {data.videoCount} videos
            </span>
          )}

          {/* Rescan buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                rescanCollection(slug, 'full');
              }}
              style={{
                background: '#330033',
                border: '1px solid #ff00ff',
                color: '#ff00ff',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 6px',
              }}
              title="Full rescan - purges and rebuilds database"
            >
              🔄 Full
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                rescanCollection(slug, 'lightweight');
              }}
              style={{
                background: '#003333',
                border: '1px solid #00ffff',
                color: '#00ffff',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 6px',
              }}
              title="Lightweight scan - minimal metadata"
            >
              ⚡ Light
            </button>
          </div>
        </div>

        {/* Pagination links with per-page gallery view - ALWAYS shown */}
        <div style={{ marginLeft: `${depth * 20 + 30}px`, marginTop: '8px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Pages: </span>
          {data.pagination ? (
            // Has pagination data - show all pages
            Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
              <span key={pageNum} style={{ marginRight: '8px', display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                <button
                  onClick={() => openPage(slug, pageNum)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4488ff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '0 2px',
                    textDecoration: 'underline',
                  }}
                >
                  {pageNum}
                </button>
                {data.imageCount > 0 && (
                  <button
                    onClick={() => openGalleryView(slug, pageNum)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00ff00',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0',
                      lineHeight: '1',
                    }}
                    title={`View gallery for page ${pageNum}`}
                  >
                    📷
                  </button>
                )}
              </span>
            ))
          ) : (
            // No pagination data yet - show default "1" with gallery link
            <span style={{ marginRight: '8px', display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
              <button
                onClick={() => openPage(slug, 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4488ff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '0 2px',
                  textDecoration: 'underline',
                }}
              >
                1
              </button>
              {data.imageCount > 0 && (
                <button
                  onClick={() => openGalleryView(slug, 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00ff00',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0',
                    lineHeight: '1',
                  }}
                  title="View gallery for page 1"
                >
                  📷
                </button>
              )}
            </span>
          )}
        </div>
        </>
        )}

        {/* Subcollections (if expanded) */}
        {isExpanded && hasSubcollections && (
          <div style={{ marginTop: '8px' }}>
            {data.subcollections.map(subSlug => renderCollection(subSlug, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#00ff00',
      padding: '20px',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #00ff00', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#00ffff', fontSize: '24px', margin: 0 }}>
          API EXPLORER v1.0
        </h1>
        <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>
          Backend API Diagnostic Tool
        </p>
      </div>

      {/* Admin Panel */}
      <AdminPanel
        onRefresh={fetchTopLevelCollections}
        collectionData={collectionData}
        topLevelSlugs={topLevelSlugs}
      />

      {/* Refresh button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={fetchTopLevelCollections}
          disabled={loading}
          style={{
            background: '#003300',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            padding: '8px 16px',
          }}
        >
          {loading ? 'Loading...' : 'Refresh Collections'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          background: '#330000',
          border: '1px solid #ff0000',
          color: '#ff1493',
          padding: '12px',
          marginBottom: '20px',
        }}>
          ERROR: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ color: '#888' }}>
          Fetching collections from {API_BASE}/api/content/collections ...
        </div>
      )}

      {/* Collections tree */}
      {!loading && topLevelSlugs.length > 0 && (
        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
            Found {topLevelSlugs.length} top-level collections
          </div>

          {topLevelSlugs.map(slug => renderCollection(slug, 0))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        borderTop: '1px solid #333',
        marginTop: '40px',
        paddingTop: '20px',
        color: '#888',
        fontSize: '12px',
      }}>
        <div style={{ color: '#00ffff', marginBottom: '8px' }}>LEGEND:</div>
        <div><span style={{ color: '#00ff00' }}>✓</span> Has hero image / config.json</div>
        <div><span style={{ color: '#ff1493' }}>✗</span> Missing hero image / config.json</div>
        <div><span style={{ color: '#ffff00' }}>Yellow</span> - Image counts</div>
        <div><span style={{ color: '#4488ff', textDecoration: 'underline' }}>Blue underline</span> - Clickable page links (open API response in new tab)</div>
        <div><span style={{ color: '#00ff00', border: '1px solid #00ff00', padding: '2px 4px' }}>Green buttons</span> - View Hero/Config/Gallery</div>
        <div>📷 - Open gallery view for that page</div>
        <div style={{ marginTop: '8px' }}>
          <span style={{ color: '#888' }}>▶/▼</span> Click to expand/collapse subcollections
        </div>
      </div>
    </div>
  );
}
