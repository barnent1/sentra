/**
 * GlobalErrorHandler Component
 *
 * Client component that installs global error handlers on mount.
 * Should be included in the root layout to catch all errors.
 */

'use client'

import { useEffect } from 'react'
import { installGlobalErrorHandlers, uninstallGlobalErrorHandlers } from '@/lib/global-error-handlers'

export function GlobalErrorHandler(): null {
  useEffect(() => {
    // Install handlers on mount
    installGlobalErrorHandlers()

    // Cleanup on unmount
    return () => {
      uninstallGlobalErrorHandlers()
    }
  }, [])

  // This component doesn't render anything
  return null
}
