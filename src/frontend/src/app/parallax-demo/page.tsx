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

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();

      const collectionsWithImages = data.filter(c => c.imageCount && c.imageCount > 0);

      const collectionsWithGallery = await Promise.all(
        collectionsWithImages.map(async (col) => {
          const fullCollection = await getCollection(col.slug);
          return fullCollection || col;
        })
      );

      setCollections(collectionsWithGallery);

      // Set initial parallax layers from first collection
      if (collectionsWithGallery.length > 0) {
        const firstCol = collectionsWithGallery[0];
        if (firstCol.heroImage) {
          // Create 3-layer parallax effect
          const layers: ParallaxLayer[] = [
            {
              id: 'bg-1',
              type: 'background',
              imageUrl: getAbsoluteMediaUrl(firstCol.heroImage),
              speed: 0.3,
              opacity: 0.6,
              zIndex: 1,
              blur: 2
            },
            {
              id: 'mg-1',
              type: 'midground',
              imageUrl: getAbsoluteMediaUrl(firstCol.heroImage),
              speed: 0.6,
              opacity: 0.8,
              zIndex: 2,
              blur: 1
            },
            {
              id: 'fg-1',
              type: 'foreground',
              imageUrl: getAbsoluteMediaUrl(firstCol.heroImage),
              speed: 1.0,
              opacity: 1.0,
              zIndex: 3
            }
          ];
          setLayers(layers);
        }
      }

      setLoading(false);
    }

    loadCollections();
  }, [setLayers]);

  // Scroll-triggered parallax layer changes
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const [collectionId, ref] of Object.entries(sectionRefs.current)) {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const elementBottom = elementTop + rect.height;

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            const collection = collections.find(c => c.id === collectionId);
            if (collection?.heroImage) {
              // Update all 3 layers with new image
              const layers: ParallaxLayer[] = [
                {
                  id: `bg-${collectionId}`,
                  type: 'background',
                  imageUrl: getAbsoluteMediaUrl(collection.heroImage),
                  speed: 0.3,
                  opacity: 0.6,
                  zIndex: 1,
                  blur: 2
                },
                {
                  id: `mg-${collectionId}`,
                  type: 'midground',
                  imageUrl: getAbsoluteMediaUrl(collection.heroImage),
                  speed: 0.6,
                  opacity: 0.8,
                  zIndex: 2,
                  blur: 1
                },
                {
                  id: `fg-${collectionId}`,
                  type: 'foreground',
                  imageUrl: getAbsoluteMediaUrl(collection.heroImage),
                  speed: 1.0,
                  opacity: 1.0,
                  zIndex: 3
                }
              ];
              setLayers(layers);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [collections, setLayers]);

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

              <ContentBlock>
                <ReferenceCarousel images={carouselImages} />
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
    </ResponsiveContainer>
  );
}
