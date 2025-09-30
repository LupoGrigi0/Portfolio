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
}

export default function CarouselImageRenderer({
  image,
  isActive,
  transitionDuration,
  transitionType,
  direction,
  showCaption = false
}: CarouselImageRendererProps) {

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

  return (
    <div
      className="absolute inset-0"
      style={transitionStyle}
      aria-hidden={!isActive}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-contain p-4"
        priority={isActive}
        sizes="100vw"
        quality={90}
      />
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
  );
}