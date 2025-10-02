/**
 * Slide Up Transition
 *
 * Images slide up from the bottom (like scrolling up a page).
 * Forward navigation: new image slides in from bottom
 * Backward navigation: new image slides in from top
 *
 * Perfect for:
 * - Vertical storytelling
 * - Upward progression feel
 * - Social media-style feeds
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const SlideUpTransition: TransitionHandler = {
  getStyle: ({ isActive, direction, transitionDuration }: TransitionParams) => {
    console.debug('[SlideUpTransition] Rendering', { isActive, direction, transitionDuration });

    // Active image is in position, inactive images are off-screen
    const getTransform = () => {
      if (isActive) return 'translateY(0)';

      // Inactive images exit in OPPOSITE direction of travel
      // Forward (next) → old image exits up (-100% Y)
      // Backward (prev) → old image exits down (100% Y)
      return direction === 'forward' ? 'translateY(-100%)' : 'translateY(100%)';
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
    name: 'Slide Up',
    description: 'Vertical slide transition - images slide upward like scrolling',
    author: 'Kai v3 (Carousel & Animation Specialist)'
  }
};
