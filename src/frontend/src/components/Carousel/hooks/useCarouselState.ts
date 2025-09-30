/**
 * Carousel State Management Hook
 *
 * Custom React hook for managing carousel state and navigation logic.
 * Handles transitions, autoplay, keyboard navigation, and fullscreen mode.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CarouselState, CarouselControls, CarouselImage } from '../types';

interface UseCarouselStateOptions {
  imageCount: number;
  autoplaySpeed?: number;
  transitionDuration?: number;
  onImageChange?: (index: number, image: CarouselImage) => void;
  images?: CarouselImage[];
}

export function useCarouselState({
  imageCount,
  autoplaySpeed = 0,
  transitionDuration = 600,
  onImageChange,
  images = []
}: UseCarouselStateOptions): [CarouselState, CarouselControls] {

  const [state, setState] = useState<CarouselState>({
    currentIndex: 0,
    isTransitioning: false,
    direction: null,
    isFullscreen: false,
    isPaused: false
  });

  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Navigate to specific index
  const goTo = useCallback((index: number) => {
    if (state.isTransitioning || index === state.currentIndex) return;
    if (index < 0 || index >= imageCount) return;

    const direction = index > state.currentIndex ? 'forward' : 'backward';

    console.log('[useCarouselState] Navigating to index', {
      from: state.currentIndex,
      to: index,
      direction
    });

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

  }, [state.isTransitioning, state.currentIndex, imageCount, transitionDuration, onImageChange, images]);

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
  const toggleFullscreen = useCallback(() => {
    setState(prev => {
      const newFullscreen = !prev.isFullscreen;
      console.log('[useCarouselState] Toggle fullscreen', { isFullscreen: newFullscreen });
      return {
        ...prev,
        isFullscreen: newFullscreen
      };
    });
  }, []);

  // Pause autoplay
  const pause = useCallback(() => {
    console.log('[useCarouselState] Autoplay paused');
    setState(prev => ({ ...prev, isPaused: true }));
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  // Resume autoplay
  const resume = useCallback(() => {
    console.log('[useCarouselState] Autoplay resumed');
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [state.isPaused, pause, resume]);

  // Autoplay timer
  useEffect(() => {
    if (autoplaySpeed > 0 && !state.isPaused && !state.isTransitioning) {
      autoplayTimerRef.current = setTimeout(() => {
        next();
      }, autoplaySpeed);

      return () => {
        if (autoplayTimerRef.current) {
          clearTimeout(autoplayTimerRef.current);
        }
      };
    }
  }, [autoplaySpeed, state.isPaused, state.isTransitioning, state.currentIndex, next]);

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
          if (state.isFullscreen) {
            e.preventDefault();
            console.log('[useCarouselState] Keyboard: Exit fullscreen');
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
  }, [next, previous, toggleFullscreen, toggleAutoplay, state.isFullscreen]);

  const controls: CarouselControls = {
    next,
    previous,
    goTo,
    toggleFullscreen,
    toggleAutoplay,
    pause,
    resume
  };

  return [state, controls];
}