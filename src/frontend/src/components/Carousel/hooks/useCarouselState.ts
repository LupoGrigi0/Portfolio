/**
 * Carousel State Management Hook
 *
 * Custom React hook for managing carousel state and navigation logic.
 * Handles transitions, autoplay, keyboard navigation, and fullscreen mode.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-10-01 - Added auto-pause and dynamic speed control (Kai v3)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CarouselState, CarouselControls, CarouselImage, AutoplaySpeedPreset, FullscreenMode } from '../types';
import { AUTOPLAY_SPEEDS } from '../constants';

interface UseCarouselStateOptions {
  imageCount: number;
  autoplaySpeed?: number;
  autoPauseDuration?: number;
  transitionDuration?: number;
  fullscreenMode?: FullscreenMode;
  onImageChange?: (index: number, image: CarouselImage) => void;
  images?: CarouselImage[];
}

export function useCarouselState({
  imageCount,
  autoplaySpeed = 0,
  autoPauseDuration = 5000,
  transitionDuration = 600,
  fullscreenMode = 'browser',
  onImageChange,
  images = []
}: UseCarouselStateOptions): [CarouselState, CarouselControls] {

  const [state, setState] = useState<CarouselState>({
    currentIndex: 0,
    isTransitioning: false,
    direction: null,
    isFullscreen: false,
    isPaused: false,
    isAutoPaused: false,
    currentSpeed: 'medium' // Default speed preset
  });

  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (autoPauseTimerRef.current) clearTimeout(autoPauseTimerRef.current);
    };
  }, []);

  /**
   * Trigger auto-pause after manual interaction
   * Temporarily pauses autoplay to prevent "fighting the carousel"
   *
   * @author Kai v3
   */
  const triggerAutoPause = useCallback(() => {
    if (autoPauseDuration === 0 || autoplaySpeed === 0) return;

    console.log('[useCarouselState] Auto-pause triggered', { duration: autoPauseDuration });

    // Clear existing auto-pause timer
    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
    }

    // Set auto-paused state
    setState(prev => ({ ...prev, isAutoPaused: true }));

    // Resume autoplay after duration
    autoPauseTimerRef.current = setTimeout(() => {
      console.log('[useCarouselState] Auto-pause ended, resuming autoplay');
      setState(prev => ({ ...prev, isAutoPaused: false }));
    }, autoPauseDuration);
  }, [autoPauseDuration, autoplaySpeed]);

  // Navigate to specific index
  const goTo = useCallback((index: number, fromAutoplay = false) => {
    if (state.isTransitioning || index === state.currentIndex) return;
    if (index < 0 || index >= imageCount) return;

    const direction = index > state.currentIndex ? 'forward' : 'backward';

    console.log('[useCarouselState] Navigating to index', {
      from: state.currentIndex,
      to: index,
      direction,
      fromAutoplay
    });

    // Trigger auto-pause if this is manual navigation
    if (!fromAutoplay) {
      triggerAutoPause();
    }

    setState(prev => ({
      ...prev,
      isTransitioning: true,
      direction
    }));

    // Clear existing transition timer
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Complete transition
    transitionTimerRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentIndex: index,
        isTransitioning: false,
        direction: null
      }));

      // Notify parent of image change
      if (onImageChange && images[index]) {
        onImageChange(index, images[index]);
      }
    }, transitionDuration);

  }, [state.isTransitioning, state.currentIndex, imageCount, transitionDuration, onImageChange, images, triggerAutoPause]);

  // Navigate to next image
  const next = useCallback(() => {
    const nextIndex = (state.currentIndex + 1) % imageCount;
    goTo(nextIndex);
  }, [state.currentIndex, imageCount, goTo]);

  // Navigate to previous image
  const previous = useCallback(() => {
    const prevIndex = state.currentIndex === 0
      ? imageCount - 1
      : state.currentIndex - 1;
    goTo(prevIndex);
  }, [state.currentIndex, imageCount, goTo]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (fullscreenMode === 'native') {
      // Native fullscreen API
      try {
        if (!document.fullscreenElement) {
          // Request fullscreen
          const elem = document.documentElement;

          // Try different vendor prefixes
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
          } else if ((elem as any).mozRequestFullScreen) {
            await (elem as any).mozRequestFullScreen();
          } else if ((elem as any).msRequestFullscreen) {
            await (elem as any).msRequestFullscreen();
          } else {
            console.warn('[useCarouselState] Fullscreen API not supported');
            // Fallback to browser mode
            setState(prev => ({
              ...prev,
              isFullscreen: !prev.isFullscreen
            }));
            return;
          }

          console.log('[useCarouselState] Native fullscreen requested');
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }

          console.log('[useCarouselState] Native fullscreen exited');
        }
      } catch (error) {
        console.error('[useCarouselState] Fullscreen error:', error);
        // Fallback to browser mode
        setState(prev => ({
          ...prev,
          isFullscreen: !prev.isFullscreen
        }));
      }
    } else {
      // Browser fullscreen (existing behavior)
      setState(prev => {
        const newFullscreen = !prev.isFullscreen;
        console.log('[useCarouselState] Toggle browser fullscreen', { isFullscreen: newFullscreen });
        return {
          ...prev,
          isFullscreen: newFullscreen
        };
      });
    }
  }, [fullscreenMode]);

  // Pause autoplay
  const pause = useCallback(() => {
    console.log('[useCarouselState] Autoplay paused');
    setState(prev => ({ ...prev, isPaused: true, isAutoPaused: false }));
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
      autoPauseTimerRef.current = null;
    }
  }, []);

  // Resume autoplay
  const resume = useCallback(() => {
    console.log('[useCarouselState] Autoplay resumed');
    setState(prev => ({ ...prev, isPaused: false, isAutoPaused: false }));
    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
      autoPauseTimerRef.current = null;
    }
  }, []);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [state.isPaused, pause, resume]);

  // Set specific autoplay speed preset
  const setSpeed = useCallback((speed: AutoplaySpeedPreset) => {
    console.log('[useCarouselState] Speed changed', { from: state.currentSpeed, to: speed, duration: AUTOPLAY_SPEEDS[speed] });
    setState(prev => ({ ...prev, currentSpeed: speed }));
  }, [state.currentSpeed]);

  // Cycle through speed presets
  const cycleSpeed = useCallback(() => {
    const speeds: AutoplaySpeedPreset[] = ['slow', 'medium', 'fast', 'veryFast'];
    const currentIndex = speeds.indexOf(state.currentSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeed(nextSpeed);
  }, [state.currentSpeed, setSpeed]);

  // Autoplay timer (only runs when not paused and not auto-paused)
  // Uses current speed preset for dynamic speed adjustment
  // For 'custom' preset, falls back to autoplaySpeed prop
  useEffect(() => {
    if (autoplaySpeed > 0 && !state.isPaused && !state.isAutoPaused && !state.isTransitioning) {
      const currentSpeedMs = state.currentSpeed === 'custom'
        ? autoplaySpeed
        : AUTOPLAY_SPEEDS[state.currentSpeed];

      autoplayTimerRef.current = setTimeout(() => {
        // Call goTo directly with fromAutoplay flag to avoid triggering auto-pause
        const nextIndex = (state.currentIndex + 1) % imageCount;
        goTo(nextIndex, true);
      }, currentSpeedMs);

      return () => {
        if (autoplayTimerRef.current) {
          clearTimeout(autoplayTimerRef.current);
        }
      };
    }
  }, [autoplaySpeed, state.isPaused, state.isAutoPaused, state.isTransitioning, state.currentIndex, state.currentSpeed, imageCount, goTo]);

  // Listen for native fullscreen changes
  useEffect(() => {
    if (fullscreenMode === 'native') {
      const handleFullscreenChange = () => {
        const isFullscreen = !!document.fullscreenElement;
        console.log('[useCarouselState] Native fullscreen change detected', { isFullscreen });
        setState(prev => ({
          ...prev,
          isFullscreen
        }));
      };

      // Add event listeners for different browsers
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      };
    }
  }, [fullscreenMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          console.log('[useCarouselState] Keyboard: Previous');
          previous();
          break;
        case 'ArrowRight':
          e.preventDefault();
          console.log('[useCarouselState] Keyboard: Next');
          next();
          break;
        case 'Escape':
          // For native fullscreen, ESC key is handled by browser automatically
          // For browser fullscreen, we handle it manually
          if (state.isFullscreen && fullscreenMode === 'browser') {
            e.preventDefault();
            console.log('[useCarouselState] Keyboard: Exit browser fullscreen');
            toggleFullscreen();
          }
          break;
        case ' ':
          e.preventDefault();
          console.log('[useCarouselState] Keyboard: Toggle autoplay');
          toggleAutoplay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, previous, toggleFullscreen, toggleAutoplay, state.isFullscreen, fullscreenMode]);

  const controls: CarouselControls = {
    next,
    previous,
    goTo,
    toggleFullscreen,
    toggleAutoplay,
    pause,
    resume,
    cycleSpeed,
    setSpeed
  };

  return [state, controls];
}