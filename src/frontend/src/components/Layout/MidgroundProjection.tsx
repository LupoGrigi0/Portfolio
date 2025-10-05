/**
 * Midground Projection System
 *
 * Each carousel acts as a "projector" that casts its first image onto a shared
 * midground layer. The projection:
 * - Follows the carousel as it moves
 * - Fades based on distance from viewport center
 * - Blends with other projections when multiple carousels are visible
 * - Disappears when carousel is off-screen
 *
 * Visual metaphor: Carousel = projector, Midground = projection screen
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-03
 */

'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';

export interface CarouselProjection {
  id: string;
  imageUrl: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  opacity: number;
  blur: number;
  scale: number; // 1.0 = normal, >1 = zoomed (depth illusion)
  distanceFromCenter: number; // For debugging
}

interface MidgroundProjectionContextType {
  projections: Map<string, CarouselProjection>;
  registerProjection: (projection: CarouselProjection) => void;
  unregisterProjection: (id: string) => void;
  updateProjection: (id: string, updates: Partial<CarouselProjection>) => void;
  // Global settings
  fadeDistance: number; // Viewport distance where fade starts (0-1, fraction of viewport height)
  maxBlur: number;
  projectionScale: number;
  setFadeDistance: (distance: number) => void;
  setMaxBlur: (blur: number) => void;
  setProjectionScale: (scale: number) => void;
}

const MidgroundProjectionContext = createContext<MidgroundProjectionContextType | undefined>(undefined);

export function MidgroundProjectionProvider({ children }: { children: ReactNode }) {
  const [projections, setProjections] = useState<Map<string, CarouselProjection>>(new Map());

  // Global projection settings (configurable)
  const [fadeDistance, setFadeDistance] = useState(0.5); // Start fading at 50% from center
  const [maxBlur, setMaxBlur] = useState(4); // Max blur in pixels
  const [projectionScale, setProjectionScale] = useState(1.2); // Slightly larger than carousel for depth

  const registerProjection = useCallback((projection: CarouselProjection) => {
    setProjections(prev => {
      const next = new Map(prev);
      next.set(projection.id, projection);
      return next;
    });
  }, []);

  const unregisterProjection = useCallback((id: string) => {
    setProjections(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateProjection = useCallback((id: string, updates: Partial<CarouselProjection>) => {
    setProjections(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, ...updates });
      }
      return next;
    });
  }, []);

  return (
    <MidgroundProjectionContext.Provider
      value={{
        projections,
        registerProjection,
        unregisterProjection,
        updateProjection,
        fadeDistance,
        maxBlur,
        projectionScale,
        setFadeDistance,
        setMaxBlur,
        setProjectionScale,
      }}
    >
      <MidgroundLayer />
      {children}
    </MidgroundProjectionContext.Provider>
  );
}

export function useMidgroundProjection() {
  const context = useContext(MidgroundProjectionContext);
  if (!context) {
    throw new Error('useMidgroundProjection must be used within MidgroundProjectionProvider');
  }
  return context;
}

/**
 * MidgroundLayer - The Projection Screen
 *
 * Renders all active projections, composited together.
 * Fixed position, sits between background and content.
 */
function MidgroundLayer() {
  const { projections } = useMidgroundProjection();
  const projectionsArray = Array.from(projections.values());

  // Sort by distance from center (furthest first, so closest renders on top)
  const sortedProjections = [...projectionsArray].sort(
    (a, b) => b.distanceFromCenter - a.distanceFromCenter
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0, // Behind content, above background
      }}
      role="presentation"
      aria-hidden="true"
    >
      {sortedProjections.map((projection) => (
        <div
          key={projection.id}
          className="absolute transition-all duration-300 ease-out"
          style={{
            top: projection.position.top,
            left: projection.position.left,
            width: projection.position.width,
            height: projection.position.height,
            opacity: projection.opacity,
            filter: `blur(${projection.blur}px)`,
            transform: `scale(${projection.scale})`,
            transformOrigin: 'center center',
            willChange: 'opacity, filter, transform',
          }}
        >
          {/* Use plain img tag to avoid Next.js Image infinite retry on CORS errors */}
          <img
            src={projection.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}

      {/* Debug overlay (optional - can be toggled) */}
      {process.env.NODE_ENV === 'development' && projectionsArray.length > 0 && (
        <div className="fixed top-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-sm">
          <div className="font-bold mb-2">Active Projections: {projectionsArray.length}</div>
          {projectionsArray.map(p => (
            <div key={p.id} className="mb-1 opacity-70">
              {p.id}: opacity={p.opacity.toFixed(2)}, dist={p.distanceFromCenter.toFixed(0)}px
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hook: useCarouselProjection
 *
 * Tracks carousel position and automatically reports projection to midground.
 * Call this from inside a Carousel component.
 *
 * @param carouselId - Unique ID for this carousel
 * @param imageUrl - First image to project
 * @param enabled - Enable/disable projection
 */
export function useCarouselProjection(
  carouselId: string,
  imageUrl: string | null,
  enabled: boolean = true
) {
  const {
    registerProjection,
    unregisterProjection,
    updateProjection,
    fadeDistance,
    maxBlur,
    projectionScale,
  } = useMidgroundProjection();

  const elementRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  // Calculate projection based on carousel position
  const calculateProjection = useCallback((): CarouselProjection | null => {
    if (!elementRef.current || !imageUrl) return null;

    const rect = elementRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenterY = viewportHeight / 2;
    const carouselCenterY = rect.top + rect.height / 2;

    // Distance from viewport center (positive = below, negative = above)
    const distanceFromCenter = Math.abs(carouselCenterY - viewportCenterY);

    // Normalized distance (0 = at center, 1 = at edge of fade zone)
    const fadeZoneHeight = viewportHeight * fadeDistance;
    const normalizedDistance = Math.min(distanceFromCenter / fadeZoneHeight, 1);

    // Opacity: 1.0 at center, fades to 0 at edge of fade zone
    const opacity = Math.max(0, 1 - normalizedDistance);

    // Blur: 0 at center, increases to maxBlur at edge
    const blur = normalizedDistance * maxBlur;

    // Check if carousel is in viewport
    const isInViewport = rect.bottom > 0 && rect.top < viewportHeight;

    return {
      id: carouselId,
      imageUrl,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      opacity: isInViewport ? opacity : 0,
      blur,
      scale: projectionScale,
      distanceFromCenter,
    };
  }, [carouselId, imageUrl, fadeDistance, maxBlur, projectionScale]);

  // Update projection on scroll/resize
  useEffect(() => {
    if (!enabled || !imageUrl) {
      unregisterProjection(carouselId);
      return;
    }

    const updateProjectionState = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const projection = calculateProjection();
        if (projection) {
          updateProjection(carouselId, projection);
        }
      });
    };

    // Initial registration
    const initialProjection = calculateProjection();
    if (initialProjection) {
      registerProjection(initialProjection);
    }

    // Listen to scroll and resize
    window.addEventListener('scroll', updateProjectionState, { passive: true });
    window.addEventListener('resize', updateProjectionState, { passive: true });

    // Slower update interval to reduce re-renders and image re-requests
    // 300ms = ~3fps tracking (smooth enough, much less load)
    const interval = setInterval(updateProjectionState, 300);

    return () => {
      window.removeEventListener('scroll', updateProjectionState);
      window.removeEventListener('resize', updateProjectionState);
      clearInterval(interval);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      unregisterProjection(carouselId);
    };
  }, [enabled, imageUrl, carouselId, calculateProjection, registerProjection, unregisterProjection, updateProjection]);

  return elementRef;
}
