/**
 * Carousel Navigation Component
 *
 * Navigation controls for the carousel including:
 * - Previous/Next arrows
 * - Dot indicators
 * - Fullscreen toggle
 * - Autoplay pause/resume
 * - Auto-hide with progressive fade/slide
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-10-01 - Auto-hide controls (Kai v3)
 */

'use client';

import type { AutoplaySpeedPreset } from './types';
import type { ControlVisibility } from './hooks/useAutoHideControls';
import { AUTOPLAY_SPEEDS } from './constants';

interface CarouselNavigationProps {
  currentIndex: number;
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  showIndicators?: boolean;
  showArrows?: boolean;
  showPauseButton?: boolean;
  showFullscreenButton?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isPaused?: boolean;
  onToggleAutoplay?: () => void;
  currentSpeed?: AutoplaySpeedPreset;
  onCycleSpeed?: () => void;

  // Auto-hide controls
  controlVisibility?: ControlVisibility;
  slideIndicatorsOffscreen?: boolean;
}

export default function CarouselNavigation({
  currentIndex,
  totalImages,
  onPrevious,
  onNext,
  onGoTo,
  showIndicators = true,
  showArrows = true,
  showPauseButton = true,
  showFullscreenButton = true,
  isFullscreen = false,
  onToggleFullscreen,
  isPaused = false,
  onToggleAutoplay,
  currentSpeed = 'medium',
  onCycleSpeed,
  controlVisibility = 'visible',
  slideIndicatorsOffscreen = true
}: CarouselNavigationProps) {

  const handlePrevious = () => {
    console.log('[CarouselNavigation] Previous button clicked');
    onPrevious();
  };

  const handleNext = () => {
    console.log('[CarouselNavigation] Next button clicked');
    onNext();
  };

  const handleGoTo = (index: number) => {
    console.log('[CarouselNavigation] Dot indicator clicked', { index });
    onGoTo(index);
  };

  const handleToggleFullscreen = () => {
    console.log('[CarouselNavigation] Fullscreen toggle clicked', { currentState: isFullscreen });
    onToggleFullscreen?.();
  };

  const handleToggleAutoplay = () => {
    console.log('[CarouselNavigation] Autoplay toggle clicked', { isPaused });
    onToggleAutoplay?.();
  };

  const handleCycleSpeed = () => {
    console.log('[CarouselNavigation] Speed cycle clicked', { currentSpeed });
    onCycleSpeed?.();
  };

  // Format speed for display
  const getSpeedLabel = (speed: AutoplaySpeedPreset): string => {
    const labels: Record<AutoplaySpeedPreset, string> = {
      slow: '1x',
      medium: '2x',
      fast: '3x',
      veryFast: '4x',
      ultraFast: '5x',
      blazing: '6x',
      custom: 'Custom'
    };
    return labels[speed];
  };

  /**
   * Get CSS classes for control visibility
   * Progressive fade: visible → semi-faded (50%) → hidden (0% + slide)
   */
  const getVisibilityClasses = (): string => {
    const baseTransition = 'transition-all duration-500 ease-in-out';

    switch (controlVisibility) {
      case 'visible':
        return `${baseTransition} opacity-100 translate-y-0`;
      case 'semi-faded':
        return `${baseTransition} opacity-50 translate-y-0`;
      case 'hidden':
        return `${baseTransition} opacity-0`;
      default:
        return `${baseTransition} opacity-100 translate-y-0`;
    }
  };

  /**
   * Get CSS classes for indicators (with optional slide-off)
   */
  const getIndicatorVisibilityClasses = (): string => {
    const baseTransition = 'transition-all duration-500 ease-in-out';

    if (!slideIndicatorsOffscreen) {
      // Just fade, no slide
      return getVisibilityClasses();
    }

    switch (controlVisibility) {
      case 'visible':
        return `${baseTransition} opacity-100 translate-y-0`;
      case 'semi-faded':
        return `${baseTransition} opacity-50 translate-y-0`;
      case 'hidden':
        return `${baseTransition} opacity-0 translate-y-12`;
      default:
        return `${baseTransition} opacity-100 translate-y-0`;
    }
  };

  return (
    <>
      {/* Previous/Next Arrow Buttons */}
      {showArrows && (
        <div className={`absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-20 ${getVisibilityClasses()}`}>
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous image"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next image"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      )}

      {/* Dot Indicators */}
      {showIndicators && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-2 rounded-full z-20 ${getIndicatorVisibilityClasses()}`}>
          {Array.from({ length: totalImages }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleGoTo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Fullscreen & Autoplay Controls (Bottom Right) */}
      <div className={`absolute bottom-4 right-4 flex gap-2 z-20 ${getVisibilityClasses()}`}>
        {/* Autoplay Toggle */}
        {showPauseButton && onToggleAutoplay && (
          <button
            onClick={handleToggleAutoplay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
          >
            {isPaused ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>
        )}

        {/* Speed Control */}
        {onCycleSpeed && (
          <button
            onClick={handleCycleSpeed}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full px-3 py-2.5 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[50px]"
            aria-label={`Autoplay speed: ${currentSpeed} (${AUTOPLAY_SPEEDS[currentSpeed]}ms). Click to cycle.`}
            title={`Speed: ${currentSpeed} (${(AUTOPLAY_SPEEDS[currentSpeed] / 1000).toFixed(1)}s per image)`}
          >
            <span className="text-xs font-bold">{getSpeedLabel(currentSpeed)}</span>
          </button>
        )}

        {/* Fullscreen Toggle */}
        {showFullscreenButton && onToggleFullscreen && (
          <button
            onClick={handleToggleFullscreen}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Keyboard Hints (Only in fullscreen) */}
      {isFullscreen && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/60 text-xs bg-black/30 px-3 py-1 rounded">
          Use ← → arrow keys to navigate • ESC to exit • Space to pause
        </div>
      )}
    </>
  );
}