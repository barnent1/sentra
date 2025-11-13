/**
 * Error Reporter Service
 *
 * Centralized error reporting with frequency tracking, error grouping,
 * and future backend integration.
 *
 * Features:
 * - Track error frequency
 * - Group similar errors
 * - Store error reports with context
 * - Identify high-frequency errors
 * - Export data for backend integration
 */

import { logger } from './logger'

export interface ErrorReport {
  id: string
  timestamp: number
  name: string
  message: string
  stack?: string
  context?: Record<string, unknown>
  metadata?: {
    userAgent?: string
    platform?: string
    url?: string
  }
}

export interface ErrorGroup {
  id: string
  name: string
  message: string
  count: number
  firstOccurrence: number
  lastOccurrence: number
  sample: ErrorReport
}

interface ErrorReporterConfig {
  maxReports: number
  highFrequencyThreshold: number
}

class ErrorReporter {
  private reports: ErrorReport[] = []
  private config: ErrorReporterConfig

  constructor() {
    this.config = {
      maxReports: 1000,
      highFrequencyThreshold: 5,
    }
  }

  /**
   * Report an error
   */
  report(error: Error, context?: Record<string, unknown>): void {
    const report = this.createReport(error, context)
    this.addReport(report)
    this.logError(report)
  }

  /**
   * Get all error reports
   */
  getReports(): ErrorReport[] {
    return [...this.reports]
  }

  /**
   * Get reports by error type
   */
  getReportsByType(errorType: string): ErrorReport[] {
    return this.reports.filter((report) => report.name === errorType)
  }

  /**
   * Get reports since timestamp
   */
  getReportsSince(timestamp: number): ErrorReport[] {
    return this.reports.filter((report) => report.timestamp >= timestamp)
  }

  /**
   * Get error groups
   */
  getGroups(): ErrorGroup[] {
    const groups = new Map<string, ErrorGroup>()

    for (const report of this.reports) {
      const groupKey = `${report.name}:${report.message}`

      if (groups.has(groupKey)) {
        const group = groups.get(groupKey)!
        group.count++
        group.lastOccurrence = report.timestamp
      } else {
        groups.set(groupKey, {
          id: groupKey,
          name: report.name,
          message: report.message,
          count: 1,
          firstOccurrence: report.timestamp,
          lastOccurrence: report.timestamp,
          sample: report,
        })
      }
    }

    return Array.from(groups.values())
  }

  /**
   * Get high-frequency errors
   */
  getHighFrequencyErrors(threshold?: number): ErrorGroup[] {
    const minCount = threshold ?? this.config.highFrequencyThreshold
    return this.getGroups().filter((group) => group.count >= minCount)
  }

  /**
   * Export reports as JSON for backend
   */
  exportJSON(): string {
    const groups = this.getGroups()

    const exportData = {
      summary: {
        totalErrors: this.reports.length,
        uniqueErrors: groups.length,
        exportedAt: Date.now(),
      },
      reports: this.reports,
      groups: groups,
    }

    return JSON.stringify(exportData)
  }

  /**
   * Get batch of reports for backend sync
   */
  getBatch(limit: number): ErrorReport[] {
    return this.reports.slice(0, limit)
  }

  /**
   * Clear all reports
   */
  clear(): void {
    this.reports = []
  }

  /**
   * Create error report from Error object
   */
  private createReport(
    error: Error,
    context?: Record<string, unknown>
  ): ErrorReport {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      metadata: this.collectMetadata(),
    }
  }

  /**
   * Add report to storage with size limit
   */
  private addReport(report: ErrorReport): void {
    this.reports.push(report)

    // Enforce max reports size
    if (this.reports.length > this.config.maxReports) {
      this.reports = this.reports.slice(-this.config.maxReports)
    }
  }

  /**
   * Log error to logger service
   */
  private logError(report: ErrorReport): void {
    logger.error('Error reported', {
      name: report.name,
      message: report.message,
      context: report.context,
    })
  }

  /**
   * Collect browser metadata
   */
  private collectMetadata(): ErrorReport['metadata'] {
    // Check if running in browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return undefined
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location?.href,
    }
  }

  /**
   * Generate unique ID for error report
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const errorReporter = new ErrorReporter()
