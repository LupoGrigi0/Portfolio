/**
 * Performance Monitoring & Instrumentation
 *
 * Tracks key performance metrics for the Modern Art Portfolio:
 * - Component render times
 * - Image load times
 * - Carousel virtualization efficiency
 * - Memory usage (DOM node count)
 * - Core Web Vitals (LCP, FID, CLS)
 *
 * Usage:
 *   import { PerformanceMonitor, measureRender, reportMetric } from '@/lib/performance';
 *
 *   // Track component render
 *   const stopMeasure = measureRender('Carousel');
 *   // ... render logic ...
 *   stopMeasure();
 *
 *   // Report custom metric
 *   reportMetric('carousel.images.rendered', 20);
 *
 * @module performance
 * @author Kat (Performance Specialist)
 * @created 2025-10-16
 */

'use client';

import { createLogger } from './logger';

const logger = createLogger('Performance');

// Performance configuration
interface PerformanceConfig {
  enabled: boolean;
  reportToConsole: boolean;
  reportToBackend: boolean;
  backendUrl?: string;
  sampleRate: number; // 0.0 to 1.0 (1.0 = report all metrics)
}

const config: PerformanceConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
  reportToConsole: true,
  reportToBackend: false,
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  sampleRate: 1.0
};

/**
 * Performance metric types
 */
export enum MetricType {
  RENDER = 'render',
  IMAGE_LOAD = 'image_load',
  CAROUSEL_INIT = 'carousel_init',
  PROJECTION_UPDATE = 'projection_update',
  DOM_SIZE = 'dom_size',
  MEMORY = 'memory',
  CUSTOM = 'custom'
}

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Metrics buffer (for batch reporting)
const metricsBuffer: PerformanceMetric[] = [];
const BUFFER_SIZE = 50;
const FLUSH_INTERVAL = 5000; // Flush every 5 seconds

/**
 * Report a performance metric
 */
export function reportMetric(
  name: string,
  value: number,
  type: MetricType = MetricType.CUSTOM,
  unit: string = 'ms',
  metadata?: Record<string, any>
) {
  if (!config.enabled) return;

  // Sample rate check
  if (Math.random() > config.sampleRate) return;

  const metric: PerformanceMetric = {
    name,
    type,
    value,
    unit,
    timestamp: Date.now(),
    metadata
  };

  // Add to buffer
  metricsBuffer.push(metric);

  // Console reporting
  if (config.reportToConsole) {
    const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    logger.debug(`📊 ${name}: ${value}${unit}${metadataStr}`);
  }

  // Auto-flush if buffer full
  if (metricsBuffer.length >= BUFFER_SIZE) {
    flushMetrics();
  }
}

/**
 * Flush metrics buffer to backend
 */
async function flushMetrics() {
  if (!config.reportToBackend || metricsBuffer.length === 0) {
    metricsBuffer.length = 0; // Clear buffer
    return;
  }

  const metrics = [...metricsBuffer];
  metricsBuffer.length = 0; // Clear buffer

  try {
    await fetch(`${config.backendUrl}/api/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    });
  } catch (error) {
    logger.warn('Failed to send metrics to backend', error);
  }
}

// Auto-flush interval
if (typeof window !== 'undefined') {
  setInterval(flushMetrics, FLUSH_INTERVAL);
}

/**
 * Measure render time for a component
 *
 * Usage:
 *   const stop = measureRender('Carousel');
 *   // ... render logic ...
 *   stop();
 */
export function measureRender(componentName: string): () => void {
  if (!config.enabled) return () => {};

  const startTime = performance.now();
  const markName = `render-${componentName}-${Date.now()}`;

  performance.mark(`${markName}-start`);

  return () => {
    performance.mark(`${markName}-end`);
    const duration = performance.now() - startTime;

    reportMetric(
      `component.render.${componentName}`,
      Math.round(duration * 100) / 100,
      MetricType.RENDER,
      'ms'
    );

    // Cleanup marks
    performance.clearMarks(`${markName}-start`);
    performance.clearMarks(`${markName}-end`);
  };
}

/**
 * Measure image load time
 */
export function measureImageLoad(src: string): () => void {
  if (!config.enabled) return () => {};

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    reportMetric(
      'image.load',
      Math.round(duration * 100) / 100,
      MetricType.IMAGE_LOAD,
      'ms',
      { src: src.substring(src.lastIndexOf('/') + 1) } // Just filename
    );
  };
}

/**
 * Report DOM size (number of nodes)
 */
export function reportDOMSize() {
  if (!config.enabled || typeof document === 'undefined') return;

  const nodeCount = document.getElementsByTagName('*').length;
  reportMetric('dom.size', nodeCount, MetricType.DOM_SIZE, 'nodes');
}

/**
 * Report memory usage (Chrome only)
 */
export function reportMemoryUsage() {
  if (!config.enabled || typeof window === 'undefined') return;

  // @ts-ignore - Chrome-specific API
  const memory = (performance as any).memory;
  if (!memory) return;

  reportMetric('memory.used', Math.round(memory.usedJSHeapSize / 1024 / 1024), MetricType.MEMORY, 'MB');
  reportMetric('memory.total', Math.round(memory.totalJSHeapSize / 1024 / 1024), MetricType.MEMORY, 'MB');
  reportMetric('memory.limit', Math.round(memory.jsHeapSizeLimit / 1024 / 1024), MetricType.MEMORY, 'MB');
}

/**
 * Observe Core Web Vitals
 */
export function observeWebVitals() {
  if (!config.enabled || typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    reportMetric('webvital.lcp', Math.round(lastEntry.startTime), MetricType.CUSTOM, 'ms');
  });

  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    logger.warn('LCP observation not supported');
  }

  // FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      reportMetric('webvital.fid', Math.round(entry.processingStart - entry.startTime), MetricType.CUSTOM, 'ms');
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    logger.warn('FID observation not supported');
  }

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        reportMetric('webvital.cls', Math.round(clsValue * 1000) / 1000, MetricType.CUSTOM, 'score');
      }
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    logger.warn('CLS observation not supported');
  }
}

/**
 * Performance Monitor - Auto-track system metrics
 */
export class PerformanceMonitor {
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalMs: number = 10000) {
    if (!config.enabled) return;

    logger.info('Performance monitor started', { interval: `${intervalMs}ms` });

    this.intervalId = setInterval(() => {
      reportDOMSize();
      reportMemoryUsage();
    }, intervalMs);

    // Start Web Vitals observation
    observeWebVitals();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Performance monitor stopped');
    }

    // Flush remaining metrics
    flushMetrics();
  }
}

/**
 * Configure performance monitoring
 */
export function configurePerformance(options: Partial<PerformanceConfig>) {
  Object.assign(config, options);
}

/**
 * Get current performance config
 */
export function getPerformanceConfig(): PerformanceConfig {
  return { ...config };
}

// DISABLED: Auto-start performance monitoring in development
// Caused console spam - enable manually when needed:
//   import { PerformanceMonitor } from '@/lib/performance';
//   const monitor = new PerformanceMonitor();
//   monitor.start(10000);
//
// if (typeof window !== 'undefined' && config.enabled) {
//   const monitor = new PerformanceMonitor();
//   monitor.start(10000); // Report every 10 seconds
//
//   // Cleanup on page unload
//   window.addEventListener('beforeunload', () => {
//     monitor.stop();
//   });
// }
