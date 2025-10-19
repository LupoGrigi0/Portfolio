'use client';

import { useState } from 'react';
import { useCarouselProjection } from '@/components/Layout/ProjectionManager';
import CheckerboardFlutter from '@/components/Layout/CheckerboardFlutter';

/**
 * Projection + Flutter Integration Test
 *
 * Tests checkerboard flutter particles spawning from REAL projections!
 *
 * Step 1 & 2 Test: Verify CheckerboardFlutter can read projection data
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */

function TestCarousel({ id, imageUrl }: { id: string; imageUrl: string }) {
  const projectionRef = useCarouselProjection(
    id,
    imageUrl,
    true, // enabled
    {
      checkerboard: {
        enabled: true,
        tileSize: 30,
        scatterSpeed: 0.3,
        blur: 0,
      },
      fadeDistance: 2.0, // INCREASED! 0.5 was filtering out projections too aggressively
      maxBlur: 4,
      scaleX: 1.5,
      scaleY: 1.5,
    }
  );

  return (
    <div
      ref={projectionRef}
      className="relative w-full h-64 bg-gray-800/30 rounded-lg overflow-hidden border border-purple-500/50"
    >
      <img
        src={imageUrl}
        alt="Test carousel"
        className="w-full h-full object-cover opacity-70"
      />
      <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded text-white text-sm backdrop-blur-sm">
        Carousel {id}
      </div>
    </div>
  );
}

export default function ProjectionFlutterTestPage() {
  const testImages = [
    'https://picsum.photos/seed/test1/800/400',
    'https://picsum.photos/seed/test2/800/400',
    'https://picsum.photos/seed/test3/800/400',
  ];

  return (
    <div className="relative w-full min-h-[300vh] bg-gradient-to-b from-purple-950 via-gray-900 to-black">
      {/* Checkerboard Flutter Effect */}
      <CheckerboardFlutter
        enabled={true}
        tileSize={30}
        intensity={0.5}
        triggerDelay={300}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 py-16">
        <div className="bg-black/60 backdrop-blur-md rounded-lg p-8 max-w-4xl mx-auto border border-purple-700/50 mb-12">
          <h1 className="text-5xl font-bold mb-2 text-white flex items-center gap-3">
            Projection + Flutter Test <span className="text-4xl">🎨🎯</span>
          </h1>
          <p className="text-xl text-purple-300 mb-6">Testing Steps 1 & 2: Reading projection data</p>

          <div className="space-y-6">
            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700/30">
              <p className="text-purple-100 text-xl font-bold mb-3">
                📋 Test Instructions:
              </p>
              <ol className="text-purple-200 space-y-2 list-decimal list-inside">
                <li><strong>Open browser console</strong> (F12 → Console tab)</li>
                <li><strong>Scroll down</strong> through the page</li>
                <li><strong>Stop scrolling</strong></li>
                <li><strong>Look for log:</strong> <code className="bg-black/40 px-2 py-1 rounded text-xs">[Checkerboard Flutter] Active projections</code></li>
                <li><strong>Verify:</strong> Should see 3 projections with checkerboard enabled</li>
              </ol>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/30">
              <p className="text-green-200 font-bold mb-2">✅ Step 1: Connect to ProjectionManager</p>
              <p className="text-green-300 text-sm">
                CheckerboardFlutter now imports and uses <code className="bg-black/40 px-1 rounded">useProjectionManager()</code> hook
              </p>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/30">
              <p className="text-green-200 font-bold mb-2">✅ Step 2: Read active projections</p>
              <p className="text-green-300 text-sm">
                On scroll stop, logs all active projections with their settings
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/30">
              <p className="text-blue-200 font-bold mb-2">🔜 Next Steps:</p>
              <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
                <li>Step 3: Spawn particles from projection positions (not random)</li>
                <li>Step 4: Match particle tile size to projection checker size</li>
                <li>Step 5: Sample checker color from projection image</li>
                <li>Step 6: Remove checker from projection mask</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Carousels with Projections */}
        <div className="space-y-16 max-w-4xl mx-auto">
          {testImages.map((url, i) => (
            <div key={i}>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">
                Test Carousel {i + 1}
              </h3>
              <TestCarousel id={`test-carousel-${i}`} imageUrl={url} />
              <p className="text-gray-400 text-sm mt-2">
                This carousel has a checkerboard projection (30px tiles). Scroll to see it!
              </p>
            </div>
          ))}
        </div>

        {/* Spacer for more scrolling */}
        <div className="h-96"></div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 bg-black/60 rounded-lg p-6 max-w-4xl mx-auto">
          <p className="text-purple-400 font-bold">Little steps = easier debugging! 🎯</p>
          <p className="text-gray-400 mt-2">Testing integration piece by piece</p>
          <p className="text-gray-500 mt-4">Created by Prism (Performance Specialist)</p>
          <p className="mt-2 space-x-4">
            <a href="/checkerboard-flutter-test" className="text-purple-400 hover:text-purple-300 underline">
              ← Flutter Only
            </a>
            <span className="text-gray-600">|</span>
            <a href="/" className="text-purple-400 hover:text-purple-300 underline">
              Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
