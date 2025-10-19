/**
 * Projection + Flutter Test (V2)
 *
 * Fresh start using the WORKING projection-test page as base.
 * Adding CheckerboardFlutter particles to spawn from visible projections.
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */

'use client';

import Carousel from '@/components/Carousel/Carousel';
import CheckerboardFlutter from '@/components/Layout/CheckerboardFlutter';
import type { CarouselImage } from '@/components/Carousel/types';

export default function ProjectionFlutterTestV2() {
  // Test images (gradient patterns for visual debugging)
  const testImages: CarouselImage[] = [
    { id: '1', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(255,0,0);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(0,0,255);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g1)" /%3E%3Ctext x="400" y="300" font-size="48" fill="white" text-anchor="middle"%3ERed to Blue%3C/text%3E%3C/svg%3E', alt: 'Red to Blue' },
    { id: '2', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(0,255,0);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(255,255,0);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g2)" /%3E%3Ctext x="400" y="300" font-size="48" fill="black" text-anchor="middle"%3EGreen to Yellow%3C/text%3E%3C/svg%3E', alt: 'Green to Yellow' },
    { id: '3', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(138,43,226);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(255,20,147);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23g3)" /%3E%3Ctext x="400" y="300" font-size="48" fill="white" text-anchor="middle"%3EPurple to Pink%3C/text%3E%3C/svg%3E', alt: 'Purple to Pink' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Checkerboard Flutter Particles */}
      <CheckerboardFlutter
        enabled={true}
        tileSize={40}
        intensity={0.5}
        triggerDelay={300}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-4">Projection + Flutter Test (V2)</h1>
        <p className="text-white/80 mb-8">
          Fresh start! Using working Carousel component. Scroll down and STOP to see checkerboard particles flutter away.
        </p>

        {/* Instructions */}
        <div className="bg-black/40 border border-purple-500/50 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-bold mb-4 text-purple-300">How to Test:</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Scroll down through the page</li>
            <li>STOP scrolling (let velocity drop to zero)</li>
            <li>Watch the checkerboard projections for particles fluttering away</li>
            <li>Open console (F12) to see diagnostic logs</li>
          </ol>
        </div>

        {/* Test Carousels with Checkerboard Projections */}
        <div className="space-y-24">
          <h2 className="text-2xl font-bold mb-6">Test Carousels (All have checkerboard projections)</h2>

          {/* Carousel 1: Checkerboard with larger tiles - LEFT ALIGNED */}
          <div className="mr-auto" style={{ maxWidth: '85%' }}>
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Carousel 1: Large Checkerboard (40px tiles)</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="flutter-test-1"
              projectionSettings={{
                checkerboard: {
                  enabled: true,
                  tileSize: 40,
                  scatterSpeed: 0.5,
                  blur: 2,
                },
                fadeDistance: 0.7,
                vignette: {
                  width: 30,
                  strength: 0.7,
                },
              }}
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Carousel 2: Checkerboard with medium tiles - RIGHT ALIGNED */}
          <div className="ml-auto" style={{ maxWidth: '85%' }}>
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Carousel 2: Medium Checkerboard (30px tiles)</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="flutter-test-2"
              projectionSettings={{
                checkerboard: {
                  enabled: true,
                  tileSize: 30,
                  scatterSpeed: 0.3,
                  blur: 1,
                },
                fadeDistance: 0.7,
                vignette: {
                  width: 35,
                  strength: 0.6,
                },
              }}
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Carousel 3: Checkerboard with small tiles - CENTERED */}
          <div className="mx-auto" style={{ maxWidth: '90%' }}>
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Carousel 3: Small Checkerboard (20px tiles)</h3>
            <Carousel
              images={testImages}
              enableProjection={true}
              projectionId="flutter-test-3"
              projectionSettings={{
                checkerboard: {
                  enabled: true,
                  tileSize: 20,
                  scatterSpeed: 0.4,
                  blur: 0,
                },
                fadeDistance: 0.7,
                vignette: {
                  width: 40,
                  strength: 0.5,
                },
              }}
              showNavigation={true}
              autoplaySpeed={0}
            />
          </div>

          {/* Spacer to allow scrolling */}
          <div className="h-screen"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-8 pb-12 text-white/60 text-sm">
        <h3 className="text-white/80 font-semibold mb-4">Expected Behavior:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Checkerboard projections visible on all carousels</li>
          <li>After scroll stops, 1-2 checker squares spawn as particles</li>
          <li>Particles tumble and fall gently to bottom of screen</li>
          <li>Particles live for 50 seconds (for testing visibility)</li>
        </ul>
        <p className="mt-6 text-purple-400">
          Built by Prism (Performance Specialist) - V2: Fresh Start Edition 🎨
        </p>
      </div>
    </div>
  );
}
