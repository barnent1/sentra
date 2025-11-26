/**
 * Test Refinement Service Tests
 *
 * Tests for LLM-based E2E test refinement when template matching fails
 * Part of Phase 3.2 Week 5: LLM Refinement
 *
 * @module tests/unit/services/test-refinement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRefinementService } from '../../../src/services/test-refinement';
import type { E2ETest } from '../../../src/schemas/e2e-spec.schema';

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

// Mock database
vi.mock('../../../src/services/database-drizzle', () => ({
  DatabaseService: {
    getUserSettings: vi.fn(),
  },
}));

describe('TestRefinementService', () => {
  let service: TestRefinementService;
  const mockUserId = 'test-user-123';
  const mockApiKey = 'sk-ant-test-key';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestRefinementService();
  });

  describe('refineTest', () => {
    it('should generate test using Haiku for simple tests', async () => {
      // ARRANGE
      const simpleTest: E2ETest = {
        name: 'User clicks button',
        description: 'Simple button click test',
        steps: ['Navigate to /dashboard', 'Click button'],
        assertions: ['Button is clicked'],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue({
        anthropicApiKey: mockApiKey,
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `test('should click button', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button');
  await expect(page.locator('button')).toBeVisible();
});`,
          },
        ],
        usage: {
          input_tokens: 150,
          output_tokens: 80,
        },
      });

      // ACT
      const result = await service.refineTest(simpleTest, mockUserId);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.testCode).toContain("test('should click button'");
        expect(result.testCode).toContain("page.goto('/dashboard')");
        expect(result.model).toBe('claude-3-5-haiku-20241022');
        expect(result.cost).toBeGreaterThan(0);
        expect(result.tokensUsed.input).toBe(150);
        expect(result.tokensUsed.output).toBe(80);
      }
    });

    it('should generate test using Sonnet for complex tests', async () => {
      // ARRANGE
      const complexTest: E2ETest = {
        name: 'Multi-step workflow with conditional logic',
        description: 'Complex test requiring decision making',
        steps: [
          'Navigate to /dashboard',
          'If modal is open, close it',
          'Wait for animation',
          'Click first card if it exists',
          'Verify count increased by 1',
        ],
        assertions: [
          'Count is correct',
          'Animation completed',
          'State persisted',
        ],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue({
        anthropicApiKey: mockApiKey,
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `test('should handle complex workflow', async ({ page }) => {
  await page.goto('/dashboard');
  const modal = page.getByRole('dialog');
  if (await modal.isVisible()) await modal.close();
  await page.waitForTimeout(300);
  const cards = page.locator('[data-testid="card"]');
  if (await cards.count() > 0) await cards.first().click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});`,
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 250,
        },
      });

      // ACT
      const result = await service.refineTest(complexTest, mockUserId);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.testCode).toContain('if (await');
        expect(result.model).toBe('claude-3-5-sonnet-20241022');
        expect(result.cost).toBeGreaterThan(0);
      }
    });

    it('should return error if API key not found', async () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test',
        description: 'Test',
        steps: ['Step'],
        assertions: ['Assert'],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue(null);

      // ACT
      const result = await service.refineTest(test, mockUserId);

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('auth');
        expect(result.error.message).toContain('API key not found');
      }
    });

    it('should return error if API call fails', async () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test',
        description: 'Test',
        steps: ['Step'],
        assertions: ['Assert'],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue({
        anthropicApiKey: mockApiKey,
      });

      mockCreate.mockRejectedValue(new Error('API Error'));

      // ACT
      const result = await service.refineTest(test, mockUserId);

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('api');
        expect(result.error.message).toContain('API Error');
      }
    });

    it('should handle rate limit errors', async () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test',
        description: 'Test',
        steps: ['Step'],
        assertions: ['Assert'],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue({
        anthropicApiKey: mockApiKey,
      });

      mockCreate.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      });

      // ACT
      const result = await service.refineTest(test, mockUserId);

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('rate_limit');
        expect(result.error.message).toContain('Rate limit');
      }
    });

    it('should include example tests in prompt context', async () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test navigation',
        description: 'Navigate between pages',
        steps: ['Go to dashboard', 'Click settings'],
        assertions: ['URL changed'],
      };

      const { DatabaseService } = await import(
        '../../../src/services/database-drizzle'
      );
      vi.mocked(DatabaseService.getUserSettings).mockResolvedValue({
        anthropicApiKey: mockApiKey,
      });

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'test code' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      // ACT
      await service.refineTest(test, mockUserId);

      // ASSERT
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('Existing test examples');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for Haiku model', () => {
      // ARRANGE
      const simpleTest: E2ETest = {
        name: 'Simple test',
        description: 'Simple',
        steps: ['Step 1', 'Step 2'],
        assertions: ['Assert'],
      };

      // ACT
      const estimate = service.estimateCost(simpleTest);

      // ASSERT
      expect(estimate.model).toBe('claude-3-5-haiku-20241022');
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.estimatedCost).toBeLessThan(0.01); // Haiku is cheap
    });

    it('should estimate higher cost for Sonnet model', () => {
      // ARRANGE
      const complexTest: E2ETest = {
        name: 'Complex test with many steps',
        description: 'Very complex test requiring deep reasoning',
        steps: [
          'Step 1',
          'Step 2',
          'Step 3',
          'Step 4',
          'Step 5',
          'Step 6',
        ],
        assertions: ['Assert 1', 'Assert 2', 'Assert 3', 'Assert 4'],
      };

      // ACT
      const estimate = service.estimateCost(complexTest);
      const haikuTest: E2ETest = {
        name: 'Simple',
        description: 'Simple',
        steps: ['Step 1', 'Step 2'],
        assertions: ['Assert'],
      };
      const haikuEstimate = service.estimateCost(haikuTest);

      // ASSERT
      expect(estimate.model).toBe('claude-3-5-sonnet-20241022');
      expect(estimate.estimatedCost).toBeGreaterThan(haikuEstimate.estimatedCost); // Sonnet is more expensive
    });
  });

  describe('shouldUseHaiku', () => {
    it('should use Haiku for tests with ≤3 steps', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Simple',
        description: 'Simple',
        steps: ['Step 1', 'Step 2', 'Step 3'],
        assertions: ['Assert'],
      };

      // ACT
      const result = service.shouldUseHaiku(test);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should use Sonnet for tests with >3 steps', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Complex',
        description: 'Complex',
        steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
        assertions: ['Assert'],
      };

      // ACT
      const result = service.shouldUseHaiku(test);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should use Sonnet if description contains complex keywords', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test',
        description: 'Conditional logic based on state',
        steps: ['Step 1', 'Step 2'],
        assertions: ['Assert'],
      };

      // ACT
      const result = service.shouldUseHaiku(test);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should use Sonnet if steps contain conditional keywords', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test',
        description: 'Test',
        steps: ['Navigate to page', 'If modal exists, close it'],
        assertions: ['Assert'],
      };

      // ACT
      const result = service.shouldUseHaiku(test);

      // ASSERT
      expect(result).toBe(false);
    });
  });

  describe('generatePrompt', () => {
    it('should generate proper prompt for test', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'User clicks button',
        description: 'Verify button click',
        steps: ['Navigate to /page', 'Click button'],
        assertions: ['Button clicked'],
      };

      // ACT
      const prompt = service.generatePrompt(test);

      // ASSERT
      expect(prompt).toContain('User clicks button');
      expect(prompt).toContain('Navigate to /page');
      expect(prompt).toContain('Click button');
      expect(prompt).toContain('Button clicked');
      expect(prompt).toContain('Playwright');
      expect(prompt).toContain('data-testid');
    });
  });
});
