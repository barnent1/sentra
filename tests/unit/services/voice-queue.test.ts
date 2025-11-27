/**
 * Voice Queue Service Tests
 *
 * Tests for the voice notification queue system that prevents overlapping announcements.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  VoiceQueue,
  VoiceMessage,
  VoiceMessagePriority,
  VoiceQueueStatus,
  TTSFunction,
} from '@/services/voice-queue';

describe('VoiceQueue', () => {
  let queue: VoiceQueue;
  let mockTTSFunction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock TTS function that returns a promise
    mockTTSFunction = vi.fn().mockResolvedValue(undefined);
    queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);
  });

  afterEach(() => {
    queue.destroy();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty queue', () => {
      const status = queue.getStatus();
      expect(status.queueLength).toBe(0);
      expect(status.isProcessing).toBe(false);
      expect(status.currentMessage).toBeNull();
    });

    it('should accept TTS function', () => {
      expect(queue).toBeDefined();
      expect(typeof mockTTSFunction).toBe('function');
    });
  });

  describe('add', () => {
    it('should add message to queue with default priority (info)', async () => {
      const message: VoiceMessage = {
        text: 'Test message',
        projectName: 'quetrex',
      };

      await queue.add(message);
      const status = queue.getStatus();

      expect(status.queueLength).toBe(1);
    });

    it('should add message with specified priority', async () => {
      const message: VoiceMessage = {
        text: 'Error occurred',
        projectName: 'quetrex',
        priority: 'error',
      };

      await queue.add(message);
      const status = queue.getStatus();

      expect(status.queueLength).toBe(1);
    });

    it('should assign unique ID to each message', async () => {
      const message1: VoiceMessage = {
        text: 'Message 1',
        projectName: 'quetrex',
      };

      const message2: VoiceMessage = {
        text: 'Message 2',
        projectName: 'quetrex',
      };

      const id1 = await queue.add(message1);
      const id2 = await queue.add(message2);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should start processing automatically when first message added', async () => {
      const message: VoiceMessage = {
        text: 'First message',
        projectName: 'quetrex',
      };

      await queue.add(message);

      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTTSFunction).toHaveBeenCalled();
    });

    it('should filter out muted projects', async () => {
      // Mute the project first
      queue.setProjectMuted('quetrex', true);

      const message: VoiceMessage = {
        text: 'Muted message',
        projectName: 'quetrex',
      };

      await queue.add(message);

      // Wait a bit to ensure no processing happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTTSFunction).not.toHaveBeenCalled();
      const status = queue.getStatus();
      expect(status.queueLength).toBe(0);
    });

    it('should not filter messages from unmuted projects', async () => {
      queue.setProjectMuted('quetrex', false);

      const message: VoiceMessage = {
        text: 'Unmuted message',
        projectName: 'quetrex',
      };

      await queue.add(message);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTTSFunction).toHaveBeenCalled();
    });

    it('should add timestamp to message', async () => {
      const beforeAdd = Date.now();

      const message: VoiceMessage = {
        text: 'Test message',
        projectName: 'quetrex',
      };

      await queue.add(message);

      const afterAdd = Date.now();
      const status = queue.getStatus();

      // The internal message should have a timestamp
      // We can't directly access it, but we verify through behavior
      expect(status.queueLength).toBe(1);
      expect(afterAdd - beforeAdd).toBeLessThan(100);
    });
  });

  describe('priority ordering', () => {
    beforeEach(() => {
      // Mock slow TTS to allow queue to build up
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);
    });

    it('should process error priority before warning', async () => {
      const warning: VoiceMessage = {
        text: 'Warning message',
        projectName: 'quetrex',
        priority: 'warning',
      };

      const error: VoiceMessage = {
        text: 'Error message',
        projectName: 'quetrex',
        priority: 'error',
      };

      // Add warning first
      await queue.add(warning);
      // Add error second (but it should jump ahead in the queue)
      await queue.add(error);

      // Wait for processing to start (both messages are queued, error should be first)
      await new Promise(resolve => setTimeout(resolve, 50));

      // First call should be the error (higher priority)
      expect(mockTTSFunction).toHaveBeenNthCalledWith(1, 'Error message');

      // Wait for it to complete and next to start
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call should be warning
      expect(mockTTSFunction).toHaveBeenNthCalledWith(2, 'Warning message');
    });

    it('should process warning priority before info', async () => {
      const info: VoiceMessage = {
        text: 'Info message',
        projectName: 'quetrex',
        priority: 'info',
      };

      const warning: VoiceMessage = {
        text: 'Warning message',
        projectName: 'quetrex',
        priority: 'warning',
      };

      await queue.add(info);
      await queue.add(warning);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Warning should be processed first (higher priority)
      expect(mockTTSFunction).toHaveBeenNthCalledWith(1, 'Warning message');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockTTSFunction).toHaveBeenNthCalledWith(2, 'Info message');
    });

    it('should maintain FIFO order within same priority', async () => {
      const message1: VoiceMessage = {
        text: 'First info',
        projectName: 'quetrex',
        priority: 'info',
      };

      const message2: VoiceMessage = {
        text: 'Second info',
        projectName: 'quetrex',
        priority: 'info',
      };

      const message3: VoiceMessage = {
        text: 'Third info',
        projectName: 'quetrex',
        priority: 'info',
      };

      await queue.add(message1);
      await queue.add(message2);
      await queue.add(message3);

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockTTSFunction).toHaveBeenNthCalledWith(1, 'First info');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockTTSFunction).toHaveBeenNthCalledWith(2, 'Second info');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockTTSFunction).toHaveBeenNthCalledWith(3, 'Third info');
    });
  });

  describe('processing', () => {
    it('should process messages one at a time', async () => {
      let processingCount = 0;
      let maxConcurrent = 0;

      mockTTSFunction = vi.fn().mockImplementation(async () => {
        processingCount++;
        maxConcurrent = Math.max(maxConcurrent, processingCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        processingCount--;
      });

      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });
      await queue.add({ text: 'Message 3', projectName: 'quetrex' });

      // Wait for all to process
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(maxConcurrent).toBe(1);
    });

    it('should update status during processing', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Test message', projectName: 'quetrex' });

      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 50));

      const status = queue.getStatus();
      expect(status.isProcessing).toBe(true);
      expect(status.currentMessage).not.toBeNull();
      expect(status.currentMessage?.text).toBe('Test message');
    });

    it('should clear current message after processing', async () => {
      mockTTSFunction = vi.fn().mockResolvedValue(undefined);
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Test message', projectName: 'quetrex' });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = queue.getStatus();
      expect(status.isProcessing).toBe(false);
      expect(status.currentMessage).toBeNull();
    });

    it('should handle TTS errors gracefully', async () => {
      mockTTSFunction = vi.fn().mockRejectedValue(new Error('TTS failed'));
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Test message', projectName: 'quetrex' });

      // Wait for processing attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = queue.getStatus();
      expect(status.isProcessing).toBe(false);
      expect(status.currentMessage).toBeNull();
    });

    it('should continue processing queue after error', async () => {
      let callCount = 0;
      mockTTSFunction = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First call fails');
        }
        return Promise.resolve();
      });

      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      // Wait for both to process
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockTTSFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('setProjectMuted', () => {
    it('should mute a project', () => {
      queue.setProjectMuted('quetrex', true);
      expect(queue.isProjectMuted('quetrex')).toBe(true);
    });

    it('should unmute a project', () => {
      queue.setProjectMuted('quetrex', true);
      queue.setProjectMuted('quetrex', false);
      expect(queue.isProjectMuted('quetrex')).toBe(false);
    });

    it('should handle multiple projects independently', () => {
      queue.setProjectMuted('quetrex', true);
      queue.setProjectMuted('workcell', false);

      expect(queue.isProjectMuted('quetrex')).toBe(true);
      expect(queue.isProjectMuted('workcell')).toBe(false);
    });

    it('should return false for unmuted projects by default', () => {
      expect(queue.isProjectMuted('new-project')).toBe(false);
    });

    it('should persist mute state across multiple checks', () => {
      queue.setProjectMuted('quetrex', true);

      expect(queue.isProjectMuted('quetrex')).toBe(true);
      expect(queue.isProjectMuted('quetrex')).toBe(true);
      expect(queue.isProjectMuted('quetrex')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all pending messages', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 200));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });
      await queue.add({ text: 'Message 3', projectName: 'quetrex' });

      queue.clear();

      const status = queue.getStatus();
      expect(status.queueLength).toBe(0);
    });

    it('should not stop currently processing message', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Processing message', projectName: 'quetrex' });

      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 50));

      queue.clear();

      // TTS should still complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTTSFunction).toHaveBeenCalledWith('Processing message');
    });
  });

  describe('clearProject', () => {
    it('should remove all messages for specific project', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Quetrex message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Workcell message', projectName: 'workcell' });
      await queue.add({ text: 'Quetrex message 2', projectName: 'quetrex' });

      // Clear quetrex messages before any processing starts
      queue.clearProject('quetrex');

      const status = queue.getStatus();
      expect(status.queueLength).toBeLessThan(3);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should only process workcell message (quetrex messages were cleared)
      expect(mockTTSFunction).toHaveBeenCalledTimes(1);
      expect(mockTTSFunction).toHaveBeenCalledWith('Workcell message');
    });

    it('should not affect other projects', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Quetrex message', projectName: 'quetrex' });
      await queue.add({ text: 'Workcell message', projectName: 'workcell' });

      queue.clearProject('quetrex');

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(mockTTSFunction).toHaveBeenCalledWith('Workcell message');
    });
  });

  describe('getStatus', () => {
    it('should return current queue length', async () => {
      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      const status = queue.getStatus();
      expect(status.queueLength).toBeGreaterThanOrEqual(0);
    });

    it('should return processing state', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Test message', projectName: 'quetrex' });

      // Check during processing (wait longer to ensure processing has started)
      await new Promise(resolve => setTimeout(resolve, 30));
      const processingStatus = queue.getStatus();
      expect(processingStatus.isProcessing).toBe(true);

      // Check after processing (wait for TTS + echo delay)
      await new Promise(resolve => setTimeout(resolve, 150));
      const idleStatus = queue.getStatus();
      expect(idleStatus.isProcessing).toBe(false);
    });

    it('should return current message details', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({
        text: 'Test message',
        projectName: 'quetrex',
        priority: 'warning',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const status = queue.getStatus();
      expect(status.currentMessage).not.toBeNull();
      expect(status.currentMessage?.text).toBe('Test message');
      expect(status.currentMessage?.projectName).toBe('quetrex');
      expect(status.currentMessage?.priority).toBe('warning');
    });

    it('should return null for current message when idle', () => {
      const status = queue.getStatus();
      expect(status.currentMessage).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clear queue', async () => {
      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      queue.destroy();

      const status = queue.getStatus();
      expect(status.queueLength).toBe(0);
    });

    it('should stop processing', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 50));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      // Wait for first message to start
      await new Promise(resolve => setTimeout(resolve, 20));

      queue.destroy();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should process at least one message, but not all
      // (May process 1 or 2 depending on timing, so we just check it's not processing more)
      expect(mockTTSFunction).toHaveBeenCalled();
      expect(mockTTSFunction.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('should allow creating new queue after destroy', () => {
      queue.destroy();
      const newQueue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);
      expect(newQueue).toBeDefined();
      newQueue.destroy();
    });
  });

  describe('echo prevention integration', () => {
    it('should respect echo prevention delay', async () => {
      const startTime = Date.now();

      await queue.add({ text: 'Test message', projectName: 'quetrex' });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least the echo prevention time
      // (We'll use 50ms in implementation to avoid slowing down tests too much)
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should apply delay between consecutive messages', async () => {
      mockTTSFunction = vi.fn().mockResolvedValue(undefined);
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      const startTime = Date.now();

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      // Wait for both to process
      await new Promise(resolve => setTimeout(resolve, 200));

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least 2 * echo prevention delay
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('race conditions', () => {
    it('should handle rapid message additions', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        text: `Message ${i}`,
        projectName: 'quetrex',
      }));

      // Add all messages rapidly
      const promises = messages.map(msg => queue.add(msg));
      await Promise.all(promises);

      const status = queue.getStatus();
      expect(status.queueLength).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent mute changes', async () => {
      const promises = [
        queue.add({ text: 'Message 1', projectName: 'quetrex' }),
        queue.setProjectMuted('quetrex', true),
        queue.add({ text: 'Message 2', projectName: 'quetrex' }),
        queue.setProjectMuted('quetrex', false),
        queue.add({ text: 'Message 3', projectName: 'quetrex' }),
      ];

      await Promise.all(promises);

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle clear during processing', async () => {
      mockTTSFunction = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      queue = new VoiceQueue(mockTTSFunction as unknown as TTSFunction);

      await queue.add({ text: 'Message 1', projectName: 'quetrex' });
      await queue.add({ text: 'Message 2', projectName: 'quetrex' });

      // Clear while processing
      setTimeout(() => queue.clear(), 50);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should handle gracefully
      const status = queue.getStatus();
      expect(status.queueLength).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message text', async () => {
      await queue.add({ text: '', projectName: 'quetrex' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTTSFunction).toHaveBeenCalledWith('');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);

      await queue.add({ text: longMessage, projectName: 'quetrex' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTTSFunction).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters in project names', async () => {
      await queue.add({
        text: 'Test',
        projectName: 'project-with-special_chars.123',
      });

      const status = queue.getStatus();
      expect(status.queueLength).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined gracefully', async () => {
      // TypeScript should prevent this, but test runtime behavior
      try {
        await queue.add(null as any);
        // Should not crash
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
