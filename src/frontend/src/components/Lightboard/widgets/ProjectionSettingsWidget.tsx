/**
 * ProjectionSettingsWidget
 *
 * Standalone widget for controlling midground projection settings.
 * Extracted from Collection Lab for use in Lightboard site designer.
 *
 * Features:
 * - Projection settings sliders (fade, blur, scale X/Y)
 * - Blend mode selector
 * - Vignette controls (width, strength)
 * - Checkerboard vignette effects
 * - Sync to Config button
 * - Reset to Defaults button
 * - Shows selected carousel status
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React from 'react';
import { useLightboard } from '../LightboardContext';

export interface ProjectionSettingsProps {
  // Projection settings
  fadeDistance: number;
  maxBlur: number;
  projectionScaleX: number;
  projectionScaleY: number;
  blendMode: string;
  vignetteWidth: number;
  vignetteStrength: number;
  checkerboardEnabled: boolean;
  checkerboardTileSize: number;
  checkerboardScatterSpeed: number;
  checkerboardBlur: number;

  // Setter functions
  setFadeDistance: (value: number) => void;
  setMaxBlur: (value: number) => void;
  setProjectionScaleX: (value: number) => void;
  setProjectionScaleY: (value: number) => void;
  setBlendMode: (value: string) => void;
  setVignetteWidth: (value: number) => void;
  setVignetteStrength: (value: number) => void;
  setCheckerboardEnabled: (value: boolean) => void;
  setCheckerboardTileSize: (value: number) => void;
  setCheckerboardScatterSpeed: (value: number) => void;
  setCheckerboardBlur: (value: number) => void;

  // Optional callbacks
  onSyncToConfig?: () => void;
  onResetToDefaults?: () => void;
}

export function ProjectionSettingsWidget({
  fadeDistance,
  maxBlur,
  projectionScaleX,
  projectionScaleY,
  blendMode,
  vignetteWidth,
  vignetteStrength,
  checkerboardEnabled,
  checkerboardTileSize,
  checkerboardScatterSpeed,
  checkerboardBlur,
  setFadeDistance,
  setMaxBlur,
  setProjectionScaleX,
  setProjectionScaleY,
  setBlendMode,
  setVignetteWidth,
  setVignetteStrength,
  setCheckerboardEnabled,
  setCheckerboardTileSize,
  setCheckerboardScatterSpeed,
  setCheckerboardBlur,
  onSyncToConfig,
  onResetToDefaults,
}: ProjectionSettingsProps) {
  const { selectedCarouselId } = useLightboard();

  const handleResetToDefaults = () => {
    setFadeDistance(0.5);
    setMaxBlur(4);
    setProjectionScaleX(1.2);
    setProjectionScaleY(1.2);
    setBlendMode('normal');
    setVignetteWidth(20);
    setVignetteStrength(0.8);
    setCheckerboardEnabled(false);
    setCheckerboardTileSize(30);
    setCheckerboardScatterSpeed(0.3);
    setCheckerboardBlur(0);

    if (onResetToDefaults) {
      onResetToDefaults();
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-2xl border border-zinc-700 w-full max-w-md overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">Projection Settings</h3>
        <p className="text-zinc-400 text-sm">
          Adjust how carousels project onto the midground layer
        </p>
        {selectedCarouselId && (
          <div className="mt-3 px-3 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded text-sm">
            <span className="text-cyan-300 font-semibold">Selected: </span>
            <span className="text-cyan-200">{selectedCarouselId}</span>
          </div>
        )}
      </div>

      {/* Fade Distance */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Fade Distance: {(fadeDistance * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={fadeDistance}
          onChange={(e) => setFadeDistance(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Distance from viewport center where fade starts
        </p>
      </div>

      {/* Max Blur */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Max Blur: {maxBlur.toFixed(1)}px
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={maxBlur}
          onChange={(e) => setMaxBlur(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Blur intensity at edge of fade zone
        </p>
      </div>

      {/* Projection Scale X (Width) */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Projection Width: {projectionScaleX.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={projectionScaleX}
          onChange={(e) => setProjectionScaleX(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Horizontal scale (0.5 = narrow, 2.0 = wide)
        </p>
      </div>

      {/* Projection Scale Y (Height) */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Projection Height: {projectionScaleY.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={projectionScaleY}
          onChange={(e) => setProjectionScaleY(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Vertical scale (0.5 = short, 2.0 = tall)
        </p>
      </div>

      {/* Blend Mode */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Blend Mode: {blendMode}
        </label>
        <select
          value={blendMode}
          onChange={(e) => setBlendMode(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="normal">Normal (no blend)</option>
          <option value="multiply">Multiply (darken)</option>
          <option value="screen">Screen (lighten)</option>
          <option value="overlay">Overlay (contrast)</option>
          <option value="soft-light">Soft Light (subtle)</option>
          <option value="hard-light">Hard Light (vivid)</option>
          <option value="color-dodge">Color Dodge (bright)</option>
          <option value="color-burn">Color Burn (intense)</option>
          <option value="lighten">Lighten Only</option>
          <option value="darken">Darken Only</option>
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          How overlapping projections blend together
        </p>
      </div>

      {/* Vignette Width */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Vignette Width: {vignetteWidth}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={vignetteWidth}
          onChange={(e) => setVignetteWidth(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Edge fade width (0 = no vignette, 50 = full fade)
        </p>
      </div>

      {/* Vignette Strength */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Vignette Strength: {(vignetteStrength * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={vignetteStrength}
          onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Fade intensity (0 = transparent, 100 = opaque center)
        </p>
      </div>

      {/* Checkerboard Vignette Section */}
      <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/40">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-zinc-200 text-sm font-semibold">
            Checkerboard Vignette
          </label>
          <button
            onClick={() => setCheckerboardEnabled(!checkerboardEnabled)}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              checkerboardEnabled
                ? 'bg-purple-500 text-white'
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {checkerboardEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {checkerboardEnabled && (
          <div className="space-y-4">
            {/* Tile Size */}
            <div>
              <label className="block text-zinc-300 text-xs mb-2 font-medium">
                Tile Size: {checkerboardTileSize}px
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={checkerboardTileSize}
                onChange={(e) => setCheckerboardTileSize(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Size of checker squares (10 = fine, 100 = chunky)
              </p>
            </div>

            {/* Scatter Speed */}
            <div>
              <label className="block text-zinc-300 text-xs mb-2 font-medium">
                Scatter Speed: {(checkerboardScatterSpeed * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={checkerboardScatterSpeed}
                onChange={(e) => setCheckerboardScatterSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Animation speed (0 = static, 100 = fast scatter)
              </p>
            </div>

            {/* Checker Blur */}
            <div>
              <label className="block text-zinc-300 text-xs mb-2 font-medium">
                Edge Blur: {checkerboardBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={checkerboardBlur}
                onChange={(e) => setCheckerboardBlur(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Softness of checker edges (0 = crisp, 10 = dreamy)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-zinc-800/50 rounded text-xs text-zinc-400">
        <strong className="text-zinc-300">Tip:</strong> Adjust settings live, then click "Sync to Config" to save them. Each carousel projects its first image onto the midground layer.
      </div>
    </div>
  );
}
