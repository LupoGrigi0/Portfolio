/**
 * Midground Projection Demo Page
 *
 * Interactive laboratory for testing the carousel projection system.
 * Each carousel acts as a "projector" casting its first image onto
 * a shared midground layer behind all content.
 *
 * Features:
 * - Multiple carousels with live backend images
 * - Floating control panel for real-time adjustments
 * - Vertical scroll test (carousels fade in/out as they approach center)
 * - Side-by-side test (multiple projections compositing)
 * - Visual metaphor: Carousel = projector, Midground = projection screen
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-03
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';
import {
  MidgroundProjectionProvider,
  useMidgroundProjection,
  ResponsiveContainer,
  Grid,
  ContentBlock
} from '@/components/Layout';
import type { CarouselImage } from '@/components/Carousel/types';
import {
  getCollections,
  getCollection,
  getAbsoluteMediaUrl,
  type Collection,
  type MediaItem
} from '@/lib/api-client';

// Helper to convert collection to simple reference carousel images
function collectionToReferenceImages(collection: Collection, maxImages: number = 10) {
  return (collection.gallery || [])
    .filter((item: MediaItem) =>
      item.type === 'image' && item.urls.large && item.urls.large !== ''
    )
    .slice(0, maxImages)
    .map((item: MediaItem) => ({
      id: item.id,
      src: getAbsoluteMediaUrl(item.urls.large),
      alt: item.altText || item.title || item.filename
    }));
}

export default function ProjectionDemoPage() {
  return (
    <MidgroundProjectionProvider>
      <ProjectionDemoContent />
    </MidgroundProjectionProvider>
  );
}

function ProjectionDemoContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { fadeDistance, maxBlur, projectionScale, setFadeDistance, setMaxBlur, setProjectionScale } = useMidgroundProjection();

  // Control panel state
  const [showControls, setShowControls] = useState(true);

  // Memoize carousel images to prevent re-render loop
  // Only recreate when collections array changes (not on every render)
  const collectionsWithImages = useMemo(() => {
    return collections
      .filter(c => c.gallery && c.gallery.length > 0)
      .map(collection => ({
        collection,
        images: collectionToReferenceImages(collection, 10)
      }));
  }, [collections]);

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();
      const collectionsWithImages = data.filter(c => c.imageCount && c.imageCount > 0);

      // Prioritize "couples" and "mixed-collection" for side-by-side demo
      const priorityCollections = collectionsWithImages.filter(
        c => c.slug === 'couples' || c.slug === 'mixed-collection'
      );
      const otherCollections = collectionsWithImages.filter(
        c => c.slug !== 'couples' && c.slug !== 'mixed-collection'
      );
      const orderedCollections = [...priorityCollections, ...otherCollections].slice(0, 3);

      // Load ONLY the first 2 collections with full galleries initially
      // Others will load when scrolled into view
      const collectionsWithGallery = [];
      for (let i = 0; i < Math.min(2, orderedCollections.length); i++) {
        const col = orderedCollections[i];
        const fullCollection = await getCollection(col.slug);
        if (fullCollection) {
          collectionsWithGallery.push(fullCollection);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Add remaining collections as metadata only
      for (let i = 2; i < orderedCollections.length; i++) {
        collectionsWithGallery.push(orderedCollections[i]);
      }

      setCollections(collectionsWithGallery);
      setLoading(false);
    }

    loadCollections();
  }, []);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading projection demo...</p>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  return (
    <>
      {/* Static background (visible when midground is transparent) */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-purple-900 via-black to-blue-900" />

      <ResponsiveContainer>
        <Grid variant="single" spacing="loose">
          {/* Hero Section */}
          <ContentBlock className="min-h-screen flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-bold text-white mb-6 tracking-tight">
              Projection Demo
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-white/90 max-w-4xl mb-8">
              Carousel as Projector
            </p>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              Each carousel projects its first image onto the midground layer • Fades based on distance from viewport center • Multiple projections blend seamlessly
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl border border-white/20">
              <p className="text-white/90 mb-4">
                <strong>How it works:</strong>
              </p>
              <ul className="text-white/70 text-left space-y-2">
                <li>• Each carousel acts as a "projector" with a spotlight</li>
                <li>• First image is projected onto midground layer behind carousel</li>
                <li>• Projection opacity increases as carousel approaches viewport center</li>
                <li>• Multiple carousels create overlapping, blended projections</li>
                <li>• When no carousel is visible, background shows through</li>
              </ul>
            </div>
            <div className="mt-12 animate-bounce">
              <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </ContentBlock>

          {/* Vertical Scroll Test - Carousels Stack */}
          <ContentBlock className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              🎬 Vertical Scroll Test
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Watch the background image change as you scroll. Each carousel projects onto the midground, fading in as it approaches center.
            </p>
          </ContentBlock>

          {collectionsWithImages.map(({ collection, images }, idx) => (
            <div key={collection.id} className="min-h-screen flex flex-col justify-center py-20">
              <ContentBlock className="text-center mb-8">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {collection.config?.title || collection.name}
                </h3>
                {collection.config?.subtitle && (
                  <p className="text-xl text-white/70">{collection.config.subtitle}</p>
                )}
                <p className="text-sm text-white/50 mt-2">
                  Projecting image #{idx + 1} • {images.length} images in carousel
                </p>
              </ContentBlock>

              <ContentBlock>
                <ReferenceCarousel
                  images={images}
                  enableProjection={true}
                  projectionId={`vertical-carousel-${collection.id}`}
                />
              </ContentBlock>
            </div>
          ))}

          {/* Side-by-Side Test */}
          {collectionsWithImages.length >= 2 && (
            <>
              <ContentBlock className="text-center mb-8 mt-20">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  🎭 Side-by-Side Test
                </h2>
                <p className="text-lg text-white/70 max-w-3xl mx-auto">
                  Two carousels, two projections, one midground. Watch them blend.
                </p>
              </ContentBlock>

              <div className="min-h-screen flex flex-col justify-center">
                <ContentBlock>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {collectionsWithImages.slice(0, 2).map(({ collection, images }) => (
                      <div key={collection.id}>
                        <h4 className="text-xl font-bold text-white mb-4 text-center">
                          {collection.config?.title || collection.name}
                        </h4>
                        <ReferenceCarousel
                          images={images.slice(0, 5)}
                          enableProjection={true}
                          projectionId={`sidebyside-carousel-${collection.id}`}
                        />
                      </div>
                    ))}
                  </div>
                </ContentBlock>
              </div>
            </>
          )}

          {/* Footer */}
          <ContentBlock className="text-center py-20">
            <h3 className="text-3xl font-bold text-white mb-4">
              Design Through Play ✨
            </h3>
            <div className="text-white/70 max-w-2xl mx-auto mb-8">
              <p className="mb-4">
                This projection system enables future possibilities: figure-8 orbital motion, racing carousels, water ballet formations, depth through scale variation.
              </p>
              <p>
                The modular architecture makes these extensions natural and elegant.
              </p>
            </div>
            <Link
              href="/carousel-demo"
              className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              ← Carousel Lab
            </Link>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>

      {/* Floating Control Panel */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg font-semibold mb-2 w-full"
        >
          {showControls ? '← Hide Controls' : 'Show Controls →'}
        </button>

        {showControls && (
          <div className="bg-black/90 backdrop-blur-md rounded-lg p-6 shadow-2xl border border-white/20 w-96">
            <h3 className="text-white font-bold text-xl mb-4">🎨 Projection Settings</h3>
            <p className="text-white/60 text-sm mb-6">
              Adjust the projection behavior in real-time!
            </p>

            {/* Fade Distance */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Fade Distance: {(fadeDistance * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={fadeDistance}
                onChange={(e) => setFadeDistance(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Distance from viewport center where fade starts
              </p>
            </div>

            {/* Max Blur */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Max Blur: {maxBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={maxBlur}
                onChange={(e) => setMaxBlur(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Blur intensity at edge of fade zone
              </p>
            </div>

            {/* Projection Scale */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Projection Scale: {projectionScale.toFixed(2)}x
              </label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={projectionScale}
                onChange={(e) => setProjectionScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Scale of projected image (creates depth illusion)
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setFadeDistance(0.5);
                setMaxBlur(4);
                setProjectionScale(1.2);
              }}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded font-semibold"
            >
              Reset to Defaults
            </button>

            <div className="mt-4 p-3 bg-white/5 rounded text-xs text-white/60">
              <strong className="text-white/80">Metaphor:</strong> Each carousel is a projector shining its first image onto the midground layer. The brightness (opacity) increases as the carousel moves toward viewport center.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
