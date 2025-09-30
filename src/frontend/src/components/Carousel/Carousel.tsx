/**
 * Carousel Component
 *
 * High-performance image carousel with smooth fade transitions,
 * keyboard navigation, and background integration.
 *
 * Features:
 * - 60fps performance with 4096x4096 images
 * - Fade transitions between images
 * - Keyboard navigation (Arrow keys, Space, ESC)
 * - Integration with Background context for cinematic effect
 * - Responsive design for mobile and desktop
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

'use client';

import { useEffect } from 'react';
import type { CarouselProps } from './types';
import { useCarouselState } from './hooks/useCarouselState';
// import { useBackground } from '@/components/Layout/Background'; // Removed - background handled separately
import CarouselImageRenderer from './CarouselImageRenderer';
import CarouselNavigation from './CarouselNavigation';

export default function Carousel({
  images,
  layout = 'single',
  transitionType = 'fade',
  transitionDuration = 600,
  autoplaySpeed = 0,
  showCaptions = true,
  enableFullscreen = true,
  showNavigation = true,
  showIndicators = true,
  onImageChange,
  className = ''
}: CarouselProps) {

  console.log('[Carousel] Initializing', {
    imageCount: images.length,
    transitionType,
    transitionDuration,
    autoplaySpeed,
    layout
  });

  // Background integration removed - handled separately by parallax scrolling
  // const { setBackground } = useBackground();

  const [state, controls] = useCarouselState({
    imageCount: images.length,
    autoplaySpeed,
    transitionDuration,
    onImageChange,
    images
  });

  const currentImage = images[state.currentIndex];
  const { currentIndex, isFullscreen, direction } = state;

  // Background integration removed - handled separately by parallax scrolling
  // useEffect(() => {
  //   if (currentImage?.src) {
  //     console.log('[Carousel] Updating background', {
  //       imageId: currentImage.id,
  //       imageSrc: currentImage.src,
  //       currentIndex
  //     });
  //     setBackground(currentImage.src);
  //   }
  // }, [currentImage, setBackground, currentIndex]);

  // Prevent scrolling when in fullscreen mode
  useEffect(() => {
    console.log('[Carousel] Fullscreen mode changed', { isFullscreen });

    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (!images || images.length === 0) {
    console.warn('[Carousel] No images provided');
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-black/20 rounded-lg">
        <p className="text-white/60">No images available</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[600px] z-10'} ${className}`}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
    >
      {/* Main Carousel Container */}
      <div className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-full'}`}>
        {/* Image Display */}
        <div className="relative w-full h-full overflow-hidden">
          {images.map((image, index) => (
            <CarouselImageRenderer
              key={image.id}
              image={image}
              isActive={index === currentIndex}
              transitionDuration={transitionDuration}
              transitionType={transitionType}
              direction={direction}
              showCaption={showCaptions && isFullscreen}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        {showNavigation && images.length > 1 && (
          <CarouselNavigation
            currentIndex={currentIndex}
            totalImages={images.length}
            onPrevious={controls.previous}
            onNext={controls.next}
            onGoTo={controls.goTo}
            showIndicators={showIndicators}
            isFullscreen={isFullscreen}
            onToggleFullscreen={enableFullscreen ? controls.toggleFullscreen : undefined}
            isPaused={state.isPaused}
            onToggleAutoplay={autoplaySpeed > 0 ? controls.toggleAutoplay : undefined}
          />
        )}

        {/* Image Counter (Fullscreen only) */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 text-white/80 text-sm font-medium bg-black/50 px-3 py-1.5 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}