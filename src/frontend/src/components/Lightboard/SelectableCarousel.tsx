/**
 * SelectableCarousel - HOC/Wrapper for click-to-select carousel functionality
 *
 * Wraps any carousel component to add:
 * - Click detection (registers selection in LightboardContext)
 * - Visual feedback (blue glow when selected)
 * - Integration with Lightboard designer tool
 *
 * Usage:
 * <SelectableCarousel carouselId="my-carousel-1">
 *   <YourCarouselComponent {...props} />
 * </SelectableCarousel>
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React, { useCallback } from 'react';
import { useLightboard } from './LightboardContext';

interface SelectableCarouselProps {
  carouselId: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectableCarousel({
  carouselId,
  children,
  className = '',
}: SelectableCarouselProps) {
  const { selectedCarouselId, selectCarousel } = useLightboard();
  const isSelected = selectedCarouselId === carouselId;

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't interfere with carousel controls (buttons, dots, etc.)
    const target = e.target as HTMLElement;
    const isControl = target.closest('button, a, [role="button"]');

    if (!isControl) {
      selectCarousel(carouselId);
      console.log('[SelectableCarousel] Selected:', carouselId);
    }
  }, [carouselId, selectCarousel]);

  return (
    <div
      onClick={handleClick}
      className={`selectable-carousel ${className} ${isSelected ? 'carousel-selected' : ''}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        ...(isSelected && {
          // Blue glow effect when selected
          boxShadow: '0 0 0 4px rgba(6, 182, 212, 0.5), 0 0 32px rgba(6, 182, 212, 0.3)',
          borderRadius: '8px',
          outline: '2px solid rgb(6, 182, 212)',
          outlineOffset: '2px',
        }),
      }}
      data-carousel-id={carouselId}
      data-selected={isSelected}
    >
      {children}

      {/* Selected Badge (top-right corner) */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 z-50 px-3 py-1.5 rounded-md font-semibold text-xs"
          style={{
            backgroundColor: 'rgba(6, 182, 212, 0.9)',
            color: 'white',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          SELECTED
        </div>
      )}
    </div>
  );
}

export default SelectableCarousel;
