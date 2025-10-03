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

import { useEffect, useState } from 'react';
import type { CarouselProps } from './types';
import { useCarouselState } from './hooks/useCarouselState';
import { useAutoHideControls } from './hooks/useAutoHideControls';
import { useAutoHideReactions } from './hooks/useAutoHideReactions';
import { useImagePreloader } from './hooks/useImagePreloader';
// import { useBackground } from '@/components/Layout/Background'; // Removed - background handled separately
import CarouselImageRenderer from './CarouselImageRenderer';
import CarouselNavigation from './CarouselNavigation';
import SocialReactions from './SocialReactions';
import ReactionDisplay from './ReactionDisplay';

export default function Carousel({
  images,
  layout = 'single',
  transitionType = 'fade',
  transitionDuration = 600,
  autoplaySpeed = 0,
  speedPreset,
  autoPauseDuration = 5000,
  showCaptions = true,
  enableFullscreen = true,
  fullscreenMode = 'browser',
  showNavigation = true,
  showIndicators = true,
  showArrows = true,
  showPauseButton = true,
  showFullscreenButton = true,
  onImageChange,
  onSpeedChange,
  className = '',
  // Social Reactions
  showReactions = false,
  reactionEmojis,
  onReaction,
  // Auto-hide controls
  autoHideControls = true,
  fadeStartDelay = 2000,
  fadeCompleteDelay = 4000,
  slideIndicatorsOffscreen = true,
  permanentlyHideControls = false,
  // Auto-hide reactions (separate timing from main controls)
  autoHideReactions = true,
  reactionFadeStartDelay = 3000,
  reactionFadeCompleteDelay = 5000,
  // Styling
  containerBorderWidth = 0,
  containerBorderColor = '#ffffff',
  containerBorderOpacity = 1,
  containerBorderRadius = 0,
  containerBackgroundColor = 'transparent',
  containerBackgroundOpacity = 0,
  containerPadding = 16,
  containerPaddingTop,
  containerPaddingRight,
  containerPaddingBottom,
  containerPaddingLeft,
  controlOpacity = 1,
  controlBackgroundOpacity = 0.5
}: CarouselProps) {

  console.log('[Carousel] Initializing', {
    imageCount: images.length,
    transitionType,
    transitionDuration,
    autoplaySpeed,
    autoPauseDuration,
    layout,
    fullscreenMode
  });

  // Background integration removed - handled separately by parallax scrolling
  // const { setBackground } = useBackground();

  const [state, controls] = useCarouselState({
    imageCount: images.length,
    autoplaySpeed,
    speedPreset,
    autoPauseDuration,
    transitionDuration,
    fullscreenMode,
    onImageChange,
    onSpeedChange,
    images
  });

  const { currentIndex, isFullscreen, direction, isPaused, isAutoPaused, currentSpeed } = state;

  // Reaction refresh trigger (increment to force ReactionDisplay to refresh)
  const [reactionRefreshTrigger, setReactionRefreshTrigger] = useState(0);

  // Auto-hide controls management
  const [autoHideState] = useAutoHideControls({
    enabled: autoHideControls,
    fadeStartDelay,
    fadeCompleteDelay,
    permanentlyHide: permanentlyHideControls
  });

  // Auto-hide reactions management (independent from main controls)
  const [reactionAutoHideState] = useAutoHideReactions({
    enabled: showReactions && autoHideReactions,
    fadeStartDelay: reactionFadeStartDelay,
    fadeCompleteDelay: reactionFadeCompleteDelay
  });

  // Smart image preloading
  const { hasInteracted, preloadedCount } = useImagePreloader({
    images,
    currentIndex,
    enabled: true
  });

  console.log('[Carousel] Preloader state', { hasInteracted, preloadedCount });

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
    console.log('[Carousel] Fullscreen mode changed', { isFullscreen, fullscreenMode });

    if (isFullscreen && fullscreenMode === 'browser') {
      // Only prevent scrolling for browser fullscreen
      // Native fullscreen handles this automatically
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen, fullscreenMode]);

  if (!images || images.length === 0) {
    console.warn('[Carousel] No images provided');
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-black/20 rounded-lg">
        <p className="text-white/60">No images available</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

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
              onPrevious={controls.previous}
              onNext={controls.next}
              containerBorderWidth={containerBorderWidth}
              containerBorderColor={containerBorderColor}
              containerBorderOpacity={containerBorderOpacity}
              containerBorderRadius={containerBorderRadius}
              containerBackgroundColor={containerBackgroundColor}
              containerBackgroundOpacity={containerBackgroundOpacity}
              containerPadding={containerPadding}
              containerPaddingTop={containerPaddingTop}
              containerPaddingRight={containerPaddingRight}
              containerPaddingBottom={containerPaddingBottom}
              containerPaddingLeft={containerPaddingLeft}
            />
          ))}

          {/* Social Reactions (if enabled) */}
          {showReactions && currentImage && (
            <>
              <ReactionDisplay
                imageId={currentImage.id}
                refreshTrigger={reactionRefreshTrigger}
                visibility={reactionAutoHideState.visibility}
              />
              <SocialReactions
                imageId={currentImage.id}
                emojis={reactionEmojis}
                onReaction={onReaction}
                onRefresh={() => setReactionRefreshTrigger(prev => prev + 1)}
                visibility={reactionAutoHideState.visibility}
              />
            </>
          )}
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
            showArrows={showArrows}
            showPauseButton={showPauseButton}
            showFullscreenButton={showFullscreenButton}
            isFullscreen={isFullscreen}
            onToggleFullscreen={enableFullscreen ? controls.toggleFullscreen : undefined}
            isPaused={isPaused || isAutoPaused}
            onToggleAutoplay={autoplaySpeed > 0 ? controls.toggleAutoplay : undefined}
            currentSpeed={currentSpeed}
            onCycleSpeed={autoplaySpeed > 0 ? controls.cycleSpeed : undefined}
            controlVisibility={autoHideState.visibility}
            slideIndicatorsOffscreen={slideIndicatorsOffscreen}
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