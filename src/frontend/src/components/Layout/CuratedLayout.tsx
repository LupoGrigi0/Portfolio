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

  // Track which images have been used by explicit sections (for dynamic-fill)
  const usedImageFilenames = new Set<string>();

  /**
   * Variable substitution for template configs
   * Replaces $CollectionName, $ImageCount, etc. with actual values
   */
  const substituteVariables = (text: string): string => {
    return text
      .replace(/\$CollectionName/g, collection.name)
      .replace(/\$CollectionTitle/g, collection.config?.title || collection.name)
      .replace(/\$ImageCount/g, collection.imageCount.toString())
      .replace(/\$VideoCount/g, collection.videoCount.toString())
      .replace(/\$TotalCount/g, (collection.imageCount + collection.videoCount).toString());
  };

  /**
   * Resolve image filenames to full URLs
   */
  const resolveImageUrl = (filename: string): string => {
    // Check if already a full URL
    if (filename.startsWith('http')) return filename;

    // Find in gallery
    const item = collection.gallery?.find(
      (g) => g.filename === filename || g.urls?.large?.includes(filename) || g.urls?.original?.includes(filename)
    );

    if (item) {
      // Use large, or fallback to medium, or fallback to original
      const imageUrl = item.urls.large || item.urls.medium || item.urls.original;
      return getAbsoluteMediaUrl(imageUrl);
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

    // Skip + Limit (for pagination/offsetting)
    const skip = query.skip || 0;
    const limit = query.limit;

    if (limit) {
      filtered = filtered.slice(skip, skip + limit);
    } else if (skip > 0) {
      filtered = filtered.slice(skip);
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
      // Auto-fill: first 20 images (to prevent 500+ image carousels with silly pagination)
      filenames = collection.gallery
        ?.filter((item) => item.type === 'image')
        .slice(0, 20)
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

  /**
   * Get hero image URL from collection metadata
   * Backend provides heroImage path directly at collection level
   */
  const getHeroImageUrl = (): string | undefined => {
    if (!collection.heroImage) return undefined;
    return getAbsoluteMediaUrl(collection.heroImage);
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {sections.map((section, index) => {
        const key = `section-${index}`;

        switch (section.type) {
          case 'hero': {
            // Use explicit backgroundImage from config, or fall back to collection's hero image
            const heroImageUrl = section.backgroundImage
              ? resolveImageUrl(section.backgroundImage)
              : getHeroImageUrl();

            return (
              <HeroSection
                key={key}
                title={substituteVariables(section.title)}
                subtitle={section.subtitle ? substituteVariables(section.subtitle) : undefined}
                textPosition={section.textPosition}
                containerOpacity={section.containerOpacity}
                separator={section.separator}
                backgroundImage={heroImageUrl}
                backgroundPosition={section.backgroundPosition}
                backgroundSize={section.backgroundSize}
                minHeight={section.minHeight}
              />
            );
          }

          case 'text':
            return (
              <div key={key} className={getWidthClass(section.width)}>
                <TextSection
                  content={substituteVariables(section.content)}
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

            // Track which images are used (for dynamic-fill tracking)
            if (Array.isArray(section.images)) {
              section.images.forEach(filename => usedImageFilenames.add(filename));
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

          case 'row': {
            // Render multiple sections in a flex row (for side-by-side layouts)
            return (
              <div key={key} className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-stretch">
                {section.sections?.map((subsection: any, subIndex: number) => {
                  const subKey = `${key}-${subIndex}`;

                  if (subsection.type === 'carousel') {
                    const images = resolveSectionImages(subsection);
                    if (images.length === 0) return null;

                    return (
                      <div key={subKey} className={getWidthClass(subsection.width)}>
                        <Carousel
                          images={images}
                          {...mapCarouselOptions(subsection.carouselOptions)}
                        />
                      </div>
                    );
                  }

                  if (subsection.type === 'text') {
                    return (
                      <div key={subKey} className={getWidthClass(subsection.width)}>
                        <TextSection
                          content={substituteVariables(subsection.content)}
                          position={subsection.position}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          }

          case 'dynamic-fill': {
            // Get all remaining unused images (excluding hero images)
            const allImages = collection.gallery?.filter(item => {
              if (item.type !== 'image') return false;
              if (/^hero[.-]/i.test(item.filename)) return false;
              const hasValidUrl = item.urls && (item.urls.large || item.urls.medium || item.urls.original);
              return hasValidUrl;
            }) || [];
            const remainingImages = allImages.filter(item => !usedImageFilenames.has(item.filename));

            // Determine how many images to use
            const count = section.count === 'all' ? remainingImages.length : (section.count || remainingImages.length);
            const imagesToUse = remainingImages.slice(0, count);

            // Mark these as used
            imagesToUse.forEach(img => usedImageFilenames.add(img.filename));

            // Group into carousels
            const perCarousel = section.imagesPerCarousel === 'all' ? imagesToUse.length : (section.imagesPerCarousel || 5);
            const carouselGroups: CarouselImage[][] = [];

            for (let i = 0; i < imagesToUse.length; i += perCarousel) {
              const group = imagesToUse.slice(i, i + perCarousel).map((item, idx) => {
                const imageUrl = item.urls.large || item.urls.medium || item.urls.original;
                return {
                  id: `dynamic-${i}-${idx}`,
                  src: getAbsoluteMediaUrl(imageUrl),
                  alt: item.altText || item.title || item.filename,
                };
              });
              carouselGroups.push(group);
            }

            // Render with layout and spacing
            const layout = section.layout || 'single-column';
            const spacing = section.spacing || {};
            const horizontalGap = spacing.horizontal ?? 32;
            const verticalGap = spacing.vertical ?? 48;

            // Use inline CSS for dynamic spacing (Tailwind arbitrary values don't work with runtime values)
            const layoutStyle: React.CSSProperties = {
              rowGap: `${verticalGap}px`,
              columnGap: `${horizontalGap}px`,
            };

            let layoutClass = '';
            if (layout === '2-across') {
              layoutClass = 'grid grid-cols-1 md:grid-cols-2';
            } else if (layout === '3-across') {
              layoutClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            } else {
              layoutClass = 'flex flex-col';
            }

            const carouselOptions = mapCarouselOptions(section.carouselDefaults);

            return (
              <div key={key} className={layoutClass} style={layoutStyle}>
                {carouselGroups.map((group, idx) => (
                  <div key={`dynamic-carousel-${idx}`} className="w-full">
                    <Carousel images={group} {...carouselOptions} />
                  </div>
                ))}
              </div>
            );
          }

          default:
            console.warn(`Unknown section type: ${(section as any).type}`);
            return null;
        }
      })}
    </div>
  );
}
