/**
 * PageRenderer - Core Production Page Renderer
 *
 * Universal page renderer for all collection-based pages (home, collections, etc).
 * Fetches collection data from the API and renders the appropriate layout based
 * on the collection's configuration.
 *
 * Features:
 * - API data fetching with loading/error states
 * - Automatic layout detection (curated vs dynamic)
 * - Projection settings application
 * - Clean separation of concerns
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-13
 */

'use client';

import { useEffect, useState } from 'react';
import { getCollection, Collection, CollectionConfig } from '@/lib/api-client';
import CuratedLayout from '@/components/Layout/CuratedLayout';
import DynamicLayout from '@/components/Layout/DynamicLayout';
import { useProjectionManager } from '@/components/Layout';
import { CollectionConfigProvider } from '@/contexts/CollectionConfigContext';

interface PageRendererProps {
  collectionSlug: string;
}

export default function PageRenderer({ collectionSlug }: PageRendererProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Access projection context to apply global settings
  // Destructure setters to avoid context object dependency issues
  const {
    setFadeDistance,
    setMaxBlur,
    setProjectionScaleX,
    setProjectionScaleY,
    setBlendMode,
    setVignetteWidth,
    setVignetteStrength,
    setCheckerboardEnabled,
    setCheckerboardTileSize,
    setCheckerboardScatterSpeed,
    setCheckerboardBlur,
  } = useProjectionManager();

  // Fetch collection data
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const data = await getCollection(collectionSlug);

        if (!isMounted) return;

        if (!data) {
          setError(`Collection not found: ${collectionSlug}`);
          console.error(`[PageRenderer] Collection not found: ${collectionSlug}`);
        } else {
          setCollection(data);
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error(`[PageRenderer] Error fetching collection:`, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [collectionSlug]);

  // Apply projection settings from collection config
  useEffect(() => {
    if (!collection?.config?.projection) return;

    const projectionConfig = collection.config.projection;

    // Apply all projection settings if they exist
    if (projectionConfig.fadeDistance !== undefined) {
      setFadeDistance(projectionConfig.fadeDistance);
    }
    if (projectionConfig.maxBlur !== undefined) {
      setMaxBlur(projectionConfig.maxBlur);
    }
    if (projectionConfig.scaleX !== undefined) {
      setProjectionScaleX(projectionConfig.scaleX);
    }
    if (projectionConfig.scaleY !== undefined) {
      setProjectionScaleY(projectionConfig.scaleY);
    }
    if (projectionConfig.blendMode) {
      setBlendMode(projectionConfig.blendMode);
    }

    // Vignette settings
    if (projectionConfig.vignette?.width !== undefined) {
      setVignetteWidth(projectionConfig.vignette.width);
    }
    if (projectionConfig.vignette?.strength !== undefined) {
      setVignetteStrength(projectionConfig.vignette.strength);
    }

    // Checkerboard vignette settings
    if (projectionConfig.checkerboard?.enabled !== undefined) {
      setCheckerboardEnabled(projectionConfig.checkerboard.enabled);
    }
    if (projectionConfig.checkerboard?.tileSize !== undefined) {
      setCheckerboardTileSize(projectionConfig.checkerboard.tileSize);
    }
    if (projectionConfig.checkerboard?.scatterSpeed !== undefined) {
      setCheckerboardScatterSpeed(projectionConfig.checkerboard.scatterSpeed);
    }
    if (projectionConfig.checkerboard?.blur !== undefined) {
      setCheckerboardBlur(projectionConfig.checkerboard.blur);
    }
  }, [
    collection,
    setFadeDistance,
    setMaxBlur,
    setProjectionScaleX,
    setProjectionScaleY,
    setBlendMode,
    setVignetteWidth,
    setVignetteStrength,
    setCheckerboardEnabled,
    setCheckerboardTileSize,
    setCheckerboardScatterSpeed,
    setCheckerboardBlur,
  ]); // Use stable setter functions, not entire context object

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
          <p className="text-white/60">Loading {collectionSlug}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !collection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
          <p className="text-white/60 mb-4">
            {error || `The collection "${collectionSlug}" could not be found.`}
          </p>
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Determine layout type from config (default to 'dynamic')
  const layoutType = collection.config?.layoutType || 'dynamic';
  const config = collection.config || {};

  // Wrap layouts with CollectionConfigProvider so Lightboard can access collection info
  return (
    <CollectionConfigProvider collection={collection}>
      {layoutType === 'curated' ? (
        <CuratedLayout collection={collection} config={config} />
      ) : (
        <DynamicLayout collection={collection} config={config} />
      )}
    </CollectionConfigProvider>
  );
}
