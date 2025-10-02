/**
 * Carousel Type Definitions
 *
 * TypeScript interfaces and types for the Carousel system.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';
export type CarouselLayout = 'single' | 'side-by-side' | 'stacked';

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
  showNavigation?: boolean;
  showIndicators?: boolean;
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
}

export interface CarouselControls {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  toggleFullscreen: () => void;
  toggleAutoplay: () => void;
  pause: () => void;
  resume: () => void;
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