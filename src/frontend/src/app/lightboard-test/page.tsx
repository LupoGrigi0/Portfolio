/**
 * Lightboard Test Page
 *
 * Demonstrates the click-to-select functionality for carousels with Lightboard designer.
 * This page shows multiple carousels that can be clicked to select,
 * with visual feedback and integration with Lightboard settings widgets.
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import { Lightboard, LightboardProvider, SelectableCarousel } from '@/components/Lightboard';
import { MidgroundProjectionProvider } from '@/components/Layout';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';

// Sample images for testing
const sampleImages1 = [
  {
    id: '1',
    src: 'https://picsum.photos/800/600?random=1',
    alt: 'Sample Image 1',
  },
  {
    id: '2',
    src: 'https://picsum.photos/800/600?random=2',
    alt: 'Sample Image 2',
  },
  {
    id: '3',
    src: 'https://picsum.photos/800/600?random=3',
    alt: 'Sample Image 3',
  },
];

const sampleImages2 = [
  {
    id: '4',
    src: 'https://picsum.photos/800/600?random=4',
    alt: 'Sample Image 4',
  },
  {
    id: '5',
    src: 'https://picsum.photos/800/600?random=5',
    alt: 'Sample Image 5',
  },
  {
    id: '6',
    src: 'https://picsum.photos/800/600?random=6',
    alt: 'Sample Image 6',
  },
];

const sampleImages3 = [
  {
    id: '7',
    src: 'https://picsum.photos/800/600?random=7',
    alt: 'Sample Image 7',
  },
  {
    id: '8',
    src: 'https://picsum.photos/800/600?random=8',
    alt: 'Sample Image 8',
  },
  {
    id: '9',
    src: 'https://picsum.photos/800/600?random=9',
    alt: 'Sample Image 9',
  },
];

export default function LightboardTestPage() {
  return (
    <MidgroundProjectionProvider>
      <LightboardProvider>
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <div className="p-8 border-b border-zinc-800">
            <h1 className="text-4xl font-bold mb-2">Lightboard Test Page</h1>
            <p className="text-zinc-400">
              Click any carousel to select it. The selected carousel will glow blue and show in the Lightboard settings.
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Click the gear icon (top-right) to open Lightboard designer.
            </p>
          </div>

          {/* Test Carousels */}
          <div className="p-8 space-y-12">
            {/* Carousel 1 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Carousel 1</h2>
              <SelectableCarousel carouselId="test-carousel-1">
                <ReferenceCarousel
                  images={sampleImages1}
                  enableProjection={true}
                  projectionId="test-carousel-1"
                />
              </SelectableCarousel>
            </div>

            {/* Carousel 2 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Carousel 2</h2>
              <SelectableCarousel carouselId="test-carousel-2">
                <ReferenceCarousel
                  images={sampleImages2}
                  enableProjection={true}
                  projectionId="test-carousel-2"
                />
              </SelectableCarousel>
            </div>

            {/* Carousel 3 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Carousel 3</h2>
              <SelectableCarousel carouselId="test-carousel-3">
                <ReferenceCarousel
                  images={sampleImages3}
                  enableProjection={false}
                  projectionId="test-carousel-3"
                />
              </SelectableCarousel>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-8 border-t border-zinc-800">
            <h3 className="text-xl font-semibold mb-4 text-emerald-400">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-zinc-300">
              <li>Click on any carousel to select it (it will glow blue)</li>
              <li>Open Lightboard by clicking the gear icon in the top-right corner</li>
              <li>Go to the "Projection" tab - you'll see which carousel is selected</li>
              <li>Go to the "Carousel" tab - settings will apply to the selected carousel</li>
              <li>Adjust settings and click "Apply" to see changes (coming soon)</li>
              <li>Click a different carousel to switch selection</li>
            </ol>
          </div>

          {/* Lightboard Designer */}
          <Lightboard />
        </div>
      </LightboardProvider>
    </MidgroundProjectionProvider>
  );
}
