/**
 * Zoom Transition
 *
 * Images scale in/out during transition for a dramatic effect.
 * Active image scales from 0.8 to 1.0 while fading in.
 * Inactive images scale to 1.2 while fading out (creates depth).
 *
 * Perfect for:
 * - Dramatic reveals
 * - Focus on subject matter
 * - Modern, dynamic aesthetic
 * - Photo galleries with impact
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const ZoomTransition: TransitionHandler = {
  getStyle: ({ isActive, transitionDuration }: TransitionParams) => {
    console.debug('[ZoomTransition] Rendering', { isActive, transitionDuration });

    // Active image: scale from 0.8 to 1.0 (zoom in)
    // Inactive image: scale to 1.2 (zoom out) - creates depth effect
    const scale = isActive ? 1 : 0.8;
    const opacity = isActive ? 1 : 0;

    return {
      opacity,
      transform: `scale(${scale})`,
      transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 10 : 0,
    };
  },

  metadata: {
    name: 'Zoom',
    description: 'Dramatic scale transition with depth effect',
    author: 'Kai (Carousel & Animation Specialist)'
  }
};