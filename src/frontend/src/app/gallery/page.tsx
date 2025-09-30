/**
 * Gallery Demo Page
 *
 * Demonstrates layout system with actual sample images.
 * Uses sample content from Downloads location for development.
 *
 * @author Zara (UI/UX & React Components Specialist)
 */

'use client';

import { useEffect } from 'react';
import { ResponsiveContainer, Grid, ContentBlock, useBackground } from "@/components/Layout";
import Image from "next/image";

// Sample images from the portfolio-sample-content
// In production, these would come from Viktor's API
const sampleImages = [
  {
    id: '1',
    src: 'https://picsum.photos/seed/wolf1/800/1200',
    alt: 'Portrait artwork 1',
    aspect: 'portrait'
  },
  {
    id: '2',
    src: 'https://picsum.photos/seed/wolf2/1200/800',
    alt: 'Landscape artwork 1',
    aspect: 'landscape'
  },
  {
    id: '3',
    src: 'https://picsum.photos/seed/wolf3/1000/1000',
    alt: 'Square artwork 1',
    aspect: 'square'
  },
  {
    id: '4',
    src: 'https://picsum.photos/seed/wolf4/1200/800',
    alt: 'Landscape artwork 2',
    aspect: 'landscape'
  },
  {
    id: '5',
    src: 'https://picsum.photos/seed/wolf5/800/1200',
    alt: 'Portrait artwork 2',
    aspect: 'portrait'
  },
  {
    id: '6',
    src: 'https://picsum.photos/seed/wolf6/1000/1000',
    alt: 'Square artwork 2',
    aspect: 'square'
  },
];

export default function GalleryDemo() {
  const { setBackground } = useBackground();

  // Set background to first image on mount
  useEffect(() => {
    setBackground(sampleImages[0].src);
  }, [setBackground]);

  const handleImageHover = (src: string) => {
    setBackground(src);
  };

  return (
    <ResponsiveContainer>
      <Grid variant="single" spacing="loose">
        {/* Hero Section */}
        <ContentBlock className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Gallery Collection
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
              Hover over images to see the background transition effect
            </p>
          </div>
        </ContentBlock>

        {/* Masonry Gallery */}
        <ContentBlock>
          <Grid variant="masonry" columns={3} spacing="normal">
            {sampleImages.map((image) => (
              <div
                key={image.id}
                className="relative overflow-hidden rounded-lg bg-black/20 hover:scale-105 transition-transform duration-300 cursor-pointer group"
                onMouseEnter={() => handleImageHover(image.src)}
                onClick={() => handleImageHover(image.src)}
              >
                <div className={`relative ${
                  image.aspect === 'portrait' ? 'aspect-[3/4]' :
                  image.aspect === 'landscape' ? 'aspect-[4/3]' :
                  'aspect-square'
                }`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              </div>
            ))}
          </Grid>
        </ContentBlock>

        {/* Side-by-side feature blocks */}
        <Grid variant="side-by-side" spacing="normal">
          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-3">
              Dynamic Backgrounds
            </h2>
            <p className="text-white/80 leading-relaxed">
              Notice how the page background smoothly crossfades when you hover over different images.
              This creates a cinematic, immersive viewing experience.
            </p>
          </ContentBlock>

          <ContentBlock>
            <h2 className="text-2xl font-bold text-white mb-3">
              Responsive Masonry
            </h2>
            <p className="text-white/80 leading-relaxed">
              The gallery automatically adapts to different screen sizes, maintaining perfect
              aspect ratios for portrait, landscape, and square artworks.
            </p>
          </ContentBlock>
        </Grid>

        {/* Info */}
        <ContentBlock className="text-center">
          <p className="text-white/60 text-sm">
            This is a demo using placeholder images. In production, images will be served from Viktor's content API.
          </p>
        </ContentBlock>
      </Grid>
    </ResponsiveContainer>
  );
}