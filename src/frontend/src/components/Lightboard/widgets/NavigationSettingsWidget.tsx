/**
 * NavigationSettingsWidget
 *
 * Comprehensive widget for managing Progressive Disclosure Navigation settings in Lightboard.
 * Controls timing, spacing, typography, colors, and visual style for the site-wide navigation.
 *
 * Features:
 * - Timing controls (rollback delay and speed)
 * - Spacing controls (indent and vertical spacing)
 * - Typography settings (font family and size)
 * - Color pickers (text, background, drawer, border)
 * - Visual style options (home icon, highlight style)
 * - Grouped sections with clear labels
 * - Save and Reset functionality
 * - Matches Lightboard's zinc dark theme with cyan accents
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-14
 */

'use client';

import React from 'react';
import { CollapsibleSection } from '../CollapsibleSection';

export interface NavigationSettingsWidgetProps {
  // Timing
  rollbackDelay: number;
  rollbackSpeed: number;
  onRollbackDelayChange: (value: number) => void;
  onRollbackSpeedChange: (value: number) => void;

  // Spacing
  indentSpacing: number;
  verticalSpacing: number;
  onIndentSpacingChange: (value: number) => void;
  onVerticalSpacingChange: (value: number) => void;

  // Typography
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;

  // Colors
  activeTextColor: string;
  hoverTextColor: string;
  activeBackgroundColor: string;
  hoverBackgroundColor: string;
  drawerBackgroundColor: string;
  borderColor: string;
  onActiveTextColorChange: (value: string) => void;
  onHoverTextColorChange: (value: string) => void;
  onActiveBackgroundColorChange: (value: string) => void;
  onHoverBackgroundColorChange: (value: string) => void;
  onDrawerBackgroundColorChange: (value: string) => void;
  onBorderColorChange: (value: string) => void;

  // Visual
  showHomeIcon: boolean;
  highlightStyle: string;
  onShowHomeIconChange: (value: boolean) => void;
  onHighlightStyleChange: (value: string) => void;

  // Actions
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
}

export function NavigationSettingsWidget({
  // Timing
  rollbackDelay,
  rollbackSpeed,
  onRollbackDelayChange,
  onRollbackSpeedChange,

  // Spacing
  indentSpacing,
  verticalSpacing,
  onIndentSpacingChange,
  onVerticalSpacingChange,

  // Typography
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,

  // Colors
  activeTextColor,
  hoverTextColor,
  activeBackgroundColor,
  hoverBackgroundColor,
  drawerBackgroundColor,
  borderColor,
  onActiveTextColorChange,
  onHoverTextColorChange,
  onActiveBackgroundColorChange,
  onHoverBackgroundColorChange,
  onDrawerBackgroundColorChange,
  onBorderColorChange,

  // Visual
  showHomeIcon,
  highlightStyle,
  onShowHomeIconChange,
  onHighlightStyleChange,

  // Actions
  onSave,
  onReset,
  isSaving = false,
}: NavigationSettingsWidgetProps) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-2xl border border-zinc-700 w-full max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">Navigation Settings</h3>
        <p className="text-zinc-400 text-sm">
          Configure Progressive Disclosure Navigation appearance and behavior
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/40 rounded">
        <p className="text-blue-200 text-sm">
          <strong className="font-semibold">Note:</strong> These settings control the site-wide navigation drawer, timing, spacing, and visual style.
        </p>
      </div>

      {/* TIMING SECTION */}
      <CollapsibleSection title="Timing & Animation" defaultOpen={true} storageKey="nav-timing">
        {/* Rollback Delay */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Rollback Delay: <span className="text-white font-mono">{rollbackDelay}ms</span>
          </label>
          <input
            type="range"
            min="0"
            max="2000"
            step="50"
            value={rollbackDelay}
            onChange={(e) => onRollbackDelayChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            disabled={isSaving}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Time before drawer closes after clicking Home (0-2000ms)
          </p>
        </div>

        {/* Rollback Speed */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Rollback Speed: <span className="text-white font-mono">{rollbackSpeed}ms</span>
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={rollbackSpeed}
            onChange={(e) => onRollbackSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            disabled={isSaving}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Animation duration for drawer transitions (100-1000ms)
          </p>
        </div>
      </CollapsibleSection>

      {/* SPACING SECTION */}
      <CollapsibleSection title="Spacing & Layout" defaultOpen={true} storageKey="nav-spacing">
        {/* Indent Spacing */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Indent Spacing: <span className="text-white font-mono">{indentSpacing}px</span>
          </label>
          <input
            type="range"
            min="8"
            max="32"
            step="2"
            value={indentSpacing}
            onChange={(e) => onIndentSpacingChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            disabled={isSaving}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Horizontal indent per hierarchy level (8-32px)
          </p>
        </div>

        {/* Vertical Spacing */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Vertical Spacing: <span className="text-white font-mono">{verticalSpacing}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={verticalSpacing}
            onChange={(e) => onVerticalSpacingChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            disabled={isSaving}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Gap between navigation items (0-16px)
          </p>
        </div>
      </CollapsibleSection>

      {/* TYPOGRAPHY SECTION */}
      <CollapsibleSection title="Typography" defaultOpen={true} storageKey="nav-typography">
        {/* Font Family */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            disabled={isSaving}
          >
            <option value="system">System Default</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            Font family for navigation items
          </p>
        </div>

        {/* Font Size */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Font Size: <span className="text-white font-mono">{fontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="20"
            step="1"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            disabled={isSaving}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Base font size for nav items (12-20px)
          </p>
        </div>
      </CollapsibleSection>

      {/* COLORS SECTION */}
      <CollapsibleSection title="Colors & Themes" defaultOpen={false} storageKey="nav-colors">

        {/* Active Text Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Active Text Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={activeTextColor}
              onChange={(e) => onActiveTextColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={activeTextColor}
              onChange={(e) => onActiveTextColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#ffffff"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Text color for currently active navigation item
          </p>
        </div>

        {/* Hover Text Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Hover Text Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={hoverTextColor}
              onChange={(e) => onHoverTextColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={hoverTextColor}
              onChange={(e) => onHoverTextColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#ffffff"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Text color when hovering over navigation items
          </p>
        </div>

        {/* Active Background Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Active Background Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={activeBackgroundColor}
              onChange={(e) => onActiveBackgroundColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={activeBackgroundColor}
              onChange={(e) => onActiveBackgroundColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#1a1a1a"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Background color for currently active navigation item
          </p>
        </div>

        {/* Hover Background Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Hover Background Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={hoverBackgroundColor}
              onChange={(e) => onHoverBackgroundColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={hoverBackgroundColor}
              onChange={(e) => onHoverBackgroundColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#0d0d0d"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Background color when hovering over navigation items
          </p>
        </div>

        {/* Drawer Background Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Drawer Background Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={drawerBackgroundColor}
              onChange={(e) => onDrawerBackgroundColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={drawerBackgroundColor}
              onChange={(e) => onDrawerBackgroundColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#000000"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Background color for the navigation drawer panel
          </p>
        </div>

        {/* Border Color */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Border Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={borderColor}
              onChange={(e) => onBorderColorChange(e.target.value)}
              className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              disabled={isSaving}
            />
            <input
              type="text"
              value={borderColor}
              onChange={(e) => onBorderColorChange(e.target.value)}
              className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="#333333"
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Border color for drawer and navigation items
          </p>
        </div>
      </CollapsibleSection>

      {/* VISUAL STYLE SECTION */}
      <CollapsibleSection title="Visual Style" defaultOpen={true} storageKey="nav-visual">

        {/* Home Icon Toggle */}
        <div className="mb-5">
          <label className="flex items-center justify-between text-zinc-300 text-sm mb-2 font-medium cursor-pointer">
            <span>Show Home Icon</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={showHomeIcon}
                onChange={(e) => onShowHomeIconChange(e.target.checked)}
                className="sr-only peer"
                disabled={isSaving}
              />
              <div className="w-12 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </div>
          </label>
          <p className="text-xs text-zinc-500 mt-1">
            Display favicon icon next to Home link in navigation
          </p>
        </div>

        {/* Highlight Style */}
        <div className="mb-5">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Item Highlighting Style
          </label>
          <select
            value={highlightStyle}
            onChange={(e) => onHighlightStyleChange(e.target.value)}
            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            disabled={isSaving}
          >
            <option value="border">Border Only</option>
            <option value="background">Background Only</option>
            <option value="underline">Underline</option>
            <option value="both">Border & Background</option>
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            Visual style for active navigation item highlight
          </p>
        </div>
      </CollapsibleSection>

      {/* Help Section */}
      <div className="p-4 bg-zinc-800/50 rounded text-sm space-y-3">
        <div className="flex items-start gap-2">
          <div className="text-cyan-400 font-bold text-lg leading-none mt-0.5">
            i
          </div>
          <div className="text-zinc-400">
            <p className="mb-2">
              <strong className="text-zinc-300">Timing:</strong> Adjust delays and speeds for smooth navigation transitions
            </p>
            <p className="mb-2">
              <strong className="text-zinc-300">Spacing:</strong> Control hierarchical indentation and item gaps
            </p>
            <p className="mb-2">
              <strong className="text-zinc-300">Colors:</strong> Use hex codes (#000000 to #ffffff) with optional alpha
            </p>
            <p>
              <strong className="text-zinc-300">Preview:</strong> Changes apply after saving and may require page reload
            </p>
          </div>
        </div>
      </div>

      {/* Additional Tips */}
      <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/40 rounded text-xs">
        <p className="text-amber-200">
          <strong className="font-semibold">Tip:</strong> Start with default values and adjust incrementally. Test on both desktop and mobile viewports for optimal user experience.
        </p>
      </div>
    </div>
  );
}
