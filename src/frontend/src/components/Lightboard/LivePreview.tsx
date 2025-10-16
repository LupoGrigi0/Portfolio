/**
 * LivePreview Component
 *
 * Isolates real-time preview functionality for carousels in Lightboard.
 * Re-renders carousels when settings change to provide live feedback.
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { SelectableCarousel } from './SelectableCarousel';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';
import type { Collection } from '@/lib/api-client';
import { getAbsoluteMediaUrl } from '@/lib/api-client';

interface LivePreviewProps {
  collection: Collection | null;
  carouselSettings?: {
    transition?: string;
    autoplay?: boolean;
    interval?: number;
    speed?: number;
    reservedSpace?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  };
  projectionSettings?: {
    fadeDistance?: number;
    maxBlur?: number;
    projectionScaleX?: number;
    projectionScaleY?: number;
    blendMode?: string;
    vignetteWidth?: number;
    vignetteStrength?: number;
    checkerboardEnabled?: boolean;
    checkerboardTileSize?: number;
    checkerboardScatterSpeed?: number;
    checkerboardBlur?: number;
  };
  onSettingsApplied?: () => void;
}

export function LivePreview({
  collection,
  carouselSettings,
  projectionSettings,
  onSettingsApplied,
}: LivePreviewProps) {
  const renderKey = useRef(0);

  // Trigger re-render when settings change
  // FIXED: Removed onSettingsApplied from deps to prevent infinite render loop
  useEffect(() => {
    renderKey.current += 1;
    if (onSettingsApplied) {
      onSettingsApplied();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselSettings, projectionSettings]);

  if (!collection || !collection.gallery || collection.gallery.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <p className="text-lg mb-2">No collection loaded</p>
          <p className="text-sm">Load a collection to see live preview</p>
        </div>
      </div>
    );
  }

  // Split gallery into chunks for multiple carousels
  const imagesPerCarousel = 5;
  const carousels: Array<typeof collection.gallery> = [];

  for (let i = 0; i < collection.gallery.length; i += imagesPerCarousel) {
    carousels.push(collection.gallery.slice(i, i + imagesPerCarousel));
  }

  // Limit to first 3 carousels for preview
  const previewCarousels = carousels.slice(0, 3);

  return (
    <div key={renderKey.current} className="space-y-12">
      {previewCarousels.map((images, index) => {
        // Filter out images with missing URLs and convert relative URLs to absolute
        // Fallback chain: large -> medium -> small -> original
        const validImages = images
          .filter((img) => {
            return img.urls?.large || img.urls?.medium || img.urls?.small || img.urls?.original;
          })
          .map((img) => {
            const imageUrl = img.urls.large || img.urls.medium || img.urls.small || img.urls.original;
            return {
              id: img.id,
              src: getAbsoluteMediaUrl(imageUrl),
              alt: img.altText || img.filename,
            };
          });

        // Skip carousel if no valid images
        if (validImages.length === 0) {
          return null;
        }

        return (
          <div key={`carousel-${index}`}>
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">
              Preview Carousel {index + 1}
            </h2>
            <SelectableCarousel carouselId={`preview-carousel-${index}`}>
              <ReferenceCarousel
                images={validImages}
                enableProjection={true}
                projectionId={`preview-carousel-${index}`}
              />
            </SelectableCarousel>
          </div>
        );
      })}

      {collection.gallery.length > imagesPerCarousel * 3 && (
        <div className="text-center text-zinc-500 py-8">
          <p>
            Showing 3 of {carousels.length} carousels
            <br />
            ({collection.gallery.length} total images)
          </p>
        </div>
      )}
    </div>
  );
}
