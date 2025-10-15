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

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { generateCheckerboardMask } from './CheckerboardVignette';

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
  scaleX: number; // 1.0 = normal width, >1 = wider
  scaleY: number; // 1.0 = normal height, >1 = taller
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
  projectionScaleX: number;
  projectionScaleY: number;
  blendMode: string; // CSS mix-blend-mode for overlapping projections
  vignetteWidth: number; // Vignette fade width (0-100, percentage from edge)
  vignetteStrength: number; // Vignette opacity (0-1, how dark the fade is)
  // Checkerboard vignette
  checkerboardEnabled: boolean; // Use checkerboard instead of radial vignette
  checkerboardTileSize: number; // Size of checker squares in pixels
  checkerboardScatterSpeed: number; // Animation speed (0-1)
  checkerboardBlur: number; // Blur amount for checker edges (0-10px)
  setFadeDistance: (distance: number) => void;
  setMaxBlur: (blur: number) => void;
  setProjectionScaleX: (scale: number) => void;
  setProjectionScaleY: (scale: number) => void;
  setBlendMode: (mode: string) => void;
  setVignetteWidth: (width: number) => void;
  setVignetteStrength: (strength: number) => void;
  setCheckerboardEnabled: (enabled: boolean) => void;
  setCheckerboardTileSize: (size: number) => void;
  setCheckerboardScatterSpeed: (speed: number) => void;
  setCheckerboardBlur: (blur: number) => void;
}

const MidgroundProjectionContext = createContext<MidgroundProjectionContextType | undefined>(undefined);

export function MidgroundProjectionProvider({ children }: { children: ReactNode }) {
  const [projections, setProjections] = useState<Map<string, CarouselProjection>>(new Map());

  // Global projection settings (configurable)
  const [fadeDistance, setFadeDistance] = useState(0.5); // Start fading at 50% from center
  const [maxBlur, setMaxBlur] = useState(4); // Max blur in pixels
  const [projectionScaleX, setProjectionScaleX] = useState(1.2); // Horizontal scale
  const [projectionScaleY, setProjectionScaleY] = useState(1.2); // Vertical scale
  const [blendMode, setBlendMode] = useState('normal'); // CSS mix-blend-mode
  const [vignetteWidth, setVignetteWidth] = useState(20); // 20% from edge
  const [vignetteStrength, setVignetteStrength] = useState(0.8); // 80% opacity
  const [checkerboardEnabled, setCheckerboardEnabled] = useState(false); // Checkerboard vignette
  const [checkerboardTileSize, setCheckerboardTileSize] = useState(30); // 30px tiles
  const [checkerboardScatterSpeed, setCheckerboardScatterSpeed] = useState(0.3); // Animation speed
  const [checkerboardBlur, setCheckerboardBlur] = useState(0); // Blur checker edges

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

  // Memoize context value to prevent unnecessary re-renders
  // NOTE: projections is NOT in deps - it's a Map managed by useState
  // Including it would cause infinite loop (projections update -> context recreates -> consumers re-render -> projections update)
  const contextValue = useMemo(() => ({
    projections,
    registerProjection,
    unregisterProjection,
    updateProjection,
    fadeDistance,
    maxBlur,
    projectionScaleX,
    projectionScaleY,
    blendMode,
    vignetteWidth,
    vignetteStrength,
    checkerboardEnabled,
    checkerboardTileSize,
    checkerboardScatterSpeed,
    checkerboardBlur,
    setFadeDistance,
    setMaxBlur,
    setProjectionScaleX,
    setProjectionScaleY,
    setBlendMode,
    setVignetteWidth,
    setVignetteStrength,
    setCheckerboardEnabled,
    setCheckerboardTileSize,
    setCheckerboardScatterSpeed,
    setCheckerboardBlur,
  }), [
    // projections deliberately excluded - causes infinite loop if included
    registerProjection,
    unregisterProjection,
    updateProjection,
    fadeDistance,
    maxBlur,
    projectionScaleX,
    projectionScaleY,
    blendMode,
    vignetteWidth,
    vignetteStrength,
    checkerboardEnabled,
    checkerboardTileSize,
    checkerboardScatterSpeed,
    checkerboardBlur,
  ]);

  return (
    <MidgroundProjectionContext.Provider value={contextValue}
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
 * ProjectionItem - Single Projection with Memoized Mask
 *
 * Memoizes the expensive checkerboard mask generation.
 * Only regenerates when mask parameters change, not on every scroll.
 */
interface ProjectionItemProps {
  projection: CarouselProjection;
  blendMode: string;
  vignetteWidth: number;
  vignetteStrength: number;
  checkerboardEnabled: boolean;
  checkerboardTileSize: number;
  checkerboardBlur: number;
}

const ProjectionItem = React.memo(function ProjectionItem({
  projection,
  blendMode,
  vignetteWidth,
  vignetteStrength,
  checkerboardEnabled,
  checkerboardTileSize,
  checkerboardBlur,
}: ProjectionItemProps) {
  // Memoize mask generation - only recalculate when these params change
  const maskImage = useMemo(() => {
    if (checkerboardEnabled && typeof window !== 'undefined') {
      // Generate checkerboard mask (cached until parameters change)
      return `url(${generateCheckerboardMask(
        projection.position.width,
        projection.position.height,
        checkerboardTileSize,
        vignetteWidth,
        checkerboardBlur
      )})`;
    } else if (vignetteStrength > 0) {
      // Traditional radial gradient vignette
      return `radial-gradient(ellipse at center,
        rgba(0,0,0,1) ${100 - vignetteWidth}%,
        rgba(0,0,0,${1 - vignetteStrength}) 100%)`;
    }
    return 'none';
  }, [
    checkerboardEnabled,
    projection.position.width,
    projection.position.height,
    checkerboardTileSize,
    vignetteWidth,
    checkerboardBlur,
    vignetteStrength,
  ]);

  return (
    <div
      className="absolute transition-all duration-300 ease-out"
      style={{
        top: projection.position.top,
        left: projection.position.left,
        width: projection.position.width,
        height: projection.position.height,
        opacity: projection.opacity,
        filter: `blur(${projection.blur}px)`,
        transform: `scale(${projection.scaleX}, ${projection.scaleY})`,
        transformOrigin: 'center center',
        mixBlendMode: blendMode as any,
        WebkitMaskImage: maskImage,
        maskImage: maskImage,
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
  );
});

/**
 * MidgroundLayer - The Projection Screen
 *
 * Renders all active projections, composited together.
 * Fixed position, sits between background and content.
 */
function MidgroundLayer() {
  const {
    projections,
    blendMode,
    vignetteWidth,
    vignetteStrength,
    checkerboardEnabled,
    checkerboardTileSize,
    checkerboardScatterSpeed,
    checkerboardBlur,
  } = useMidgroundProjection();
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client to avoid SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

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
        <ProjectionItem
          key={projection.id}
          projection={projection}
          blendMode={blendMode}
          vignetteWidth={vignetteWidth}
          vignetteStrength={vignetteStrength}
          checkerboardEnabled={checkerboardEnabled}
          checkerboardTileSize={checkerboardTileSize}
          checkerboardBlur={checkerboardBlur}
        />
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
    projectionScaleX,
    projectionScaleY,
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
      scaleX: projectionScaleX,
      scaleY: projectionScaleY,
      distanceFromCenter,
    };
  }, [carouselId, imageUrl, fadeDistance, maxBlur, projectionScaleX, projectionScaleY]);

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
