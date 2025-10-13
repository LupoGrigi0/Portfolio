/**
 * Homepage - Featured Collections with Parallax Scrolling
 *
 * Showcases featured collections with cinematic parallax effects,
 * dynamic backgrounds, and live data from Viktor's backend.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-10-02
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, Grid, ContentBlock, useParallaxBackground, type ParallaxLayer } from "@/components/Layout";
import { getCollections, getAbsoluteMediaUrl, type Collection } from '@/lib/api-client';

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLayers } = useParallaxBackground();

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();
      setCollections(data);

      // Filter for featured collections and sort by slug (alphabetically)
      const featured = data
        .filter((c) => c.featured === true)
        .sort((a, b) => a.slug.localeCompare(b.slug));

      setFeaturedCollections(featured);

      // Set background to first featured collection's hero image
      // This runs every time the homepage is visited to reset the background
      if (featured.length > 0 && featured[0].heroImage) {
        const layers: ParallaxLayer[] = [{
          id: 'home-bg',
          type: 'background',
          imageUrl: getAbsoluteMediaUrl(featured[0].heroImage),
          speed: 0,
          opacity: 1,
          zIndex: 1
        }];
        setLayers(layers);
      } else {
        // Fallback to default dark background
        setLayers([]);
      }

      setLoading(false);
    }

    loadCollections();

    // Cleanup: reset background when leaving homepage
    return () => {
      // Optional: could reset to [] when leaving, but keeping it is also nice
    };
  }, [setLayers]);

  if (loading) {
    return (
      <ResponsiveContainer>
        <Grid variant="single" spacing="normal">
          <ContentBlock className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Loading portfolio...</p>
            </div>
          </ContentBlock>
        </Grid>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="loose">
        {/* Hero Section with Parallax */}
        <ContentBlock className="min-h-[80vh] flex items-center justify-center relative">
          <div
            className="text-center text-white z-10"
            style={{
              transform: 'translateZ(0)', // Parallax foreground layer
            }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 tracking-tight">
              Lupo Grigio
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto mb-8">
              A breathtaking portfolio of {collections.reduce((sum, c) => sum + (c.imageCount || 0), 0).toLocaleString()}+ images
            </p>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Cinematic parallax effects • 60fps performance • {collections.length} curated collections
            </p>
          </div>
        </ContentBlock>

        {/* Featured Collections */}
        {featuredCollections.length > 0 && (
          <ContentBlock>
            <h2 className="text-4xl font-bold text-white mb-8 text-center">
              Featured Collections
            </h2>
            <Grid variant="side-by-side" spacing="normal">
              {featuredCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group block"
                  onMouseEnter={() => {
                    // Change background on hover - parallax effect!
                    if (collection.heroImage) {
                      const layers: ParallaxLayer[] = [{
                        id: `home-featured-${collection.id}`,
                        type: 'background',
                        imageUrl: getAbsoluteMediaUrl(collection.heroImage),
                        speed: 0,
                        opacity: 1,
                        zIndex: 1
                      }];
                      setLayers(layers);
                    }
                  }}
                >
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 border border-white/10 hover:border-white/30 transition-all duration-500 hover:bg-black/30 transform hover:scale-[1.02]">
                    <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                      {collection.config?.title || collection.name}
                    </h3>

                    {collection.config?.subtitle && (
                      <p className="text-lg text-white/80 mb-4">
                        {collection.config.subtitle}
                      </p>
                    )}

                    {collection.config?.description && (
                      <p className="text-white/70 leading-relaxed mb-6">
                        {collection.config.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        {collection.imageCount} images
                      </span>
                      <span
                        className="text-white/80 group-hover:text-white transition-colors"
                        style={{
                          color: collection.config?.styling?.accentColor || '#ffffff'
                        }}
                      >
                        View Collection →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </Grid>
          </ContentBlock>
        )}

        {/* All Collections */}
        <ContentBlock>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            All Collections
          </h2>
          <Grid variant="masonry" columns={3} spacing="normal">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group block"
                onMouseEnter={() => {
                  if (collection.heroImage) {
                    const layers: ParallaxLayer[] = [{
                      id: `home-all-${collection.id}`,
                      type: 'background',
                      imageUrl: getAbsoluteMediaUrl(collection.heroImage),
                      speed: 0,
                      opacity: 1,
                      zIndex: 1
                    }];
                    setLayers(layers);
                  }
                }}
              >
                <div className="bg-white/5 hover:bg-white/10 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90">
                    {collection.config?.title || collection.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-3">
                    {collection.imageCount} images
                  </p>
                  {collection.config?.tags && collection.config.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {collection.config.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded bg-white/10 text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </Grid>
        </ContentBlock>

        {/* Parallax Explainer */}
        <Grid variant="side-by-side" spacing="normal">
          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-4">
              ✨ Multi-Layer Parallax
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Hover over collections to see the cinematic parallax effect in action. Each background transitions smoothly with multiple depth layers creating a 3D illusion.
            </p>
            <p className="text-white/60 text-sm">
              Customizable via config.json • 3 depth layers • Smooth transitions
            </p>
          </ContentBlock>

          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-4">
              🎨 Fully Customizable
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Each collection has its own config.json where you can customize titles, colors, parallax speeds, layout styles, and more.
            </p>
            <p className="text-white/60 text-sm">
              Edit config.json • Hot reload in dev • See changes instantly
            </p>
          </ContentBlock>
        </Grid>

        {/* Footer */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm">
            Built with Next.js 15 • React 19 • Tailwind CSS 4
          </p>
          <p className="text-white/40 text-xs mt-2">
            Layout & Parallax System by Zara • Backend by Viktor • Carousel by Kai
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}
