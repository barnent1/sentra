/**
 * Template Renderer Service
 *
 * Mustache-style template rendering engine for E2E test generation
 * Part of Phase 3.2: E2E Test Generation - Week 4
 *
 * @module services/template-renderer
 */

/**
 * Template variable value types
 */
export type TemplateValue = string | number | boolean | TemplateArray | TemplateObject;

export interface TemplateArray extends Array<TemplateValue> {}
export interface TemplateObject {
  [key: string]: TemplateValue;
}

/**
 * Template variable context
 */
export interface TemplateContext {
  [key: string]: TemplateValue;
}

/**
 * Rendering error types
 */
export class TemplateRenderError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

/**
 * Template helpers for string transformation
 */
export class TemplateHelpers {
  /**
   * Convert string to uppercase
   */
  static uppercase(value: string): string {
    return value.toUpperCase();
  }

  /**
   * Convert string to lowercase
   */
  static lowercase(value: string): string {
    return value.toLowerCase();
  }

  /**
   * Convert string to kebab-case
   * @example "Project Card" → "project-card"
   */
  static kebabCase(value: string): string {
    return value
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert string to camelCase
   * @example "project-card" → "projectCard"
   */
  static camelCase(value: string): string {
    return value
      .trim()
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[A-Z]/, (char) => char.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   * @example "project-card" → "ProjectCard"
   */
  static pascalCase(value: string): string {
    const camelCased = TemplateHelpers.camelCase(value);
    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
  }
}

/**
 * TemplateRenderer
 *
 * Renders Mustache-style templates with variable substitution,
 * conditional blocks, loops, and helpers
 *
 * Syntax:
 * - Variables: {{VARIABLE}}
 * - Conditionals: {{#if CONDITION}}...{{/if}}
 * - Negation: {{#unless CONDITION}}...{{/unless}}
 * - Loops: {{#each ARRAY}}...{{/each}}
 * - Helpers: {{uppercase VALUE}}, {{kebabCase VALUE}}
 *
 * @example
 * const renderer = new TemplateRenderer();
 * const template = "Hello {{name}}!";
 * const result = renderer.render(template, { name: "World" });
 * // Result: "Hello World!"
 */
export class TemplateRenderer {
  private readonly helpers: Record<string, (value: string) => string>;

  constructor() {
    this.helpers = {
      uppercase: TemplateHelpers.uppercase,
      lowercase: TemplateHelpers.lowercase,
      kebabCase: TemplateHelpers.kebabCase,
      camelCase: TemplateHelpers.camelCase,
      pascalCase: TemplateHelpers.pascalCase,
    };
  }

  /**
   * Render template with context
   *
   * @param template - Template string with Mustache syntax
   * @param context - Variable context for substitution
   * @returns Rendered string
   * @throws {TemplateRenderError} If rendering fails
   *
   * @example
   * renderer.render('{{name}}', { name: 'Test' }); // "Test"
   */
  render(template: string, context: TemplateContext): string {
    try {
      // Process template in order: loops → conditionals → variables → helpers
      let result = template;

      result = this.renderLoops(result, context);
      result = this.renderConditionals(result, context);
      result = this.renderVariables(result, context);
      result = this.renderHelpers(result, context);

      return result;
    } catch (error) {
      if (error instanceof TemplateRenderError) {
        throw error;
      }
      throw new TemplateRenderError('Failed to render template', {
        template,
        context,
        error,
      });
    }
  }

  /**
   * Render loops: {{#each ARRAY}}...{{/each}}
   */
  private renderLoops(template: string, context: TemplateContext): string {
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(loopRegex, (match, arrayName, content) => {
      const arrayValue = context[arrayName];

      if (!Array.isArray(arrayValue)) {
        // If not an array or undefined, render empty string
        return '';
      }

      return arrayValue
        .map((item) => {
          // Each item becomes the context for the loop body
          const itemContext =
            typeof item === 'object' && item !== null && !Array.isArray(item)
              ? { ...context, ...item }
              : { ...context, this: item };

          return this.renderLoopIteration(content, itemContext);
        })
        .join('');
    });
  }

  /**
   * Render single loop iteration
   */
  private renderLoopIteration(content: string, context: TemplateContext): string {
    let result = content;

    // Render variables in loop body
    result = this.renderVariables(result, context);
    result = this.renderHelpers(result, context);

    return result;
  }

  /**
   * Render conditionals: {{#if CONDITION}}...{{/if}}
   */
  private renderConditionals(template: string, context: TemplateContext): string {
    let result = template;
    let previousResult = '';

    // Keep processing until no more conditionals are found (handles nested)
    while (result !== previousResult) {
      previousResult = result;

      // Handle {{#if CONDITION}}...{{/if}}
      const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/;
      result = result.replace(ifRegex, (match, conditionName, content) => {
        const conditionValue = context[conditionName];
        return this.isTruthy(conditionValue) ? content : '';
      });

      // Handle {{#unless CONDITION}}...{{/unless}}
      const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/;
      result = result.replace(unlessRegex, (match, conditionName, content) => {
        const conditionValue = context[conditionName];
        return this.isTruthy(conditionValue) ? '' : content;
      });

      // Handle legacy {{#CONDITION}}...{{/CONDITION}} syntax (for backwards compatibility)
      const legacyRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/;
      result = result.replace(legacyRegex, (match, conditionName, content) => {
        const conditionValue = context[conditionName];
        return this.isTruthy(conditionValue) ? content : '';
      });
    }

    return result;
  }

  /**
   * Check if value is truthy
   */
  private isTruthy(value: TemplateValue | undefined): boolean {
    if (value === undefined || value === null || value === false) {
      return false;
    }
    if (typeof value === 'string' && value.length === 0) {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Render variables: {{VARIABLE}}
   */
  private renderVariables(template: string, context: TemplateContext): string {
    const variableRegex = /\{\{(\w+)\}\}/g;

    return template.replace(variableRegex, (match, variableName) => {
      const value = context[variableName];

      if (value === undefined || value === null) {
        return '';
      }

      // Convert value to string
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return '';
    });
  }

  /**
   * Render helpers: {{uppercase VALUE}}
   */
  private renderHelpers(template: string, context: TemplateContext): string {
    const helperRegex = /\{\{(\w+)\s+(\w+)\}\}/g;

    return template.replace(helperRegex, (match, helperName, variableName) => {
      const helper = this.helpers[helperName];

      if (!helper) {
        // Not a helper, might be a two-word variable
        return match;
      }

      const value = context[variableName];

      if (typeof value !== 'string') {
        return '';
      }

      return helper(value);
    });
  }

  /**
   * Validate template syntax
   *
   * @param template - Template to validate
   * @returns True if valid
   * @throws {TemplateRenderError} If syntax is invalid
   */
  validateSyntax(template: string): boolean {
    // Check for unclosed tags
    const openIf = (template.match(/\{\{#if\s+\w+\}\}/g) || []).length;
    const closeIf = (template.match(/\{\{\/if\}\}/g) || []).length;

    if (openIf !== closeIf) {
      throw new TemplateRenderError('Unclosed {{#if}} tag', {
        openTags: openIf,
        closeTags: closeIf,
      });
    }

    const openEach = (template.match(/\{\{#each\s+\w+\}\}/g) || []).length;
    const closeEach = (template.match(/\{\{\/each\}\}/g) || []).length;

    if (openEach !== closeEach) {
      throw new TemplateRenderError('Unclosed {{#each}} tag', {
        openTags: openEach,
        closeTags: closeEach,
      });
    }

    const openUnless = (template.match(/\{\{#unless\s+\w+\}\}/g) || []).length;
    const closeUnless = (template.match(/\{\{\/unless\}\}/g) || []).length;

    if (openUnless !== closeUnless) {
      throw new TemplateRenderError('Unclosed {{#unless}} tag', {
        openTags: openUnless,
        closeTags: closeUnless,
      });
    }

    return true;
  }

  /**
   * Extract variables used in template
   *
   * @param template - Template to analyze
   * @returns Array of variable names used
   *
   * @example
   * extractVariables('{{name}} {{age}}'); // ['name', 'age']
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();

    // Extract from {{VARIABLE}}
    const variableMatches = template.matchAll(/\{\{(\w+)\}\}/g);
    for (const match of variableMatches) {
      variables.add(match[1]);
    }

    // Extract from {{#if VARIABLE}}
    const ifMatches = template.matchAll(/\{\{#if\s+(\w+)\}\}/g);
    for (const match of ifMatches) {
      variables.add(match[1]);
    }

    // Extract from {{#unless VARIABLE}}
    const unlessMatches = template.matchAll(/\{\{#unless\s+(\w+)\}\}/g);
    for (const match of unlessMatches) {
      variables.add(match[1]);
    }

    // Extract from {{#each ARRAY}}
    const eachMatches = template.matchAll(/\{\{#each\s+(\w+)\}\}/g);
    for (const match of eachMatches) {
      variables.add(match[1]);
    }

    // Extract from {{helper VALUE}}
    const helperMatches = template.matchAll(/\{\{(\w+)\s+(\w+)\}\}/g);
    for (const match of helperMatches) {
      if (this.helpers[match[1]]) {
        // Second word is the variable
        variables.add(match[2]);
      } else {
        // Not a helper, might be variables
        variables.add(match[1]);
        variables.add(match[2]);
      }
    }

    return Array.from(variables);
  }
}
