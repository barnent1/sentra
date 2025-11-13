/**
 * Global Error Handlers
 *
 * Setup global error handlers for uncaught errors and unhandled promise rejections.
 * These handlers catch errors that escape component error boundaries.
 *
 * Features:
 * - window.onerror for uncaught JavaScript errors
 * - window.onunhandledrejection for unhandled promise rejections
 * - Automatic error reporting
 * - Logging to console and services
 */

import { errorReporter } from '@/services/error-reporter'
import { logger } from '@/services/logger'

let handlersInstalled = false

/**
 * Install global error handlers
 * Should be called once at application startup
 */
export function installGlobalErrorHandlers(): void {
  // Prevent multiple installations
  if (handlersInstalled) {
    logger.warn('Global error handlers already installed')
    return
  }

  // Only install in browser environment
  if (typeof window === 'undefined') {
    return
  }

  // Handle uncaught JavaScript errors
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): boolean => {
    // Create error object if not provided
    const err =
      error ||
      new Error(
        typeof message === 'string'
          ? message
          : 'Unknown error'
      )

    // Add source location to context
    const context: Record<string, unknown> = {
      type: 'uncaught',
      source,
      line: lineno,
      column: colno,
    }

    // Report error
    errorReporter.report(err, context)

    // Log error
    logger.error('Uncaught error', {
      message: err.message,
      source,
      line: lineno,
      column: colno,
    })

    // Return false to allow default error handling
    return false
  }

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
    // Extract error from rejection
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(
            typeof event.reason === 'string'
              ? event.reason
              : 'Unhandled promise rejection'
          )

    // Add rejection context
    const context: Record<string, unknown> = {
      type: 'unhandledRejection',
      promise: 'Promise',
    }

    // If reason is not an Error, include it in context
    if (!(event.reason instanceof Error)) {
      context.reason = event.reason
    }

    // Report error
    errorReporter.report(error, context)

    // Log error
    logger.error('Unhandled promise rejection', {
      message: error.message,
      reason: event.reason,
    })

    // Prevent default browser error message
    event.preventDefault()
  }

  handlersInstalled = true
  logger.info('Global error handlers installed')
}

/**
 * Remove global error handlers
 * Useful for testing or cleanup
 */
export function uninstallGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.onerror = null
  window.onunhandledrejection = null
  handlersInstalled = false

  logger.info('Global error handlers uninstalled')
}

/**
 * Check if global error handlers are installed
 */
export function areHandlersInstalled(): boolean {
  return handlersInstalled
}
