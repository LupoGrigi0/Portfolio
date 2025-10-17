/**
 * Layout Components Export
 *
 * Central export point for all layout components.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-29
 */

export { default as Navigation } from './Navigation';
export { default as Grid, ContentBlock, ResponsiveContainer } from './Grid';
export { default as Background, BackgroundProvider, useBackground } from './Background';
export {
  default as ParallaxBackground,
  ParallaxBackgroundProvider,
  useParallaxBackground,
  createParallaxLayersFromConfig,
  type ParallaxLayer
} from './ParallaxBackground';
// OLD projection system (commented for rollback if needed)
// export {
//   MidgroundProjectionProvider,
//   useMidgroundProjection,
//   useCarouselProjection,
//   type CarouselProjection
// } from './MidgroundProjection';

// NEW projection system by Prism (2025-10-16)
export {
  ProjectionManagerProvider,
  useProjectionManager,
  useCarouselProjection,
  type ProjectionSettings,
  type CarouselProjection
} from './ProjectionManager';
export { CheckerboardVignette, generateCheckerboardMask } from './CheckerboardVignette';