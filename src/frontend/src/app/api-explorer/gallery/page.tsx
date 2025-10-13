'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE = 'http://localhost:4000';

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

      {/* Image count */}
      {!loading && images.length > 0 && (
        <div style={{ color: '#ffff00', marginBottom: '20px', fontSize: '14px' }}>
          Found {images.length} images
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
          {images.map((image, index) => (
            <div
              key={image.id || index}
              onClick={() => openFullImage(image)}
              style={{
                border: '1px solid #00ff00',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: '#001100',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ffff';
                e.currentTarget.style.background = '#002200';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
                e.currentTarget.style.background = '#001100';
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                overflow: 'hidden',
              }}>
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
              </div>

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
            </div>
          ))}
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
        <div>• Tests both thumbnail API (?size=thumbnail) and full image API</div>
        <div>• Shows one page at a time (max 100 images) to avoid rate limiting</div>
        <div>• Console shows all API calls and image URLs</div>
        <div>• Each tile shows the API URL structure for that image</div>
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
