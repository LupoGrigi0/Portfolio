/**
 * Collection Layout Lab
 *
 * Test and experiment with collection layout configurations.
 * Similar to carousel-demo but for full collection page layouts.
 *
 * Features:
 * - Collection selector dropdown
 * - Live JSON config editor
 * - Example config loader
 * - Instant preview with CuratedLayout/DynamicLayout
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-03
 */

'use client';

import { useEffect, useState } from 'react';
import { getCollection, getCollections, resetRateLimit, updateCollectionConfig, type Collection, type CollectionConfig } from '@/lib/api-client';
import CuratedLayout from '@/components/Layout/CuratedLayout';
import DynamicLayout from '@/components/Layout/DynamicLayout';
import { MidgroundProjectionProvider } from '@/components/Layout';

// Example configs for quick testing
const EXAMPLE_CONFIGS: Record<string, CollectionConfig> = {
  'dynamic-single-column': {
    layoutType: 'dynamic',
    title: 'Single Column (Mobile Style)',
    subtitle: 'One carousel per row, 20 images each',
    dynamicSettings: {
      layout: 'single-column',
      imagesPerCarousel: 20, // Images per carousel (20 is a good default)
      carouselDefaults: {
        transition: 'slide-horizontal',
        reservedSpace: { bottom: 80 },
      },
    },
  },
  'dynamic-2-across': {
    layoutType: 'dynamic',
    title: 'Dynamic 2-Across',
    subtitle: 'Auto-generated grid',
    dynamicSettings: {
      layout: '2-across',
      imagesPerCarousel: 5,
      carouselDefaults: {
        transition: 'fade',
        reservedSpace: { bottom: 60 },
      },
    },
  },
  'dynamic-zipper': {
    layoutType: 'dynamic',
    title: 'Zipper Layout',
    subtitle: 'Alternating left-right carousels (magazine style)',
    dynamicSettings: {
      layout: 'zipper',
      imagesPerCarousel: 5,
      carouselDefaults: {
        transition: 'slide-horizontal',
        reservedSpace: { bottom: 60 },
      },
    },
  },
  'curated-hero': {
    layoutType: 'curated',
    sections: [
      {
        type: 'hero',
        title: '$CollectionName',
        subtitle: '$ImageCount images • $VideoCount videos',
        containerOpacity: 0.3,
        textPosition: 'center',
        separator: true,
      },
      {
        type: 'text',
        content: '<p>Welcome to the <strong>$CollectionTitle</strong> collection with <strong>$TotalCount</strong> items total.</p>',
        position: 'center',
        width: 'full',
      },
      {
        type: 'carousel',
        images: 'auto',
        width: 'full',
        carouselOptions: {
          transition: 'slide-horizontal',
          autoplay: false,
          reservedSpace: { bottom: 80 },
        },
      },
    ],
  },
  'template-demo': {
    layoutType: 'curated',
    sections: [
      {
        type: 'hero',
        title: '$CollectionName',
        subtitle: '$ImageCount images • $VideoCount videos • $TotalCount total',
        containerOpacity: 0.35,
        textPosition: 'center',
        separator: true,
      },
      {
        type: 'text',
        content: `
          <div style="text-align: center; max-width: 600px; margin: 0 auto;">
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Template Variable Demo</h3>
            <p style="margin-bottom: 0.5rem;"><strong>Collection:</strong> $CollectionName</p>
            <p style="margin-bottom: 0.5rem;"><strong>Title:</strong> $CollectionTitle</p>
            <p style="margin-bottom: 0.5rem;"><strong>Images:</strong> $ImageCount</p>
            <p style="margin-bottom: 0.5rem;"><strong>Videos:</strong> $VideoCount</p>
            <p style="margin-bottom: 0.5rem;"><strong>Total:</strong> $TotalCount items</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">
              This config can be copied to any collection directory - values auto-fill!
            </p>
          </div>
        `,
        position: 'center',
        width: 'full',
      },
      {
        type: 'separator',
        style: 'gradient',
        opacity: 0.4,
        spacing: 50,
      },
      {
        type: 'carousel',
        images: { limit: 10 },
        width: 'full',
        carouselOptions: {
          transition: 'slide-horizontal',
          autoplay: false,
          reservedSpace: { bottom: 80 },
        },
      },
    ],
  },
  'curated-grid': {
    layoutType: 'curated',
    sections: [
      {
        type: 'hero',
        title: 'GALLERY GRID',
        subtitle: 'Multiple carousels side-by-side with different images',
        containerOpacity: 0.4,
        textPosition: 'center',
      },
      {
        type: 'separator',
        style: 'gradient',
        opacity: 0.3,
        spacing: 40,
      },
      {
        type: 'row', // Group carousels in a row
        sections: [
          {
            type: 'carousel',
            images: { limit: 5, skip: 0 }, // First 5 images
            width: 'half',
            carouselOptions: { transition: 'fade' },
          },
          {
            type: 'carousel',
            images: { limit: 5, skip: 5 }, // Next 5 images (skip first 5)
            width: 'half',
            carouselOptions: { transition: 'fade' },
          },
        ],
      },
    ],
  },
  'projection-every-2nd': {
    layoutType: 'dynamic',
    title: 'Projection Demo (Every 2nd)',
    subtitle: 'Every other carousel projects onto midground',
    projection: {
      enabled: true,
      pattern: 'every-2nd',
      patternOffset: 0,
      fadeDistance: 0.5,
      maxBlur: 4,
      scaleX: 1.2,
      scaleY: 1.2,
      blendMode: 'normal',
      vignette: {
        width: 20,
        strength: 0.8,
      },
    },
    dynamicSettings: {
      layout: 'single-column',
      imagesPerCarousel: 5,
      carouselDefaults: {
        transition: 'fade',
        reservedSpace: { bottom: 60 },
      },
    },
  },
  'projection-all-soft-light': {
    layoutType: 'dynamic',
    title: 'Projection All (Soft Light Blend)',
    subtitle: 'All carousels project with soft-light blending',
    projection: {
      enabled: true,
      pattern: 'all',
      fadeDistance: 0.6,
      maxBlur: 6,
      scaleX: 1.4,
      scaleY: 1.4,
      blendMode: 'soft-light',
      vignette: {
        width: 25,
        strength: 0.7,
      },
    },
    dynamicSettings: {
      layout: 'single-column',
      imagesPerCarousel: 8,
      carouselDefaults: {
        transition: 'slide-horizontal',
        reservedSpace: { bottom: 80 },
      },
      spacing: {
        vertical: 60,
      },
    },
  },
  'projection-checkerboard': {
    layoutType: 'dynamic',
    title: 'Checkerboard Vignette',
    subtitle: 'Artistic checkerboard projection effect',
    projection: {
      enabled: true,
      pattern: 'every-2nd',
      fadeDistance: 0.5,
      maxBlur: 3,
      scaleX: 1.3,
      scaleY: 1.3,
      blendMode: 'multiply',
      checkerboard: {
        enabled: true,
        tileSize: 40,
        scatterSpeed: 0.2,
        blur: 2,
      },
    },
    dynamicSettings: {
      layout: 'single-column',
      imagesPerCarousel: 6,
      carouselDefaults: {
        transition: 'fade',
        reservedSpace: { bottom: 70 },
      },
    },
  },
  'hybrid-demo': {
    layoutType: 'curated',
    sections: [
      {
        type: 'hero',
        title: 'HYBRID LAYOUT',
        subtitle: 'Curated header + dynamic auto-fill = best of both worlds',
        containerOpacity: 0.35,
        textPosition: 'center',
        separator: true,
      },
      {
        type: 'row',
        sections: [
          {
            type: 'text',
            content: `
              <div style="padding: 2rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Story Section One</h3>
                <p style="opacity: 0.8; line-height: 1.6;">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  This text sits alongside the carousel, creating a magazine-style layout.
                </p>
              </div>
            `,
            position: 'left',
            width: 'half',
          },
          {
            type: 'carousel',
            images: { limit: 3, skip: 0 },
            width: 'half',
            carouselOptions: {
              transition: 'fade',
              reservedSpace: { bottom: 60 },
            },
          },
        ],
      },
      {
        type: 'row',
        sections: [
          {
            type: 'carousel',
            images: { limit: 3, skip: 3 },
            width: 'half',
            carouselOptions: {
              transition: 'fade',
              reservedSpace: { bottom: 60 },
            },
          },
          {
            type: 'text',
            content: `
              <div style="padding: 2rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Story Section Two</h3>
                <p style="opacity: 0.8; line-height: 1.6;">
                  Now the carousel is on the left, and text on the right.
                  This alternating pattern creates visual rhythm and keeps the layout dynamic and engaging.
                </p>
              </div>
            `,
            position: 'right',
            width: 'half',
          },
        ],
      },
      {
        type: 'separator',
        style: 'gradient',
        opacity: 0.3,
        spacing: 50,
      },
      {
        type: 'text',
        content: `
          <div style="text-align: center; max-width: 700px; margin: 0 auto;">
            <h3 style="font-size: 1.3rem; margin-bottom: 1rem;">Auto-Generated Gallery</h3>
            <p style="opacity: 0.8;">
              The next 15 images are auto-filled in a 2-across grid.
              Dynamic-fill only uses images not already shown above!
            </p>
          </div>
        `,
        position: 'center',
        width: 'full',
      },
      {
        type: 'dynamic-fill',
        count: 15, // Next 15 images
        layout: '2-across',
        imagesPerCarousel: 5,
        carouselDefaults: {
          transition: 'slide-horizontal',
          reservedSpace: { bottom: 60 },
        },
      },
      {
        type: 'separator',
        style: 'dots',
        opacity: 0.4,
        spacing: 60,
      },
      {
        type: 'text',
        content: '<p style="text-align: center; opacity: 0.7;">Everything below = all remaining images auto-filled (20 per carousel)</p>',
        position: 'center',
        width: 'full',
      },
      {
        type: 'dynamic-fill',
        count: 'all', // All remaining images
        layout: 'single-column',
        imagesPerCarousel: 20, // 20 images per carousel
        carouselDefaults: {
          transition: 'slide-horizontal',
          reservedSpace: { bottom: 80 },
        },
      },
    ],
  },
};

export default function CollectionLabPage() {
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('couples');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config editor state
  const [configSource, setConfigSource] = useState<'current' | 'templates' | 'custom'>('templates');
  const [configJson, setConfigJson] = useState('');
  const [parsedConfig, setParsedConfig] = useState<CollectionConfig | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [saving, setSaving] = useState(false);

  // Spacing controls (for dynamic layouts)
  const [spacingHorizontal, setSpacingHorizontal] = useState(32);
  const [spacingVertical, setSpacingVertical] = useState(48);

  // Load available collections from backend
  useEffect(() => {
    async function loadCollections() {
      const collections = await getCollections();
      setAvailableCollections(collections);

      // Set first collection as default if couples not available
      if (collections.length > 0 && !collections.find(c => c.slug === 'couples')) {
        setSelectedCollection(collections[0].slug);
      }
    }
    loadCollections();
  }, []);

  // Load collection from backend
  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      setError(null);

      // getCollection now handles pagination automatically
      const data = await getCollection(selectedCollection);

      if (!data) {
        setError(`Collection "${selectedCollection}" not found`);
        setLoading(false);
        return;
      }

      setCollection(data);

      // Initialize config editor based on whether collection has a config
      if (data.config) {
        // Collection has a config - show it in "current" mode
        setConfigSource('current');
        setConfigJson(JSON.stringify(data.config, null, 2));
        setParsedConfig(data.config);
      } else {
        // No config - default to templates mode with single-column layout
        setConfigSource('templates');
        const defaultTemplate = EXAMPLE_CONFIGS['dynamic-single-column'];
        setConfigJson(JSON.stringify(defaultTemplate, null, 2));
        setParsedConfig(defaultTemplate);
      }

      setLoading(false);
    }

    loadCollection();
  }, [selectedCollection]);

  // Apply config from JSON editor
  const handleApplyConfig = () => {
    try {
      const parsed = JSON.parse(configJson);
      setParsedConfig(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // Load example config
  const handleLoadExample = (exampleKey: string) => {
    const example = EXAMPLE_CONFIGS[exampleKey];
    setConfigJson(JSON.stringify(example, null, 2));
    setParsedConfig(example);
    setJsonError(null);
    setConfigSource('templates');
  };

  // Reset to collection's original config
  const handleReset = () => {
    if (collection?.config) {
      setConfigJson(JSON.stringify(collection.config, null, 2));
      setParsedConfig(collection.config);
    } else {
      handleLoadExample('dynamic-simple');
    }
    setJsonError(null);
  };

  // Update spacing in config
  const handleSpacingChange = (horizontal: number, vertical: number) => {
    setSpacingHorizontal(horizontal);
    setSpacingVertical(vertical);

    if (!parsedConfig) return;

    if (parsedConfig.layoutType === 'dynamic') {
      // Update dynamic layout spacing
      const updated: CollectionConfig = {
        ...parsedConfig,
        dynamicSettings: {
          ...parsedConfig.dynamicSettings!,
          spacing: { horizontal, vertical }
        }
      };
      setConfigJson(JSON.stringify(updated, null, 2));
      setParsedConfig(updated);
    } else if (parsedConfig.layoutType === 'curated' && parsedConfig.sections) {
      // Update spacing in all dynamic-fill sections
      const updated = {
        ...parsedConfig,
        sections: parsedConfig.sections.map((section: any) => {
          if (section.type === 'dynamic-fill') {
            return {
              ...section,
              spacing: { horizontal, vertical }
            };
          }
          return section;
        })
      };
      setConfigJson(JSON.stringify(updated, null, 2));
      setParsedConfig(updated);
    }
  };

  // Reset rate limit for testing large collections
  const handleResetRateLimit = async () => {
    const result = await resetRateLimit();
    if (result.success) {
      alert('✓ Rate limit reset successfully!\n\n' + (result.message || 'You can now fetch large collections without hitting rate limits.'));
    } else {
      alert('✗ Error resetting rate limit:\n\n' + result.error);
    }
  };

  // Load collection's current config from backend
  const handleLoadCurrentConfig = () => {
    if (collection?.config) {
      setConfigJson(JSON.stringify(collection.config, null, 2));
      setParsedConfig(collection.config);
      setConfigSource('current');
      setJsonError(null);
    } else {
      alert('This collection does not have a saved config yet.\n\nYou can create one by selecting a template or writing custom JSON, then clicking "Save to Gallery".');
    }
  };

  // Switch to custom editing mode
  const handleSwitchToCustom = () => {
    setConfigSource('custom');
  };

  // Save config to gallery (backend)
  const handleSaveToGallery = async () => {
    if (!collection) return;

    // Validate JSON first
    try {
      const configToSave = JSON.parse(configJson);

      const confirmed = confirm(
        `Save this config to ${collection.name}?\n\n` +
        `This will overwrite the collection's config.json file.\n\n` +
        `Layout: ${configToSave.layoutType || 'dynamic'}\n` +
        `Continue?`
      );

      if (!confirmed) return;

      setSaving(true);
      const result = await updateCollectionConfig(collection.slug, configToSave);

      if (result.success) {
        alert(
          `✓ Config saved successfully!\n\n` +
          `Collection: ${collection.name}\n` +
          `File: ${result.path || 'config.json'}\n` +
          `Updated: ${result.updatedAt || 'now'}`
        );

        // Reload collection to get updated config
        const updated = await getCollection(collection.slug);
        if (updated) {
          setCollection(updated);
          setConfigSource('current');
        }
      } else {
        alert(`✗ Error saving config:\n\n${result.error}`);
      }
    } catch (err: any) {
      alert(`✗ Invalid JSON:\n\n${err.message}\n\nPlease fix the JSON before saving.`);
    } finally {
      setSaving(false);
    }
  };

  // Copy config JSON to clipboard
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(configJson);
      alert('✓ Config copied to clipboard!\n\nYou can now paste it into EXAMPLE_CONFIGS to create a new template.');
    } catch (err) {
      alert('✗ Failed to copy to clipboard.\n\nPlease select and copy the JSON manually.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Collection Not Found</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={() => setSelectedCollection('mixed-collection')}
            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg"
          >
            Try Mixed Collection
          </button>
        </div>
      </div>
    );
  }

  const layoutType = parsedConfig?.layoutType || 'dynamic';

  return (
    <MidgroundProjectionProvider>
      <div className="min-h-screen bg-black text-white">
      {/* Config Editor Panel (Fixed Right) */}
      <div className="fixed top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden shadow-2xl z-50">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">🧪 Collection Lab</h2>
          <p className="text-xs text-white/60 mt-1">Live config editor</p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {/* Collection Selector */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
            >
              {availableCollections.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.imageCount} images)
                </option>
              ))}
            </select>
            <p className="text-xs text-white/60">
              {collection ? `${collection.imageCount} images • ${collection.videoCount} videos` : 'Loading...'}
            </p>
            <button
              onClick={handleResetRateLimit}
              className="w-full mt-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold px-3 py-2 rounded transition-colors"
              title="Reset rate limit for testing large collections"
            >
              🔄 Reset Rate Limit
            </button>
          </div>

          {/* Config Source Selector */}
          <div className="space-y-3 pb-3 border-b border-white/10">
            <label className="text-sm text-white/70 font-semibold">Config Source</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadCurrentConfig()}
                className={`flex-1 text-xs font-semibold px-3 py-2 rounded transition-colors ${
                  configSource === 'current'
                    ? 'bg-cyan-500/30 border-2 border-cyan-500/60 text-cyan-200'
                    : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/20'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setConfigSource('templates')}
                className={`flex-1 text-xs font-semibold px-3 py-2 rounded transition-colors ${
                  configSource === 'templates'
                    ? 'bg-blue-500/30 border-2 border-blue-500/60 text-blue-200'
                    : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/20'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => handleSwitchToCustom()}
                className={`flex-1 text-xs font-semibold px-3 py-2 rounded transition-colors ${
                  configSource === 'custom'
                    ? 'bg-purple-500/30 border-2 border-purple-500/60 text-purple-200'
                    : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/20'
                }`}
              >
                Custom
              </button>
            </div>
            <p className="text-xs text-white/50">
              {configSource === 'current' && (collection?.config ? '📄 Viewing saved config' : '⚠️ No saved config yet')}
              {configSource === 'templates' && '📋 Choose a pre-designed template'}
              {configSource === 'custom' && '✏️ Edit JSON directly'}
            </p>
          </div>

          {/* Template Selector (only show in templates mode) */}
          {configSource === 'templates' && (
            <div className="space-y-2">
              <label className="text-sm text-white/70 font-semibold">Load Template</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleLoadExample('dynamic-single-column')}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 px-3 py-1 rounded"
                >
                  Single Column
                </button>
                <button
                  onClick={() => handleLoadExample('dynamic-2-across')}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 px-3 py-1 rounded"
                >
                  2-Across
                </button>
                <button
                  onClick={() => handleLoadExample('dynamic-zipper')}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 px-3 py-1 rounded"
                >
                  Zipper
                </button>
                <button
                  onClick={() => handleLoadExample('template-demo')}
                  className="text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1 rounded"
                >
                  Template (Variables)
                </button>
                <button
                  onClick={() => handleLoadExample('curated-hero')}
                  className="text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1 rounded"
                >
                  Hero
                </button>
                <button
                  onClick={() => handleLoadExample('curated-grid')}
                  className="text-xs bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 px-3 py-1 rounded"
                >
                  Grid
                </button>
                <button
                  onClick={() => handleLoadExample('hybrid-demo')}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 px-3 py-1 rounded"
                >
                  Hybrid (Auto-Fill)
                </button>
                <button
                  onClick={() => handleLoadExample('projection-every-2nd')}
                  className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1 rounded"
                >
                  🎬 Projection (Every 2nd)
                </button>
                <button
                  onClick={() => handleLoadExample('projection-all-soft-light')}
                  className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1 rounded"
                >
                  🎬 Projection (All)
                </button>
                <button
                  onClick={() => handleLoadExample('projection-checkerboard')}
                  className="text-xs bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 px-3 py-1 rounded"
                >
                  🎨 Checkerboard
                </button>
              </div>
            </div>
          )}

          {/* Spacing Controls (Dynamic Layouts + Hybrid with Dynamic-Fill) */}
          {(layoutType === 'dynamic' || (layoutType === 'curated' && parsedConfig?.sections?.some((s: any) => s.type === 'dynamic-fill'))) && (
            <div className="space-y-3 pb-3 border-b border-white/10">
              <label className="text-sm text-white/70 font-semibold">📏 Spacing Controls</label>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">Horizontal Gap</span>
                  <span className="text-xs text-white/80 font-mono">{spacingHorizontal}px</span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="100"
                  step="4"
                  value={spacingHorizontal}
                  onChange={(e) => handleSpacingChange(parseInt(e.target.value), spacingVertical)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">Vertical Gap</span>
                  <span className="text-xs text-white/80 font-mono">{spacingVertical}px</span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="120"
                  step="4"
                  value={spacingVertical}
                  onChange={(e) => handleSpacingChange(spacingHorizontal, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <p className="text-xs text-white/50 italic">
                Adjust gaps between carousels • Negative values = overlapping
              </p>
            </div>
          )}

          {/* JSON Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70 font-semibold">Config JSON</label>
              <span className="text-xs text-white/50">
                {layoutType === 'curated' ? '🎨 Curated' : '🔄 Dynamic'}
              </span>
            </div>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              onKeyDown={(e) => {
                // Prevent space bar from being captured by parent handlers
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              className="w-full h-64 bg-black/60 border border-white/20 rounded px-3 py-2 text-white text-xs font-mono resize-none"
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                {jsonError}
              </p>
            )}
            <button
              onClick={handleCopyJSON}
              className="w-full text-xs bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 text-gray-300 px-3 py-1.5 rounded transition-colors"
            >
              📋 Copy JSON to Clipboard
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleApplyConfig}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 font-semibold px-4 py-2 rounded transition-colors"
              >
                Apply Preview
              </button>
              <button
                onClick={handleReset}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Save to Gallery Button - only show when NOT viewing current config */}
            {configSource !== 'current' && (
              <button
                onClick={handleSaveToGallery}
                disabled={saving || !!jsonError}
                className={`w-full font-semibold px-4 py-2 rounded transition-colors ${
                  saving || jsonError
                    ? 'bg-gray-500/20 border border-gray-500/40 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {saving ? '💾 Saving...' : '💾 Save to Gallery'}
              </button>
            )}

            {/* Edit button when viewing current config */}
            {configSource === 'current' && collection?.config && (
              <button
                onClick={handleSwitchToCustom}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-semibold px-4 py-2 rounded transition-colors"
              >
                ✏️ Edit Config
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-white/50 space-y-1 pt-2 border-t border-white/10">
            <p>Edit JSON, click Apply to see changes</p>
            <button
              onClick={() => setShowReference(!showReference)}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {showReference ? 'Hide' : 'Show'} Config Reference
            </button>
          </div>

          {/* Quick Reference (Collapsible) */}
          {showReference && (
            <div className="text-xs text-white/90 space-y-3 pt-3 border-t border-white/10 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-sm text-white">📚 Config Quick Reference</h3>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Layout Types:</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">curated</code> - Manual section-by-section design</li>
                  <li><code className="bg-white/10 px-1">dynamic</code> - Auto-generate from all images</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Template Variables:</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">$CollectionName</code> - Collection slug</li>
                  <li><code className="bg-white/10 px-1">$CollectionTitle</code> - Display title</li>
                  <li><code className="bg-white/10 px-1">$ImageCount</code> - Number of images</li>
                  <li><code className="bg-white/10 px-1">$VideoCount</code> - Number of videos</li>
                  <li><code className="bg-white/10 px-1">$TotalCount</code> - Total media items</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Section Types (Curated):</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">hero</code> - Title/subtitle banner</li>
                  <li><code className="bg-white/10 px-1">text</code> - HTML/markdown content</li>
                  <li><code className="bg-white/10 px-1">carousel</code> - Image slideshow</li>
                  <li><code className="bg-white/10 px-1">image</code> - Single image</li>
                  <li><code className="bg-white/10 px-1">video</code> - Single video</li>
                  <li><code className="bg-white/10 px-1">separator</code> - Visual divider</li>
                  <li><code className="bg-white/10 px-1">dynamic-fill</code> - Auto-fill remaining images</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Image Queries:</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">{'{ limit: 10 }'}</code> - First 10 images</li>
                  <li><code className="bg-white/10 px-1">{'{ skip: 5, limit: 10 }'}</code> - Skip first 5, get next 10</li>
                  <li><code className="bg-white/10 px-1">{'{ aspectRatio: ">2.5" }'}</code> - Wide images only</li>
                  <li><code className="bg-white/10 px-1">{'{ filename: "pattern" }'}</code> - Regex filename match</li>
                  <li><code className="bg-white/10 px-1">{'{ sortBy: "random" }'}</code> - Random order</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Carousel Options:</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">transition</code> - fade, slide-horizontal, zoom, flipbook</li>
                  <li><code className="bg-white/10 px-1">autoplay</code> - true/false</li>
                  <li><code className="bg-white/10 px-1">interval</code> - ms between slides (8000)</li>
                  <li><code className="bg-white/10 px-1">speed</code> - transition duration ms (800)</li>
                  <li><code className="bg-white/10 px-1">reservedSpace</code> - top, bottom, left, right (px)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Layout Options (Dynamic):</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">single-column</code> - One carousel per row</li>
                  <li><code className="bg-white/10 px-1">2-across</code> - Two carousels side-by-side</li>
                  <li><code className="bg-white/10 px-1">3-across</code> - Three carousels in grid</li>
                  <li><code className="bg-white/10 px-1">masonry</code> - Varying heights (TODO)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white/80">Width Options:</p>
                <ul className="list-disc list-inside space-y-1 text-white/70">
                  <li><code className="bg-white/10 px-1">full</code> - 100% width</li>
                  <li><code className="bg-white/10 px-1">half</code> - 50% width (side-by-side)</li>
                  <li><code className="bg-white/10 px-1">third</code> - 33% width</li>
                  <li><code className="bg-white/10 px-1">quarter</code> - 25% width</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-white/60">See <code className="bg-white/10 px-1">docs/CONFIG_SCHEMA_GUIDE.md</code> for full details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="pr-[28rem]">
        {/* Title Bar */}
        <div className="bg-gradient-to-b from-black via-black/80 to-transparent py-8 px-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {parsedConfig?.title || collection.name}
          </h1>
          {parsedConfig?.subtitle && (
            <p className="text-xl text-white/70">{parsedConfig.subtitle}</p>
          )}
          <div className="text-sm text-white/50 mt-2">
            Collection: {selectedCollection} • Layout: {layoutType}
          </div>
        </div>

        {/* Layout Renderer */}
        <div className="px-8 py-12">
          {parsedConfig ? (
            layoutType === 'curated' ? (
              <CuratedLayout collection={collection} config={parsedConfig} />
            ) : (
              <DynamicLayout collection={collection} config={parsedConfig} />
            )
          ) : (
            <div className="text-center text-white/60 py-12">
              <p>No config loaded. Click "Apply" to render layout.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </MidgroundProjectionProvider>
  );
}
