/**
 * Fade Transition
 *
 * Classic crossfade effect where images smoothly transition opacity.
 * Active image fades in (opacity: 1), inactive images fade out (opacity: 0).
 *
 * Perfect for:
 * - Cinematic image galleries
 * - Focus on image content without distraction
 * - Elegant, timeless aesthetic
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const FadeTransition: TransitionHandler = {
  getStyle: ({ isActive, transitionDuration }: TransitionParams) => {
    console.debug('[FadeTransition] Rendering', { isActive, transitionDuration });

    return {
      opacity: isActive ? 1 : 0,
      transform: 'none',
      transition: `opacity ${transitionDuration}ms ease-in-out`,
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 10 : 0,
    };
  },

  metadata: {
    name: 'Fade',
    description: 'Classic crossfade transition with smooth opacity change',
    author: 'Kai (Carousel & Animation Specialist)'
  }
};