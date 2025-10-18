'use client';

import { useEffect, useState, useCallback } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

/**
 * Falling Leaves Particle Effect
 *
 * Autumn leaves that tumble, drift, and respond to interaction.
 * Perfect for fall collections - creates that magical seasonal atmosphere.
 *
 * Features:
 * - Realistic leaf colors (maple, oak, birch variations)
 * - Tumbling rotation (leaves spin as they fall)
 * - Wind drift (side-to-side gentle sway)
 * - Interactive repulse (leaves blow away from cursor)
 * - Variable sizes (depth illusion)
 * - Smooth 60fps performance
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */
export default function FallingLeavesPage() {
  const [init, setInit] = useState(false);

  // Initialize particles engine once on mount
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
      console.log('[Falling Leaves] Engine initialized successfully! 🍂');
    });
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    console.log('[Falling Leaves] Particles loaded:', container);
  }, []);

  // Autumn leaves configuration - realistic physics and colors
  const options: ISourceOptions = {
    background: {
      color: {
        value: '#1a1410', // Deep autumn brown/black
      },
    },
    fpsLimit: 60,
    particles: {
      number: {
        value: 60, // Not too many - keeps it elegant
        density: {
          enable: true,
        },
      },
      color: {
        value: [
          '#ff6b35', // Vibrant orange (maple)
          '#f7931e', // Golden orange
          '#c1272d', // Deep red (oak)
          '#fbb040', // Bright yellow (birch)
          '#8b4513', // Saddle brown
          '#d2691e', // Chocolate brown
          '#cd853f', // Peru (tan/brown)
        ],
      },
      shape: {
        type: ['circle', 'triangle', 'polygon'], // Varied shapes simulate different leaf types
        options: {
          polygon: {
            sides: 5, // Pentagon-ish (more leaf-like)
          },
        },
      },
      opacity: {
        value: { min: 0.3, max: 0.9 }, // Some leaves more transparent (depth)
        animation: {
          enable: true,
          speed: 0.5, // Gentle opacity fade (atmospheric)
          sync: false,
        },
      },
      size: {
        value: { min: 3, max: 12 }, // Variable sizes (depth illusion)
        animation: {
          enable: false, // Leaves don't change size as they fall
        },
      },
      rotate: {
        value: { min: 0, max: 360 }, // Random initial rotation
        direction: 'random',
        animation: {
          enable: true,
          speed: 5, // Tumbling as they fall (realistic)
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 }, // Variable fall speeds (depth)
        direction: 'bottom', // Leaves fall down
        random: true, // Some randomness in direction
        straight: false, // NOT straight down - they drift!
        outModes: {
          default: 'out',
          bottom: 'out',
          top: 'destroy',
        },
        attract: {
          enable: false,
        },
        // Wind effect - gentle side-to-side drift
        drift: { min: -2, max: 2 }, // Horizontal sway (wind)
      },
      wobble: {
        enable: true, // Leaves wobble as they fall (very realistic!)
        distance: 10, // How much they wobble
        speed: { min: 5, max: 15 }, // Variable wobble speeds
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse', // Leaves blow away from cursor (wind gust!)
        },
        onClick: {
          enable: true,
          mode: 'push', // Click to add a gust of leaves
        },
      },
      modes: {
        repulse: {
          distance: 150, // Leaves blown away in 150px radius
          duration: 0.4,
          speed: 2, // How fast they blow away
        },
        push: {
          quantity: 8, // Add 8 leaves per click (gust!)
        },
      },
    },
    detectRetina: true,
  };

  if (!init) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-900 to-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p>Preparing autumn magic... 🍂</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-orange-950 via-red-950 to-black">
      {/* Particles layer */}
      <Particles
        id="tsparticles-leaves"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 w-full h-full"
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white p-8">
        <div className="bg-black/60 backdrop-blur-md rounded-lg p-8 max-w-3xl border border-orange-800/30">
          <h1 className="text-5xl font-bold mb-2 text-orange-400">Falling Leaves 🍂</h1>
          <p className="text-xl text-orange-200 mb-6">Autumn's gentle descent</p>

          <div className="space-y-6 text-lg">
            <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-700/30">
              <p className="text-orange-100 italic">
                "Like memories drifting through time, each leaf carries the warmth of summer
                and the promise of rest. Watch them tumble, spin, and dance in the invisible wind..."
              </p>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Interactive Features:</h2>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🍃</span>
                  <span><strong>Hover:</strong> Move your cursor - create a wind gust that blows leaves away</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🍁</span>
                  <span><strong>Click:</strong> Add a gust of 8 new leaves</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🌪️</span>
                  <span><strong>Watch:</strong> Leaves tumble, wobble, and drift as they fall</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Realistic Physics:</h2>
              <ul className="grid grid-cols-2 gap-3 text-sm">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  Tumbling rotation
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  Wind drift (side-to-side)
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  Wobble effect
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  Variable fall speeds
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  7 autumn colors
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-2">✓</span>
                  Depth variation (size/opacity)
                </li>
              </ul>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Color Palette:</h2>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#ff6b35] border border-white/30"></div>
                  <span className="text-sm">Vibrant Orange</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#f7931e] border border-white/30"></div>
                  <span className="text-sm">Golden</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#c1272d] border border-white/30"></div>
                  <span className="text-sm">Deep Red</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#fbb040] border border-white/30"></div>
                  <span className="text-sm">Bright Yellow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#8b4513] border border-white/30"></div>
                  <span className="text-sm">Saddle Brown</span>
                </div>
              </div>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Perfect For:</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Fall/Autumn art collections</li>
                <li>Nature photography galleries</li>
                <li>Seasonal portfolio sections</li>
                <li>Contemplative/meditative content</li>
                <li>Time-passage themed work</li>
              </ul>
            </div>

            <div className="border-t border-orange-800/30 pt-4 text-sm text-orange-300/70">
              <p><strong>Performance:</strong> 60 particles @ 60fps, wobble + rotation + drift physics</p>
              <p><strong>Interactions:</strong> Repulse on hover (wind gust), Push on click</p>
              <p><strong>Integration:</strong> Ready to combine with projection system</p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-orange-400/60">
            <p>Created by Prism (Performance Specialist)</p>
            <p className="mt-2 space-x-4">
              <a href="/particles-test" className="text-orange-400 hover:text-orange-300 underline">
                ← Bubbles Test
              </a>
              <span className="text-orange-600">|</span>
              <a href="/" className="text-orange-400 hover:text-orange-300 underline">
                Home
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
