/**
 * Lightboard Test Page
 *
 * Demonstrates the click-to-select functionality for carousels with Lightboard designer.
 * This page loads a real collection from the API and demonstrates live preview functionality.
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import { useEffect, useState } from 'react';
import { LightboardWithToast, LightboardProvider } from '@/components/Lightboard';
import { LivePreview } from '@/components/Lightboard/LivePreview';
import { MidgroundProjectionProvider } from '@/components/Layout';
import { getCollection, type Collection } from '@/lib/api-client';

export default function LightboardTestPage() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load home collection on mount
  useEffect(() => {
    async function loadCollection() {
      try {
        setLoading(true);
        setError(null);

        // Try to load "home" collection, fallback to first available
        let data = await getCollection('home');

        if (!data) {
          // Try "couples" as fallback
          data = await getCollection('couples');
        }

        if (!data) {
          setError('No collections available. Please ensure backend is running.');
        } else {
          setCollection(data);
        }
      } catch (err) {
        console.error('Error loading collection:', err);
        setError('Failed to load collection from API');
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, []);

  if (loading) {
    return (
      <MidgroundProjectionProvider>
        <LightboardProvider>
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading collection...</p>
            </div>
          </div>
        </LightboardProvider>
      </MidgroundProjectionProvider>
    );
  }

  if (error || !collection) {
    return (
      <MidgroundProjectionProvider>
        <LightboardProvider>
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Error Loading Collection</h2>
              <p className="text-zinc-400 mb-6">{error}</p>
              <p className="text-zinc-500 text-sm">
                Please ensure the backend server is running at http://localhost:4000
              </p>
            </div>
          </div>
        </LightboardProvider>
      </MidgroundProjectionProvider>
    );
  }

  return (
    <MidgroundProjectionProvider>
      <LightboardProvider>
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <div className="p-8 border-b border-zinc-800">
            <h1 className="text-4xl font-bold mb-2">Lightboard Test Page</h1>
            <p className="text-zinc-400">
              Loaded collection: <strong className="text-white">{collection.name}</strong> ({collection.imageCount} images)
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Click the gear icon (top-right) to open Lightboard designer and modify settings.
            </p>
          </div>

          {/* Live Preview Carousels */}
          <div className="p-8">
            <LivePreview collection={collection} />
          </div>

          {/* Instructions */}
          <div className="p-8 border-t border-zinc-800">
            <h3 className="text-xl font-semibold mb-4 text-emerald-400">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Click on any carousel to select it (it will glow blue)</li>
              <li>Open Lightboard by clicking the gear icon in the top-right corner</li>
              <li>Go to the "Site" tab to configure site-wide settings</li>
              <li>Go to the "Page" tab to edit collection configuration</li>
              <li>Go to the "Projection" tab to adjust midground projection effects</li>
              <li>Go to the "Carousel" tab to modify carousel behavior</li>
              <li>Changes will be reflected in real-time in the preview above</li>
            </ol>
          </div>

          {/* Lightboard Designer */}
          <LightboardWithToast collection={collection} />
        </div>
      </LightboardProvider>
    </MidgroundProjectionProvider>
  );
}
