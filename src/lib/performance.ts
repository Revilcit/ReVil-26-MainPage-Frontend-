/**
 * Performance monitoring utilities
 */

/**
 * Measure execution time of a function
 */
export function measurePerformance(label: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  };
}

/**
 * Async function performance wrapper
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const done = measurePerformance(label);
  try {
    const result = await fn();
    done();
    return result;
  } catch (error) {
    done();
    throw error;
  }
}

/**
 * Log performance metrics
 */
export function logMetrics(metrics: Record<string, number>) {
  if (process.env.NODE_ENV === 'development') {
    console.table(metrics);
  }
}

/**
 * Monitor Core Web Vitals
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to analytics in production
  // Example: analytics.track('web-vitals', metric);
}

/**
 * Check if performance API is available
 */
export function isPerformanceSupported(): boolean {
  return typeof window !== 'undefined' && 'performance' in window;
}

/**
 * Get navigation timing
 */
export function getNavigationTiming() {
  if (!isPerformanceSupported()) return null;

  const timing = performance.timing;
  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    request: timing.responseStart - timing.requestStart,
    response: timing.responseEnd - timing.responseStart,
    dom: timing.domComplete - timing.domLoading,
    load: timing.loadEventEnd - timing.loadEventStart,
    total: timing.loadEventEnd - timing.navigationStart,
  };
}
