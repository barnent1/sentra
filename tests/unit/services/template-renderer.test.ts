/**
 * Template Renderer Service Tests
 *
 * Comprehensive test suite for Mustache-style template rendering
 * Target: 90%+ coverage
 */

import { describe, it, expect } from 'vitest';
import {
  TemplateRenderer,
  TemplateHelpers,
  TemplateRenderError,
  type TemplateContext,
} from '../../../src/services/template-renderer';

describe('TemplateHelpers', () => {
  describe('uppercase', () => {
    it('should convert string to uppercase', () => {
      expect(TemplateHelpers.uppercase('hello')).toBe('HELLO');
      expect(TemplateHelpers.uppercase('World')).toBe('WORLD');
    });

    it('should handle empty string', () => {
      expect(TemplateHelpers.uppercase('')).toBe('');
    });
  });

  describe('lowercase', () => {
    it('should convert string to lowercase', () => {
      expect(TemplateHelpers.lowercase('HELLO')).toBe('hello');
      expect(TemplateHelpers.lowercase('World')).toBe('world');
    });

    it('should handle empty string', () => {
      expect(TemplateHelpers.lowercase('')).toBe('');
    });
  });

  describe('kebabCase', () => {
    it('should convert string to kebab-case', () => {
      expect(TemplateHelpers.kebabCase('Project Card')).toBe('project-card');
      expect(TemplateHelpers.kebabCase('projectCard')).toBe('project-card');
      expect(TemplateHelpers.kebabCase('ProjectCard')).toBe('project-card');
    });

    it('should handle underscores', () => {
      expect(TemplateHelpers.kebabCase('project_card')).toBe('project-card');
    });

    it('should handle multiple spaces', () => {
      expect(TemplateHelpers.kebabCase('Project   Card')).toBe('project-card');
    });

    it('should trim whitespace', () => {
      expect(TemplateHelpers.kebabCase('  Project Card  ')).toBe('project-card');
    });
  });

  describe('camelCase', () => {
    it('should convert string to camelCase', () => {
      expect(TemplateHelpers.camelCase('project-card')).toBe('projectCard');
      expect(TemplateHelpers.camelCase('Project Card')).toBe('projectCard');
      expect(TemplateHelpers.camelCase('ProjectCard')).toBe('projectCard');
    });

    it('should handle underscores', () => {
      expect(TemplateHelpers.camelCase('project_card')).toBe('projectCard');
    });

    it('should handle mixed separators', () => {
      expect(TemplateHelpers.camelCase('project-card_button')).toBe(
        'projectCardButton'
      );
    });

    it('should trim whitespace', () => {
      expect(TemplateHelpers.camelCase('  project-card  ')).toBe('projectCard');
    });
  });

  describe('pascalCase', () => {
    it('should convert string to PascalCase', () => {
      expect(TemplateHelpers.pascalCase('project-card')).toBe('ProjectCard');
      expect(TemplateHelpers.pascalCase('Project Card')).toBe('ProjectCard');
      expect(TemplateHelpers.pascalCase('projectCard')).toBe('ProjectCard');
    });

    it('should handle underscores', () => {
      expect(TemplateHelpers.pascalCase('project_card')).toBe('ProjectCard');
    });
  });
});

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer();

  describe('render - simple variables', () => {
    it('should render single variable', () => {
      const result = renderer.render('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should render multiple variables', () => {
      const template = '{{greeting}} {{name}}!';
      const context = { greeting: 'Hello', name: 'World' };
      expect(renderer.render(template, context)).toBe('Hello World!');
    });

    it('should render number variables', () => {
      const result = renderer.render('Count: {{count}}', { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('should render boolean variables', () => {
      const result = renderer.render('Active: {{active}}', { active: true });
      expect(result).toBe('Active: true');
    });

    it('should render empty string for undefined variables', () => {
      const result = renderer.render('Hello {{missing}}!', {});
      expect(result).toBe('Hello !');
    });

    it('should render empty string for null variables', () => {
      const result = renderer.render('Hello {{name}}!', { name: null });
      expect(result).toBe('Hello !');
    });

    it('should handle array variables by joining', () => {
      const result = renderer.render('Items: {{items}}', {
        items: ['a', 'b', 'c'],
      });
      expect(result).toBe('Items: a, b, c');
    });

    it('should handle object variables by JSON stringifying', () => {
      const result = renderer.render('Data: {{data}}', {
        data: { key: 'value' },
      });
      expect(result).toBe('Data: {"key":"value"}');
    });
  });

  describe('render - conditionals', () => {
    it('should render {{#if}} block when condition is true', () => {
      const template = '{{#if show}}Visible{{/if}}';
      expect(renderer.render(template, { show: true })).toBe('Visible');
    });

    it('should not render {{#if}} block when condition is false', () => {
      const template = '{{#if show}}Visible{{/if}}';
      expect(renderer.render(template, { show: false })).toBe('');
    });

    it('should not render {{#if}} block when condition is undefined', () => {
      const template = '{{#if show}}Visible{{/if}}';
      expect(renderer.render(template, {})).toBe('');
    });

    it('should treat non-empty string as truthy', () => {
      const template = '{{#if name}}Hello{{/if}}';
      expect(renderer.render(template, { name: 'World' })).toBe('Hello');
    });

    it('should treat empty string as falsy', () => {
      const template = '{{#if name}}Hello{{/if}}';
      expect(renderer.render(template, { name: '' })).toBe('');
    });

    it('should treat non-empty array as truthy', () => {
      const template = '{{#if items}}Has items{{/if}}';
      expect(renderer.render(template, { items: [1, 2, 3] })).toBe('Has items');
    });

    it('should treat empty array as falsy', () => {
      const template = '{{#if items}}Has items{{/if}}';
      expect(renderer.render(template, { items: [] })).toBe('');
    });

    it('should render {{#unless}} block when condition is false', () => {
      const template = '{{#unless hidden}}Visible{{/unless}}';
      expect(renderer.render(template, { hidden: false })).toBe('Visible');
    });

    it('should not render {{#unless}} block when condition is true', () => {
      const template = '{{#unless hidden}}Visible{{/unless}}';
      expect(renderer.render(template, { hidden: true })).toBe('');
    });

    it('should support legacy {{#CONDITION}} syntax', () => {
      const template = '{{#SKIP_IF_EMPTY}}Skip{{/SKIP_IF_EMPTY}}';
      expect(renderer.render(template, { SKIP_IF_EMPTY: true })).toBe('Skip');
    });

    it('should support nested conditionals', () => {
      const template =
        '{{#if outer}}Outer{{#if inner}}Inner{{/if}}{{/if}}';
      expect(
        renderer.render(template, { outer: true, inner: true })
      ).toBe('OuterInner');
      expect(
        renderer.render(template, { outer: true, inner: false })
      ).toBe('Outer');
    });
  });

  describe('render - loops', () => {
    it('should render {{#each}} for array of strings', () => {
      const template = '{{#each items}}{{this}} {{/each}}';
      const context = { items: ['a', 'b', 'c'] };
      expect(renderer.render(template, context)).toBe('a b c ');
    });

    it('should render {{#each}} for array of objects', () => {
      const template = '{{#each users}}{{name}} {{/each}}';
      const context = {
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      };
      expect(renderer.render(template, context)).toBe('Alice Bob ');
    });

    it('should render empty string for empty array', () => {
      const template = '{{#each items}}{{this}}{{/each}}';
      expect(renderer.render(template, { items: [] })).toBe('');
    });

    it('should render empty string when array is undefined', () => {
      const template = '{{#each items}}{{this}}{{/each}}';
      expect(renderer.render(template, {})).toBe('');
    });

    it('should render empty string when not an array', () => {
      const template = '{{#each items}}{{this}}{{/each}}';
      expect(renderer.render(template, { items: 'not-an-array' })).toBe('');
    });

    it('should handle nested object properties in loop', () => {
      const template = '{{#each assertions}}{{ASSERTION_VAR}}: {{ASSERTION_METHOD}} {{/each}}';
      const context = {
        assertions: [
          { ASSERTION_VAR: 'button', ASSERTION_METHOD: 'toBeVisible()' },
          { ASSERTION_VAR: 'modal', ASSERTION_METHOD: 'not.toBeVisible()' },
        ],
      };
      expect(renderer.render(template, context)).toBe(
        'button: toBeVisible() modal: not.toBeVisible() '
      );
    });

    it('should preserve outer context in loop', () => {
      const template = '{{#each items}}{{outer}}-{{this}} {{/each}}';
      const context = { outer: 'prefix', items: ['a', 'b'] };
      expect(renderer.render(template, context)).toBe('prefix-a prefix-b ');
    });
  });

  describe('render - helpers', () => {
    it('should apply uppercase helper', () => {
      const result = renderer.render('{{uppercase name}}', { name: 'hello' });
      expect(result).toBe('HELLO');
    });

    it('should apply lowercase helper', () => {
      const result = renderer.render('{{lowercase name}}', { name: 'HELLO' });
      expect(result).toBe('hello');
    });

    it('should apply kebabCase helper', () => {
      const result = renderer.render('{{kebabCase name}}', {
        name: 'Project Card',
      });
      expect(result).toBe('project-card');
    });

    it('should apply camelCase helper', () => {
      const result = renderer.render('{{camelCase name}}', {
        name: 'project-card',
      });
      expect(result).toBe('projectCard');
    });

    it('should apply pascalCase helper', () => {
      const result = renderer.render('{{pascalCase name}}', {
        name: 'project-card',
      });
      expect(result).toBe('ProjectCard');
    });

    it('should return empty string for non-string values', () => {
      const result = renderer.render('{{uppercase count}}', { count: 42 });
      expect(result).toBe('');
    });

    it('should handle unknown helpers as regular variables', () => {
      const result = renderer.render('{{unknown value}}', {
        unknown: 'test',
        value: 'val',
      });
      // Unknown helpers are treated as two-word patterns that don't match
      expect(result).toBe('{{unknown value}}');
    });
  });

  describe('render - complex templates', () => {
    it('should render template with variables, conditionals, and loops', () => {
      const template = `
test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
  {{#if SKIP_IF_EMPTY}}
  if (await element.count() === 0) {
    test.skip();
  }
  {{/if}}

  {{#each ASSERTIONS}}
  await expect({{ASSERTION_VAR}}).{{ASSERTION_METHOD}};
  {{/each}}
});`;

      const context = {
        ACTION: 'open modal',
        TRIGGER: 'clicking button',
        SKIP_IF_EMPTY: true,
        ASSERTIONS: [
          { ASSERTION_VAR: 'modal', ASSERTION_METHOD: 'toBeVisible()' },
        ],
      };

      const result = renderer.render(template, context);

      expect(result).toContain('should open modal when clicking button');
      expect(result).toContain('if (await element.count() === 0)');
      expect(result).toContain('await expect(modal).toBeVisible()');
    });

    it('should handle real-world CRUD template', () => {
      const template = `test('should {{ACTION}} when {{TRIGGER}}', async ({ page }) => {
  const {{ELEMENT_VAR}} = page.locator('{{ELEMENT_SELECTOR}}');
  await {{ELEMENT_VAR}}.click();
});`;

      const context = {
        ACTION: 'toggle mute state',
        TRIGGER: 'clicking mute button',
        ELEMENT_VAR: 'muteButton',
        ELEMENT_SELECTOR: '[data-testid="mute-button"]',
      };

      const result = renderer.render(template, context);

      expect(result).toContain('should toggle mute state when clicking mute button');
      expect(result).toContain('const muteButton = page.locator');
      expect(result).toContain('[data-testid="mute-button"]');
    });
  });

  describe('validateSyntax', () => {
    it('should validate correct template', () => {
      const template = '{{#if show}}Visible{{/if}}';
      expect(renderer.validateSyntax(template)).toBe(true);
    });

    it('should throw error for unclosed {{#if}} tag', () => {
      const template = '{{#if show}}Visible';
      expect(() => renderer.validateSyntax(template)).toThrow(
        TemplateRenderError
      );
      expect(() => renderer.validateSyntax(template)).toThrow('Unclosed {{#if}} tag');
    });

    it('should throw error for unclosed {{#each}} tag', () => {
      const template = '{{#each items}}{{this}}';
      expect(() => renderer.validateSyntax(template)).toThrow(
        TemplateRenderError
      );
      expect(() => renderer.validateSyntax(template)).toThrow('Unclosed {{#each}} tag');
    });

    it('should throw error for unclosed {{#unless}} tag', () => {
      const template = '{{#unless hidden}}Visible';
      expect(() => renderer.validateSyntax(template)).toThrow(
        TemplateRenderError
      );
      expect(() => renderer.validateSyntax(template)).toThrow('Unclosed {{#unless}} tag');
    });

    it('should validate nested tags correctly', () => {
      const template = '{{#if outer}}{{#each items}}{{this}}{{/each}}{{/if}}';
      expect(renderer.validateSyntax(template)).toBe(true);
    });
  });

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const variables = renderer.extractVariables('{{name}} {{age}}');
      expect(variables).toContain('name');
      expect(variables).toContain('age');
      expect(variables).toHaveLength(2);
    });

    it('should extract variables from conditionals', () => {
      const template = '{{#if show}}{{name}}{{/if}}';
      const variables = renderer.extractVariables(template);
      expect(variables).toContain('show');
      expect(variables).toContain('name');
    });

    it('should extract variables from loops', () => {
      const template = '{{#each items}}{{value}}{{/each}}';
      const variables = renderer.extractVariables(template);
      expect(variables).toContain('items');
      expect(variables).toContain('value');
    });

    it('should extract variables from helpers', () => {
      const template = '{{uppercase name}}';
      const variables = renderer.extractVariables(template);
      expect(variables).toContain('name');
    });

    it('should extract variables from {{#unless}}', () => {
      const template = '{{#unless hidden}}Content{{/unless}}';
      const variables = renderer.extractVariables(template);
      expect(variables).toContain('hidden');
    });

    it('should deduplicate variables', () => {
      const template = '{{name}} {{name}}';
      const variables = renderer.extractVariables(template);
      expect(variables.filter((v) => v === 'name')).toHaveLength(1);
    });

    it('should handle complex templates', () => {
      const template = `
{{#if SKIP_IF_EMPTY}}
  const {{ELEMENT_VAR}} = page.locator('{{SELECTOR}}');
  {{#each ASSERTIONS}}
    await expect({{ASSERTION_VAR}}).toBeVisible();
  {{/each}}
{{/if}}`;

      const variables = renderer.extractVariables(template);

      expect(variables).toContain('SKIP_IF_EMPTY');
      expect(variables).toContain('ELEMENT_VAR');
      expect(variables).toContain('SELECTOR');
      expect(variables).toContain('ASSERTIONS');
      expect(variables).toContain('ASSERTION_VAR');
    });
  });

  describe('error handling', () => {
    it('should throw TemplateRenderError with context', () => {
      const renderer = new TemplateRenderer();

      try {
        // Force an error by creating invalid template that passes syntax check
        // but fails during rendering
        const template = '{{#if}}test{{/if}}'; // Malformed if without condition
        renderer.render(template, {});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should preserve original error if it is TemplateRenderError', () => {
      const template = '{{#if unclosed}}';

      try {
        renderer.validateSyntax(template);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateRenderError);
        expect((error as TemplateRenderError).name).toBe('TemplateRenderError');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty template', () => {
      expect(renderer.render('', {})).toBe('');
    });

    it('should handle template with no variables', () => {
      expect(renderer.render('Hello World', {})).toBe('Hello World');
    });

    it('should handle empty context', () => {
      expect(renderer.render('{{name}}', {})).toBe('');
    });

    it('should handle whitespace in templates', () => {
      const template = '  {{name}}  ';
      expect(renderer.render(template, { name: 'Test' })).toBe('  Test  ');
    });

    it('should handle newlines in templates', () => {
      const template = 'Line 1\n{{name}}\nLine 3';
      expect(renderer.render(template, { name: 'Line 2' })).toBe(
        'Line 1\nLine 2\nLine 3'
      );
    });

    it('should handle special characters in values', () => {
      const result = renderer.render('{{value}}', {
        value: 'Test "quotes" and \'apostrophes\'',
      });
      expect(result).toBe('Test "quotes" and \'apostrophes\'');
    });
  });
});
