/**
 * UnifiedActionBar
 *
 * Fixed bottom action bar for Lightboard with all primary actions.
 * Replaces individual save buttons in widgets for a unified UX.
 *
 * Features:
 * - Save Site Config (emerald)
 * - Save Page Config (emerald)
 * - Download Config (cyan)
 * - Upload Config (cyan)
 * - Undo (zinc, disabled)
 * - Redo (zinc, disabled)
 *
 * @author Agent Team 1 (Core Features)
 * @created 2025-10-14
 */

'use client';

import React, { useRef } from 'react';

interface UnifiedActionBarProps {
  // Save handlers
  onSaveSiteConfig: () => void;
  onSavePageConfig: () => void;

  // Download/Upload handlers
  onDownloadConfig: () => void;
  onUploadConfig: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Undo/Redo handlers (Phase 2)
  onUndo: () => void;
  onRedo: () => void;

  // Disabled states
  isSavingSite: boolean;
  isSavingPage: boolean;
  isDirtySite: boolean;
  isDirtyPage: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Current collection
  hasCollection: boolean;
}

export function UnifiedActionBar({
  onSaveSiteConfig,
  onSavePageConfig,
  onDownloadConfig,
  onUploadConfig,
  onUndo,
  onRedo,
  isSavingSite,
  isSavingPage,
  isDirtySite,
  isDirtyPage,
  canUndo,
  canRedo,
  hasCollection,
}: UnifiedActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 shadow-2xl z-[9997]">
      <div className="px-6 py-3 flex items-center justify-center gap-3">
        {/* Primary Actions - Save Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSaveSiteConfig}
            disabled={!isDirtySite || isSavingSite}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save site-wide settings (Site + Navigation)"
          >
            {isSavingSite ? 'Saving...' : 'Save Site Config'}
          </button>

          <button
            onClick={onSavePageConfig}
            disabled={!isDirtyPage || isSavingPage || !hasCollection}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save collection config (Page + Projection + Carousel)"
          >
            {isSavingPage ? 'Saving...' : 'Save Page Config'}
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-600"></div>

        {/* Secondary Actions - Download/Upload */}
        <div className="flex gap-2">
          <button
            onClick={onDownloadConfig}
            disabled={!hasCollection}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download current config as JSON file"
          >
            Download Config
          </button>

          <button
            onClick={handleUploadClick}
            disabled={!hasCollection}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload config from JSON file"
          >
            Upload Config
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onUploadConfig}
            className="hidden"
          />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-600"></div>

        {/* Tertiary Actions - Undo/Redo */}
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo last change (Phase 2)"
          >
            Undo
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo last undone change (Phase 2)"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}
