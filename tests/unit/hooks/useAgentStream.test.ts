import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AgentStreamLine } from '@/services/sentra-api';

// Mock web-based sentra-api wrapper
vi.mock('@/services/sentra-api', () => ({
  startAgentStream: vi.fn(),
  stopAgentStream: vi.fn(),
  getAgentLogs: vi.fn(),
}));

import { useAgentStream } from '@/hooks/useAgentStream';
import { startAgentStream, stopAgentStream, getAgentLogs } from '@/services/sentra-api';

const mockStartAgentStream = vi.mocked(startAgentStream);
const mockStopAgentStream = vi.mocked(stopAgentStream);
const mockGetAgentLogs = vi.mocked(getAgentLogs);

describe('useAgentStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementations (must return Promises)
    mockStartAgentStream.mockResolvedValue(undefined);
    mockStopAgentStream.mockResolvedValue(undefined);
    mockGetAgentLogs.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Test: Hook initialization
  // ============================================================================

  it('should initialize with empty lines and not connected', async () => {
    // ARRANGE & ACT: Render hook
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: false }));

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // ASSERT: Initial state after load
    expect(result.current.lines).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should start stream when enabled', async () => {
    // ARRANGE: Render hook with autoStart enabled
    renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    // ACT: Wait for async operations
    await waitFor(() => {
      // ASSERT: Should call startAgentStream
      expect(mockStartAgentStream).toHaveBeenCalledWith('test-agent');
    });
  });

  it('should not start stream when autoStart is false', () => {
    // ARRANGE & ACT: Render hook with autoStart disabled
    renderHook(() => useAgentStream('test-agent', { autoStart: false }));

    // ASSERT: Should not call startAgentStream
    expect(mockStartAgentStream).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Test: Historical logs loading on mount
  // ============================================================================

  it('should load historical logs on mount', async () => {
    // ARRANGE: Mock historical logs
    const mockHistoricalLogs: AgentStreamLine[] = [
      { lineNumber: 1, timestamp: '14:30:00', content: 'Old log 1', agentId: 'test-agent' },
      { lineNumber: 2, timestamp: '14:31:00', content: 'Old log 2', agentId: 'test-agent' },
    ];
    mockGetAgentLogs.mockResolvedValue(mockHistoricalLogs);

    // ACT: Render hook
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    // ASSERT: Should load historical logs
    await waitFor(() => {
      expect(mockGetAgentLogs).toHaveBeenCalledWith('test-agent', 500);
      expect(result.current.lines).toHaveLength(2);
      expect(result.current.lines[0].content).toBe('Old log 1');
    });
  });

  // ============================================================================
  // Test: Manual start/stop
  // ============================================================================

  it('should provide start function', async () => {
    // ARRANGE: Render hook without autoStart
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: false }));

    // ACT: Manually start stream
    await act(async () => {
      await result.current.start();
    });

    // ASSERT: Should call startAgentStream
    expect(mockStartAgentStream).toHaveBeenCalledWith('test-agent');
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should provide stop function', async () => {
    // ARRANGE: Render hook with autoStart
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // ACT: Stop stream
    await act(async () => {
      await result.current.stop();
    });

    // ASSERT: Should call stopAgentStream
    expect(mockStopAgentStream).toHaveBeenCalledWith('test-agent');
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  // ============================================================================
  // Test: Clear function
  // ============================================================================

  it('should provide clear function to reset buffer', async () => {
    // ARRANGE: Mock initial logs
    const mockHistoricalLogs: AgentStreamLine[] = [
      { lineNumber: 1, timestamp: '14:32:15', content: 'Line 1', agentId: 'test-agent' },
    ];
    mockGetAgentLogs.mockResolvedValue(mockHistoricalLogs);

    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    // Wait for logs to load
    await waitFor(() => expect(result.current.lines).toHaveLength(1));

    // ACT: Clear buffer
    act(() => {
      result.current.clear();
    });

    // ASSERT: Buffer should be empty
    expect(result.current.lines).toHaveLength(0);
  });

  // ============================================================================
  // Test: Cleanup on unmount
  // ============================================================================

  it('should cleanup on unmount', async () => {
    // ARRANGE: Render hook
    const { unmount } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    await waitFor(() => expect(mockStartAgentStream).toHaveBeenCalled());

    // ACT: Unmount component
    unmount();

    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERT: Should call stopAgentStream during cleanup
    expect(mockStopAgentStream).toHaveBeenCalledWith('test-agent');
  });

  // ============================================================================
  // Test: Error handling
  // ============================================================================

  it('should handle errors when starting stream', async () => {
    // ARRANGE: Mock error
    const mockError = new Error('Failed to start stream');
    mockStartAgentStream.mockRejectedValue(mockError);

    // ACT: Render hook
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    // ASSERT: Should set error state
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Failed to start stream');
    });
  });

  it('should handle errors when loading historical logs', async () => {
    // ARRANGE: Mock error
    const mockError = new Error('Failed to load logs');
    mockGetAgentLogs.mockRejectedValue(mockError);

    // ACT: Render hook
    const { result } = renderHook(() => useAgentStream('test-agent', { autoStart: true }));

    // ASSERT: Should handle error gracefully (continue with empty logs)
    await waitFor(() => {
      expect(result.current.lines).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
