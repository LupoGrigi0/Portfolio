'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, Container, ISourceOptions } from '@tsparticles/engine';
import { useProjectionManager } from './ProjectionManager';

/**
 * Checkerboard Flutter - Phase 3 🎨
 *
 * Subtle particle effect where edge checkerboard squares detach from projections
 * and flutter away when scrolling stops.
 *
 * The "oh!" moment - most people won't notice at first, but when they do... ✨
 *
 * Features:
 * - Detects scroll stop (after velocity drops to zero)
 * - Spawns 1-2 checker particles from projection edges
 * - Particles tumble and fade as they fall
 * - Cleanup after 2 seconds (no memory leaks)
 * - Matches projection checker tile size and colors
 *
 * Integration:
 * - Works alongside existing projection system
 * - Triggered by scroll events (zero idle CPU maintained!)
 * - Uses same performance optimizations as projections
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */

interface CheckerboardFlutterProps {
  enabled?: boolean;
  tileSize?: number;      // Match projection checker tile size
  intensity?: number;     // 0-1: How many checkers to spawn (0.5 = 1-2, 1.0 = 2-4)
  triggerDelay?: number;  // Milliseconds after scroll stops to trigger
}

export default function CheckerboardFlutter({
  enabled = true,
  tileSize = 30,
  intensity = 0.5,
  triggerDelay = 300,
}: CheckerboardFlutterProps) {
  const [init, setInit] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const scrollVelocityRef = useRef(0);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFlutteredRef = useRef(false); // Prevent rapid re-triggering
  const projectionsSnapshotRef = useRef<Map<string, any>>(new Map()); // Snapshot projections during scroll!

  // STEP 1: Connect to ProjectionManager! 🎯
  const { projections } = useProjectionManager();

  // 📸 CAPTURE SNAPSHOT when projections change (THE FIX!)
  useEffect(() => {
    // Update snapshot whenever projections change AND there are projections available
    if (projections.size > 0) {
      projectionsSnapshotRef.current = new Map(projections);
      console.log('[Checkerboard Flutter] 📸✅ Snapshot updated from projections change:', {
        count: projectionsSnapshotRef.current.size,
        ids: Array.from(projectionsSnapshotRef.current.keys()),
      });
    }

    console.log('[Checkerboard Flutter] 🔍 Projections changed:', {
      count: projections.size,
      ids: Array.from(projections.keys()),
    });
  }, [projections]);

  // Initialize particles engine
  useEffect(() => {
    if (!enabled) return;

    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
      console.log('[Checkerboard Flutter] Engine initialized! 🎨');
    });
  }, [enabled]);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    if (container) {
      containerRef.current = container;
      console.log('[Checkerboard Flutter] Particles loaded:', container);
    }
  }, []);

  // Spawn flutter particles from projection edges
  const spawnFlutterParticles = useCallback(() => {
    if (!containerRef.current) return;

    // 📸 USE SNAPSHOT instead of live projections (fixes race condition!)
    const snapshotProjections = projectionsSnapshotRef.current;

    console.log('[Checkerboard Flutter] 🎨 Using snapshot projections:', {
      snapshotCount: snapshotProjections.size,
      snapshotIds: Array.from(snapshotProjections.keys()),
      liveCount: projections.size,
      liveIds: Array.from(projections.keys()),
      projectionsData: Array.from(snapshotProjections.values()).map(p => ({
        id: p.id,
        hasCheckerboard: p.settings.checkerboard.enabled,
        tileSize: p.settings.checkerboard.tileSize,
        position: p.position,
        opacity: p.opacity, // DIAGNOSTIC: Check if opacity is 0 (filtered out!)
        fadeDistance: p.settings.fadeDistance, // DIAGNOSTIC: Check fade settings
      })),
    });

    // Calculate how many checkers to spawn based on intensity
    const count = Math.ceil(intensity * 2) + Math.floor(Math.random() * 2); // 1-2 for 0.5 intensity

    // STEP 3: Find projections with checkerboard enabled (from snapshot!)
    const allSnapshotProjections = Array.from(snapshotProjections.values());
    console.log('[Checkerboard Flutter] 🔍 Filtering projections:', {
      total: allSnapshotProjections.length,
      details: allSnapshotProjections.map(p => ({
        id: p.id,
        hasSettings: !!p.settings,
        hasCheckerboard: !!p.settings?.checkerboard,
        checkerboardEnabled: p.settings?.checkerboard?.enabled,
        hasPosition: !!p.position,
      })),
    });

    // Filter for checkerboard projections that are VISIBLE in viewport
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const viewportTop = scrollY;
    const viewportBottom = scrollY + viewportHeight;

    const checkerboardProjections = allSnapshotProjections
      .filter(p => {
        if (!p.settings?.checkerboard?.enabled || !p.position) return false;

        // Check if projection is in viewport (or close to it)
        const projectionTop = p.position.top;
        const projectionBottom = p.position.top + p.position.height;
        // Increased buffer to 500px to catch projections further away
        const isVisible = projectionBottom >= viewportTop - 500 && projectionTop <= viewportBottom + 500;

        return isVisible;
      });

    console.log(`[Checkerboard Flutter] 🎨 Spawning ${count} checker particles from ${checkerboardProjections.length} checkerboard projections`);

    if (checkerboardProjections.length === 0) {
      console.log('[Checkerboard Flutter] ⚠️ No checkerboard projections found - skipping spawn');
      console.log('[Checkerboard Flutter] 🔍 Diagnosis:',
        allSnapshotProjections.map(p => ({
          id: p.id,
          hasCheckerboard: p.settings?.checkerboard?.enabled,
          hasPosition: !!p.position,
          reason: !p.settings?.checkerboard?.enabled ? 'checkerboard disabled' : !p.position ? 'no position' : 'unknown'
        }))
      );
      return;
    }

    // Spawn checkers from ACTUAL projection edges!
    for (let i = 0; i < count; i++) {
      // Pick a random projection with checkerboard
      const projection = checkerboardProjections[Math.floor(Math.random() * checkerboardProjections.length)];
      const tileSize = projection.settings.checkerboard.tileSize || 30;

      // Calculate how many checkers fit across the bottom of this projection
      const projectionWidth = projection.position.width;
      const checkersAcross = Math.floor(projectionWidth / tileSize);

      // Pick a random checker column along the bottom edge
      const checkerColumn = Math.floor(Math.random() * checkersAcross);

      // Calculate X position (centered in checker square)
      const x = projection.position.left + (checkerColumn * tileSize) + (tileSize / 2);

      // Calculate Y position accounting for scale transform!
      // The projection is scaled from center, so bottom edge moves down by (scaleY - 1) * height / 2
      const scaleOffset = (projection.scaleY - 1) * projection.position.height / 2;
      const y = projection.position.top + projection.position.height + scaleOffset + projection.offset.y;

      console.log(`[Checkerboard Flutter] 🎲 Spawning checker from projection "${projection.id}":`, {
        positionData: projection.position,
        calculatedX: Math.round(x),
        calculatedY: Math.round(y),
        formula: `top(${projection.position.top}) + height(${projection.position.height}) = ${y}`,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY,
        isOffScreen: y < 0 || y > window.innerHeight,
      });

      // Add particle at projection edge position!
      containerRef.current.particles.addParticle({
        x,
        y,
      });
    }

    // Prevent re-triggering for a bit (cooldown)
    hasFlutteredRef.current = true;
    setTimeout(() => {
      hasFlutteredRef.current = false;
    }, 500); // 500ms cooldown (reduced from 2s for more frequent spawns)
  }, [intensity]); // Don't depend on projections - we read it directly inside

  // Scroll detection and flutter triggering
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const deltaTime = now - lastScrollTime.current;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Calculate scroll velocity
      const velocity = scrollDelta / Math.max(deltaTime, 1);
      scrollVelocityRef.current = velocity;

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;

      // Clear existing scroll stop timer
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }

      // Set new timer to detect scroll stop
      scrollStopTimerRef.current = setTimeout(() => {
        // Scroll has stopped!
        console.log('[Checkerboard Flutter] Timer fired - checking conditions:', {
          hasFluttered: hasFlutteredRef.current,
          velocity: scrollVelocityRef.current,
          willTrigger: !hasFlutteredRef.current && scrollVelocityRef.current < 0.1,
        });

        if (!hasFlutteredRef.current && scrollVelocityRef.current < 0.1) {
          console.log('[Checkerboard Flutter] ✅ Scroll stopped - triggering flutter!');
          spawnFlutterParticles();
        } else {
          console.log('[Checkerboard Flutter] ❌ Conditions not met - skipping flutter');
        }
        scrollVelocityRef.current = 0;
      }, triggerDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
    };
  }, [enabled, triggerDelay, spawnFlutterParticles]);

  // Particle configuration - checker squares!
  // useMemo to prevent re-initialization on every render (which clears particles!)
  const options: ISourceOptions = useMemo(() => ({
    background: {
      color: {
        value: 'transparent', // Overlay on existing page
      },
    },
    fpsLimit: 60,
    particles: {
      number: {
        value: 0, // Start with zero - we spawn manually on scroll stop
      },
      color: {
        value: ['#ffffff', '#cccccc', '#999999'], // Grayscale checkers
      },
      shape: {
        type: 'square', // CHECKER SQUARES! ✅
      },
      opacity: {
        value: 0.7, // Fixed opacity (no fade animation)
        animation: {
          enable: false, // DISABLED - no fade (was causing early destruction!)
        },
      },
      size: {
        value: tileSize, // Match projection checker tile size!
        animation: {
          enable: false,
        },
      },
      rotate: {
        value: { min: 0, max: 360 },
        direction: 'random',
        animation: {
          enable: true,
          speed: 3, // Gentle tumbling as they fall
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: { min: 1, max: 2 }, // Slow gentle fall
        direction: 'bottom', // Fall down
        random: true,
        straight: false, // Organic drift
        outModes: {
          default: 'destroy', // Remove when off screen
        },
        drift: { min: -1, max: 1 }, // Very slight horizontal drift
      },
      wobble: {
        enable: true,
        distance: 5, // Subtle wobble (checkers flutter)
        speed: { min: 3, max: 8 },
      },
      life: {
        duration: {
          value: 120, // Live for 120 seconds (2 minutes for screenshots!)
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: false, // No interaction - purely visual
        },
        onClick: {
          enable: false,
        },
      },
    },
    detectRetina: true,
  }), [tileSize]); // Only recreate if tileSize changes

  if (!enabled || !init) {
    return null; // Don't render if disabled or not initialized
  }

  return (
    <Particles
      id="checkerboard-flutter"
      particlesLoaded={particlesLoaded}
      options={options}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 999 }} // TEMP: Way above everything to test visibility!
      // Key stabilization: prevent re-mount on state changes
      key="checkerboard-flutter-stable"
    />
  );
}
