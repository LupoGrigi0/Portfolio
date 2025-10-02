/**
 * Slide Down Transition
 *
 * Images slide down from the top (like scrolling down a page).
 * Forward navigation: new image slides in from top
 * Backward navigation: new image slides in from bottom
 *
 * Perfect for:
 * - Vertical storytelling
 * - Downward progression feel
 * - Timeline-style presentations
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const SlideDownTransition: TransitionHandler = {
  getStyle: ({ isActive, direction, transitionDuration }: TransitionParams) => {
    console.debug('[SlideDownTransition] Rendering', { isActive, direction, transitionDuration });

    // Active image is in position, inactive images are off-screen
    const getTransform = () => {
      if (isActive) return 'translateY(0)';

      // Inactive images exit in OPPOSITE direction of travel
      // Forward (next) → old image exits down (100% Y)
      // Backward (prev) → old image exits up (-100% Y)
      return direction === 'forward' ? 'translateY(100%)' : 'translateY(-100%)';
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
    name: 'Slide Down',
    description: 'Vertical slide transition - images slide downward like a timeline',
    author: 'Kai v3 (Carousel & Animation Specialist)'
  }
};
