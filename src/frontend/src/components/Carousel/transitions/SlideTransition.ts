/**
 * Slide Transition
 *
 * Images slide in from the side based on navigation direction.
 * Forward navigation: new image slides in from right
 * Backward navigation: new image slides in from left
 *
 * Perfect for:
 * - Linear storytelling
 * - Sequential navigation emphasis
 * - Dynamic, energetic feel
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const SlideTransition: TransitionHandler = {
  getStyle: ({ isActive, direction, transitionDuration }: TransitionParams) => {
    console.debug('[SlideTransition] Rendering', { isActive, direction, transitionDuration });

    // Active image is in position, inactive images are off-screen
    const getTransform = () => {
      if (isActive) return 'translateX(0)';

      // Inactive images exit in OPPOSITE direction of travel
      // Forward (next) → old image exits left (-100%)
      // Backward (prev) → old image exits right (100%)
      // Null direction: default to left
      return direction === 'forward' ? 'translateX(-100%)' : 'translateX(100%)';
    };

    return {
      opacity: isActive ? 1 : 0,
      transform: getTransform(),
      transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 10 : 0,
    };
  },

  metadata: {
    name: 'Slide',
    description: 'Directional slide transition with smooth horizontal movement',
    author: 'Kai (Carousel & Animation Specialist)'
  }
};