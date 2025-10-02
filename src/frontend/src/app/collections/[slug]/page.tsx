/**
 * Collection Detail Page
 *
 * Displays a specific collection with images in ReferenceCarousel.
 * Integrated with Background system for cinematic parallax effect.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-30
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveContainer, Grid, ContentBlock, useBackground } from '@/components/Layout';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';
import { getCollection, getAbsoluteMediaUrl, type Collection, type MediaItem } from '@/lib/api-client';

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { setBackground } = useBackground();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);

      const data = await getCollection(slug);

      if (!data) {
        setError(`Collection "${slug}" not found`);
        setLoading(false);
        return;
      }

      setCollection(data);

      // Set initial background to hero image or first gallery image
      if (data.heroImage) {
        setBackground(data.heroImage);
      } else if (data.gallery && data.gallery.length > 0) {
        const firstImage = getAbsoluteMediaUrl(data.gallery[0].urls.medium);
        setBackground(firstImage);
      }

      setLoading(false);
    }

    loadCollection();
  }, [slug, setBackground]);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading collection...</p>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  if (error || !collection) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center text-white max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Collection Not Found</h2>
              <p className="text-white/80 mb-6">{error}</p>
              <Link
                href="/collections"
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                ← Back to Collections
              </Link>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  // Prepare images for carousel using Viktor's pre-built URLs
  // Filter out videos and items without valid image URLs
  const carouselImages = (collection.gallery || [])
    .filter((item: MediaItem) => {
      // Skip videos - carousel only supports images
      if (item.type === 'video') return false;

      // Skip items without valid large image URL
      if (!item.urls.large || item.urls.large === '') return false;

      return true;
    })
    .map((item: MediaItem) => ({
      id: item.id,
      src: getAbsoluteMediaUrl(item.urls.large), // Use large size for carousel
      alt: item.altText || item.title || item.filename,
    }));

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="loose">
        {/* Breadcrumb */}
        <ContentBlock>
          <Link
            href="/collections"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            ← Back to Collections
          </Link>
        </ContentBlock>

        {/* Collection Header */}
        <ContentBlock className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            {collection.config?.title || collection.name}
          </h1>
          {collection.config?.subtitle && (
            <p className="text-xl text-white/80 mb-4">
              {collection.config.subtitle}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{collection.imageCount} images</span>
            {collection.videoCount > 0 && <span>{collection.videoCount} videos</span>}
          </div>
        </ContentBlock>

        {/* Carousel */}
        {carouselImages.length > 0 ? (
          <ContentBlock>
            <ReferenceCarousel images={carouselImages} />
          </ContentBlock>
        ) : (
          <ContentBlock className="text-center py-12">
            <p className="text-white/60">No images found in this collection</p>
          </ContentBlock>
        )}

        {/* Description */}
        {collection.config?.description && (
          <ContentBlock className="text-center max-w-2xl mx-auto">
            <p className="text-white/80 leading-relaxed">
              {collection.config.description}
            </p>
          </ContentBlock>
        )}

        {/* Subcollections */}
        {collection.subcollections && collection.subcollections.length > 0 && (
          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Subcollections</h2>
            <Grid variant="side-by-side" spacing="normal">
              {collection.subcollections.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/collections/${sub.slug}`}
                  className="block bg-black/20 hover:bg-black/40 rounded-lg p-6 transition-all"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{sub.name}</h3>
                  <p className="text-white/60 text-sm">{sub.imageCount} images</p>
                </Link>
              ))}
            </Grid>
          </ContentBlock>
        )}

        {/* Info Footer */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm">
            Using ReferenceCarousel • Real images from Viktor&apos;s ContentScanner
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}