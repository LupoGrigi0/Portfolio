/**
 * Projection System Test Page
 *
 * Verification page for the new centralized scroll-driven projection system.
 * Tests zero idle CPU usage, smooth scrolling, and per-carousel settings.
 *
 * @author Prism (Kat - Performance Specialist)
 * @created 2025-10-16
 */

'use client';

import { useState, useEffect } from 'react';
import Carousel from '@/components/Carousel/Carousel';
import { useProjectionManager } from '@/components/Layout';
import type { CarouselImage } from '@/components/Carousel/types';

export default function ProjectionTestPage() {
  const projection = useProjectionManager();
  const [performanceData, setPerformanceData] = useState({
    fps: 0,
    activeProjections: 0,
    scrolling: false,
  });

  // Test images (gradient patterns for visual debugging)
  const testImages: CarouselImage[] = [
    { id: '1', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(255,0,0);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(0,0,255);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g1)" /%3E%3Ctext x="400" y="300" font-size="48" fill="white" text-anchor="middle"%3ERed to Blue%3C/text%3E%3C/svg%3E', alt: 'Red to Blue' },
    { id: '2', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(0,255,0);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(255,255,0);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g2)" /%3E%3Ctext x="400" y="300" font-size="48" fill="black" text-anchor="middle"%3EGreen to Yellow%3C/text%3E%3C/svg%3E', alt: 'Green to Yellow' },
    { id: '3', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(138,43,226);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(255,20,147);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g3)" /%3E%3Ctext x="400" y="300" font-size="48" fill="white" text-anchor="middle"%3EPurple to Pink%3C/text%3E%3C/svg%3E', alt: 'Purple to Pink' },
  ];

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let scrollTimeout: NodeJS.Timeout;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setPerformanceData(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
          activeProjections: projection.projections.size,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const handleScroll = () => {
      setPerformanceData(prev => ({ ...prev, scrolling: true }));
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setPerformanceData(prev => ({ ...prev, scrolling: false }));
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    measureFPS();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [projection.projections]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Fixed Performance Monitor */}
      <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 z-50 font-mono text-sm">
        <div className="text-xs text-white/60 mb-2">PROJECTION SYSTEM TEST</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-white/80">FPS:</span>
            <span className={`font-bold ${performanceData.fps >= 58 ? 'text-green-400' : performanceData.fps >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
              {performanceData.fps}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/80">Active Projections:</span>
            <span className="text-blue-400 font-bold">{performanceData.activeProjections}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/80">Max Allowed:</span>
            <span className="text-white/60">7</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/80">Status:</span>
            <span className={performanceData.scrolling ? 'text-yellow-400' : 'text-green-400'}>
              {performanceData.scrolling ? 'Scrolling' : 'Idle'}
            </span>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/60 space-y-1">
          <div className="font-bold text-white/80 mb-2">Expected Behavior:</div>
          <div>✓ Idle FPS: 0 (zero CPU at rest)</div>
          <div>✓ Scroll FPS: 58-60</div>
          <div>✓ Active Projections: ≤7</div>
          <div>✓ Smooth transitions</div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-4">Projection System Performance Test</h1>
        <p className="text-white/80 mb-8">
          This page tests the new centralized scroll-driven projection system.
          Open DevTools → Performance → Record to verify zero idle CPU usage.
        </p>

        {/* Test Controls */}
        <div className="bg-black/40 border border-white/20 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">Quick Settings Test</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => projection.setFadeDistance(0.3)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Fade Distance: 0.3
            </button>
            <button
              onClick={() => projection.setFadeDistance(0.7)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Fade Distance: 0.7
            </button>
            <button
              onClick={() => projection.setMaxBlur(2)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              Max Blur: 2px
            </button>
            <button
              onClick={() => projection.setMaxBlur(8)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              Max Blur: 8px
            </button>
            <button
              onClick={() => projection.setBlendMode('normal')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
            >
              Blend: Normal
            </button>
            <button
              onClick={() => projection.setBlendMode('screen')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
            >
              Blend: Screen
            </button>
          </div>
        </div>

        {/* Test Carousels */}
        <div className="space-y-12">
          <h2 className="text-2xl font-bold mb-6">Test Carousels (Scroll to see projection system in action)</h2>

          {/* Carousel 1: Standard settings */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white/80">Carousel 1: Default Settings</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="test-carousel-1"
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Carousel 2: Custom settings via prop */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white/80">Carousel 2: Per-Carousel Settings (scaleX: 1.5, scaleY: 2.0, maxBlur: 10)</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="test-carousel-2"
              projectionSettings={{
                scaleX: 1.5,
                scaleY: 2.0,
                maxBlur: 10,
                fadeDistance: 0.6,
              }}
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Carousel 3: Checkerboard vignette */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white/80">Carousel 3: Checkerboard Vignette</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="test-carousel-3"
              projectionSettings={{
                checkerboard: {
                  enabled: true,
                  tileSize: 40,
                  scatterSpeed: 0.5,
                  blur: 2,
                },
                vignette: {
                  width: 30,
                  strength: 0.7,
                },
              }}
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Carousel 4-10: Stress test (to verify max 7 active) */}
          {[4, 5, 6, 7, 8, 9, 10].map(num => (
            <div key={num}>
              <h3 className="text-lg font-semibold mb-2 text-white/80">Carousel {num}: Stress Test</h3>
              <Carousel
                images={testImages}
                enableProjection={true}
                projectionId={`test-carousel-${num}`}
                showNavigation={true}
                autoplaySpeed={0}
              />
            </div>
          ))}

          {/* Spacer to allow scrolling */}
          <div className="h-screen"></div>
        </div>
      </div>

      {/* Footer with test instructions */}
      <div className="max-w-4xl mx-auto px-8 pb-12 text-white/60 text-sm">
        <h3 className="text-white/80 font-semibold mb-4">Performance Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open Chrome DevTools → Performance tab</li>
          <li>Click Record, wait 5 seconds (page should be idle)</li>
          <li>Stop recording and check CPU usage - should be near 0%</li>
          <li>Scroll smoothly up and down - should maintain 58-60 FPS</li>
          <li>Check that "Active Projections" never exceeds 7</li>
          <li>Test quick settings buttons to verify real-time updates</li>
        </ol>
      </div>
    </div>
  );
}
