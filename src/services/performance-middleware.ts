/**
 * Performance Middleware
 *
 * Wraps API routes to track performance metrics automatically.
 * Logs slow operations and tracks error rates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from './performance';

export interface PerformanceMiddlewareOptions {
  enabled?: boolean;
  slowThreshold?: number;
  excludePaths?: string[];
  includePaths?: string[];
}

const DEFAULT_SLOW_THRESHOLD = 100; // ms

/**
 * Create performance tracking middleware
 */
export function performanceMiddleware(
  options: PerformanceMiddlewareOptions = {}
) {
  const {
    enabled = true,
    slowThreshold = DEFAULT_SLOW_THRESHOLD,
    excludePaths = [],
    includePaths = [],
  } = options;

  return async function middleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Skip if disabled
    if (!enabled) {
      return next();
    }

    // Extract endpoint from URL
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // Check if path should be excluded
    if (excludePaths.some(path => endpoint.startsWith(path))) {
      return next();
    }

    // Check if path should be included (if includePaths is specified)
    if (
      includePaths.length > 0 &&
      !includePaths.some(path => endpoint.startsWith(path))
    ) {
      return next();
    }

    const startTime = performance.now();
    const method = request.method;

    try {
      // Execute the request handler
      const response = await next();

      // Calculate duration
      const duration = performance.now() - startTime;

      // Track the API call
      const monitor = PerformanceMonitor.getInstance();
      monitor.trackAPICall(endpoint, method, duration, response.status);

      // Log slow operations
      if (duration >= slowThreshold) {
        console.warn('Slow API call detected:', {
          endpoint,
          method,
          duration: `${duration.toFixed(2)}ms`,
          status: response.status,
        });
      }

      return response;
    } catch (error) {
      // Track error
      const duration = performance.now() - startTime;
      const monitor = PerformanceMonitor.getInstance();
      monitor.trackAPICall(endpoint, method, duration, 500);

      // Re-throw error
      throw error;
    }
  };
}

/**
 * Wrap an API route handler with performance tracking
 */
export function withPerformanceTracking<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: PerformanceMiddlewareOptions = {}
): (req: NextRequest, ...args: T) => Promise<NextResponse> {
  const middleware = performanceMiddleware(options);

  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    return middleware(req, () => handler(req, ...args));
  };
}
