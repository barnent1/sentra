/**
 * E2E Spec Schema Tests
 *
 * Tests for Zod schema validation of E2E test specifications
 * Following TDD: Tests written FIRST
 *
 * Coverage target: 90%+
 */

import { describe, it, expect } from 'vitest';
import {
  E2ETestStepSchema,
  E2ETestSchema,
  ScreenSpecSchema,
  type E2ETestStep,
  type E2ETest,
  type ScreenSpec,
} from '../../../src/schemas/e2e-spec.schema';

describe('E2ETestStepSchema', () => {
  describe('valid steps', () => {
    it('should accept simple step string', () => {
      // ARRANGE
      const step = 'Click the button';

      // ACT
      const result = E2ETestStepSchema.safeParse(step);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Click the button');
      }
    });

    it('should accept step with navigation', () => {
      // ARRANGE
      const step = 'Navigate to /dashboard';

      // ACT
      const result = E2ETestStepSchema.safeParse(step);

      // ASSERT
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from steps', () => {
      // ARRANGE
      const step = '  Click button  ';

      // ACT
      const result = E2ETestStepSchema.safeParse(step);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Click button');
      }
    });
  });

  describe('invalid steps', () => {
    it('should reject empty string', () => {
      // ARRANGE
      const step = '';

      // ACT
      const result = E2ETestStepSchema.safeParse(step);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      // ARRANGE
      const step = '   ';

      // ACT
      const result = E2ETestStepSchema.safeParse(step);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      // ARRANGE
      const invalidSteps = [123, null, undefined, {}, []];

      // ACT & ASSERT
      invalidSteps.forEach((step) => {
        const result = E2ETestStepSchema.safeParse(step);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('E2ETestSchema', () => {
  describe('valid tests', () => {
    it('should accept test with all required fields', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'User toggles mute button',
        description: 'Verify mute state changes visually',
        steps: [
          'Navigate to /dashboard',
          'Click mute button on first project card',
          'Verify mute button shows violet color',
        ],
        assertions: ['Button color changes on each click'],
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('User toggles mute button');
        expect(result.data.steps).toHaveLength(3);
      }
    });

    it('should accept test with template_hint', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test with hint',
        description: 'Uses specific template',
        steps: ['Click button'],
        assertions: ['Button clicked'],
        template_hint: 'crud-operations',
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.template_hint).toBe('crud-operations');
      }
    });

    it('should accept test with priority', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'High priority test',
        description: 'Critical user journey',
        steps: ['Login'],
        assertions: ['User logged in'],
        priority: 'high',
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('high');
      }
    });

    it('should allow omitting priority (defaults handled by parser)', () => {
      // ARRANGE
      const test = {
        name: 'Test without priority',
        description: 'Priority is optional',
        steps: ['Click'],
        assertions: ['Clicked'],
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        // Priority is optional - parser will default to 'medium'
        expect(result.data.priority).toBeUndefined();
      }
    });

    it('should accept test with skip_if_empty flag', () => {
      // ARRANGE
      const test: E2ETest = {
        name: 'Test with skip',
        description: 'Skip if no data',
        steps: ['Check cards'],
        assertions: ['Cards shown'],
        skip_if_empty: true,
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_if_empty).toBe(true);
      }
    });
  });

  describe('invalid tests', () => {
    it('should reject test without name', () => {
      // ARRANGE
      const test = {
        description: 'Missing name',
        steps: ['Click'],
        assertions: ['Clicked'],
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject test without steps', () => {
      // ARRANGE
      const test = {
        name: 'No steps',
        description: 'Invalid',
        assertions: ['Something'],
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject test with empty steps array', () => {
      // ARRANGE
      const test = {
        name: 'Empty steps',
        description: 'Invalid',
        steps: [],
        assertions: ['Something'],
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject test with invalid priority', () => {
      // ARRANGE
      const test = {
        name: 'Invalid priority',
        description: 'Bad priority',
        steps: ['Click'],
        assertions: ['Clicked'],
        priority: 'super-high', // Invalid
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject test with invalid template_hint', () => {
      // ARRANGE
      const test = {
        name: 'Invalid template',
        description: 'Bad template',
        steps: ['Click'],
        assertions: ['Clicked'],
        template_hint: 'non-existent-template',
      };

      // ACT
      const result = E2ETestSchema.safeParse(test);

      // ASSERT
      expect(result.success).toBe(false);
    });
  });
});

describe('ScreenSpecSchema', () => {
  describe('valid specs', () => {
    it('should accept complete screen spec', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Mission control view',
        route: '/dashboard',
        e2e_tests: [
          {
            name: 'User views stats',
            description: 'Stat cards visible',
            steps: ['Navigate to /dashboard', 'Wait for stats to load'],
            assertions: ['4 stat cards show'],
          },
        ],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.screen).toBe('Dashboard');
        expect(result.data.e2e_tests).toHaveLength(1);
      }
    });

    it('should accept spec with multiple tests', () => {
      // ARRANGE
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Multiple tests',
        route: '/dashboard',
        e2e_tests: [
          {
            name: 'Test 1',
            description: 'First test',
            steps: ['Step 1'],
            assertions: ['Assert 1'],
          },
          {
            name: 'Test 2',
            description: 'Second test',
            steps: ['Step 2'],
            assertions: ['Assert 2'],
          },
          {
            name: 'Test 3',
            description: 'Third test',
            steps: ['Step 3'],
            assertions: ['Assert 3'],
          },
        ],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests).toHaveLength(3);
      }
    });

    it('should accept spec without optional route', () => {
      // ARRANGE
      const spec = {
        screen: 'Modal',
        description: 'Not a route',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Open modal'],
            assertions: ['Modal shows'],
          },
        ],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(true);
    });
  });

  describe('invalid specs', () => {
    it('should reject spec without screen name', () => {
      // ARRANGE
      const spec = {
        description: 'No screen name',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Click'],
            assertions: ['Clicked'],
          },
        ],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject spec without e2e_tests', () => {
      // ARRANGE
      const spec = {
        screen: 'Dashboard',
        description: 'No tests',
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject spec with empty e2e_tests array', () => {
      // ARRANGE
      const spec = {
        screen: 'Dashboard',
        description: 'Empty tests',
        e2e_tests: [],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(false);
    });

    it('should reject spec with invalid test objects', () => {
      // ARRANGE
      const spec = {
        screen: 'Dashboard',
        description: 'Invalid test',
        e2e_tests: [
          {
            name: 'Test',
            // Missing description, steps, assertions
          },
        ],
      };

      // ACT
      const result = ScreenSpecSchema.safeParse(spec);

      // ASSERT
      expect(result.success).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  it('should validate screen spec with validateScreenSpec helper', async () => {
    // ARRANGE
    const { validateScreenSpec } = await import(
      '../../../src/schemas/e2e-spec.schema'
    );
    const validSpec = {
      screen: 'Dashboard',
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

    // ACT
    const result = validateScreenSpec(validSpec);

    // ASSERT
    expect(result.success).toBe(true);
  });

  it('should validate E2E test with validateE2ETest helper', async () => {
    // ARRANGE
    const { validateE2ETest } = await import(
      '../../../src/schemas/e2e-spec.schema'
    );
    const validTest = {
      name: 'Test',
      description: 'Test',
      steps: ['Step'],
      assertions: ['Assert'],
    };

    // ACT
    const result = validateE2ETest(validTest);

    // ASSERT
    expect(result.success).toBe(true);
  });

  it('should get valid templates with getValidTemplates', async () => {
    // ARRANGE
    const { getValidTemplates } = await import(
      '../../../src/schemas/e2e-spec.schema'
    );

    // ACT
    const templates = getValidTemplates();

    // ASSERT
    expect(templates).toContain('crud-operations');
    expect(templates).toContain('form-validation');
    expect(templates).toContain('modal-workflow');
    expect(templates).toContain('navigation');
    expect(templates).toContain('loading-states');
    expect(templates).toContain('visual-regression');
    expect(templates).toContain('llm');
  });

  it('should get valid priorities with getValidPriorities', async () => {
    // ARRANGE
    const { getValidPriorities } = await import(
      '../../../src/schemas/e2e-spec.schema'
    );

    // ACT
    const priorities = getValidPriorities();

    // ASSERT
    expect(priorities).toContain('low');
    expect(priorities).toContain('medium');
    expect(priorities).toContain('high');
    expect(priorities).toContain('critical');
  });
});

describe('Schema Integration', () => {
  it('should parse complete real-world spec', () => {
    // ARRANGE
    const spec: ScreenSpec = {
      screen: 'Project Creation Modal',
      description: 'Modal for creating new projects',
      route: '/',
      e2e_tests: [
        {
          name: 'User opens modal',
          description: 'Click New Project button to open modal',
          steps: [
            'Navigate to /',
            'Click New Project button',
            'Wait for modal animation',
          ],
          assertions: ['Modal appears', 'Backdrop visible'],
          template_hint: 'modal-workflow',
          priority: 'high',
        },
        {
          name: 'User fills form',
          description: 'Fill project creation form',
          steps: [
            'Fill name field with test-project',
            'Fill path field with /Users/test',
            'Verify Create button enabled',
          ],
          assertions: ['Button enabled', 'No errors shown'],
          template_hint: 'form-validation',
          priority: 'high',
        },
        {
          name: 'User submits form',
          description: 'Create new project',
          steps: [
            'Click Create button',
            'Wait for creation',
            'Verify modal closes',
          ],
          assertions: ['Project created', 'Card appears'],
          priority: 'medium',
          skip_if_empty: false,
        },
      ],
    };

    // ACT
    const result = ScreenSpecSchema.safeParse(spec);

    // ASSERT
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.screen).toBe('Project Creation Modal');
      expect(result.data.e2e_tests).toHaveLength(3);
      expect(result.data.e2e_tests[0].template_hint).toBe('modal-workflow');
      expect(result.data.e2e_tests[1].template_hint).toBe('form-validation');
      expect(result.data.e2e_tests[2].priority).toBe('medium');
    }
  });

  it('should provide helpful error messages', () => {
    // ARRANGE
    const invalidSpec = {
      screen: '', // Empty screen name
      description: 'Invalid',
      e2e_tests: [
        {
          name: 'Test',
          description: 'Test',
          steps: [], // Empty steps
          assertions: ['Something'],
        },
      ],
    };

    // ACT
    const result = ScreenSpecSchema.safeParse(invalidSpec);

    // ASSERT
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      // Should have errors for both empty screen and empty steps
    }
  });
});
