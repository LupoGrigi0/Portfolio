/**
 * Reference Carousel Implementation
 *
 * Simple, proven carousel pattern using basic React and CSS.
 * Based on common Next.js carousel implementations.
 *
 * This is for comparison/testing purposes.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCarouselProjection } from '@/components/Layout';

interface ReferenceImage {
  id: string;
  src: string;
  alt: string;
}

interface ReferenceCarouselProps {
  images: ReferenceImage[];
  enableProjection?: boolean;
  projectionId?: string;
}

export default function ReferenceCarousel({
  images,
  enableProjection = false,
  projectionId
}: ReferenceCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Midground projection (carousel projects first image onto background layer)
  const carouselRef = useCarouselProjection(
    projectionId || `ref-carousel-${images[0]?.id || 'default'}`,
    enableProjection && images[0] ? images[0].src : null,
    enableProjection
  );

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  console.log('[ReferenceCarousel] Current index:', currentIndex);

  return (
    <div ref={carouselRef} className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              pointerEvents: index === currentIndex ? 'auto' : 'none',
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority={index === 0}
              quality={90}
            />
          </div>
        ))}
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-3 z-20"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-3 z-20"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm z-20">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}