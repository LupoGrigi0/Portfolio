/**
 * CuratedLayout - Renders config-driven curated collection pages
 *
 * Supports:
 * - Hero sections with semi-transparent overlays
 * - Text blocks (markdown/HTML)
 * - Carousels with specific image sets
 * - Single images and videos
 * - Visual separators
 * - Flexible width/positioning
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-03
 */

'use client';

import { Collection, CollectionConfig, getAbsoluteMediaUrl } from '@/lib/api-client';
import {
  HeroSection,
  TextSection,
  ImageSection,
  VideoSection,
  SeparatorSection,
} from './Sections';
import Carousel from '@/components/Carousel/Carousel';
import type { CarouselImage } from '@/components/Carousel/types';

interface CuratedLayoutProps {
  collection: Collection;
  config: CollectionConfig;
}

export default function CuratedLayout({ collection, config }: CuratedLayoutProps) {
  const sections = config.sections || [];

  /**
   * Resolve image filenames to full URLs
   */
  const resolveImageUrl = (filename: string): string => {
    // Check if already a full URL
    if (filename.startsWith('http')) return filename;

    // Find in gallery
    const item = collection.gallery?.find(
      (g) => g.filename === filename || g.urls.large.includes(filename)
    );

    if (item) {
      return getAbsoluteMediaUrl(item.urls.large);
    }

    // Fallback: assume it's in collection directory
    return `/media/${collection.slug}/${filename}`;
  };

  /**
   * Resolve image query to actual image list
   */
  const resolveImageQuery = (query: any): string[] => {
    if (!collection.gallery) return [];

    let filtered = collection.gallery.filter((item) => item.type === 'image');

    // Aspect ratio filter
    if (query.aspectRatio) {
      if (typeof query.aspectRatio === 'string') {
        // Parse ">2.5" or "<1.5" etc.
        const match = query.aspectRatio.match(/([><]=?)([\d.]+)/);
        if (match) {
          const operator = match[1];
          const value = parseFloat(match[2]);
          filtered = filtered.filter((item) => {
            const ratio = item.dimensions.aspectRatio;
            if (operator === '>') return ratio > value;
            if (operator === '<') return ratio < value;
            if (operator === '>=') return ratio >= value;
            if (operator === '<=') return ratio <= value;
            return true;
          });
        }
      } else if (query.aspectRatio.min || query.aspectRatio.max) {
        filtered = filtered.filter((item) => {
          const ratio = item.dimensions.aspectRatio;
          if (query.aspectRatio.min && ratio < query.aspectRatio.min) return false;
          if (query.aspectRatio.max && ratio > query.aspectRatio.max) return false;
          return true;
        });
      }
    }

    // Filename pattern filter
    if (query.filename) {
      const pattern = new RegExp(query.filename, 'i');
      filtered = filtered.filter((item) => pattern.test(item.filename));
    }

    // Tags filter (if available in MediaItem)
    if (query.tags && query.tags.length > 0) {
      // TODO: Add tags support when backend provides it
      console.warn('Tag filtering not yet supported by backend');
    }

    // Sort
    if (query.sortBy === 'filename') {
      filtered.sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (query.sortBy === 'random') {
      filtered.sort(() => Math.random() - 0.5);
    }

    // Limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered.map((item) => item.filename);
  };

  /**
   * Resolve section images to carousel format
   */
  const resolveSectionImages = (section: any): CarouselImage[] => {
    let filenames: string[] = [];

    if (Array.isArray(section.images)) {
      // Explicit array of filenames
      filenames = section.images;
    } else if (section.images === 'auto') {
      // Auto-fill: all remaining images not used in other sections
      // For now, use all gallery images (TODO: track used images)
      filenames = collection.gallery
        ?.filter((item) => item.type === 'image')
        .map((item) => item.filename) || [];
    } else if (typeof section.images === 'object') {
      // Image query
      filenames = resolveImageQuery(section.images);
    }

    return filenames.map((filename, index) => ({
      id: `${section.type}-${index}-${filename}`,
      src: resolveImageUrl(filename),
      alt: filename,
    }));
  };

  /**
   * Map config carousel options to Carousel component props
   */
  const mapCarouselOptions = (options: any = {}) => ({
    transition: options.transition || 'fade',
    autoplay: options.autoplay ?? false,
    interval: options.interval || 8000,
    speed: options.speed || 800,
    showNavigation: options.controls?.nav?.show ?? true,
    showSocialReactions: options.controls?.reactions?.show ?? false,
    autoHideSocial: options.controls?.reactions?.autoHide ?? true,
    reserveTop: options.reservedSpace?.top || 0,
    reserveBottom: options.reservedSpace?.bottom || 0,
    reserveLeft: options.reservedSpace?.left || 0,
    reserveRight: options.reservedSpace?.right || 0,
    reserveBackgroundColor: options.reservedSpace?.backgroundColor || 'transparent',
    reserveBackgroundOpacity: options.reservedSpace?.backgroundOpacity || 0,
    containerBorderWidth: options.styling?.borderWidth || 0,
    containerBorderColor: options.styling?.borderColor || '#ffffff',
    containerBorderOpacity: options.styling?.borderOpacity || 1,
    containerBorderRadius: options.styling?.borderRadius || 0,
    containerBackgroundColor: options.styling?.backgroundColor || 'transparent',
    containerBackgroundOpacity: options.styling?.backgroundOpacity || 0,
    containerPadding: options.styling?.padding || 16,
  });

  /**
   * Get Tailwind width class from config
   */
  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'half': return 'w-1/2';
      case 'third': return 'w-1/3';
      case 'quarter': return 'w-1/4';
      case 'full':
      default: return 'w-full';
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {sections.map((section, index) => {
        const key = `section-${index}`;

        switch (section.type) {
          case 'hero':
            return (
              <HeroSection
                key={key}
                title={section.title}
                subtitle={section.subtitle}
                textPosition={section.textPosition}
                containerOpacity={section.containerOpacity}
                separator={section.separator}
              />
            );

          case 'text':
            return (
              <div key={key} className={getWidthClass(section.width)}>
                <TextSection
                  content={section.content}
                  position={section.position}
                />
              </div>
            );

          case 'carousel': {
            const images = resolveSectionImages(section);
            if (images.length === 0) {
              console.warn(`Carousel section ${index} has no images`);
              return null;
            }

            return (
              <div key={key} className={getWidthClass(section.width)}>
                <Carousel
                  images={images}
                  {...mapCarouselOptions(section.carouselOptions)}
                />
              </div>
            );
          }

          case 'image':
            return (
              <div key={key} className={getWidthClass(section.width)}>
                <ImageSection
                  src={resolveImageUrl(section.src)}
                  alt={section.alt}
                  caption={section.caption}
                />
              </div>
            );

          case 'video':
            return (
              <div key={key} className={getWidthClass(section.width)}>
                <VideoSection
                  src={resolveImageUrl(section.src)} // Videos use same resolver
                  caption={section.caption}
                  autoplay={section.autoplay}
                  controls={section.controls}
                  loop={section.loop}
                  muted={section.muted}
                />
              </div>
            );

          case 'separator':
            return (
              <SeparatorSection
                key={key}
                style={section.style}
                opacity={section.opacity}
                thickness={section.thickness}
                spacing={section.spacing}
              />
            );

          default:
            console.warn(`Unknown section type: ${(section as any).type}`);
            return null;
        }
      })}
    </div>
  );
}
