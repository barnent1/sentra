/**
 * E2E Test Specification Schema
 *
 * Zod schemas for validating E2E test specifications from YAML files
 * Part of Phase 3.2: E2E Test Generation
 *
 * @module schemas/e2e-spec
 */

import { z } from 'zod';

/**
 * Valid template names for E2E test generation
 */
const TEMPLATE_NAMES = [
  'crud-operations',
  'form-validation',
  'modal-workflow',
  'navigation',
  'loading-states',
  'visual-regression',
  'llm', // Special: Force LLM generation
] as const;

/**
 * Valid priority levels for tests
 */
const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Single test step (action or verification)
 *
 * @example "Navigate to /dashboard"
 * @example "Click mute button on first project card"
 * @example "Verify mute button shows violet color"
 */
export const E2ETestStepSchema = z
  .string()
  .min(1, 'Step cannot be empty')
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: 'Step cannot be whitespace only',
  });

/**
 * Complete E2E test specification
 *
 * @example
 * {
 *   name: "User toggles mute button",
 *   description: "Verify mute state changes visually",
 *   steps: ["Navigate to /dashboard", "Click mute button"],
 *   assertions: ["Button color changes"],
 *   template_hint: "crud-operations",
 *   priority: "high"
 * }
 */
export const E2ETestSchema = z.object({
  /**
   * Human-readable test name (appears in test file)
   */
  name: z.string().min(1, 'Test name is required'),

  /**
   * Detailed description of what the test verifies
   */
  description: z.string().min(1, 'Test description is required'),

  /**
   * Ordered list of test steps
   * Must have at least one step
   */
  steps: z
    .array(E2ETestStepSchema)
    .min(1, 'Test must have at least one step'),

  /**
   * Expected outcomes to verify
   * Must have at least one assertion
   */
  assertions: z
    .array(z.string().min(1))
    .min(1, 'Test must have at least one assertion'),

  /**
   * Optional: Force specific template
   * Use "llm" to force LLM generation
   *
   * @default undefined (auto-select template)
   */
  template_hint: z.enum(TEMPLATE_NAMES).optional(),

  /**
   * Optional: Test priority level
   * Affects test grouping and execution order
   *
   * @default "medium"
   */
  priority: z.enum(PRIORITY_LEVELS).optional(),

  /**
   * Optional: Skip test if no data exists
   * Used for tests that require existing data (e.g., project cards)
   *
   * @default false
   */
  skip_if_empty: z.boolean().optional(),
});

/**
 * Complete screen specification with E2E tests
 *
 * @example
 * {
 *   screen: "Dashboard",
 *   description: "Mission control view",
 *   route: "/dashboard",
 *   e2e_tests: [...]
 * }
 */
export const ScreenSpecSchema = z.object({
  /**
   * Screen/component name
   * Used for test file naming: "dashboard-interactions.spec.ts"
   */
  screen: z.string().min(1, 'Screen name is required'),

  /**
   * Human-readable description of the screen
   */
  description: z.string().min(1, 'Screen description is required'),

  /**
   * Optional: Route to navigate to for testing
   * @example "/dashboard", "/settings"
   */
  route: z.string().optional(),

  /**
   * List of E2E tests for this screen
   * Must have at least one test
   */
  e2e_tests: z
    .array(E2ETestSchema)
    .min(1, 'Screen must have at least one E2E test'),
});

/**
 * TypeScript types inferred from schemas
 */
export type E2ETestStep = z.infer<typeof E2ETestStepSchema>;

/**
 * E2E Test type (output after validation with defaults applied)
 */
export type E2ETest = z.output<typeof E2ETestSchema>;

/**
 * E2E Test input type (before validation, with optional fields)
 */
export type E2ETestInput = z.input<typeof E2ETestSchema>;

/**
 * Screen Spec type (output after validation)
 */
export type ScreenSpec = z.output<typeof ScreenSpecSchema>;

/**
 * Screen Spec input type (before validation)
 */
export type ScreenSpecInput = z.input<typeof ScreenSpecSchema>;

export type TemplateName = (typeof TEMPLATE_NAMES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/**
 * Helper: Validate screen spec and return detailed errors
 *
 * @param spec - Raw spec object to validate
 * @returns Validation result with typed data or errors
 *
 * @example
 * const result = validateScreenSpec(rawData);
 * if (result.success) {
 *   console.log(result.data.screen);
 * } else {
 *   console.error(result.error.errors);
 * }
 */
export function validateScreenSpec(spec: unknown) {
  return ScreenSpecSchema.safeParse(spec);
}

/**
 * Helper: Validate single E2E test
 *
 * @param test - Raw test object to validate
 * @returns Validation result
 */
export function validateE2ETest(test: unknown) {
  return E2ETestSchema.safeParse(test);
}

/**
 * Helper: Get list of valid template names
 *
 * @returns Array of valid template names
 */
export function getValidTemplates(): readonly string[] {
  return TEMPLATE_NAMES;
}

/**
 * Helper: Get list of valid priority levels
 *
 * @returns Array of valid priority levels
 */
export function getValidPriorities(): readonly string[] {
  return PRIORITY_LEVELS;
}
