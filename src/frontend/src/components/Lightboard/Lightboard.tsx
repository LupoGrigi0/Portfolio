'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SiteSettingsWidget,
  PageSettingsWidget,
  ProjectionSettingsWidget,
  CarouselSettingsWidget,
} from './widgets';

interface Position {
  x: number;
  y: number;
}

type TabType = 'site' | 'page' | 'projection' | 'carousel';

export default function Lightboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('site');
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Site Settings State
  const [siteTitle, setSiteTitle] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [isSavingSite, setIsSavingSite] = useState(false);

  // Page Settings State
  const [configJson, setConfigJson] = useState('{}');
  const [currentCollectionName, setCurrentCollectionName] = useState('');
  const [isSavingPage, setIsSavingPage] = useState(false);

  // Projection Settings State
  const [fadeDistance, setFadeDistance] = useState(0.5);
  const [maxBlur, setMaxBlur] = useState(4);
  const [projectionScaleX, setProjectionScaleX] = useState(1.2);
  const [projectionScaleY, setProjectionScaleY] = useState(1.2);
  const [blendMode, setBlendMode] = useState('normal');
  const [vignetteWidth, setVignetteWidth] = useState(20);
  const [vignetteStrength, setVignetteStrength] = useState(0.8);
  const [checkerboardEnabled, setCheckerboardEnabled] = useState(false);
  const [checkerboardTileSize, setCheckerboardTileSize] = useState(30);
  const [checkerboardScatterSpeed, setCheckerboardScatterSpeed] = useState(0.3);
  const [checkerboardBlur, setCheckerboardBlur] = useState(0);

  // Carousel Settings State
  const [transition, setTransition] = useState('fade');
  const [autoplay, setAutoplay] = useState(true);
  const [interval, setInterval] = useState(5000);
  const [speed, setSpeed] = useState(500);
  const [reservedSpaceTop, setReservedSpaceTop] = useState(0);
  const [reservedSpaceBottom, setReservedSpaceBottom] = useState(0);
  const [reservedSpaceLeft, setReservedSpaceLeft] = useState(0);
  const [reservedSpaceRight, setReservedSpaceRight] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.lightboard-tab, .lightboard-content')) {
      return;
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Site Settings Callbacks
  const handleSaveSiteSettings = async () => {
    setIsSavingSite(true);
    try {
      const response = await fetch('/api/site/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: siteTitle,
          tagline: siteTagline,
          favicon: faviconUrl,
          logo: logoUrl,
          backgroundColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save site settings');
      }

      console.log('Site settings saved successfully');
    } catch (error) {
      console.error('Error saving site settings:', error);
    } finally {
      setIsSavingSite(false);
    }
  };

  const handleLoadCurrentSettings = async () => {
    try {
      const response = await fetch('/api/site/config');
      if (!response.ok) {
        throw new Error('Failed to load site settings');
      }

      const data = await response.json();
      setSiteTitle(data.title || '');
      setSiteTagline(data.tagline || '');
      setFaviconUrl(data.favicon || '');
      setLogoUrl(data.logo || '');
      setBackgroundColor(data.backgroundColor || '#000000');

      console.log('Site settings loaded successfully');
    } catch (error) {
      console.error('Error loading site settings:', error);
    }
  };

  // Page Settings Callbacks
  const handleApplyPreview = () => {
    try {
      // Parse and validate JSON
      JSON.parse(configJson);
      console.log('Preview applied (local state updated)');
      // In a real implementation, this would update the page preview
    } catch (error) {
      console.error('Invalid JSON configuration:', error);
    }
  };

  const handleSaveToGallery = async () => {
    setIsSavingPage(true);
    try {
      // Extract slug from current collection name or use pathname
      const slug = currentCollectionName || window.location.pathname.split('/').pop() || 'default';

      const response = await fetch(`/api/admin/config/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: configJson,
      });

      if (!response.ok) {
        throw new Error('Failed to save page configuration');
      }

      console.log('Page configuration saved to gallery');
    } catch (error) {
      console.error('Error saving page configuration:', error);
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleLoadTemplate = async (templateKey: string) => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use placeholder templates
      const templates: Record<string, any> = {
        'single-column': { carousels: [{ id: 'carousel-1', layout: 'single-column' }] },
        '2-across': { carousels: [{ id: 'carousel-1', layout: '2-across' }] },
        'zipper': { carousels: [{ id: 'carousel-1', layout: 'zipper' }] },
        'hero': { carousels: [{ id: 'carousel-1', layout: 'hero' }] },
        'grid': { carousels: [{ id: 'carousel-1', layout: 'grid' }] },
        'hybrid': { carousels: [{ id: 'carousel-1', layout: 'hybrid' }] },
      };

      const template = templates[templateKey];
      if (template) {
        setConfigJson(JSON.stringify(template, null, 2));
        console.log(`Template "${templateKey}" loaded`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(configJson);
    console.log('JSON copied to clipboard');
  };

  // Projection Settings Callbacks
  const handleSyncToConfig = async () => {
    try {
      const projectionConfig = {
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
      };

      // Parse existing config and merge projection settings
      const config = JSON.parse(configJson);
      config.projection = projectionConfig;
      setConfigJson(JSON.stringify(config, null, 2));

      console.log('Projection settings synced to config');
    } catch (error) {
      console.error('Error syncing projection settings:', error);
    }
  };

  // Carousel Settings Callbacks
  const handleApplyCarouselSettings = async () => {
    try {
      const carouselConfig = {
        transition,
        autoplay,
        interval,
        speed,
        reservedSpace: {
          top: reservedSpaceTop,
          bottom: reservedSpaceBottom,
          left: reservedSpaceLeft,
          right: reservedSpaceRight,
        },
      };

      // Parse existing config and merge carousel settings
      const config = JSON.parse(configJson);
      config.carouselDefaults = carouselConfig;
      setConfigJson(JSON.stringify(config, null, 2));

      console.log('Carousel settings applied to config');
    } catch (error) {
      console.error('Error applying carousel settings:', error);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'site', label: 'Site' },
    { id: 'page', label: 'Page' },
    { id: 'projection', label: 'Projection' },
    { id: 'carousel', label: 'Carousel' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'site':
        return (
          <SiteSettingsWidget
            siteTitle={siteTitle}
            setSiteTitle={setSiteTitle}
            siteTagline={siteTagline}
            setSiteTagline={setSiteTagline}
            faviconUrl={faviconUrl}
            setFaviconUrl={setFaviconUrl}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            onSaveSiteSettings={handleSaveSiteSettings}
            onLoadCurrentSettings={handleLoadCurrentSettings}
            isSaving={isSavingSite}
          />
        );
      case 'page':
        return (
          <PageSettingsWidget
            configJson={configJson}
            setConfigJson={setConfigJson}
            onApplyPreview={handleApplyPreview}
            onSaveToGallery={handleSaveToGallery}
            onLoadTemplate={handleLoadTemplate}
            onCopyJSON={handleCopyJSON}
            currentCollectionName={currentCollectionName}
            isSaving={isSavingPage}
          />
        );
      case 'projection':
        return (
          <ProjectionSettingsWidget
            fadeDistance={fadeDistance}
            maxBlur={maxBlur}
            projectionScaleX={projectionScaleX}
            projectionScaleY={projectionScaleY}
            blendMode={blendMode}
            vignetteWidth={vignetteWidth}
            vignetteStrength={vignetteStrength}
            checkerboardEnabled={checkerboardEnabled}
            checkerboardTileSize={checkerboardTileSize}
            checkerboardScatterSpeed={checkerboardScatterSpeed}
            checkerboardBlur={checkerboardBlur}
            setFadeDistance={setFadeDistance}
            setMaxBlur={setMaxBlur}
            setProjectionScaleX={setProjectionScaleX}
            setProjectionScaleY={setProjectionScaleY}
            setBlendMode={setBlendMode}
            setVignetteWidth={setVignetteWidth}
            setVignetteStrength={setVignetteStrength}
            setCheckerboardEnabled={setCheckerboardEnabled}
            setCheckerboardTileSize={setCheckerboardTileSize}
            setCheckerboardScatterSpeed={setCheckerboardScatterSpeed}
            setCheckerboardBlur={setCheckerboardBlur}
            onSyncToConfig={handleSyncToConfig}
          />
        );
      case 'carousel':
        return (
          <CarouselSettingsWidget
            transition={transition}
            autoplay={autoplay}
            interval={interval}
            speed={speed}
            reservedSpaceTop={reservedSpaceTop}
            reservedSpaceBottom={reservedSpaceBottom}
            reservedSpaceLeft={reservedSpaceLeft}
            reservedSpaceRight={reservedSpaceRight}
            setTransition={setTransition}
            setAutoplay={setAutoplay}
            setInterval={setInterval}
            setSpeed={setSpeed}
            setReservedSpaceTop={setReservedSpaceTop}
            setReservedSpaceBottom={setReservedSpaceBottom}
            setReservedSpaceLeft={setReservedSpaceLeft}
            setReservedSpaceRight={setReservedSpaceRight}
            onApplySettings={handleApplyCarouselSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[9999] p-3 rounded-full bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 shadow-lg hover:bg-gray-800/90 hover:border-gray-600/50 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Toggle Lightboard"
      >
        <svg
          className="w-5 h-5 text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          className="fixed z-[9998] select-none"
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden min-w-[400px] max-w-[600px]">
            {/* Header */}
            <div
              onMouseDown={handleMouseDown}
              className="px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-b border-gray-700/50 cursor-move flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500/80"></div>
                <h2 className="text-sm font-semibold text-gray-100 tracking-wide">
                  Lightboard
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                aria-label="Close Lightboard"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700/50 bg-gray-900/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`lightboard-tab flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-gray-800/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="lightboard-content p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </>
  );
}
