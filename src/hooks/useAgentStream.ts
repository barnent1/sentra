'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  startAgentStream,
  stopAgentStream,
  getAgentLogs,
  type AgentStreamLine,
} from '@/services/sentra-api';

export interface UseAgentStreamOptions {
  /**
   * Whether to automatically start streaming on mount
   * @default true
   */
  autoStart?: boolean;

  /**
   * Maximum number of lines to keep in buffer
   * @default 500
   */
  maxLines?: number;

  /**
   * Callback when new lines are received
   */
  onNewLines?: (lines: AgentStreamLine[]) => void;

  /**
   * Callback when stream encounters an error
   */
  onError?: (error: Error) => void;
}

export interface UseAgentStreamReturn {
  /**
   * Buffered log lines
   */
  lines: AgentStreamLine[];

  /**
   * Whether the stream is actively connected
   */
  isConnected: boolean;

  /**
   * Whether initial logs are being loaded
   */
  isLoading: boolean;

  /**
   * Last error encountered
   */
  error: Error | null;

  /**
   * Manually start streaming
   */
  start: () => Promise<void>;

  /**
   * Stop streaming
   */
  stop: () => Promise<void>;

  /**
   * Clear the log buffer
   */
  clear: () => void;
}

/**
 * Hook for streaming real-time agent output
 *
 * Features:
 * - Loads historical logs on mount
 * - Buffers lines with configurable max
 * - Auto-cleanup on unmount
 *
 * @example
 * ```tsx
 * const { lines, isConnected } = useAgentStream('sentra-42');
 *
 * return (
 *   <div>
 *     {lines.map(line => (
 *       <div key={line.lineNumber}>
 *         [{line.timestamp}] {line.content}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAgentStream(
  agentId: string,
  options: UseAgentStreamOptions = {}
): UseAgentStreamReturn {
  const {
    autoStart = true,
    maxLines = 500,
    onNewLines,
    onError,
  } = options;

  const [lines, setLines] = useState<AgentStreamLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load historical logs
  const loadHistoricalLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const historicalLogs = await getAgentLogs(agentId, maxLines);
      setLines(historicalLogs);
    } catch (err) {
      console.error('Failed to load historical logs:', err);
      // Don't set error state - just continue with empty logs
    } finally {
      setIsLoading(false);
    }
  }, [agentId, maxLines]);

  // Start streaming
  const start = useCallback(async () => {
    if (isConnected) return;

    try {
      await startAgentStream(agentId);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error('Failed to start agent stream:', error);
    }
  }, [agentId, isConnected, onError]);

  // Stop streaming
  const stop = useCallback(async () => {
    if (!isConnected) return;

    try {
      await stopAgentStream(agentId);
      setIsConnected(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error('Failed to stop agent stream:', error);
    }
  }, [agentId, isConnected, onError]);

  // Clear buffer
  const clear = useCallback(() => {
    setLines([]);
  }, []);

  // Load historical logs on mount
  useEffect(() => {
    loadHistoricalLogs();
  }, [loadHistoricalLogs]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      stopAgentStream(agentId)?.catch?.(console.error);
    };
    // Only run on mount - intentionally ignoring deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return {
    lines,
    isConnected,
    isLoading,
    error,
    start,
    stop,
    clear,
  };
}
