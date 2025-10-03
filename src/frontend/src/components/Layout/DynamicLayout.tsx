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
    imagesPerCarousel: 'all',
  };

  const defaults = settings.carouselDefaults || {};

  // Filter images only (skip videos for now - carousel v1 limitation)
  const images = (collection.gallery || [])
    .filter((item) => item.type === 'image' && item.urls.large)
    .map((item) => ({
      id: item.id,
      src: getAbsoluteMediaUrl(item.urls.large),
      alt: item.altText || item.title || item.filename,
    }));

  if (images.length === 0) {
    return (
      <div className="text-center text-white/60 py-12">
        <p>No images found in this collection</p>
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
   * Get grid layout classes
   */
  const getLayoutClasses = () => {
    switch (settings.layout) {
      case '2-across':
        return 'grid grid-cols-1 md:grid-cols-2 gap-8';
      case '3-across':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'masonry':
        // TODO: Implement proper masonry with varying heights
        return 'grid grid-cols-1 md:grid-cols-2 gap-8';
      case 'single-column':
      default:
        return 'flex flex-col gap-12';
    }
  };

  return (
    <div className={getLayoutClasses()}>
      {carouselGroups.map((group, index) => (
        <div key={`carousel-${index}`} className="w-full">
          <Carousel
            images={group}
            {...mapCarouselOptions()}
          />
        </div>
      ))}
    </div>
  );
}
