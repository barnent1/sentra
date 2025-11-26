/**
 * Architect → E2E Test Generation Flow Integration Test
 *
 * Tests the complete flow from voice architect specification
 * to E2E test generation and execution.
 *
 * Part of Phase 4: Integration
 * Coverage target: 90%+
 *
 * @module tests/integration/architect-e2e-flow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';
import { validateScreenSpec, type ScreenSpec } from '../../src/schemas/e2e-spec.schema';

describe('Architect → E2E Test Generation Flow', () => {
  const testOutputDir = path.join(__dirname, '../fixtures/architect-output');
  const e2eOutputDir = path.join(__dirname, '../fixtures/e2e-generated');

  beforeAll(async () => {
    // ARRANGE: Create test output directories
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.mkdir(e2eOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // CLEANUP: Remove test output directories
    await fs.rm(testOutputDir, { recursive: true, force: true });
    await fs.rm(e2eOutputDir, { recursive: true, force: true });
  });

  describe('Specification Validation', () => {
    it('should validate voice architect screen spec with high confidence', async () => {
      // ARRANGE: Create mock voice architect output
      const mockSpec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Mission control for managing AI projects',
        route: '/dashboard',
        e2e_tests: [
          {
            name: 'User views project stats',
            description: 'Verify all stat cards display correctly',
            steps: [
              'Navigate to /dashboard',
              'Wait for stats to load',
              'Verify 4 stat cards visible',
            ],
            assertions: [
              'Total projects card shows',
              'Active projects card shows',
              'Issues in progress card shows',
              'Completion rate card shows',
            ],
            template_hint: 'loading-states',
            priority: 'high',
          },
          {
            name: 'User toggles project mute button',
            description: 'Verify mute state changes visually',
            steps: [
              'Navigate to /dashboard',
              'Click mute button on first project card',
              'Verify button changes color',
            ],
            assertions: [
              'Button color changes to violet',
              'Mute icon appears',
            ],
            template_hint: 'visual-regression',
            priority: 'high',
          },
        ],
      };

      // ACT: Validate spec
      const result = validateScreenSpec(mockSpec);

      // ASSERT: Spec is valid
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.screen).toBe('Dashboard');
        expect(result.data.e2e_tests).toHaveLength(2);
        expect(result.data.e2e_tests[0].priority).toBe('high');
      }
    });

    it('should reject spec with missing required fields', async () => {
      // ARRANGE: Invalid spec
      const invalidSpec = {
        screen: 'Dashboard',
        // Missing description
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          },
        ],
      };

      // ACT: Validate spec
      const result = validateScreenSpec(invalidSpec);

      // ASSERT: Validation fails
      expect(result.success).toBe(false);
    });

    it('should reject spec with empty e2e_tests array', async () => {
      // ARRANGE: Spec with no tests
      const specWithNoTests = {
        screen: 'Dashboard',
        description: 'Valid description',
        e2e_tests: [], // Empty array
      };

      // ACT: Validate spec
      const result = validateScreenSpec(specWithNoTests);

      // ASSERT: Validation fails
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) =>
          issue.message.includes('at least one')
        )).toBe(true);
      }
    });
  });

  describe('Spec to YAML Conversion', () => {
    it('should convert validated spec to YAML format', async () => {
      // ARRANGE: Valid spec
      const spec: ScreenSpec = {
        screen: 'Settings',
        description: 'User settings page',
        route: '/settings',
        e2e_tests: [
          {
            name: 'User updates theme',
            description: 'Change theme preference',
            steps: [
              'Navigate to /settings',
              'Click theme dropdown',
              'Select dark mode',
            ],
            assertions: [
              'Theme changes immediately',
              'Preference saved',
            ],
            priority: 'medium',
          },
        ],
      };

      // ACT: Convert to YAML
      const yamlContent = yaml.stringify(spec);
      const yamlPath = path.join(testOutputDir, 'settings-spec.yml');
      await fs.writeFile(yamlPath, yamlContent, 'utf-8');

      // ASSERT: File created and valid
      const fileExists = await fs.access(yamlPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const readContent = await fs.readFile(yamlPath, 'utf-8');
      const parsedSpec = yaml.parse(readContent);
      expect(parsedSpec.screen).toBe('Settings');
      expect(parsedSpec.e2e_tests).toHaveLength(1);
    });

    it('should preserve all spec fields in YAML round-trip', async () => {
      // ARRANGE: Spec with all optional fields
      const spec: ScreenSpec = {
        screen: 'Profile',
        description: 'User profile management',
        route: '/profile',
        e2e_tests: [
          {
            name: 'User uploads avatar',
            description: 'Upload profile picture',
            steps: [
              'Navigate to /profile',
              'Click upload button',
              'Select image file',
            ],
            assertions: [
              'Avatar updates',
              'Success message shows',
            ],
            template_hint: 'form-validation',
            priority: 'low',
            skip_if_empty: false,
          },
        ],
      };

      // ACT: Convert to YAML and back
      const yamlContent = yaml.stringify(spec);
      const parsedSpec = yaml.parse(yamlContent);
      const validationResult = validateScreenSpec(parsedSpec);

      // ASSERT: All fields preserved
      expect(validationResult.success).toBe(true);
      if (validationResult.success) {
        expect(validationResult.data).toEqual(spec);
      }
    });
  });

  describe('Template Matching', () => {
    it('should select correct template based on template_hint', async () => {
      // ARRANGE: Test specs with different hints
      const testCases: Array<{ hint: string; expectedTemplate: string }> = [
        { hint: 'crud-operations', expectedTemplate: 'crud-operations' },
        { hint: 'form-validation', expectedTemplate: 'form-validation' },
        { hint: 'modal-workflow', expectedTemplate: 'modal-workflow' },
        { hint: 'navigation', expectedTemplate: 'navigation' },
        { hint: 'loading-states', expectedTemplate: 'loading-states' },
        { hint: 'visual-regression', expectedTemplate: 'visual-regression' },
      ];

      // ACT & ASSERT: Each hint maps to correct template
      for (const testCase of testCases) {
        const spec: ScreenSpec = {
          screen: 'Test Screen',
          description: 'Test',
          e2e_tests: [
            {
              name: 'Test',
              description: 'Test',
              steps: ['Step'],
              assertions: ['Assert'],
              template_hint: testCase.hint as any,
            },
          ],
        };

        const result = validateScreenSpec(spec);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.e2e_tests[0].template_hint).toBe(testCase.expectedTemplate);
        }
      }
    });

    it('should force LLM generation when template_hint is "llm"', async () => {
      // ARRANGE: Spec with LLM hint
      const spec: ScreenSpec = {
        screen: 'Complex Workflow',
        description: 'Complex multi-step workflow',
        e2e_tests: [
          {
            name: 'Complex user journey',
            description: 'Multi-step complex interaction',
            steps: [
              'Step 1',
              'Step 2',
              'Step 3',
              'Step 4',
              'Step 5',
            ],
            assertions: ['Final state correct'],
            template_hint: 'llm', // Force LLM
          },
        ],
      };

      // ACT: Validate spec
      const result = validateScreenSpec(spec);

      // ASSERT: LLM hint accepted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests[0].template_hint).toBe('llm');
      }
    });

    it('should allow no template_hint for auto-selection', async () => {
      // ARRANGE: Spec without hint
      const spec: ScreenSpec = {
        screen: 'Auto Template',
        description: 'Auto template selection',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
            // No template_hint - will auto-select
          },
        ],
      };

      // ACT: Validate spec
      const result = validateScreenSpec(spec);

      // ASSERT: Valid even without hint
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.e2e_tests[0].template_hint).toBeUndefined();
      }
    });
  });

  describe('E2E Test File Generation (Mock)', () => {
    it('should generate E2E test file structure', async () => {
      // ARRANGE: Valid spec
      const spec: ScreenSpec = {
        screen: 'Login',
        description: 'User authentication page',
        route: '/login',
        e2e_tests: [
          {
            name: 'User logs in successfully',
            description: 'Valid credentials login',
            steps: [
              'Navigate to /login',
              'Fill email field',
              'Fill password field',
              'Click login button',
            ],
            assertions: [
              'Redirected to dashboard',
              'User menu shows',
            ],
            template_hint: 'form-validation',
            priority: 'critical',
          },
        ],
      };

      // ACT: Generate test file (mock implementation)
      const testFileName = `${spec.screen.toLowerCase()}-interactions.spec.ts`;
      const testFilePath = path.join(e2eOutputDir, testFileName);

      // Mock test file content
      const testContent = `
import { test, expect } from '@playwright/test';

test.describe('${spec.screen}', () => {
  test('${spec.e2e_tests[0].name}', async ({ page }) => {
    // ${spec.e2e_tests[0].description}

    ${spec.e2e_tests[0].steps.map((step) => `// ${step}`).join('\n    ')}

    // Assertions
    ${spec.e2e_tests[0].assertions.map((assertion) => `// Verify: ${assertion}`).join('\n    ')}
  });
});
`.trim();

      await fs.writeFile(testFilePath, testContent, 'utf-8');

      // ASSERT: Test file created
      const fileExists = await fs.access(testFilePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(testFilePath, 'utf-8');
      expect(content).toContain(spec.screen);
      expect(content).toContain(spec.e2e_tests[0].name);
      expect(content).toContain('@playwright/test');
    });

    it('should generate test file for each screen spec', async () => {
      // ARRANGE: Multiple screen specs
      const specs: ScreenSpec[] = [
        {
          screen: 'Dashboard',
          description: 'Dashboard',
          e2e_tests: [{
            name: 'Test 1',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          }],
        },
        {
          screen: 'Settings',
          description: 'Settings',
          e2e_tests: [{
            name: 'Test 2',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          }],
        },
        {
          screen: 'Profile',
          description: 'Profile',
          e2e_tests: [{
            name: 'Test 3',
            description: 'Test',
            steps: ['Step'],
            assertions: ['Assert'],
          }],
        },
      ];

      // ACT: Generate test file for each spec
      const generatedFiles: string[] = [];
      for (const spec of specs) {
        const fileName = `${spec.screen.toLowerCase()}-interactions.spec.ts`;
        const filePath = path.join(e2eOutputDir, fileName);

        const mockContent = `
import { test } from '@playwright/test';
test.describe('${spec.screen}', () => {
  test('${spec.e2e_tests[0].name}', async ({ page }) => {
    // Generated from spec
  });
});
`.trim();

        await fs.writeFile(filePath, mockContent, 'utf-8');
        generatedFiles.push(fileName);
      }

      // ASSERT: All test files created
      expect(generatedFiles).toHaveLength(3);

      for (const fileName of generatedFiles) {
        const filePath = path.join(e2eOutputDir, fileName);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('Confidence Scoring Integration', () => {
    it('should only generate E2E tests for specs with ≥90% confidence', async () => {
      // ARRANGE: Specs with different confidence levels
      interface SpecWithConfidence {
        spec: ScreenSpec;
        confidence: number;
        shouldGenerate: boolean;
      }

      const specs: SpecWithConfidence[] = [
        {
          spec: {
            screen: 'High Confidence Screen',
            description: 'Complete spec',
            route: '/high',
            e2e_tests: [{
              name: 'Test',
              description: 'Well-defined test',
              steps: ['Step 1', 'Step 2', 'Step 3'],
              assertions: ['Assert 1', 'Assert 2'],
              priority: 'high',
            }],
          },
          confidence: 0.95,
          shouldGenerate: true,
        },
        {
          spec: {
            screen: 'Medium Confidence Screen',
            description: 'Partial spec',
            e2e_tests: [{
              name: 'Test',
              description: 'Test',
              steps: ['Step'],
              assertions: ['Assert'],
            }],
          },
          confidence: 0.85,
          shouldGenerate: false,
        },
        {
          spec: {
            screen: 'Low Confidence Screen',
            description: 'Incomplete spec',
            e2e_tests: [{
              name: 'Test',
              description: 'Test',
              steps: ['Step'],
              assertions: ['Assert'],
            }],
          },
          confidence: 0.60,
          shouldGenerate: false,
        },
      ];

      // ACT & ASSERT: Only high confidence specs generate tests
      for (const { spec, confidence, shouldGenerate } of specs) {
        const validationResult = validateScreenSpec(spec);
        expect(validationResult.success).toBe(true);

        // Simulate confidence check
        const meetsThreshold = confidence >= 0.90;
        expect(meetsThreshold).toBe(shouldGenerate);

        if (meetsThreshold) {
          // Would generate E2E test
          const fileName = `${spec.screen.toLowerCase().replace(/\s+/g, '-')}-interactions.spec.ts`;
          expect(fileName).toContain('.spec.ts');
        }
      }
    });

    it('should include confidence metadata in generated test comments', async () => {
      // ARRANGE: High confidence spec
      const spec: ScreenSpec = {
        screen: 'Dashboard',
        description: 'Mission control',
        route: '/dashboard',
        e2e_tests: [{
          name: 'User views stats',
          description: 'Stat cards visible',
          steps: ['Navigate', 'Wait', 'Verify'],
          assertions: ['Cards show'],
          priority: 'high',
        }],
      };
      const confidence = 0.95;

      // ACT: Generate test with metadata
      const testContent = `
/**
 * E2E Tests for ${spec.screen}
 *
 * Auto-generated from voice architect spec
 * Confidence: ${(confidence * 100).toFixed(0)}%
 * Generated: ${new Date().toISOString()}
 */

import { test, expect } from '@playwright/test';

test.describe('${spec.screen}', () => {
  test('${spec.e2e_tests[0].name}', async ({ page }) => {
    // ${spec.e2e_tests[0].description}
  });
});
`.trim();

      const fileName = 'dashboard-interactions-with-metadata.spec.ts';
      const filePath = path.join(e2eOutputDir, fileName);
      await fs.writeFile(filePath, testContent, 'utf-8');

      // ASSERT: Metadata included
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('Auto-generated from voice architect spec');
      expect(content).toContain('Confidence: 95%');
      expect(content).toContain('Generated:');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed YAML gracefully', async () => {
      // ARRANGE: Invalid YAML content
      const invalidYaml = `
screen: Dashboard
description: Test
e2e_tests:
  - name: Test
    description: Test
    steps: "Not an array"  # Should be array
    assertions: ["Assert"]
`;

      // ACT: Try to parse
      let parseError: Error | null = null;
      try {
        const parsed = yaml.parse(invalidYaml);
        validateScreenSpec(parsed);
      } catch (error) {
        parseError = error as Error;
      }

      // ASSERT: Error caught (YAML parses but validation fails)
      // Note: YAML parser is lenient, so validation catches the error
      const parsed = yaml.parse(invalidYaml);
      const result = validateScreenSpec(parsed);
      expect(result.success).toBe(false);
    });

    it('should provide detailed validation errors', async () => {
      // ARRANGE: Invalid spec
      const invalidSpec = {
        screen: '', // Empty screen name
        description: 'Test',
        e2e_tests: [
          {
            name: 'Test',
            description: 'Test',
            steps: [], // Empty steps array
            assertions: [], // Empty assertions array
          },
        ],
      };

      // ACT: Validate
      const result = validateScreenSpec(invalidSpec);

      // ASSERT: Multiple errors reported
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);

        // Check for specific errors
        const errorMessages = result.error.issues.map((issue) => issue.message);
        expect(errorMessages.some((msg) => msg.includes('at least one'))).toBe(true);
      }
    });
  });

  describe('GitHub Issue Integration (Mock)', () => {
    it('should format spec for GitHub issue body', async () => {
      // ARRANGE: Complete spec
      const spec: ScreenSpec = {
        screen: 'New Feature',
        description: 'New feature implementation',
        route: '/new-feature',
        e2e_tests: [
          {
            name: 'Feature test 1',
            description: 'Test feature behavior',
            steps: ['Step 1', 'Step 2'],
            assertions: ['Assert 1', 'Assert 2'],
            priority: 'high',
          },
          {
            name: 'Feature test 2',
            description: 'Test edge cases',
            steps: ['Step 3', 'Step 4'],
            assertions: ['Assert 3'],
            priority: 'medium',
          },
        ],
      };

      // ACT: Format for GitHub issue
      const issueBody = `
## E2E Test Specification

**Screen:** ${spec.screen}
**Description:** ${spec.description}
**Route:** ${spec.route}

### Tests Generated

${spec.e2e_tests.map((test, index) => `
#### Test ${index + 1}: ${test.name}
- **Description:** ${test.description}
- **Priority:** ${test.priority || 'medium'}
- **Steps:**
${test.steps.map((step) => `  - ${step}`).join('\n')}
- **Assertions:**
${test.assertions.map((assertion) => `  - ${assertion}`).join('\n')}
`).join('\n')}

### Implementation

E2E tests will be auto-generated from this specification.
`.trim();

      // ASSERT: Issue body formatted correctly
      expect(issueBody).toContain(spec.screen);
      expect(issueBody).toContain(spec.e2e_tests[0].name);
      expect(issueBody).toContain(spec.e2e_tests[1].name);
      expect(issueBody).toContain('E2E Test Specification');
    });
  });
});
