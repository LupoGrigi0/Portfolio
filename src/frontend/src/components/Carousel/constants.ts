/**
 * Carousel Constants
 *
 * Shared constants for the carousel system.
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import type { AutoplaySpeedPreset } from './types';

/**
 * Autoplay speed presets in milliseconds
 */
export const AUTOPLAY_SPEEDS: Record<AutoplaySpeedPreset, number> = {
  slow: 8000,      // 8 seconds
  medium: 5000,    // 5 seconds
  fast: 3000,      // 3 seconds
  veryFast: 1500   // 1.5 seconds
};
