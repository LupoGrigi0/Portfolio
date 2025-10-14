'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SiteSettingsWidget,
  PageSettingsWidget,
  ProjectionSettingsWidget,
  CarouselSettingsWidget,
  NavigationSettingsWidget,
} from './widgets';
import type { Collection } from '@/lib/api-client';

interface Position {
  x: number;
  y: number;
}

type TabType = 'site' | 'page' | 'navigation' | 'projection' | 'carousel';

interface LightboardProps {
  collection?: Collection | null;
}

export default function Lightboard({ collection }: LightboardProps) {
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

  // Navigation settings
  const [navRollbackDelay, setNavRollbackDelay] = useState(300);
  const [navRollbackSpeed, setNavRollbackSpeed] = useState(300);
  const [navIndentSpacing, setNavIndentSpacing] = useState(16);
  const [navVerticalSpacing, setNavVerticalSpacing] = useState(4);
  const [navFontFamily, setNavFontFamily] = useState('system');
  const [navFontSize, setNavFontSize] = useState(16);
  const [navActiveTextColor, setNavActiveTextColor] = useState('#ffffff');
  const [navHoverTextColor, setNavHoverTextColor] = useState('#ffffff');
  const [navActiveBackgroundColor, setNavActiveBackgroundColor] = useState('rgba(255, 255, 255, 0.1)');
  const [navHoverBackgroundColor, setNavHoverBackgroundColor] = useState('rgba(255, 255, 255, 0.05)');
  const [navDrawerBackgroundColor, setNavDrawerBackgroundColor] = useState('rgba(0, 0, 0, 0.8)');
  const [navBorderColor, setNavBorderColor] = useState('rgba(255, 255, 255, 0.2)');
  const [navShowHomeIcon, setNavShowHomeIcon] = useState(true);
  const [navHighlightStyle, setNavHighlightStyle] = useState('border-bg');

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

  // Load collection config when collection is provided
  useEffect(() => {
    if (collection) {
      setCurrentCollectionName(collection.name);

      // If collection has a config, load it into the editor
      if (collection.config) {
        setConfigJson(JSON.stringify(collection.config, null, 2));
      } else {
        // Set default template if no config
        setConfigJson(JSON.stringify({
          layoutType: 'dynamic',
          title: collection.name,
          subtitle: `${collection.imageCount} images`,
          dynamicSettings: {
            layout: 'single-column',
            imagesPerCarousel: 20,
            carouselDefaults: {
              transition: 'fade',
              reservedSpace: { bottom: 80 },
            },
          },
        }, null, 2));
      }
    }
  }, [collection]);

  // Site Settings Callbacks
  const handleSaveSiteSettings = async () => {
    setIsSavingSite(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/site/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteTitle,
          tagline: siteTagline,
          branding: {
            favicon: faviconUrl,
            logo: logoUrl,
            primaryColor: backgroundColor,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save site settings');
      }

      const result = await response.json();
      if (result.success) {
        alert('Site settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving site settings:', error);
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingSite(false);
    }
  };

  const handleLoadCurrentSettings = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/site/config`);

      if (!response.ok) {
        throw new Error('Failed to load site settings');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setSiteTitle(data.siteName || '');
        setSiteTagline(data.tagline || '');
        setFaviconUrl(data.branding?.favicon || '');
        setLogoUrl(data.branding?.logo || '');
        setBackgroundColor(data.branding?.primaryColor || '#000000');

        console.log('Site settings loaded successfully');
      }
    } catch (error) {
      console.error('Error loading site settings:', error);
      alert(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Page Settings Callbacks
  const handleApplyPreview = () => {
    try {
      // Parse and validate JSON
      const parsed = JSON.parse(configJson);
      console.log('Preview applied (local state updated):', parsed);
      alert('Preview applied! Configuration is valid.\n\nNote: Live preview updates will be implemented in the next phase.');
      // TODO: Trigger LivePreview component re-render with new config
    } catch (error) {
      console.error('Invalid JSON configuration:', error);
      alert(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  };

  const handleSaveToGallery = async () => {
    setIsSavingPage(true);
    try {
      // Use collection slug if available
      const slug = collection?.slug || currentCollectionName || 'home';

      if (!slug) {
        throw new Error('No collection loaded. Cannot save configuration.');
      }

      // Validate JSON before sending
      const configData = JSON.parse(configJson);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/admin/config/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to save page configuration (HTTP ${response.status})`);
        } else {
          throw new Error(`Failed to save page configuration (HTTP ${response.status}). The endpoint may not exist.`);
        }
      }

      const result = await response.json();
      if (result.success) {
        alert(`Configuration saved successfully!\n\nCollection: ${slug}`);
      }
    } catch (error) {
      console.error('Error saving page configuration:', error);
      alert(`Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Navigation settings handlers
  const handleSaveNavSettings = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const navConfig = {
        timing: { rollbackDelay: navRollbackDelay, rollbackSpeed: navRollbackSpeed },
        spacing: { indent: navIndentSpacing, vertical: navVerticalSpacing },
        typography: { fontFamily: navFontFamily, fontSize: navFontSize },
        colors: {
          activeText: navActiveTextColor,
          hoverText: navHoverTextColor,
          activeBackground: navActiveBackgroundColor,
          hoverBackground: navHoverBackgroundColor,
          drawerBackground: navDrawerBackgroundColor,
          border: navBorderColor,
        },
        visual: { showHomeIcon: navShowHomeIcon, highlightStyle: navHighlightStyle },
      };

      const response = await fetch(`${API_BASE_URL}/api/site/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navigation: navConfig }),
      });

      if (!response.ok) throw new Error('Failed to save navigation settings');
      alert('Navigation settings saved successfully!');
    } catch (error) {
      console.error('Error saving navigation settings:', error);
      alert('Failed to save navigation settings');
    }
  };

  const handleResetNavSettings = () => {
    setNavRollbackDelay(300);
    setNavRollbackSpeed(300);
    setNavIndentSpacing(16);
    setNavVerticalSpacing(4);
    setNavFontFamily('system');
    setNavFontSize(16);
    setNavActiveTextColor('#ffffff');
    setNavHoverTextColor('#ffffff');
    setNavActiveBackgroundColor('rgba(255, 255, 255, 0.1)');
    setNavHoverBackgroundColor('rgba(255, 255, 255, 0.05)');
    setNavDrawerBackgroundColor('rgba(0, 0, 0, 0.8)');
    setNavBorderColor('rgba(255, 255, 255, 0.2)');
    setNavShowHomeIcon(true);
    setNavHighlightStyle('border-bg');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'site', label: 'Site' },
    { id: 'page', label: 'Page' },
    { id: 'navigation', label: 'Navigation' },
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
            currentCollectionName={collection?.name || currentCollectionName}
            isSaving={isSavingPage}
          />
        );
      case 'navigation':
        return (
          <NavigationSettingsWidget
            // Timing
            rollbackDelay={navRollbackDelay}
            rollbackSpeed={navRollbackSpeed}
            onRollbackDelayChange={setNavRollbackDelay}
            onRollbackSpeedChange={setNavRollbackSpeed}

            // Spacing
            indentSpacing={navIndentSpacing}
            verticalSpacing={navVerticalSpacing}
            onIndentSpacingChange={setNavIndentSpacing}
            onVerticalSpacingChange={setNavVerticalSpacing}

            // Typography
            fontFamily={navFontFamily}
            fontSize={navFontSize}
            onFontFamilyChange={setNavFontFamily}
            onFontSizeChange={setNavFontSize}

            // Colors
            activeTextColor={navActiveTextColor}
            hoverTextColor={navHoverTextColor}
            activeBackgroundColor={navActiveBackgroundColor}
            hoverBackgroundColor={navHoverBackgroundColor}
            drawerBackgroundColor={navDrawerBackgroundColor}
            borderColor={navBorderColor}
            onActiveTextColorChange={setNavActiveTextColor}
            onHoverTextColorChange={setNavHoverTextColor}
            onActiveBackgroundColorChange={setNavActiveBackgroundColor}
            onHoverBackgroundColorChange={setNavHoverBackgroundColor}
            onDrawerBackgroundColorChange={setNavDrawerBackgroundColor}
            onBorderColorChange={setNavBorderColor}

            // Visual
            showHomeIcon={navShowHomeIcon}
            highlightStyle={navHighlightStyle}
            onShowHomeIconChange={setNavShowHomeIcon}
            onHighlightStyleChange={setNavHighlightStyle}

            // Actions
            onSave={handleSaveNavSettings}
            onReset={handleResetNavSettings}
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
