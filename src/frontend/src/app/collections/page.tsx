/**
 * Collections Browser Page
 *
 * Displays all available collections from Viktor's backend.
 * Real content served from E:\mnt\lupoportfolio\content\
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-30
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, Grid, ContentBlock } from '@/components/Layout';
import { getCollections, checkBackendHealth, type Collection } from '@/lib/api-client';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollections() {
      setLoading(true);

      // Check if backend is available
      const isOnline = await checkBackendHealth();
      setBackendOnline(isOnline);

      if (!isOnline) {
        setError('Backend API is not available. Make sure Viktor\'s server is running on port 4000.');
        setLoading(false);
        return;
      }

      // Fetch collections
      const data = await getCollections();
      setCollections(data);

      if (data.length === 0) {
        setError('No collections found. Viktor may need to run the content scanner.');
      }

      setLoading(false);
    }

    loadCollections();
  }, []);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading collections...</p>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center text-white max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">⚠️ Backend Connection Issue</h2>
              <p className="text-white/80 mb-4">{error}</p>

              {!backendOnline && (
                <div className="bg-black/30 p-6 rounded-lg text-left space-y-3">
                  <h3 className="font-semibold">To start Viktor&apos;s backend:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
                    <li>Open terminal in backend worktree</li>
                    <li>cd src/backend</li>
                    <li>npm run dev</li>
                    <li>Backend will start on http://localhost:4000</li>
                  </ol>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Retry Connection
              </button>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="normal">
        {/* Header */}
        <ContentBlock className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Collections
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} available
          </p>
          {backendOnline && (
            <p className="text-sm text-green-400/80 mt-2">
              ✓ Connected to Viktor&apos;s backend on port 4000
            </p>
          )}
        </ContentBlock>

        {/* Collections Grid */}
        <ContentBlock>
          <Grid variant="masonry" columns={3} spacing="normal">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group block bg-black/20 hover:bg-black/40 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-video bg-gray-800 relative">
                  {collection.heroImage ? (
                    <img
                      src={collection.heroImage}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/80 transition-colors">
                    {collection.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>{collection.imageCount} images</span>
                    {collection.videoCount > 0 && (
                      <span>{collection.videoCount} videos</span>
                    )}
                    {collection.subcollections && collection.subcollections.length > 0 && (
                      <span>{collection.subcollections.length} subcollections</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </Grid>
        </ContentBlock>

        {/* Info Footer */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm">
            Content served from Viktor&apos;s ContentScanner • E:\mnt\lupoportfolio\content\
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}