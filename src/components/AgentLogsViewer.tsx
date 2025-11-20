'use client'

import { useAgentLogs } from '@/hooks/useAgentLogs'
import { Activity, Wifi, WifiOff, AlertCircle } from 'lucide-react'

interface AgentLogsViewerProps {
  /**
   * Agent ID to stream logs from
   */
  agentId: string

  /**
   * Optional max height for logs container
   * @default '600px'
   */
  maxHeight?: string

  /**
   * Whether to auto-scroll to bottom when new logs arrive
   * @default true
   */
  autoScroll?: boolean
}

/**
 * Real-time agent logs viewer using Server-Sent Events (SSE)
 *
 * Features:
 * - Real-time log streaming
 * - Connection status indicator
 * - Auto-scroll to bottom
 * - Error handling
 *
 * @example
 * ```tsx
 * <AgentLogsViewer agentId="agent-123" />
 * ```
 */
export function AgentLogsViewer({
  agentId,
  maxHeight = '600px',
  autoScroll = true,
}: AgentLogsViewerProps) {
  const { logs, status, isConnected, isConnecting, error } = useAgentLogs(agentId)

  // Auto-scroll to bottom when new logs arrive
  const logsContainerRef = (node: HTMLDivElement | null) => {
    if (node && autoScroll) {
      node.scrollTop = node.scrollHeight
    }
  }

  // Format status badge
  const StatusBadge = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <Activity className="w-3 h-3 text-yellow-500 animate-pulse" />
          <span className="text-xs text-yellow-500">Connecting...</span>
        </div>
      )
    }

    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-500">Disconnected</span>
        </div>
      )
    }

    if (status === 'running') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-500">Live</span>
        </div>
      )
    }

    if (status === 'completed') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <Activity className="w-3 h-3 text-blue-500" />
          <span className="text-xs text-blue-500">Completed</span>
        </div>
      )
    }

    if (status === 'failed') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-500">Failed</span>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#FAFAFA]">Agent Logs</h3>
        <StatusBadge />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Connection Error</p>
              <p className="text-xs text-red-400 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs container */}
      <div
        ref={logsContainerRef}
        className="bg-[#0A0A0B] rounded-lg p-4 font-mono text-xs overflow-x-auto overflow-y-auto border border-[#27272A]"
        style={{ maxHeight }}
      >
        {!logs ? (
          <p className="text-[#A1A1AA]">No logs yet...</p>
        ) : (
          <pre className="text-[#FAFAFA] whitespace-pre-wrap break-words">
            {logs}
          </pre>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
        <span>Agent ID: {agentId}</span>
        {logs && (
          <span>{logs.split('\n').length} lines</span>
        )}
      </div>
    </div>
  )
}
