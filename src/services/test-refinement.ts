/**
 * Test Refinement Service
 *
 * LLM-based E2E test refinement for complex test cases
 * Uses Anthropic Claude API when template matching score < 0.7
 *
 * Part of Phase 3.2 Week 5: LLM Refinement + CLI Tool
 *
 * @module services/test-refinement
 */

import Anthropic from '@anthropic-ai/sdk';
import { drizzleDb } from './database-drizzle';
import type { E2ETest } from '../schemas/e2e-spec.schema';

/**
 * Anthropic model types
 */
type AnthropicModel =
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-5-sonnet-20241022';

/**
 * Successful refinement result
 */
export interface RefinementSuccess {
  success: true;
  testCode: string;
  model: AnthropicModel;
  cost: number;
  tokensUsed: {
    input: number;
    output: number;
  };
}

/**
 * Refinement error types
 */
export type RefinementErrorType = 'auth' | 'api' | 'rate_limit' | 'validation' | 'unknown';

/**
 * Failed refinement result
 */
export interface RefinementError {
  success: false;
  error: {
    type: RefinementErrorType;
    message: string;
    details?: unknown;
  };
}

/**
 * Refinement result union type
 */
export type RefinementResult = RefinementSuccess | RefinementError;

/**
 * Cost estimation result
 */
export interface CostEstimate {
  model: AnthropicModel;
  estimatedCost: number;
  estimatedTokens: {
    input: number;
    output: number;
  };
}

/**
 * Pricing per million tokens (as of Nov 2024)
 */
const PRICING = {
  'claude-3-5-haiku-20241022': {
    input: 1.0, // $1.00 per million input tokens
    output: 5.0, // $5.00 per million output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.0, // $3.00 per million input tokens
    output: 15.0, // $15.00 per million output tokens
  },
};

/**
 * Keywords indicating complex test logic
 */
const COMPLEX_KEYWORDS = [
  'conditional',
  'if',
  'else',
  'loop',
  'multiple',
  'dynamic',
  'animation timing',
  'state management',
  'complex',
];

/**
 * Example Playwright tests for prompt context
 */
const EXAMPLE_TESTS = `
// Example 1: Simple button click
test('should toggle mute state', async ({ page }) => {
  const muteButton = page.locator('[data-testid="mute-button"]');
  await muteButton.click();
  await expect(muteButton).toHaveClass(/violet/);
});

// Example 2: Modal workflow
test('should open and close modal', async ({ page }) => {
  const openButton = page.locator('button:has-text("New Project")');
  await openButton.click();
  await page.waitForTimeout(200);

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  const closeButton = modal.locator('button:has-text("Cancel")');
  await closeButton.click();
  await expect(modal).not.toBeVisible();
});

// Example 3: Form validation
test('should disable submit when field is empty', async ({ page }) => {
  const nameField = page.locator('input[placeholder*="name"]');
  const submitButton = page.locator('button:has-text("Create")');

  await expect(submitButton).toBeDisabled();
  await nameField.fill('Test Project');
  await expect(submitButton).toBeEnabled();
});

// Example 4: Skip if no data
test('should show project count', async ({ page }) => {
  const projectCards = page.locator('[data-testid="project-card"]');

  if (await projectCards.count() === 0) {
    test.skip();
  }

  const count = await projectCards.count();
  expect(count).toBeGreaterThan(0);
});
`;

/**
 * TestRefinementService
 *
 * Generates E2E test code using Claude API for complex tests
 *
 * Algorithm:
 * 1. Determine model (Haiku for simple, Sonnet for complex)
 * 2. Fetch user's Anthropic API key from database
 * 3. Generate prompt with test spec + examples
 * 4. Call Claude API
 * 5. Extract test code from response
 * 6. Calculate cost
 *
 * @example
 * const service = new TestRefinementService();
 * const result = await service.refineTest(testSpec, userId);
 * if (result.success) {
 *   console.log(`Generated test (cost: $${result.cost})`);
 *   console.log(result.testCode);
 * }
 */
export class TestRefinementService {
  /**
   * Refine E2E test using Claude API
   *
   * @param test - E2E test specification
   * @param userId - User ID to fetch API key for
   * @returns Refinement result with test code or error
   */
  async refineTest(
    test: E2ETest,
    userId: string
  ): Promise<RefinementResult> {
    try {
      // 1. Fetch API key from database
      const settings = await drizzleDb.getSettingsByUserId(userId);

      if (!settings?.anthropicApiKey) {
        return {
          success: false,
          error: {
            type: 'auth',
            message: 'Anthropic API key not found. Please configure in settings.',
          },
        };
      }

      // 2. Determine model (cost optimization)
      const model = this.shouldUseHaiku(test)
        ? 'claude-3-5-haiku-20241022'
        : 'claude-3-5-sonnet-20241022';

      // 3. Generate prompt
      const prompt = this.generatePrompt(test);

      // 4. Call Claude API
      const client = new Anthropic({
        apiKey: settings.anthropicApiKey,
      });

      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // 5. Extract test code
      const testCode = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n')
        .trim();

      // 6. Calculate cost
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = this.calculateCost(model, inputTokens, outputTokens);

      return {
        success: true,
        testCode,
        model,
        cost,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
      };
    } catch (error: any) {
      // Handle specific error types
      if (error.status === 429) {
        return {
          success: false,
          error: {
            type: 'rate_limit',
            message: 'Rate limit exceeded. Please try again later.',
            details: error,
          },
        };
      }

      if (error.status === 401) {
        return {
          success: false,
          error: {
            type: 'auth',
            message: 'Invalid API key. Please check your Anthropic API key.',
            details: error,
          },
        };
      }

      return {
        success: false,
        error: {
          type: 'api',
          message: error.message || 'Unknown API error',
          details: error,
        },
      };
    }
  }

  /**
   * Estimate cost for test refinement
   *
   * @param test - E2E test specification
   * @returns Cost estimate with model and token counts
   */
  estimateCost(test: E2ETest): CostEstimate {
    const model = this.shouldUseHaiku(test)
      ? 'claude-3-5-haiku-20241022'
      : 'claude-3-5-sonnet-20241022';

    // Estimate tokens based on test complexity
    const promptLength = this.generatePrompt(test).length;
    const estimatedInputTokens = Math.ceil(promptLength / 4); // ~4 chars per token
    const estimatedOutputTokens = 300; // Average test is ~300 tokens

    const cost = this.calculateCost(
      model,
      estimatedInputTokens,
      estimatedOutputTokens
    );

    return {
      model,
      estimatedCost: cost,
      estimatedTokens: {
        input: estimatedInputTokens,
        output: estimatedOutputTokens,
      },
    };
  }

  /**
   * Determine if Haiku is sufficient for test
   *
   * Uses Haiku (faster, cheaper) for simple tests
   * Uses Sonnet (smarter, more expensive) for complex tests
   *
   * @param test - E2E test specification
   * @returns true if Haiku should be used, false for Sonnet
   */
  shouldUseHaiku(test: E2ETest): boolean {
    // Use Sonnet if >3 steps (complex workflow)
    if (test.steps.length > 3) {
      return false;
    }

    // Use Sonnet if >3 assertions (complex verification)
    if (test.assertions.length > 3) {
      return false;
    }

    // Use Sonnet if description contains complexity keywords
    const description = test.description.toLowerCase();
    const steps = test.steps.join(' ').toLowerCase();
    const allText = `${description} ${steps}`;

    for (const keyword of COMPLEX_KEYWORDS) {
      if (allText.includes(keyword)) {
        return false;
      }
    }

    // Default to Haiku for simple tests
    return true;
  }

  /**
   * Generate Claude API prompt for test
   *
   * @param test - E2E test specification
   * @returns Formatted prompt
   */
  generatePrompt(test: E2ETest): string {
    return `You are an expert Playwright test generator for Quetrex, a voice-first AI assistant web application.

Generate a Playwright E2E test based on this specification:

**Test Name:** ${test.name}
**Description:** ${test.description}

**Steps:**
${test.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Assertions:**
${test.assertions.map((assertion, i) => `${i + 1}. ${assertion}`).join('\n')}

**Requirements:**
1. Use Playwright test syntax with AAA pattern (Arrange, Act, Assert)
2. Include proper data-testid selectors: \`[data-testid="element-name"]\`
3. Add appropriate waitForTimeout for animations (default 200ms)
4. Handle edge cases: Skip test if no data exists using \`if (await element.count() === 0) test.skip();\`
5. Follow existing Quetrex test patterns
6. Use proper locators: \`page.locator('[data-testid="..."]')\`, \`page.getByRole('...')\`, \`page.getByText('...')\`
7. Include proper assertions: \`expect(element).toBeVisible()\`, \`expect(element).toHaveText('...')\`, etc.
8. Add comments for ARRANGE, ACT, ASSERT sections

**Existing test examples:**
${EXAMPLE_TESTS}

**Output ONLY the test code, no explanations or markdown.**`;
  }

  /**
   * Calculate cost based on token usage
   *
   * @param model - Anthropic model used
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Cost in USD
   */
  private calculateCost(
    model: AnthropicModel,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = PRICING[model];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }
}
