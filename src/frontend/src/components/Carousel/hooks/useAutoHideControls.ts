/**
 * Auto-Hide Controls Hook
 *
 * Progressive fade/slide controls:
 * 1. Full opacity (active)
 * 2. After fadeStartDelay → 50% opacity
 * 3. After fadeCompleteDelay → 0% opacity + slide off screen
 * 4. Any interaction → instant restore
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type ControlVisibility = 'visible' | 'semi-faded' | 'hidden';

interface UseAutoHideControlsOptions {
  enabled: boolean;
  fadeStartDelay: number; // ms before fading to 50%
  fadeCompleteDelay: number; // ms before fading to 0% and sliding off
  permanentlyHide: boolean; // Force hide controls
}

export interface AutoHideControlsState {
  visibility: ControlVisibility;
  isInteracting: boolean;
}

export function useAutoHideControls({
  enabled,
  fadeStartDelay,
  fadeCompleteDelay,
  permanentlyHide
}: UseAutoHideControlsOptions): [AutoHideControlsState, () => void] {

  const [visibility, setVisibility] = useState<ControlVisibility>(
    permanentlyHide ? 'hidden' : 'visible'
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
    if (!enabled || permanentlyHide) return;

    // Clear existing timers
    if (fadeStartTimerRef.current) clearTimeout(fadeStartTimerRef.current);
    if (fadeCompleteTimerRef.current) clearTimeout(fadeCompleteTimerRef.current);

    // Set to visible immediately
    setVisibility('visible');

    // Schedule fade to 50% opacity
    fadeStartTimerRef.current = setTimeout(() => {
      setVisibility('semi-faded');

      // Schedule fade to 0% and slide off
      fadeCompleteTimerRef.current = setTimeout(() => {
        setVisibility('hidden');
      }, fadeCompleteDelay - fadeStartDelay);

    }, fadeStartDelay);
  }, [enabled, fadeStartDelay, fadeCompleteDelay, permanentlyHide]);

  /**
   * Signal user interaction - instantly restore controls
   */
  const triggerActivity = useCallback(() => {
    if (permanentlyHide) return;

    // EMERGENCY DISABLED: Logs on EVERY mouse move, touch, keydown, click
    // console.log('[useAutoHideControls] Activity detected, restoring controls');

    setIsInteracting(true);
    startFadeSequence();

    // Reset interacting flag after a brief moment
    setTimeout(() => setIsInteracting(false), 100);
  }, [startFadeSequence, permanentlyHide]);

  // Start initial fade sequence on mount
  useEffect(() => {
    if (enabled && !permanentlyHide) {
      startFadeSequence();
    }
  }, [enabled, permanentlyHide, startFadeSequence]);

  // Handle permanently hide override
  useEffect(() => {
    if (permanentlyHide) {
      setVisibility('hidden');
    }
  }, [permanentlyHide]);

  /**
   * Global event listeners REMOVED
   *
   * Previously, each carousel added 4 window event listeners (mousemove, touchstart, keydown, click).
   * With 10-20 carousels per page, this created 40-80 handlers firing on EVERY interaction.
   *
   * Activity detection is now handled by:
   * 1. Local hover events on the carousel container (see Carousel.tsx)
   * 2. Centralized activity management by parent page (future enhancement)
   *
   * The triggerActivity() function is exposed for external control.
   *
   * @author Glide (Carousel Performance Specialist)
   * @created 2025-10-16
   * @removed Lines 108-128 (global window event listeners)
   */

  return [
    { visibility, isInteracting },
    triggerActivity
  ];
}
