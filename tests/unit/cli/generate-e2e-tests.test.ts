/**
 * E2E Test Generator CLI Tests
 *
 * Tests for CLI tool that generates E2E tests from specs
 * Part of Phase 3.2 Week 5: CLI Tool
 *
 * @module tests/unit/cli/generate-e2e-tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Mock fs modules
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  default: {
    existsSync: vi.fn(),
  },
}));

import { generateE2ETestsFromSpec } from '../../../src/cli/generate-e2e-tests';
import * as SpecParserModule from '../../../src/services/spec-parser';
import * as TemplateSelectorModule from '../../../src/services/template-selector';
import * as TemplateRendererModule from '../../../src/services/template-renderer';
import * as TestRefinementModule from '../../../src/services/test-refinement';

const { SpecParser } = SpecParserModule;
const { TemplateSelector } = TemplateSelectorModule;
const { TemplateRenderer } = TemplateRendererModule;
const { TestRefinementService } = TestRefinementModule;

describe('generateE2ETestsFromSpec', () => {
  const mockSpecPath = '/path/to/spec.yaml';
  const mockOutputDir = '/path/to/tests/e2e/generated';
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default return values for fs mocks
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate tests from spec using templates', async () => {
    // ARRANGE
    const mockSpec = {
      screen: 'Dashboard',
      description: 'Test dashboard',
      e2e_tests: [
        {
          name: 'User clicks button',
          description: 'Simple test',
          steps: ['Navigate to /dashboard', 'Click button'],
          assertions: ['Button clicked'],
        },
        {
          name: 'User fills form',
          description: 'Form test',
          steps: ['Fill field', 'Click submit'],
          assertions: ['Form submitted'],
        },
      ],
    };

    vi.mocked(existsSync).mockReturnValue(false); // Directory doesn't exist

    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: true,
      data: mockSpec as any,
    });

    vi.spyOn(TemplateSelector.prototype, 'selectTemplate')
      .mockReturnValueOnce({
        template: 'crud-operations',
        score: 0.8,
        shouldUseTemplate: true,
        matchedKeywords: ['click', 'button'],
      })
      .mockReturnValueOnce({
        template: 'form-validation',
        score: 0.9,
        shouldUseTemplate: true,
        matchedKeywords: ['fill', 'field'],
      });

    vi.spyOn(TemplateRenderer.prototype, 'render')
      .mockReturnValueOnce(`test('should click button', () => {})`)
      .mockReturnValueOnce(`test('should fill form', () => {})`);

    // ACT
    const result = await generateE2ETestsFromSpec(
      mockSpecPath,
      mockOutputDir,
      mockUserId
    );

    // ASSERT
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.summary.totalTests).toBe(2);
      expect(result.summary.fromTemplates).toBe(2);
      expect(result.summary.fromLLM).toBe(0);
      expect(result.summary.totalCost).toBe(0);
      expect(result.filesGenerated).toHaveLength(1);
      expect(result.filesGenerated[0]).toContain('dashboard.spec.ts');
    }

    expect(mkdir).toHaveBeenCalledWith(mockOutputDir, { recursive: true });
    expect(writeFile).toHaveBeenCalled();
  });

  it('should use LLM for tests with score < 0.7', async () => {
    // ARRANGE
    const mockSpec = {
      screen: 'Complex',
      description: 'Complex tests',
      e2e_tests: [
        {
          name: 'Complex test',
          description: 'Needs LLM',
          steps: ['Complex step 1', 'Complex step 2'],
          assertions: ['Complex assertion'],
        },
      ],
    };

    vi.mocked(existsSync).mockReturnValue(true); // Directory exists

    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: true,
      data: mockSpec as any,
    });

    vi.spyOn(TemplateSelector.prototype, 'selectTemplate').mockReturnValue({
      template: 'crud-operations',
      score: 0.5, // Below threshold
      shouldUseTemplate: false,
      matchedKeywords: [],
    });

    vi.spyOn(TestRefinementService.prototype, 'refineTest').mockResolvedValue({
      success: true,
      testCode: `test('should handle complex workflow', () => {})`,
      model: 'claude-3-5-sonnet-20241022',
      cost: 0.023,
      tokensUsed: { input: 500, output: 250 },
    });

    // ACT
    const result = await generateE2ETestsFromSpec(
      mockSpecPath,
      mockOutputDir,
      mockUserId
    );

    // ASSERT
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.summary.totalTests).toBe(1);
      expect(result.summary.fromTemplates).toBe(0);
      expect(result.summary.fromLLM).toBe(1);
      expect(result.summary.totalCost).toBeGreaterThan(0);
    }
  });

  it('should handle spec parsing errors', async () => {
    // ARRANGE
    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: false,
      error: {
        type: 'parse',
        message: 'Invalid YAML',
        details: 'Syntax error',
      },
    });

    // ACT
    const result = await generateE2ETestsFromSpec(
      mockSpecPath,
      mockOutputDir,
      mockUserId
    );

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('parse');
      expect(result.error.message).toContain('Invalid YAML');
    }
  });

  it('should handle LLM refinement errors gracefully', async () => {
    // ARRANGE
    const mockSpec = {
      screen: 'Test',
      description: 'Test',
      e2e_tests: [
        {
          name: 'Test',
          description: 'Test',
          steps: ['Step'],
          assertions: ['Assert'],
        },
      ],
    };

    vi.mocked(existsSync).mockReturnValue(true);

    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: true,
      data: mockSpec as any,
    });

    vi.spyOn(TemplateSelector.prototype, 'selectTemplate').mockReturnValue({
      template: 'crud-operations',
      score: 0.5,
      shouldUseTemplate: false,
      matchedKeywords: [],
    });

    vi.spyOn(TestRefinementService.prototype, 'refineTest').mockResolvedValue({
      success: false,
      error: {
        type: 'api',
        message: 'API Error',
        details: {},
      },
    });

    // ACT
    const result = await generateE2ETestsFromSpec(
      mockSpecPath,
      mockOutputDir,
      mockUserId
    );

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('generation');
      expect(result.error.message).toContain('API Error');
    }
  });

  it('should write tests to correct file path', async () => {
    // ARRANGE
    const mockSpec = {
      screen: 'UserSettings',
      description: 'Settings screen',
      e2e_tests: [
        {
          name: 'Toggle setting',
          description: 'Test',
          steps: ['Click toggle'],
          assertions: ['Setting changed'],
        },
      ],
    };

    vi.mocked(existsSync).mockReturnValue(true);

    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: true,
      data: mockSpec as any,
    });

    vi.spyOn(TemplateSelector.prototype, 'selectTemplate').mockReturnValue({
      template: 'crud-operations',
      score: 0.8,
      shouldUseTemplate: true,
      matchedKeywords: ['click'],
    });

    vi.spyOn(TemplateRenderer.prototype, 'render').mockReturnValue(
      `test('should toggle', () => {})`
    );

    // ACT
    await generateE2ETestsFromSpec(mockSpecPath, mockOutputDir, mockUserId);

    // ASSERT
    const expectedPath = path.join(mockOutputDir, 'user-settings.spec.ts');
    expect(writeFile).toHaveBeenCalledWith(
      expectedPath,
      expect.stringContaining("test('should toggle'"),
      'utf-8'
    );
  });

  it('should calculate total cost correctly', async () => {
    // ARRANGE
    const mockSpec = {
      screen: 'Dashboard',
      description: 'Test',
      e2e_tests: [
        {
          name: 'Test 1',
          description: 'Template test',
          steps: ['Step'],
          assertions: ['Assert'],
        },
        {
          name: 'Test 2',
          description: 'LLM test',
          steps: ['Complex', 'Multi', 'Step', 'Flow'],
          assertions: ['Assert'],
        },
      ],
    };

    vi.mocked(existsSync).mockReturnValue(true);

    vi.spyOn(SpecParser.prototype, 'parseFile').mockResolvedValue({
      success: true,
      data: mockSpec as any,
    });

    vi.spyOn(TemplateSelector.prototype, 'selectTemplate')
      .mockReturnValueOnce({
        template: 'crud-operations',
        score: 0.8,
        shouldUseTemplate: true,
        matchedKeywords: [],
      })
      .mockReturnValueOnce({
        template: 'crud-operations',
        score: 0.5,
        shouldUseTemplate: false,
        matchedKeywords: [],
      });

    vi.spyOn(TemplateRenderer.prototype, 'render').mockReturnValue('test code');

    vi.spyOn(TestRefinementService.prototype, 'refineTest').mockResolvedValue({
      success: true,
      testCode: 'llm test code',
      model: 'claude-3-5-haiku-20241022',
      cost: 0.0034,
      tokensUsed: { input: 100, output: 50 },
    });

    // ACT
    const result = await generateE2ETestsFromSpec(
      mockSpecPath,
      mockOutputDir,
      mockUserId
    );

    // ASSERT
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.summary.totalCost).toBeCloseTo(0.0034, 4);
      expect(result.summary.fromTemplates).toBe(1);
      expect(result.summary.fromLLM).toBe(1);
    }
  });
});
