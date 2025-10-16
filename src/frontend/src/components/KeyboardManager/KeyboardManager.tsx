/**
 * Centralized Keyboard Manager
 *
 * Solves the OO scaling problem where every carousel adds its own keyboard listener.
 * With 20 carousels, you'd have 20 handlers firing for every arrow key press.
 *
 * This manager:
 * - Single window keyboard listener (1 handler, not 20)
 * - Tracks focused/centered carousel
 * - Delegates keyboard events to the active carousel
 * - Handles fullscreen mode separately
 *
 * Integration:
 * 1. Add <KeyboardManager /> to root layout (once)
 * 2. Carousels register themselves: useKeyboardRegistration(carouselId, callbacks)
 * 3. Manager delegates to focused/centered carousel
 *
 * @author Kat (Performance Specialist)
 * @created 2025-10-16
 */

'use client';

import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('KeyboardManager');

// Keyboard handlers for a carousel
export interface CarouselKeyboardHandlers {
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoplay?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// Context type
interface KeyboardManagerContextType {
  registerCarousel: (id: string, handlers: CarouselKeyboardHandlers, element: HTMLElement | null) => void;
  unregisterCarousel: (id: string) => void;
  setFocusedCarousel: (id: string | null) => void;
  focusedCarouselId: string | null;
}

const KeyboardManagerContext = createContext<KeyboardManagerContextType | undefined>(undefined);

/**
 * Keyboard Manager Provider
 * Add to root layout once
 */
export function KeyboardManager({ children }: { children: ReactNode }) {
  // Registry of all carousels and their handlers
  const carouselsRef = useRef<Map<string, {
    handlers: CarouselKeyboardHandlers;
    element: HTMLElement | null;
  }>>(new Map());

  // Currently focused carousel (clicked/interacted)
  const focusedCarouselRef = useRef<string | null>(null);

  // Register a carousel
  const registerCarousel = useCallback((
    id: string,
    handlers: CarouselKeyboardHandlers,
    element: HTMLElement | null
  ) => {
    logger.debug('Registering carousel', { id });
    carouselsRef.current.set(id, { handlers, element });
  }, []);

  // Unregister a carousel
  const unregisterCarousel = useCallback((id: string) => {
    logger.debug('Unregistering carousel', { id });
    carouselsRef.current.delete(id);

    // Clear focus if this was the focused carousel
    if (focusedCarouselRef.current === id) {
      focusedCarouselRef.current = null;
    }
  }, []);

  // Set focused carousel (called when user clicks/interacts)
  const setFocusedCarousel = useCallback((id: string | null) => {
    logger.debug('Focus changed', { from: focusedCarouselRef.current, to: id });
    focusedCarouselRef.current = id;
  }, []);

  // Find carousel closest to viewport center (fallback when no focus)
  const findCenteredCarousel = useCallback((): string | null => {
    const viewportCenterY = window.innerHeight / 2;
    let closestId: string | null = null;
    let closestDistance = Infinity;

    carouselsRef.current.forEach(({ element }, id) => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const elementCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenterY - viewportCenterY);

      // Must be at least partially in viewport
      const isInViewport = rect.bottom > 0 && rect.top < window.innerHeight;

      if (isInViewport && distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    });

    return closestId;
  }, []);

  // Get active carousel (focused or centered)
  const getActiveCarousel = useCallback((): {
    id: string;
    handlers: CarouselKeyboardHandlers;
  } | null => {
    // Priority 1: Focused carousel (user clicked/interacted)
    if (focusedCarouselRef.current) {
      const carousel = carouselsRef.current.get(focusedCarouselRef.current);
      if (carousel) {
        return { id: focusedCarouselRef.current, handlers: carousel.handlers };
      }
    }

    // Priority 2: Fullscreen carousel (any)
    for (const [id, { handlers }] of carouselsRef.current.entries()) {
      if (handlers.isFullscreen) {
        return { id, handlers };
      }
    }

    // Priority 3: Carousel closest to viewport center
    const centeredId = findCenteredCarousel();
    if (centeredId) {
      const carousel = carouselsRef.current.get(centeredId);
      if (carousel) {
        return { id: centeredId, handlers: carousel.handlers };
      }
    }

    return null;
  }, [findCenteredCarousel]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeCarousel = getActiveCarousel();
      if (!activeCarousel) return;

      const { id, handlers } = activeCarousel;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          logger.debug('Arrow Left → Previous', { carouselId: id });
          handlers.onPrevious();
          break;

        case 'ArrowRight':
          e.preventDefault();
          logger.debug('Arrow Right → Next', { carouselId: id });
          handlers.onNext();
          break;

        case ' ':
          // Only if carousel has autoplay
          if (handlers.onToggleAutoplay) {
            e.preventDefault();
            logger.debug('Space → Toggle Autoplay', { carouselId: id });
            handlers.onToggleAutoplay();
          }
          break;

        case 'Escape':
          // Only if carousel is fullscreen
          if (handlers.isFullscreen && handlers.onToggleFullscreen) {
            e.preventDefault();
            logger.debug('Escape → Exit Fullscreen', { carouselId: id });
            handlers.onToggleFullscreen();
          }
          break;
      }
    };

    logger.info('Keyboard manager initialized');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      logger.info('Keyboard manager destroyed');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [getActiveCarousel]);

  const contextValue: KeyboardManagerContextType = {
    registerCarousel,
    unregisterCarousel,
    setFocusedCarousel,
    focusedCarouselId: focusedCarouselRef.current
  };

  return (
    <KeyboardManagerContext.Provider value={contextValue}>
      {children}
    </KeyboardManagerContext.Provider>
  );
}

/**
 * Hook for carousels to register with keyboard manager
 *
 * Usage in Carousel component:
 * ```tsx
 * const carouselRef = useKeyboardRegistration(
 *   carouselId,
 *   {
 *     onPrevious: controls.previous,
 *     onNext: controls.next,
 *     onToggleAutoplay: controls.toggleAutoplay,
 *     onToggleFullscreen: controls.toggleFullscreen,
 *     isFullscreen: state.isFullscreen
 *   }
 * );
 *
 * // Use carouselRef on carousel container
 * <div ref={carouselRef} onClick={() => setFocus(carouselId)}>...</div>
 * ```
 */
export function useKeyboardRegistration(
  carouselId: string,
  handlers: CarouselKeyboardHandlers
) {
  const context = useContext(KeyboardManagerContext);
  if (!context) {
    throw new Error('useKeyboardRegistration must be used within KeyboardManager');
  }

  const { registerCarousel, unregisterCarousel, setFocusedCarousel } = context;
  const elementRef = useRef<HTMLElement>(null);

  // Register on mount, unregister on unmount
  useEffect(() => {
    registerCarousel(carouselId, handlers, elementRef.current);

    return () => {
      unregisterCarousel(carouselId);
    };
  }, [carouselId, handlers, registerCarousel, unregisterCarousel]);

  // Helper to set this carousel as focused (call on click/interaction)
  const setFocus = useCallback(() => {
    setFocusedCarousel(carouselId);
  }, [carouselId, setFocusedCarousel]);

  // Attach click handler to element to auto-focus on interaction
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('click', setFocus);
    element.addEventListener('mouseenter', setFocus); // Optional: focus on hover

    return () => {
      element.removeEventListener('click', setFocus);
      element.removeEventListener('mouseenter', setFocus);
    };
  }, [setFocus]);

  return elementRef;
}

/**
 * Export context for advanced usage
 */
export function useKeyboardManager() {
  const context = useContext(KeyboardManagerContext);
  if (!context) {
    throw new Error('useKeyboardManager must be used within KeyboardManager');
  }
  return context;
}
