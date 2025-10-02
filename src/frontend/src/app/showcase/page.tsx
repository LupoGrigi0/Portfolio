/**
 * Showcase Page - Multiple Carousels with Scrolling Parallax
 *
 * Demonstrates multiple carousels on a single page with:
 * - Hero section with title, subtitle, and background
 * - Multiple carousel sections (one per collection)
 * - Scroll-triggered background changes
 * - Beautiful spacing and typography
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-10-02
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, Grid, ContentBlock, useBackground } from "@/components/Layout";
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';
import { getCollections, getAbsoluteMediaUrl, type Collection, type MediaItem } from '@/lib/api-client';

export default function ShowcasePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { setBackground } = useBackground();

  // Refs for scroll-triggered background changes
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();

      // Filter to only show collections with images
      const collectionsWithImages = data.filter(c =>
        c.imageCount && c.imageCount > 0
      );

      setCollections(collectionsWithImages);

      // Set initial background to first collection's hero
      if (collectionsWithImages.length > 0 && collectionsWithImages[0].heroImage) {
        setBackground(collectionsWithImages[0].heroImage);
      }

      setLoading(false);
    }

    loadCollections();
  }, [setBackground]);

  // Scroll-triggered background changes
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      // Find which section is in view
      for (const [collectionId, ref] of Object.entries(sectionRefs.current)) {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const elementBottom = elementTop + rect.height;

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            const collection = collections.find(c => c.id === collectionId);
            if (collection?.heroImage) {
              setBackground(collection.heroImage);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [collections, setBackground]);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading showcase...</p>
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
            Portfolio
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl text-white/90 max-w-4xl mb-8">
            A Cinematic Journey Through Art
          </p>
          <p className="text-lg text-white/70 max-w-2xl">
            Scroll to explore {collections.length} collections • {collections.reduce((sum, c) => sum + (c.imageCount || 0), 0)} images
          </p>
          <div className="mt-12 animate-bounce">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </ContentBlock>

        {/* Collection Carousels */}
        {collections.map((collection) => {
          // Prepare carousel images (filter out videos and invalid items)
          const carouselImages = (collection.gallery || [])
            .filter((item: MediaItem) =>
              item.type === 'image' && item.urls.large && item.urls.large !== ''
            )
            .slice(0, 20) // Limit to first 20 images per carousel
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
              {/* Collection Header */}
              <ContentBlock className="text-center mb-8">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {collection.config?.title || collection.name}
                </h2>

                {collection.config?.subtitle && (
                  <p className="text-xl sm:text-2xl text-white/80 mb-6">
                    {collection.config.subtitle}
                  </p>
                )}

                {collection.config?.description && (
                  <p className="text-white/70 max-w-3xl mx-auto leading-relaxed mb-8">
                    {collection.config.description}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                  <span>{collection.imageCount} images</span>
                  {collection.config?.tags && collection.config.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{collection.config.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </ContentBlock>

              {/* Carousel */}
              <ContentBlock>
                <ReferenceCarousel images={carouselImages} />
              </ContentBlock>

              {/* Collection Footer */}
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
            Experience More
          </h3>
          <p className="text-white/70 mb-8">
            Explore individual collections for the full experience
          </p>
          <Link
            href="/collections"
            className="inline-block bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            View All Collections →
          </Link>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}
