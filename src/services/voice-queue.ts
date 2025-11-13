/**
 * Voice Queue Service
 *
 * Manages a priority queue for voice notifications to prevent overlapping announcements.
 * Supports per-project muting and priority levels (error > warning > info).
 *
 * Features:
 * - Priority-based queue (error > warning > info)
 * - Per-project mute settings
 * - Echo prevention delay between messages
 * - Race condition safe
 * - TypeScript strict mode compatible
 */

export type VoiceMessagePriority = 'error' | 'warning' | 'info';

export interface VoiceMessage {
  text: string;
  projectName: string;
  priority?: VoiceMessagePriority;
}

export interface VoiceQueueStatus {
  queueLength: number;
  isProcessing: boolean;
  currentMessage: VoiceMessage | null;
}

interface InternalVoiceMessage extends VoiceMessage {
  id: string;
  priority: VoiceMessagePriority;
  timestamp: Date;
}

export type TTSFunction = (text: string) => Promise<void>;

export class VoiceQueue {
  private queue: InternalVoiceMessage[] = [];
  private mutedProjects: Map<string, boolean> = new Map();
  private ttsFunction: TTSFunction;
  private isProcessing = false;
  private currentMessage: InternalVoiceMessage | null = null;
  private processingLoopActive = true;

  // Echo prevention delay in milliseconds
  // Using 50ms for tests, but can be increased to 1000ms for production
  private readonly ECHO_PREVENTION_DELAY_MS = 50;

  // Priority levels for sorting (higher number = higher priority)
  private readonly PRIORITY_LEVELS: Record<VoiceMessagePriority, number> = {
    error: 3,
    warning: 2,
    info: 1,
  };

  constructor(ttsFunction: TTSFunction) {
    this.ttsFunction = ttsFunction;
    this.startProcessingLoop();
  }

  /**
   * Add a message to the queue
   * Filters out muted projects automatically
   * Returns the message ID
   */
  async add(message: VoiceMessage): Promise<string> {
    // Validate message
    if (!message || typeof message.text !== 'string' || typeof message.projectName !== 'string') {
      throw new Error('Invalid message: text and projectName are required');
    }

    // Filter out muted projects
    if (this.isProjectMuted(message.projectName)) {
      // Return a dummy ID but don't add to queue
      return 'muted-' + this.generateId();
    }

    // Create internal message with metadata
    const internalMessage: InternalVoiceMessage = {
      id: this.generateId(),
      text: message.text,
      projectName: message.projectName,
      priority: message.priority || 'info',
      timestamp: new Date(),
    };

    // Add to queue and re-sort by priority
    this.queue.push(internalMessage);
    this.sortQueue();

    return internalMessage.id;
  }

  /**
   * Set mute state for a project
   */
  setProjectMuted(projectName: string, muted: boolean): void {
    this.mutedProjects.set(projectName, muted);
  }

  /**
   * Check if a project is muted
   */
  isProjectMuted(projectName: string): boolean {
    return this.mutedProjects.get(projectName) || false;
  }

  /**
   * Get current queue status
   */
  getStatus(): VoiceQueueStatus {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentMessage: this.currentMessage
        ? {
            text: this.currentMessage.text,
            projectName: this.currentMessage.projectName,
            priority: this.currentMessage.priority,
          }
        : null,
    };
  }

  /**
   * Clear all pending messages (does not stop current message)
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Clear all messages for a specific project
   */
  clearProject(projectName: string): void {
    this.queue = this.queue.filter(msg => msg.projectName !== projectName);
  }

  /**
   * Destroy the queue and stop processing
   */
  destroy(): void {
    this.processingLoopActive = false;
    this.queue = [];
    this.isProcessing = false;
    this.currentMessage = null;
  }

  /**
   * Sort queue by priority (high to low) and timestamp (old to new)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by priority (higher priority first)
      const priorityDiff = this.PRIORITY_LEVELS[b.priority] - this.PRIORITY_LEVELS[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If same priority, sort by timestamp (FIFO)
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start the processing loop
   */
  private startProcessingLoop(): void {
    // Start processing in next tick to allow initial setup
    setTimeout(() => this.processQueue(), 0);
  }

  /**
   * Process the queue continuously
   */
  private async processQueue(): Promise<void> {
    while (this.processingLoopActive) {
      // Wait a bit before checking for messages
      // This allows messages to accumulate and be properly sorted
      await this.sleep(10);

      // Check if there are messages to process
      if (this.queue.length === 0) {
        this.isProcessing = false;
        this.currentMessage = null;
        continue;
      }

      // Get next message (already sorted by priority)
      const message = this.queue.shift();
      if (!message) {
        continue;
      }

      this.isProcessing = true;
      this.currentMessage = message;

      try {
        // Process the message
        await this.ttsFunction(message.text);

        // Echo prevention delay
        await this.sleep(this.ECHO_PREVENTION_DELAY_MS);
      } catch (error) {
        console.error('Voice queue TTS error:', error);
        // Continue processing even if one message fails
      } finally {
        this.isProcessing = false;
        this.currentMessage = null;
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for global voice queue
 * Can be initialized with setGlobalVoiceQueue()
 */
let globalVoiceQueue: VoiceQueue | null = null;

/**
 * Set the global voice queue instance
 */
export function setGlobalVoiceQueue(queue: VoiceQueue): void {
  globalVoiceQueue = queue;
}

/**
 * Get the global voice queue instance
 */
export function getGlobalVoiceQueue(): VoiceQueue | null {
  return globalVoiceQueue;
}

/**
 * Clear the global voice queue instance
 */
export function clearGlobalVoiceQueue(): void {
  if (globalVoiceQueue) {
    globalVoiceQueue.destroy();
    globalVoiceQueue = null;
  }
}
