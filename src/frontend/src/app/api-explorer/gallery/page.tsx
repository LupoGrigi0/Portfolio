'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Use relative URLs - nginx proxies /api/ to backend in production
// Falls back to NEXT_PUBLIC_API_URL for dev environments
const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '' // Production: use relative URLs (nginx proxies /api/ to backend)
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'; // Dev: use env var or localhost

interface ImageItem {
  id: string;
  filename: string;
  title?: string;
  urls?: {
    thumbnail?: string;
    original?: string;
  };
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam) : 1;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>('');
  const [pagination, setPagination] = useState<any>(null);
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [regenerateErrors, setRegenerateErrors] = useState<Map<string, any>>(new Map());
  const [bulkRegenerating, setBulkRegenerating] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPageImages(slug, page);
    }
  }, [slug, page]);

  async function fetchPageImages(slug: string, page: number) {
    setLoading(true);
    setError(null);

    console.log(`[Gallery View] Fetching page ${page} for: ${slug}`);

    try {
      const url = `${API_BASE}/api/content/collections/${slug}?page=${page}&limit=100`;
      console.log(`[Gallery View] GET ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      console.log(`[Gallery View] Response:`, data);

      if (!data.success) {
        setError(data.message || 'Failed to fetch collection');
        return;
      }

      const collection = data.data.collection;
      setCollectionName(collection.name || slug);
      setPagination(collection.pagination);
      setImages(collection.gallery || []);

      console.log(`[Gallery View] Loaded ${collection.gallery?.length || 0} images from page ${page}`);
    } catch (err) {
      console.error('[Gallery View] Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  function getImageUrl(image: ImageItem, size: 'thumbnail' | 'original' = 'thumbnail') {
    if (image.urls && image.urls[size]) {
      return `${API_BASE}${image.urls[size]}`;
    }
    // Fallback: construct URL manually
    return `${API_BASE}/api/media/${slug}/${image.filename}${size === 'thumbnail' ? '?size=thumbnail' : ''}`;
  }

  function openFullImage(image: ImageItem) {
    const url = getImageUrl(image, 'original');
    console.log(`[Gallery View] Opening full image: ${url}`);
    window.open(url, '_blank');
  }

  async function regenerateThumbnail(imageId: string, filename: string) {
    console.log(`[Gallery View] Regenerating thumbnail for: ${imageId} (${filename})`);

    setRegenerating(prev => new Set(prev).add(imageId));
    setRegenerateErrors(prev => {
      const next = new Map(prev);
      next.delete(imageId);
      return next;
    });

    try {
      const url = `${API_BASE}/api/thumbnails/regenerate/${imageId}?sizes=640&force=true`;
      console.log(`[Gallery View] POST ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log(`[Gallery View] Regenerate response:`, data);

      if (data.success) {
        // Reload the page to show new thumbnail
        setTimeout(() => {
          // Force reload image by adding cache buster
          const imgElements = document.querySelectorAll(`img[alt*="${filename}"]`);
          imgElements.forEach(img => {
            const src = (img as HTMLImageElement).src;
            (img as HTMLImageElement).src = src.includes('?')
              ? src + '&t=' + Date.now()
              : src + '?t=' + Date.now();
          });
        }, 500);
      } else {
        // Store full error details for display
        setRegenerateErrors(prev => new Map(prev).set(imageId, data));
      }
    } catch (err) {
      console.error(`[Gallery View] Error regenerating thumbnail:`, err);
      setRegenerateErrors(prev => new Map(prev).set(imageId, {
        success: false,
        message: `Network error: ${err}`,
        error: { message: String(err) }
      }));
    } finally {
      setRegenerating(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  }

  async function regenerateAllOnPage() {
    if (!confirm(`Regenerate thumbnails for all ${images.length} images on this page?\n\nThis will process them one at a time.`)) {
      return;
    }

    setBulkRegenerating(true);
    console.log(`[Gallery View] Bulk regenerating ${images.length} thumbnails...`);

    for (const image of images) {
      await regenerateThumbnail(image.id, image.filename);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setBulkRegenerating(false);
    console.log(`[Gallery View] Bulk regeneration complete`);
  }

  if (!slug) {
    return (
      <div style={{ padding: '20px', background: '#000', color: '#ff1493', minHeight: '100vh' }}>
        ERROR: No collection slug provided
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
          GALLERY VIEW: {collectionName} - Page {page}
        </h1>
        <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>
          Collection: {slug} {pagination && `(Page ${pagination.page} of ${pagination.totalPages})`}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ color: '#888' }}>
          Loading images from {slug}...
        </div>
      )}

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

      {/* Image count and bulk actions */}
      {!loading && images.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ color: '#ffff00', fontSize: '14px' }}>
            Found {images.length} images
          </div>
          <button
            onClick={regenerateAllOnPage}
            disabled={bulkRegenerating}
            style={{
              background: bulkRegenerating ? '#333' : '#330033',
              border: '1px solid #ff00ff',
              color: bulkRegenerating ? '#666' : '#ff00ff',
              cursor: bulkRegenerating ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              padding: '8px 16px',
              fontFamily: 'monospace',
            }}
            title="Regenerate 640w thumbnails for all images on this page"
          >
            {bulkRegenerating ? '⏳ Regenerating All...' : '🔄 Regenerate All on Page'}
          </button>
        </div>
      )}

      {/* No images */}
      {!loading && images.length === 0 && !error && (
        <div style={{ color: '#888' }}>
          No images found in this collection
        </div>
      )}

      {/* Image grid */}
      {!loading && images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {images.map((image, index) => {
            const isRegenerating = regenerating.has(image.id);
            const hasError = regenerateErrors.has(image.id);
            return (
            <div
              key={image.id || index}
              style={{
                border: `1px solid ${hasError ? '#ff0000' : '#00ff00'}`,
                padding: '8px',
                transition: 'all 0.2s',
                background: hasError ? '#220000' : '#001100',
                position: 'relative',
              }}
            >
              {/* Thumbnail with click to open */}
              <div
                onClick={() => openFullImage(image)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img
                  src={getImageUrl(image, 'thumbnail')}
                  alt={image.title || image.filename}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Show filename if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {isRegenerating && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00ffff',
                    fontSize: '12px',
                  }}>
                    🔄 Regenerating...
                  </div>
                )}
              </div>

              {/* Regenerate button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  regenerateThumbnail(image.id, image.filename);
                }}
                disabled={isRegenerating}
                style={{
                  width: '100%',
                  background: isRegenerating ? '#333' : '#003333',
                  border: '1px solid #00ffff',
                  color: isRegenerating ? '#666' : '#00ffff',
                  cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  fontSize: '10px',
                  padding: '4px',
                  marginBottom: '8px',
                }}
                title="Regenerate 640w thumbnail"
              >
                {isRegenerating ? '⏳ Regenerating...' : '🔄 Regenerate Thumbnail'}
              </button>

              {/* Filename */}
              <div style={{
                color: '#888',
                fontSize: '10px',
                wordBreak: 'break-all',
                lineHeight: '1.3',
              }}>
                {image.filename}
              </div>

              {/* API URL hints */}
              <div style={{ marginTop: '4px', fontSize: '9px', color: '#444' }}>
                <div>Thumb: ...?size=thumbnail</div>
                <div>Full: /api/media/{slug}/{image.filename}</div>
              </div>

              {/* Error diagnostic display */}
              {hasError && regenerateErrors.get(image.id) && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#330000',
                  border: '1px solid #ff0000',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: '#ff1493', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ✗ REGENERATION FAILED
                  </div>
                  <div style={{ color: '#ff8888', fontSize: '9px', wordBreak: 'break-word' }}>
                    {regenerateErrors.get(image.id).message}
                  </div>
                  {regenerateErrors.get(image.id).error?.details && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ color: '#ffaa00', fontSize: '9px', cursor: 'pointer' }}>
                        📋 Diagnostic Details
                      </summary>
                      <pre style={{
                        color: '#888',
                        fontSize: '8px',
                        marginTop: '4px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}>
                        {JSON.stringify(regenerateErrors.get(image.id).error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
            );
          })}
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
        <div style={{ color: '#00ffff', marginBottom: '8px' }}>USAGE:</div>
        <div>• Click any thumbnail to open full-resolution image in new tab</div>
        <div>• 🔄 Regenerate Thumbnail button regenerates 640w thumbnail for that image</div>
        <div>• 🔄 Regenerate All on Page processes all images sequentially (with 200ms delay)</div>
        <div>• Red border indicates regeneration error - expand 📋 Diagnostic Details to see full error</div>
        <div>• Tests both thumbnail API (?size=thumbnail) and full image API</div>
        <div>• Shows one page at a time (max 100 images) to avoid rate limiting</div>
        <div>• Console shows all API calls, responses, and error diagnostics</div>

        <div style={{ color: '#00ffff', marginTop: '16px', marginBottom: '8px' }}>ERROR DIAGNOSTICS:</div>
        <div>Viktor's API returns comprehensive error information:</div>
        <div style={{ marginLeft: '16px', marginTop: '4px' }}>
          <div>• <span style={{ color: '#ff1493' }}>IMAGE_NOT_FOUND</span> - Image ID doesn't exist in database</div>
          <div>• <span style={{ color: '#ff1493' }}>SOURCE_FILE_ERROR</span> - File doesn't exist, path too long (Windows MAX_PATH), or permission denied</div>
          <div>• <span style={{ color: '#ff1493' }}>SHARP_ERROR</span> - Image processing failed (corrupted file, unsupported format)</div>
          <div>• <span style={{ color: '#ff8888' }}>Details include:</span> filename, path, pathLength, fileExists, platform, reason, suggestion</div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '20px', background: '#000', color: '#888', minHeight: '100vh' }}>
        Loading gallery viewer...
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
