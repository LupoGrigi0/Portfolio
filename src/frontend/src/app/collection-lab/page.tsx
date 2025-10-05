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
import { getCollection, getCollections, type Collection, type CollectionConfig } from '@/lib/api-client';
import CuratedLayout from '@/components/Layout/CuratedLayout';
import DynamicLayout from '@/components/Layout/DynamicLayout';
import { MidgroundProjectionProvider } from '@/components/Layout';

// Example configs for quick testing
const EXAMPLE_CONFIGS: Record<string, CollectionConfig> = {
  'dynamic-single-column': {
    layoutType: 'dynamic',
    title: 'Single Column (Mobile Style)',
    subtitle: 'One carousel per row',
    dynamicSettings: {
      layout: 'single-column',
      imagesPerCarousel: 'all', // All images in one carousel, or set to number
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
};

export default function CollectionLabPage() {
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('couples');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config editor state
  const [configJson, setConfigJson] = useState('');
  const [parsedConfig, setParsedConfig] = useState<CollectionConfig | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

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

      const data = await getCollection(selectedCollection);

      if (!data) {
        setError(`Collection "${selectedCollection}" not found`);
        setLoading(false);
        return;
      }

      setCollection(data);

      // Initialize config editor with collection's config or default
      const initialConfig = data.config || EXAMPLE_CONFIGS['dynamic-simple'];
      setConfigJson(JSON.stringify(initialConfig, null, 2));
      setParsedConfig(initialConfig);

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
          </div>

          {/* Example Configs */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Load Example</label>
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
            </div>
          </div>

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
              className="w-full h-64 bg-black/60 border border-white/20 rounded px-3 py-2 text-white text-xs font-mono resize-none"
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                {jsonError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyConfig}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 font-semibold px-4 py-2 rounded transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-white/50 space-y-1 pt-2 border-t border-white/10">
            <p>Edit JSON, click Apply to see changes</p>
            <p>See docs/CONFIG_SCHEMA_GUIDE.md for reference</p>
          </div>
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
