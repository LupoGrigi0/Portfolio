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
  offset: {
    x: number;               // -100 to +100: Manual horizontal offset in pixels
    y: number;               // -100 to +100: Manual vertical offset in pixels
    autoPosition: boolean;   // Enable position-aware auto-offset
    intensity: number;       // 0-1: Multiplier for auto-offset calculation
  };
  swimming: {
    enabled: boolean;        // Enable swimming motion
    intensity: number;       // 0-1: Overall amplitude multiplier
    speedX: number;          // 0-1: Horizontal sine wave frequency
    speedY: number;          // 0-1: Vertical sine wave frequency
    dampenTime: number;      // Milliseconds to dampen after scroll stops
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
  offset: {
    x: number;
    y: number;
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
  offset: {
    x: 0,
    y: 0,
    autoPosition: false,
    intensity: 0.3,
  },
  swimming: {
    enabled: false,
    intensity: 0.5,          // 50% default intensity (subtle)
    speedX: 0.002,           // Slow horizontal sway
    speedY: 0.003,           // Slightly faster vertical (creates elliptical Lissajous motion)
    dampenTime: 1000,        // 1 second dampening
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
  setOffsetX: (x: number) => void;
  setOffsetY: (y: number) => void;
  setOffsetAutoPosition: (enabled: boolean) => void;
  setOffsetIntensity: (intensity: number) => void;
  setSwimmingEnabled: (enabled: boolean) => void;
  setSwimmingIntensity: (intensity: number) => void;
  setSwimmingSpeedX: (speed: number) => void;
  setSwimmingSpeedY: (speed: number) => void;
  setSwimmingDampenTime: (time: number) => void;
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

  // Swimming motion tracking
  const lastScrollY = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);
  const lastScrollStopTime = useRef<number>(0);
  const swimmingAnimationRef = useRef<number | undefined>(undefined);

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
      offset: {
        ...DEFAULT_SETTINGS.offset,
        ...globalSettings.offset,
        ...customSettings?.offset,
      },
      swimming: {
        ...DEFAULT_SETTINGS.swimming,
        ...globalSettings.swimming,
        ...customSettings?.swimming,
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

    // DON'T update projections state here - it will be cleaned naturally on next scroll
    // Calling setState during unregister causes infinite re-render loops
    // The projection will simply not be rendered next scroll cycle (opacity 0 or not in ref)
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
          offset: {
            ...carousel.settings.offset,
            ...settings.offset,
          },
          swimming: {
            ...carousel.settings.swimming,
            ...settings.swimming,
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
    const viewportWidth = window.innerWidth;
    const viewportCenterY = viewportHeight / 2;
    const viewportCenterX = viewportWidth / 2;
    const carouselCenterY = rect.top + rect.height / 2;
    const carouselCenterX = rect.left + rect.width / 2;

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

    // Calculate position-aware offset (Phase 1: Left/Right Shift)
    let offsetX = carousel.settings.offset.x;
    let offsetY = carousel.settings.offset.y;

    if (carousel.settings.offset.autoPosition) {
      // Position-aware offset: shift opposite to carousel position
      // Carousel on right → projection shifts left (negative offset)
      // Carousel on left → projection shifts right (positive offset)
      // This prevents projections from disappearing off edges
      const horizontalDeviation = carouselCenterX - viewportCenterX;
      const autoOffsetX = -horizontalDeviation * carousel.settings.offset.intensity;

      // Combine manual offset with auto-offset
      offsetX += autoOffsetX;
    }

    // Calculate swimming motion (Phase 2: Liquid Sway)
    if (carousel.settings.swimming.enabled) {
      const now = Date.now();

      // Base amplitude from scroll velocity (faster scroll = more sway)
      const velocityAmplitude = Math.min(Math.abs(scrollVelocity.current) * 0.1, 50);

      // Calculate dampening factor (exponential decay after scroll stops)
      let dampenFactor = 1.0;
      if (scrollVelocity.current === 0 && lastScrollStopTime.current > 0) {
        const timeSinceStopped = now - lastScrollStopTime.current;
        const dampenTime = carousel.settings.swimming.dampenTime;

        // Exponential dampening: e^(-t/dampenTime)
        // At t=dampenTime, factor ≈ 0.37 (63% dampened)
        // At t=2*dampenTime, factor ≈ 0.14 (86% dampened)
        dampenFactor = Math.exp(-timeSinceStopped / dampenTime);

        // Full stop when dampening is nearly complete (maintains zero idle CPU)
        if (dampenFactor < 0.01) {
          dampenFactor = 0;
        }
      }

      // Dual sine waves for Lissajous motion (different frequencies = elliptical path)
      const swayX = Math.sin(now * carousel.settings.swimming.speedX) *
                    velocityAmplitude *
                    carousel.settings.swimming.intensity *
                    dampenFactor;

      const swayY = Math.cos(now * carousel.settings.swimming.speedY) *
                    velocityAmplitude *
                    0.5 * // Vertical sway is half of horizontal (more natural)
                    carousel.settings.swimming.intensity *
                    dampenFactor;

      // Add swimming to offsets
      offsetX += swayX;
      offsetY += swayY;
    }

    return {
      id: carousel.id,
      imageUrl: carousel.imageUrl,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      offset: {
        x: offsetX,
        y: offsetY,
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
    const deltaTime = now - lastScrollTime.current;
    lastScrollTime.current = now;

    // Track scroll velocity for swimming motion
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY.current;
    scrollVelocity.current = scrollDelta / Math.max(deltaTime, 1); // pixels per ms

    // Detect scroll stop
    if (Math.abs(scrollVelocity.current) < 0.01) {
      // Scroll has stopped - start dampening timer
      if (scrollVelocity.current !== 0 || lastScrollStopTime.current === 0) {
        scrollVelocity.current = 0;
        lastScrollStopTime.current = now;
      }
    }

    lastScrollY.current = currentScrollY;

    // Debug logging (if enabled)
    if (typeof window !== 'undefined' && (window as any).__PRISM_DEBUG) {
      console.log('[ProjectionManager] updateProjections:', {
        registeredCarousels: carouselsRef.current.size,
        carouselIds: Array.from(carouselsRef.current.keys()),
        scrollVelocity: scrollVelocity.current.toFixed(2),
      });
    }

    // Guard: Don't update if no carousels registered (prevents updates during mass unmount)
    if (carouselsRef.current.size === 0) {
      // Clear any stale projections (but only if there are any to avoid unnecessary setState)
      setProjections(prev => prev.size > 0 ? new Map() : prev);
      return;
    }

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
  }, [calculateProjection]); // NO size dependency - would cause loop

  // ============================================================================
  // Swimming Dampening Animation Loop
  // ============================================================================

  const updateSwimmingDampening = useCallback(() => {
    // Check if any carousel has swimming enabled
    let hasSwimming = false;
    carouselsRef.current.forEach(carousel => {
      if (carousel.settings.swimming.enabled) {
        hasSwimming = true;
      }
    });

    if (!hasSwimming) {
      // No swimming enabled - stop animation loop
      if (swimmingAnimationRef.current) {
        cancelAnimationFrame(swimmingAnimationRef.current);
        swimmingAnimationRef.current = undefined;
      }
      return;
    }

    // Calculate dampening factor
    const now = Date.now();
    if (scrollVelocity.current === 0 && lastScrollStopTime.current > 0) {
      const timeSinceStopped = now - lastScrollStopTime.current;

      // Find max dampen time from all swimming-enabled carousels
      let maxDampenTime = 1000;
      carouselsRef.current.forEach(carousel => {
        if (carousel.settings.swimming.enabled) {
          maxDampenTime = Math.max(maxDampenTime, carousel.settings.swimming.dampenTime);
        }
      });

      const dampenFactor = Math.exp(-timeSinceStopped / maxDampenTime);

      // Continue animation during dampening
      if (dampenFactor > 0.01) {
        updateProjections();
        swimmingAnimationRef.current = requestAnimationFrame(updateSwimmingDampening);
      } else {
        // Dampening complete - stop animation loop (maintains zero idle CPU)
        updateProjections(); // Final update
        swimmingAnimationRef.current = undefined;
      }
    } else {
      // Still scrolling - no need for dampening loop (scroll handler will update)
      swimmingAnimationRef.current = undefined;
    }
  }, [updateProjections]);

  // ============================================================================
  // Scroll Event Listener
  // ============================================================================

  useEffect(() => {
    const handleScroll = () => {
      // Cancel existing RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Stop dampening loop if user starts scrolling again
      if (swimmingAnimationRef.current) {
        cancelAnimationFrame(swimmingAnimationRef.current);
        swimmingAnimationRef.current = undefined;
      }

      // Update via scroll handler
      rafRef.current = requestAnimationFrame(() => {
        updateProjections();

        // Start dampening loop after scroll handler finishes
        // (delayed check allows scroll velocity to settle)
        setTimeout(() => {
          if (scrollVelocity.current === 0 && !swimmingAnimationRef.current) {
            swimmingAnimationRef.current = requestAnimationFrame(updateSwimmingDampening);
          }
        }, 100);
      });
    };

    const handleResize = () => {
      updateProjections();
    };

    // Passive listeners for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial update (immediate)
    updateProjections();

    // Delayed update to catch carousels that register after initial mount
    // CuratedLayout renders all carousels synchronously, so they should be registered within 100ms
    const delayedUpdateTimer = setTimeout(() => {
      updateProjections();
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(delayedUpdateTimer);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (swimmingAnimationRef.current) {
        cancelAnimationFrame(swimmingAnimationRef.current);
      }
    };
  }, [updateProjections, updateSwimmingDampening]);

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

  const setOffsetX = useCallback((x: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      offset: { ...prev.offset, x },
    }));
  }, []);

  const setOffsetY = useCallback((y: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      offset: { ...prev.offset, y },
    }));
  }, []);

  const setOffsetAutoPosition = useCallback((autoPosition: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      offset: { ...prev.offset, autoPosition },
    }));
  }, []);

  const setOffsetIntensity = useCallback((intensity: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      offset: { ...prev.offset, intensity },
    }));
  }, []);

  const setSwimmingEnabled = useCallback((enabled: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      swimming: { ...prev.swimming, enabled },
    }));
  }, []);

  const setSwimmingIntensity = useCallback((intensity: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      swimming: { ...prev.swimming, intensity },
    }));
  }, []);

  const setSwimmingSpeedX = useCallback((speedX: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      swimming: { ...prev.swimming, speedX },
    }));
  }, []);

  const setSwimmingSpeedY = useCallback((speedY: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      swimming: { ...prev.swimming, speedY },
    }));
  }, []);

  const setSwimmingDampenTime = useCallback((dampenTime: number) => {
    setGlobalSettings(prev => ({
      ...prev,
      swimming: { ...prev.swimming, dampenTime },
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
    setOffsetX,
    setOffsetY,
    setOffsetAutoPosition,
    setOffsetIntensity,
    setSwimmingEnabled,
    setSwimmingIntensity,
    setSwimmingSpeedX,
    setSwimmingSpeedY,
    setSwimmingDampenTime,
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
    setOffsetX,
    setOffsetY,
    setOffsetAutoPosition,
    setOffsetIntensity,
    setSwimmingEnabled,
    setSwimmingIntensity,
    setSwimmingSpeedX,
    setSwimmingSpeedY,
    setSwimmingDampenTime,
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
        transform: `translate(${projection.offset.x}px, ${projection.offset.y}px) scale(${projection.scaleX}, ${projection.scaleY})`,
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
  const isRegisteredRef = useRef(false);

  // Register carousel once on mount
  useEffect(() => {
    if (!enabled || !elementRef.current) {
      if (isRegisteredRef.current) {
        unregisterCarousel(carouselId);
        isRegisteredRef.current = false;
      }
      return;
    }

    // Only register once - imageUrl will be updated via separate effect
    if (!isRegisteredRef.current) {
      registerCarousel(carouselId, elementRef.current, imageUrl, settingsRef.current);
      isRegisteredRef.current = true;
    }

    return () => {
      if (isRegisteredRef.current) {
        unregisterCarousel(carouselId);
        isRegisteredRef.current = false;
      }
    };
  }, [carouselId, enabled, registerCarousel, unregisterCarousel]); // NO imageUrl - prevents re-registration loop

  // Update settings if they change (without re-registering)
  useEffect(() => {
    if (customSettings && JSON.stringify(customSettings) !== JSON.stringify(settingsRef.current)) {
      settingsRef.current = customSettings;
      updateCarouselSettings(carouselId, customSettings);
    }
  }, [customSettings, carouselId, updateCarouselSettings]);

  // Update image when it changes (separate from registration)
  useEffect(() => {
    if (isRegisteredRef.current && enabled && imageUrl) {
      updateCarouselImage(carouselId, imageUrl);
    }
  }, [carouselId, imageUrl, enabled, updateCarouselImage]);

  return elementRef;
}
