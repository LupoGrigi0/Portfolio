/**
 * Carousel Type Definitions
 *
 * TypeScript interfaces and types for the Carousel system.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-10-01 - Added autoplay speed presets (Kai v3)
 */

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';
export type CarouselLayout = 'single' | 'side-by-side' | 'stacked';
export type FullscreenMode = 'browser' | 'native';

/**
 * Autoplay speed presets for user-adjustable playback
 */
export type AutoplaySpeedPreset = 'slow' | 'medium' | 'fast' | 'veryFast' | 'ultraFast' | 'blazing' | 'custom';

export interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  thumbnail?: string;
}

export interface CarouselProps {
  images: CarouselImage[];
  layout?: CarouselLayout;
  transitionType?: TransitionType;
  transitionDuration?: number;
  autoplaySpeed?: number;
  autoPauseDuration?: number; // Duration to pause autoplay after manual navigation (ms), 0 = disabled
  showCaptions?: boolean;
  enableFullscreen?: boolean;
  fullscreenMode?: FullscreenMode; // 'browser' = fixed inset-0, 'native' = true fullscreen API (default: 'browser')
  showNavigation?: boolean;
  showIndicators?: boolean;
  showArrows?: boolean; // Show/hide navigation arrows (default: true)
  showPauseButton?: boolean; // Show/hide pause button (default: true)
  showFullscreenButton?: boolean; // Show/hide fullscreen button (default: true)
  onImageChange?: (index: number, image: CarouselImage) => void;
  className?: string;
}

export interface CarouselState {
  currentIndex: number;
  isTransitioning: boolean;
  direction: 'forward' | 'backward' | null;
  isFullscreen: boolean;
  isPaused: boolean;
  isAutoPaused: boolean; // Temporarily paused due to manual interaction
  currentSpeed: AutoplaySpeedPreset; // Current autoplay speed preset
}

export interface CarouselControls {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  toggleFullscreen: () => void;
  toggleAutoplay: () => void;
  pause: () => void;
  resume: () => void;
  cycleSpeed: () => void; // Cycle through speed presets (slow -> medium -> fast -> veryFast -> slow)
  setSpeed: (speed: AutoplaySpeedPreset) => void; // Set specific speed preset
}

/**
 * Transition System Types
 *
 * These interfaces define the contract for carousel transitions.
 * Each transition is a self-contained module that returns CSS properties.
 */

export interface TransitionParams {
  isActive: boolean;
  direction: 'forward' | 'backward' | null;
  transitionDuration: number;
}

export interface TransitionHandler {
  /**
   * Returns CSS properties for the transition effect
   * @param params - Transition state parameters
   * @returns React CSSProperties object
   */
  getStyle: (params: TransitionParams) => React.CSSProperties;

  /**
   * Optional: Transition-specific metadata
   */
  metadata?: {
    name: string;
    description: string;
    author?: string;
  };
}