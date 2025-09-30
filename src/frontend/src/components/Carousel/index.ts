/**
 * Carousel Components
 *
 * High-performance image carousel system with smooth transitions,
 * touch gestures, and seamless background integration.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

export { default as Carousel } from './Carousel';
export { default as CarouselImage } from './CarouselImage';
export { default as CarouselNavigation } from './CarouselNavigation';
export { useCarouselState } from './hooks/useCarouselState';

export type {
  CarouselProps,
  CarouselImage as CarouselImageType,
  TransitionType,
  CarouselLayout
} from './types';