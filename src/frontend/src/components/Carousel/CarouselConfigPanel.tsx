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
import type { TransitionType, AutoplaySpeedPreset } from './types';
import { AUTOPLAY_SPEEDS } from './constants';
import { getTransitionMetadata } from './transitions';

interface CarouselConfigPanelProps {
  currentTransition: TransitionType;
  currentSpeed: AutoplaySpeedPreset;
  onTransitionChange: (transition: TransitionType) => void;
  onSpeedChange: (speed: AutoplaySpeedPreset) => void;
  className?: string;
}

export default function CarouselConfigPanel({
  currentTransition,
  currentSpeed,
  onTransitionChange,
  onSpeedChange,
  className = ''
}: CarouselConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all available transitions from the registry
  const transitions = getTransitionMetadata();

  // Speed presets
  const speedPresets: Array<{ value: AutoplaySpeedPreset; label: string; duration: string }> = [
    { value: 'slow', label: '1x (Slow)', duration: '8s' },
    { value: 'medium', label: '2x (Medium)', duration: '5s' },
    { value: 'fast', label: '3x (Fast)', duration: '3s' },
    { value: 'veryFast', label: '4x (Very Fast)', duration: '1.5s' }
  ];

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
            <div className="grid grid-cols-4 gap-2">
              {speedPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onSpeedChange(preset.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentSpeed === preset.value
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title={`${preset.duration} per image (${AUTOPLAY_SPEEDS[preset.value]}ms)`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{preset.label.split(' ')[0]}</span>
                    <span className="text-xs opacity-70">{preset.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

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
