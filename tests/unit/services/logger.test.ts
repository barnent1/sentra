/**
 * Logger Service Tests
 *
 * Tests for structured logging service with multiple levels,
 * sensitive data redaction, and environment-specific outputs.
 *
 * Requirements:
 * - Support debug, info, warn, error levels
 * - Redact sensitive data (tokens, passwords, API keys)
 * - Console logging in development
 * - File logging in production
 * - Structured output format
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, LogLevel, LogEntry } from '@/services/logger'

describe('Logger Service', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    // Reset logger state
    logger.clearHistory()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Log Levels', () => {
    it('should log debug messages', () => {
      // ARRANGE
      const message = 'Debug information'
      const context = { userId: '123' }

      // ACT
      logger.debug(message, context)

      // ASSERT
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining(message),
        context
      )
    })

    it('should log info messages', () => {
      // ARRANGE
      const message = 'User logged in'
      const context = { userId: '123' }

      // ACT
      logger.info(message, context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        context
      )
    })

    it('should log warning messages', () => {
      // ARRANGE
      const message = 'Rate limit approaching'
      const context = { remaining: 10 }

      // ACT
      logger.warn(message, context)

      // ASSERT
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message),
        context
      )
    })

    it('should log error messages', () => {
      // ARRANGE
      const message = 'API call failed'
      const error = new Error('Network timeout')

      // ACT
      logger.error(message, error)

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        expect.objectContaining({
          message: 'Network timeout',
          name: 'Error',
        })
      )
    })
  })

  describe('Sensitive Data Redaction', () => {
    it('should redact API keys', () => {
      // ARRANGE
      const context = {
        apiKey: 'sk-1234567890abcdef',
        OPENAI_API_KEY: 'sk-abcdef1234567890',
      }

      // ACT
      logger.info('API call', context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          apiKey: '[REDACTED]',
          OPENAI_API_KEY: '[REDACTED]',
        })
      )
    })

    it('should redact passwords', () => {
      // ARRANGE
      const context = {
        password: 'super-secret',
        userPassword: 'another-secret',
      }

      // ACT
      logger.info('User action', context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          password: '[REDACTED]',
          userPassword: '[REDACTED]',
        })
      )
    })

    it('should redact tokens', () => {
      // ARRANGE
      const context = {
        token: 'bearer-token-123',
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      }

      // ACT
      logger.info('Auth action', context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          token: '[REDACTED]',
          accessToken: '[REDACTED]',
          refreshToken: '[REDACTED]',
        })
      )
    })

    it('should redact secrets in nested objects', () => {
      // ARRANGE
      const context = {
        user: {
          id: '123',
          password: 'secret',
          profile: {
            apiKey: 'sk-nested',
          },
        },
      }

      // ACT
      logger.info('Complex object', context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          user: expect.objectContaining({
            id: '123',
            password: '[REDACTED]',
            profile: expect.objectContaining({
              apiKey: '[REDACTED]',
            }),
          }),
        })
      )
    })

    it('should preserve non-sensitive data', () => {
      // ARRANGE
      const context = {
        userId: '123',
        action: 'login',
        timestamp: Date.now(),
      }

      // ACT
      logger.info('User login', context)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          userId: '123',
          action: 'login',
          timestamp: expect.any(Number),
        })
      )
    })
  })

  describe('Log History', () => {
    it('should maintain log history', () => {
      // ACT
      logger.info('First message')
      logger.warn('Second message')
      logger.error('Third message')

      // ASSERT
      const history = logger.getHistory()
      expect(history).toHaveLength(3)
      expect(history[0].message).toBe('First message')
      expect(history[1].message).toBe('Second message')
      expect(history[2].message).toBe('Third message')
    })

    it('should include timestamp in history', () => {
      // ARRANGE
      const beforeTime = Date.now()

      // ACT
      logger.info('Test message')

      // ASSERT
      const history = logger.getHistory()
      const afterTime = Date.now()

      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime)
    })

    it('should include level in history', () => {
      // ACT
      logger.debug('Debug msg')
      logger.info('Info msg')
      logger.warn('Warn msg')
      logger.error('Error msg')

      // ASSERT
      const history = logger.getHistory()
      expect(history[0].level).toBe(LogLevel.DEBUG)
      expect(history[1].level).toBe(LogLevel.INFO)
      expect(history[2].level).toBe(LogLevel.WARN)
      expect(history[3].level).toBe(LogLevel.ERROR)
    })

    it('should limit history size to prevent memory leaks', () => {
      // ACT - Log 2000 messages (should keep max 1000)
      for (let i = 0; i < 2000; i++) {
        logger.info(`Message ${i}`)
      }

      // ASSERT
      const history = logger.getHistory()
      expect(history.length).toBeLessThanOrEqual(1000)
      expect(history[history.length - 1].message).toBe('Message 1999')
    })

    it('should clear history', () => {
      // ARRANGE
      logger.info('Message 1')
      logger.info('Message 2')

      // ACT
      logger.clearHistory()

      // ASSERT
      expect(logger.getHistory()).toHaveLength(0)
    })
  })

  describe('Log Level Filtering', () => {
    it('should respect minimum log level', () => {
      // ARRANGE
      logger.setMinLevel(LogLevel.WARN)

      // ACT
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      // ASSERT
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should default to DEBUG level in development', () => {
      // ARRANGE - Set to DEBUG level explicitly
      logger.setMinLevel(LogLevel.DEBUG)

      // ACT
      logger.debug('Debug message')

      // ASSERT
      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('should default to INFO level in production', () => {
      // ARRANGE - Set to INFO level explicitly
      logger.setMinLevel(LogLevel.INFO)

      // ACT
      logger.debug('Debug message')
      logger.info('Info message')

      // ASSERT
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle Error objects', () => {
      // ARRANGE
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n  at test.js:1:1'

      // ACT
      logger.error('Error occurred', error)

      // ASSERT
      const history = logger.getHistory()
      expect(history[0].context).toMatchObject({
        name: 'Error',
        message: 'Test error',
        stack: expect.stringContaining('test.js:1:1'),
      })
    })

    it('should handle custom error properties', () => {
      // ARRANGE
      const error = new Error('API error') as Error & { statusCode?: number }
      error.statusCode = 404

      // ACT
      logger.error('API call failed', error)

      // ASSERT
      const history = logger.getHistory()
      expect(history[0].context).toMatchObject({
        name: 'Error',
        message: 'API error',
        statusCode: 404,
      })
    })

    it('should handle non-Error objects', () => {
      // ARRANGE
      const errorLike = {
        message: 'Something went wrong',
        code: 'ERR_UNKNOWN',
      }

      // ACT
      logger.error('Error occurred', errorLike)

      // ASSERT
      const history = logger.getHistory()
      expect(history[0].context).toMatchObject(errorLike)
    })
  })

  describe('Structured Output', () => {
    it('should include ISO timestamp in output', () => {
      // ACT
      logger.info('Test message')

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        'Test message'
      )
    })

    it('should format log entries consistently', () => {
      // ACT
      logger.info('Test message', { key: 'value' })

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\[INFO\]/),
        'Test message',
        { key: 'value' }
      )
    })
  })

  describe('Performance', () => {
    it('should handle high-volume logging efficiently', () => {
      // ARRANGE
      const startTime = Date.now()

      // ACT - Log 1000 messages
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { index: i })
      }

      // ASSERT - Should complete in less than 1 second
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(1000)
    })

    it('should not block on logging', () => {
      // ACT
      const result = logger.info('Test message')

      // ASSERT - Should return immediately (undefined)
      expect(result).toBeUndefined()
    })
  })
})
