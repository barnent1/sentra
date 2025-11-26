/**
 * E2E Test Generator CLI
 *
 * Command-line tool to generate E2E tests from YAML specifications
 * Uses hybrid approach: templates for common patterns, LLM for complex cases
 *
 * Usage:
 *   npm run generate:e2e -- --spec path/to/spec.yaml --user userId
 *   npm run generate:e2e -- --spec path/to/spec.yaml --user userId --output tests/e2e/generated
 *
 * Part of Phase 3.2 Week 5: CLI Tool for E2E Test Generation
 *
 * @module cli/generate-e2e-tests
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { SpecParser } from '../services/spec-parser';
import { TemplateSelector } from '../services/template-selector';
import { TemplateRenderer } from '../services/template-renderer';
import { TestRefinementService } from '../services/test-refinement';
import type { E2ETest, ScreenSpec } from '../schemas/e2e-spec.schema';

/**
 * Generation result summary
 */
export interface GenerationSummary {
  totalTests: number;
  fromTemplates: number;
  fromLLM: number;
  totalCost: number;
  breakdown: {
    byTemplate: Record<string, number>;
    byModel?: Record<string, number>;
  };
}

/**
 * Successful generation result
 */
export interface GenerationSuccess {
  success: true;
  summary: GenerationSummary;
  filesGenerated: string[];
}

/**
 * Generation error types
 */
export type GenerationErrorType = 'parse' | 'validation' | 'generation' | 'io' | 'unknown';

/**
 * Failed generation result
 */
export interface GenerationError {
  success: false;
  error: {
    type: GenerationErrorType;
    message: string;
    details?: unknown;
  };
}

/**
 * Generation result union type
 */
export type GenerationResult = GenerationSuccess | GenerationError;

/**
 * Convert screen name to file name
 *
 * @param screenName - Screen name (e.g., "UserSettings")
 * @returns Kebab-case file name (e.g., "user-settings")
 */
function toKebabCase(screenName: string): string {
  return screenName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Generate E2E tests from spec file
 *
 * Algorithm:
 * 1. Parse YAML spec
 * 2. For each test:
 *    a. Use TemplateSelector to score templates
 *    b. If score >= 0.7, use TemplateRenderer
 *    c. If score < 0.7, use TestRefinementService (LLM)
 * 3. Combine all tests into single file
 * 4. Write to output directory
 * 5. Return summary with costs
 *
 * @param specPath - Absolute path to YAML spec file
 * @param outputDir - Output directory for generated tests
 * @param userId - User ID for fetching API keys
 * @returns Generation result with summary or error
 *
 * @example
 * const result = await generateE2ETestsFromSpec(
 *   '/path/to/dashboard.spec.yaml',
 *   '/path/to/tests/e2e/generated',
 *   'user-123'
 * );
 * if (result.success) {
 *   console.log(`Generated ${result.summary.totalTests} tests`);
 *   console.log(`Cost: $${result.summary.totalCost.toFixed(4)}`);
 * }
 */
export async function generateE2ETestsFromSpec(
  specPath: string,
  outputDir: string,
  userId: string
): Promise<GenerationResult> {
  try {
    // 1. Parse spec
    const parser = new SpecParser();
    const parseResult = await parser.parseFile(specPath);

    if (!parseResult.success) {
      return {
        success: false,
        error: {
          type: 'parse',
          message: parseResult.error.message,
          details: parseResult.error,
        },
      };
    }

    const spec = parseResult.data;

    // 2. Initialize services
    const selector = new TemplateSelector();
    const renderer = new TemplateRenderer();
    const refinement = new TestRefinementService();

    // 3. Generate tests
    const generatedTests: string[] = [];
    let totalCost = 0;
    let fromTemplates = 0;
    let fromLLM = 0;
    const templateBreakdown: Record<string, number> = {};
    const modelBreakdown: Record<string, number> = {};

    for (const test of spec.e2e_tests) {
      // Score template match
      const match = selector.selectTemplate(test);

      let testCode: string;

      if (match.shouldUseTemplate) {
        // Use template
        testCode = await generateFromTemplate(test, match.template, renderer);
        fromTemplates++;
        templateBreakdown[match.template] =
          (templateBreakdown[match.template] || 0) + 1;
      } else {
        // Use LLM
        const refinementResult = await refinement.refineTest(test, userId);

        if (!refinementResult.success) {
          return {
            success: false,
            error: {
              type: 'generation',
              message: `Failed to generate test "${test.name}": ${refinementResult.error.message}`,
              details: refinementResult.error,
            },
          };
        }

        testCode = refinementResult.testCode;
        totalCost += refinementResult.cost;
        fromLLM++;
        modelBreakdown[refinementResult.model] =
          (modelBreakdown[refinementResult.model] || 0) + 1;
      }

      generatedTests.push(testCode);
    }

    // 4. Combine tests into file
    const fileContent = generateTestFile(spec, generatedTests);

    // 5. Write to output directory
    const fileName = `${toKebabCase(spec.screen)}.spec.ts`;
    const outputPath = path.join(outputDir, fileName);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    await writeFile(outputPath, fileContent, 'utf-8');

    return {
      success: true,
      summary: {
        totalTests: spec.e2e_tests.length,
        fromTemplates,
        fromLLM,
        totalCost,
        breakdown: {
          byTemplate: templateBreakdown,
          byModel: Object.keys(modelBreakdown).length > 0 ? modelBreakdown : undefined,
        },
      },
      filesGenerated: [outputPath],
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        type: 'unknown',
        message: error.message || 'Unknown error during test generation',
        details: error,
      },
    };
  }
}

/**
 * Generate test from template
 *
 * @param test - E2E test specification
 * @param templateName - Template to use
 * @param renderer - Template renderer instance
 * @returns Generated test code
 */
async function generateFromTemplate(
  test: E2ETest,
  templateName: string,
  renderer: TemplateRenderer
): Promise<string> {
  // Load template based on template name
  // For now, generate simple test structure
  // In production, would load actual template files

  const template = `test('{{testName}}', async ({ page }) => {
  // ARRANGE
  {{#each steps}}
  // {{this}}
  {{/each}}

  // ACT
  // TODO: Implement actions

  // ASSERT
  {{#each assertions}}
  // {{this}}
  {{/each}}
});`;

  return renderer.render(template, {
    testName: `should ${test.name.toLowerCase()}`,
    steps: test.steps,
    assertions: test.assertions,
  });
}

/**
 * Generate complete test file with imports and describe block
 *
 * @param spec - Screen specification
 * @param tests - Array of generated test code strings
 * @returns Complete test file content
 */
function generateTestFile(spec: ScreenSpec, tests: string[]): string {
  const header = `/**
 * E2E Tests for ${spec.screen}
 *
 * Generated automatically from spec
 * ${spec.description}
 *
 * @generated
 */

import { test, expect } from '@playwright/test';

`;

  const describeBlock = `test.describe('${spec.screen}', () => {
${spec.route ? `  test.beforeEach(async ({ page }) => {\n    await page.goto('${spec.route}');\n  });\n\n` : ''}${tests.map((t) => '  ' + t.replace(/\n/g, '\n  ')).join('\n\n')}
});
`;

  return header + describeBlock;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let specPath = '';
  let outputDir = path.join(process.cwd(), 'tests/e2e/generated');
  let userId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spec' && args[i + 1]) {
      specPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--user' && args[i + 1]) {
      userId = args[i + 1];
      i++;
    }
  }

  if (!specPath) {
    console.error('Error: --spec argument is required');
    console.error('Usage: npm run generate:e2e -- --spec path/to/spec.yaml --user userId [--output path/to/output]');
    process.exit(1);
  }

  if (!userId) {
    console.error('Error: --user argument is required');
    console.error('Usage: npm run generate:e2e -- --spec path/to/spec.yaml --user userId [--output path/to/output]');
    process.exit(1);
  }

  console.log('\nGenerating E2E tests from spec...');
  console.log(`Spec: ${specPath}`);
  console.log(`Output: ${outputDir}`);
  console.log();

  const result = await generateE2ETestsFromSpec(specPath, outputDir, userId);

  if (!result.success) {
    console.error(`\nError: ${result.error.message}`);
    process.exit(1);
  }

  console.log('Generation complete!');
  console.log(`\nSummary:`);
  console.log(`  Total tests: ${result.summary.totalTests}`);
  console.log(`  From templates: ${result.summary.fromTemplates}`);
  console.log(`  From LLM: ${result.summary.fromLLM}`);
  console.log(`  Total cost: $${result.summary.totalCost.toFixed(4)}`);

  if (Object.keys(result.summary.breakdown.byTemplate).length > 0) {
    console.log(`\n  Templates used:`);
    for (const [template, count] of Object.entries(result.summary.breakdown.byTemplate)) {
      console.log(`    - ${template}: ${count}`);
    }
  }

  if (result.summary.breakdown.byModel) {
    console.log(`\n  Models used:`);
    for (const [model, count] of Object.entries(result.summary.breakdown.byModel)) {
      console.log(`    - ${model}: ${count}`);
    }
  }

  console.log(`\nFiles generated:`);
  for (const file of result.filesGenerated) {
    console.log(`  - ${file}`);
  }

  console.log();
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
