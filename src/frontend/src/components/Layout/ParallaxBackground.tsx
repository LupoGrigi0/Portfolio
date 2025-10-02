/**
 * Multi-Layer Parallax Background System
 *
 * Implements cinematic 3-tier parallax scrolling with:
 * - Background layer (slow, distant)
 * - Midground layer (medium depth)
 * - Foreground layer (fast, close)
 *
 * Uses GPU-accelerated transforms for 60fps performance.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-10-02
 */

'use client';

import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import Image from 'next/image';

export interface ParallaxLayer {
  id: string;
  type: 'background' | 'midground' | 'foreground';
  imageUrl: string;
  speed: number; // 0.0 - 2.0 (scroll speed multiplier)
  opacity: number; // 0.0 - 1.0
  zIndex: number;
  blur?: number; // Optional blur in px for depth of field
}

interface ParallaxBackgroundProps {
  layers: ParallaxLayer[];
  transitionDuration?: number;
  overlayOpacity?: number;
  className?: string;
}

export default function ParallaxBackground({
  layers = [],
  transitionDuration = 800,
  overlayOpacity = 0.4,
  className = ''
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number>();

  // Smooth scroll tracking with requestAnimationFrame
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Sort layers by zIndex
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* Render each parallax layer */}
      {sortedLayers.map((layer) => {
        const translateY = scrollY * layer.speed;

        return (
          <div
            key={layer.id}
            className="absolute inset-0 transition-opacity"
            style={{
              transform: `translateY(${translateY}px)`,
              opacity: layer.opacity,
              zIndex: layer.zIndex,
              transitionDuration: `${transitionDuration}ms`,
              willChange: 'transform',
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
            }}
          >
            <Image
              src={layer.imageUrl}
              alt=""
              fill
              priority={layer.type === 'background'}
              className="object-cover"
              sizes="100vw"
              quality={90}
            />
          </div>
        );
      })}

      {/* Fallback solid background */}
      {layers.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
      )}

      {/* Overlay for content readability */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: overlayOpacity,
          zIndex: 999 // Above all layers
        }}
      />
    </div>
  );
}

/**
 * ParallaxBackgroundProvider Component
 *
 * Context provider for managing multi-layer parallax state.
 * Allows components to update parallax layers dynamically.
 */

interface ParallaxBackgroundContextType {
  layers: ParallaxLayer[];
  setLayers: (layers: ParallaxLayer[]) => void;
  addLayer: (layer: ParallaxLayer) => void;
  removeLayer: (id: string) => void;
  clearLayers: () => void;
}

const ParallaxBackgroundContext = createContext<ParallaxBackgroundContextType | undefined>(undefined);

export function ParallaxBackgroundProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<ParallaxLayer[]>([]);

  const addLayer = (layer: ParallaxLayer) => {
    setLayers(prev => {
      // Replace if layer with same ID exists
      const filtered = prev.filter(l => l.id !== layer.id);
      return [...filtered, layer];
    });
  };

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
  };

  const clearLayers = () => {
    setLayers([]);
  };

  return (
    <ParallaxBackgroundContext.Provider
      value={{ layers, setLayers, addLayer, removeLayer, clearLayers }}
    >
      <ParallaxBackground layers={layers} />
      {children}
    </ParallaxBackgroundContext.Provider>
  );
}

export function useParallaxBackground() {
  const context = useContext(ParallaxBackgroundContext);
  if (context === undefined) {
    throw new Error('useParallaxBackground must be used within a ParallaxBackgroundProvider');
  }
  return context;
}

/**
 * Utility: Create parallax layers from config.json
 */
export function createParallaxLayersFromConfig(
  config: {
    parallax?: {
      layers?: Array<{
        type: 'background' | 'midground' | 'foreground';
        imageUrl: string;
        speed: number;
        opacity: number;
        blur?: number;
      }>;
    };
  },
  collectionId: string
): ParallaxLayer[] {
  if (!config.parallax?.layers) {
    return [];
  }

  const zIndexMap = {
    background: 1,
    midground: 2,
    foreground: 3
  };

  return config.parallax.layers.map((layer, index) => ({
    id: `${collectionId}-${layer.type}-${index}`,
    type: layer.type,
    imageUrl: layer.imageUrl,
    speed: layer.speed,
    opacity: layer.opacity,
    zIndex: zIndexMap[layer.type],
    blur: layer.blur
  }));
}
