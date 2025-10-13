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
  console.log(`[DynamicLayout] Collection "${collection.slug}" gallery:`, collection.gallery?.length || 0, 'items');
  console.log(`[DynamicLayout] First gallery item:`, collection.gallery?.[0]);

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

  console.log(`[DynamicLayout] Filtered images:`, images.length);

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
      <div className={layoutConfig.className} style={layoutConfig.style}>
        {carouselGroups.map((group, index) => {
          const isLeft = index % 2 === 0;
          const enableProjection = shouldEnableProjection(index);

          return (
            <div
              key={`carousel-${index}`}
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
      </div>
    );
  }

  // Standard layouts
  return (
    <div className={layoutConfig.className} style={layoutConfig.style}>
      {carouselGroups.map((group, index) => {
        const enableProjection = shouldEnableProjection(index);

        return (
          <div key={`carousel-${index}`} className="w-full">
            <Carousel
              images={group}
              {...mapCarouselOptions()}
              enableProjection={enableProjection}
              projectionId={`dynamic-${collection.slug}-${index}`}
            />
          </div>
        );
      })}
    </div>
  );
}
