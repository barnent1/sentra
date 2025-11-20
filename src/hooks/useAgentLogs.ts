'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Interface for agent log stream data
 */
export interface AgentLogStreamData {
  logs: string
  status: 'running' | 'completed' | 'failed'
  final?: boolean
}

/**
 * Hook options
 */
export interface UseAgentLogsOptions {
  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean

  /**
   * Callback when connection is established
   */
  onConnect?: () => void

  /**
   * Callback when connection is closed
   */
  onClose?: () => void

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void

  /**
   * Callback when new logs arrive
   */
  onUpdate?: (data: AgentLogStreamData) => void
}

/**
 * Hook return value
 */
export interface UseAgentLogsReturn {
  /**
   * Current logs content
   */
  logs: string

  /**
   * Current agent status
   */
  status: 'running' | 'completed' | 'failed' | null

  /**
   * Whether SSE connection is active
   */
  isConnected: boolean

  /**
   * Whether initial connection is being established
   */
  isConnecting: boolean

  /**
   * Last error encountered
   */
  error: Error | null

  /**
   * Manually connect to log stream
   */
  connect: () => void

  /**
   * Manually disconnect from log stream
   */
  disconnect: () => void
}

/**
 * Hook for streaming real-time agent logs using Server-Sent Events (SSE)
 *
 * Features:
 * - Real-time log updates from server
 * - Automatic reconnection on error
 * - Auto-disconnect when agent completes/fails
 * - Proper cleanup on unmount
 *
 * @example
 * ```tsx
 * const { logs, status, isConnected } = useAgentLogs('agent-123');
 *
 * return (
 *   <div>
 *     <div>Status: {status}</div>
 *     <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
 *     <pre>{logs}</pre>
 *   </div>
 * );
 * ```
 */
export function useAgentLogs(
  agentId: string,
  options: UseAgentLogsOptions = {}
): UseAgentLogsReturn {
  const {
    autoConnect = true,
    onConnect,
    onClose,
    onError,
    onUpdate,
  } = options

  const [logs, setLogs] = useState<string>('')
  const [status, setStatus] = useState<'running' | 'completed' | 'failed' | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (isConnected || isConnecting) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Get API URL from environment or default to localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const url = `${apiUrl}/api/agents/${agentId}/logs/stream`

      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      // Create EventSource with auth header (using custom implementation)
      // Note: Standard EventSource doesn't support custom headers,
      // so we need to pass token as query param or use a polyfill
      const eventSourceUrl = token ? `${url}?token=${token}` : url
      const es = new EventSource(eventSourceUrl)

      es.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        onConnect?.()
      }

      es.onmessage = (event) => {
        try {
          const data: AgentLogStreamData = JSON.parse(event.data)
          setLogs(data.logs)
          setStatus(data.status)
          onUpdate?.(data)

          // Auto-disconnect if agent finished
          if (data.final || data.status === 'completed' || data.status === 'failed') {
            es.close()
            setIsConnected(false)
            onClose?.()
          }
        } catch (err) {
          const parseError = new Error('Failed to parse log data')
          setError(parseError)
          onError?.(parseError)
        }
      }

      es.onerror = () => {
        const connectionError = new Error('SSE connection failed')
        setError(connectionError)
        setIsConnected(false)
        setIsConnecting(false)
        onError?.(connectionError)
        es.close()
      }

      setEventSource(es)
    } catch (err) {
      const setupError = err instanceof Error ? err : new Error(String(err))
      setError(setupError)
      setIsConnecting(false)
      onError?.(setupError)
    }
  }, [agentId, isConnected, isConnecting, onConnect, onClose, onError, onUpdate])

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      setIsConnected(false)
      onClose?.()
    }
  }, [eventSource, onClose])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect])

  return {
    logs,
    status,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}
