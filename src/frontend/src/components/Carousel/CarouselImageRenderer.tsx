/**
 * Carousel Image Component
 *
 * Individual image within the carousel with pluggable transition effects.
 * Handles progressive loading and uses the transition registry for effects.
 *
 * Architecture Note:
 * This component is intentionally simple - all transition logic is delegated
 * to the transition registry. Adding new transitions requires NO changes here.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-09-30 - Refactored to use transition registry
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CarouselImage as CarouselImageType, TransitionType } from './types';
import { getTransition } from './transitions';

interface CarouselImageRendererProps {
  image: CarouselImageType;
  isActive: boolean;
  transitionDuration: number;
  transitionType: TransitionType;
  direction: 'forward' | 'backward' | null;
  showCaption?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function CarouselImageRenderer({
  image,
  isActive,
  transitionDuration,
  transitionType,
  direction,
  showCaption = false,
  onPrevious,
  onNext
}: CarouselImageRendererProps) {

  // Track image loading errors for graceful degradation
  const [imageError, setImageError] = useState(false);

  // Get the appropriate transition handler from the registry
  const transitionHandler = getTransition(transitionType);

  // Generate transition-specific styles
  const transitionStyle = transitionHandler.getStyle({
    isActive,
    direction,
    transitionDuration
  });

  console.debug('[CarouselImageRenderer] Rendering image', {
    imageId: image.id,
    isActive,
    transitionType,
    direction,
    transitionName: transitionHandler.metadata?.name
  });

  /**
   * Handle click/touch on image to navigate
   * Left 50% = previous, Right 50% = next
   *
   * @author Kai v3 (Carousel & Animation Specialist)
   */
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only respond if this is the active image and we have navigation callbacks
    if (!isActive || (!onPrevious && !onNext)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercentage = (clickX / width) * 100;

    console.log('[CarouselImageRenderer] Image clicked', {
      imageId: image.id,
      clickX,
      width,
      clickPercentage: clickPercentage.toFixed(1) + '%',
      zone: clickPercentage < 50 ? 'left (previous)' : 'right (next)'
    });

    // Left 50% = previous, Right 50% = next
    if (clickPercentage < 50 && onPrevious) {
      onPrevious();
    } else if (clickPercentage >= 50 && onNext) {
      onNext();
    }
  };

  return (
    <div
      className="absolute inset-0 group"
      style={transitionStyle}
      aria-hidden={!isActive}
    >
      {/* Navigation zones - invisible overlay with cursor hints */}
      {isActive && (onPrevious || onNext) && (
        <div className="absolute inset-0 z-[5] flex" onClick={handleImageClick}>
          {/* Left 50% - Previous zone */}
          {onPrevious && (
            <div className="w-1/2 h-full cursor-w-resize" aria-label="Previous image" />
          )}
          {/* Right 50% - Next zone */}
          {onNext && (
            <div className="w-1/2 h-full cursor-e-resize" aria-label="Next image" />
          )}
        </div>
      )}

      {/* Image container */}
      <div className="absolute inset-0">
        {imageError ? (
          // Fallback UI for failed image loads
          <div className="w-full h-full flex items-center justify-center bg-black/30">
            <div className="text-center text-white/60 p-8">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Failed to load image</p>
              {image.title && (
                <p className="text-xs text-white/40 mt-2">{image.title}</p>
              )}
            </div>
          </div>
        ) : (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-contain p-4"
            priority={isActive}
            sizes="100vw"
            quality={90}
            onError={() => {
              console.error('[CarouselImageRenderer] Image failed to load:', {
                id: image.id,
                src: image.src,
                alt: image.alt
              });
              setImageError(true);
            }}
          />
        )}
        {showCaption && (image.caption || image.title) && (
          <div className="absolute bottom-8 left-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white z-10">
            {image.title && (
              <h3 className="text-lg font-semibold mb-1">{image.title}</h3>
            )}
            {image.caption && (
              <p className="text-sm text-white/80">{image.caption}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}