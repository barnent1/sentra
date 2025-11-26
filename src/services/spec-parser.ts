/**
 * Spec Parser Service
 *
 * Parses and validates E2E test specifications from YAML files
 * Part of Phase 3.2: E2E Test Generation
 *
 * @module services/spec-parser
 */

import * as yaml from 'js-yaml';
import { readFile } from 'fs/promises';
import {
  ScreenSpecSchema,
  type ScreenSpec,
  type E2ETest,
  type TemplateName,
  type PriorityLevel,
} from '../schemas/e2e-spec.schema';
import type { ZodError } from 'zod';

/**
 * Parse result for successful parsing
 */
export interface ParseSuccess {
  success: true;
  data: ScreenSpec;
}

/**
 * Parse error types
 */
export type ParseErrorType = 'parse' | 'validation' | 'file' | 'unknown';

/**
 * Parse result for failed parsing
 */
export interface ParseError {
  success: false;
  error: {
    type: ParseErrorType;
    message: string;
    details?: unknown;
    issues?: ZodError['issues'];
  };
}

/**
 * Result type for parse operations
 */
export type ParseResult = ParseSuccess | ParseError;

/**
 * Validation result type
 */
export type ValidationResult =
  | { success: true; data: ScreenSpec }
  | { success: false; error: ZodError };

/**
 * Tests grouped by priority level
 */
export interface GroupedTests {
  critical: E2ETest[];
  high: E2ETest[];
  medium: E2ETest[];
  low: E2ETest[];
}

/**
 * SpecParser
 *
 * Handles parsing, validation, and extraction of E2E test specifications
 *
 * @example
 * const parser = new SpecParser();
 * const result = await parser.parseYAML(yamlString);
 * if (result.success) {
 *   const tests = parser.extractTests(result.data);
 *   const grouped = parser.groupByPriority(tests);
 * }
 */
export class SpecParser {
  /**
   * Parse YAML string into ScreenSpec
   *
   * @param yamlString - YAML content as string
   * @returns Parse result with data or error
   *
   * @example
   * const yaml = `
   * screen: Dashboard
   * description: Tests
   * e2e_tests:
   *   - name: Test
   *     steps: [Step]
   *     assertions: [Assert]
   * `;
   * const result = await parser.parseYAML(yaml);
   */
  async parseYAML(yamlString: string): Promise<ParseResult> {
    try {
      // Parse YAML to JavaScript object
      const rawData = yaml.load(yamlString);

      // Validate against schema
      const validationResult = ScreenSpecSchema.safeParse(rawData);

      if (!validationResult.success) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Spec validation failed',
            issues: validationResult.error.issues,
            details: validationResult.error,
          },
        };
      }

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      // YAML parse error
      if (error instanceof yaml.YAMLException) {
        return {
          success: false,
          error: {
            type: 'parse',
            message: 'YAML syntax error',
            details: error.message,
          },
        };
      }

      // Unknown error
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Unknown error during parsing',
          details: error,
        },
      };
    }
  }

  /**
   * Parse YAML file by path
   *
   * @param filePath - Absolute path to YAML file
   * @returns Parse result with data or error
   *
   * @example
   * const result = await parser.parseFile('/path/to/spec.yaml');
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      // Read file content
      const content = await readFile(filePath, 'utf-8');

      // Parse YAML
      return await this.parseYAML(content);
    } catch (error) {
      // File read error
      return {
        success: false,
        error: {
          type: 'file',
          message: `Failed to read file: ${filePath}`,
          details: error,
        },
      };
    }
  }

  /**
   * Extract all tests from spec
   *
   * @param spec - Validated screen spec
   * @returns Array of E2E tests
   *
   * @example
   * const tests = parser.extractTests(spec);
   * console.log(`Found ${tests.length} tests`);
   */
  extractTests(spec: ScreenSpec): E2ETest[] {
    return spec.e2e_tests;
  }

  /**
   * Group tests by priority level
   *
   * @param tests - Array of E2E tests
   * @returns Tests grouped by priority
   *
   * @example
   * const grouped = parser.groupByPriority(tests);
   * console.log(`Critical: ${grouped.critical.length}`);
   */
  groupByPriority(tests: E2ETest[]): GroupedTests {
    const grouped: GroupedTests = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const test of tests) {
      const priority = test.priority ?? 'medium';
      grouped[priority].push(test);
    }

    return grouped;
  }

  /**
   * Validate spec against schema
   *
   * @param spec - Raw spec object to validate
   * @returns Validation result
   *
   * @example
   * const result = parser.validate(rawData);
   * if (!result.success) {
   *   console.error(result.error.issues);
   * }
   */
  validate(spec: unknown): ValidationResult {
    const result = ScreenSpecSchema.safeParse(spec);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  }

  /**
   * Get total number of tests in spec
   *
   * @param spec - Screen spec
   * @returns Test count
   *
   * @example
   * const count = parser.getTestCount(spec);
   */
  getTestCount(spec: ScreenSpec): number {
    return spec.e2e_tests.length;
  }

  /**
   * Filter tests by template hint
   *
   * @param spec - Screen spec
   * @param templateName - Template name to filter by
   * @returns Tests matching template hint
   *
   * @example
   * const modalTests = parser.getTestsByTemplateHint(spec, 'modal-workflow');
   */
  getTestsByTemplateHint(
    spec: ScreenSpec,
    templateName: TemplateName
  ): E2ETest[] {
    return spec.e2e_tests.filter(
      (test) => test.template_hint === templateName
    );
  }

  /**
   * Get tests by priority level
   *
   * @param spec - Screen spec
   * @param priority - Priority level to filter by
   * @returns Tests matching priority
   *
   * @example
   * const criticalTests = parser.getTestsByPriority(spec, 'critical');
   */
  getTestsByPriority(
    spec: ScreenSpec,
    priority: PriorityLevel
  ): E2ETest[] {
    return spec.e2e_tests.filter((test) => test.priority === priority);
  }

  /**
   * Get tests that should skip if data is empty
   *
   * @param spec - Screen spec
   * @returns Tests with skip_if_empty flag
   *
   * @example
   * const skipTests = parser.getSkippableTests(spec);
   */
  getSkippableTests(spec: ScreenSpec): E2ETest[] {
    return spec.e2e_tests.filter((test) => test.skip_if_empty === true);
  }

  /**
   * Get statistics about spec
   *
   * @param spec - Screen spec
   * @returns Statistics object
   *
   * @example
   * const stats = parser.getStats(spec);
   * console.log(`High priority: ${stats.byPriority.high}`);
   */
  getStats(spec: ScreenSpec): {
    total: number;
    byPriority: Record<PriorityLevel, number>;
    withTemplateHint: number;
    skippable: number;
  } {
    const grouped = this.groupByPriority(spec.e2e_tests);

    return {
      total: spec.e2e_tests.length,
      byPriority: {
        critical: grouped.critical.length,
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length,
      },
      withTemplateHint: spec.e2e_tests.filter((t) => t.template_hint).length,
      skippable: this.getSkippableTests(spec).length,
    };
  }
}
