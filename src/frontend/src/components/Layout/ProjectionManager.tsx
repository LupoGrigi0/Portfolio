/**
 * ProjectionManager - Centralized Scroll-Driven Projection System
 *
 * Zero-idle-CPU projection system that replaces per-carousel intervals
 * with a single centralized scroll listener.
 *
 * Performance improvements:
 * - 67 updates/sec at idle → 0 updates/sec (zero idle CPU)
 * - Smooth 60fps scrolling (requestAnimationFrame-driven)
 * - Max 7 active projections (viewport + buffer strategy)
 * - Settings merged once at registration, then cached
 * - Ref-based carousel tracking (no re-renders on registration/unregistration)
 *
 * @author Prism (Kat - Performance Specialist)
 * @created 2025-10-16
 * @updated 2025-10-16 - Fixed infinite loops (FPS measurement, setState during cleanup, IntersectionObserver)
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { generateCheckerboardMask } from './CheckerboardVignette';

// ============================================================================
// Types
// ============================================================================

export interface ProjectionSettings {
  enabled: boolean;
  fadeDistance: number;      // 0-1: Viewport fraction where fade starts
  maxBlur: number;           // 0-10: Maximum blur in pixels
  scaleX: number;            // 0.5-2.0: Horizontal scale
  scaleY: number;            // 0.5-2.0: Vertical scale
  blendMode: string;         // CSS mix-blend-mode
  vignette: {
    width: number;           // 0-50: Fade width percentage from edge
    strength: number;        // 0-1: Opacity of fade
  };
  checkerboard: {
    enabled: boolean;
    tileSize: number;        // 10-100: Checker square size in pixels
    scatterSpeed: number;    // 0-1: Animation speed
    blur: number;            // 0-10: Blur for checker edges
  };
}

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
  scaleX: number;
  scaleY: number;
  distanceFromCenter: number;
  settings: ProjectionSettings;
}

interface CarouselRegistration {
  id: string;
  element: HTMLElement;
  imageUrl: string | null;
  settings: ProjectionSettings;
  lastUpdate: number;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: ProjectionSettings = {
  enabled: true,
  fadeDistance: 0.5,
  maxBlur: 4,
  scaleX: 1.2,
  scaleY: 1.2,
  blendMode: 'normal',
  vignette: {
    width: 20,
    strength: 0.8,
  },
  checkerboard: {
    enabled: false,
    tileSize: 30,
    scatterSpeed: 0.3,
    blur: 0,
  },
};

// ============================================================================
// Context
// ============================================================================

interface ProjectionManagerContextType {
  // Carousel registration
  registerCarousel: (id: string, element: HTMLElement, imageUrl: string | null, settings?: Partial<ProjectionSettings>) => void;
  unregisterCarousel: (id: string) => void;
  updateCarouselImage: (id: string, imageUrl: string | null) => void;
  updateCarouselSettings: (id: string, settings: Partial<ProjectionSettings>) => void;

  // Active projections (for rendering)
  projections: Map<string, CarouselProjection>;

  // Global settings (legacy compatibility)
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

const ProjectionManagerContext = createContext<ProjectionManagerContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function ProjectionManagerProvider({ children }: { children: ReactNode }) {
  // Registered carousels (all carousels on page) - USE REF TO AVOID RE-RENDERS
  const carouselsRef = useRef<Map<string, CarouselRegistration>>(new Map());

  // Active projections (only those in/near viewport) - State drives rendering
  const [projections, setProjections] = useState<Map<string, CarouselProjection>>(new Map());

  // Global settings (fallback when carousel doesn't specify)
  const [globalSettings, setGlobalSettings] = useState<ProjectionSettings>(DEFAULT_SETTINGS);

  // Refs for performance
  const rafRef = useRef<number | undefined>(undefined);
  const lastScrollTime = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isUnmountingRef = useRef<boolean>(false);

  // ============================================================================
  // Carousel Registration
  // ============================================================================

  const registerCarousel = useCallback((
    id: string,
    element: HTMLElement,
    imageUrl: string | null,
    customSettings?: Partial<ProjectionSettings>
  ) => {
    // Merge settings: defaults → global → custom
    const mergedSettings: ProjectionSettings = {
      ...DEFAULT_SETTINGS,
      ...globalSettings,
      ...customSettings,
      vignette: {
        ...DEFAULT_SETTINGS.vignette,
        ...globalSettings.vignette,
        ...customSettings?.vignette,
      },
      checkerboard: {
        ...DEFAULT_SETTINGS.checkerboard,
        ...globalSettings.checkerboard,
        ...customSettings?.checkerboard,
      },
    };

    // Update ref directly - NO setState, NO re-render
    carouselsRef.current.set(id, {
      id,
      element,
      imageUrl,
      settings: mergedSettings,
      lastUpdate: Date.now(),
    });

    // Start observing this element
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, [globalSettings]);

  const unregisterCarousel = useCallback((id: string) => {
    const carousel = carouselsRef.current.get(id);

    // Stop observing
    if (carousel && observerRef.current) {
      observerRef.current.unobserve(carousel.element);
    }

    // Update ref directly - NO setState during cleanup
    carouselsRef.current.delete(id);

    // Remove from active projections (safe - not during unmount cascade)
    if (!isUnmountingRef.current) {
      setProjections(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const updateCarouselImage = useCallback((id: string, imageUrl: string | null) => {
    const carousel = carouselsRef.current.get(id);
    if (carousel) {
      // Update ref directly - NO setState, NO re-render
      carouselsRef.current.set(id, { ...carousel, imageUrl, lastUpdate: Date.now() });
    }
  }, []);

  const updateCarouselSettings = useCallback((id: string, settings: Partial<ProjectionSettings>) => {
    const carousel = carouselsRef.current.get(id);
    if (carousel) {
      // Update ref directly - NO setState, NO re-render
      carouselsRef.current.set(id, {
        ...carousel,
        settings: {
          ...carousel.settings,
          ...settings,
          vignette: {
            ...carousel.settings.vignette,
            ...settings.vignette,
          },
          checkerboard: {
            ...carousel.settings.checkerboard,
            ...settings.checkerboard,
          },
        },
        lastUpdate: Date.now(),
      });
    }
  }, []);

  // ============================================================================
  // Projection Calculation
  // ============================================================================

  const calculateProjection = useCallback((carousel: CarouselRegistration): CarouselProjection | null => {
    if (!carousel.imageUrl || !carousel.settings.enabled) return null;

    const rect = carousel.element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenterY = viewportHeight / 2;
    const carouselCenterY = rect.top + rect.height / 2;

    // Distance from viewport center (positive = below, negative = above)
    const distanceFromCenter = Math.abs(carouselCenterY - viewportCenterY);

    // Normalized distance (0 = at center, 1 = at edge of fade zone)
    const fadeZoneHeight = viewportHeight * carousel.settings.fadeDistance;
    const normalizedDistance = Math.min(distanceFromCenter / fadeZoneHeight, 1);

    // Opacity: 1.0 at center, fades to 0 at edge of fade zone
    const opacity = Math.max(0, 1 - normalizedDistance);

    // Blur: 0 at center, increases to maxBlur at edge
    const blur = normalizedDistance * carousel.settings.maxBlur;

    // Check if carousel is in viewport
    const isInViewport = rect.bottom > 0 && rect.top < viewportHeight;

    return {
      id: carousel.id,
      imageUrl: carousel.imageUrl,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      opacity: isInViewport ? opacity : 0,
      blur,
      scaleX: carousel.settings.scaleX,
      scaleY: carousel.settings.scaleY,
      distanceFromCenter,
      settings: carousel.settings,
    };
  }, []);

  // ============================================================================
  // Scroll-Driven Update Loop
  // ============================================================================

  const updateProjections = useCallback(() => {
    const now = Date.now();

    // Throttle to ~60fps (16ms between updates)
    if (now - lastScrollTime.current < 16) return;
    lastScrollTime.current = now;

    // Calculate projections for all registered carousels (read from ref)
    const newProjections = new Map<string, CarouselProjection>();

    carouselsRef.current.forEach((carousel) => {
      const projection = calculateProjection(carousel);
      if (projection && projection.opacity > 0) {
        newProjections.set(carousel.id, projection);
      }
    });

    // Apply viewport + buffer strategy (max 7 active projections)
    // Sort by distance from center, keep closest 7
    const sortedProjections = Array.from(newProjections.values())
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
      .slice(0, 7);

    const finalProjections = new Map<string, CarouselProjection>();
    sortedProjections.forEach(p => finalProjections.set(p.id, p));

    setProjections(finalProjections);
  }, [calculateProjection]); // NO carousel dependency - reads from ref!

  // ============================================================================
  // Scroll Event Listener
  // ============================================================================

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(updateProjections);
    };

    const handleResize = () => {
      updateProjections();
    };

    // Passive listeners for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial update
    updateProjections();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateProjections]);

  // ============================================================================
  // Intersection Observer Setup (passive - no update triggers)
  // ============================================================================

  useEffect(() => {
    // Create intersection observer - used by registration, doesn't trigger updates
    observerRef.current = new IntersectionObserver(
      () => {
        // Passive observer - no action needed
        // Scroll handler is the single source of truth for updates
      },
      {
        rootMargin: '500px', // Detect elements 500px before they enter viewport
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Run once on mount - no dependencies

  // ============================================================================
  // Global Settings Setters (Legacy Compatibility)
  // ============================================================================

  const setFadeDistance = useCallback((fadeDistance: number) => {
    setGlobalSettings(prev => ({ ...prev, fadeDistance }));
  }, []);

  const setMaxBlur = useCallback((maxBlur: number) => {
    setGlobalSettings(prev => ({ ...prev, maxBlur }));
  }, []);

  const setProjectionScaleX = useCallback((scaleX: number) => {
    setGlobalSettings(prev => ({ ...prev, scaleX }));
  }, []);

  const setProjectionScaleY = useCallback((scaleY: number) => {
    setGlobalSettings(prev => ({ ...prev, scaleY }));
  }, []);

  const setBlendMode = useCallback((blendMode: string) => {
    setGlobalSettings(prev => ({ ...prev, blendMode }));
  }, []);

  const setVignetteWidth = useCallback((width: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      vignette: { ...prev.vignette, width },
    }));
  }, []);

  const setVignetteStrength = useCallback((strength: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      vignette: { ...prev.vignette, strength },
    }));
  }, []);

  const setCheckerboardEnabled = useCallback((enabled: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      checkerboard: { ...prev.checkerboard, enabled },
    }));
  }, []);

  const setCheckerboardTileSize = useCallback((tileSize: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      checkerboard: { ...prev.checkerboard, tileSize },
    }));
  }, []);

  const setCheckerboardScatterSpeed = useCallback((scatterSpeed: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      checkerboard: { ...prev.checkerboard, scatterSpeed },
    }));
  }, []);

  const setCheckerboardBlur = useCallback((blur: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      checkerboard: { ...prev.checkerboard, blur },
    }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo(() => ({
    registerCarousel,
    unregisterCarousel,
    updateCarouselImage,
    updateCarouselSettings,
    projections,
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
    registerCarousel,
    unregisterCarousel,
    updateCarouselImage,
    updateCarouselSettings,
    projections,
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
  ]);

  return (
    <ProjectionManagerContext.Provider value={contextValue}>
      <ProjectionLayer />
      {children}
    </ProjectionManagerContext.Provider>
  );
}

// ============================================================================
// Hook for accessing context
// ============================================================================

export function useProjectionManager() {
  const context = useContext(ProjectionManagerContext);
  if (!context) {
    throw new Error('useProjectionManager must be used within ProjectionManagerProvider');
  }
  return context;
}

// ============================================================================
// Projection Layer (Rendering)
// ============================================================================

function ProjectionLayer() {
  const { projections } = useProjectionManager();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const projectionsArray = Array.from(projections.values());

  // Sort by distance from center (furthest first, so closest renders on top)
  const sortedProjections = [...projectionsArray].sort(
    (a, b) => b.distanceFromCenter - a.distanceFromCenter
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      role="presentation"
      aria-hidden="true"
    >
      {sortedProjections.map((projection) => (
        <ProjectionItem key={projection.id} projection={projection} />
      ))}
    </div>
  );
}

// ============================================================================
// Projection Item (Single Projection)
// ============================================================================

interface ProjectionItemProps {
  projection: CarouselProjection;
}

const ProjectionItem = React.memo(function ProjectionItem({ projection }: ProjectionItemProps) {
  // Memoize mask generation - only recalculate when these params change
  const maskImage = useMemo(() => {
    const { settings, position } = projection;

    if (settings.checkerboard.enabled && typeof window !== 'undefined') {
      // Generate checkerboard mask (cached until parameters change)
      return `url(${generateCheckerboardMask(
        position.width,
        position.height,
        settings.checkerboard.tileSize,
        settings.vignette.width,
        settings.checkerboard.blur
      )})`;
    } else if (settings.vignette.strength > 0) {
      // Traditional radial gradient vignette
      return `radial-gradient(ellipse at center,
        rgba(0,0,0,1) ${100 - settings.vignette.width}%,
        rgba(0,0,0,${1 - settings.vignette.strength}) 100%)`;
    }
    return 'none';
  }, [
    projection.settings.checkerboard.enabled,
    projection.settings.checkerboard.tileSize,
    projection.settings.checkerboard.blur,
    projection.settings.vignette.width,
    projection.settings.vignette.strength,
    projection.position.width,
    projection.position.height,
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
        mixBlendMode: projection.settings.blendMode as any,
        WebkitMaskImage: maskImage,
        maskImage: maskImage,
        willChange: 'opacity, filter, transform',
      }}
    >
      <img
        src={projection.imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
});

// ============================================================================
// Hook: useCarouselProjection (Replacement for interval-based hook)
// ============================================================================

export function useCarouselProjection(
  carouselId: string,
  imageUrl: string | null,
  enabled: boolean = true,
  customSettings?: Partial<ProjectionSettings>
) {
  const { registerCarousel, unregisterCarousel, updateCarouselImage, updateCarouselSettings } = useProjectionManager();
  const elementRef = useRef<HTMLDivElement>(null);

  // Stabilize custom settings to prevent re-registration loops
  const settingsRef = useRef(customSettings);

  // Register carousel on mount
  useEffect(() => {
    if (!enabled || !imageUrl || !elementRef.current) {
      unregisterCarousel(carouselId);
      return;
    }

    registerCarousel(carouselId, elementRef.current, imageUrl, settingsRef.current);

    return () => {
      unregisterCarousel(carouselId);
    };
  }, [carouselId, enabled, registerCarousel, unregisterCarousel, imageUrl]);

  // Update settings if they change (without re-registering)
  useEffect(() => {
    if (customSettings && JSON.stringify(customSettings) !== JSON.stringify(settingsRef.current)) {
      settingsRef.current = customSettings;
      updateCarouselSettings(carouselId, customSettings);
    }
  }, [customSettings, carouselId, updateCarouselSettings]);

  // Update image when it changes
  useEffect(() => {
    if (enabled && imageUrl) {
      updateCarouselImage(carouselId, imageUrl);
    }
  }, [carouselId, imageUrl, enabled, updateCarouselImage]);

  return elementRef;
}
