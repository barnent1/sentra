/**
 * Cost Tracker Service Tests
 *
 * This file tests the cost tracking system for AI API calls.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CostTracker,
  APICall,
  CostSummary,
  CostBreakdown,
  ModelPricing,
  ProjectCosts,
} from '@/services/cost-tracker';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    // Create fresh instance for each test
    tracker = new CostTracker();
  });

  describe('constructor', () => {
    it('should initialize with empty call history', () => {
      const summary = tracker.getCostSummary();
      expect(summary.totalCost).toBe(0);
      expect(summary.totalCalls).toBe(0);
    });

    it('should load existing data from storage if available', () => {
      // Mock localStorage with existing data
      const existingData = {
        calls: [
          {
            id: '1',
            timestamp: new Date('2025-11-13T10:00:00Z'),
            provider: 'openai' as const,
            model: 'gpt-4o',
            projectId: 'quetrex',
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.045,
          },
        ],
      };

      const trackerWithData = new CostTracker(existingData.calls);
      const summary = trackerWithData.getCostSummary();

      expect(summary.totalCost).toBe(0.045);
      expect(summary.totalCalls).toBe(1);
    });
  });

  describe('trackOpenAICall', () => {
    it('should track GPT-4 chat completion call', () => {
      const call = tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'quetrex',
        inputTokens: 1000,
        outputTokens: 500,
      });

      expect(call.provider).toBe('openai');
      expect(call.model).toBe('gpt-4o');
      expect(call.inputTokens).toBe(1000);
      expect(call.outputTokens).toBe(500);
      expect(call.cost).toBeGreaterThan(0);
      expect(call.id).toBeDefined();
      expect(call.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate correct cost for GPT-4o', () => {
      // GPT-4o pricing: $0.0025 per 1K input, $0.01 per 1K output
      const call = tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'test',
        inputTokens: 2000,
        outputTokens: 1000,
      });

      const expectedCost = (2000 / 1000) * 0.0025 + (1000 / 1000) * 0.01;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should calculate correct cost for GPT-3.5-turbo', () => {
      // GPT-3.5-turbo pricing: $0.0005 per 1K input, $0.0015 per 1K output
      const call = tracker.trackOpenAICall({
        model: 'gpt-3.5-turbo',
        projectId: 'test',
        inputTokens: 5000,
        outputTokens: 2000,
      });

      const expectedCost = (5000 / 1000) * 0.0005 + (2000 / 1000) * 0.0015;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should track Whisper STT call', () => {
      // Whisper pricing: $0.006 per minute
      const call = tracker.trackOpenAICall({
        model: 'whisper-1',
        projectId: 'quetrex',
        audioSeconds: 90, // 1.5 minutes
      });

      const expectedCost = (90 / 60) * 0.006;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
      expect(call.inputTokens).toBeUndefined();
      expect(call.outputTokens).toBeUndefined();
    });

    it('should track TTS call', () => {
      // TTS pricing: $0.015 per 1M characters
      const call = tracker.trackOpenAICall({
        model: 'tts-1',
        projectId: 'quetrex',
        characters: 50000, // 50K characters
      });

      const expectedCost = (50000 / 1000000) * 15;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should handle TTS-HD with higher pricing', () => {
      // TTS-HD pricing: $0.030 per 1M characters
      const call = tracker.trackOpenAICall({
        model: 'tts-1-hd',
        projectId: 'quetrex',
        characters: 100000,
      });

      const expectedCost = (100000 / 1000000) * 30;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should throw error for unknown model', () => {
      expect(() => {
        tracker.trackOpenAICall({
          model: 'unknown-model' as any,
          projectId: 'test',
          inputTokens: 100,
          outputTokens: 50,
        });
      }).toThrow('Unknown OpenAI model: unknown-model');
    });

    it('should throw error for missing required parameters', () => {
      expect(() => {
        tracker.trackOpenAICall({
          model: 'gpt-4o',
          projectId: 'test',
          // Missing tokens
        } as any);
      }).toThrow();
    });
  });

  describe('trackAnthropicCall', () => {
    it('should track Claude Sonnet call', () => {
      const call = tracker.trackAnthropicCall({
        model: 'claude-sonnet-4-5',
        projectId: 'quetrex',
        inputTokens: 2000,
        outputTokens: 1000,
      });

      expect(call.provider).toBe('anthropic');
      expect(call.model).toBe('claude-sonnet-4-5');
      expect(call.cost).toBeGreaterThan(0);
    });

    it('should calculate correct cost for Claude Sonnet 4.5', () => {
      // Claude Sonnet 4.5 pricing: $0.003 per 1K input, $0.015 per 1K output
      const call = tracker.trackAnthropicCall({
        model: 'claude-sonnet-4-5',
        projectId: 'test',
        inputTokens: 5000,
        outputTokens: 2000,
      });

      const expectedCost = (5000 / 1000) * 0.003 + (2000 / 1000) * 0.015;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should calculate correct cost for Claude Opus 4', () => {
      // Claude Opus pricing: $0.015 per 1K input, $0.075 per 1K output
      const call = tracker.trackAnthropicCall({
        model: 'claude-opus-4',
        projectId: 'test',
        inputTokens: 3000,
        outputTokens: 1500,
      });

      const expectedCost = (3000 / 1000) * 0.015 + (1500 / 1000) * 0.075;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should calculate correct cost for Claude Haiku', () => {
      // Claude Haiku pricing: $0.0008 per 1K input, $0.004 per 1K output
      const call = tracker.trackAnthropicCall({
        model: 'claude-haiku-3-5',
        projectId: 'test',
        inputTokens: 10000,
        outputTokens: 5000,
      });

      const expectedCost = (10000 / 1000) * 0.0008 + (5000 / 1000) * 0.004;
      expect(call.cost).toBeCloseTo(expectedCost, 4);
    });

    it('should throw error for unknown model', () => {
      expect(() => {
        tracker.trackAnthropicCall({
          model: 'unknown-model' as any,
          projectId: 'test',
          inputTokens: 100,
          outputTokens: 50,
        });
      }).toThrow('Unknown Anthropic model: unknown-model');
    });
  });

  describe('getCostSummary', () => {
    beforeEach(() => {
      // Add sample data
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'quetrex',
        inputTokens: 1000,
        outputTokens: 500,
      });

      tracker.trackOpenAICall({
        model: 'whisper-1',
        projectId: 'quetrex',
        audioSeconds: 60,
      });

      tracker.trackAnthropicCall({
        model: 'claude-sonnet-4-5',
        projectId: 'blog',
        inputTokens: 2000,
        outputTokens: 1000,
      });
    });

    it('should return total cost across all calls', () => {
      const summary = tracker.getCostSummary();
      expect(summary.totalCost).toBeGreaterThan(0);
    });

    it('should return total number of calls', () => {
      const summary = tracker.getCostSummary();
      expect(summary.totalCalls).toBe(3);
    });

    it('should break down costs by provider', () => {
      const summary = tracker.getCostSummary();

      expect(summary.byProvider.openai).toBeDefined();
      expect(summary.byProvider.anthropic).toBeDefined();
      expect(summary.byProvider.openai.cost).toBeGreaterThan(0);
      expect(summary.byProvider.anthropic.cost).toBeGreaterThan(0);
      expect(summary.byProvider.openai.calls).toBe(2);
      expect(summary.byProvider.anthropic.calls).toBe(1);
    });

    it('should break down costs by model', () => {
      const summary = tracker.getCostSummary();

      expect(summary.byModel['gpt-4o']).toBeDefined();
      expect(summary.byModel['whisper-1']).toBeDefined();
      expect(summary.byModel['claude-sonnet-4-5']).toBeDefined();

      expect(summary.byModel['gpt-4o'].cost).toBeGreaterThan(0);
      expect(summary.byModel['gpt-4o'].calls).toBe(1);
    });

    it('should break down costs by project', () => {
      const summary = tracker.getCostSummary();

      expect(summary.byProject.quetrex).toBeDefined();
      expect(summary.byProject.blog).toBeDefined();
      expect(summary.byProject.quetrex.calls).toBe(2);
      expect(summary.byProject.blog.calls).toBe(1);
    });

    it('should calculate total tokens used', () => {
      const summary = tracker.getCostSummary();

      expect(summary.totalTokens.input).toBe(3000); // 1000 + 2000
      expect(summary.totalTokens.output).toBe(1500); // 500 + 1000
    });
  });

  describe('getProjectCosts', () => {
    beforeEach(() => {
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'quetrex',
        inputTokens: 1000,
        outputTokens: 500,
      });

      tracker.trackOpenAICall({
        model: 'whisper-1',
        projectId: 'quetrex',
        audioSeconds: 60,
      });

      tracker.trackAnthropicCall({
        model: 'claude-sonnet-4-5',
        projectId: 'blog',
        inputTokens: 2000,
        outputTokens: 1000,
      });
    });

    it('should return costs for specific project', () => {
      const quetrexCosts = tracker.getProjectCosts('quetrex');

      expect(quetrexCosts.totalCost).toBeGreaterThan(0);
      expect(quetrexCosts.totalCalls).toBe(2);
    });

    it('should only include calls from specified project', () => {
      const blogCosts = tracker.getProjectCosts('blog');

      expect(blogCosts.totalCalls).toBe(1);
      expect(blogCosts.byModel['claude-sonnet-4-5']).toBeDefined();
      expect(blogCosts.byModel['gpt-4o']).toBeUndefined();
    });

    it('should return zero costs for non-existent project', () => {
      const nonExistent = tracker.getProjectCosts('non-existent');

      expect(nonExistent.totalCost).toBe(0);
      expect(nonExistent.totalCalls).toBe(0);
    });
  });

  describe('getCostsByTimeRange', () => {
    beforeEach(() => {
      // Add calls with specific timestamps
      const now = new Date('2025-11-13T12:00:00Z');
      const yesterday = new Date('2025-11-12T12:00:00Z');
      const lastWeek = new Date('2025-11-06T12:00:00Z');

      // Create tracker with pre-dated calls
      tracker = new CostTracker([
        {
          id: '1',
          timestamp: now,
          provider: 'openai',
          model: 'gpt-4o',
          projectId: 'quetrex',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.01,
        },
        {
          id: '2',
          timestamp: yesterday,
          provider: 'openai',
          model: 'gpt-4o',
          projectId: 'quetrex',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.01,
        },
        {
          id: '3',
          timestamp: lastWeek,
          provider: 'anthropic',
          model: 'claude-sonnet-4-5',
          projectId: 'blog',
          inputTokens: 2000,
          outputTokens: 1000,
          cost: 0.036,
        },
      ]);
    });

    it('should filter calls by date range', () => {
      const start = new Date('2025-11-12T00:00:00Z');
      const end = new Date('2025-11-14T00:00:00Z');

      const summary = tracker.getCostsByTimeRange(start, end);

      expect(summary.totalCalls).toBe(2); // Today and yesterday
    });

    it('should calculate costs only for specified range', () => {
      const start = new Date('2025-11-13T00:00:00Z');
      const end = new Date('2025-11-14T00:00:00Z');

      const summary = tracker.getCostsByTimeRange(start, end);

      expect(summary.totalCalls).toBe(1); // Only today
      expect(summary.totalCost).toBeCloseTo(0.01, 4);
    });

    it('should return empty summary for range with no calls', () => {
      const start = new Date('2025-11-01T00:00:00Z');
      const end = new Date('2025-11-05T00:00:00Z');

      const summary = tracker.getCostsByTimeRange(start, end);

      expect(summary.totalCalls).toBe(0);
      expect(summary.totalCost).toBe(0);
    });
  });

  describe('getDailyCosts', () => {
    beforeEach(() => {
      // Add multiple calls on different days
      const calls: APICall[] = [
        {
          id: '1',
          timestamp: new Date('2025-11-13T10:00:00Z'),
          provider: 'openai',
          model: 'gpt-4o',
          projectId: 'quetrex',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.01,
        },
        {
          id: '2',
          timestamp: new Date('2025-11-13T14:00:00Z'),
          provider: 'openai',
          model: 'gpt-4o',
          projectId: 'quetrex',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.01,
        },
        {
          id: '3',
          timestamp: new Date('2025-11-12T10:00:00Z'),
          provider: 'anthropic',
          model: 'claude-sonnet-4-5',
          projectId: 'blog',
          inputTokens: 2000,
          outputTokens: 1000,
          cost: 0.036,
        },
      ];

      tracker = new CostTracker(calls);
    });

    it('should return costs grouped by day', () => {
      const dailyCosts = tracker.getDailyCosts(7); // Last 7 days

      expect(dailyCosts.length).toBeGreaterThan(0);
      expect(dailyCosts[0]).toHaveProperty('date');
      expect(dailyCosts[0]).toHaveProperty('cost');
      expect(dailyCosts[0]).toHaveProperty('calls');
    });

    it('should aggregate multiple calls on same day', () => {
      const dailyCosts = tracker.getDailyCosts(7);
      const today = dailyCosts.find(d => d.date.includes('2025-11-13'));

      expect(today).toBeDefined();
      expect(today?.calls).toBe(2);
      expect(today?.cost).toBeCloseTo(0.02, 4);
    });

    it('should limit to specified number of days', () => {
      const dailyCosts = tracker.getDailyCosts(3);

      expect(dailyCosts.length).toBeLessThanOrEqual(3);
    });

    it('should return days in descending order (newest first)', () => {
      const dailyCosts = tracker.getDailyCosts(7);

      if (dailyCosts.length > 1) {
        const first = new Date(dailyCosts[0].date);
        const second = new Date(dailyCosts[1].date);
        expect(first.getTime()).toBeGreaterThan(second.getTime());
      }
    });
  });

  describe('clear', () => {
    it('should remove all tracked calls', () => {
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'test',
        inputTokens: 1000,
        outputTokens: 500,
      });

      tracker.clear();

      const summary = tracker.getCostSummary();
      expect(summary.totalCalls).toBe(0);
      expect(summary.totalCost).toBe(0);
    });

    it('should reset all aggregations', () => {
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'test',
        inputTokens: 1000,
        outputTokens: 500,
      });

      tracker.clear();

      const summary = tracker.getCostSummary();
      expect(Object.keys(summary.byProvider)).toHaveLength(0);
      expect(Object.keys(summary.byModel)).toHaveLength(0);
      expect(Object.keys(summary.byProject)).toHaveLength(0);
    });
  });

  describe('export/import', () => {
    it('should export calls to JSON format', () => {
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'quetrex',
        inputTokens: 1000,
        outputTokens: 500,
      });

      const exported = tracker.exportData();

      expect(exported).toHaveProperty('calls');
      expect(exported).toHaveProperty('exportedAt');
      expect(Array.isArray(exported.calls)).toBe(true);
      expect(exported.calls.length).toBe(1);
    });

    it('should import calls from JSON format', () => {
      const importData = {
        calls: [
          {
            id: '1',
            timestamp: new Date('2025-11-13T10:00:00Z'),
            provider: 'openai' as const,
            model: 'gpt-4o',
            projectId: 'quetrex',
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.01,
          },
        ],
        exportedAt: new Date(),
      };

      tracker.importData(importData);

      const summary = tracker.getCostSummary();
      expect(summary.totalCalls).toBe(1);
    });

    it('should preserve timestamps during export/import', () => {
      const originalTimestamp = new Date('2025-11-13T10:00:00Z');

      tracker = new CostTracker([
        {
          id: '1',
          timestamp: originalTimestamp,
          provider: 'openai',
          model: 'gpt-4o',
          projectId: 'quetrex',
          inputTokens: 1000,
          outputTokens: 500,
          cost: 0.01,
        },
      ]);

      const exported = tracker.exportData();
      const newTracker = new CostTracker();
      newTracker.importData(exported);

      const calls = newTracker.exportData().calls;
      expect(new Date(calls[0].timestamp).getTime()).toBe(originalTimestamp.getTime());
    });
  });

  describe('getMostExpensiveOperations', () => {
    beforeEach(() => {
      // Add various calls with different costs
      tracker.trackOpenAICall({
        model: 'gpt-4o',
        projectId: 'quetrex',
        inputTokens: 10000, // Expensive
        outputTokens: 5000,
      });

      tracker.trackOpenAICall({
        model: 'gpt-3.5-turbo',
        projectId: 'blog',
        inputTokens: 1000, // Cheap
        outputTokens: 500,
      });

      tracker.trackAnthropicCall({
        model: 'claude-opus-4',
        projectId: 'ecommerce',
        inputTokens: 5000, // Very expensive
        outputTokens: 3000,
      });
    });

    it('should return operations sorted by cost descending', () => {
      const expensive = tracker.getMostExpensiveOperations(5);

      expect(expensive.length).toBe(3);
      expect(expensive[0].cost).toBeGreaterThan(expensive[1].cost);
      expect(expensive[1].cost).toBeGreaterThan(expensive[2].cost);
    });

    it('should limit results to specified count', () => {
      const expensive = tracker.getMostExpensiveOperations(2);

      expect(expensive.length).toBe(2);
    });

    it('should include all call details', () => {
      const expensive = tracker.getMostExpensiveOperations(1);

      expect(expensive[0]).toHaveProperty('id');
      expect(expensive[0]).toHaveProperty('model');
      expect(expensive[0]).toHaveProperty('projectId');
      expect(expensive[0]).toHaveProperty('cost');
      expect(expensive[0]).toHaveProperty('timestamp');
    });
  });

  describe('getPricing', () => {
    it('should return current pricing for all models', () => {
      const pricing = CostTracker.getPricing();

      expect(pricing.openai).toBeDefined();
      expect(pricing.anthropic).toBeDefined();
    });

    it('should include OpenAI model pricing', () => {
      const pricing = CostTracker.getPricing();

      expect(pricing.openai['gpt-4o']).toBeDefined();
      const gpt4oPricing = pricing.openai['gpt-4o'];
      if ('input' in gpt4oPricing) {
        expect(gpt4oPricing.input).toBeGreaterThan(0);
        expect(gpt4oPricing.output).toBeGreaterThan(0);
      }
    });

    it('should include Anthropic model pricing', () => {
      const pricing = CostTracker.getPricing();

      expect(pricing.anthropic['claude-sonnet-4-5']).toBeDefined();
      expect(pricing.anthropic['claude-sonnet-4-5'].input).toBeGreaterThan(0);
      expect(pricing.anthropic['claude-sonnet-4-5'].output).toBeGreaterThan(0);
    });
  });
});
