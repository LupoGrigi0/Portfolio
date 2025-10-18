'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions, Container } from '@tsparticles/engine';

/**
 * Falling Leaves with EMOJI! 🍂🍁
 *
 * Scroll-Responsive Wind Physics:
 * - No scroll = gentle breeze (leaves fall mostly straight)
 * - Scroll events = wind gusts!
 * - More scroll = stronger wind
 * - Longer scroll = sustained gusts
 *
 * Features:
 * - Real emoji leaf particles (🍂🍁🍃)
 * - Dynamic wind based on scroll velocity
 * - Scroll-triggered particle bursts
 * - Realistic tumbling and drift
 * - Hover repulse (manual wind gust)
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */
export default function EmojiLeavesPage() {
  const [init, setInit] = useState(false);
  const [windStrength, setWindStrength] = useState(0); // 0-1 wind intensity
  const containerRef = useRef<Container | null>(null);
  const scrollVelocityRef = useRef(0);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());

  // Initialize particles engine
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
      console.log('[Emoji Leaves] Engine initialized! 🍂');
    });
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    if (container) {
      containerRef.current = container;
      console.log('[Emoji Leaves] Particles loaded:', container);
    }
  }, []);

  // Scroll-driven wind physics! 🌪️
  useEffect(() => {
    let windDecayTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const deltaTime = now - lastScrollTime.current;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Calculate scroll velocity (pixels per millisecond)
      const velocity = scrollDelta / Math.max(deltaTime, 1);

      // Store for display
      scrollVelocityRef.current = velocity;

      // Wind strength based on scroll velocity
      // Velocity 0-5 = Wind 0-1
      const newWindStrength = Math.min(velocity / 5, 1);
      setWindStrength(newWindStrength);

      // Add particle burst on scroll!
      if (containerRef.current && newWindStrength > 0.3) {
        // Strong scroll = add leaf particles (gust effect)
        const burstCount = Math.floor(newWindStrength * 10);
        for (let i = 0; i < burstCount; i++) {
          containerRef.current.particles.addParticle({
            x: Math.random() * window.innerWidth,
            y: -20, // Spawn above viewport (blown in by wind)
          });
        }
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;

      // Clear existing decay timeout
      clearTimeout(windDecayTimeout);

      // Wind decays over 1 second after scroll stops
      windDecayTimeout = setTimeout(() => {
        setWindStrength(0);
        scrollVelocityRef.current = 0;
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(windDecayTimeout);
    };
  }, []);

  // Dynamic options based on wind strength
  const options: ISourceOptions = {
    background: {
      color: {
        value: '#1a1410', // Deep autumn brown/black
      },
    },
    fpsLimit: 60,
    particles: {
      number: {
        value: 40, // Start with fewer (scroll adds more)
        density: {
          enable: true,
        },
      },
      // IMAGE PARTICLES! Using emoji as images!
      shape: {
        type: 'image',
        options: {
          image: [
            {
              src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSI3NSIgZm9udC1zaXplPSI4MCI+8J+NgjwvdGV4dD48L3N2Zz4=', // 🍂
              width: 32,
              height: 32,
            },
            {
              src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSI3NSIgZm9udC1zaXplPSI4MCI+8J+NgTwvdGV4dD48L3N2Zz4=', // 🍁
              width: 32,
              height: 32,
            },
            {
              src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSI3NSIgZm9udC1zaXplPSI4MCI+8J+NgzwvdGV4dD48L3N2Zz4=', // 🍃
              width: 32,
              height: 32,
            },
          ],
        },
      },
      opacity: {
        value: { min: 0.4, max: 1.0 },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
      },
      size: {
        value: { min: 20, max: 40 }, // Larger for emojis
      },
      rotate: {
        value: { min: 0, max: 360 },
        direction: 'random',
        animation: {
          enable: true,
          speed: 5, // Tumbling
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 }, // Base fall speed
        direction: 'bottom',
        random: true,
        straight: false,
        outModes: {
          default: 'out',
          bottom: 'out',
        },
        // DYNAMIC DRIFT based on wind strength!
        drift: {
          min: -2 - (windStrength * 8), // More wind = more horizontal drift
          max: 2 + (windStrength * 8),
        },
      },
      wobble: {
        enable: true,
        distance: 10 + (windStrength * 20), // More wind = more wobble
        speed: { min: 5, max: 15 + (windStrength * 10) },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse', // Manual wind gust with mouse
        },
        onClick: {
          enable: true,
          mode: 'push', // Click to add leaves
        },
      },
      modes: {
        repulse: {
          distance: 150,
          duration: 0.4,
          speed: 2,
        },
        push: {
          quantity: 5,
        },
      },
    },
    detectRetina: true,
  };

  if (!init) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-900 to-black text-white">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍂</div>
          <p>Loading emoji leaves... 🍁</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[300vh] bg-gradient-to-b from-orange-950 via-red-950 to-black">
      {/* Particles layer */}
      <Particles
        id="tsparticles-emoji-leaves"
        particlesLoaded={particlesLoaded}
        options={options}
        className="fixed inset-0 w-full h-full pointer-events-none"
      />

      {/* Wind strength indicator (fixed top-right) */}
      <div className="fixed top-4 right-4 z-20 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-orange-700/50">
        <div className="text-orange-300 text-sm font-mono">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">🌪️</span>
            <span className="font-bold">Wind Meter</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Strength:</span>
              <span className="font-bold text-orange-400">
                {(windStrength * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-300"
                style={{ width: `${windStrength * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-orange-500/70 mt-2">
              {windStrength === 0 && '💨 Gentle breeze'}
              {windStrength > 0 && windStrength < 0.3 && '🍃 Light wind'}
              {windStrength >= 0.3 && windStrength < 0.7 && '🌬️ Strong gust'}
              {windStrength >= 0.7 && '🌪️ WIND STORM!'}
            </div>
          </div>
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 container mx-auto px-8 py-16">
        <div className="bg-black/60 backdrop-blur-md rounded-lg p-8 max-w-3xl mx-auto border border-orange-800/30 mb-8">
          <h1 className="text-5xl font-bold mb-2 text-orange-400 flex items-center gap-3">
            Emoji Falling Leaves <span className="text-6xl">🍂🍁🍃</span>
          </h1>
          <p className="text-xl text-orange-200 mb-6">With scroll-driven wind physics!</p>

          <div className="space-y-6 text-lg">
            <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-700/30">
              <p className="text-orange-100 text-2xl font-bold mb-4">
                🌪️ SCROLL TO CREATE WIND! 🌪️
              </p>
              <p className="text-orange-200">
                The particles respond to your scrolling! Scroll fast = strong wind gusts.
                Scroll slow = gentle breeze. Stop scrolling = calm returns.
              </p>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">How It Works:</h2>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🍃</span>
                  <span><strong>No scroll:</strong> Leaves fall gently, slight side-to-side drift</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🍂</span>
                  <span><strong>Scroll slowly:</strong> Light wind, moderate horizontal movement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🍁</span>
                  <span><strong>Scroll fast:</strong> WIND GUST! Leaves blown sideways, burst of new leaves!</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">🌪️</span>
                  <span><strong>Keep scrolling:</strong> Sustained wind, leaves swirl and tumble!</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">💨</span>
                  <span><strong>Stop scrolling:</strong> Wind decays over 1 second, calm returns</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Emoji Particles:</h2>
              <div className="flex items-center gap-4 text-5xl">
                <span>🍂</span>
                <span>🍁</span>
                <span>🍃</span>
              </div>
              <p className="mt-3 text-orange-200 text-sm">
                Real emoji rendering using SVG data URIs! Each leaf is a different emoji character,
                naturally rendered by your system fonts.
              </p>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Interactive Features:</h2>
              <ul className="space-y-2 text-sm">
                <li><strong>Hover:</strong> Create a manual wind gust with your cursor</li>
                <li><strong>Click:</strong> Add 5 new leaves</li>
                <li><strong>Scroll:</strong> Dynamic wind based on velocity!</li>
                <li><strong>Wobble:</strong> Increases with wind strength</li>
                <li><strong>Drift:</strong> Horizontal movement scales with wind</li>
              </ul>
            </div>

            <div className="border-t border-orange-800/30 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-orange-300">Wind Physics:</h2>
              <div className="space-y-2 text-sm font-mono bg-black/40 p-4 rounded">
                <p><span className="text-orange-500">scrollVelocity</span> = scrollDelta / deltaTime</p>
                <p><span className="text-orange-500">windStrength</span> = min(velocity / 5, 1)</p>
                <p><span className="text-orange-500">drift</span> = [-2 - wind*8, 2 + wind*8]</p>
                <p><span className="text-orange-500">wobble</span> = 10 + wind*20</p>
                <p><span className="text-orange-500">if (wind &gt; 0.3)</span> → burst particles!</p>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mt-6">
              <p className="text-red-200 text-sm font-bold mb-2">⚠️ The Scroll Abuse Dilemma 😈</p>
              <p className="text-red-300 text-sm italic">
                "We spent days optimizing scroll performance... and now we're ENCOURAGING scroll abuse
                to create beautiful wind effects! The irony is delicious. But it's okay - the
                projection system can handle it! Zero idle CPU maintained!"
              </p>
              <p className="text-red-400 text-xs mt-2">- Lupo's evil giggle approved ✅</p>
            </div>
          </div>
        </div>

        {/* Spacer content to enable scrolling */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-orange-800/20">
              <h3 className="text-2xl font-bold text-orange-300 mb-3">
                Scroll Section {i}
              </h3>
              <p className="text-orange-200/80">
                Keep scrolling to see the wind effects! Each scroll creates gusts that blow the leaves
                around. The faster you scroll, the stronger the wind. Watch the wind meter in the top-right!
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-orange-400/60 bg-black/60 rounded-lg p-6 max-w-3xl mx-auto">
          <p>Created by Prism (Performance Specialist)</p>
          <p className="mt-2 space-x-4">
            <a href="/particles-leaves" className="text-orange-400 hover:text-orange-300 underline">
              ← Geometric Leaves
            </a>
            <span className="text-orange-600">|</span>
            <a href="/particles-test" className="text-orange-400 hover:text-orange-300 underline">
              Bubbles
            </a>
            <span className="text-orange-600">|</span>
            <a href="/" className="text-orange-400 hover:text-orange-300 underline">
              Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
