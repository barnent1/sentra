'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  startAgentStream,
  stopAgentStream,
  getAgentLogs,
  type AgentStreamLine,
} from '@/lib/tauri';

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
 * - Subscribes to Tauri events for live updates
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

  const unlistenRef = useRef<UnlistenFn | null>(null);

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
      // Start the stream
      await startAgentStream(agentId);

      // Setup event listener
      const unlisten = await listen<AgentStreamLine[]>(
        'agent-stream-update',
        (event) => {
          const newLines = event.payload;

          setLines((prevLines) => {
            const updated = [...prevLines, ...newLines];

            // Trim to maxLines if needed
            if (updated.length > maxLines) {
              return updated.slice(updated.length - maxLines);
            }

            return updated;
          });

          onNewLines?.(newLines);
        }
      );

      unlistenRef.current = unlisten;
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error('Failed to start agent stream:', error);
    }
  }, [agentId, isConnected, maxLines, onNewLines, onError]);

  // Stop streaming
  const stop = useCallback(async () => {
    if (!isConnected) return;

    try {
      // Unlisten from events
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      // Stop the stream
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
      // Clean up event listener
      if (unlistenRef.current) {
        unlistenRef.current();
      }
      // Stop the stream
      stopAgentStream(agentId).catch(console.error);
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
