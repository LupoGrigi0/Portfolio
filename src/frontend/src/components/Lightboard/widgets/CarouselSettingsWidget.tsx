/**
 * CarouselSettingsWidget
 *
 * Standalone widget for controlling carousel-specific settings.
 * Used in Lightboard site designer for configuring carousel behavior.
 *
 * Features:
 * - Transition type selector (fade, slide, zoom, flipbook, cross-dissolve)
 * - Autoplay toggle
 * - Interval/speed controls
 * - Reserved space configuration (top, bottom, left, right)
 * - Apply and Reset buttons
 * - Shows selected carousel status
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React from 'react';
import { useLightboard } from '../LightboardContext';

export interface CarouselSettingsProps {
  // Current settings
  transition: string;
  autoplay: boolean;
  interval: number;
  speed: number;
  reservedSpaceTop: number;
  reservedSpaceBottom: number;
  reservedSpaceLeft: number;
  reservedSpaceRight: number;

  // Setters
  setTransition: (value: string) => void;
  setAutoplay: (value: boolean) => void;
  setInterval: (value: number) => void;
  setSpeed: (value: number) => void;
  setReservedSpaceTop: (value: number) => void;
  setReservedSpaceBottom: (value: number) => void;
  setReservedSpaceLeft: (value: number) => void;
  setReservedSpaceRight: (value: number) => void;

  // Optional callbacks
  onApplySettings?: () => void;
  onResetToDefaults?: () => void;
}

export function CarouselSettingsWidget({
  transition,
  autoplay,
  interval,
  speed,
  reservedSpaceTop,
  reservedSpaceBottom,
  reservedSpaceLeft,
  reservedSpaceRight,
  setTransition,
  setAutoplay,
  setInterval,
  setSpeed,
  setReservedSpaceTop,
  setReservedSpaceBottom,
  setReservedSpaceLeft,
  setReservedSpaceRight,
  onApplySettings,
  onResetToDefaults,
}: CarouselSettingsProps) {
  const { selectedCarouselId } = useLightboard();

  const handleResetToDefaults = () => {
    setTransition('fade');
    setAutoplay(true);
    setInterval(5000);
    setSpeed(500);
    setReservedSpaceTop(0);
    setReservedSpaceBottom(0);
    setReservedSpaceLeft(0);
    setReservedSpaceRight(0);

    if (onResetToDefaults) {
      onResetToDefaults();
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-2xl border border-zinc-700 w-full max-w-md overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">Carousel Settings</h3>
        <p className="text-zinc-400 text-sm">
          Configure carousel behavior and reserved space
        </p>
        {selectedCarouselId ? (
          <div className="mt-3 px-3 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded text-sm">
            <span className="text-cyan-300 font-semibold">Selected: </span>
            <span className="text-cyan-200">{selectedCarouselId}</span>
          </div>
        ) : (
          <div className="mt-3 px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded text-sm">
            <span className="text-zinc-400">No carousel selected</span>
          </div>
        )}
      </div>

      {/* Transition Type */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Transition Type
        </label>
        <select
          value={transition}
          onChange={(e) => setTransition(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="fade">Fade</option>
          <option value="slide-horizontal">Slide Horizontal</option>
          <option value="zoom">Zoom</option>
          <option value="flipbook">Flipbook</option>
          <option value="cross-dissolve">Cross Dissolve</option>
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          Animation style for transitioning between images
        </p>
      </div>

      {/* Autoplay Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-zinc-300 text-sm font-medium">
              Autoplay
            </label>
            <p className="text-xs text-zinc-500 mt-1">
              Automatically cycle through images
            </p>
          </div>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              autoplay
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {autoplay ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Interval Slider */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Interval: {interval}ms
        </label>
        <input
          type="range"
          min="1000"
          max="10000"
          step="500"
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Time between automatic transitions (1s - 10s)
        </p>
      </div>

      {/* Speed/Duration Slider */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Speed: {speed}ms
        </label>
        <input
          type="range"
          min="200"
          max="2000"
          step="100"
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Duration of each transition animation (200ms - 2s)
        </p>
      </div>

      {/* Reserved Space Section */}
      <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <label className="block text-zinc-200 text-sm font-semibold mb-4">
          Reserved Space (px)
        </label>
        <p className="text-xs text-zinc-500 mb-4">
          Space reserved around carousel for UI elements
        </p>

        {/* 2x2 Grid for reserved space inputs */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 font-medium">
              Top
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={reservedSpaceTop}
              onChange={(e) => setReservedSpaceTop(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-700 text-white border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Bottom */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 font-medium">
              Bottom
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={reservedSpaceBottom}
              onChange={(e) => setReservedSpaceBottom(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-700 text-white border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Left */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 font-medium">
              Left
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={reservedSpaceLeft}
              onChange={(e) => setReservedSpaceLeft(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-700 text-white border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Right */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 font-medium">
              Right
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={reservedSpaceRight}
              onChange={(e) => setReservedSpaceRight(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-700 text-white border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {onApplySettings && (
          <button
            onClick={onApplySettings}
            disabled={!selectedCarouselId}
            className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
              selectedCarouselId
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Apply Settings
          </button>
        )}
        <button
          onClick={handleResetToDefaults}
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded font-semibold transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-zinc-800/50 rounded text-xs text-zinc-400">
        <strong className="text-zinc-300">Tip:</strong> Select a carousel to configure its settings. Reserved space prevents images from overlapping UI elements like navigation buttons.
      </div>
    </div>
  );
}
