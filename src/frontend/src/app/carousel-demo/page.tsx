/**
 * Carousel Demo Page
 *
 * Demonstrates the Carousel component with sample images.
 * Shows integration with Background context and navigation controls.
 *
 * @author Kai (Carousel & Animation Specialist)
 * @created 2025-09-30
 * @updated 2025-10-01 - Added config panel and transition testing (Kai v3)
 */

'use client';

import { useState, useEffect } from 'react';
import { Carousel } from '@/components/Carousel';
import CarouselConfigPanel from '@/components/Carousel/CarouselConfigPanel';
import { ReferenceCarousel } from '@/components/ReferenceCarousel';
import { ResponsiveContainer, Grid, ContentBlock } from '@/components/Layout';
import type { CarouselImage, TransitionType, AutoplaySpeedPreset, FullscreenMode } from '@/components/Carousel/types';

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
  // Configuration state
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [speedPreset, setSpeedPreset] = useState<AutoplaySpeedPreset>('medium');
  const [customSpeedMs, setCustomSpeedMs] = useState(2000);
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenMode>('browser');

  // State for live API data
  const [liveImages, setLiveImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('couples');

  // Fetch live data from backend API
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:4000/api/content/collections/${collectionName}?page=1&limit=20`);

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const json = await response.json();

        if (!json.success || !json.data?.collection?.gallery) {
          throw new Error('Invalid API response structure');
        }

        console.log('[CarouselDemo] Raw API response', {
          total: json.data.collection.gallery.length,
          firstItem: json.data.collection.gallery[0]
        });

        // Transform API data to carousel format with ROBUST validation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedImages: CarouselImage[] = json.data.collection.gallery
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => {
            // Strict validation - item must have all required fields
            const isValid =
              item &&
              item.type === 'image' &&
              item.id &&
              item.urls &&
              typeof item.urls.large === 'string' &&
              item.urls.large.trim() !== '';

            if (!isValid && item) {
              console.warn('[CarouselDemo] Skipping invalid item:', {
                id: item.id,
                type: item.type,
                hasUrls: !!item.urls,
                largeUrl: item.urls?.large
              });
            }

            return isValid;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => {
            const carouselImage: CarouselImage = {
              id: item.id,
              src: `http://localhost:4000${item.urls.large}`,
              alt: item.title || item.filename || `Portfolio image ${item.id}`,
              title: item.title || undefined,
              caption: item.caption || undefined,
              width: (typeof item.dimensions?.width === 'number') ? item.dimensions.width : 4096,
              height: (typeof item.dimensions?.height === 'number') ? item.dimensions.height : 4096,
              aspectRatio: (typeof item.dimensions?.aspectRatio === 'number') ? item.dimensions.aspectRatio : 1,
              thumbnail: (item.urls?.thumbnail && typeof item.urls.thumbnail === 'string')
                ? `http://localhost:4000${item.urls.thumbnail}`
                : undefined
            };

            console.log('[CarouselDemo] Transformed item:', {
              id: carouselImage.id,
              src: carouselImage.src,
              dimensions: `${carouselImage.width}x${carouselImage.height}`
            });

            return carouselImage;
          });

        console.log('[CarouselDemo] Successfully fetched live images', {
          total: json.data.collection.gallery.length,
          valid: transformedImages.length,
          invalid: json.data.collection.gallery.length - transformedImages.length,
          collection: collectionName
        });

        setLiveImages(transformedImages);
      } catch (err) {
        console.error('[CarouselDemo] Failed to fetch live data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch live data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveData();
  }, [collectionName]);

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
              Carousel Testing Lab
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Interactive carousel with live configuration controls
            </p>
          </div>
        </ContentBlock>

        {/* Main Carousel with Config Panel */}
        <ContentBlock>
          <h2 className="text-2xl font-bold text-white mb-4">🎠 Custom Carousel</h2>

          {/* Configuration Panel */}
          <CarouselConfigPanel
            currentTransition={transitionType}
            currentSpeed={speedPreset}
            customSpeedMs={customSpeedMs}
            fullscreenMode={fullscreenMode}
            onTransitionChange={setTransitionType}
            onSpeedChange={setSpeedPreset}
            onCustomSpeedChange={setCustomSpeedMs}
            onFullscreenModeChange={setFullscreenMode}
            className="mb-6"
          />

          {/* Carousel */}
          <div className="min-h-[60vh] flex items-center">
            <Carousel
              images={carouselImages}
              transitionType={transitionType}
              transitionDuration={800}
              autoplaySpeed={speedPreset === 'custom' ? customSpeedMs : 5000}
              autoPauseDuration={5000}
              showCaptions={true}
              enableFullscreen={true}
              fullscreenMode={fullscreenMode}
              showNavigation={true}
              showIndicators={true}
              onImageChange={handleImageChange}
            />
          </div>
        </ContentBlock>

        {/* Reference Carousel */}
        <ContentBlock>
          <h2 className="text-2xl font-bold text-white mb-4">✅ Reference Implementation</h2>
          <ReferenceCarousel
            images={carouselImages.map(img => ({
              id: img.id,
              src: img.src,
              alt: img.alt
            }))}
          />
        </ContentBlock>

        {/* Live API Data Carousel */}
        <ContentBlock>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              🎨 Live Portfolio Data
            </h2>

            {/* Collection Selector */}
            <div className="flex gap-2">
              {['couples', 'mixed'].map((collection) => (
                <button
                  key={collection}
                  onClick={() => setCollectionName(collection)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    collectionName === collection
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {collection.charAt(0).toUpperCase() + collection.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center bg-black/20 rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/60">Loading live portfolio images...</p>
              </div>
            </div>
          ) : error ? (
            <div className="min-h-[60vh] flex items-center justify-center bg-red-900/20 rounded-lg border border-red-500/30">
              <div className="text-center text-white p-8">
                <p className="text-red-400 font-semibold mb-2">⚠️ Failed to load live data</p>
                <p className="text-white/60 text-sm mb-4">{error}</p>
                <p className="text-white/40 text-xs">Make sure Viktor&apos;s backend is running on port 4000</p>
              </div>
            </div>
          ) : liveImages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">LIVE</span>
                <span>Fetched {liveImages.length} images from backend API</span>
                <span className="text-white/40">• Collection: {collectionName} • Source: http://localhost:4000</span>
              </div>
              <div className="min-h-[60vh] flex items-center">
                <Carousel
                  images={liveImages}
                  transitionType={transitionType}
                  transitionDuration={800}
                  autoplaySpeed={speedPreset === 'custom' ? customSpeedMs : 5000}
                  autoPauseDuration={5000}
                  showCaptions={true}
                  enableFullscreen={true}
                  fullscreenMode={fullscreenMode}
                  showNavigation={true}
                  showIndicators={true}
                  onImageChange={handleImageChange}
                />
              </div>
              <div className="text-xs text-white/40 text-center">
                Testing with actual portfolio images (4096x4096) • Performance target: 60fps
              </div>
            </div>
          ) : (
            <div className="min-h-[60vh] flex items-center justify-center bg-black/20 rounded-lg">
              <p className="text-white/60">No images found in collection</p>
            </div>
          )}
        </ContentBlock>

        {/* Navigation Features */}
        <Grid variant="masonry" columns={3} spacing="normal">

          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-3">
              🖱️ Click Navigation
            </h2>
            <p className="text-white/80 leading-relaxed mb-3">
              Click left or right side of the image to navigate. Watch for cursor hints!
            </p>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Click left 50% → Previous image</li>
              <li>• Click right 50% → Next image</li>
              <li>• Works on mobile (touch) and desktop</li>
              <li>• Cursor shows ← or → hint on hover</li>
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
            </ul>
          </ContentBlock>
        </Grid>

        {/* Additional Features */}
        <Grid variant="masonry" columns={3} spacing="normal">
          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              🎯 Smooth Transitions
            </h3>
            <p className="text-white/70 text-sm">
              Fade transitions at 60fps, optimized for 4K+ images with progressive loading.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              🖼️ Fullscreen Mode
            </h3>
            <p className="text-white/70 text-sm">
              Click the fullscreen button for an immersive viewing experience with captions and image counter.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h3 className="text-xl font-bold text-white mb-2">
              🎬 Smart Auto-Advance
            </h3>
            <p className="text-white/70 text-sm">
              Autoplay with smart pause: automatically pauses for 5s when you manually navigate. No more fighting the carousel!
            </p>
          </ContentBlock>
        </Grid>

        {/* Info */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm mb-2">
            ✨ New: Click navigation + Auto-pause on interaction! Try clicking around while autoplay is running.
          </p>
          <p className="text-white/50 text-xs">
            Coming soon: Touch swipe gestures, parallax effects, video support, and advanced transitions
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}