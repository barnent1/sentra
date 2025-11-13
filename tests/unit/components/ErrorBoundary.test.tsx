/**
 * ErrorBoundary Component Tests
 *
 * Tests for React error boundary component that catches rendering errors,
 * shows fallback UI, and provides recovery options.
 *
 * Requirements:
 * - Catch rendering errors
 * - Show dark-themed fallback UI
 * - Log errors to service
 * - Provide reset button
 * - Support nested boundaries
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { errorReporter } from '@/services/error-reporter'
import { logger } from '@/services/logger'

// Mock services
vi.mock('@/services/error-reporter', () => ({
  errorReporter: {
    report: vi.fn(),
  },
}))

vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Suppress console.error in tests (React logs caught errors)
const originalError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Catching', () => {
    it('should catch rendering errors', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    it('should render children when no error', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should report error to error reporter', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(errorReporter.report).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      )
    })

    it('should log error to logger', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(logger.error).toHaveBeenCalledWith(
        'ErrorBoundary caught error',
        expect.objectContaining({
          message: 'Test error',
        })
      )
    })

    it('should include component stack in error report', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(errorReporter.report).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })
  })

  describe('Fallback UI', () => {
    it('should display error message', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/test error/i)).toBeInTheDocument()
    })

    it('should use dark theme styling', () => {
      // ACT
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT - Check for dark theme classes
      const errorContainer = container.querySelector('[data-testid="error-boundary"]')
      expect(errorContainer).toHaveClass('bg-gray-900')
      expect(errorContainer).toHaveClass('text-gray-100')
    })

    it('should display reset button', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      const resetButton = screen.getByRole('button', { name: /try again/i })
      expect(resetButton).toBeInTheDocument()
    })

    it('should display reload button', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      expect(reloadButton).toBeInTheDocument()
    })

    it('should show error details in development', () => {
      // ARRANGE - Mock NODE_ENV
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error - Mocking NODE_ENV for test
      process.env.NODE_ENV = 'development'

      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/stack trace/i)).toBeInTheDocument()

      // Cleanup
      // @ts-expect-error - Restoring NODE_ENV
      process.env.NODE_ENV = originalEnv
    })

    it('should hide error details in production', () => {
      // ARRANGE - Mock NODE_ENV
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error - Mocking NODE_ENV for test
      process.env.NODE_ENV = 'production'

      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument()

      // Cleanup
      // @ts-expect-error - Restoring NODE_ENV
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Recovery', () => {
    it('should reset error state when reset button clicked', () => {
      // ARRANGE
      let shouldThrow = true
      let key = 0

      const { rerender } = render(
        <ErrorBoundary key={key}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // Verify error is showing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      // ACT - Fix the error and click reset
      shouldThrow = false
      key++
      const resetButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(resetButton)

      // Re-render with new key to force re-mount
      rerender(
        <ErrorBoundary key={key}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should reload page when reload button clicked', () => {
      // ARRANGE
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ACT
      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      fireEvent.click(reloadButton)

      // ASSERT
      expect(reloadMock).toHaveBeenCalled()
    })

    it('should maintain error state until reset', () => {
      // ARRANGE
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Verify error is showing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      // ACT - Re-render without reset
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // ASSERT - Error should still be showing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  describe('Custom Fallback', () => {
    it('should support custom fallback component', () => {
      // ARRANGE
      const CustomFallback = ({ error }: { error: Error }) => (
        <div data-testid="custom-fallback">Custom error: {error.message}</div>
      )

      // ACT
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText(/custom error: test error/i)).toBeInTheDocument()
    })

    it('should pass error and resetError to custom fallback', () => {
      // ARRANGE
      const CustomFallback = ({
        error,
        resetError,
      }: {
        error: Error
        resetError: () => void
      }) => (
        <div>
          <p>{error.message}</p>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      )

      // ACT
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument()
    })
  })

  describe('Error Context', () => {
    it('should include custom context in error report', () => {
      // ARRANGE
      const context = {
        userId: '123',
        action: 'rendering',
      }

      // ACT
      render(
        <ErrorBoundary context={context}>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(errorReporter.report).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          userId: '123',
          action: 'rendering',
        })
      )
    })

    it('should include boundary name in error report', () => {
      // ACT
      render(
        <ErrorBoundary name="DashboardBoundary">
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(errorReporter.report).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          boundaryName: 'DashboardBoundary',
        })
      )
    })
  })

  describe('Nested Boundaries', () => {
    it('should support nested error boundaries', () => {
      // ACT
      render(
        <ErrorBoundary name="OuterBoundary">
          <div>
            <ErrorBoundary name="InnerBoundary">
              <ThrowError />
            </ErrorBoundary>
            <div>Other content</div>
          </div>
        </ErrorBoundary>
      )

      // ASSERT - Inner boundary should catch the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText('Other content')).toBeInTheDocument()
    })

    it('should report error to nearest boundary', () => {
      // ACT
      render(
        <ErrorBoundary name="OuterBoundary">
          <ErrorBoundary name="InnerBoundary">
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      )

      // ASSERT - Should report with inner boundary name
      expect(errorReporter.report).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          boundaryName: 'InnerBoundary',
        })
      )
    })
  })

  describe('Error Types', () => {
    it('should handle standard Error', () => {
      // ARRANGE
      function ThrowStandardError(): null {
        throw new Error('Standard error')
      }

      // ACT
      render(
        <ErrorBoundary>
          <ThrowStandardError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/standard error/i)).toBeInTheDocument()
    })

    it('should handle TypeError', () => {
      // ARRANGE
      function ThrowTypeError(): null {
        throw new TypeError('Type error')
      }

      // ACT
      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/type error/i)).toBeInTheDocument()
    })

    it('should handle ReferenceError', () => {
      // ARRANGE
      function ThrowReferenceError(): null {
        throw new ReferenceError('Reference error')
      }

      // ACT
      render(
        <ErrorBoundary>
          <ThrowReferenceError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/reference error/i)).toBeInTheDocument()
    })

    it('should handle custom error types', () => {
      // ARRANGE
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      function ThrowCustomError(): null {
        throw new CustomError('Custom error')
      }

      // ACT
      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByText(/custom error/i)).toBeInTheDocument()
    })
  })

  describe('Error Callbacks', () => {
    it('should call onError callback when error occurs', () => {
      // ARRANGE
      const onError = vi.fn()

      // ACT
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      )
    })

    it('should call onReset callback when reset', () => {
      // ARRANGE
      const onReset = vi.fn()
      let shouldThrow = true

      const { rerender } = render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // ACT
      shouldThrow = false
      const resetButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(resetButton)

      rerender(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // ASSERT
      expect(onReset).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible error message', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      // ACT
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ASSERT
      const errorContainer = screen.getByTestId('error-boundary')
      expect(errorContainer).toHaveAttribute('role', 'alert')
    })
  })
})
