/**
 * OpenAI API Interceptor
 *
 * Wraps OpenAI API calls to automatically track costs.
 * Intercepts fetch calls to OpenAI endpoints and counts tokens.
 *
 * Usage:
 *   import { createOpenAIInterceptor } from '@/lib/openai-interceptor';
 *   const tracker = createOpenAIInterceptor(costTracker, 'quetrex');
 *   // All OpenAI calls will now be tracked automatically
 */

import { CostTracker, OpenAIModel } from '@/services/cost-tracker';

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIRequestBody {
  model: string;
  messages?: Array<{ role: string; content: string }>;
}

/**
 * Creates an interceptor that wraps fetch to track OpenAI API costs
 */
export function createOpenAIInterceptor(
  costTracker: CostTracker,
  projectId: string
): () => void {
  const originalFetch = window.fetch;

  // Store reference to original fetch
  const interceptedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if this is an OpenAI API call
    if (url.includes('api.openai.com')) {
      const response = await originalFetch(input, init);

      // Clone response so we can read it without consuming the original
      const clone = response.clone();

      try {
        // Track based on endpoint
        if (url.includes('/chat/completions')) {
          trackChatCompletion(clone, init, costTracker, projectId);
        } else if (url.includes('/audio/transcriptions')) {
          trackTranscription(clone, init, costTracker, projectId);
        } else if (url.includes('/audio/speech')) {
          trackTextToSpeech(clone, init, costTracker, projectId);
        }
      } catch (error) {
        console.error('Failed to track OpenAI cost:', error);
        // Don't throw - tracking failure shouldn't break the app
      }

      return response;
    }

    // Not an OpenAI call, pass through
    return originalFetch(input, init);
  };

  // Replace global fetch
  window.fetch = interceptedFetch as typeof fetch;

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}

/**
 * Track chat completion costs
 */
async function trackChatCompletion(
  response: Response,
  init: RequestInit | undefined,
  costTracker: CostTracker,
  projectId: string
): Promise<void> {
  try {
    const data: OpenAIResponse = await response.json();

    if (data.usage) {
      // Extract model from request body
      const body: OpenAIRequestBody = init?.body
        ? JSON.parse(init.body as string)
        : { model: 'gpt-4o' };

      const model = body.model as OpenAIModel;

      costTracker.trackOpenAICall({
        model,
        projectId,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      });
    }
  } catch (error) {
    // Ignore parsing errors - response might not be JSON
    console.debug('Could not parse chat completion response for cost tracking:', error);
  }
}

/**
 * Track Whisper transcription costs
 * Whisper doesn't return token count, so we estimate based on audio duration
 */
async function trackTranscription(
  response: Response,
  init: RequestInit | undefined,
  costTracker: CostTracker,
  projectId: string
): Promise<void> {
  try {
    // Extract audio file from FormData if available
    if (init?.body instanceof FormData) {
      const file = init.body.get('file') as Blob;
      if (file) {
        // Estimate audio duration from file size (rough approximation)
        // Average audio: ~16KB per second for webm
        const estimatedSeconds = Math.ceil(file.size / 16000);

        costTracker.trackOpenAICall({
          model: 'whisper-1',
          projectId,
          audioSeconds: estimatedSeconds,
        });
      }
    }
  } catch (error) {
    console.debug('Could not track Whisper transcription cost:', error);
  }
}

/**
 * Track TTS costs
 */
async function trackTextToSpeech(
  response: Response,
  init: RequestInit | undefined,
  costTracker: CostTracker,
  projectId: string
): Promise<void> {
  try {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const model = body.model || 'tts-1';
    const text = body.input || '';

    costTracker.trackOpenAICall({
      model: model as OpenAIModel,
      projectId,
      characters: text.length,
    });
  } catch (error) {
    console.debug('Could not track TTS cost:', error);
  }
}

/**
 * Global cost tracker instance (singleton)
 */
let globalTracker: CostTracker | null = null;
let cleanupInterceptor: (() => void) | null = null;

/**
 * Initialize global cost tracking for all OpenAI calls
 */
export function initializeGlobalCostTracking(projectId: string): CostTracker {
  // Clean up existing interceptor if any
  if (cleanupInterceptor) {
    cleanupInterceptor();
  }

  // Create or reuse tracker
  if (!globalTracker) {
    globalTracker = new CostTracker();
  }

  // Set up interceptor
  cleanupInterceptor = createOpenAIInterceptor(globalTracker, projectId);

  return globalTracker;
}

/**
 * Get the global cost tracker instance
 */
export function getGlobalCostTracker(): CostTracker | null {
  return globalTracker;
}

/**
 * Stop global cost tracking
 */
export function stopGlobalCostTracking(): void {
  if (cleanupInterceptor) {
    cleanupInterceptor();
    cleanupInterceptor = null;
  }
}
