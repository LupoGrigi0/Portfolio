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
  className = ''
}: CarouselConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customInput, setCustomInput] = useState(customSpeedMs.toString());

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
    <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden ${className}`}>
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
        <div className="p-4 space-y-4 border-t border-white/10">
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
