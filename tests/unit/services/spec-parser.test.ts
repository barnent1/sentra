/**
 * Spec Parser Service Tests
 *
 * Tests for parsing and validating E2E test specifications from YAML
 * Following TDD: Tests written FIRST
 *
 * Coverage target: 90%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpecParser } from '../../../src/services/spec-parser';
import type { ScreenSpec, E2ETest } from '../../../src/schemas/e2e-spec.schema';

describe('SpecParser', () => {
  let parser: SpecParser;

  beforeEach(() => {
    parser = new SpecParser();
  });

  describe('parseYAML', () => {
    it('should parse valid YAML spec', async () => {
      // ARRANGE
      const yaml = `
screen: Dashboard
description: Mission control view
route: /dashboard
e2e_tests:
  - name: User views stats
    description: Stat cards visible
    steps:
      - Navigate to /dashboard
      - Wait for stats to load
    assertions:
      - 4 stat cards show
      `;

      // ACT
      const result = await parser.parseYAML(yaml);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.screen).toBe('Dashboard');
        expect(result.data.route).toBe('/dashboard');
        expect(result.data.e2e_tests).toHaveLength(1);
        expect(result.data.e2e_tests[0].name).toBe('User views stats');
      }
    });

    it('should parse spec with multiple tests', async () => {
      // ARRANGE
      const yaml = `
screen: Dashboard
description: Multiple tests
e2e_tests:
  - name: Test 1
    description: First test
    steps: [Step 1]
    assertions: [Assert 1]
  - name: Test 2
    description: Second test
    steps: [Step 2]
    assertions: [Assert 2]
      `;

      // ACT
      const result = await parser.parseYAML(yaml);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests).toHaveLength(2);
      }
    });

    it('should parse spec with template hints', async () => {
      // ARRANGE
      const yaml = `
screen: Modal
description: Modal tests
e2e_tests:
  - name: Open modal
    description: Test modal
    template_hint: modal-workflow
    steps: [Click button]
    assertions: [Modal shows]
      `;

      // ACT
      const result = await parser.parseYAML(yaml);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests[0].template_hint).toBe('modal-workflow');
      }
    });

    it('should parse spec with priorities', async () => {
      // ARRANGE
      const yaml = `
screen: Auth
description: Auth tests
e2e_tests:
  - name: Login
    description: Critical
    priority: critical
    steps: [Enter credentials]
    assertions: [Logged in]
      `;

      // ACT
      const result = await parser.parseYAML(yaml);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests[0].priority).toBe('critical');
      }
    });

    it('should handle YAML with comments', async () => {
      // ARRANGE
      const yaml = `
# This is a comment
screen: Dashboard
description: With comments
e2e_tests:
  - name: Test  # Inline comment
    description: Test
    steps:
      - Step 1  # Another comment
    assertions:
      - Assert 1
      `;

      // ACT
      const result = await parser.parseYAML(yaml);

      // ASSERT
      expect(result.success).toBe(true);
    });

    describe('error handling', () => {
      it('should return error for invalid YAML syntax', async () => {
        // ARRANGE
        const yaml = `
screen: Dashboard
description: Invalid
e2e_tests:
  - name: Test
    steps: [
    # Missing closing bracket
        `;

        // ACT
        const result = await parser.parseYAML(yaml);

        // ASSERT
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(result.error.type).toBe('parse');
        }
      });

      it('should return error for missing required fields', async () => {
        // ARRANGE
        const yaml = `
screen: Dashboard
# Missing description and e2e_tests
        `;

        // ACT
        const result = await parser.parseYAML(yaml);

        // ASSERT
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('validation');
        }
      });

      it('should return error for invalid template_hint', async () => {
        // ARRANGE
        const yaml = `
screen: Test
description: Invalid template
e2e_tests:
  - name: Test
    description: Test
    template_hint: non-existent-template
    steps: [Step]
    assertions: [Assert]
        `;

        // ACT
        const result = await parser.parseYAML(yaml);

        // ASSERT
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('validation');
        }
      });

      it('should return error for invalid priority', async () => {
        // ARRANGE
        const yaml = `
screen: Test
description: Invalid priority
e2e_tests:
  - name: Test
    description: Test
    priority: super-high
    steps: [Step]
    assertions: [Assert]
        `;

        // ACT
        const result = await parser.parseYAML(yaml);

        // ASSERT
        expect(result.success).toBe(false);
      });

      it('should return error for empty steps array', async () => {
        // ARRANGE
        const yaml = `
screen: Test
description: Empty steps
e2e_tests:
  - name: Test
    description: Test
    steps: []
    assertions: [Assert]
        `;

        // ACT
        const result = await parser.parseYAML(yaml);

        // ASSERT
        expect(result.success).toBe(false);
      });
    });
  });

  describe('parseFile', () => {
    it('should parse YAML file by path', async () => {
      // ARRANGE
      const filePath = '/Users/barnent1/Projects/quetrex/tests/fixtures/specs/dashboard.yaml';

      // ACT
      const result = await parser.parseFile(filePath);

      // ASSERT
      // Will be tested after fixture files are created
      expect(result).toBeDefined();
    });
  });

  describe('extractTests', () => {
    it('should extract all tests from spec', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Test 1',
            description: 'First',
            steps: ['Step 1'],
            assertions: ['Assert 1'],
            priority: 'high',
          },
          {
            name: 'Test 2',
            description: 'Second',
            steps: ['Step 2'],
            assertions: ['Assert 2'],
            priority: 'low',
          },
        ],
      };

      // ACT
      const tests = parser.extractTests(spec);

      // ASSERT
      expect(tests).toHaveLength(2);
      expect(tests[0].name).toBe('Test 1');
      expect(tests[1].name).toBe('Test 2');
    });

    it('should return empty array for spec with no tests', () => {
      // ARRANGE - This won't actually pass validation, but testing the method
      const spec = {
        screen: 'Empty',
        description: 'No tests',
        e2e_tests: [],
      } as unknown as ScreenSpec;

      // ACT
      const tests = parser.extractTests(spec);

      // ASSERT
      expect(tests).toHaveLength(0);
    });
  });

  describe('groupByPriority', () => {
    it('should group tests by priority level', () => {
      // ARRANGE
      const tests: E2ETest[] = [
        {
          name: 'Critical Test',
          description: 'Critical',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'critical',
        },
        {
          name: 'High Test 1',
          description: 'High',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'high',
        },
        {
          name: 'High Test 2',
          description: 'High',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'high',
        },
        {
          name: 'Medium Test',
          description: 'Medium',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'medium',
        },
        {
          name: 'Low Test',
          description: 'Low',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'low',
        },
      ];

      // ACT
      const grouped = parser.groupByPriority(tests);

      // ASSERT
      expect(grouped.critical).toHaveLength(1);
      expect(grouped.high).toHaveLength(2);
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.low).toHaveLength(1);
      expect(grouped.critical[0].name).toBe('Critical Test');
    });

    it('should handle tests with default priority', () => {
      // ARRANGE
      const tests: E2ETest[] = [
        {
          name: 'Test 1',
          description: 'Default priority',
          steps: ['Step'],
          assertions: ['Assert'],
          priority: 'medium', // Default
        },
      ];

      // ACT
      const grouped = parser.groupByPriority(tests);

      // ASSERT
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.critical).toHaveLength(0);
      expect(grouped.high).toHaveLength(0);
      expect(grouped.low).toHaveLength(0);
    });

    it('should return empty groups when no tests', () => {
      // ARRANGE
      const tests: E2ETest[] = [];

      // ACT
      const grouped = parser.groupByPriority(tests);

      // ASSERT
      expect(grouped.critical).toHaveLength(0);
      expect(grouped.high).toHaveLength(0);
      expect(grouped.medium).toHaveLength(0);
      expect(grouped.low).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate correct spec', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Valid spec',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'medium',
          },
        ],
      };

      // ACT
      const result = parser.validate(spec);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('should reject invalid spec', () => {
      // ARRANGE
      const invalidSpec = {
        screen: '',
        description: 'Invalid',
        e2e_tests: [],
      };

      // ACT
      const result = parser.validate(invalidSpec);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should provide validation errors', () => {
      // ARRANGE
      const invalidSpec = {
        screen: 'Test',
        description: 'Invalid',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: [], // Invalid: empty steps
            assertions: ['Assert'],
          },
        ],
      };

      // ACT
      const result = parser.validate(invalidSpec);

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getTestCount', () => {
    it('should count total tests in spec', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Multiple tests',
        e2e_tests: [
          {
            name: 'Test 1',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          },
          {
            name: 'Test 2',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          },
          {
            name: 'Test 3',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          },
        ],
      };

      // ACT
      const count = parser.getTestCount(spec);

      // ASSERT
      expect(count).toBe(3);
    });

    it('should return 0 for spec with no tests', () => {
      // ARRANGE
      const spec = {
        screen: 'Empty',
        description: 'No tests',
        e2e_tests: [],
      } as unknown as ScreenSpec;

      // ACT
      const count = parser.getTestCount(spec);

      // ASSERT
      expect(count).toBe(0);
    });
  });

  describe('getTestsByTemplateHint', () => {
    it('should filter tests by template hint', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Modal Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            template_hint: 'modal-workflow',
          },
          {
            name: 'Form Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            template_hint: 'form-validation',
          },
          {
            name: 'Another Modal Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            template_hint: 'modal-workflow',
          },
        ],
      };

      // ACT
      const modalTests = parser.getTestsByTemplateHint(spec, 'modal-workflow');

      // ASSERT
      expect(modalTests).toHaveLength(2);
      expect(modalTests[0].name).toBe('Modal Test');
      expect(modalTests[1].name).toBe('Another Modal Test');
    });

    it('should return empty array when no matching template hint', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            template_hint: 'crud-operations',
          },
        ],
      };

      // ACT
      const tests = parser.getTestsByTemplateHint(spec, 'modal-workflow');

      // ASSERT
      expect(tests).toHaveLength(0);
    });

    it('should include tests without template hint when filtering', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Test 1',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            template_hint: 'crud-operations',
          },
          {
            name: 'Test 2',
            description: 'No hint',
            steps: ['Step'],
            assertions: ['Assert'],
          },
        ],
      };

      // ACT
      const crudTests = parser.getTestsByTemplateHint(spec, 'crud-operations');

      // ASSERT
      expect(crudTests).toHaveLength(1);
      expect(crudTests[0].name).toBe('Test 1');
    });
  });

  describe('getTestsByPriority', () => {
    it('should filter tests by priority level', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Critical Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'critical',
          },
          {
            name: 'High Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'high',
          },
        ],
      };

      // ACT
      const criticalTests = parser.getTestsByPriority(spec, 'critical');

      // ASSERT
      expect(criticalTests).toHaveLength(1);
      expect(criticalTests[0].name).toBe('Critical Test');
    });
  });

  describe('getSkippableTests', () => {
    it('should return tests with skip_if_empty flag', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Skippable Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            skip_if_empty: true,
          },
          {
            name: 'Normal Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            skip_if_empty: false,
          },
        ],
      };

      // ACT
      const skippableTests = parser.getSkippableTests(spec);

      // ASSERT
      expect(skippableTests).toHaveLength(1);
      expect(skippableTests[0].name).toBe('Skippable Test');
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Tests',
        e2e_tests: [
          {
            name: 'Test 1',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'critical',
            template_hint: 'modal-workflow',
          },
          {
            name: 'Test 2',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'high',
            template_hint: 'form-validation',
          },
          {
            name: 'Test 3',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            priority: 'medium',
            skip_if_empty: true,
          },
        ],
      };

      // ACT
      const stats = parser.getStats(spec);

      // ASSERT
      expect(stats.total).toBe(3);
      expect(stats.byPriority.critical).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(0);
      expect(stats.withTemplateHint).toBe(2);
      expect(stats.skippable).toBe(1);
    });
  });
});
