/**
 * v0 Platform API Integration Service
 *
 * Provides TypeScript-safe integration with v0 Platform API for:
 * - Generating interactive prototypes from specifications
 * - Iterating on designs based on user feedback
 * - Exporting code for implementation
 *
 * Part of Design Generation Feature (Phase 1)
 *
 * @module services/v0-integration
 */

import { createClient } from 'v0-sdk';

// ============================================================================
// Types
// ============================================================================

/**
 * Design tokens for customizing generated prototypes
 */
export interface DesignTokens {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    [key: string]: string | undefined;
  };
  fonts?: {
    body?: string;
    heading?: string;
    mono?: string;
    [key: string]: string | undefined;
  };
  spacing?: {
    [key: string]: string;
  };
  borderRadius?: {
    [key: string]: string;
  };
}

/**
 * Code file from v0 generation
 */
export interface CodeFile {
  path: string;
  content: string;
}

/**
 * Request for generating a new prototype
 */
export interface V0GenerationRequest {
  prompt: string;
  designTokens?: DesignTokens;
  framework: 'nextjs';
  styling: 'tailwind';
}

/**
 * Response from v0 generation
 */
export interface V0GenerationResponse {
  chatId: string;
  files: CodeFile[];
  demoUrl?: string;
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error options for custom error classes
 */
interface CustomErrorOptions {
  cause?: Error;
}

/**
 * Base error class for v0 integration errors
 */
export class V0IntegrationError extends Error {
  public readonly cause?: Error;

  constructor(message: string, options?: CustomErrorOptions) {
    super(message);
    this.name = 'V0IntegrationError';
    this.cause = options?.cause;
  }
}

/**
 * Error thrown when v0 API request fails
 */
export class V0ApiError extends V0IntegrationError {
  constructor(message: string, options?: CustomErrorOptions) {
    super(message, options);
    this.name = 'V0ApiError';
  }
}

/**
 * Error thrown when request validation fails
 */
export class V0ValidationError extends V0IntegrationError {
  constructor(message: string, options?: CustomErrorOptions) {
    super(message, options);
    this.name = 'V0ValidationError';
  }
}

// ============================================================================
// Service
// ============================================================================

/**
 * V0 Integration Service
 *
 * Integrates with v0 Platform API to generate and iterate on prototypes.
 *
 * Features:
 * - Generate prototypes from natural language specifications
 * - Iterate on designs with user feedback
 * - Export code for implementation
 * - Automatic retry with exponential backoff
 * - Comprehensive error handling
 *
 * @example
 * ```typescript
 * const service = new V0IntegrationService(process.env.V0_API_KEY);
 *
 * const result = await service.generate({
 *   prompt: 'Create a dashboard with sidebar navigation',
 *   framework: 'nextjs',
 *   styling: 'tailwind',
 * });
 *
 * console.log('Prototype URL:', result.demoUrl);
 * console.log('Files:', result.files);
 * ```
 */
export class V0IntegrationService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 100; // milliseconds

  /**
   * Create v0 integration service
   *
   * @param apiKey - v0 Platform API key (from V0_API_KEY environment variable)
   * @throws {V0ValidationError} If API key is missing or invalid
   */
  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new V0ValidationError('v0 API key is required');
    }

    this.client = createClient({ apiKey });
  }

  /**
   * Generate a new prototype from specification
   *
   * @param request - Generation request with prompt and options
   * @returns Generated prototype with chat ID, files, and demo URL
   * @throws {V0ValidationError} If request is invalid
   * @throws {V0ApiError} If API request fails after retries
   *
   * @example
   * ```typescript
   * const result = await service.generate({
   *   prompt: 'Create a contact form with name, email, and message fields',
   *   framework: 'nextjs',
   *   styling: 'tailwind',
   *   designTokens: {
   *     colors: { primary: '#6366f1' },
   *     fonts: { body: 'Inter' },
   *   },
   * });
   * ```
   */
  async generate(request: V0GenerationRequest): Promise<V0GenerationResponse> {
    // Validate request
    this.validateGenerationRequest(request);

    // Build prompt with design tokens if provided
    const fullPrompt = this.buildPrompt(request.prompt, request.designTokens);

    // Call v0 API with retry logic
    return this.withRetry(async () => {
      try {
        const response = await this.client.chats.create({
          message: fullPrompt,
        } as Parameters<typeof this.client.chats.create>[0]);

        return this.parseGenerationResponse(response);
      } catch (error) {
        throw new V0ApiError('Failed to generate code via v0 API', {
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });
  }

  /**
   * Iterate on existing prototype with user feedback
   *
   * @param chatId - Chat ID from previous generation
   * @param feedback - Natural language feedback for changes
   * @returns Updated prototype with new files
   * @throws {V0ValidationError} If chatId or feedback is invalid
   * @throws {V0ApiError} If API request fails after retries
   *
   * @example
   * ```typescript
   * const updated = await service.iterate(
   *   'chat-123',
   *   'Move the sidebar to the left side and make it collapsible'
   * );
   * ```
   */
  async iterate(chatId: string, feedback: string): Promise<V0GenerationResponse> {
    // Validate inputs
    this.validateIterateRequest(chatId, feedback);

    // Call v0 API with retry logic
    return this.withRetry(async () => {
      try {
        const response = await this.client.chats.create({
          chatId,
          message: feedback,
        } as Parameters<typeof this.client.chats.create>[0]);

        return this.parseGenerationResponse(response);
      } catch (error) {
        throw new V0ApiError('Failed to iterate on v0 chat', {
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });
  }

  /**
   * Export code files from generated prototype
   *
   * @param chatId - Chat ID from generation/iteration
   * @returns Array of code files with path and content
   * @throws {V0ValidationError} If chatId is invalid
   * @throws {V0ApiError} If export fails after retries
   *
   * @example
   * ```typescript
   * const files = await service.exportCode('chat-123');
   *
   * for (const file of files) {
   *   console.log(`File: ${file.path}`);
   *   console.log(`Content: ${file.content}`);
   * }
   * ```
   */
  async exportCode(chatId: string): Promise<CodeFile[]> {
    // Validate input
    if (!chatId || chatId.trim().length === 0) {
      throw new V0ValidationError('Chat ID is required for export');
    }

    // Call v0 API with retry logic
    return this.withRetry(async () => {
      try {
        // Type assertion: SDK structure may vary, use type assertion for now
        const response = await (this.client as any).files.export({
          chatId,
        });

        return this.parseExportResponse(response);
      } catch (error) {
        throw new V0ApiError('Failed to export code from v0', {
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate generation request
   */
  private validateGenerationRequest(request: V0GenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new V0ValidationError('Prompt is required for generation');
    }

    if (request.framework !== 'nextjs') {
      throw new V0ValidationError('Only Next.js framework is currently supported');
    }

    if (request.styling !== 'tailwind') {
      throw new V0ValidationError('Only Tailwind CSS styling is currently supported');
    }
  }

  /**
   * Validate iteration request
   */
  private validateIterateRequest(chatId: string, feedback: string): void {
    if (!chatId || chatId.trim().length === 0) {
      throw new V0ValidationError('Chat ID is required for iteration');
    }

    if (!feedback || feedback.trim().length === 0) {
      throw new V0ValidationError('Feedback is required for iteration');
    }
  }

  /**
   * Build full prompt with design tokens
   */
  private buildPrompt(basePrompt: string, designTokens?: DesignTokens): string {
    if (!designTokens) {
      return basePrompt;
    }

    let prompt = basePrompt + '\n\n';

    if (designTokens.colors || designTokens.fonts || designTokens.spacing || designTokens.borderRadius) {
      prompt += 'Design tokens:\n';

      if (designTokens.colors) {
        prompt += '- Colors: ' + JSON.stringify(designTokens.colors) + '\n';
      }

      if (designTokens.fonts) {
        prompt += '- Fonts: ' + JSON.stringify(designTokens.fonts) + '\n';
      }

      if (designTokens.spacing) {
        prompt += '- Spacing: ' + JSON.stringify(designTokens.spacing) + '\n';
      }

      if (designTokens.borderRadius) {
        prompt += '- Border Radius: ' + JSON.stringify(designTokens.borderRadius) + '\n';
      }
    }

    return prompt;
  }

  /**
   * Parse v0 API response into our format
   * Note: This is a simplified adapter for the v0 SDK response format
   */
  private parseGenerationResponse(response: unknown): V0GenerationResponse {
    // Type guard and parse response
    if (
      typeof response === 'object' &&
      response !== null &&
      'id' in response &&
      typeof response.id === 'string'
    ) {
      const resp = response as {
        id: string;
        files?: Array<{ path?: string; content?: string; name?: string; source?: string }>;
        demo_url?: string;
        demoUrl?: string;
        latestVersion?: {
          demoUrl?: string;
          files?: Array<{ name?: string; content?: string }>;
        };
      };

      // Extract files from various possible locations in response
      const files: CodeFile[] = [];

      // Try files array at root level
      if (Array.isArray(resp.files)) {
        for (const file of resp.files) {
          if (file && typeof file === 'object') {
            const path = ('path' in file && file.path) || ('name' in file && file.name) || '';
            const content =
              ('content' in file && file.content) || ('source' in file && file.source) || '';
            if (path && content) {
              files.push({ path: String(path), content: String(content) });
            }
          }
        }
      }

      // Try files in latestVersion
      if (resp.latestVersion?.files && Array.isArray(resp.latestVersion.files)) {
        for (const file of resp.latestVersion.files) {
          if (file && typeof file === 'object' && 'name' in file && 'content' in file) {
            files.push({
              path: String(file.name),
              content: String(file.content),
            });
          }
        }
      }

      // Extract demo URL from various possible locations
      const demoUrl =
        resp.demo_url || resp.demoUrl || resp.latestVersion?.demoUrl || undefined;

      return {
        chatId: resp.id,
        files,
        demoUrl,
      };
    }

    // Fallback for unexpected response format
    throw new V0ApiError('Invalid response format from v0 API');
  }

  /**
   * Parse export response
   */
  private parseExportResponse(response: unknown): CodeFile[] {
    // Type guard and parse response
    if (
      typeof response === 'object' &&
      response !== null &&
      'files' in response &&
      Array.isArray(response.files)
    ) {
      const files: CodeFile[] = [];

      for (const file of response.files) {
        if (file && typeof file === 'object') {
          const path = ('path' in file && file.path) || ('name' in file && file.name) || '';
          const content =
            ('content' in file && file.content) || ('source' in file && file.source) || '';
          if (path && content) {
            files.push({ path: String(path), content: String(content) });
          }
        }
      }

      return files;
    }

    return [];
  }

  /**
   * Execute function with retry logic (exponential backoff)
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, throw the error
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = this.baseRetryDelay * Math.pow(2, attempt);

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
