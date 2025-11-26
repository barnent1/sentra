/**
 * Spec to Prompt Translator Service
 *
 * Converts architect specifications to v0-friendly prompts for design generation
 * Part of Design Generation Feature (Phase 3.3)
 *
 * @module services/spec-to-prompt
 */

/**
 * Custom error for spec validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Design tokens extracted from specifications
 */
export interface DesignTokens {
  colors?: {
    [key: string]: string;
  };
  spacing?: {
    [key: string]: string;
  };
  typography?: {
    [key: string]: string | number;
  };
}

/**
 * Layout specification for UI screens
 */
export interface LayoutSpec {
  type: 'flex' | 'grid' | 'stack' | string;
  columns?: number;
  rows?: number;
  gap?: string;
  padding?: string;
  spacing?: string;
  responsive?: {
    [breakpoint: string]: {
      columns?: number;
      rows?: number;
    };
  };
}

/**
 * Individual component specification
 */
export interface ComponentSpec {
  name: string;
  type: string;
  props: {
    [key: string]: unknown;
  };
}

/**
 * Interaction specification for user actions
 */
export interface InteractionSpec {
  trigger: string;
  target: string;
  action: string;
  visualFeedback?: string;
  destination?: string;
}

/**
 * Behavior specification including interactions and states
 */
export interface BehaviorSpec {
  interactions: InteractionSpec[];
  states: string[];
}

/**
 * Complete architect specification for a UI screen
 */
export interface ArchitectSpec {
  screen: string;
  description: string;
  route: string;
  layout: LayoutSpec;
  components: ComponentSpec[];
  behavior: BehaviorSpec;
  design_tokens?: DesignTokens;
}

/**
 * Validation result with errors if validation fails
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate architect specification
 *
 * Ensures all required fields are present and valid
 *
 * @param spec - Architect specification to validate
 * @returns Validation result with list of errors
 *
 * @example
 * const result = validateSpec(spec);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateSpec(spec: ArchitectSpec): ValidationResult {
  const errors: string[] = [];

  // Validate screen name
  if (!spec.screen || spec.screen.trim().length === 0) {
    errors.push('Screen name cannot be empty');
  }

  // Validate description
  if (!spec.description) {
    errors.push('Missing required field: description');
  }

  // Validate route
  if (!spec.route) {
    errors.push('Missing required field: route');
  } else if (!spec.route.startsWith('/')) {
    errors.push('Route must start with /');
  }

  // Validate layout
  if (!spec.layout) {
    errors.push('Missing required field: layout');
  }

  // Validate components
  if (!spec.components) {
    errors.push('Missing required field: components');
  } else if (spec.components.length === 0) {
    errors.push('Components array cannot be empty');
  }

  // Validate behavior
  if (!spec.behavior) {
    errors.push('Missing required field: behavior');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract design tokens from architect specification
 *
 * Returns empty object if no design tokens are present
 *
 * @param spec - Architect specification
 * @returns Design tokens object
 *
 * @example
 * const tokens = extractDesignTokens(spec);
 * if (tokens.colors) {
 *   console.log('Primary color:', tokens.colors.primary);
 * }
 */
export function extractDesignTokens(spec: ArchitectSpec): DesignTokens {
  if (!spec.design_tokens) {
    return {};
  }

  const tokens: DesignTokens = {};

  if (spec.design_tokens.colors) {
    tokens.colors = { ...spec.design_tokens.colors };
  }

  if (spec.design_tokens.spacing) {
    tokens.spacing = { ...spec.design_tokens.spacing };
  }

  if (spec.design_tokens.typography) {
    tokens.typography = { ...spec.design_tokens.typography };
  }

  return tokens;
}

/**
 * Build v0-friendly prompt from architect specification
 *
 * Generates comprehensive prompt including:
 * - Screen description and purpose
 * - Layout specifications
 * - Component hierarchy
 * - Behavioral requirements
 * - Design tokens (if present)
 * - Technology stack requirements
 * - Accessibility requirements
 *
 * @param spec - Architect specification
 * @returns v0-ready prompt string
 * @throws ValidationError if spec validation fails
 *
 * @example
 * const prompt = buildV0Prompt(spec);
 * const response = await v0SDK.generate({ prompt });
 */
export function buildV0Prompt(spec: ArchitectSpec): string {
  // Validate spec first
  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new ValidationError(
      `Spec validation failed: ${validation.errors.join(', ')}`
    );
  }

  const sections: string[] = [];

  // 1. Screen Overview
  sections.push(
    `# ${spec.screen}\n\n${spec.description}\n\nRoute: ${spec.route}`
  );

  // 2. Technology Stack Requirements
  sections.push(
    `## Technology Requirements\n\n` +
      `- Framework: Next.js 15 with App Router\n` +
      `- UI Library: React 19\n` +
      `- Language: TypeScript (strict mode)\n` +
      `- Styling: Tailwind CSS\n` +
      `- Components: shadcn/ui (accessible components built on Radix UI)`
  );

  // 3. Layout Specification
  sections.push(buildLayoutSection(spec.layout));

  // 4. Components Specification
  sections.push(buildComponentsSection(spec.components));

  // 5. Behavior Specification
  sections.push(buildBehaviorSection(spec.behavior));

  // 6. Design Tokens (if present)
  if (spec.design_tokens) {
    sections.push(buildDesignTokensSection(spec.design_tokens));
  }

  // 7. Accessibility Requirements
  sections.push(
    `## Accessibility Requirements\n\n` +
      `- ARIA labels on all interactive elements\n` +
      `- Keyboard navigation support (Tab, Enter, Escape)\n` +
      `- Focus indicators (visible focus ring)\n` +
      `- Screen reader friendly\n` +
      `- Semantic HTML structure`
  );

  return sections.join('\n\n');
}

/**
 * Build layout section of prompt
 *
 * @param layout - Layout specification
 * @returns Formatted layout section
 */
function buildLayoutSection(layout: LayoutSpec): string {
  let section = `## Layout\n\n`;
  section += `Type: ${layout.type}`;

  if (layout.columns) {
    section += `\n- ${layout.columns} columns`;
  }

  if (layout.rows) {
    section += `\n- ${layout.rows} rows`;
  }

  if (layout.gap) {
    section += `\n- Gap: ${layout.gap}`;
  }

  if (layout.padding) {
    section += `\n- Padding: ${layout.padding}`;
  }

  if (layout.spacing) {
    section += `\n- Spacing: ${layout.spacing}`;
  }

  if (layout.responsive) {
    section += `\n\nResponsive behavior:`;
    for (const [breakpoint, config] of Object.entries(layout.responsive)) {
      section += `\n- ${breakpoint}: `;
      if (config.columns) {
        section += `${config.columns} columns`;
      }
      if (config.rows) {
        section += ` ${config.rows} rows`;
      }
    }
  }

  return section;
}

/**
 * Build components section of prompt
 *
 * @param components - Array of component specifications
 * @returns Formatted components section
 */
function buildComponentsSection(components: ComponentSpec[]): string {
  let section = `## Components\n\n`;

  for (const component of components) {
    section += `### ${component.name}\n`;
    section += `Type: ${component.type}\n`;

    if (Object.keys(component.props).length > 0) {
      section += `\nProps:\n`;
      for (const [key, value] of Object.entries(component.props)) {
        section += `- ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    section += `\n`;
  }

  return section.trim();
}

/**
 * Build behavior section of prompt
 *
 * @param behavior - Behavior specification
 * @returns Formatted behavior section
 */
function buildBehaviorSection(behavior: BehaviorSpec): string {
  let section = `## Behavior\n\n`;

  // Interactions
  if (behavior.interactions.length > 0) {
    section += `### Interactions\n\n`;
    for (const interaction of behavior.interactions) {
      section += `- On ${interaction.trigger} of ${interaction.target}:\n`;
      section += `  - Action: ${interaction.action}\n`;

      if (interaction.visualFeedback) {
        section += `  - Visual feedback: ${interaction.visualFeedback}\n`;
      }

      if (interaction.destination) {
        section += `  - Navigate to: ${interaction.destination}\n`;
      }

      section += `\n`;
    }
  }

  // States
  if (behavior.states.length > 0) {
    section += `### States\n\n`;
    section += `The component should support the following states:\n`;
    for (const state of behavior.states) {
      section += `- ${state}\n`;
    }
  }

  return section.trim();
}

/**
 * Build design tokens section of prompt
 *
 * @param tokens - Design tokens
 * @returns Formatted design tokens section
 */
function buildDesignTokensSection(tokens: DesignTokens): string {
  let section = `## Design Tokens\n\n`;

  // Colors
  if (tokens.colors) {
    section += `### Colors\n\n`;
    for (const [name, value] of Object.entries(tokens.colors)) {
      section += `- ${name}: ${value}\n`;
    }
    section += `\n`;
  }

  // Spacing
  if (tokens.spacing) {
    section += `### Spacing\n\n`;
    for (const [name, value] of Object.entries(tokens.spacing)) {
      section += `- ${name}: ${value}\n`;
    }
    section += `\n`;
  }

  // Typography
  if (tokens.typography) {
    section += `### Typography\n\n`;
    for (const [name, value] of Object.entries(tokens.typography)) {
      section += `- ${name}: ${value}\n`;
    }
  }

  return section.trim();
}
