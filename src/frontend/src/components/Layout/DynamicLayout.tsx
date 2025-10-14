/**
 * DynamicLayout - Auto-generates collection page layout from gallery images
 *
 * Simple mode: Just throw images in a directory, get a nice page.
 * - Auto-creates carousels from all images
 * - Configurable grid layout (single-column, 2-across, 3-across, masonry)
 * - Grouping options (images per carousel)
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-03
 */

'use client';

import { Collection, CollectionConfig, getAbsoluteMediaUrl } from '@/lib/api-client';
import Carousel from '@/components/Carousel/Carousel';
import type { CarouselImage } from '@/components/Carousel/types';
import { useState, useEffect, useRef, useCallback } from 'react';

interface DynamicLayoutProps {
  collection: Collection;
  config: CollectionConfig;
}

export default function DynamicLayout({ collection, config }: DynamicLayoutProps) {
  const settings = config.dynamicSettings || {
    layout: 'single-column',
    imagesPerCarousel: 20, // Default: 20 images per carousel
  };

  const defaults = settings.carouselDefaults || {};

  // Projection settings
  const projectionEnabled = config.projection?.enabled ?? false;
  const projectionPattern = config.projection?.pattern ?? 'none';
  const projectionOffset = config.projection?.patternOffset ?? 0;

  /**
   * Determine if a carousel at given index should have projection enabled
   */
  const shouldEnableProjection = (carouselIndex: number): boolean => {
    // Global projection disabled
    if (!projectionEnabled) return false;

    // Apply pattern
    switch (projectionPattern) {
      case 'all':
        return true;
      case 'every-2nd':
        return (carouselIndex - projectionOffset) % 2 === 0;
      case 'every-3rd':
        return (carouselIndex - projectionOffset) % 3 === 0;
      case 'none':
      default:
        return false;
    }
  };

  // Filter images only (skip videos for now - carousel v1 limitation)
  // Also exclude hero images (hero.jpg, hero.jfif, etc.) - those are for hero sections only
  const images = (collection.gallery || [])
    .filter((item) => {
      // Must be an image type
      if (item.type !== 'image') return false;

      // Exclude hero images (used for hero sections only)
      if (/^hero[.-]/i.test(item.filename)) return false;

      // Must have at least one valid URL (large, medium, or original as fallback)
      const hasValidUrl = item.urls && (item.urls.large || item.urls.medium || item.urls.original);
      if (!hasValidUrl) {
        console.warn(`[DynamicLayout] Skipping image with no valid URL:`, item.filename);
      }

      return hasValidUrl;
    })
    .map((item) => {
      // Use large, or fallback to medium, or fallback to original
      const imageUrl = item.urls.large || item.urls.medium || item.urls.original;
      return {
        id: item.id,
        src: getAbsoluteMediaUrl(imageUrl),
        alt: item.altText || item.title || item.filename,
      };
    });

  if (images.length === 0) {
    return (
      <div className="text-center text-white/60 py-12">
        <p>No images found in this collection</p>
        <p className="text-xs text-white/40 mt-2">Gallery has {collection.gallery?.length || 0} items total</p>
        <p className="text-xs text-white/40">Check browser console for debug info</p>
      </div>
    );
  }

  /**
   * Group images into carousels
   */
  const groupImages = (): CarouselImage[][] => {
    if (settings.imagesPerCarousel === 'all') {
      // Single carousel with all images
      return [images];
    }

    const perCarousel = settings.imagesPerCarousel || 5;
    const groups: CarouselImage[][] = [];

    for (let i = 0; i < images.length; i += perCarousel) {
      groups.push(images.slice(i, i + perCarousel));
    }

    return groups;
  };

  const carouselGroups = groupImages();

  /**
   * Progressive Rendering + Bidirectional Virtualization
   *
   * Phase 1: Load 4 carousels initially, 4 more as user scrolls
   * Phase 2: Keep max 10 carousels in DOM (unload ones far offscreen)
   */
  const INITIAL_LOAD = 4;
  const LOAD_INCREMENT = 4;
  const MAX_ACTIVE_CAROUSELS = 10; // Keep at most 10 in DOM for performance

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(INITIAL_LOAD, carouselGroups.length) });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to load more when scrolling down
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleRange.end < carouselGroups.length) {
          // Load more carousels
          setVisibleRange(prev => ({
            ...prev,
            end: Math.min(prev.end + LOAD_INCREMENT, carouselGroups.length)
          }));
        }
      },
      { rootMargin: '500px' } // Start loading 500px before reaching bottom
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [visibleRange.end, carouselGroups.length]);

  // Bidirectional virtualization: Unload carousels far offscreen
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;

      // Get all carousel elements
      const carouselElements = containerRef.current?.querySelectorAll('[data-carousel-index]');
      if (!carouselElements) return;

      let firstVisible = 0;
      let lastVisible = visibleRange.end;

      carouselElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + viewportTop;
        const elementBottom = elementTop + rect.height;

        // Check if carousel is in or near viewport (with 2000px buffer)
        const isNearViewport = elementBottom > viewportTop - 2000 && elementTop < viewportBottom + 2000;

        if (isNearViewport) {
          if (index < firstVisible) firstVisible = index;
          if (index > lastVisible) lastVisible = index;
        }
      });

      // Keep a window of MAX_ACTIVE_CAROUSELS around visible area
      const rangeSize = lastVisible - firstVisible + 1;
      if (rangeSize > MAX_ACTIVE_CAROUSELS) {
        // Center the window on the visible carousels
        const midpoint = Math.floor((firstVisible + lastVisible) / 2);
        const halfWindow = Math.floor(MAX_ACTIVE_CAROUSELS / 2);

        setVisibleRange({
          start: Math.max(0, midpoint - halfWindow),
          end: Math.min(carouselGroups.length, midpoint + halfWindow)
        });
      }
    };

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null as any;
      }, 200);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [visibleRange, carouselGroups.length]);

  // Get the carousels to actually render (within visible range)
  const activeCarouselGroups = carouselGroups.slice(visibleRange.start, visibleRange.end);

  /**
   * Map config options to Carousel props
   */
  const mapCarouselOptions = () => ({
    transition: defaults.transition || 'fade',
    autoplay: defaults.autoplay ?? false,
    interval: defaults.interval || 8000,
    speed: defaults.speed || 800,
    showNavigation: defaults.controls?.nav?.show ?? true,
    showSocialReactions: defaults.controls?.reactions?.show ?? false,
    autoHideSocial: defaults.controls?.reactions?.autoHide ?? true,
    reserveTop: defaults.reservedSpace?.top || 0,
    reserveBottom: defaults.reservedSpace?.bottom || 60, // Default space for controls
    reserveLeft: defaults.reservedSpace?.left || 0,
    reserveRight: defaults.reservedSpace?.right || 0,
    reserveBackgroundColor: defaults.reservedSpace?.backgroundColor || 'transparent',
    reserveBackgroundOpacity: defaults.reservedSpace?.backgroundOpacity || 0,
    containerBorderWidth: defaults.styling?.borderWidth || 0,
    containerBorderColor: defaults.styling?.borderColor || '#ffffff',
    containerBorderOpacity: defaults.styling?.borderOpacity || 1,
    containerBorderRadius: defaults.styling?.borderRadius || 0,
    containerBackgroundColor: defaults.styling?.backgroundColor || 'transparent',
    containerBackgroundOpacity: defaults.styling?.backgroundOpacity || 0,
    containerPadding: defaults.styling?.padding || 16,
  });

  /**
   * Get grid layout classes and inline styles for spacing
   */
  const getLayoutConfig = () => {
    // Default spacing values
    const horizontalGap = settings.spacing?.horizontal ?? 32; // Default 32px
    const verticalGap = settings.spacing?.vertical ?? 48;     // Default 48px

    const style: React.CSSProperties = {
      rowGap: `${verticalGap}px`,
      columnGap: `${horizontalGap}px`,
    };

    switch (settings.layout) {
      case '2-across':
        return {
          className: 'grid grid-cols-1 md:grid-cols-2',
          style
        };
      case '3-across':
        return {
          className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          style
        };
      case 'masonry':
        // TODO: Implement proper masonry with varying heights
        return {
          className: 'grid grid-cols-1 md:grid-cols-2',
          style
        };
      case 'zipper':
        return {
          className: 'flex flex-col',
          style: { gap: `${verticalGap}px` }
        };
      case 'single-column':
      default:
        return {
          className: 'flex flex-col',
          style: { gap: `${verticalGap}px` }
        };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Zipper layout: Alternating left/right carousels
  if (settings.layout === 'zipper') {
    return (
      <div ref={containerRef} className={layoutConfig.className} style={layoutConfig.style}>
        {activeCarouselGroups.map((group, relativeIndex) => {
          const index = visibleRange.start + relativeIndex;
          const isLeft = index % 2 === 0;
          const enableProjection = shouldEnableProjection(index);

          return (
            <div
              key={`carousel-${index}`}
              data-carousel-index={index}
              className="flex flex-row"
              style={{ justifyContent: isLeft ? 'flex-start' : 'flex-end' }}
            >
              <div
                style={{
                  width: '100%',
                  minWidth: '400px',
                  maxWidth: '800px'
                }}
              >
                <Carousel
                  images={group}
                  {...mapCarouselOptions()}
                  enableProjection={enableProjection}
                  projectionId={`dynamic-zipper-${collection.slug}-${index}`}
                />
              </div>
            </div>
          );
        })}
        {/* Sentinel for loading more carousels */}
        {visibleRange.end < carouselGroups.length && (
          <div ref={sentinelRef} style={{ height: '1px' }} />
        )}
      </div>
    );
  }

  // Standard layouts
  return (
    <div ref={containerRef} className={layoutConfig.className} style={layoutConfig.style}>
      {activeCarouselGroups.map((group, relativeIndex) => {
        const index = visibleRange.start + relativeIndex;
        const enableProjection = shouldEnableProjection(index);

        return (
          <div key={`carousel-${index}`} data-carousel-index={index} className="w-full">
            <Carousel
              images={group}
              {...mapCarouselOptions()}
              enableProjection={enableProjection}
              projectionId={`dynamic-${collection.slug}-${index}`}
            />
          </div>
        );
      })}
      {/* Sentinel for loading more carousels */}
      {visibleRange.end < carouselGroups.length && (
        <div ref={sentinelRef} style={{ height: '1px' }} />
      )}
    </div>
  );
}
