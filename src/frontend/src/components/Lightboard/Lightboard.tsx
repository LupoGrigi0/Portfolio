'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useProjectionManager } from '@/components/Layout';
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

interface DirtyState {
  site: boolean;      // Site + Navigation settings changed
  page: boolean;      // Page + Projection + Carousel settings changed
  timestamp: number;  // When last changed
}

interface StateSnapshot {
  timestamp: number;
  description: string;
  state: {
    // Site settings
    siteTitle: string;
    siteTagline: string;
    faviconUrl: string;
    logoUrl: string;
    backgroundColor: string;
    // Page settings
    configJson: string;
    // Projection settings
    fadeDistance: number;
    maxBlur: number;
    projectionScaleX: number;
    projectionScaleY: number;
    blendMode: string;
    vignetteWidth: number;
    vignetteStrength: number;
    checkerboardEnabled: boolean;
    checkerboardTileSize: number;
    checkerboardScatterSpeed: number;
    checkerboardBlur: number;
    // Carousel settings
    transition: string;
    autoplay: boolean;
    interval: number;
    speed: number;
    reservedSpaceTop: number;
    reservedSpaceBottom: number;
    reservedSpaceLeft: number;
    reservedSpaceRight: number;
    // Navigation settings
    navRollbackDelay: number;
    navRollbackSpeed: number;
    navIndentSpacing: number;
    navVerticalSpacing: number;
    navFontFamily: string;
    navFontSize: number;
    navActiveTextColor: string;
    navHoverTextColor: string;
    navActiveBackgroundColor: string;
    navHoverBackgroundColor: string;
    navDrawerBackgroundColor: string;
    navBorderColor: string;
    navShowHomeIcon: boolean;
    navHighlightStyle: string;
  };
}

export default function Lightboard({ collection }: LightboardProps) {
  // Phase 1a - Lux: Fetch collection based on current URL instead of relying on context
  // (Lightboard is rendered in layout.tsx, outside of CollectionConfigProvider)
  const pathname = usePathname(); // Next.js hook that updates on navigation
  const [activeCollection, setActiveCollection] = useState<Collection | null>(collection || null);

  // Phase 2a - Lux: Connect to ProjectionManager for live projection control
  const projectionManager = useProjectionManager();

  // Helper: Trigger projection recalculation by firing a minimal scroll event
  const triggerProjectionUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('scroll'));
    }
  };

  // Wrapper setters that trigger immediate update (Phase 2 - Lux: Instant preview)
  const setFadeDistanceWithUpdate = (value: number) => {
    projectionManager.setFadeDistance(value);
    triggerProjectionUpdate();
  };
  const setMaxBlurWithUpdate = (value: number) => {
    projectionManager.setMaxBlur(value);
    triggerProjectionUpdate();
  };
  const setProjectionScaleXWithUpdate = (value: number) => {
    projectionManager.setProjectionScaleX(value);
    triggerProjectionUpdate();
  };
  const setProjectionScaleYWithUpdate = (value: number) => {
    projectionManager.setProjectionScaleY(value);
    triggerProjectionUpdate();
  };
  const setBlendModeWithUpdate = (value: string) => {
    projectionManager.setBlendMode(value);
    triggerProjectionUpdate();
  };
  const setVignetteWidthWithUpdate = (value: number) => {
    projectionManager.setVignetteWidth(value);
    triggerProjectionUpdate();
  };
  const setVignetteStrengthWithUpdate = (value: number) => {
    projectionManager.setVignetteStrength(value);
    triggerProjectionUpdate();
  };
  const setCheckerboardEnabledWithUpdate = (value: boolean) => {
    projectionManager.setCheckerboardEnabled(value);
    triggerProjectionUpdate();
  };
  const setCheckerboardTileSizeWithUpdate = (value: number) => {
    projectionManager.setCheckerboardTileSize(value);
    triggerProjectionUpdate();
  };
  const setCheckerboardScatterSpeedWithUpdate = (value: number) => {
    projectionManager.setCheckerboardScatterSpeed(value);
    triggerProjectionUpdate();
  };
  const setCheckerboardBlurWithUpdate = (value: number) => {
    projectionManager.setCheckerboardBlur(value);
    triggerProjectionUpdate();
  };

  // Detect current page URL and fetch collection (runs on mount AND navigation)
  useEffect(() => {
    console.log('[Lightboard] Pathname changed:', pathname);

    // Check if we're on a collection page (/collections/:slug or /home)
    const collectionMatch = pathname.match(/^\/collections\/([^\/]+)/);
    const isHomePage = pathname === '/' || pathname === '/home';

    let slugToFetch: string | null = null;

    if (collectionMatch) {
      slugToFetch = collectionMatch[1];
    } else if (isHomePage) {
      slugToFetch = 'home';
    }

    if (slugToFetch) {
      console.log('[Lightboard] Fetching collection:', slugToFetch);
      // Import and fetch collection data
      import('@/lib/api-client').then(({ getCollection }) => {
        getCollection(slugToFetch).then(fetchedCollection => {
          if (fetchedCollection) {
            setActiveCollection(fetchedCollection);
            console.log('[Lightboard] Successfully fetched collection:', fetchedCollection.slug);
          }
        }).catch(err => {
          console.error('[Lightboard] Error fetching collection:', err);
        });
      });
    } else {
      // Not on a collection page
      setActiveCollection(null);
      console.log('[Lightboard] Not on a collection page, clearing collection');
    }
  }, [pathname]); // Re-run when pathname changes (navigation!)

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('site');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Panel resize state
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lightboard-panel-width');
      return saved ? parseInt(saved) : 600;
    }
    return 600;
  });
  const [panelHeight, setPanelHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lightboard-panel-height');
      return saved ? parseInt(saved) : 600;
    }
    return 600;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  // Dirty State Tracking System
  const [dirtyState, setDirtyState] = useState<DirtyState>({
    site: false,
    page: false,
    timestamp: Date.now(),
  });

  // Track pending text changes that need "Apply"
  const [hasPendingTextChanges, setHasPendingTextChanges] = useState(false);
  const textChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Undo/Redo System
  const MAX_HISTORY = 20;
  const [history, setHistory] = useState<StateSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRef = useRef(false); // Prevent taking snapshots during undo/redo

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

  // Dirty State Helper Functions
  const markDirty = (scope: 'site' | 'page') => {
    setDirtyState(prev => ({ ...prev, [scope]: true, timestamp: Date.now() }));
  };

  const clearDirty = (scope: 'site' | 'page') => {
    setDirtyState(prev => ({ ...prev, [scope]: false }));
  };

  const isDirty = (scope: 'site' | 'page') => {
    return dirtyState[scope];
  };

  // Undo/Redo Helper Functions
  const captureCurrentState = (): StateSnapshot['state'] => ({
    siteTitle,
    siteTagline,
    faviconUrl,
    logoUrl,
    backgroundColor,
    configJson,
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
    transition,
    autoplay,
    interval,
    speed,
    reservedSpaceTop,
    reservedSpaceBottom,
    reservedSpaceLeft,
    reservedSpaceRight,
    navRollbackDelay,
    navRollbackSpeed,
    navIndentSpacing,
    navVerticalSpacing,
    navFontFamily,
    navFontSize,
    navActiveTextColor,
    navHoverTextColor,
    navActiveBackgroundColor,
    navHoverBackgroundColor,
    navDrawerBackgroundColor,
    navBorderColor,
    navShowHomeIcon,
    navHighlightStyle,
  });

  const restoreState = (snapshot: StateSnapshot) => {
    isUndoingRef.current = true;
    const s = snapshot.state;

    // Restore site settings
    setSiteTitle(s.siteTitle);
    setSiteTagline(s.siteTagline);
    setFaviconUrl(s.faviconUrl);
    setLogoUrl(s.logoUrl);
    setBackgroundColor(s.backgroundColor);

    // Restore page settings
    setConfigJson(s.configJson);

    // Restore projection settings
    setFadeDistance(s.fadeDistance);
    setMaxBlur(s.maxBlur);
    setProjectionScaleX(s.projectionScaleX);
    setProjectionScaleY(s.projectionScaleY);
    setBlendMode(s.blendMode);
    setVignetteWidth(s.vignetteWidth);
    setVignetteStrength(s.vignetteStrength);
    setCheckerboardEnabled(s.checkerboardEnabled);
    setCheckerboardTileSize(s.checkerboardTileSize);
    setCheckerboardScatterSpeed(s.checkerboardScatterSpeed);
    setCheckerboardBlur(s.checkerboardBlur);

    // Restore carousel settings
    setTransition(s.transition);
    setAutoplay(s.autoplay);
    setInterval(s.interval);
    setSpeed(s.speed);
    setReservedSpaceTop(s.reservedSpaceTop);
    setReservedSpaceBottom(s.reservedSpaceBottom);
    setReservedSpaceLeft(s.reservedSpaceLeft);
    setReservedSpaceRight(s.reservedSpaceRight);

    // Restore navigation settings
    setNavRollbackDelay(s.navRollbackDelay);
    setNavRollbackSpeed(s.navRollbackSpeed);
    setNavIndentSpacing(s.navIndentSpacing);
    setNavVerticalSpacing(s.navVerticalSpacing);
    setNavFontFamily(s.navFontFamily);
    setNavFontSize(s.navFontSize);
    setNavActiveTextColor(s.navActiveTextColor);
    setNavHoverTextColor(s.navHoverTextColor);
    setNavActiveBackgroundColor(s.navActiveBackgroundColor);
    setNavHoverBackgroundColor(s.navHoverBackgroundColor);
    setNavDrawerBackgroundColor(s.navDrawerBackgroundColor);
    setNavBorderColor(s.navBorderColor);
    setNavShowHomeIcon(s.navShowHomeIcon);
    setNavHighlightStyle(s.navHighlightStyle);

    // Reset undoing flag after state updates
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);
  };

  const takeSnapshot = (description: string) => {
    if (isUndoingRef.current) return; // Don't take snapshots during undo/redo

    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      description,
      state: captureCurrentState(),
    };

    // Truncate future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);

    // Keep only last MAX_HISTORY snapshots
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return; // Nothing to undo
    const prevSnapshot = history[historyIndex - 1];
    restoreState(prevSnapshot);
    setHistoryIndex(historyIndex - 1);

    // Clear dirty state if we're back at initial state
    if (historyIndex - 1 === 0) {
      setDirtyState({ site: false, page: false, timestamp: Date.now() });
    }

    console.log(`Undo: ${prevSnapshot.description}`);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return; // Nothing to redo
    const nextSnapshot = history[historyIndex + 1];
    restoreState(nextSnapshot);
    setHistoryIndex(historyIndex + 1);
    console.log(`Redo: ${nextSnapshot.description}`);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handle text field changes (debounced to detect when typing stops)
  const handleTextFieldChange = () => {
    setHasPendingTextChanges(true);

    // Clear existing timer
    if (textChangeTimerRef.current) {
      clearTimeout(textChangeTimerRef.current);
    }
  };

  // Apply text field changes (forces state update and snapshot)
  const handleApplyTextChanges = () => {
    setHasPendingTextChanges(false);
    takeSnapshot('Text changes applied');
  };

  // Tab change handler with animation
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150); // Half of the CSS transition duration
  };

  // Enhanced setters that automatically mark dirty
  const setSiteTitleDirty = (value: string) => { setSiteTitle(value); markDirty('site'); handleTextFieldChange(); };
  const setSiteTaglineDirty = (value: string) => { setSiteTagline(value); markDirty('site'); handleTextFieldChange(); };
  const setFaviconUrlDirty = (value: string) => { setFaviconUrl(value); markDirty('site'); handleTextFieldChange(); };
  const setLogoUrlDirty = (value: string) => { setLogoUrl(value); markDirty('site'); handleTextFieldChange(); };
  const setBackgroundColorDirty = (value: string) => { setBackgroundColor(value); markDirty('site'); };

  const setConfigJsonDirty = (value: string) => { setConfigJson(value); markDirty('page'); handleTextFieldChange(); };

  const setFadeDistanceDirty = (value: number) => { setFadeDistance(value); markDirty('page'); };
  const setMaxBlurDirty = (value: number) => { setMaxBlur(value); markDirty('page'); };
  const setProjectionScaleXDirty = (value: number) => { setProjectionScaleX(value); markDirty('page'); };
  const setProjectionScaleYDirty = (value: number) => { setProjectionScaleY(value); markDirty('page'); };
  const setBlendModeDirty = (value: string) => { setBlendMode(value); markDirty('page'); };
  const setVignetteWidthDirty = (value: number) => { setVignetteWidth(value); markDirty('page'); };
  const setVignetteStrengthDirty = (value: number) => { setVignetteStrength(value); markDirty('page'); };
  const setCheckerboardEnabledDirty = (value: boolean) => { setCheckerboardEnabled(value); markDirty('page'); };
  const setCheckerboardTileSizeDirty = (value: number) => { setCheckerboardTileSize(value); markDirty('page'); };
  const setCheckerboardScatterSpeedDirty = (value: number) => { setCheckerboardScatterSpeed(value); markDirty('page'); };
  const setCheckerboardBlurDirty = (value: number) => { setCheckerboardBlur(value); markDirty('page'); };

  const setTransitionDirty = (value: string) => { setTransition(value); markDirty('page'); };
  const setAutoplayDirty = (value: boolean) => { setAutoplay(value); markDirty('page'); };
  const setIntervalDirty = (value: number) => { setInterval(value); markDirty('page'); };
  const setSpeedDirty = (value: number) => { setSpeed(value); markDirty('page'); };
  const setReservedSpaceTopDirty = (value: number) => { setReservedSpaceTop(value); markDirty('page'); };
  const setReservedSpaceBottomDirty = (value: number) => { setReservedSpaceBottom(value); markDirty('page'); };
  const setReservedSpaceLeftDirty = (value: number) => { setReservedSpaceLeft(value); markDirty('page'); };
  const setReservedSpaceRightDirty = (value: number) => { setReservedSpaceRight(value); markDirty('page'); };

  const setNavRollbackDelayDirty = (value: number) => { setNavRollbackDelay(value); markDirty('site'); };
  const setNavRollbackSpeedDirty = (value: number) => { setNavRollbackSpeed(value); markDirty('site'); };
  const setNavIndentSpacingDirty = (value: number) => { setNavIndentSpacing(value); markDirty('site'); };
  const setNavVerticalSpacingDirty = (value: number) => { setNavVerticalSpacing(value); markDirty('site'); };
  const setNavFontFamilyDirty = (value: string) => { setNavFontFamily(value); markDirty('site'); };
  const setNavFontSizeDirty = (value: number) => { setNavFontSize(value); markDirty('site'); };
  const setNavActiveTextColorDirty = (value: string) => { setNavActiveTextColor(value); markDirty('site'); };
  const setNavHoverTextColorDirty = (value: string) => { setNavHoverTextColor(value); markDirty('site'); };
  const setNavActiveBackgroundColorDirty = (value: string) => { setNavActiveBackgroundColor(value); markDirty('site'); };
  const setNavHoverBackgroundColorDirty = (value: string) => { setNavHoverBackgroundColor(value); markDirty('site'); };
  const setNavDrawerBackgroundColorDirty = (value: string) => { setNavDrawerBackgroundColor(value); markDirty('site'); };
  const setNavBorderColorDirty = (value: string) => { setNavBorderColor(value); markDirty('site'); };
  const setNavShowHomeIconDirty = (value: boolean) => { setNavShowHomeIcon(value); markDirty('site'); };
  const setNavHighlightStyleDirty = (value: string) => { setNavHighlightStyle(value); markDirty('site'); };

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

  // Panel resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeHeightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHeight(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const clampedWidth = Math.max(400, Math.min(window.innerWidth * 0.8, newWidth));
        setPanelWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lightboard-panel-width', panelWidth.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelWidth]);

  useEffect(() => {
    if (!isResizingHeight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingHeight && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        const clampedHeight = Math.max(300, Math.min(window.innerHeight * 0.9, newHeight));
        setPanelHeight(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lightboard-panel-height', panelHeight.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHeight, panelHeight]);

  // Load collection config when collection changes (Phase 1a - Lux: Fixed dependency)
  useEffect(() => {
    if (activeCollection) {
      setCurrentCollectionName(activeCollection.name);

      // If collection has a config, load it into the editor
      if (activeCollection.config) {
        setConfigJson(JSON.stringify(activeCollection.config, null, 2));
        console.log('[Lightboard] Collection config loaded:', activeCollection.slug, '- Config keys:', Object.keys(activeCollection.config));
      } else {
        // Set default template if no config
        const defaultConfig = {
          layoutType: 'dynamic',
          title: activeCollection.name,
          subtitle: `${activeCollection.imageCount} images`,
          dynamicSettings: {
            layout: 'single-column',
            imagesPerCarousel: 20,
            carouselDefaults: {
              transition: 'fade',
              reservedSpace: { bottom: 80 },
            },
          },
        };
        setConfigJson(JSON.stringify(defaultConfig, null, 2));
        console.log('[Lightboard] No config found for collection:', activeCollection.slug, '- Using default template');
      }

      // Log collection change for debugging
      console.log('[Lightboard] Collection changed:', activeCollection.slug);
    }
  }, [activeCollection?.slug, activeCollection?.config]); // Fixed: Watch slug and config, not whole object

  // Load site settings AND navigation settings from API on mount
  useEffect(() => {
    const loadSiteAndNavigationSettings = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${API_BASE_URL}/api/site/config`);

        if (!response.ok) {
          console.warn('[Lightboard] Failed to load site settings from API');
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;

          // Load site branding settings (Phase 0.5a - Lux)
          if (data.siteName !== undefined) setSiteTitle(data.siteName);
          if (data.tagline !== undefined) setSiteTagline(data.tagline);
          if (data.branding) {
            if (data.branding.favicon !== undefined) setFaviconUrl(data.branding.favicon);
            if (data.branding.logo !== undefined) setLogoUrl(data.branding.logo);
            if (data.branding.primaryColor !== undefined) setBackgroundColor(data.branding.primaryColor);
          }

          // Load navigation settings
          if (data.navigation) {
            const nav = data.navigation;

            // Populate timing settings
            if (nav.timing) {
              if (nav.timing.rollbackDelay !== undefined) setNavRollbackDelay(nav.timing.rollbackDelay);
              if (nav.timing.rollbackSpeed !== undefined) setNavRollbackSpeed(nav.timing.rollbackSpeed);
            }

            // Populate spacing settings
            if (nav.spacing) {
              if (nav.spacing.indent !== undefined) setNavIndentSpacing(nav.spacing.indent);
              if (nav.spacing.vertical !== undefined) setNavVerticalSpacing(nav.spacing.vertical);
            }

            // Populate typography settings
            if (nav.typography) {
              if (nav.typography.fontFamily !== undefined) setNavFontFamily(nav.typography.fontFamily);
              if (nav.typography.fontSize !== undefined) setNavFontSize(nav.typography.fontSize);
            }

            // Populate color settings
            if (nav.colors) {
              if (nav.colors.activeText !== undefined) setNavActiveTextColor(nav.colors.activeText);
              if (nav.colors.hoverText !== undefined) setNavHoverTextColor(nav.colors.hoverText);
              if (nav.colors.activeBackground !== undefined) setNavActiveBackgroundColor(nav.colors.activeBackground);
              if (nav.colors.hoverBackground !== undefined) setNavHoverBackgroundColor(nav.colors.hoverBackground);
              if (nav.colors.drawerBackground !== undefined) setNavDrawerBackgroundColor(nav.colors.drawerBackground);
              if (nav.colors.border !== undefined) setNavBorderColor(nav.colors.border);
            }

            // Populate visual settings
            if (nav.visual) {
              if (nav.visual.showHomeIcon !== undefined) setNavShowHomeIcon(nav.visual.showHomeIcon);
              if (nav.visual.highlightStyle !== undefined) setNavHighlightStyle(nav.visual.highlightStyle);
            }
          }

          console.log('[Lightboard] Site and navigation settings loaded successfully from API');
        }
      } catch (error) {
        console.error('[Lightboard] Error loading site settings:', error);
        // Silently fail and use defaults
      }
    };

    loadSiteAndNavigationSettings();
  }, []); // Run once on mount

  // Take initial snapshot when Lightboard opens
  useEffect(() => {
    if (isOpen && history.length === 0) {
      takeSnapshot('Initial state');
    }
  }, [isOpen]);

  // Take debounced snapshots when state changes
  useEffect(() => {
    if (!isOpen || isUndoingRef.current) return;

    const timer = setTimeout(() => {
      takeSnapshot('Settings changed');
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [
    siteTitle, siteTagline, faviconUrl, logoUrl, backgroundColor,
    configJson, fadeDistance, maxBlur, projectionScaleX, projectionScaleY,
    blendMode, vignetteWidth, vignetteStrength, checkerboardEnabled,
    checkerboardTileSize, checkerboardScatterSpeed, checkerboardBlur,
    transition, autoplay, interval, speed, reservedSpaceTop,
    reservedSpaceBottom, reservedSpaceLeft, reservedSpaceRight,
    navRollbackDelay, navRollbackSpeed, navIndentSpacing, navVerticalSpacing,
    navFontFamily, navFontSize, navActiveTextColor, navHoverTextColor,
    navActiveBackgroundColor, navHoverBackgroundColor, navDrawerBackgroundColor,
    navBorderColor, navShowHomeIcon, navHighlightStyle
  ]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Lightboard is open
      if (!isOpen) return;

      // Check for Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Check for Ctrl/Cmd + Shift + Z (Redo) or Ctrl/Cmd + Y (Redo)
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, undo, redo]);

  // Site Settings Callbacks (Phase 0.5b - Lux: Save BOTH site branding AND navigation)
  const handleSaveSiteSettings = async () => {
    setIsSavingSite(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Prepare navigation config
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

      // Send both site branding AND navigation settings
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
          navigation: navConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save site settings');
      }

      const result = await response.json();
      if (result.success) {
        clearDirty('site'); // Clear dirty state on successful save
        console.log('[Lightboard] Site settings (branding + navigation) saved successfully');
        alert('Site settings saved successfully!');
      }
    } catch (error) {
      console.error('[Lightboard] Error saving site settings:', error);
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
      // Use collection slug if available (prefer context over prop)
      const slug = activeCollection?.slug || currentCollectionName || 'home';

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
        clearDirty('page'); // Clear dirty state on successful save
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

  // Projection Settings Callbacks (Phase 2d - Lux: Read from ProjectionManager)
  const handleSyncToConfig = async () => {
    try {
      const settings = projectionManager.globalSettings;
      const projectionConfig = {
        fadeDistance: settings.fadeDistance,
        maxBlur: settings.maxBlur,
        scaleX: settings.scaleX,
        scaleY: settings.scaleY,
        blendMode: settings.blendMode,
        vignette: {
          width: settings.vignette.width,
          strength: settings.vignette.strength,
        },
        checkerboard: {
          enabled: settings.checkerboard.enabled,
          tileSize: settings.checkerboard.tileSize,
          scatterSpeed: settings.checkerboard.scatterSpeed,
          blur: settings.checkerboard.blur,
        },
      };

      // Parse existing config and merge projection settings
      const config = JSON.parse(configJson);
      config.projection = projectionConfig;
      setConfigJson(JSON.stringify(config, null, 2));
      markDirty('page'); // Mark page as dirty so Save Page button enables

      console.log('[Lightboard] Projection settings synced to config');
    } catch (error) {
      console.error('[Lightboard] Error syncing projection settings:', error);
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
      clearDirty('site'); // Clear dirty state on successful save
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
            setSiteTitle={setSiteTitleDirty}
            siteTagline={siteTagline}
            setSiteTagline={setSiteTaglineDirty}
            faviconUrl={faviconUrl}
            setFaviconUrl={setFaviconUrlDirty}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrlDirty}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColorDirty}
            onSaveSiteSettings={handleSaveSiteSettings}
            onLoadCurrentSettings={handleLoadCurrentSettings}
            isSaving={isSavingSite}
          />
        );
      case 'page':
        return (
          <PageSettingsWidget
            configJson={configJson}
            setConfigJson={setConfigJsonDirty}
            onApplyPreview={handleApplyPreview}
            onSaveToGallery={handleSaveToGallery}
            onLoadTemplate={handleLoadTemplate}
            onCopyJSON={handleCopyJSON}
            currentCollectionName={activeCollection?.name || currentCollectionName}
            isSaving={isSavingPage}
          />
        );
      case 'navigation':
        return (
          <NavigationSettingsWidget
            // Timing
            rollbackDelay={navRollbackDelay}
            rollbackSpeed={navRollbackSpeed}
            onRollbackDelayChange={setNavRollbackDelayDirty}
            onRollbackSpeedChange={setNavRollbackSpeedDirty}

            // Spacing
            indentSpacing={navIndentSpacing}
            verticalSpacing={navVerticalSpacing}
            onIndentSpacingChange={setNavIndentSpacingDirty}
            onVerticalSpacingChange={setNavVerticalSpacingDirty}

            // Typography
            fontFamily={navFontFamily}
            fontSize={navFontSize}
            onFontFamilyChange={setNavFontFamilyDirty}
            onFontSizeChange={setNavFontSizeDirty}

            // Colors
            activeTextColor={navActiveTextColor}
            hoverTextColor={navHoverTextColor}
            activeBackgroundColor={navActiveBackgroundColor}
            hoverBackgroundColor={navHoverBackgroundColor}
            drawerBackgroundColor={navDrawerBackgroundColor}
            borderColor={navBorderColor}
            onActiveTextColorChange={setNavActiveTextColorDirty}
            onHoverTextColorChange={setNavHoverTextColorDirty}
            onActiveBackgroundColorChange={setNavActiveBackgroundColorDirty}
            onHoverBackgroundColorChange={setNavHoverBackgroundColorDirty}
            onDrawerBackgroundColorChange={setNavDrawerBackgroundColorDirty}
            onBorderColorChange={setNavBorderColorDirty}

            // Visual
            showHomeIcon={navShowHomeIcon}
            highlightStyle={navHighlightStyle}
            onShowHomeIconChange={setNavShowHomeIconDirty}
            onHighlightStyleChange={setNavHighlightStyleDirty}

            // Actions (Phase 0.5b - Lux: Use unified save handler)
            onSave={handleSaveSiteSettings}
            onReset={handleResetNavSettings}
          />
        );
      case 'projection':
        // Phase 2a/2b - Lux: Wire directly to ProjectionManager for instant live preview
        // Projection settings bypass local state/undo/redo - they're live controls
        return (
          <ProjectionSettingsWidget
            fadeDistance={projectionManager.globalSettings.fadeDistance}
            maxBlur={projectionManager.globalSettings.maxBlur}
            projectionScaleX={projectionManager.globalSettings.scaleX}
            projectionScaleY={projectionManager.globalSettings.scaleY}
            blendMode={projectionManager.globalSettings.blendMode}
            vignetteWidth={projectionManager.globalSettings.vignette.width}
            vignetteStrength={projectionManager.globalSettings.vignette.strength}
            checkerboardEnabled={projectionManager.globalSettings.checkerboard.enabled}
            checkerboardTileSize={projectionManager.globalSettings.checkerboard.tileSize}
            checkerboardScatterSpeed={projectionManager.globalSettings.checkerboard.scatterSpeed}
            checkerboardBlur={projectionManager.globalSettings.checkerboard.blur}
            setFadeDistance={setFadeDistanceWithUpdate}
            setMaxBlur={setMaxBlurWithUpdate}
            setProjectionScaleX={setProjectionScaleXWithUpdate}
            setProjectionScaleY={setProjectionScaleYWithUpdate}
            setBlendMode={setBlendModeWithUpdate}
            setVignetteWidth={setVignetteWidthWithUpdate}
            setVignetteStrength={setVignetteStrengthWithUpdate}
            setCheckerboardEnabled={setCheckerboardEnabledWithUpdate}
            setCheckerboardTileSize={setCheckerboardTileSizeWithUpdate}
            setCheckerboardScatterSpeed={setCheckerboardScatterSpeedWithUpdate}
            setCheckerboardBlur={setCheckerboardBlurWithUpdate}
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
            setTransition={setTransitionDirty}
            setAutoplay={setAutoplayDirty}
            setInterval={setIntervalDirty}
            setSpeed={setSpeedDirty}
            setReservedSpaceTop={setReservedSpaceTopDirty}
            setReservedSpaceBottom={setReservedSpaceBottomDirty}
            setReservedSpaceLeft={setReservedSpaceLeftDirty}
            setReservedSpaceRight={setReservedSpaceRightDirty}
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
            width: `${panelWidth}px`,
            height: `${panelHeight}px`,
          }}
          className="fixed z-[9998] select-none flex flex-col"
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden relative flex flex-col h-full">
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
                <span className="text-[7px] text-gray-600 opacity-30 hover:opacity-100 transition-opacity ml-1" title="Crafted with care">by Kai</span>
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
              {tabs.map((tab) => {
                // Determine if this tab should show a red dot
                let showDirtyBadge = false;
                if (tab.id === 'site') {
                  showDirtyBadge = isDirty('site');
                } else if (tab.id === 'page' || tab.id === 'projection' || tab.id === 'carousel') {
                  showDirtyBadge = isDirty('page');
                } else if (tab.id === 'navigation') {
                  showDirtyBadge = isDirty('site');
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`lightboard-tab flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                      activeTab === tab.id
                        ? 'text-blue-400 bg-gray-800/50'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                    }`}
                  >
                    {tab.label}
                    {showDirtyBadge && (
                      <div className="tab-badge"></div>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className={`lightboard-content flex-1 p-6 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {renderTabContent()}
            </div>

            {/* Unified Action Bar */}
            <div className="border-t border-gray-700/50 bg-gray-900/80 p-3 flex items-center gap-2 flex-wrap">
              {/* Apply button for text changes */}
              <button
                onClick={handleApplyTextChanges}
                disabled={!hasPendingTextChanges}
                className="px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Apply text field changes"
              >
                Apply
              </button>

              <div className="w-px h-6 bg-gray-700" />

              {/* Primary Actions */}
              <button
                onClick={handleSaveSiteSettings}
                disabled={!isDirty('site') || isSavingSite}
                className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Site
              </button>
              <button
                onClick={handleSaveToGallery}
                disabled={!isDirty('page') || isSavingPage}
                className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Page
              </button>

              <div className="w-px h-6 bg-gray-700" />

              {/* Secondary Actions */}
              <button
                onClick={() => {
                  const configData = JSON.parse(configJson);
                  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${activeCollection?.slug || 'config'}-config.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors"
              >
                Download
              </button>
              <label className="px-3 py-1.5 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors cursor-pointer">
                Upload
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const config = JSON.parse(content);
                        setConfigJson(JSON.stringify(config, null, 2));
                        markDirty('page');
                        alert('Config loaded successfully!');
                      } catch (error) {
                        alert('Invalid JSON file');
                      }
                    };
                    reader.readAsText(file);
                    // Reset input
                    e.target.value = '';
                  }}
                />
              </label>

              <div className="w-px h-6 bg-gray-700" />

              {/* Undo/Redo */}
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
              >
                Redo
              </button>

              {/* Status indicator */}
              <div className="ml-auto text-xs text-gray-400">
                {(isDirty('site') || isDirty('page')) && '● Unsaved changes'}
                {historyIndex > 0 && ` • History: ${historyIndex}/${history.length - 1}`}
              </div>
            </div>

            {/* Right Resize Handle */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-500/20 transition-colors z-10"
              style={{ cursor: isResizing ? 'col-resize' : 'ew-resize' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-600/50 rounded-l-full" />
            </div>

            {/* Bottom Resize Handle */}
            <div
              onMouseDown={handleResizeHeightMouseDown}
              className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-cyan-500/20 transition-colors z-10"
              style={{ cursor: isResizingHeight ? 'row-resize' : 'ns-resize' }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-gray-600/50 rounded-t-full" />
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
        .tab-badge {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          position: absolute;
          top: 8px;
          right: 8px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
}
