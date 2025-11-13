/**
 * Performance Middleware Tests
 *
 * Tests for API performance monitoring middleware.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  performanceMiddleware,
  withPerformanceTracking,
} from '@/services/performance-middleware';
import { PerformanceMonitor } from '@/services/performance';

// Mock PerformanceMonitor
const mockTrackAPICall = vi.fn();
const mockIsEnabled = vi.fn(() => true);

vi.mock('@/services/performance', () => ({
  PerformanceMonitor: {
    getInstance: vi.fn(() => ({
      trackAPICall: mockTrackAPICall,
      isEnabled: mockIsEnabled,
    })),
  },
}));

describe('performanceMiddleware', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  let mockNext: () => Promise<NextResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTrackAPICall.mockClear();
    mockIsEnabled.mockReturnValue(true);

    mockRequest = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
      headers: new Headers(),
    } as NextRequest;

    mockResponse = NextResponse.json({ data: 'test' });

    mockNext = vi.fn(async () => mockResponse);
  });

  describe('basic functionality', () => {
    it('should call next handler', async () => {
      const middleware = performanceMiddleware();
      const result = await middleware(mockRequest, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    });

    it('should track API call duration', async () => {
      const middleware = performanceMiddleware();
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).toHaveBeenCalledTimes(1);
    });

    it('should extract endpoint from URL', async () => {
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/users/123',
      } as any as NextRequest;
      const middleware = performanceMiddleware();
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).toHaveBeenCalledWith(
        '/api/users/123',
        'GET',
        expect.any(Number),
        200
      );
    });

    it('should capture HTTP method', async () => {
      mockRequest = {
        ...mockRequest,
        method: 'POST',
      } as any as NextRequest;
      const middleware = performanceMiddleware();
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).toHaveBeenCalledWith(
        expect.any(String),
        'POST',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should capture status code from response', async () => {
      mockResponse = new NextResponse('Not Found', { status: 404 });
      mockNext = vi.fn(async () => mockResponse);

      const middleware = performanceMiddleware();
      await middleware(mockRequest, mockNext);

      const call = mockTrackAPICall.mock.calls[0];
      expect(call[3]).toBe(404);
    });
  });

  describe('error handling', () => {
    it('should track errors and rethrow', async () => {
      const error = new Error('API error');
      mockNext = vi.fn(async () => {
        throw error;
      });

      const middleware = performanceMiddleware();

      await expect(middleware(mockRequest, mockNext)).rejects.toThrow('API error');

      expect(mockTrackAPICall).toHaveBeenCalledWith(
        expect.any(String),
        'GET',
        expect.any(Number),
        500
      );
    });

    it('should not swallow errors', async () => {
      mockNext = vi.fn(async () => {
        throw new Error('Test error');
      });

      const middleware = performanceMiddleware();

      await expect(middleware(mockRequest, mockNext)).rejects.toThrow('Test error');
    });
  });

  describe('slow operation detection', () => {
    it('should log slow operations (>100ms)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockNext = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return mockResponse;
      });

      const middleware = performanceMiddleware({ slowThreshold: 100 });
      await middleware(mockRequest, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow API call'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should not log fast operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const middleware = performanceMiddleware({ slowThreshold: 100 });
      await middleware(mockRequest, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use custom slow threshold', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockNext = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 60));
        return mockResponse;
      });

      const middleware = performanceMiddleware({ slowThreshold: 50 });
      await middleware(mockRequest, mockNext);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should respect enabled flag', async () => {
      const middleware = performanceMiddleware({ enabled: false });
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).not.toHaveBeenCalled();
    });

    it('should exclude specific paths', async () => {
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/health',
      };

      const middleware = performanceMiddleware({
        excludePaths: ['/api/health', '/api/metrics'],
      });
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).not.toHaveBeenCalled();
    });

    it('should only include specified paths', async () => {
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/other',
      };

      const middleware = performanceMiddleware({
        includePaths: ['/api/users', '/api/posts'],
      });
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).not.toHaveBeenCalled();
    });

    it('should track included paths', async () => {
      mockRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/users',
      };

      const middleware = performanceMiddleware({
        includePaths: ['/api/users', '/api/posts'],
      });
      await middleware(mockRequest, mockNext);

      expect(mockTrackAPICall).toHaveBeenCalled();
    });
  });
});

describe('withPerformanceTracking', () => {
  let mockHandler: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler = vi.fn(async () => NextResponse.json({ data: 'test' }));
  });

  it('should wrap API route handler', async () => {
    const wrapped = withPerformanceTracking(mockHandler);
    const req = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
    } as NextRequest;

    const response = await wrapped(req);

    expect(mockHandler).toHaveBeenCalledWith(req);
    expect(response).toBeDefined();
  });

  it('should track performance of wrapped handler', async () => {
    const wrapped = withPerformanceTracking(mockHandler);
    const req = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
    } as NextRequest;

    await wrapped(req);

    expect(mockTrackAPICall).toHaveBeenCalled();
  });

  it('should pass through handler errors', async () => {
    mockHandler = vi.fn(async () => {
      throw new Error('Handler error');
    });

    const wrapped = withPerformanceTracking(mockHandler);
    const req = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
    } as NextRequest;

    await expect(wrapped(req)).rejects.toThrow('Handler error');
  });

  it('should allow custom options', async () => {
    const wrapped = withPerformanceTracking(mockHandler, {
      slowThreshold: 50,
      enabled: true,
    });

    const req = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
    } as NextRequest;

    await wrapped(req);

    expect(mockTrackAPICall).toHaveBeenCalled();
  });
});
