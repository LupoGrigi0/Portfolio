/**
 * Minimal Projection System Test
 *
 * Pure projection performance test without carousel complexity.
 * Uses simple image containers that register with projection system.
 *
 * @author Prism (Kat - Performance Specialist)
 * @created 2025-10-16
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectionManager, useCarouselProjection } from '@/components/Layout';
import { getCollection } from '@/lib/api-client';
import type { Collection } from '@/lib/api-client';

/**
 * Simple Image Container with Projection
 * No carousel complexity - just a single image that projects
 */
function ProjectingImage({
  id,
  imageUrl,
  index,
  projectionSettings
}: {
  id: string;
  imageUrl: string;
  index: number;
  projectionSettings?: any;
}) {
  // Register with projection system
  const containerRef = useCarouselProjection(
    id,
    imageUrl,
    true, // enable projection
    projectionSettings
  );

  return (
    <div ref={containerRef} className="w-full mb-8">
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        <img
          src={imageUrl}
          alt={`Image ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          #{index + 1}
        </div>
      </div>
    </div>
  );
}

export default function ProjectionMinimalTest() {
  const projection = useProjectionManager();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    fps: 0,
    activeProjections: 0,
    scrolling: false,
  });

  // Load a real collection (use first available)
  useEffect(() => {
    getCollection('couples').then(data => {
      if (data) {
        setCollection(data);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load collection:', err);
      setLoading(false);
    });
  }, []);

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
  }, []); // Run once on mount - measureFPS reads projection.projections.size directly

  // Get first 15 images (3 groups of 5)
  const images = collection?.gallery
    ?.filter(item => {
      if (item.type !== 'image') return false;
      // Use large, or fall back to medium, or fall back to original
      const hasUrl = item.urls?.large || item.urls?.medium || item.urls?.original;
      return !!hasUrl;
    })
    .slice(0, 15)
    .map(item => {
      // Use large, or fall back to medium, or fall back to original
      const imageUrl = item.urls.large || item.urls.medium || item.urls.original;
      return {
        id: item.id,
        url: `http://localhost:4000${imageUrl}`,
      };
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
          <p>Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection || images.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Backend Not Running</h1>
          <p className="text-white/60 mb-4">
            Make sure the backend is running on http://localhost:4000
          </p>
          <p className="text-white/40 text-sm">
            Start backend: cd src/backend && npm run dev
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Fixed Performance Monitor */}
      <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 z-50 font-mono text-sm">
        <div className="text-xs text-white/60 mb-2">PROJECTION PERFORMANCE</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-white/80">FPS:</span>
            <span className={`font-bold ${performanceData.fps >= 58 ? 'text-green-400' : performanceData.fps >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
              {performanceData.fps}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/80">Active:</span>
            <span className="text-blue-400 font-bold">{performanceData.activeProjections} / 7</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/80">Status:</span>
            <span className={performanceData.scrolling ? 'text-yellow-400' : 'text-green-400'}>
              {performanceData.scrolling ? 'Scroll' : 'Idle'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-white/60">Collection:</span>
            <span className="text-white/80">{collection.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Images:</span>
            <span className="text-white/80">{images.length}</span>
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/60 space-y-1">
          <div className="font-bold text-white/80 mb-2">Expected:</div>
          <div className={performanceData.fps === 0 && !performanceData.scrolling ? 'text-green-400' : 'text-white/60'}>
            ✓ Idle: 0 FPS (zero CPU)
          </div>
          <div className={performanceData.scrolling && performanceData.fps >= 58 ? 'text-green-400' : 'text-white/60'}>
            ✓ Scroll: 58-60 FPS
          </div>
          <div className={performanceData.activeProjections <= 7 ? 'text-green-400' : 'text-red-400'}>
            {performanceData.activeProjections <= 7 ? '✓' : '✗'} Active ≤ 7
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-4">Minimal Projection Test</h1>
        <p className="text-white/80 mb-8">
          Simple image containers (no carousel complexity) to isolate projection system performance.
          <br />
          <span className="text-sm text-white/60">Using {images.length} images from "{collection.name}"</span>
        </p>

        {/* Quick Controls */}
        <div className="bg-black/40 border border-white/20 rounded-lg p-4 mb-8">
          <h2 className="text-sm font-bold mb-3 text-white/80">Live Settings Control</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => projection.setFadeDistance(0.3)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Fade: 0.3
            </button>
            <button
              onClick={() => projection.setFadeDistance(0.7)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Fade: 0.7
            </button>
            <button
              onClick={() => projection.setMaxBlur(2)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              Blur: 2px
            </button>
            <button
              onClick={() => projection.setMaxBlur(10)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              Blur: 10px
            </button>
          </div>
        </div>

        {/* Image Grid - 3 groups of 5 */}
        <div className="space-y-16">
          {/* Group 1: Default settings */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white/80">
              Group 1: Default Settings (5 images)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.slice(0, 5).map((img, idx) => (
                <ProjectingImage
                  key={img.id}
                  id={`test-${img.id}`}
                  imageUrl={img.url}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Group 2: Custom scale */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white/80">
              Group 2: Custom Scale (scaleX: 1.5, scaleY: 2.0)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.slice(5, 10).map((img, idx) => (
                <ProjectingImage
                  key={img.id}
                  id={`test-scaled-${img.id}`}
                  imageUrl={img.url}
                  index={idx + 5}
                  projectionSettings={{
                    scaleX: 1.5,
                    scaleY: 2.0,
                    maxBlur: 6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Group 3: Checkerboard vignette */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white/80">
              Group 3: Checkerboard Vignette
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.slice(10, 15).map((img, idx) => (
                <ProjectingImage
                  key={img.id}
                  id={`test-checker-${img.id}`}
                  imageUrl={img.url}
                  index={idx + 10}
                  projectionSettings={{
                    checkerboard: {
                      enabled: true,
                      tileSize: 40,
                      blur: 2,
                    },
                    vignette: {
                      width: 30,
                      strength: 0.7,
                    },
                  }}
                />
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="h-screen"></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-8 pb-12 text-white/60 text-sm">
        <h3 className="text-white/80 font-semibold mb-4">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Watch the performance monitor (top-right) - FPS should be 0 when idle</li>
          <li>Scroll smoothly up and down - FPS should jump to 58-60</li>
          <li>Active projections should never exceed 7</li>
          <li>Try the live settings buttons - changes apply immediately</li>
          <li>Open DevTools → Performance → Record idle time to verify 0% CPU</li>
        </ol>
      </div>
    </div>
  );
}
