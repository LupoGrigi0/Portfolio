/**
 * None Transition - Instant Image Switch
 *
 * No animation, instant transition for maximum responsiveness.
 * Perfect for stress testing and users who prefer no motion.
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-02
 */

import type { TransitionHandler, TransitionParams } from '../types';

/**
 * None transition - instant switch with no animation
 */
export const noneTransition: TransitionHandler = {
  getStyle: ({ isActive }: TransitionParams) => ({
    opacity: isActive ? 1 : 0,
    transition: 'none', // No transition - instant!
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  }),

  metadata: {
    name: 'None',
    description: 'Instant switch with no animation',
    author: 'Kai v3'
  }
};
