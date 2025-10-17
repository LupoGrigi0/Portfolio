/**
 * Auto-Hide Reactions Hook
 *
 * Independent auto-hide behavior for social reactions UI.
 * Works separately from main controls auto-hide with different timing.
 *
 * Progressive fade/hide for reactions:
 * 1. Full opacity (active)
 * 2. After reactionFadeStartDelay → 50% opacity
 * 3. After reactionFadeCompleteDelay → 0% opacity + hidden
 * 4. Any interaction → instant restore
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type ReactionVisibility = 'visible' | 'semi-faded' | 'hidden';

interface UseAutoHideReactionsOptions {
  enabled: boolean;
  fadeStartDelay: number; // ms before fading to 50%
  fadeCompleteDelay: number; // ms before fading to 0% and hiding
}

export interface AutoHideReactionsState {
  visibility: ReactionVisibility;
  isInteracting: boolean;
}

export function useAutoHideReactions({
  enabled,
  fadeStartDelay,
  fadeCompleteDelay
}: UseAutoHideReactionsOptions): [AutoHideReactionsState, () => void] {

  const [visibility, setVisibility] = useState<ReactionVisibility>(
    enabled ? 'visible' : 'visible' // Always start visible
  );
  const [isInteracting, setIsInteracting] = useState(false);

  const fadeStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeCompleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (fadeStartTimerRef.current) clearTimeout(fadeStartTimerRef.current);
      if (fadeCompleteTimerRef.current) clearTimeout(fadeCompleteTimerRef.current);
    };
  }, []);

  /**
   * Reset timers and start progressive fade sequence
   */
  const startFadeSequence = useCallback(() => {
    if (!enabled) return;

    // Clear existing timers
    if (fadeStartTimerRef.current) clearTimeout(fadeStartTimerRef.current);
    if (fadeCompleteTimerRef.current) clearTimeout(fadeCompleteTimerRef.current);

    // Set to visible immediately
    setVisibility('visible');

    // Schedule fade to 50% opacity
    fadeStartTimerRef.current = setTimeout(() => {
      setVisibility('semi-faded');

      // Schedule fade to 0% and hide
      fadeCompleteTimerRef.current = setTimeout(() => {
        setVisibility('hidden');
      }, fadeCompleteDelay - fadeStartDelay);

    }, fadeStartDelay);
  }, [enabled, fadeStartDelay, fadeCompleteDelay]);

  /**
   * Signal user interaction - instantly restore reactions
   */
  const triggerActivity = useCallback(() => {
    // EMERGENCY DISABLED: Console spam (every mouse move)
    // console.log('[useAutoHideReactions] Activity detected, restoring reactions');

    setIsInteracting(true);
    startFadeSequence();

    // Reset interacting flag after a brief moment
    setTimeout(() => setIsInteracting(false), 100);
  }, [startFadeSequence]);

  // Start initial fade sequence on mount
  useEffect(() => {
    if (enabled) {
      startFadeSequence();
    }
  }, [enabled, startFadeSequence]);

  /**
   * Global event listeners REMOVED
   *
   * Previously, each carousel with reactions added 4 window event listeners.
   * Combined with useAutoHideControls, this created 40-80+ global handlers.
   *
   * Activity detection now handled by local hover events on carousel container.
   * The triggerActivity() function is exposed for external control.
   *
   * @author Glide (Carousel Performance Specialist)
   * @created 2025-10-16
   * @removed Lines 99-119 (global window event listeners)
   */

  return [
    { visibility, isInteracting },
    triggerActivity
  ];
}
