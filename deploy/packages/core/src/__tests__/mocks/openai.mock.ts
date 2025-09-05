/**
 * OpenAI Client Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { jest } from '@jest/globals';

export interface MockEmbeddingResponse {
  readonly object: 'list';
  readonly data: readonly {
    readonly object: 'embedding';
    readonly index: number;
    readonly embedding: readonly number[];
  }[];
  readonly model: string;
  readonly usage: {
    readonly prompt_tokens: number;
    readonly total_tokens: number;
  };
}

export interface MockChatCompletionResponse {
  readonly id: string;
  readonly object: 'chat.completion';
  readonly created: number;
  readonly model: string;
  readonly choices: readonly {
    readonly index: number;
    readonly message: {
      readonly role: 'assistant';
      readonly content: string;
    };
    readonly finish_reason: 'stop' | 'length';
  }[];
  readonly usage: {
    readonly prompt_tokens: number;
    readonly completion_tokens: number;
    readonly total_tokens: number;
  };
}

export class MockOpenAIEmbeddings {
  create = jest.fn().mockImplementation(async (params: unknown): Promise<MockEmbeddingResponse> => {
    const {
      input,
      model = 'text-embedding-ada-002',
    } = params as {
      input: string | readonly string[];
      model?: string;
    };
    const inputs = Array.isArray(input) ? input : [input];
    
    // Generate deterministic embeddings based on input
    const generateEmbedding = (text: string): readonly number[] => {
      const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Generate 1536-dimensional vector (OpenAI embedding size)
      return Array.from({ length: 1536 }, (_, i) => {
        const seed = hash + i;
        return Math.sin(seed) * 0.1; // Small values to simulate real embeddings
      });
    };

    return {
      object: 'list',
      data: inputs.map((text, index) => ({
        object: 'embedding',
        index,
        embedding: generateEmbedding(text),
      })),
      model,
      usage: {
        prompt_tokens: inputs.join(' ').length,
        total_tokens: inputs.join(' ').length,
      },
    };
  });
}

export class MockOpenAIChat {
  completions = {
    create: jest.fn().mockImplementation(async (params: unknown): Promise<MockChatCompletionResponse> => {
      const {
        model = 'gpt-3.5-turbo',
        messages,
      } = params as {
        model?: string;
        messages: readonly any[];
        temperature?: number;
      };
      // Generate a simple response based on the last message
      const lastMessage = messages[messages.length - 1];
      const content = lastMessage?.content || '';
      
      // Generate different responses based on content patterns
      let responseContent = 'Generated response';
      if (content.includes('evolution')) {
        responseContent = 'This pattern shows strong evolutionary characteristics with improved fitness metrics.';
      } else if (content.includes('performance')) {
        responseContent = 'Performance analysis indicates optimal throughput with minimal latency.';
      } else if (content.includes('mutation')) {
        responseContent = 'The mutation strategy demonstrates effective adaptation mechanisms.';
      }

      return {
        id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: responseContent,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: content.length,
          completion_tokens: responseContent.length,
          total_tokens: content.length + responseContent.length,
        },
      };
    }),
  };
}

export class MockOpenAI {
  embeddings = new MockOpenAIEmbeddings();
  chat = new MockOpenAIChat();

  constructor(_config?: { apiKey: string }) {
    // Mock constructor - config parameter marked as unused with underscore prefix
    jest.fn().mockImplementation(() => this);
  }
}

// Factory function for creating mock client
export const createMockOpenAI = (config?: { apiKey: string }): MockOpenAI => {
  return new MockOpenAI(config);
};

// Jest module mock
export default jest.fn().mockImplementation((config: unknown) => {
  return createMockOpenAI(config as { apiKey: string } | undefined);
});