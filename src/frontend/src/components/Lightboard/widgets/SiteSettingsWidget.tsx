/**
 * SiteSettingsWidget
 *
 * Widget for managing site-wide settings in Lightboard.
 * Controls global configuration like branding, appearance, and metadata.
 *
 * Features:
 * - Site title and tagline inputs
 * - Favicon and logo URL configuration
 * - Default background color picker
 * - Save site settings
 * - Load current settings
 * - Info text for user guidance
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React from 'react';

export interface SiteSettingsProps {
  siteTitle: string;
  setSiteTitle: (value: string) => void;
  siteTagline: string;
  setSiteTagline: (value: string) => void;
  faviconUrl: string;
  setFaviconUrl: (value: string) => void;
  logoUrl: string;
  setLogoUrl: (value: string) => void;
  backgroundColor: string;
  setBackgroundColor: (value: string) => void;
  onSaveSiteSettings: () => void;
  onLoadCurrentSettings: () => void;
  isSaving?: boolean;
}

export function SiteSettingsWidget({
  siteTitle,
  setSiteTitle,
  siteTagline,
  setSiteTagline,
  faviconUrl,
  setFaviconUrl,
  logoUrl,
  setLogoUrl,
  backgroundColor,
  setBackgroundColor,
  onSaveSiteSettings,
  onLoadCurrentSettings,
  isSaving = false,
}: SiteSettingsProps) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-2xl border border-zinc-700 w-full max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">Site Settings</h3>
        <p className="text-zinc-400 text-sm">
          Configure site-wide branding, appearance, and metadata
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/40 rounded">
        <p className="text-blue-200 text-sm">
          <strong className="font-semibold">Note:</strong> These settings apply across your entire site. Changes will affect all pages and collections.
        </p>
      </div>

      {/* Site Title */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Site Title
        </label>
        <input
          type="text"
          value={siteTitle}
          onChange={(e) => setSiteTitle(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          placeholder="My Awesome Portfolio"
          disabled={isSaving}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Main title displayed in browser tab and site header
        </p>
      </div>

      {/* Site Tagline */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Site Tagline
        </label>
        <input
          type="text"
          value={siteTagline}
          onChange={(e) => setSiteTagline(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          placeholder="Creative works and digital experiments"
          disabled={isSaving}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Subtitle or description shown below site title
        </p>
      </div>

      {/* Favicon URL */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Favicon URL
        </label>
        <input
          type="text"
          value={faviconUrl}
          onChange={(e) => setFaviconUrl(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          placeholder="/favicon.ico"
          disabled={isSaving}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Path or URL to favicon (16x16 or 32x32 icon)
        </p>
      </div>

      {/* Logo URL */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Logo URL
        </label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          placeholder="/images/logo.png"
          disabled={isSaving}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Path or URL to site logo (displayed in header/navigation)
        </p>
      </div>

      {/* Background Color */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Default Background Color
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
            disabled={isSaving}
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="#000000"
            disabled={isSaving}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Default page background (can be overridden per-page)
        </p>
      </div>

      {/* Help Section */}
      <div className="p-4 bg-zinc-800/50 rounded text-sm space-y-3">
        <div className="flex items-start gap-2">
          <div className="text-cyan-400 font-bold text-lg leading-none mt-0.5">
            i
          </div>
          <div className="text-zinc-400">
            <p className="mb-2">
              <strong className="text-zinc-300">Asset URLs:</strong> Use absolute URLs (https://...) or relative paths (/images/...)
            </p>
            <p className="mb-2">
              <strong className="text-zinc-300">Color Format:</strong> Hex color codes (#000000 to #ffffff)
            </p>
            <p>
              <strong className="text-zinc-300">Preview:</strong> Changes take effect after saving and page reload
            </p>
          </div>
        </div>
      </div>

      {/* Additional Tips */}
      <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/40 rounded text-xs">
        <p className="text-amber-200">
          <strong className="font-semibold">Tip:</strong> Keep favicon files small (under 100KB) and logos optimized for web. Consider using SVG format for crisp logos at any size.
        </p>
      </div>
    </div>
  );
}
