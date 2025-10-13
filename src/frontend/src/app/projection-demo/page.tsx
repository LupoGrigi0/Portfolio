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
    .filter((item: MediaItem) => {
      // Accept images with either large or original URL
      const hasLarge = item.urls.large && item.urls.large !== '';
      const hasOriginal = item.urls.original && item.urls.original !== '';
      return item.type === 'image' && (hasLarge || hasOriginal);
    })
    .slice(0, maxImages)
    .map((item: MediaItem) => ({
      id: item.id,
      // Prefer large, fallback to original if large is not available
      src: getAbsoluteMediaUrl(item.urls.large || item.urls.original),
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
  const {
    fadeDistance,
    maxBlur,
    projectionScaleX,
    projectionScaleY,
    blendMode,
    vignetteWidth,
    vignetteStrength,
    checkerboardEnabled,
    checkerboardTileSize,
    checkerboardScatterSpeed,
    checkerboardBlur,
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
  } = useMidgroundProjection();

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
      // Exclude "scientists" as it's currently broken
      const priorityCollections = collectionsWithImages.filter(
        c => c.slug === 'couples' || c.slug === 'mixed-collection'
      );
      const otherCollections = collectionsWithImages.filter(
        c => c.slug !== 'couples' && c.slug !== 'mixed-collection' && c.slug !== 'scientists'
      );
      const orderedCollections = [...priorityCollections, ...otherCollections].slice(0, 5);

      // Load ONLY the first 4 collections with full galleries initially
      // Others will load when scrolled into view
      const collectionsWithGallery = [];
      for (let i = 0; i < Math.min(4, orderedCollections.length); i++) {
        const col = orderedCollections[i];
        const fullCollection = await getCollection(col.slug);
        if (fullCollection) {
          collectionsWithGallery.push(fullCollection);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Add remaining collections as metadata only
      for (let i = 4; i < orderedCollections.length; i++) {
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
            <div key={collection.id} className="min-h-[60vh] flex flex-col justify-center py-12">
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

            {/* Projection Scale X (Width) */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Projection Width: {projectionScaleX.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={projectionScaleX}
                onChange={(e) => setProjectionScaleX(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Horizontal scale (0.5 = narrow, 2.0 = wide)
              </p>
            </div>

            {/* Projection Scale Y (Height) */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Projection Height: {projectionScaleY.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={projectionScaleY}
                onChange={(e) => setProjectionScaleY(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Vertical scale (0.5 = short, 2.0 = tall)
              </p>
            </div>

            {/* Blend Mode */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Blend Mode: {blendMode}
              </label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value)}
                className="w-full bg-white/10 text-white border border-white/20 rounded px-3 py-2"
              >
                <option value="normal">Normal (no blend)</option>
                <option value="multiply">Multiply (darken)</option>
                <option value="screen">Screen (lighten)</option>
                <option value="overlay">Overlay (contrast)</option>
                <option value="soft-light">Soft Light (subtle)</option>
                <option value="hard-light">Hard Light (vivid)</option>
                <option value="color-dodge">Color Dodge (bright)</option>
                <option value="color-burn">Color Burn (intense)</option>
                <option value="lighten">Lighten Only</option>
                <option value="darken">Darken Only</option>
              </select>
              <p className="text-xs text-white/50 mt-1">
                How overlapping projections blend together
              </p>
            </div>

            {/* Vignette Width */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Vignette Width: {vignetteWidth}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={vignetteWidth}
                onChange={(e) => setVignetteWidth(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Edge fade width (0 = no vignette, 50 = full fade)
              </p>
            </div>

            {/* Vignette Strength */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">
                Vignette Strength: {(vignetteStrength * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={vignetteStrength}
                onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-white/50 mt-1">
                Fade intensity (0 = transparent, 100 = opaque center)
              </p>
            </div>

            {/* Checkerboard Vignette Toggle */}
            <div className="mb-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-white/90 text-sm font-semibold">
                  🎨 Checkerboard Vignette
                </label>
                <button
                  onClick={() => setCheckerboardEnabled(!checkerboardEnabled)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    checkerboardEnabled
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {checkerboardEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {checkerboardEnabled && (
                <>
                  {/* Tile Size */}
                  <div className="mb-4">
                    <label className="block text-white/70 text-xs mb-2">
                      Tile Size: {checkerboardTileSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={checkerboardTileSize}
                      onChange={(e) => setCheckerboardTileSize(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Size of checker squares (10 = fine, 100 = chunky)
                    </p>
                  </div>

                  {/* Scatter Speed */}
                  <div className="mb-4">
                    <label className="block text-white/70 text-xs mb-2">
                      Scatter Speed: {(checkerboardScatterSpeed * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={checkerboardScatterSpeed}
                      onChange={(e) => setCheckerboardScatterSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Animation speed (0 = static, 100 = fast scatter)
                    </p>
                  </div>

                  {/* Checker Blur */}
                  <div className="mb-2">
                    <label className="block text-white/70 text-xs mb-2">
                      Edge Blur: {checkerboardBlur.toFixed(1)}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={checkerboardBlur}
                      onChange={(e) => setCheckerboardBlur(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Softness of checker edges (0 = crisp, 10 = dreamy)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setFadeDistance(0.5);
                setMaxBlur(4);
                setProjectionScaleX(1.2);
                setProjectionScaleY(1.2);
                setBlendMode('normal');
                setVignetteWidth(20);
                setVignetteStrength(0.8);
                setCheckerboardEnabled(false);
                setCheckerboardTileSize(30);
                setCheckerboardScatterSpeed(0.3);
                setCheckerboardBlur(0);
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
