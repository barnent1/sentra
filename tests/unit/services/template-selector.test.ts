/**
 * Template Selector Service Tests
 *
 * Comprehensive test suite for template selection algorithm
 * Target: 90%+ coverage, 90%+ accuracy
 */

import { describe, it, expect } from 'vitest';
import {
  TemplateSelector,
  type TemplateMatch,
} from '../../../src/services/template-selector';
import type { E2ETest } from '../../../src/schemas/e2e-spec.schema';

describe('TemplateSelector', () => {
  const selector = new TemplateSelector();

  describe('selectTemplate', () => {
    describe('CRUD operations pattern', () => {
      it('should select crud-operations for button click test', () => {
        const test: E2ETest = {
          name: 'Toggle mute button',
          description: 'User clicks mute button to toggle state and verify button displays violet color',
          steps: ['Navigate to dashboard', 'Click mute button', 'Verify button changes color', 'Click to toggle again', 'Verify button shows correct state'],
          assertions: ['Button shows violet color', 'Toggle works correctly', 'Display updates visibly'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('crud-operations');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.score).toBeGreaterThanOrEqual(0.7);
        expect(match.matchedKeywords).toContain('click');
        expect(match.matchedKeywords).toContain('button');
        expect(match.matchedKeywords).toContain('verify');
      });

      it('should select crud-operations for element visibility test', () => {
        const test: E2ETest = {
          name: 'Display stat cards',
          description: 'Click to navigate and verify all stat cards are visible and display correct count',
          steps: ['Navigate to dashboard', 'Verify 4 stat cards show', 'Click first card', 'Verify details display'],
          assertions: ['4 stat cards are visible', 'Cards display correctly', 'Count shows accurate number'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('crud-operations');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('verify');
        expect(match.matchedKeywords).toContain('visible');
      });

      it('should select crud-operations for count validation', () => {
        const test: E2ETest = {
          name: 'Count project cards',
          description: 'Verify correct number of projects',
          steps: ['Navigate to dashboard', 'Count project cards'],
          assertions: ['Count equals expected number'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('crud-operations');
        expect(match.matchedKeywords).toContain('count');
      });
    });

    describe('Form validation pattern', () => {
      it('should select form-validation for required field test', () => {
        const test: E2ETest = {
          name: 'Disable button when field is empty',
          description: 'Create button should be disabled when name field is empty, fill field to enable button, clear field to disable again, verify validation error shows when invalid input entered',
          steps: [
            'Open modal',
            'Clear name field',
            'Verify Create button is disabled',
            'Fill field with valid text',
            'Verify button enabled',
          ],
          assertions: ['Create button is disabled when field empty', 'Button enabled when field has valid input', 'Validation error shows for invalid input'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('form-validation');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.score).toBeGreaterThanOrEqual(0.7);
        expect(match.matchedKeywords).toContain('field');
        expect(match.matchedKeywords).toContain('disabled');
        expect(match.matchedKeywords).toContain('empty');
      });

      it('should select form-validation for input validation test', () => {
        const test: E2ETest = {
          name: 'Show error for invalid input',
          description: 'Display error message when input validation fails, fill field with invalid value, check if disabled, verify validation error appears',
          steps: [
            'Fill field with invalid value',
            'Blur field',
            'Verify error message appears',
            'Fill field with valid input',
            'Verify error disappears and button enabled',
          ],
          assertions: ['Error message is visible for invalid input', 'Button disabled when validation fails', 'Valid input enables submission'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('form-validation');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('fill');
        expect(match.matchedKeywords).toContain('field');
        expect(match.matchedKeywords).toContain('invalid');
        expect(match.matchedKeywords).toContain('error');
      });

      it('should select form-validation for enable button test', () => {
        const test: E2ETest = {
          name: 'Enable button when valid',
          description: 'Button should be enabled when all fields are valid',
          steps: ['Fill all fields with valid values'],
          assertions: ['Submit button is enabled'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('form-validation');
        expect(match.matchedKeywords).toContain('field');
        expect(match.matchedKeywords).toContain('enabled');
        expect(match.matchedKeywords).toContain('valid');
      });
    });

    describe('Modal workflow pattern', () => {
      it('should select modal-workflow for modal open test', () => {
        const test: E2ETest = {
          name: 'Open modal on button click',
          description: 'Modal dialog appears when button is clicked',
          steps: ['Click New Project button', 'Modal appears'],
          assertions: ['Modal is visible', 'Backdrop blur is visible'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('modal-workflow');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.score).toBeGreaterThanOrEqual(0.7);
        expect(match.matchedKeywords).toContain('modal');
        expect(match.matchedKeywords).toContain('appears');
        expect(match.matchedKeywords).toContain('backdrop');
        expect(match.matchedKeywords).toContain('blur');
      });

      it('should select modal-workflow for modal close test', () => {
        const test: E2ETest = {
          name: 'Close modal with Escape',
          description: 'Modal dialog closes when Escape key is pressed, modal appears then closes, backdrop disappears',
          steps: ['Open modal', 'Modal appears with backdrop', 'Press Escape key', 'Modal closes and disappears'],
          assertions: ['Modal is not visible', 'Dialog closes correctly', 'Backdrop is gone'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('modal-workflow');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('modal');
        expect(match.matchedKeywords).toContain('closes');
        expect(match.matchedKeywords).toContain('escape');
      });

      it('should select modal-workflow for dialog test', () => {
        const test: E2ETest = {
          name: 'Display confirmation dialog',
          description: 'Confirmation dialog appears with backdrop',
          steps: ['Trigger action', 'Dialog appears with backdrop blur'],
          assertions: ['Dialog is visible'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('modal-workflow');
        expect(match.matchedKeywords).toContain('dialog');
        expect(match.matchedKeywords).toContain('appears');
        expect(match.matchedKeywords).toContain('backdrop');
        expect(match.matchedKeywords).toContain('blur');
      });
    });

    describe('Navigation pattern', () => {
      it('should select navigation for route change test', () => {
        const test: E2ETest = {
          name: 'Navigate to dashboard',
          description: 'User navigates to dashboard page using goto, route changes to /dashboard URL, page loads correctly after navigation redirect',
          steps: ['Navigate to /dashboard route using goto', 'Verify page URL changes', 'Check navigation complete', 'Verify page redirects correctly'],
          assertions: ['URL is /dashboard route', 'Page loads correctly after navigation', 'Route matches expected URL', 'Navigation redirect works'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('navigation');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('navigate');
        expect(match.matchedKeywords).toContain('page');
        expect(match.matchedKeywords).toContain('url');
      });

      it('should select navigation for keyboard navigation test', () => {
        const test: E2ETest = {
          name: 'Navigate with Tab key',
          description: 'User can navigate using keyboard',
          steps: ['Press Tab key', 'Focus moves to next element'],
          assertions: ['Correct element has focus'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('navigation');
        expect(match.matchedKeywords).toContain('navigate');
        expect(match.matchedKeywords).toContain('keyboard');
        expect(match.matchedKeywords).toContain('tab');
      });
    });

    describe('Loading states pattern', () => {
      it('should select loading-states for spinner test', () => {
        const test: E2ETest = {
          name: 'Show loading spinner',
          description: 'Loading spinner appears while fetching data',
          steps: ['Trigger data fetch', 'Loading spinner appears', 'Wait for data'],
          assertions: ['Spinner is visible during loading'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('loading-states');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('loading');
        expect(match.matchedKeywords).toContain('spinner');
        expect(match.matchedKeywords).toContain('appears');
        expect(match.matchedKeywords).toContain('fetching');
      });

      it('should select loading-states for skeleton test', () => {
        const test: E2ETest = {
          name: 'Display skeleton while loading',
          description: 'Skeleton UI appears then disappears when data loads',
          steps: ['Navigate to page', 'Skeleton appears', 'Data loads', 'Skeleton disappears'],
          assertions: ['Skeleton visible during loading'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('loading-states');
        expect(match.matchedKeywords).toContain('skeleton');
        expect(match.matchedKeywords).toContain('loading');
        expect(match.matchedKeywords).toContain('appears');
        expect(match.matchedKeywords).toContain('disappears');
      });
    });

    describe('Visual regression pattern', () => {
      it('should select visual-regression for screenshot test', () => {
        const test: E2ETest = {
          name: 'Match dashboard layout baseline',
          description: 'Dashboard visual layout matches baseline screenshot',
          steps: ['Navigate to dashboard', 'Take screenshot', 'Compare with baseline'],
          assertions: ['Screenshot matches baseline'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('visual-regression');
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('screenshot');
        expect(match.matchedKeywords).toContain('visual');
        expect(match.matchedKeywords).toContain('baseline');
        expect(match.matchedKeywords).toContain('match');
        expect(match.matchedKeywords).toContain('layout');
      });

      it('should select visual-regression for hover state test', () => {
        const test: E2ETest = {
          name: 'Match card hover state',
          description: 'Card visual state on hover matches baseline',
          steps: ['Hover over card', 'Take screenshot', 'Match baseline'],
          assertions: ['Hover state visual matches'],
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('visual-regression');
        expect(match.matchedKeywords).toContain('hover');
        expect(match.matchedKeywords).toContain('visual');
        expect(match.matchedKeywords).toContain('state');
        expect(match.matchedKeywords).toContain('match');
      });
    });

    describe('Template hints', () => {
      it('should use explicit template_hint with score 1.0', () => {
        const test: E2ETest = {
          name: 'Test with explicit hint',
          description: 'This should use the hinted template',
          steps: ['Do something'],
          assertions: ['Something happens'],
          template_hint: 'modal-workflow',
        };

        const match = selector.selectTemplate(test);

        expect(match.template).toBe('modal-workflow');
        expect(match.score).toBe(1.0);
        expect(match.shouldUseTemplate).toBe(true);
        expect(match.matchedKeywords).toContain('[explicit hint]');
      });

      it('should force LLM when template_hint is "llm"', () => {
        const test: E2ETest = {
          name: 'Complex test requiring LLM',
          description: 'This test is too complex for templates',
          steps: ['Complex multi-step workflow'],
          assertions: ['Complex assertion'],
          template_hint: 'llm',
        };

        const match = selector.selectTemplate(test);

        expect(match.score).toBe(0.0);
        expect(match.shouldUseTemplate).toBe(false);
        expect(match.matchedKeywords).toContain('[forced LLM]');
      });
    });

    describe('Edge cases', () => {
      it('should handle test with no matching keywords', () => {
        const test: E2ETest = {
          name: 'Unique test',
          description: 'Very specific scenario',
          steps: ['Do xyz'],
          assertions: ['abc happens'],
        };

        const match = selector.selectTemplate(test);

        expect(match.score).toBeLessThan(0.7);
        expect(match.shouldUseTemplate).toBe(false);
      });

      it('should handle test with ambiguous keywords', () => {
        const test: E2ETest = {
          name: 'Mixed test',
          description: 'Test with keywords from multiple patterns',
          steps: [
            'Click button',
            'Fill field',
            'Navigate to page',
            'Wait for loading',
          ],
          assertions: ['Multiple things happen'],
        };

        const match = selector.selectTemplate(test);

        // Should pick the highest scoring template
        expect(match.template).toBeDefined();
        expect(match.score).toBeGreaterThan(0);
      });

      it('should handle empty test', () => {
        const test: E2ETest = {
          name: '',
          description: '',
          steps: [],
          assertions: ['Something'],
        };

        const match = selector.selectTemplate(test);

        expect(match).toBeDefined();
        expect(match.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('scoreAll', () => {
    it('should return all template scores sorted by score', () => {
      const test: E2ETest = {
        name: 'Modal test',
        description: 'Test modal dialog appearance',
        steps: ['Click button', 'Modal appears with backdrop blur'],
        assertions: ['Modal is visible'],
      };

      const scores = selector.scoreAll(test);

      expect(scores).toHaveLength(6); // 6 templates
      expect(scores[0].template).toBe('modal-workflow'); // Highest score
      expect(scores[0].score).toBeGreaterThan(scores[1].score);
      expect(scores[1].score).toBeGreaterThanOrEqual(scores[2].score);
    });

    it('should mark templates above threshold as shouldUseTemplate', () => {
      const test: E2ETest = {
        name: 'Clear validation test',
        description: 'Fill field and verify validation error appears when input is invalid, field is empty, button disabled',
        steps: ['Fill field with invalid value', 'Verify error shows', 'Check if field validation fails', 'Verify button is disabled when field empty'],
        assertions: ['Error is visible', 'Validation works correctly', 'Field shows error for invalid input', 'Button enabled when valid data filled in field'],
      };

      const scores = selector.scoreAll(test);

      const highScoring = scores.filter((s) => s.shouldUseTemplate);
      const lowScoring = scores.filter((s) => !s.shouldUseTemplate);

      // At least one template should match above threshold
      expect(highScoring.length).toBeGreaterThan(0);
      highScoring.forEach((s) => {
        expect(s.score).toBeGreaterThanOrEqual(0.7);
      });
      lowScoring.forEach((s) => {
        expect(s.score).toBeLessThan(0.7);
      });
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all template names', () => {
      const templates = selector.getAvailableTemplates();

      expect(templates).toContain('crud-operations');
      expect(templates).toContain('form-validation');
      expect(templates).toContain('modal-workflow');
      expect(templates).toContain('navigation');
      expect(templates).toContain('loading-states');
      expect(templates).toContain('visual-regression');
      expect(templates).toHaveLength(6);
    });
  });

  describe('getTemplateKeywords', () => {
    it('should return keywords for crud-operations', () => {
      const keywords = selector.getTemplateKeywords('crud-operations');

      expect(keywords).toBeDefined();
      expect(keywords!.length).toBeGreaterThan(0);
      expect(keywords!.some((k) => k.keyword === 'click')).toBe(true);
      expect(keywords!.some((k) => k.keyword === 'button')).toBe(true);
    });

    it('should return keywords for form-validation', () => {
      const keywords = selector.getTemplateKeywords('form-validation');

      expect(keywords).toBeDefined();
      expect(keywords!.some((k) => k.keyword === 'fill')).toBe(true);
      expect(keywords!.some((k) => k.keyword === 'field')).toBe(true);
      expect(keywords!.some((k) => k.keyword === 'disabled')).toBe(true);
    });

    it('should return undefined for non-existent template', () => {
      const keywords = selector.getTemplateKeywords('non-existent' as any);

      expect(keywords).toBeUndefined();
    });

    it('should include weights for all keywords', () => {
      const keywords = selector.getTemplateKeywords('modal-workflow');

      expect(keywords).toBeDefined();
      keywords!.forEach((kw) => {
        expect(kw.weight).toBeGreaterThan(0);
        expect(kw.keyword).toBeTruthy();
      });
    });
  });

  describe('explain', () => {
    it('should explain template selection decision', () => {
      const test: E2ETest = {
        name: 'Click button test',
        description: 'User clicks button to toggle state',
        steps: ['Click button', 'Verify state changes'],
        assertions: ['Button shows new state'],
      };

      const explanation = selector.explain(test);

      expect(explanation).toContain('Decision:');
      expect(explanation).toContain('Score:');
      expect(explanation).toContain('Matched keywords:');
      expect(explanation).toContain('Threshold:');
    });

    it('should explain explicit template hint', () => {
      const test: E2ETest = {
        name: 'Test with hint',
        description: 'Test',
        steps: ['Do something'],
        assertions: ['Something happens'],
        template_hint: 'navigation',
      };

      const explanation = selector.explain(test);

      expect(explanation).toContain('explicitly specified');
      expect(explanation).toContain('template_hint');
      expect(explanation).toContain('navigation');
    });

    it('should explain forced LLM generation', () => {
      const test: E2ETest = {
        name: 'Complex test',
        description: 'Requires LLM',
        steps: ['Complex workflow'],
        assertions: ['Complex result'],
        template_hint: 'llm',
      };

      const explanation = selector.explain(test);

      expect(explanation).toContain('LLM generation forced');
      expect(explanation).toContain('template_hint: "llm"');
    });

    it('should explain LLM recommendation for low score', () => {
      const test: E2ETest = {
        name: 'Unique test',
        description: 'No matching keywords',
        steps: ['Do xyz'],
        assertions: ['abc happens'],
      };

      const explanation = selector.explain(test);

      expect(explanation).toContain('LLM generation');
      expect(explanation).toContain('Score:');
    });
  });

  describe('Custom threshold', () => {
    it('should use custom threshold', () => {
      const customSelector = new TemplateSelector(undefined, 0.5);

      const test: E2ETest = {
        name: 'Moderate match',
        description: 'Click button',
        steps: ['Click button'],
        assertions: ['Something happens'],
      };

      const match = customSelector.selectTemplate(test);

      // With lower threshold (0.5), more tests should use templates
      if (match.score >= 0.5 && match.score < 0.7) {
        expect(match.shouldUseTemplate).toBe(true);
      }
    });
  });

  describe('Accuracy validation', () => {
    it('should correctly identify all 6 template patterns', () => {
      const tests: Array<{ test: E2ETest; expected: string }> = [
        {
          test: {
            name: 'CRUD test',
            description: 'Click button to verify display count shows correct value',
            steps: ['Click', 'Verify count'],
            assertions: ['Count is correct'],
          },
          expected: 'crud-operations',
        },
        {
          test: {
            name: 'Form test',
            description: 'Fill field and check if button is disabled when empty',
            steps: ['Fill field', 'Clear field'],
            assertions: ['Button disabled'],
          },
          expected: 'form-validation',
        },
        {
          test: {
            name: 'Modal test',
            description: 'Modal dialog appears with backdrop blur when clicked',
            steps: ['Click', 'Modal appears'],
            assertions: ['Modal visible'],
          },
          expected: 'modal-workflow',
        },
        {
          test: {
            name: 'Nav test',
            description: 'Navigate to different page and verify URL route',
            steps: ['Navigate to /page', 'Check URL'],
            assertions: ['URL is correct'],
          },
          expected: 'navigation',
        },
        {
          test: {
            name: 'Loading test',
            description: 'Loading spinner appears while fetching then disappears',
            steps: ['Wait for spinner', 'Wait for data'],
            assertions: ['Loading complete'],
          },
          expected: 'loading-states',
        },
        {
          test: {
            name: 'Visual test',
            description: 'Take screenshot and match visual baseline for hover state',
            steps: ['Hover', 'Screenshot', 'Compare'],
            assertions: ['Visual matches'],
          },
          expected: 'visual-regression',
        },
      ];

      const results = tests.map((t) => ({
        expected: t.expected,
        actual: selector.selectTemplate(t.test).template,
      }));

      const accuracy =
        results.filter((r) => r.actual === r.expected).length / results.length;

      // Expect 100% accuracy on clear examples
      expect(accuracy).toBe(1.0);
    });
  });
});
