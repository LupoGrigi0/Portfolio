/**
 * Flipbook 3D Transition
 *
 * Creates a 3D flipbook effect where the current image is centered at full size,
 * while previous/next images are visible on the sides with perspective transforms.
 *
 * Visual Layout:
 * ┌─────┐  ┌───────────────┐  ┌─────┐
 * │ Prev│  │  Current (3D) │  │ Next│
 * │30%  │  │   100% size   │  │ 30% │
 * │fade │  │   z-index 10  │  │ fade│
 * └─────┘  └───────────────┘  └─────┘
 *
 * Perfect for:
 * - Physical flipbook feel
 * - 3D gallery browsing
 * - Preview-focused navigation
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import type { TransitionHandler, TransitionParams } from '../types';

export const FlipbookTransition: TransitionHandler = {
  getStyle: ({ isActive, direction, transitionDuration }: TransitionParams) => {
    console.debug('[FlipbookTransition] Rendering', { isActive, direction, transitionDuration });

    if (isActive) {
      // Current/active image: centered, full size, no transform
      return {
        opacity: 1,
        transform: 'translateX(0) scale(1) rotateY(0deg)',
        transformOrigin: 'center center',
        transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
        pointerEvents: 'auto',
        zIndex: 10,
      };
    }

    // Inactive images: determine if they're "before" or "after" the active image
    // For simplicity in this single-image context, we'll use direction as a hint
    // In a multi-image context, the renderer would need to pass additional context

    // When moving forward, old image becomes "previous" (moves left)
    // When moving backward, old image becomes "next" (moves right)
    const isPrevious = direction === 'forward';

    if (isPrevious) {
      // Previous image: positioned on left side with 3D tilt
      return {
        opacity: 0.5,
        transform: 'translateX(-80%) scale(0.3) rotateY(20deg)',
        transformOrigin: 'right center',
        transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
        pointerEvents: 'none',
        zIndex: 5,
      };
    } else {
      // Next image: positioned on right side with 3D tilt
      return {
        opacity: 0.5,
        transform: 'translateX(80%) scale(0.3) rotateY(-20deg)',
        transformOrigin: 'left center',
        transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
        pointerEvents: 'none',
        zIndex: 5,
      };
    }
  },

  metadata: {
    name: 'Flipbook',
    description: '3D flipbook effect with preview of adjacent images on sides',
    author: 'Kai v3 (Carousel & Animation Specialist)'
  }
};
