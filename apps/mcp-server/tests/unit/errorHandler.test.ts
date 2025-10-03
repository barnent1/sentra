/**
 * Unit Tests: Error Handler Middleware
 *
 * Tests error handling and 404 handler functionality.
 */

import { describe, it, expect, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../../src/middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  // Helper to create mock request
  const createMockRequest = (method = 'GET', url = '/test'): Partial<Request> => ({
    method,
    url,
    headers: {},
  });

  // Helper to create mock response
  const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    return res;
  };

  const mockNext: NextFunction = jest.fn() as any;

  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.name).toBe('AppError');
    });

    it('should create an error with custom values', () => {
      const error = new AppError('Custom error', 404, 'NOT_FOUND', { key: 'value' });

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ key: 'value' });
    });

    it('should have stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with custom status code', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new AppError('Test error', 404, 'NOT_FOUND');

      errorHandler(error, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error',
            code: 'NOT_FOUND',
          }),
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle AppError with details', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new AppError('Validation error', 400, 'VALIDATION_ERROR', {
        field: 'email',
        reason: 'invalid format',
      });

      errorHandler(error, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: { field: 'email', reason: 'invalid format' },
          }),
        })
      );
    });

    it('should handle generic Error with 500 status', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new Error('Generic error');

      errorHandler(error, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Generic error',
            code: 'INTERNAL_ERROR',
          }),
          timestamp: expect.any(String),
        })
      );
    });

    it('should not expose details for generic errors', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new Error('Generic error');

      errorHandler(error, req as Request, res as Response, mockNext);

      const jsonCall = (res.json as jest.MockedFunction<any>).mock.calls[0][0];
      expect(jsonCall.error.details).toBeUndefined();
    });

    it('should include timestamp in response', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new AppError('Test error');

      const beforeTime = new Date();
      errorHandler(error, req as Request, res as Response, mockNext);
      const afterTime = new Date();

      const jsonCall = (res.json as jest.MockedFunction<any>).mock.calls[0][0];
      expect(jsonCall.timestamp).toBeDefined();
      const timestamp = new Date(jsonCall.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status code', () => {
      const req = createMockRequest('GET', '/non-existent');
      const res = createMockResponse();

      notFoundHandler(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should include method and URL in error message', () => {
      const req = createMockRequest('POST', '/api/missing');
      const res = createMockResponse();

      notFoundHandler(req as Request, res as Response, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Cannot POST /api/missing',
            code: 'NOT_FOUND',
          }),
        })
      );
    });

    it('should include timestamp in response', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      notFoundHandler(req as Request, res as Response, mockNext);

      const jsonCall = (res.json as jest.MockedFunction<any>).mock.calls[0][0];
      expect(jsonCall.timestamp).toBeDefined();
    });
  });
});
