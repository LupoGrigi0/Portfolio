/**
 * Checkerboard Vignette Effect
 *
 * Creates an animated checkerboard pattern for projection edge fading.
 * Checkers can "fly away" creating a dynamic dissolve effect as projections scroll.
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-05
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';

interface CheckerboardVignetteProps {
  width: number;           // Projection width
  height: number;          // Projection height
  tileSize: number;        // Size of each checker square (px)
  vignetteWidth: number;   // Edge fade width (0-100%)
  distanceFromCenter: number; // Carousel distance from viewport center
  scatterSpeed: number;    // Animation speed multiplier (0-1)
  enabled: boolean;        // Enable/disable checkerboard effect
}

interface CheckerTile {
  x: number;
  y: number;
  opacity: number;
  offsetX: number;  // Animated offset
  offsetY: number;  // Animated offset
  delay: number;    // Animation delay for stagger
}

export function CheckerboardVignette({
  width,
  height,
  tileSize,
  vignetteWidth,
  distanceFromCenter,
  scatterSpeed,
  enabled,
}: CheckerboardVignetteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Generate checker tiles with positions and animation properties
  const tiles = useMemo(() => {
    const tilesArray: CheckerTile[] = [];
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Checkerboard pattern: alternate based on row + col
        if ((row + col) % 2 === 0) {
          const x = col * tileSize;
          const y = row * tileSize;

          // Calculate distance from edge (for vignette fade)
          const centerX = width / 2;
          const centerY = height / 2;
          const distX = Math.abs(x + tileSize / 2 - centerX);
          const distY = Math.abs(y + tileSize / 2 - centerY);
          const maxDistX = width / 2;
          const maxDistY = height / 2;

          // Normalized distance from center (0 = center, 1 = edge)
          const normalizedDist = Math.max(distX / maxDistX, distY / maxDistY);

          // Vignette threshold: start fading at this distance
          const vignetteThreshold = 1 - vignetteWidth / 100;

          // Opacity: 1.0 in center, fades to 0 at edges within vignette zone
          let opacity = 1;
          if (normalizedDist > vignetteThreshold) {
            const fadeProgress = (normalizedDist - vignetteThreshold) / (1 - vignetteThreshold);
            opacity = 1 - fadeProgress;
          }

          // Scatter direction: tiles fly outward from center
          const angle = Math.atan2(y + tileSize / 2 - centerY, x + tileSize / 2 - centerX);

          tilesArray.push({
            x,
            y,
            opacity,
            offsetX: 0,
            offsetY: 0,
            delay: normalizedDist * 0.5, // Outer tiles animate later
          });
        }
      }
    }

    return tilesArray;
  }, [width, height, tileSize, vignetteWidth]);

  // Animate checkers flying away based on scroll position
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = Date.now();

    function animate() {
      if (!ctx || !canvas) return;

      const elapsed = (Date.now() - startTime) / 1000; // seconds

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw checkers
      tiles.forEach((tile) => {
        // Calculate scatter offset based on distance from center and time
        const scatterProgress = Math.min((elapsed - tile.delay) * scatterSpeed, 1);
        const scatterAmount = scatterProgress > 0 ? Math.pow(scatterProgress, 2) * 50 : 0;

        // Fly outward from center
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = Math.atan2(tile.y + tileSize / 2 - centerY, tile.x + tileSize / 2 - centerX);
        const offsetX = Math.cos(angle) * scatterAmount;
        const offsetY = Math.sin(angle) * scatterAmount;

        // Fade out as they fly away
        const fadeOut = scatterProgress > 0 ? 1 - scatterProgress : 1;
        const finalOpacity = tile.opacity * fadeOut;

        if (finalOpacity > 0.01) {
          ctx.fillStyle = `rgba(0, 0, 0, ${finalOpacity})`;
          ctx.fillRect(
            tile.x + offsetX,
            tile.y + offsetY,
            tileSize,
            tileSize
          );
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tiles, width, height, tileSize, scatterSpeed, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{
        mixBlendMode: 'multiply', // Darken where checkers are present
      }}
    />
  );
}

/**
 * Generate checkerboard mask as data URL for CSS mask-image
 * (Static version, no animation)
 *
 * NOTE: Current behavior is a "bug feature" - applies checkerboard across
 * entire image with varying opacity (creates mosaic/stained glass effect).
 *
 * FUTURE ENHANCEMENT: Add parameter to toggle between:
 * - Full checkerboard overlay (current "bug" behavior)
 * - Edge-only dissolve (checkerboard only appears in vignette fade zone)
 *
 * Suggested implementation: Add `edgeOnlyMode: boolean` parameter
 * - If true: Only draw checkers where normalizedDist > vignetteThreshold
 * - If false: Draw all checkers with opacity fade (current behavior)
 */
export function generateCheckerboardMask(
  width: number,
  height: number,
  tileSize: number,
  vignetteWidth: number,
  blurAmount: number = 0
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Apply blur to entire canvas if requested
  if (blurAmount > 0) {
    ctx.filter = `blur(${blurAmount}px)`;
  }

  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 0) {
        const x = col * tileSize;
        const y = row * tileSize;

        // Calculate distance from center for vignette
        const centerX = width / 2;
        const centerY = height / 2;
        const distX = Math.abs(x + tileSize / 2 - centerX);
        const distY = Math.abs(y + tileSize / 2 - centerY);
        const maxDistX = width / 2;
        const maxDistY = height / 2;
        const normalizedDist = Math.max(distX / maxDistX, distY / maxDistY);

        const vignetteThreshold = 1 - vignetteWidth / 100;
        let opacity = 1;
        if (normalizedDist > vignetteThreshold) {
          const fadeProgress = (normalizedDist - vignetteThreshold) / (1 - vignetteThreshold);
          opacity = 1 - fadeProgress;
        }

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  return canvas.toDataURL();
}
