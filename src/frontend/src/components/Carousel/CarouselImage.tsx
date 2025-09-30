/**
 * Carousel Image Component
 *
 * Individual image within the carousel with transition effects.
 * Handles progressive loading and smooth fade transitions.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

'use client';

import Image from 'next/image';
import type { CarouselImage as CarouselImageType, TransitionType } from './types';

interface CarouselImageProps {
  image: CarouselImageType;
  isActive: boolean;
  isTransitioning: boolean;
  transitionDuration: number;
  transitionType: TransitionType;
  showCaption?: boolean;
}

export default function CarouselImage({
  image,
  isActive,
  isTransitioning,
  transitionDuration,
  transitionType,
  showCaption = false
}: CarouselImageProps) {

  // Calculate opacity for fade transition
  const opacity = isActive ? 1 : 0;

  // Transform for slide transition (future enhancement)
  const getTransform = () => {
    if (transitionType !== 'slide') return 'none';
    // Slide transitions to be implemented in Phase 2
    return 'none';
  };

  // Scale for zoom transition (future enhancement)
  const getScale = () => {
    if (transitionType !== 'zoom') return 1;
    // Zoom transitions to be implemented in Phase 2
    return 1;
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity,
        transform: getTransform(),
        scale: getScale(),
        transition: `opacity ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out`,
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: isActive ? 10 : 0
      }}
      aria-hidden={!isActive}
    >
      {/* Image Container */}
      <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width || 1920}
            height={image.height || 1280}
            className="object-contain max-w-full max-h-full"
            priority={isActive}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            quality={90}
            placeholder="blur"
            blurDataURL={image.thumbnail || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=`}
          />
        </div>
      </div>

      {/* Caption Overlay (Fullscreen mode) */}
      {showCaption && (image.caption || image.title) && (
        <div className="absolute bottom-8 left-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
          {image.title && (
            <h3 className="text-lg font-semibold mb-1">{image.title}</h3>
          )}
          {image.caption && (
            <p className="text-sm text-white/80">{image.caption}</p>
          )}
        </div>
      )}
    </div>
  );
}