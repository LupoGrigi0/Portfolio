/**
 * Carousel Navigation Component
 *
 * Navigation controls for the carousel including:
 * - Previous/Next arrows
 * - Dot indicators
 * - Fullscreen toggle
 * - Autoplay pause/resume
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

'use client';

interface CarouselNavigationProps {
  currentIndex: number;
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  showIndicators?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isPaused?: boolean;
  onToggleAutoplay?: () => void;
}

export default function CarouselNavigation({
  currentIndex,
  totalImages,
  onPrevious,
  onNext,
  onGoTo,
  showIndicators = true,
  isFullscreen = false,
  onToggleFullscreen,
  isPaused = false,
  onToggleAutoplay
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

  return (
    <>
      {/* Previous/Next Arrow Buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-20">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
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
          className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
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

      {/* Dot Indicators */}
      {showIndicators && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-2 rounded-full z-20">
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

      {/* Fullscreen & Autoplay Controls (Top Right) */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        {/* Autoplay Toggle */}
        {onToggleAutoplay && (
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

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
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
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white/60 text-xs bg-black/30 px-3 py-1 rounded">
          Use ← → arrow keys to navigate • ESC to exit • Space to pause
        </div>
      )}
    </>
  );
}