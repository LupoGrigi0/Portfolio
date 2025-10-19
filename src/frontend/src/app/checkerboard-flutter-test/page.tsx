'use client';

import CheckerboardFlutter from '@/components/Layout/CheckerboardFlutter';

/**
 * Checkerboard Flutter Test Page
 *
 * Test the subtle "oh!" moment effect where checkerboard squares
 * detach from projections and flutter away when scrolling stops.
 *
 * Instructions:
 * 1. Scroll down the page
 * 2. Stop scrolling
 * 3. Wait ~300ms
 * 4. Watch for 1-2 checker squares to appear and flutter down
 * 5. They fade out after 2 seconds
 *
 * @author Prism (Performance Specialist)
 * @created 2025-10-18
 */
export default function CheckerboardFlutterTestPage() {
  return (
    <div className="relative w-full min-h-[300vh] bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      {/* Checkerboard Flutter Effect */}
      <CheckerboardFlutter
        enabled={true}
        tileSize={30}        // 30px squares (matches default projection checkerboard)
        intensity={0.5}      // Spawn 1-2 checkers (subtle!)
        triggerDelay={300}   // 300ms after scroll stops
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 py-16">
        <div className="bg-black/60 backdrop-blur-md rounded-lg p-8 max-w-3xl mx-auto border border-gray-700/50 mb-8">
          <h1 className="text-5xl font-bold mb-2 text-white flex items-center gap-3">
            Checkerboard Flutter Test <span className="text-4xl">🎨</span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">The subtle "oh!" moment effect</p>

          <div className="space-y-6 text-lg">
            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700/30">
              <p className="text-purple-100 text-2xl font-bold mb-4">
                📜 How to Test:
              </p>
              <ol className="text-purple-200 space-y-2 list-decimal list-inside">
                <li><strong>Scroll down</strong> through the page</li>
                <li><strong>Stop scrolling</strong> (come to a complete stop)</li>
                <li><strong>Wait ~300ms</strong> (brief pause)</li>
                <li><strong>Watch carefully</strong> - 1-2 checker squares will appear</li>
                <li>Checkers <strong>tumble and flutter</strong> down</li>
                <li>They <strong>fade out</strong> after 2 seconds</li>
              </ol>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-gray-200">What Makes It Special:</h2>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">✨</span>
                  <span><strong>Subtle:</strong> Only 1-2 checkers at a time (not overwhelming)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">👁️</span>
                  <span><strong>Noticeable:</strong> Human visual perception catches peripheral movement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">🎯</span>
                  <span><strong>Triggered on scroll stop:</strong> Moment of stillness = perfect timing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">💫</span>
                  <span><strong>The "oh!" moment:</strong> Unexpected delight</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">🧹</span>
                  <span><strong>Clean:</strong> Auto-cleanup after 2 seconds (no memory leaks)</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-gray-200">Technical Details:</h2>
              <div className="space-y-2 text-sm font-mono bg-black/40 p-4 rounded">
                <p><span className="text-purple-400">Trigger:</span> 300ms after scroll velocity drops to 0</p>
                <p><span className="text-purple-400">Spawn:</span> 1-2 checker squares (30px × 30px)</p>
                <p><span className="text-purple-400">Position:</span> Random edges (top, left, right)</p>
                <p><span className="text-purple-400">Physics:</span> Tumble (3°/s rotation) + wobble (5px)</p>
                <p><span className="text-purple-400">Fall speed:</span> 1-2 pixels/frame (gentle)</p>
                <p><span className="text-purple-400">Lifespan:</span> 2 seconds (fade out)</p>
                <p><span className="text-purple-400">Cooldown:</span> 2 seconds (prevent spam)</p>
                <p><span className="text-purple-400">Colors:</span> Grayscale (#fff, #ccc, #999)</p>
              </div>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-gray-200">Why It Works:</h2>
              <div className="space-y-2 text-gray-300">
                <p>
                  <strong className="text-purple-300">Human Visual Perception:</strong> Our peripheral vision
                  is highly sensitive to movement. Even subtle motion (1-2 small squares) will be
                  noticed, especially during the moment of stillness when scrolling stops.
                </p>
                <p>
                  <strong className="text-purple-300">Timing is Everything:</strong> The 300ms delay means
                  the flutter happens AFTER the user has come to rest. It's unexpected, which makes
                  it delightful. If it happened during scroll, it would be lost in the motion.
                </p>
                <p>
                  <strong className="text-purple-300">Less is More:</strong> 1-2 checkers is subtle enough
                  to not be distracting, but noticeable enough to catch the eye. It's a whisper, not
                  a shout.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <h2 className="text-2xl font-semibold mb-3 text-gray-200">Configuration Options:</h2>
              <div className="space-y-2 text-sm">
                <p><code className="bg-black/60 px-2 py-1 rounded">enabled</code> - Turn on/off (default: true)</p>
                <p><code className="bg-black/60 px-2 py-1 rounded">tileSize</code> - Checker size in pixels (default: 30)</p>
                <p><code className="bg-black/60 px-2 py-1 rounded">intensity</code> - 0-1, controls count (0.5 = 1-2, 1.0 = 2-4)</p>
                <p><code className="bg-black/60 px-2 py-1 rounded">triggerDelay</code> - Milliseconds after scroll stops (default: 300)</p>
              </div>
            </div>

            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mt-6">
              <p className="text-green-200 text-sm font-bold mb-2">✅ Integration with Projection System</p>
              <p className="text-green-300 text-sm">
                This effect is designed to work alongside the existing projection system. When you
                enable checkerboard vignettes on projections, these flutter particles will appear
                to be breaking off from the projection edges. The visual integration is seamless!
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content sections */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-8 border border-gray-700/30"
            >
              <h3 className="text-3xl font-bold text-purple-300 mb-4">
                Scroll Section {i}
              </h3>
              <p className="text-gray-300 text-lg mb-4">
                Keep scrolling down... then <strong>stop</strong> and watch for the flutter!
              </p>
              <div className="bg-gray-800/50 p-4 rounded text-sm text-gray-400">
                <p className="mb-2">
                  The checkerboard flutter is triggered when you stop scrolling. Watch the edges
                  of your viewport carefully - you'll see 1-2 small checker squares appear and
                  gently tumble down.
                </p>
                <p>
                  The effect is subtle on purpose. It's not meant to be flashy or distracting.
                  It's a whisper of movement that catches your eye and makes you think "wait...
                  did I just see that?" That's the "oh!" moment we're going for.
                </p>
              </div>

              {/* Decorative checkerboard pattern (static) */}
              <div className="mt-6 flex gap-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div
                    key={j}
                    className="w-8 h-8 bg-gray-600/30 border border-gray-500/50"
                    style={{
                      opacity: [0.3, 0.5, 0.4, 0.6, 0.35, 0.55, 0.45, 0.65][j],
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 bg-black/60 rounded-lg p-6 max-w-3xl mx-auto">
          <p className="text-lg text-purple-400 font-bold mb-2">
            🎨 "Something beyond a chef's kiss"
          </p>
          <p className="text-gray-400 mb-4">
            The subtle flutter effect that will be seen and noticed, but never feels forced.
            One or two little checkers fluttering to the bottom. That's all it takes.
          </p>
          <p className="text-gray-500">Created by Prism (Performance Specialist)</p>
          <p className="mt-2 space-x-4">
            <a href="/particles-leaves-emoji" className="text-purple-400 hover:text-purple-300 underline">
              ← Emoji Leaves
            </a>
            <span className="text-gray-600">|</span>
            <a href="/particles-test" className="text-purple-400 hover:text-purple-300 underline">
              Bubbles
            </a>
            <span className="text-gray-600">|</span>
            <a href="/" className="text-purple-400 hover:text-purple-300 underline">
              Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
