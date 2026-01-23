/**
 * Performance Utilities - Main Export File
 * Import all optimizations from a single location
 */

// Caching
export { cache, withCache } from './cache';

// Debouncing & Throttling
export { debounce, throttle } from './debounce';

// Performance Monitoring
export {
  measurePerformance,
  measureAsync,
  logMetrics,
  reportWebVitals,
  isPerformanceSupported,
  getNavigationTiming,
} from './performance';

// Optimized API Functions
export {
  fetchDashboardData,
  fetchAllStats,
  fetchMultipleEventStats,
  fetchAllEventTypes,
  prefetchCommonData,
} from './api-optimized';

// Re-export original API functions
export * from './api';
