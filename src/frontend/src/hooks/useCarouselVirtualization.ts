/**
 * Carousel Virtualization Hook
 *
 * Provides progressive loading and bidirectional unloading for large carousel lists.
 * Prevents backend flooding by keeping max N carousels in DOM at once.
 *
 * DRY principle: Shared between DynamicLayout and CuratedLayout
 *
 * @author Scout (Investigation & Diagnostics Specialist)
 * @created 2025-10-17
 */

import { useState, useEffect, useRef } from 'react';

export interface CarouselVirtualizationOptions {
  /** Number of carousels to load initially (default: 4) */
  initialLoad?: number;

  /** Number of carousels to load per scroll increment (default: 4) */
  loadIncrement?: number;

  /** Maximum carousels to keep in DOM at once (default: 10) */
  maxActive?: number;

  /** Distance before sentinel to start loading more (default: 500px) */
  loadThreshold?: number;

  /** Buffer distance for keeping carousels near viewport (default: 2000px) */
  keepBuffer?: number;

  /** Scroll throttle delay in ms (default: 200) */
  scrollThrottle?: number;
}

export interface CarouselVirtualizationResult {
  /** Range of carousels currently visible (slice indices) */
  visibleRange: { start: number; end: number };

  /** Ref for sentinel element (triggers progressive load) */
  sentinelRef: React.RefObject<HTMLDivElement>;

  /** Ref for container element (for scroll calculations) */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for virtualizing carousel rendering
 *
 * Phase 1: Progressive loading
 * - Load N carousels initially
 * - When scrolling near bottom, load N more
 * - Continue until all carousels loaded
 *
 * Phase 2: Bidirectional unloading
 * - When > maxActive carousels in DOM
 * - Keep only carousels near viewport (with buffer)
 * - Center window around visible area
 *
 * @example
 * ```tsx
 * const { visibleRange, sentinelRef, containerRef } = useCarouselVirtualization(
 *   carouselGroups.length,
 *   { initialLoad: 4, maxActive: 10 }
 * );
 *
 * const activeCarousels = carouselGroups.slice(visibleRange.start, visibleRange.end);
 *
 * return (
 *   <div ref={containerRef}>
 *     {activeCarousels.map((group, i) => {
 *       const index = visibleRange.start + i;
 *       return <Carousel key={index} data-carousel-index={index} ... />
 *     })}
 *     {visibleRange.end < total && <div ref={sentinelRef} style={{ height: '1px' }} />}
 *   </div>
 * );
 * ```
 */
export function useCarouselVirtualization(
  totalCarousels: number,
  options: CarouselVirtualizationOptions = {}
): CarouselVirtualizationResult {
  const {
    initialLoad = 4,
    loadIncrement = 4,
    maxActive = 10,
    loadThreshold = 500,
    keepBuffer = 2000,
    scrollThrottle = 200,
  } = options;

  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: Math.min(initialLoad, totalCarousels),
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase 1: Progressive loading via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleRange.end < totalCarousels) {
          // Load more carousels
          setVisibleRange((prev) => ({
            ...prev,
            end: Math.min(prev.end + loadIncrement, totalCarousels),
          }));
        }
      },
      { rootMargin: `${loadThreshold}px` }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [visibleRange.end, totalCarousels, loadIncrement, loadThreshold]);

  // Phase 2: Bidirectional virtualization - unload carousels far offscreen
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;

      // Get all carousel elements
      const carouselElements = containerRef.current?.querySelectorAll('[data-carousel-index]');
      if (!carouselElements) return;

      let firstVisible = 0;
      let lastVisible = visibleRange.end;

      carouselElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + viewportTop;
        const elementBottom = elementTop + rect.height;

        // Check if carousel is in or near viewport (with buffer)
        const isNearViewport =
          elementBottom > viewportTop - keepBuffer &&
          elementTop < viewportBottom + keepBuffer;

        if (isNearViewport) {
          if (index < firstVisible) firstVisible = index;
          if (index > lastVisible) lastVisible = index;
        }
      });

      // Keep a window of maxActive carousels around visible area
      const rangeSize = lastVisible - firstVisible + 1;
      if (rangeSize > maxActive) {
        // Center the window on the visible carousels
        const midpoint = Math.floor((firstVisible + lastVisible) / 2);
        const halfWindow = Math.floor(maxActive / 2);

        setVisibleRange({
          start: Math.max(0, midpoint - halfWindow),
          end: Math.min(totalCarousels, midpoint + halfWindow),
        });
      }
    };

    // Throttle scroll events to avoid performance issues
    let scrollTimeout: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, scrollThrottle);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [visibleRange, totalCarousels, maxActive, keepBuffer, scrollThrottle]);

  return {
    visibleRange,
    sentinelRef,
    containerRef,
  };
}
