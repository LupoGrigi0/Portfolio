'use client';

import { useEffect, useState, useCallback } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

/**
 * tsParticles Test Page
 *
 * Testing tsParticles integration with the portfolio system.
 * Starting simple with bubbles effect to verify everything works.
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */
export default function ParticlesTestPage() {
  const [init, setInit] = useState(false);

  // Initialize particles engine once on mount
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      // Load only the slim bundle for performance
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
      console.log('[tsParticles] Engine initialized successfully!');
    });
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    console.log('[tsParticles] Particles loaded:', container);
  }, []);

  // Simple bubbles configuration (like champagne bubbles rising)
  const options: ISourceOptions = {
    background: {
      color: {
        value: '#0d1117', // Dark background to see particles
      },
    },
    fpsLimit: 60,
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
        },
      },
      color: {
        value: ['#ffffff', '#ffd700', '#ff69b4', '#00bfff'], // White, gold, pink, blue
      },
      shape: {
        type: 'circle',
      },
      opacity: {
        value: { min: 0.3, max: 0.8 },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
        },
      },
      size: {
        value: { min: 3, max: 8 },
        animation: {
          enable: true,
          speed: 2,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 },
        direction: 'top', // Bubbles rise
        outModes: {
          default: 'out',
          bottom: 'out',
          top: 'destroy', // Destroy when reaching top
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'bubble', // Bubbles grow on hover
        },
        onClick: {
          enable: true,
          mode: 'push', // Add more bubbles on click
        },
      },
      modes: {
        bubble: {
          distance: 200,
          size: 15,
          duration: 2,
          opacity: 1,
        },
        push: {
          quantity: 4,
        },
      },
    },
    detectRetina: true,
  };

  if (!init) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing tsParticles engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Particles layer */}
      <Particles
        id="tsparticles-bubbles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 w-full h-full"
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white p-8">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-8 max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">tsParticles Test Page ✨</h1>

          <div className="space-y-4 text-lg">
            <p>
              <strong>Status:</strong> <span className="text-green-400">✅ Particles Running!</span>
            </p>

            <div className="border-t border-gray-600 pt-4">
              <h2 className="text-2xl font-semibold mb-2">Interaction Tests:</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Hover:</strong> Move your mouse over bubbles - they should grow</li>
                <li><strong>Click:</strong> Click anywhere to add more bubbles</li>
                <li><strong>Watch:</strong> Bubbles rise slowly and fade at the top</li>
              </ul>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h2 className="text-2xl font-semibold mb-2">Configuration:</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>50 particles initially</li>
                <li>4 colors: white, gold, pink, blue</li>
                <li>Rising direction (bubbles float up)</li>
                <li>Interactive bubble mode on hover</li>
                <li>Push mode on click (add 4 bubbles)</li>
                <li>60 FPS limit (performance)</li>
              </ul>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <h2 className="text-2xl font-semibold mb-2">Next Steps:</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Verify tsParticles works with Next.js/React</li>
                <li>🔜 Build falling leaves effect</li>
                <li>🔜 Integrate with projection system (scroll triggers)</li>
                <li>🔜 Checkerboard flutter particles</li>
                <li>🔜 Custom particle shapes (leaves, patterns)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Test page created by Prism (Performance Specialist)</p>
            <p className="mt-1">
              <a href="/" className="text-blue-400 hover:text-blue-300 underline">
                ← Back to Home
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
