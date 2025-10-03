/**
 * Carousel Configuration Panel
 *
 * Interactive control panel for testing and configuring carousel settings.
 * Allows live adjustment of transition types, speeds, and other options.
 *
 * In production, these settings will come from config.json files.
 * This panel is for development/testing only.
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

'use client';

import { useState } from 'react';
import type { TransitionType, AutoplaySpeedPreset, FullscreenMode } from './types';
import { AUTOPLAY_SPEEDS } from './constants';
import { getTransitionMetadata } from './transitions';

interface CarouselConfigPanelProps {
  currentTransition: TransitionType;
  currentSpeed: AutoplaySpeedPreset;
  customSpeedMs?: number;
  fullscreenMode?: FullscreenMode;
  onTransitionChange: (transition: TransitionType) => void;
  onSpeedChange: (speed: AutoplaySpeedPreset) => void;
  onCustomSpeedChange?: (ms: number) => void;
  onFullscreenModeChange?: (mode: FullscreenMode) => void;
  className?: string;

  // Auto-hide controls
  autoHideControls?: boolean;
  fadeStartDelay?: number;
  fadeCompleteDelay?: number;
  onAutoHideChange?: (enabled: boolean) => void;
  onFadeStartDelayChange?: (ms: number) => void;
  onFadeCompleteDelayChange?: (ms: number) => void;

  // Social Reactions
  showReactions?: boolean;
  onShowReactionsChange?: (enabled: boolean) => void;

  // Auto-hide reactions (separate from main controls)
  autoHideReactions?: boolean;
  reactionFadeStartDelay?: number;
  reactionFadeCompleteDelay?: number;
  onAutoHideReactionsChange?: (enabled: boolean) => void;
  onReactionFadeStartDelayChange?: (ms: number) => void;
  onReactionFadeCompleteDelayChange?: (ms: number) => void;

  // Styling
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderOpacity?: number;
  containerBorderRadius?: number;
  containerBackgroundColor?: string;
  containerBackgroundOpacity?: number;
  containerPadding?: number;
  onContainerBorderWidthChange?: (width: number) => void;
  onContainerBorderColorChange?: (color: string) => void;
  onContainerBorderOpacityChange?: (opacity: number) => void;
  onContainerBorderRadiusChange?: (radius: number) => void;
  onContainerBackgroundColorChange?: (color: string) => void;
  onContainerBackgroundOpacityChange?: (opacity: number) => void;
  onContainerPaddingChange?: (padding: number) => void;

  // Reserved UI space
  reserveTop?: number;
  reserveBottom?: number;
  reserveLeft?: number;
  reserveRight?: number;
  reserveBackgroundColor?: string;
  reserveBackgroundOpacity?: number;
  onReserveTopChange?: (pixels: number) => void;
  onReserveBottomChange?: (pixels: number) => void;
  onReserveLeftChange?: (pixels: number) => void;
  onReserveRightChange?: (pixels: number) => void;
  onReserveBackgroundColorChange?: (color: string) => void;
  onReserveBackgroundOpacityChange?: (opacity: number) => void;
}

export default function CarouselConfigPanel({
  currentTransition,
  currentSpeed,
  customSpeedMs = 2000,
  fullscreenMode = 'browser',
  onTransitionChange,
  onSpeedChange,
  onCustomSpeedChange,
  onFullscreenModeChange,
  className = '',
  autoHideControls = true,
  fadeStartDelay = 2000,
  fadeCompleteDelay = 4000,
  onAutoHideChange,
  onFadeStartDelayChange,
  onFadeCompleteDelayChange,
  showReactions = false,
  onShowReactionsChange,
  autoHideReactions = true,
  reactionFadeStartDelay = 3000,
  reactionFadeCompleteDelay = 5000,
  onAutoHideReactionsChange,
  onReactionFadeStartDelayChange,
  onReactionFadeCompleteDelayChange,
  // Styling
  containerBorderWidth = 0,
  containerBorderColor = '#ffffff',
  containerBorderOpacity = 1,
  containerBorderRadius = 0,
  containerBackgroundColor = '#000000',
  containerBackgroundOpacity = 0,
  containerPadding = 16,
  onContainerBorderWidthChange,
  onContainerBorderColorChange,
  onContainerBorderOpacityChange,
  onContainerBorderRadiusChange,
  onContainerBackgroundColorChange,
  onContainerBackgroundOpacityChange,
  onContainerPaddingChange,
  // Reserved UI space
  reserveTop = 0,
  reserveBottom = 0,
  reserveLeft = 0,
  reserveRight = 0,
  reserveBackgroundColor = '#000000',
  reserveBackgroundOpacity = 0,
  onReserveTopChange,
  onReserveBottomChange,
  onReserveLeftChange,
  onReserveRightChange,
  onReserveBackgroundColorChange,
  onReserveBackgroundOpacityChange
}: CarouselConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customInput, setCustomInput] = useState(customSpeedMs.toString());
  const [fadeStartInput, setFadeStartInput] = useState(fadeStartDelay.toString());
  const [fadeCompleteInput, setFadeCompleteInput] = useState(fadeCompleteDelay.toString());
  const [reactionFadeStartInput, setReactionFadeStartInput] = useState(reactionFadeStartDelay.toString());
  const [reactionFadeCompleteInput, setReactionFadeCompleteInput] = useState(reactionFadeCompleteDelay.toString());

  // Get all available transitions from the registry
  const transitions = getTransitionMetadata();

  // Speed presets
  const speedPresets: Array<{ value: AutoplaySpeedPreset; label: string; duration: string }> = [
    { value: 'slow', label: '1x', duration: '8s' },
    { value: 'medium', label: '2x', duration: '5s' },
    { value: 'fast', label: '3x', duration: '3s' },
    { value: 'veryFast', label: '4x', duration: '1.5s' },
    { value: 'ultraFast', label: '5x', duration: '0.8s' },
    { value: 'blazing', label: '6x', duration: '0.4s' }
  ];

  const handleCustomSpeedSubmit = () => {
    const ms = parseInt(customInput);
    if (!isNaN(ms) && ms >= 100 && ms <= 30000) {
      onCustomSpeedChange?.(ms);
      onSpeedChange('custom');
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 w-80 max-h-[calc(100vh-2rem)]
      bg-black/60 backdrop-blur-lg border border-white/20 rounded-lg
      overflow-hidden shadow-2xl z-50
      ${className}
    `}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <span className="font-semibold">Carousel Configuration</span>
          <span className="text-xs text-white/40">(Testing Panel)</span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Config Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-white/10 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Transition Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Transition Type</label>
            <div className="grid grid-cols-3 gap-2">
              {transitions.map((transition) => (
                <button
                  key={transition.type}
                  onClick={() => onTransitionChange(transition.type as TransitionType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTransition === transition.type
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title={transition.description}
                >
                  {transition.name}
                </button>
              ))}
            </div>
            {transitions.find(t => t.type === currentTransition)?.description && (
              <p className="text-xs text-white/50 italic">
                {transitions.find(t => t.type === currentTransition)?.description}
              </p>
            )}
          </div>

          {/* Autoplay Speed Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Autoplay Speed</label>

            {/* Preset Buttons */}
            <div className="grid grid-cols-6 gap-2">
              {speedPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onSpeedChange(preset.value)}
                  className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentSpeed === preset.value
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title={`${preset.duration} per image (${AUTOPLAY_SPEEDS[preset.value]}ms)`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs">{preset.label}</span>
                    <span className="text-[10px] opacity-70">{preset.duration}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Speed Input */}
            {onCustomSpeedChange && (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSpeedSubmit()}
                  placeholder="Custom ms"
                  min="100"
                  max="30000"
                  className={`flex-1 px-3 py-2 bg-white/10 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
                    currentSpeed === 'custom'
                      ? 'border-green-500 ring-2 ring-green-500/30'
                      : 'border-white/20 focus:ring-blue-500/30'
                  }`}
                />
                <button
                  onClick={handleCustomSpeedSubmit}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Set
                </button>
                <span className="text-xs text-white/50">
                  {currentSpeed === 'custom' && `(${customSpeedMs}ms)`}
                </span>
              </div>
            )}
          </div>

          {/* Fullscreen Mode Selector */}
          {onFullscreenModeChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Fullscreen Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onFullscreenModeChange('browser')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    fullscreenMode === 'browser'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title="Browser fullscreen (fixed inset-0, nav bar visible)"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">Browser</span>
                    <span className="text-[10px] opacity-70">Fixed inset</span>
                  </div>
                </button>
                <button
                  onClick={() => onFullscreenModeChange('native')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    fullscreenMode === 'native'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title="Native fullscreen (true browser fullscreen API)"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">Native</span>
                    <span className="text-[10px] opacity-70">True fullscreen</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-white/50 italic">
                {fullscreenMode === 'browser'
                  ? 'Browser mode fills window (nav bar visible)'
                  : 'Native mode uses Fullscreen API (entire screen)'}
              </p>
            </div>
          )}

          {/* Social Reactions */}
          {onShowReactionsChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                Enable Social Reactions
                <span className="text-xs text-white/40">(NEW)</span>
              </label>

              {/* Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onShowReactionsChange(!showReactions)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showReactions ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showReactions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/70">
                  {showReactions ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-white/50 italic">
                Interactive emoji reactions on carousel images (UI-only stub)
              </p>

              {/* Auto-Hide Reactions (nested under Social Reactions) */}
              {showReactions && onAutoHideReactionsChange && (
                <div className="space-y-2 pl-4 border-l-2 border-purple-500/30 mt-3">
                  <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                    Auto-Hide Reactions
                    <span className="text-xs text-white/40">(Separate timing)</span>
                  </label>

                  {/* Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAutoHideReactionsChange(!autoHideReactions)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoHideReactions ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoHideReactions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-white/70">
                      {autoHideReactions ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Timing Controls */}
                  {autoHideReactions && onReactionFadeStartDelayChange && onReactionFadeCompleteDelayChange && (
                    <div className="space-y-2 pl-4 border-l-2 border-white/10">
                      {/* Fade Start Delay */}
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-white/60 w-32">Fade to 50%:</label>
                        <input
                          type="number"
                          value={reactionFadeStartInput}
                          onChange={(e) => setReactionFadeStartInput(e.target.value)}
                          onBlur={() => {
                            const ms = parseInt(reactionFadeStartInput);
                            if (!isNaN(ms) && ms >= 0 && ms <= 10000) {
                              onReactionFadeStartDelayChange(ms);
                            } else {
                              setReactionFadeStartInput(reactionFadeStartDelay.toString());
                            }
                          }}
                          placeholder="ms"
                          min="0"
                          max="10000"
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <span className="text-xs text-white/50">ms</span>
                      </div>

                      {/* Fade Complete Delay */}
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-white/60 w-32">Hide completely:</label>
                        <input
                          type="number"
                          value={reactionFadeCompleteInput}
                          onChange={(e) => setReactionFadeCompleteInput(e.target.value)}
                          onBlur={() => {
                            const ms = parseInt(reactionFadeCompleteInput);
                            if (!isNaN(ms) && ms >= 0 && ms <= 10000) {
                              onReactionFadeCompleteDelayChange(ms);
                            } else {
                              setReactionFadeCompleteInput(reactionFadeCompleteDelay.toString());
                            }
                          }}
                          placeholder="ms"
                          min="0"
                          max="10000"
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <span className="text-xs text-white/50">ms</span>
                      </div>

                      <p className="text-xs text-white/40 italic">
                        Reactions fade independently from main controls
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Auto-Hide Controls */}
          {onAutoHideChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                Auto-Hide Controls
                <span className="text-xs text-white/40">(NEW)</span>
              </label>

              {/* Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAutoHideChange(!autoHideControls)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoHideControls ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoHideControls ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/70">
                  {autoHideControls ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Timing Controls */}
              {autoHideControls && onFadeStartDelayChange && onFadeCompleteDelayChange && (
                <div className="space-y-2 pl-4 border-l-2 border-white/10">
                  {/* Fade Start Delay */}
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-white/60 w-32">Fade to 50%:</label>
                    <input
                      type="number"
                      value={fadeStartInput}
                      onChange={(e) => setFadeStartInput(e.target.value)}
                      onBlur={() => {
                        const ms = parseInt(fadeStartInput);
                        if (!isNaN(ms) && ms >= 0 && ms <= 10000) {
                          onFadeStartDelayChange(ms);
                        } else {
                          setFadeStartInput(fadeStartDelay.toString());
                        }
                      }}
                      placeholder="ms"
                      min="0"
                      max="10000"
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    />
                    <span className="text-xs text-white/50">ms</span>
                  </div>

                  {/* Fade Complete Delay */}
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-white/60 w-32">Hide completely:</label>
                    <input
                      type="number"
                      value={fadeCompleteInput}
                      onChange={(e) => setFadeCompleteInput(e.target.value)}
                      onBlur={() => {
                        const ms = parseInt(fadeCompleteInput);
                        if (!isNaN(ms) && ms >= 0 && ms <= 10000) {
                          onFadeCompleteDelayChange(ms);
                        } else {
                          setFadeCompleteInput(fadeCompleteDelay.toString());
                        }
                      }}
                      placeholder="ms"
                      min="0"
                      max="10000"
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    />
                    <span className="text-xs text-white/50">ms</span>
                  </div>

                  <p className="text-xs text-white/40 italic">
                    Controls fade progressively: full → 50% → 0% + slide off
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Styling Section */}
          {(onContainerBorderWidthChange || onContainerPaddingChange) && (
            <div className="space-y-3 bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-pink-300 mb-3">🎨 Container Styling</h3>

              {/* Border Width */}
              {onContainerBorderWidthChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Border Width ({containerBorderWidth}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={containerBorderWidth}
                    onChange={(e) => onContainerBorderWidthChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Border Color & Opacity */}
              {containerBorderWidth > 0 && onContainerBorderColorChange && onContainerBorderOpacityChange && (
                <div className="space-y-2 pl-4 border-l-2 border-pink-500/30">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-white/70 w-24">Border Color:</label>
                    <input
                      type="color"
                      value={containerBorderColor}
                      onChange={(e) => onContainerBorderColorChange(e.target.value)}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-white/50">{containerBorderColor}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">Border Opacity ({(containerBorderOpacity * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={containerBorderOpacity}
                      onChange={(e) => onContainerBorderOpacityChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Border Radius */}
              {onContainerBorderRadiusChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Border Radius ({containerBorderRadius}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={containerBorderRadius}
                    onChange={(e) => onContainerBorderRadiusChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-white/40 italic">0 = square corners, 50 = rounded</p>
                </div>
              )}

              {/* Container Background */}
              {onContainerBackgroundColorChange && onContainerBackgroundOpacityChange && (
                <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-white/70 w-24">Background:</label>
                    <input
                      type="color"
                      value={containerBackgroundColor}
                      onChange={(e) => onContainerBackgroundColorChange(e.target.value)}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-white/50">{containerBackgroundColor}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">Background Opacity ({(containerBackgroundOpacity * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={containerBackgroundOpacity}
                      onChange={(e) => onContainerBackgroundOpacityChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-white/40 italic">0 = transparent (image shows through to parallax bg)</p>
                </div>
              )}

              {/* Padding */}
              {onContainerPaddingChange && (
                <div className="space-y-1 mt-3 pt-3 border-t border-white/10">
                  <label className="text-xs text-white/70">Padding ({containerPadding}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="4"
                    value={containerPadding}
                    onChange={(e) => onContainerPaddingChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-white/40 italic">Space between image and container edge</p>
                </div>
              )}
            </div>
          )}

          {/* Reserved UI Space Section */}
          {(onReserveTopChange || onReserveBottomChange) && (
            <div className="space-y-3 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-300 mb-3">📐 Reserved UI Space</h3>
              <p className="text-xs text-white/60 mb-3">
                Create safe zones for controls that won't overlap the image
              </p>

              {/* Top Reserve */}
              {onReserveTopChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Top Reserve ({reserveTop}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={reserveTop}
                    onChange={(e) => onReserveTopChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Bottom Reserve */}
              {onReserveBottomChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Bottom Reserve ({reserveBottom}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={reserveBottom}
                    onChange={(e) => onReserveBottomChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Left Reserve */}
              {onReserveLeftChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Left Reserve ({reserveLeft}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={reserveLeft}
                    onChange={(e) => onReserveLeftChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Right Reserve */}
              {onReserveRightChange && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Right Reserve ({reserveRight}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={reserveRight}
                    onChange={(e) => onReserveRightChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Reserve Background */}
              {onReserveBackgroundColorChange && onReserveBackgroundOpacityChange && (
                <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-white/70 w-24">Reserve BG:</label>
                    <input
                      type="color"
                      value={reserveBackgroundColor}
                      onChange={(e) => onReserveBackgroundColorChange(e.target.value)}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-white/50">{reserveBackgroundColor}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">Reserve Opacity ({(reserveBackgroundOpacity * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={reserveBackgroundOpacity}
                      onChange={(e) => onReserveBackgroundOpacityChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-white/40 italic">Background color for reserved control zones</p>
                </div>
              )}
            </div>
          )}

          {/* Info Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-200/80">
              <strong>💡 Production Note:</strong> In production, these settings will come from{' '}
              <code className="bg-black/30 px-1 py-0.5 rounded">config.json</code> files in each
              collection directory. This panel is for testing and preview only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
