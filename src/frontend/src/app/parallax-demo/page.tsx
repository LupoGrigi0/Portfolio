/**
 * Parallax Demo Page - Multi-Layer Scrolling Showcase
 *
 * Demonstrates the 3-tier parallax system with:
 * - Background layer scrolling at 30% speed
 * - Midground layer scrolling at 60% speed
 * - Foreground layer scrolling at 100% speed
 * - Multiple carousel sections
 * - Dynamic layer changes on scroll
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-10-02
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  Grid,
  ContentBlock,
  useParallaxBackground,
  createParallaxLayersFromConfig,
  type ParallaxLayer
} from '@/components/Layout';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';
import {
  getCollections,
  getCollection,
  getAbsoluteMediaUrl,
  type Collection,
  type MediaItem
} from '@/lib/api-client';

export default function ParallaxDemoPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLayers } = useParallaxBackground();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Control panel state
  const [showControls, setShowControls] = useState(true);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [mgOpacity, setMgOpacity] = useState(0.6);
  const [fgOpacity, setFgOpacity] = useState(0.8);
  const [bgSpeed, setBgSpeed] = useState(-0.3);
  const [mgSpeed, setMgSpeed] = useState(-0.15);
  const [fgSpeed, setFgSpeed] = useState(-0.05);
  const [bgBlur, setBgBlur] = useState(3);
  const [mgBlur, setMgBlur] = useState(1.5);
  const [fgBlur, setFgBlur] = useState(0);

  // Carousel styling controls
  const [carouselBorderOpacity, setCarouselBorderOpacity] = useState(0.2);
  const [carouselImageOpacity, setCarouselImageOpacity] = useState(1.0);

  // Store current section ID to update layers
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();

      const collectionsWithImages = data.filter(c => c.imageCount && c.imageCount > 0);

      // Fetch collections sequentially with delay to avoid rate limits
      const collectionsWithGallery = [];
      for (const col of collectionsWithImages.slice(0, 5)) { // Show 5 collections for demo
        const fullCollection = await getCollection(col.slug);
        if (fullCollection) {
          collectionsWithGallery.push(fullCollection);
        }
        // Longer delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCollections(collectionsWithGallery);

      // Set initial section (first collection)
      if (collectionsWithGallery.length > 0) {
        setCurrentSectionId(collectionsWithGallery[0].id);
      }

      setLoading(false);
    }

    loadCollections();
    // Only run once on mount
  }, []);

  // Update layers when settings change (without refetching collections!)
  useEffect(() => {
    if (!currentSectionId || collections.length === 0) return;

    const collection = collections.find(c => c.id === currentSectionId);
    if (!collection) return;

    const gallery = collection.gallery || [];
    const bgImage = collection.heroImage || gallery[0]?.urls.large;
    const mgImage = gallery[1]?.urls.large || bgImage;
    const fgImage = gallery[2]?.urls.large || bgImage;

    if (bgImage) {
      const layers: ParallaxLayer[] = [
        {
          id: `bg-${currentSectionId}`,
          type: 'background',
          imageUrl: getAbsoluteMediaUrl(bgImage),
          speed: bgSpeed,
          opacity: bgOpacity,
          zIndex: 1,
          blur: bgBlur
        },
        {
          id: `mg-${currentSectionId}`,
          type: 'midground',
          imageUrl: getAbsoluteMediaUrl(mgImage),
          speed: mgSpeed,
          opacity: mgOpacity,
          zIndex: 2,
          blur: mgBlur
        },
        {
          id: `fg-${currentSectionId}`,
          type: 'foreground',
          imageUrl: getAbsoluteMediaUrl(fgImage),
          speed: fgSpeed,
          opacity: fgOpacity,
          zIndex: 3,
          blur: fgBlur
        }
      ];
      setLayers(layers);
    }
  }, [currentSectionId, collections, bgSpeed, mgSpeed, fgSpeed, bgOpacity, mgOpacity, fgOpacity, bgBlur, mgBlur, fgBlur, setLayers]);

  // Scroll-triggered section changes
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const [collectionId, ref] of Object.entries(sectionRefs.current)) {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const elementBottom = elementTop + rect.height;

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            // Just update the current section ID - layers will update via useEffect
            if (currentSectionId !== collectionId) {
              setCurrentSectionId(collectionId);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSectionId]);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading parallax demo...</p>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="loose">
        {/* Hero Section */}
        <ContentBlock className="min-h-screen flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-9xl font-bold text-white mb-6 tracking-tight">
            Parallax Demo
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl text-white/90 max-w-4xl mb-8">
            3-Layer Cinematic Scrolling
          </p>
          <p className="text-lg text-white/70 max-w-2xl mb-8">
            Background @ 30% • Midground @ 60% • Foreground @ 100%
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl border border-white/20">
            <p className="text-white/90 mb-4">
              <strong>How it works:</strong>
            </p>
            <ul className="text-white/70 text-left space-y-2">
              <li>• Background layer moves at 30% scroll speed (appears distant)</li>
              <li>• Midground layer moves at 60% scroll speed (medium depth)</li>
              <li>• Foreground layer moves at 100% scroll speed (closest)</li>
              <li>• Creates illusion of depth as you scroll</li>
              <li>• Blur effect adds depth of field</li>
            </ul>
          </div>
          <div className="mt-12 animate-bounce">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </ContentBlock>

        {/* Collection Carousels with Parallax */}
        {collections.map((collection) => {
          const carouselImages = (collection.gallery || [])
            .filter((item: MediaItem) =>
              item.type === 'image' && item.urls.large && item.urls.large !== ''
            )
            .slice(0, 20)
            .map((item: MediaItem) => ({
              id: item.id,
              src: getAbsoluteMediaUrl(item.urls.large),
              alt: item.altText || item.title || item.filename,
            }));

          if (carouselImages.length === 0) return null;

          return (
            <div
              key={collection.id}
              ref={(el) => { sectionRefs.current[collection.id] = el; }}
              className="min-h-screen flex flex-col justify-center"
            >
              <ContentBlock className="text-center mb-8">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {collection.config?.title || collection.name}
                </h2>

                {collection.config?.subtitle && (
                  <p className="text-xl sm:text-2xl text-white/80 mb-6">
                    {collection.config.subtitle}
                  </p>
                )}

                <div className="text-sm text-white/60 mb-4">
                  Watch the background layers shift as you scroll through this section
                </div>
              </ContentBlock>

              <ContentBlock
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${carouselBorderOpacity})`
                }}
              >
                <div style={{ opacity: carouselImageOpacity }}>
                  <ReferenceCarousel images={carouselImages} />
                </div>
              </ContentBlock>

              <ContentBlock className="text-center mt-8">
                <Link
                  href={`/collections/${collection.slug}`}
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  style={{
                    color: collection.config?.styling?.accentColor || '#ffffff'
                  }}
                >
                  <span>View Full Collection</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </ContentBlock>
            </div>
          );
        })}

        {/* Footer */}
        <ContentBlock className="text-center py-20">
          <h3 className="text-3xl font-bold text-white mb-4">
            Performance Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">60fps</div>
              <div className="text-white/70">Smooth Scrolling</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">GPU</div>
              <div className="text-white/70">Hardware Accelerated</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">3</div>
              <div className="text-white/70">Depth Layers</div>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/showcase"
              className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              ← Back to Showcase
            </Link>
          </div>
        </ContentBlock>
      </Grid>

      {/* Floating Control Panel */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg font-semibold mb-2 w-full"
        >
          {showControls ? '← Hide Controls' : 'Show Controls →'}
        </button>

        {showControls && (
          <div className="bg-black/90 backdrop-blur-md rounded-lg p-6 shadow-2xl border border-white/20 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white font-bold text-xl mb-4">Parallax Controls</h3>
            <p className="text-white/60 text-sm mb-6">Adjust settings and watch them update live!</p>

            {/* Background Layer Controls */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h4 className="text-white font-semibold mb-3">Background Layer</h4>

              <label className="block text-white/80 text-sm mb-2">
                Opacity: {(bgOpacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Speed: {bgSpeed.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={bgSpeed}
                onChange={(e) => setBgSpeed(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Blur: {bgBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={bgBlur}
                onChange={(e) => setBgBlur(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Midground Layer Controls */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h4 className="text-white font-semibold mb-3">Midground Layer</h4>

              <label className="block text-white/80 text-sm mb-2">
                Opacity: {(mgOpacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={mgOpacity}
                onChange={(e) => setMgOpacity(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Speed: {mgSpeed.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={mgSpeed}
                onChange={(e) => setMgSpeed(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Blur: {mgBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={mgBlur}
                onChange={(e) => setMgBlur(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Foreground Layer Controls */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h4 className="text-white font-semibold mb-3">Foreground Layer</h4>

              <label className="block text-white/80 text-sm mb-2">
                Opacity: {(fgOpacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fgOpacity}
                onChange={(e) => setFgOpacity(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Speed: {fgSpeed.toFixed(2)}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={fgSpeed}
                onChange={(e) => setFgSpeed(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Blur: {fgBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={fgBlur}
                onChange={(e) => setFgBlur(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Carousel Styling Controls */}
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-3">Carousel Styling</h4>

              <label className="block text-white/80 text-sm mb-2">
                Border/Background Opacity: {(carouselBorderOpacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={carouselBorderOpacity}
                onChange={(e) => setCarouselBorderOpacity(parseFloat(e.target.value))}
                className="w-full"
              />

              <label className="block text-white/80 text-sm mb-2 mt-4">
                Image Opacity: {(carouselImageOpacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={carouselImageOpacity}
                onChange={(e) => setCarouselImageOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setBgOpacity(0.4);
                setMgOpacity(0.6);
                setFgOpacity(0.8);
                setBgSpeed(-0.3);
                setMgSpeed(-0.15);
                setFgSpeed(-0.05);
                setBgBlur(3);
                setMgBlur(1.5);
                setFgBlur(0);
                setCarouselBorderOpacity(0.2);
                setCarouselImageOpacity(1.0);
              }}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded mt-4 font-semibold"
            >
              Reset to Defaults
            </button>

            <div className="mt-4 p-3 bg-white/5 rounded text-xs text-white/60">
              <strong className="text-white/80">Tip:</strong> Negative speeds move layers down when scrolling down (natural). Positive speeds move them up (classic parallax).
            </div>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
}
