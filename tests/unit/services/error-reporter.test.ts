/**
 * Error Reporter Service Tests
 *
 * Tests for centralized error reporting with frequency tracking,
 * error grouping, and future backend integration.
 *
 * Requirements:
 * - Track error frequency
 * - Group similar errors
 * - Store error reports
 * - Prepare for backend integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { errorReporter, ErrorReport, ErrorGroup } from '@/services/error-reporter'
import { logger } from '@/services/logger'

// Mock logger
vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('Error Reporter Service', () => {
  beforeEach(() => {
    // Clear error reporter state
    errorReporter.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Reporting', () => {
    it('should report errors', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      errorReporter.report(error)

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports).toHaveLength(1)
      expect(reports[0].message).toBe('Test error')
      expect(reports[0].name).toBe('Error')
    })

    it('should report errors with context', () => {
      // ARRANGE
      const error = new Error('API error')
      const context = {
        url: '/api/users',
        method: 'GET',
        userId: '123',
      }

      // ACT
      errorReporter.report(error, context)

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports[0].context).toMatchObject(context)
    })

    it('should include timestamp in reports', () => {
      // ARRANGE
      const error = new Error('Test error')
      const beforeTime = Date.now()

      // ACT
      errorReporter.report(error)

      // ASSERT
      const reports = errorReporter.getReports()
      const afterTime = Date.now()

      expect(reports[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(reports[0].timestamp).toBeLessThanOrEqual(afterTime)
    })

    it('should include stack trace', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      errorReporter.report(error)

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports[0].stack).toBeDefined()
      expect(reports[0].stack).toContain('Error: Test error')
    })

    it('should log errors when reporting', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      errorReporter.report(error)

      // ASSERT
      expect(logger.error).toHaveBeenCalledWith(
        'Error reported',
        expect.objectContaining({
          message: 'Test error',
        })
      )
    })
  })

  describe('Error Grouping', () => {
    it('should group errors by message', () => {
      // ARRANGE
      const error1 = new Error('Network timeout')
      const error2 = new Error('Network timeout')
      const error3 = new Error('Different error')

      // ACT
      errorReporter.report(error1)
      errorReporter.report(error2)
      errorReporter.report(error3)

      // ASSERT
      const groups = errorReporter.getGroups()
      expect(groups).toHaveLength(2)

      const timeoutGroup = groups.find((g) => g.message === 'Network timeout')
      expect(timeoutGroup?.count).toBe(2)

      const differentGroup = groups.find((g) => g.message === 'Different error')
      expect(differentGroup?.count).toBe(1)
    })

    it('should group errors by name and message', () => {
      // ARRANGE
      class NetworkError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'NetworkError'
        }
      }

      const error1 = new NetworkError('Timeout')
      const error2 = new NetworkError('Timeout')
      const error3 = new Error('Timeout') // Different error type

      // ACT
      errorReporter.report(error1)
      errorReporter.report(error2)
      errorReporter.report(error3)

      // ASSERT
      const groups = errorReporter.getGroups()
      expect(groups).toHaveLength(2)

      const networkGroup = groups.find((g) => g.name === 'NetworkError')
      expect(networkGroup?.count).toBe(2)

      const errorGroup = groups.find((g) => g.name === 'Error')
      expect(errorGroup?.count).toBe(1)
    })

    it('should track first and last occurrence', () => {
      // ARRANGE
      const error1 = new Error('Test error')
      const error2 = new Error('Test error')

      // ACT
      const time1 = Date.now()
      errorReporter.report(error1)

      // Wait a bit
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      const time2 = Date.now()
      errorReporter.report(error2)
      vi.useRealTimers()

      // ASSERT
      const groups = errorReporter.getGroups()
      const group = groups[0]

      expect(group.firstOccurrence).toBeLessThan(group.lastOccurrence)
    })

    it('should include sample error in group', () => {
      // ARRANGE
      const error1 = new Error('Test error')
      const error2 = new Error('Test error')

      // ACT
      errorReporter.report(error1, { userId: '1' })
      errorReporter.report(error2, { userId: '2' })

      // ASSERT
      const groups = errorReporter.getGroups()
      const group = groups[0]

      expect(group.sample).toBeDefined()
      expect(group.sample.message).toBe('Test error')
    })
  })

  describe('Error Frequency Tracking', () => {
    it('should track error count per group', () => {
      // ARRANGE
      const error = new Error('Repeated error')

      // ACT
      for (let i = 0; i < 5; i++) {
        errorReporter.report(error)
      }

      // ASSERT
      const groups = errorReporter.getGroups()
      expect(groups[0].count).toBe(5)
    })

    it('should calculate error rate', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      errorReporter.report(error)
      vi.useFakeTimers()
      vi.advanceTimersByTime(10000) // 10 seconds
      errorReporter.report(error)
      vi.useRealTimers()

      // ASSERT
      const groups = errorReporter.getGroups()
      const rate = groups[0].count / ((groups[0].lastOccurrence - groups[0].firstOccurrence) / 1000)

      expect(rate).toBeGreaterThan(0)
      expect(rate).toBeLessThan(1) // Less than 1 error per second
    })

    it('should identify high-frequency errors', () => {
      // ARRANGE
      const error = new Error('High frequency error')

      // ACT - Report 10 errors in quick succession
      for (let i = 0; i < 10; i++) {
        errorReporter.report(error)
      }

      // ASSERT
      const groups = errorReporter.getGroups()
      const highFreq = errorReporter.getHighFrequencyErrors()

      expect(highFreq).toHaveLength(1)
      expect(highFreq[0].count).toBe(10)
    })

    it('should filter high-frequency errors by threshold', () => {
      // ARRANGE
      const error1 = new Error('Frequent error')
      const error2 = new Error('Rare error')

      // ACT
      for (let i = 0; i < 10; i++) {
        errorReporter.report(error1)
      }
      errorReporter.report(error2)

      // ASSERT
      const highFreq = errorReporter.getHighFrequencyErrors(5) // Threshold: 5
      expect(highFreq).toHaveLength(1)
      expect(highFreq[0].message).toBe('Frequent error')
    })
  })

  describe('Report Management', () => {
    it('should limit report history to prevent memory leaks', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT - Report 2000 errors (should keep max 1000)
      for (let i = 0; i < 2000; i++) {
        errorReporter.report(new Error(`Error ${i}`))
      }

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports.length).toBeLessThanOrEqual(1000)
    })

    it('should get reports by error type', () => {
      // ARRANGE
      class NetworkError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'NetworkError'
        }
      }

      errorReporter.report(new NetworkError('Timeout'))
      errorReporter.report(new Error('General error'))
      errorReporter.report(new NetworkError('Connection failed'))

      // ACT
      const networkReports = errorReporter.getReportsByType('NetworkError')

      // ASSERT
      expect(networkReports).toHaveLength(2)
      expect(networkReports[0].name).toBe('NetworkError')
      expect(networkReports[1].name).toBe('NetworkError')
    })

    it('should get reports within time range', () => {
      // ARRANGE
      vi.useFakeTimers()
      const startTime = Date.now()

      errorReporter.report(new Error('Error 1'))
      vi.advanceTimersByTime(5000) // 5 seconds later
      errorReporter.report(new Error('Error 2'))
      vi.advanceTimersByTime(5000) // 10 seconds total
      errorReporter.report(new Error('Error 3'))

      // ACT
      const recentReports = errorReporter.getReportsSince(startTime + 4000)

      // ASSERT
      expect(recentReports).toHaveLength(2)
      expect(recentReports[0].message).toBe('Error 2')
      expect(recentReports[1].message).toBe('Error 3')

      vi.useRealTimers()
    })

    it('should clear all reports', () => {
      // ARRANGE
      errorReporter.report(new Error('Error 1'))
      errorReporter.report(new Error('Error 2'))

      // ACT
      errorReporter.clear()

      // ASSERT
      expect(errorReporter.getReports()).toHaveLength(0)
      expect(errorReporter.getGroups()).toHaveLength(0)
    })
  })

  describe('Error Metadata', () => {
    it('should include browser info in error reports', () => {
      // ACT
      errorReporter.report(new Error('Test error'))

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports[0].metadata).toBeDefined()
      expect(reports[0].metadata?.userAgent).toBeDefined()
      expect(reports[0].metadata?.platform).toBeDefined()
    })

    it('should include URL in error reports', () => {
      // ARRANGE
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/dashboard',
          pathname: '/dashboard',
        },
        writable: true,
      })

      // ACT
      errorReporter.report(new Error('Test error'))

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports[0].metadata?.url).toBe('http://localhost:3000/dashboard')
    })
  })

  describe('Future Backend Integration', () => {
    it('should export reports in JSON format for backend', () => {
      // ARRANGE
      errorReporter.report(new Error('Error 1'))
      errorReporter.report(new Error('Error 2'))

      // ACT
      const json = errorReporter.exportJSON()

      // ASSERT
      expect(json).toBeDefined()
      const parsed = JSON.parse(json)
      expect(parsed.reports).toHaveLength(2)
      expect(parsed.groups).toBeDefined()
    })

    it('should include summary statistics in export', () => {
      // ARRANGE
      errorReporter.report(new Error('Error 1'))
      errorReporter.report(new Error('Error 1'))
      errorReporter.report(new Error('Error 2'))

      // ACT
      const json = errorReporter.exportJSON()
      const parsed = JSON.parse(json)

      // ASSERT
      expect(parsed.summary).toBeDefined()
      expect(parsed.summary.totalErrors).toBe(3)
      expect(parsed.summary.uniqueErrors).toBe(2)
    })

    it('should support batch reporting for backend', () => {
      // ARRANGE
      errorReporter.report(new Error('Error 1'))
      errorReporter.report(new Error('Error 2'))

      // ACT
      const batch = errorReporter.getBatch(10)

      // ASSERT
      expect(batch).toHaveLength(2)
      expect(batch[0].message).toBe('Error 1')
      expect(batch[1].message).toBe('Error 2')
    })
  })

  describe('Error Severity', () => {
    it('should support error severity levels', () => {
      // ARRANGE
      const error = new Error('Test error')

      // ACT
      errorReporter.report(error, { severity: 'critical' })

      // ASSERT
      const reports = errorReporter.getReports()
      expect(reports[0].context?.severity).toBe('critical')
    })

    it('should filter reports by severity', () => {
      // ARRANGE
      errorReporter.report(new Error('Critical error'), { severity: 'critical' })
      errorReporter.report(new Error('Warning error'), { severity: 'warning' })
      errorReporter.report(new Error('Info error'), { severity: 'info' })

      // ACT
      const criticalReports = errorReporter.getReports().filter(
        (r) => r.context?.severity === 'critical'
      )

      // ASSERT
      expect(criticalReports).toHaveLength(1)
      expect(criticalReports[0].message).toBe('Critical error')
    })
  })
})
