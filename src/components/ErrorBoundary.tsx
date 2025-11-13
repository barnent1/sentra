/**
 * ErrorBoundary Component
 *
 * React error boundary that catches rendering errors, shows fallback UI,
 * and provides recovery options.
 *
 * Features:
 * - Catch React rendering errors
 * - Show dark-themed fallback UI
 * - Log errors to error reporter and logger
 * - Provide reset and reload buttons
 * - Support custom fallback components
 * - Support nested boundaries
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { errorReporter } from '@/services/error-reporter'
import { logger } from '@/services/logger'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  context?: Record<string, unknown>
  name?: string
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: ErrorInfo
  resetError: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Report error to error reporter
    const context: Record<string, unknown> = {
      ...this.props.context,
      componentStack: errorInfo.componentStack,
    }

    if (this.props.name) {
      context.boundaryName = this.props.name
    }

    errorReporter.report(error, context)

    // Log error
    logger.error('ErrorBoundary caught error', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      boundaryName: this.props.name,
    })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  reloadPage = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo ?? undefined}
            resetError={this.resetError}
          />
        )
      }

      // Default fallback UI
      return (
        <div
          data-testid="error-boundary"
          role="alert"
          className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-6"
        >
          <div className="max-w-2xl w-full space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-100">Something went wrong</h1>
              <p className="text-gray-400">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            {/* Error Message */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-300 mb-2">Error Details</h2>
              <p className="text-red-400 font-mono text-sm break-words">
                {this.state.error.message}
              </p>
            </div>

            {/* Stack Trace (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error.stack && (
              <details className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <summary className="text-sm font-semibold text-gray-300 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.resetError}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.reloadPage}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Support Info */}
            <div className="text-center text-sm text-gray-500">
              <p>
                If this problem persists, please contact support with the error details
                above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
