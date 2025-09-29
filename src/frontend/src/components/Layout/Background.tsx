/**
 * Background Dynamic Manager
 *
 * Manages full-screen background images with smooth crossfade transitions.
 * First image of focused carousel becomes the page background.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-29
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BackgroundProps {
  currentImage?: string;
  transitionDuration?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export default function Background({
  currentImage,
  transitionDuration = 800,
  overlay = true,
  overlayOpacity = 0.4,
  className = ''
}: BackgroundProps) {
  const [displayImages, setDisplayImages] = useState<{
    current: string | null;
    previous: string | null;
  }>({
    current: currentImage || null,
    previous: null
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle background image changes with crossfade
  useEffect(() => {
    if (currentImage && currentImage !== displayImages.current) {
      setIsTransitioning(true);
      setDisplayImages(prev => ({
        current: currentImage,
        previous: prev.current
      }));

      // Reset transition state after duration
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setDisplayImages(prev => ({
          current: prev.current,
          previous: null
        }));
      }, transitionDuration);

      return () => clearTimeout(timer);
    }
  }, [currentImage, displayImages.current, transitionDuration]);

  return (
    <div
      className={`fixed inset-0 -z-10 ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* Previous Background (fading out) */}
      {displayImages.previous && isTransitioning && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            transitionDuration: `${transitionDuration}ms`,
            opacity: 0
          }}
        >
          <Image
            src={displayImages.previous}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={85}
          />
        </div>
      )}

      {/* Current Background (fading in) */}
      {displayImages.current && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            transitionDuration: `${transitionDuration}ms`,
            opacity: isTransitioning ? 1 : 1
          }}
        >
          <Image
            src={displayImages.current}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={85}
          />
        </div>
      )}

      {/* Fallback solid background */}
      {!displayImages.current && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
      )}

      {/* Overlay for better content readability */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
}

/**
 * BackgroundProvider Component
 *
 * Context provider for managing background state across the application.
 * Allows any component to update the background image.
 */

import { createContext, useContext, ReactNode } from 'react';

interface BackgroundContextType {
  currentBackground: string | null;
  setBackground: (image: string | null) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [currentBackground, setCurrentBackground] = useState<string | null>(null);

  const setBackground = (image: string | null) => {
    setCurrentBackground(image);
  };

  return (
    <BackgroundContext.Provider value={{ currentBackground, setBackground }}>
      <Background currentImage={currentBackground || undefined} />
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}