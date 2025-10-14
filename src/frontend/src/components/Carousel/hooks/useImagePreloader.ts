/**
 * Image Preloader Hook
 *
 * Smart image preloading strategy:
 * - Initial load: Only current image (instant ready)
 * - First interaction: Preload current ±1 images
 * - Navigation: Preload new adjacents, unload far images (>3 positions away)
 * - Memory conscious for 100+ carousels on page
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { CarouselImage } from '../types';

interface UseImagePreloaderOptions {
  images: CarouselImage[];
  currentIndex: number;
  enabled?: boolean; // Default: true
}

interface PreloadedImage {
  src: string;
  image: HTMLImageElement;
}

export function useImagePreloader({
  images,
  currentIndex,
  enabled = true
}: UseImagePreloaderOptions) {

  const [hasInteracted, setHasInteracted] = useState(false);
  const preloadedImagesRef = useRef<Map<string, PreloadedImage>>(new Map());
  const isPreloadingRef = useRef<Set<string>>(new Set());

  /**
   * Preload a single image
   */
  const preloadImage = useCallback((src: string): Promise<void> => {
    // Already preloaded or currently preloading
    if (preloadedImagesRef.current.has(src) || isPreloadingRef.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      isPreloadingRef.current.add(src);

      const img = new Image();

      img.onload = () => {
        preloadedImagesRef.current.set(src, { src, image: img });
        isPreloadingRef.current.delete(src);
        console.log('[useImagePreloader] Preloaded:', src);
        resolve();
      };

      img.onerror = (error) => {
        isPreloadingRef.current.delete(src);
        console.warn('[useImagePreloader] Failed to preload:', src, error);
        reject(error);
      };

      img.src = src;
    });
  }, []);

  /**
   * Unload images far from current position (>3 positions away)
   */
  const unloadDistantImages = useCallback(() => {
    const currentSrc = images[currentIndex]?.src;
    const adjacentSrcs = new Set<string>();

    // Keep current ±3 images
    for (let offset = -3; offset <= 3; offset++) {
      const index = (currentIndex + offset + images.length) % images.length;
      const img = images[index];
      if (img) {
        adjacentSrcs.add(img.src);
      }
    }

    // Unload images not in the adjacent set
    const toUnload: string[] = [];
    preloadedImagesRef.current.forEach((preloaded, src) => {
      if (src !== currentSrc && !adjacentSrcs.has(src)) {
        toUnload.push(src);
      }
    });

    toUnload.forEach(src => {
      preloadedImagesRef.current.delete(src);
      console.log('[useImagePreloader] Unloaded distant image:', src);
    });

    if (toUnload.length > 0) {
      console.log(`[useImagePreloader] Memory cleanup: unloaded ${toUnload.length} distant images`);
    }
  }, [images, currentIndex]);

  /**
   * Preload adjacent images (current ±1)
   */
  const preloadAdjacentImages = useCallback(() => {
    if (!enabled || images.length === 0) return;

    const toPreload: string[] = [];

    // Preload current ±1
    for (let offset = -1; offset <= 1; offset++) {
      const index = (currentIndex + offset + images.length) % images.length;
      const img = images[index];
      if (img && !preloadedImagesRef.current.has(img.src)) {
        toPreload.push(img.src);
      }
    }

    if (toPreload.length > 0) {
      console.log(`[useImagePreloader] Preloading ${toPreload.length} adjacent images at index ${currentIndex}`);
      toPreload.forEach(src => {
        preloadImage(src).catch(() => {
          // Silent fail - image will load on demand
        });
      });
    }

    // Clean up distant images
    unloadDistantImages();
  }, [enabled, images, currentIndex, preloadImage, unloadDistantImages]);

  /**
   * Handle first user interaction
   */
  const handleFirstInteraction = useCallback(() => {
    if (hasInteracted || !enabled) return;

    console.log('[useImagePreloader] First interaction detected, starting preload');
    setHasInteracted(true);
    preloadAdjacentImages();
  }, [hasInteracted, enabled, preloadAdjacentImages]);

  /**
   * Listen for first interaction events
   */
  useEffect(() => {
    if (hasInteracted || !enabled) return;

    const handleActivity = () => {
      handleFirstInteraction();
    };

    // Listen for user interactions
    window.addEventListener('mouseover', handleActivity, { once: true });
    window.addEventListener('touchstart', handleActivity, { once: true });
    window.addEventListener('keydown', handleActivity, { once: true });

    return () => {
      window.removeEventListener('mouseover', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [hasInteracted, enabled, handleFirstInteraction]);

  /**
   * Preload adjacent images on navigation (after first interaction)
   */
  useEffect(() => {
    if (hasInteracted && enabled) {
      preloadAdjacentImages();
    }
  }, [currentIndex, hasInteracted, enabled, preloadAdjacentImages]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all preloaded images on unmount
      preloadedImagesRef.current.clear();
      isPreloadingRef.current.clear();
    };
  }, []);

  return {
    hasInteracted,
    preloadedCount: preloadedImagesRef.current.size,
    triggerPreload: handleFirstInteraction
  };
}
