/**
 * Carousel Demo Page
 *
 * Demonstrates the Carousel component with sample images.
 * Shows integration with Background context and navigation controls.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 */

'use client';

import { Carousel } from '@/components/Carousel';
import { ReferenceCarousel } from '@/components/ReferenceCarousel';
import { ResponsiveContainer, Grid, ContentBlock } from '@/components/Layout';
import type { CarouselImage } from '@/components/Carousel/types';

// Sample images for carousel demo
const carouselImages: CarouselImage[] = [
  {
    id: '1',
    src: 'https://picsum.photos/seed/carousel1/1920/1280',
    alt: 'Mountain landscape at sunset',
    title: 'Mountain Sunset',
    caption: 'Golden hour in the mountains',
    width: 1920,
    height: 1280,
    aspectRatio: 1.5
  },
  {
    id: '2',
    src: 'https://picsum.photos/seed/carousel2/1920/1280',
    alt: 'Ocean waves crashing on shore',
    title: 'Ocean Waves',
    caption: 'The power and beauty of the sea',
    width: 1920,
    height: 1280,
    aspectRatio: 1.5
  },
  {
    id: '3',
    src: 'https://picsum.photos/seed/carousel3/1920/1280',
    alt: 'Forest path in autumn',
    title: 'Autumn Forest',
    caption: 'A walk through fall colors',
    width: 1920,
    height: 1280,
    aspectRatio: 1.5
  },
  {
    id: '4',
    src: 'https://picsum.photos/seed/carousel4/1920/1280',
    alt: 'Desert dunes at dawn',
    title: 'Desert Dawn',
    caption: 'Silence and beauty of the desert',
    width: 1920,
    height: 1280,
    aspectRatio: 1.5
  },
  {
    id: '5',
    src: 'https://picsum.photos/seed/carousel5/1920/1280',
    alt: 'City skyline at night',
    title: 'Urban Lights',
    caption: 'The city never sleeps',
    width: 1920,
    height: 1280,
    aspectRatio: 1.5
  }
];

export default function CarouselDemo() {
  const handleImageChange = (index: number, image: CarouselImage) => {
    console.log(`Carousel changed to image ${index + 1}:`, image.title);
  };

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="loose">
        {/* Hero Section */}
        <ContentBlock className="min-h-[30vh] flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Carousel Demo
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              High-performance image carousel with smooth transitions
            </p>
          </div>
        </ContentBlock>

        {/* Side-by-Side Comparison */}
        <Grid variant="side-by-side" spacing="normal">
          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-4">🔧 Custom Carousel (Under Development)</h2>
            <div className="min-h-[60vh] flex items-center">
              <Carousel
                images={carouselImages}
                transitionType="fade"
                transitionDuration={800}
                autoplaySpeed={5000}
                showCaptions={true}
                enableFullscreen={true}
                showNavigation={true}
                showIndicators={true}
                onImageChange={handleImageChange}
              />
            </div>
          </ContentBlock>

          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-4">✅ Reference Carousel (Working Example)</h2>
            <ReferenceCarousel
              images={carouselImages.map(img => ({
                id: img.id,
                src: img.src,
                alt: img.alt
              }))}
            />
          </ContentBlock>
        </Grid>

        {/* Features Grid */}
        <Grid variant="side-by-side" spacing="normal">
          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-3">
              🎯 Smooth Transitions
            </h2>
            <p className="text-white/80 leading-relaxed mb-3">
              Fade transitions between images with configurable duration.
              Notice how the page background smoothly updates to match the current carousel image.
            </p>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• 60fps performance</li>
              <li>• Optimized for 4K+ images</li>
              <li>• Progressive loading</li>
            </ul>
          </ContentBlock>

          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-3">
              ⌨️ Keyboard Navigation
            </h2>
            <p className="text-white/80 leading-relaxed mb-3">
              Full keyboard support for accessibility and power users.
            </p>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-xs">→</kbd> Navigate images</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-xs">Space</kbd> Pause/resume autoplay</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-xs">ESC</kbd> Exit fullscreen</li>
              <li>• <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-xs">F</kbd> Toggle fullscreen (button)</li>
            </ul>
          </ContentBlock>
        </Grid>

        {/* More Features */}
        <Grid variant="masonry" columns={3} spacing="normal">
          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              📱 Touch Gestures
            </h3>
            <p className="text-white/70 text-sm">
              Swipe left/right on mobile devices. Touch-optimized for smooth interaction.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              🖼️ Fullscreen Mode
            </h3>
            <p className="text-white/70 text-sm">
              Click the fullscreen button for an immersive viewing experience with captions.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              🎬 Auto-Advance
            </h3>
            <p className="text-white/70 text-sm">
              Automatic progression with configurable timing. Pause anytime with the play/pause button.
            </p>
          </ContentBlock>
        </Grid>

        {/* Info */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm mb-2">
            This is Phase 1 MVP: Basic display, navigation, and fade transitions.
          </p>
          <p className="text-white/50 text-xs">
            Coming soon: Touch gestures, parallax effects, video support, and advanced transitions
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}