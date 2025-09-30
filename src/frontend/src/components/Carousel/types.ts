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