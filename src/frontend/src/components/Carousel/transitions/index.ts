/**
 * Carousel Transition Registry
 *
 * Central registry of all available carousel transitions.
 * This is the ONLY file you need to edit when adding a new transition.
 *
 * How to Add a New Transition:
 * ==============================
 * 1. Create your transition file (e.g., MyTransition.ts) in this directory
 * 2. Implement the TransitionHandler interface
 * 3. Import it here
 * 4. Add it to the Transitions object
 * 5. Done! 🎉
 *
 * Example:
 * --------
 * import { MyTransition } from './MyTransition';
 *
 * export const Transitions = {
 *   fade: FadeTransition,
 *   slide: SlideTransition,
 *   zoom: ZoomTransition,
 *   my: MyTransition,  // ← Just add this line!
 * };
 *
 * Then update TransitionType in types.ts to include 'my'.
 *
 * That's it! No changes to CarouselImageRenderer or any other component needed.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

import type { TransitionHandler, TransitionType } from '../types';
import { FadeTransition } from './FadeTransition';
import { SlideTransition } from './SlideTransition';
import { ZoomTransition } from './ZoomTransition';

/**
 * Registry of all available transitions
 * Maps TransitionType to TransitionHandler implementation
 */
export const Transitions: Record<TransitionType, TransitionHandler> = {
  fade: FadeTransition,
  slide: SlideTransition,
  zoom: ZoomTransition,
  flip: FadeTransition, // TODO: Implement FlipTransition (using fade as fallback for now)
};

/**
 * Get a transition handler by type
 * @param type - The transition type
 * @returns The transition handler implementation
 */
export function getTransition(type: TransitionType): TransitionHandler {
  const transition = Transitions[type];

  if (!transition) {
    console.warn(`[TransitionRegistry] Unknown transition type: ${type}, falling back to fade`);
    return FadeTransition;
  }

  console.debug('[TransitionRegistry] Retrieved transition', {
    type,
    name: transition.metadata?.name
  });

  return transition;
}

/**
 * Get all available transition types
 * @returns Array of transition type names
 */
export function getAvailableTransitions(): TransitionType[] {
  return Object.keys(Transitions) as TransitionType[];
}

/**
 * Get metadata for all transitions
 * @returns Array of transition metadata
 */
export function getTransitionMetadata() {
  return Object.entries(Transitions).map(([type, handler]) => ({
    type,
    ...handler.metadata
  }));
}