/**
 * Voice Notifications with Queue Integration
 *
 * Wraps the voice queue with OpenAI TTS to provide queued notifications
 * for multi-project scenarios.
 *
 * Usage:
 * ```typescript
 * import { initVoiceNotifications, queueVoiceNotification } from '@/lib/voice-notifications';
 *
 * // Initialize with API key
 * initVoiceNotifications(apiKey, voice);
 *
 * // Queue a notification (will be spoken in order, respecting priority and mute settings)
 * await queueVoiceNotification({
 *   text: 'Build completed successfully',
 *   projectName: 'quetrex',
 *   priority: 'info'
 * });
 * ```
 */

import {
  VoiceQueue,
  VoiceMessage,
  VoiceQueueStatus,
  setGlobalVoiceQueue,
  getGlobalVoiceQueue,
  clearGlobalVoiceQueue,
} from '@/services/voice-queue';

let voiceApiKey: string | null = null;
let voiceModel: string = 'nova';

/**
 * Initialize voice notifications with API key and voice model
 */
export function initVoiceNotifications(apiKey: string, voice: string = 'nova'): void {
  voiceApiKey = apiKey;
  voiceModel = voice;

  // Clear any existing queue
  clearGlobalVoiceQueue();

  // Create new queue with TTS function
  const queue = new VoiceQueue(async (text: string) => {
    await speakText(text);
  });

  setGlobalVoiceQueue(queue);
}

/**
 * Clean up voice notifications
 */
export function cleanupVoiceNotifications(): void {
  clearGlobalVoiceQueue();
  voiceApiKey = null;
}

/**
 * Queue a voice notification
 * Returns the message ID
 */
export async function queueVoiceNotification(message: VoiceMessage): Promise<string> {
  const queue = getGlobalVoiceQueue();
  if (!queue) {
    throw new Error('Voice notifications not initialized. Call initVoiceNotifications() first.');
  }

  return queue.add(message);
}

/**
 * Set mute state for a project
 */
export function setProjectMuted(projectName: string, muted: boolean): void {
  const queue = getGlobalVoiceQueue();
  if (queue) {
    queue.setProjectMuted(projectName, muted);
  }
}

/**
 * Check if a project is muted
 */
export function isProjectMuted(projectName: string): boolean {
  const queue = getGlobalVoiceQueue();
  return queue ? queue.isProjectMuted(projectName) : false;
}

/**
 * Get current queue status
 */
export function getVoiceQueueStatus(): VoiceQueueStatus | null {
  const queue = getGlobalVoiceQueue();
  return queue ? queue.getStatus() : null;
}

/**
 * Clear all pending notifications
 */
export function clearVoiceQueue(): void {
  const queue = getGlobalVoiceQueue();
  if (queue) {
    queue.clear();
  }
}

/**
 * Clear all notifications for a specific project
 */
export function clearProjectNotifications(projectName: string): void {
  const queue = getGlobalVoiceQueue();
  if (queue) {
    queue.clearProject(projectName);
  }
}

/**
 * Internal function to speak text using OpenAI TTS
 * Includes echo prevention delay (1500ms as per existing implementation)
 */
async function speakText(text: string): Promise<void> {
  if (!voiceApiKey) {
    console.warn('Voice API key not set, skipping TTS');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${voiceApiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1', // Use faster TTS model
        voice: voiceModel,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();

    // Play the audio
    await playAudio(audioData);

    // Echo prevention delay (as per existing implementation in openai-voice.ts line 145)
    // Using 1000ms to prevent the voice output from triggering voice input
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Failed to speak text:', error);
    throw error;
  }
}

/**
 * Play audio data
 */
async function playAudio(audioData: ArrayBuffer): Promise<void> {
  // Create audio context if we're in a browser environment
  if (typeof window === 'undefined' || !window.AudioContext) {
    console.warn('AudioContext not available');
    return;
  }

  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(audioData);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  return new Promise<void>((resolve, reject) => {
    source.onended = () => {
      audioContext.close().then(resolve).catch(reject);
    };
    // AudioBufferSourceNode doesn't have onerror, handle errors in outer try/catch
    source.start(0);
  });
}

/**
 * Helper functions for common notification types
 */

export async function notifySuccess(projectName: string, message: string): Promise<string> {
  return queueVoiceNotification({
    text: message,
    projectName,
    priority: 'info',
  });
}

export async function notifyWarning(projectName: string, message: string): Promise<string> {
  return queueVoiceNotification({
    text: message,
    projectName,
    priority: 'warning',
  });
}

export async function notifyError(projectName: string, message: string): Promise<string> {
  return queueVoiceNotification({
    text: message,
    projectName,
    priority: 'error',
  });
}

/**
 * Notify about agent completion
 */
export async function notifyAgentCompletion(projectName: string, taskTitle: string): Promise<string> {
  return notifySuccess(projectName, `${projectName}: Task completed - ${taskTitle}`);
}

/**
 * Notify about agent failure
 */
export async function notifyAgentFailure(projectName: string, taskTitle: string, error: string): Promise<string> {
  return notifyError(projectName, `${projectName}: Task failed - ${taskTitle}. Error: ${error}`);
}

/**
 * Notify about agent start
 */
export async function notifyAgentStart(projectName: string, taskTitle: string): Promise<string> {
  return notifySuccess(projectName, `${projectName}: Starting task - ${taskTitle}`);
}
