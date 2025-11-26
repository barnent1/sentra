/**
 * Template Selector Service
 *
 * Heuristic-based algorithm to select the best template for an E2E test spec
 * Part of Phase 3.2: E2E Test Generation - Week 4, Task 3
 *
 * Scoring Algorithm (from ADR-004):
 * - Score ≥ 0.7 → Use template
 * - Score < 0.7 → Use LLM generation
 *
 * @module services/template-selector
 */

import type { E2ETest, TemplateName } from '../schemas/e2e-spec.schema';

/**
 * Template selection result
 */
export interface TemplateMatch {
  /** Template name that matched */
  template: TemplateName;
  /** Confidence score (0-1) */
  score: number;
  /** Whether score exceeds threshold */
  shouldUseTemplate: boolean;
  /** Matching keywords found */
  matchedKeywords: string[];
}

/**
 * Keyword with weight for scoring
 */
interface KeywordWeight {
  keyword: string;
  weight: number;
}

/**
 * Template pattern definition with keywords
 */
interface TemplatePattern {
  name: TemplateName;
  keywords: KeywordWeight[];
  /** Minimum score threshold (default: 0.7) */
  threshold?: number;
}

/**
 * Template patterns for matching (from ADR-004 and template metadata)
 */
const TEMPLATE_PATTERNS: TemplatePattern[] = [
  {
    name: 'crud-operations',
    keywords: [
      { keyword: 'click', weight: 1.0 },
      { keyword: 'verify', weight: 0.8 },
      { keyword: 'button', weight: 0.7 },
      { keyword: 'toggle', weight: 0.6 },
      { keyword: 'count', weight: 0.9 },
      { keyword: 'shows', weight: 0.5 },
      { keyword: 'display', weight: 0.7 },
      { keyword: 'visible', weight: 0.6 },
      { keyword: 'open', weight: 0.3 },
    ],
  },
  {
    name: 'form-validation',
    keywords: [
      { keyword: 'fill', weight: 1.0 },
      { keyword: 'field', weight: 1.0 },
      { keyword: 'disabled', weight: 0.9 },
      { keyword: 'enabled', weight: 0.9 },
      { keyword: 'validation', weight: 0.8 },
      { keyword: 'error', weight: 0.8 },
      { keyword: 'empty', weight: 0.7 },
      { keyword: 'invalid', weight: 0.7 },
      { keyword: 'valid', weight: 0.6 },
      { keyword: 'input', weight: 0.5 },
    ],
  },
  {
    name: 'modal-workflow',
    keywords: [
      { keyword: 'modal', weight: 2.0 },
      { keyword: 'appears', weight: 0.6 },
      { keyword: 'closes', weight: 0.9 },
      { keyword: 'dialog', weight: 1.5 },
      { keyword: 'backdrop', weight: 0.8 },
      { keyword: 'escape', weight: 0.7 },
      { keyword: 'blur', weight: 0.4 },
      { keyword: 'open', weight: 0.3 },
    ],
  },
  {
    name: 'navigation',
    keywords: [
      { keyword: 'navigate', weight: 2.0 },
      { keyword: 'route', weight: 1.5 },
      { keyword: 'page', weight: 0.6 },
      { keyword: 'goto', weight: 1.0 },
      { keyword: 'url', weight: 1.5 },
      { keyword: 'redirect', weight: 1.0 },
      { keyword: 'keyboard', weight: 0.8 },
      { keyword: 'tab', weight: 0.5 },
    ],
  },
  {
    name: 'loading-states',
    keywords: [
      { keyword: 'loading', weight: 2.0 },
      { keyword: 'skeleton', weight: 1.5 },
      { keyword: 'spinner', weight: 1.5 },
      { keyword: 'wait', weight: 0.7 },
      { keyword: 'appears', weight: 0.3 },
      { keyword: 'disappears', weight: 0.6 },
      { keyword: 'fetching', weight: 0.8 },
    ],
  },
  {
    name: 'visual-regression',
    keywords: [
      { keyword: 'screenshot', weight: 2.0 },
      { keyword: 'visual', weight: 1.8 },
      { keyword: 'baseline', weight: 1.5 },
      { keyword: 'match', weight: 0.7 },
      { keyword: 'layout', weight: 0.8 },
      { keyword: 'hover', weight: 0.6 },
      { keyword: 'state', weight: 0.3 },
      { keyword: 'color', weight: 0.4 },
    ],
  },
];

/**
 * Default score threshold for template selection
 */
const DEFAULT_THRESHOLD = 0.7;

/**
 * TemplateSelector
 *
 * Selects the best template for an E2E test based on keyword matching
 *
 * Algorithm:
 * 1. Extract all text from test (name + description + steps + assertions)
 * 2. For each template pattern:
 *    a. Find matching keywords in text
 *    b. Calculate weighted score
 * 3. Return template with highest score
 * 4. If score ≥ 0.7, recommend template; otherwise recommend LLM
 *
 * @example
 * const selector = new TemplateSelector();
 * const match = selector.selectTemplate(testSpec);
 * if (match.shouldUseTemplate) {
 *   // Use template: match.template
 * } else {
 *   // Use LLM generation
 * }
 */
export class TemplateSelector {
  private readonly patterns: TemplatePattern[];
  private readonly defaultThreshold: number;

  constructor(
    patterns: TemplatePattern[] = TEMPLATE_PATTERNS,
    threshold: number = DEFAULT_THRESHOLD
  ) {
    this.patterns = patterns;
    this.defaultThreshold = threshold;
  }

  /**
   * Select best template for test
   *
   * @param test - E2E test specification
   * @returns Template match with score and recommendation
   *
   * @example
   * const match = selector.selectTemplate({
   *   name: "Toggle mute button",
   *   description: "User clicks mute button",
   *   steps: ["Click mute button"],
   *   assertions: ["Button color changes"]
   * });
   * // match.template = 'crud-operations'
   * // match.score = 0.85
   * // match.shouldUseTemplate = true
   */
  selectTemplate(test: E2ETest): TemplateMatch {
    // If test has explicit template_hint, use it with score 1.0
    if (test.template_hint && test.template_hint !== 'llm') {
      return {
        template: test.template_hint,
        score: 1.0,
        shouldUseTemplate: true,
        matchedKeywords: ['[explicit hint]'],
      };
    }

    // If template_hint is 'llm', force LLM generation
    if (test.template_hint === 'llm') {
      return {
        template: 'crud-operations', // Fallback
        score: 0.0,
        shouldUseTemplate: false,
        matchedKeywords: ['[forced LLM]'],
      };
    }

    // Extract text from test
    const testText = this.extractTestText(test);

    // Score each template pattern
    const scores = this.patterns.map((pattern) => {
      const result = this.scorePattern(testText, pattern);
      return {
        template: pattern.name,
        score: result.score,
        matchedKeywords: result.matchedKeywords,
        threshold: pattern.threshold ?? this.defaultThreshold,
      };
    });

    // Find best match
    const bestMatch = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return {
      template: bestMatch.template,
      score: bestMatch.score,
      shouldUseTemplate: bestMatch.score >= bestMatch.threshold,
      matchedKeywords: bestMatch.matchedKeywords,
    };
  }

  /**
   * Score all templates for test (for debugging/analysis)
   *
   * @param test - E2E test specification
   * @returns Array of all template matches sorted by score (descending)
   *
   * @example
   * const scores = selector.scoreAll(test);
   * console.log('Top 3 matches:', scores.slice(0, 3));
   */
  scoreAll(test: E2ETest): TemplateMatch[] {
    const testText = this.extractTestText(test);

    const scores = this.patterns.map((pattern) => {
      const result = this.scorePattern(testText, pattern);
      const threshold = pattern.threshold ?? this.defaultThreshold;

      return {
        template: pattern.name,
        score: result.score,
        shouldUseTemplate: result.score >= threshold,
        matchedKeywords: result.matchedKeywords,
      };
    });

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Extract all text from test for keyword matching
   */
  private extractTestText(test: E2ETest): string {
    const parts = [
      test.name,
      test.description,
      ...test.steps,
      ...test.assertions,
    ];

    return parts.join(' ').toLowerCase();
  }

  /**
   * Score a template pattern against test text
   */
  private scorePattern(
    testText: string,
    pattern: TemplatePattern
  ): { score: number; matchedKeywords: string[] } {
    const matchedKeywords: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const { keyword, weight } of pattern.keywords) {
      maxPossibleScore += weight;

      // Check if keyword appears in test text
      if (testText.includes(keyword.toLowerCase())) {
        totalScore += weight;
        matchedKeywords.push(keyword);
      }
    }

    // Normalize score to 0-1 range
    const normalizedScore =
      maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    return {
      score: normalizedScore,
      matchedKeywords,
    };
  }

  /**
   * Get list of all available templates
   *
   * @returns Array of template names
   */
  getAvailableTemplates(): TemplateName[] {
    return this.patterns.map((p) => p.name);
  }

  /**
   * Get keywords for a specific template
   *
   * @param templateName - Template to get keywords for
   * @returns Array of keywords with weights, or undefined if template not found
   */
  getTemplateKeywords(
    templateName: TemplateName
  ): KeywordWeight[] | undefined {
    const pattern = this.patterns.find((p) => p.name === templateName);
    return pattern?.keywords;
  }

  /**
   * Analyze test and explain why a template was selected
   *
   * @param test - E2E test specification
   * @returns Human-readable explanation
   */
  explain(test: E2ETest): string {
    const match = this.selectTemplate(test);

    if (test.template_hint && test.template_hint !== 'llm') {
      return `Template "${match.template}" explicitly specified in test.template_hint`;
    }

    if (test.template_hint === 'llm') {
      return 'LLM generation forced by template_hint: "llm"';
    }

    const decision = match.shouldUseTemplate
      ? `TEMPLATE: ${match.template}`
      : 'LLM generation';

    const explanation = [
      `Decision: ${decision}`,
      `Score: ${(match.score * 100).toFixed(1)}%`,
      `Matched keywords: ${match.matchedKeywords.join(', ')}`,
      `Threshold: ${(this.defaultThreshold * 100).toFixed(0)}%`,
    ];

    return explanation.join('\n');
  }
}
