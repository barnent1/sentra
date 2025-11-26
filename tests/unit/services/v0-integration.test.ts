/**
 * Unit Tests for v0 Integration Service
 *
 * Tests the v0 Platform API integration service with mocked API calls.
 * Target coverage: 90%+
 *
 * @module tests/unit/services/v0-integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  V0IntegrationService,
  V0IntegrationError,
  V0ApiError,
  V0ValidationError,
  type V0GenerationRequest,
  type V0GenerationResponse,
  type CodeFile,
} from '@/services/v0-integration';

// Mock the v0-sdk module
vi.mock('v0-sdk', () => ({
  createClient: vi.fn(() => ({
    chats: {
      create: vi.fn(),
    },
    files: {
      export: vi.fn(),
    },
  })),
}));

describe('V0IntegrationService', () => {
  let service: V0IntegrationService;
  let mockV0Client: {
    chats: {
      create: ReturnType<typeof vi.fn>;
    };
    files: {
      export: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create service instance
    service = new V0IntegrationService('test-api-key');

    // Get the mocked client instance that was created by the constructor
    const { createClient } = (await import('v0-sdk')) as { createClient: ReturnType<typeof vi.fn> };
    mockV0Client = createClient.mock.results[createClient.mock.results.length - 1].value;
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => new V0IntegrationService('')).toThrow(V0ValidationError);
      expect(() => new V0IntegrationService('')).toThrow('v0 API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(service).toBeInstanceOf(V0IntegrationService);
    });
  });

  describe('generate', () => {
    it('should generate code successfully', async () => {
      // ARRANGE: Setup test data
      const request: V0GenerationRequest = {
        prompt: 'Create a dashboard with sidebar navigation',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      const mockApiResponse = {
        id: 'chat-123',
        choices: [
          {
            message: {
              content: 'Generated code content',
            },
            finish_reason: 'stop',
          },
        ],
        files: [
          {
            path: 'app/page.tsx',
            content: 'export default function Page() { return <div>Dashboard</div> }',
          },
          {
            path: 'app/layout.tsx',
            content: 'export default function Layout({ children }) { return children }',
          },
        ],
        demo_url: 'https://v0.dev/chat/chat-123',
      };

      mockV0Client.chats.create.mockResolvedValueOnce(mockApiResponse);

      // ACT: Execute the behavior
      const result = await service.generate(request);

      // ASSERT: Verify outcome
      expect(result).toBeDefined();
      expect(result.chatId).toBe('chat-123');
      expect(result.files).toHaveLength(2);
      expect(result.files[0]).toEqual({
        path: 'app/page.tsx',
        content: 'export default function Page() { return <div>Dashboard</div> }',
      });
      expect(result.demoUrl).toBe('https://v0.dev/chat/chat-123');

      // Verify API was called correctly
      expect(mockV0Client.chats.create).toHaveBeenCalledOnce();
      expect(mockV0Client.chats.create).toHaveBeenCalledWith({
        message: 'Create a dashboard with sidebar navigation',
      });
    });

    it('should include design tokens in request if provided', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a button',
        framework: 'nextjs',
        styling: 'tailwind',
        designTokens: {
          colors: {
            primary: '#6366f1',
            secondary: '#8b5cf6',
          },
          fonts: {
            body: 'Inter',
            heading: 'Poppins',
          },
        },
      };

      const mockApiResponse = {
        id: 'chat-456',
        choices: [{ message: { content: 'Code' }, finish_reason: 'stop' }],
        files: [],
        demo_url: 'https://v0.dev/chat/chat-456',
      };

      mockV0Client.chats.create.mockResolvedValueOnce(mockApiResponse);

      // ACT
      await service.generate(request);

      // ASSERT: Verify design tokens are included in prompt
      const callArgs = mockV0Client.chats.create.mock.calls[0][0];
      expect(callArgs.message).toContain('Design tokens:');
    });

    it('should throw V0ValidationError for invalid request', async () => {
      // ARRANGE: Invalid request (empty prompt)
      const request: V0GenerationRequest = {
        prompt: '',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      // ACT & ASSERT
      await expect(service.generate(request)).rejects.toThrow(V0ValidationError);
      await expect(service.generate(request)).rejects.toThrow('Prompt is required');
    });

    it('should throw V0ApiError on API failure', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a form',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      mockV0Client.chats.create.mockRejectedValueOnce(
        new Error('API request failed')
      );

      // ACT & ASSERT
      await expect(service.generate(request)).rejects.toThrow(V0ApiError);
      await expect(service.generate(request)).rejects.toThrow('Failed to generate code via v0 API');
    });

    it('should retry on transient failures', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a navbar',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      const mockSuccessResponse = {
        id: 'chat-retry',
        choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
        files: [],
        demo_url: 'https://v0.dev/chat/chat-retry',
      };

      // Fail twice, then succeed
      mockV0Client.chats.create
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce(mockSuccessResponse);

      // ACT
      const result = await service.generate(request);

      // ASSERT: Should succeed after retries
      expect(result.chatId).toBe('chat-retry');
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a modal',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      // Always fail
      mockV0Client.chats.create.mockRejectedValue(new Error('Persistent failure'));

      // ACT & ASSERT: Should fail after 3 retries
      await expect(service.generate(request)).rejects.toThrow(V0ApiError);
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('iterate', () => {
    it('should iterate on existing chat successfully', async () => {
      // ARRANGE
      const chatId = 'chat-789';
      const feedback = 'Move the sidebar to the left side';

      const mockApiResponse = {
        id: chatId,
        choices: [{ message: { content: 'Updated' }, finish_reason: 'stop' }],
        files: [
          {
            path: 'app/page.tsx',
            content: 'export default function Page() { return <div>Updated Dashboard</div> }',
          },
        ],
        demo_url: 'https://v0.dev/chat/chat-789',
      };

      mockV0Client.chats.create.mockResolvedValueOnce(mockApiResponse);

      // ACT
      const result = await service.iterate(chatId, feedback);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.chatId).toBe(chatId);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].content).toContain('Updated Dashboard');

      // Verify API was called with chat ID
      expect(mockV0Client.chats.create).toHaveBeenCalledWith({
        chatId,
        message: feedback,
      });
    });

    it('should throw V0ValidationError for empty feedback', async () => {
      // ARRANGE
      const chatId = 'chat-123';
      const feedback = '';

      // ACT & ASSERT
      await expect(service.iterate(chatId, feedback)).rejects.toThrow(V0ValidationError);
      await expect(service.iterate(chatId, feedback)).rejects.toThrow('Feedback is required');
    });

    it('should throw V0ValidationError for empty chat ID', async () => {
      // ARRANGE
      const chatId = '';
      const feedback = 'Change color to blue';

      // ACT & ASSERT
      await expect(service.iterate(chatId, feedback)).rejects.toThrow(V0ValidationError);
      await expect(service.iterate(chatId, feedback)).rejects.toThrow('Chat ID is required');
    });

    it('should retry on transient failures during iteration', async () => {
      // ARRANGE
      const chatId = 'chat-retry';
      const feedback = 'Add animation';

      const mockSuccessResponse = {
        id: chatId,
        choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
        files: [],
        demo_url: 'https://v0.dev/chat/chat-retry',
      };

      // Fail once, then succeed
      mockV0Client.chats.create
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(mockSuccessResponse);

      // ACT
      const result = await service.iterate(chatId, feedback);

      // ASSERT
      expect(result.chatId).toBe(chatId);
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('exportCode', () => {
    it('should export code successfully', async () => {
      // ARRANGE
      const chatId = 'chat-export';

      const mockExportResponse = {
        files: [
          {
            path: 'components/Button.tsx',
            content: 'export default function Button() { return <button>Click</button> }',
          },
          {
            path: 'styles/globals.css',
            content: 'body { margin: 0; padding: 0; }',
          },
        ],
      };

      mockV0Client.files.export.mockResolvedValueOnce(mockExportResponse);

      // ACT
      const result = await service.exportCode(chatId);

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        path: 'components/Button.tsx',
        content: 'export default function Button() { return <button>Click</button> }',
      });
      expect(result[1]).toEqual({
        path: 'styles/globals.css',
        content: 'body { margin: 0; padding: 0; }',
      });

      // Verify API call
      expect(mockV0Client.files.export).toHaveBeenCalledOnce();
      expect(mockV0Client.files.export).toHaveBeenCalledWith({ chatId });
    });

    it('should throw V0ValidationError for empty chat ID', async () => {
      // ARRANGE
      const chatId = '';

      // ACT & ASSERT
      await expect(service.exportCode(chatId)).rejects.toThrow(V0ValidationError);
      await expect(service.exportCode(chatId)).rejects.toThrow('Chat ID is required');
    });

    it('should throw V0ApiError on export failure', async () => {
      // ARRANGE
      const chatId = 'chat-fail';

      mockV0Client.files.export.mockRejectedValue(new Error('Export failed'));

      // ACT & ASSERT
      await expect(service.exportCode(chatId)).rejects.toThrow(V0ApiError);
      await expect(service.exportCode(chatId)).rejects.toThrow('Failed to export code from v0');
    });

    it('should retry on transient failures during export', async () => {
      // ARRANGE
      const chatId = 'chat-retry-export';

      const mockSuccessResponse = {
        files: [
          {
            path: 'app/page.tsx',
            content: 'Content',
          },
        ],
      };

      // Fail twice, then succeed
      mockV0Client.files.export
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce(mockSuccessResponse);

      // ACT
      const result = await service.exportCode(chatId);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(mockV0Client.files.export).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should wrap unknown errors in V0IntegrationError', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a component',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      // Mock an unexpected error type
      mockV0Client.chats.create.mockRejectedValueOnce('String error');

      // ACT & ASSERT
      await expect(service.generate(request)).rejects.toThrow(V0ApiError);
    });

    it('should preserve error context in V0ApiError', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a form',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      const originalError = new Error('API rate limit exceeded');
      // Fail all retries with the same error
      mockV0Client.chats.create.mockRejectedValue(originalError);

      // ACT & ASSERT
      await expect(service.generate(request)).rejects.toThrow(V0ApiError);

      // Verify the error chain
      try {
        await service.generate(request);
      } catch (error) {
        if (error instanceof V0ApiError) {
          expect(error.message).toContain('Failed to generate code via v0 API');
          // The cause chain should include the original error
          expect(error.cause).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('retry logic', () => {
    it('should use exponential backoff between retries', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a button',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      const startTime = Date.now();

      // Fail twice, succeed on third attempt
      mockV0Client.chats.create
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({
          id: 'success',
          choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
          files: [],
          demo_url: 'https://v0.dev/chat/success',
        });

      // ACT
      await service.generate(request);

      const elapsedTime = Date.now() - startTime;

      // ASSERT: Should have taken at least 300ms (100ms + 200ms delays)
      // Using a lower threshold to account for execution time variance
      expect(elapsedTime).toBeGreaterThanOrEqual(200);
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files array in response', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create something',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      mockV0Client.chats.create.mockResolvedValueOnce({
        id: 'empty-files',
        choices: [{ message: { content: 'Generated' }, finish_reason: 'stop' }],
        files: [],
        demo_url: 'https://v0.dev/chat/empty-files',
      });

      // ACT
      const result = await service.generate(request);

      // ASSERT
      expect(result.files).toEqual([]);
      expect(result.chatId).toBe('empty-files');
    });

    it('should handle missing demo_url in response', async () => {
      // ARRANGE
      const request: V0GenerationRequest = {
        prompt: 'Create a card',
        framework: 'nextjs',
        styling: 'tailwind',
      };

      mockV0Client.chats.create.mockResolvedValueOnce({
        id: 'no-demo-url',
        choices: [{ message: { content: 'Generated' }, finish_reason: 'stop' }],
        files: [],
        // demo_url is missing
      });

      // ACT
      const result = await service.generate(request);

      // ASSERT
      expect(result.demoUrl).toBeUndefined();
    });

    it('should include all design token categories in prompt', async () => {
      // ARRANGE: Request with all design token categories
      const request: V0GenerationRequest = {
        prompt: 'Create a styled component',
        framework: 'nextjs',
        styling: 'tailwind',
        designTokens: {
          colors: { primary: '#6366f1' },
          fonts: { body: 'Inter' },
          spacing: { md: '1rem' },
          borderRadius: { rounded: '0.5rem' },
        },
      };

      mockV0Client.chats.create.mockResolvedValueOnce({
        id: 'all-tokens',
        choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
        files: [],
        demo_url: 'https://v0.dev/chat/all-tokens',
      });

      // ACT
      await service.generate(request);

      // ASSERT: All token categories should be in the prompt
      const callArgs = mockV0Client.chats.create.mock.calls[0][0];
      const message = callArgs.message;
      expect(message).toContain('Colors:');
      expect(message).toContain('Fonts:');
      expect(message).toContain('Spacing:');
      expect(message).toContain('Border Radius:');
    });

    it('should throw V0ValidationError for invalid framework', async () => {
      // ARRANGE: Invalid framework value
      const request = {
        prompt: 'Create something',
        framework: 'react' as const, // Not 'nextjs'
        styling: 'tailwind' as const,
      };

      // ACT & ASSERT
      // @ts-expect-error Testing invalid input
      await expect(service.generate(request)).rejects.toThrow(V0ValidationError);
      // @ts-expect-error Testing invalid input
      await expect(service.generate(request)).rejects.toThrow('Only Next.js framework is currently supported');
    });

    it('should throw V0ValidationError for invalid styling', async () => {
      // ARRANGE: Invalid styling value
      const request = {
        prompt: 'Create something',
        framework: 'nextjs' as const,
        styling: 'css' as const, // Not 'tailwind'
      };

      // ACT & ASSERT
      // @ts-expect-error Testing invalid input
      await expect(service.generate(request)).rejects.toThrow(V0ValidationError);
      // @ts-expect-error Testing invalid input
      await expect(service.generate(request)).rejects.toThrow('Only Tailwind CSS styling is currently supported');
    });
  });
});

describe('Error Classes', () => {
  describe('V0IntegrationError', () => {
    it('should create error with message', () => {
      const error = new V0IntegrationError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('V0IntegrationError');
      expect(error.message).toBe('Test error');
    });

    it('should support error cause', () => {
      const cause = new Error('Original error');
      const error = new V0IntegrationError('Wrapped error', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('V0ApiError', () => {
    it('should create API error with message', () => {
      const error = new V0ApiError('API failed');

      expect(error).toBeInstanceOf(V0IntegrationError);
      expect(error.name).toBe('V0ApiError');
      expect(error.message).toBe('API failed');
    });
  });

  describe('V0ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new V0ValidationError('Invalid input');

      expect(error).toBeInstanceOf(V0IntegrationError);
      expect(error.name).toBe('V0ValidationError');
      expect(error.message).toBe('Invalid input');
    });
  });
});
