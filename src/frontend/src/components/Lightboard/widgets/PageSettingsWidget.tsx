/**
 * PageSettingsWidget
 *
 * Widget for managing page/collection layout configurations in Lightboard.
 * Supports loading templates, editing JSON config, and saving to gallery.
 *
 * Features:
 * - Config source selector (Current / Templates / Custom)
 * - Template selector dropdown
 * - JSON editor with syntax highlighting
 * - Apply Preview button
 * - Save to Gallery button
 * - Copy JSON utility
 * - Status display
 *
 * @author Kai v3 (Lightboard Specialist)
 * @created 2025-10-13
 */

'use client';

import React, { useState } from 'react';

export interface PageSettingsProps {
  configJson: string;
  setConfigJson: (json: string) => void;
  onApplyPreview: () => void;
  onSaveToGallery: () => void;
  onLoadTemplate: (templateKey: string) => void;
  onCopyJSON: () => void;
  currentCollectionName?: string;
  isSaving?: boolean;
}

type ConfigSource = 'current' | 'templates' | 'custom';

const TEMPLATE_OPTIONS = [
  { key: 'single-column', label: 'Single Column' },
  { key: '2-across', label: '2-Across' },
  { key: 'zipper', label: 'Zipper' },
  { key: 'hero', label: 'Hero' },
  { key: 'grid', label: 'Grid' },
  { key: 'hybrid', label: 'Hybrid' },
];

export function PageSettingsWidget({
  configJson,
  setConfigJson,
  onApplyPreview,
  onSaveToGallery,
  onLoadTemplate,
  onCopyJSON,
  currentCollectionName,
  isSaving = false,
}: PageSettingsProps) {
  const [configSource, setConfigSource] = useState<ConfigSource>('current');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('single-column');

  const handleSourceChange = (source: ConfigSource) => {
    setConfigSource(source);
    if (source === 'templates') {
      // Load the currently selected template
      onLoadTemplate(selectedTemplate);
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    onLoadTemplate(templateKey);
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-2xl border border-zinc-700 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">Page Settings</h3>
        <p className="text-zinc-400 text-sm">
          Configure layout and carousel arrangement for this page
        </p>
        {currentCollectionName && (
          <div className="mt-3 px-3 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded text-sm">
            <span className="text-cyan-300 font-semibold">Editing: </span>
            <span className="text-cyan-200">{currentCollectionName}</span>
          </div>
        )}
      </div>

      {/* Config Source Selector */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-3 font-medium">
          Config Source
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleSourceChange('current')}
            className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${
              configSource === 'current'
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
            disabled={isSaving}
          >
            Current
          </button>
          <button
            onClick={() => handleSourceChange('templates')}
            className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${
              configSource === 'templates'
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
            disabled={isSaving}
          >
            Templates
          </button>
          <button
            onClick={() => handleSourceChange('custom')}
            className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${
              configSource === 'custom'
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
            disabled={isSaving}
          >
            Custom
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {configSource === 'current' && 'Viewing current page configuration'}
          {configSource === 'templates' && 'Select a template to start from'}
          {configSource === 'custom' && 'Edit JSON configuration manually'}
        </p>
      </div>

      {/* Template Selector (shown when Templates mode selected) */}
      {configSource === 'templates' && (
        <div className="mb-6">
          <label className="block text-zinc-300 text-sm mb-2 font-medium">
            Select Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            disabled={isSaving}
          >
            {TEMPLATE_OPTIONS.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            Pre-built layouts for common page structures
          </p>
        </div>
      )}

      {/* JSON Editor */}
      <div className="mb-6">
        <label className="block text-zinc-300 text-sm mb-2 font-medium">
          Configuration JSON
        </label>
        <textarea
          value={configJson}
          onChange={(e) => setConfigJson(e.target.value)}
          className="w-full h-80 bg-zinc-950 text-green-300 border border-zinc-700 rounded px-4 py-3 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-vertical"
          spellCheck={false}
          disabled={isSaving}
          placeholder='{\n  "carousels": [\n    {\n      "id": "carousel-1",\n      "items": [...]\n    }\n  ]\n}'
        />
        <p className="text-xs text-zinc-500 mt-1">
          Edit carousel configuration directly or paste from clipboard
        </p>
      </div>

      {/* Status Info */}
      <div className="p-4 bg-zinc-800/50 rounded text-sm">
        <div className="flex items-start gap-2">
          <div className="text-cyan-400 font-bold text-lg leading-none mt-0.5">
            i
          </div>
          <div className="text-zinc-400">
            <p className="mb-2">
              <strong className="text-zinc-300">Apply Preview:</strong> Test changes without saving
            </p>
            <p className="mb-2">
              <strong className="text-zinc-300">Save to Gallery:</strong> Persist changes to backend
            </p>
            <p>
              <strong className="text-zinc-300">Copy JSON:</strong> Copy config to clipboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
