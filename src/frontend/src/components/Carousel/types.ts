/**
 * Carousel Type Definitions
 *
 * TypeScript interfaces and types for the Carousel system.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-10-01 - Added autoplay speed presets (Kai v3)
 */

export type TransitionType = 'none' | 'fade' | 'slide' | 'slide-up' | 'slide-down' | 'zoom' | 'flip' | 'flipbook';
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
  speedPreset?: AutoplaySpeedPreset; // Controlled speed preset (syncs with external config panels)
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
  onSpeedChange?: (speed: AutoplaySpeedPreset) => void; // Callback when speed changes (via cycle button or setSpeed)
  className?: string;

  // Social Reactions (UI-only, default: OFF)
  showReactions?: boolean; // Enable social reactions UI (default: false)
  reactionEmojis?: string[]; // Custom emoji set (default: ❤️💀🍑❤️‍🔥🤢☢️👍👎➕)
  onReaction?: (emoji: string, imageId: string) => void; // Callback when user reacts (stub)

  // Auto-hide controls configuration
  autoHideControls?: boolean; // Enable auto-hide behavior (default: true)
  fadeStartDelay?: number; // Delay before starting fade to 50% (default: 2000ms)
  fadeCompleteDelay?: number; // Delay before fading to 0% and sliding off (default: 4000ms)
  slideIndicatorsOffscreen?: boolean; // Slide progress dots off bottom when hidden (default: true)
  permanentlyHideControls?: boolean; // Override to always hide controls (default: false)

  // Auto-hide reactions configuration (separate from main controls)
  autoHideReactions?: boolean; // Enable auto-hide for reactions (default: true if showReactions is true)
  reactionFadeStartDelay?: number; // Delay before reactions start to fade (default: 3000ms)
  reactionFadeCompleteDelay?: number; // Delay before reactions fully hide (default: 5000ms)
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