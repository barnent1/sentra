/**
 * Unit Tests: Spec to Prompt Translator Service
 *
 * Tests the conversion of architect specifications to v0-friendly prompts
 * Part of Design Generation Feature (Phase 3.3)
 *
 * @module tests/unit/services/spec-to-prompt
 */

import { describe, it, expect } from 'vitest';
import {
  buildV0Prompt,
  extractDesignTokens,
  validateSpec,
  ValidationError,
  type ArchitectSpec,
  type DesignTokens,
  type LayoutSpec,
  type ComponentSpec,
  type BehaviorSpec,
} from '@/services/spec-to-prompt';

describe('SpecToPromptService', () => {
  describe('validateSpec', () => {
    it('should pass validation for complete spec', () => {
      // ARRANGE: Complete valid spec
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Mission control for project management',
        route: '/dashboard',
        layout: {
          type: 'grid',
          columns: 3,
          spacing: 'lg',
        },
        components: [
          {
            name: 'ProjectCard',
            type: 'card',
            props: {
              title: 'Project Name',
              status: 'active',
            },
          },
        ],
        behavior: {
          interactions: [
            {
              trigger: 'click',
              target: 'mute-button',
              action: 'toggle-mute',
            },
          ],
          states: ['loading', 'populated', 'empty'],
        },
        design_tokens: {
          colors: {
            primary: '#8b5cf6',
            background: '#0a0a0a',
          },
          spacing: {
            base: '4px',
            lg: '24px',
          },
          typography: {
            fontFamily: 'Inter',
            headingWeight: 600,
          },
        },
      };

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should pass
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation for missing required fields', () => {
      // ARRANGE: Incomplete spec (missing route, components)
      const spec = {
        screen: 'Dashboard',
        description: 'Mission control',
        layout: {
          type: 'grid',
        },
        behavior: {
          interactions: [],
          states: [],
        },
      } as unknown as ArchitectSpec;

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should fail with specific errors
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: route');
      expect(result.errors).toContain('Missing required field: components');
    });

    it('should fail validation for empty screen name', () => {
      // ARRANGE: Spec with empty screen name
      const spec = {
        screen: '',
        description: 'Test',
        route: '/test',
        layout: { type: 'flex' },
        components: [],
        behavior: { interactions: [], states: [] },
      } as ArchitectSpec;

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should fail
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Screen name cannot be empty');
    });

    it('should fail validation for invalid route format', () => {
      // ARRANGE: Spec with invalid route (no leading slash)
      const spec = {
        screen: 'Dashboard',
        description: 'Test',
        route: 'dashboard',
        layout: { type: 'flex' },
        components: [],
        behavior: { interactions: [], states: [] },
      } as ArchitectSpec;

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should fail
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Route must start with /');
    });

    it('should fail validation for empty components array', () => {
      // ARRANGE: Spec with no components
      const spec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'grid' },
        components: [],
        behavior: { interactions: [], states: [] },
      } as ArchitectSpec;

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should fail
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Components array cannot be empty');
    });

    it('should pass validation when design_tokens is optional', () => {
      // ARRANGE: Spec without design_tokens
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Mission control',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: ['loading'] },
      };

      // ACT: Validate spec
      const result = validateSpec(spec);

      // ASSERT: Should pass (design_tokens is optional)
      expect(result.valid).toBe(true);
    });
  });

  describe('extractDesignTokens', () => {
    it('should extract all design tokens when present', () => {
      // ARRANGE: Spec with complete design tokens
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'grid' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
        design_tokens: {
          colors: {
            primary: '#8b5cf6',
            secondary: '#7c3aed',
            background: '#0a0a0a',
            surface: '#1a1a1a',
          },
          spacing: {
            base: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
          },
          typography: {
            fontFamily: 'Inter',
            headingWeight: 600,
            bodyWeight: 400,
          },
        },
      };

      // ACT: Extract design tokens
      const tokens = extractDesignTokens(spec);

      // ASSERT: Should return all tokens
      expect(tokens).toEqual({
        colors: {
          primary: '#8b5cf6',
          secondary: '#7c3aed',
          background: '#0a0a0a',
          surface: '#1a1a1a',
        },
        spacing: {
          base: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
        },
        typography: {
          fontFamily: 'Inter',
          headingWeight: 600,
          bodyWeight: 400,
        },
      });
    });

    it('should return empty object when design_tokens is missing', () => {
      // ARRANGE: Spec without design_tokens
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Extract design tokens
      const tokens = extractDesignTokens(spec);

      // ASSERT: Should return empty object
      expect(tokens).toEqual({});
    });

    it('should handle partial design tokens gracefully', () => {
      // ARRANGE: Spec with only colors
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
        design_tokens: {
          colors: {
            primary: '#8b5cf6',
          },
        },
      };

      // ACT: Extract design tokens
      const tokens = extractDesignTokens(spec);

      // ASSERT: Should return only colors
      expect(tokens).toEqual({
        colors: {
          primary: '#8b5cf6',
        },
      });
      expect(tokens.spacing).toBeUndefined();
      expect(tokens.typography).toBeUndefined();
    });
  });

  describe('buildV0Prompt', () => {
    it('should throw ValidationError for invalid spec', () => {
      // ARRANGE: Invalid spec (missing required fields)
      const spec = {
        screen: '',
        description: 'Test',
      } as unknown as ArchitectSpec;

      // ACT & ASSERT: Should throw ValidationError
      expect(() => buildV0Prompt(spec)).toThrow(ValidationError);
      expect(() => buildV0Prompt(spec)).toThrow(
        'Spec validation failed: Screen name cannot be empty'
      );
    });

    it('should generate prompt with screen info and description', () => {
      // ARRANGE: Minimal valid spec
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Mission control for project management',
        route: '/dashboard',
        layout: { type: 'grid' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include screen info
      expect(prompt).toContain('Dashboard');
      expect(prompt).toContain('Mission control for project management');
      expect(prompt).toContain('/dashboard');
    });

    it('should generate prompt with layout specification', () => {
      // ARRANGE: Spec with detailed layout
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: {
          type: 'grid',
          columns: 3,
          gap: '24px',
          spacing: 'lg',
        },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include layout details
      expect(prompt).toContain('grid');
      expect(prompt).toContain('3 columns');
      expect(prompt).toContain('24px');
    });

    it('should generate prompt with component specifications', () => {
      // ARRANGE: Spec with multiple components
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [
          {
            name: 'ProjectCard',
            type: 'card',
            props: {
              title: 'Project Name',
              status: 'active',
              muteButton: true,
            },
          },
          {
            name: 'SearchBar',
            type: 'input',
            props: {
              placeholder: 'Search projects...',
            },
          },
        ],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include all components
      expect(prompt).toContain('ProjectCard');
      expect(prompt).toContain('SearchBar');
      expect(prompt).toContain('Project Name');
      expect(prompt).toContain('Search projects...');
    });

    it('should generate prompt with behavior specifications', () => {
      // ARRANGE: Spec with interactions and states
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: {
          interactions: [
            {
              trigger: 'click',
              target: 'mute-button',
              action: 'toggle-mute',
              visualFeedback: 'button changes to violet',
            },
            {
              trigger: 'hover',
              target: 'card',
              action: 'show-actions',
            },
          ],
          states: ['loading', 'populated', 'empty'],
        },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include behavior details
      expect(prompt).toContain('click');
      expect(prompt).toContain('mute-button');
      expect(prompt).toContain('toggle-mute');
      expect(prompt).toContain('violet');
      expect(prompt).toContain('loading');
      expect(prompt).toContain('populated');
      expect(prompt).toContain('empty');
    });

    it('should generate prompt with design tokens', () => {
      // ARRANGE: Spec with design tokens
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
        design_tokens: {
          colors: {
            primary: '#8b5cf6',
            background: '#0a0a0a',
          },
          spacing: {
            base: '4px',
            lg: '24px',
          },
          typography: {
            fontFamily: 'Inter',
            headingWeight: 600,
          },
        },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include design tokens
      expect(prompt).toContain('#8b5cf6');
      expect(prompt).toContain('#0a0a0a');
      expect(prompt).toContain('Inter');
      expect(prompt).toContain('24px');
    });

    it('should generate prompt with technology stack requirements', () => {
      // ARRANGE: Any valid spec
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should specify technology requirements
      expect(prompt).toContain('Next.js 15');
      expect(prompt).toContain('React 19');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('Tailwind CSS');
      expect(prompt).toContain('shadcn/ui');
    });

    it('should generate prompt with accessibility requirements', () => {
      // ARRANGE: Any valid spec
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Test',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should include accessibility requirements
      expect(prompt).toContain('Accessibility');
      expect(prompt).toContain('ARIA');
      expect(prompt).toContain('Keyboard navigation');
    });

    it('should generate comprehensive prompt for complex spec', () => {
      // ARRANGE: Complete spec from ui-screens.md example
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Mission control for managing multiple AI-powered projects',
        route: '/dashboard',
        layout: {
          type: 'grid',
          columns: 3,
          gap: '24px',
          padding: '24px',
          responsive: {
            mobile: { columns: 1 },
            tablet: { columns: 2 },
          },
        },
        components: [
          {
            name: 'Header',
            type: 'container',
            props: {
              logo: true,
              searchBar: true,
              addButton: 'Add Project',
            },
          },
          {
            name: 'ProjectCard',
            type: 'card',
            props: {
              title: 'Project Name',
              status: 'active',
              muteButton: true,
              deleteButton: true,
              prCount: 3,
            },
          },
          {
            name: 'EmptyState',
            type: 'container',
            props: {
              icon: 'FolderIcon',
              message: 'No projects yet',
              action: 'Create your first project',
            },
          },
        ],
        behavior: {
          interactions: [
            {
              trigger: 'click',
              target: 'mute-button',
              action: 'toggle-mute',
              visualFeedback: 'button background changes to violet-600',
            },
            {
              trigger: 'click',
              target: 'project-card',
              action: 'navigate',
              destination: '/project/:id',
            },
          ],
          states: ['loading', 'populated', 'empty'],
        },
        design_tokens: {
          colors: {
            primary: '#8b5cf6',
            primaryHover: '#7c3aed',
            background: '#0a0a0a',
            surface: '#1a1a1a',
            textPrimary: '#ffffff',
            textSecondary: '#a1a1aa',
          },
          spacing: {
            base: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px',
          },
          typography: {
            fontFamily: 'Inter',
            headingWeight: 600,
            bodyWeight: 400,
          },
        },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should be comprehensive (min 500 characters)
      expect(prompt.length).toBeGreaterThan(500);

      // Should include all major sections
      expect(prompt).toContain('Dashboard');
      expect(prompt).toContain('Mission control');
      expect(prompt).toContain('grid');
      expect(prompt).toContain('ProjectCard');
      expect(prompt).toContain('toggle-mute');
      expect(prompt).toContain('#8b5cf6');
      expect(prompt).toContain('Next.js');
      expect(prompt).toContain('Accessibility');
    });

    it('should generate valid prompt without design tokens', () => {
      // ARRANGE: Spec without design tokens
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Simple dashboard',
        route: '/dashboard',
        layout: { type: 'flex' },
        components: [{ name: 'Card', type: 'card', props: {} }],
        behavior: { interactions: [], states: ['loading'] },
      };

      // ACT: Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Should still generate valid prompt
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Dashboard');
      expect(prompt).toContain('Next.js');
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct message', () => {
      // ARRANGE & ACT: Create ValidationError
      const error = new ValidationError('Test error message');

      // ASSERT: Should have correct properties
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error message');
    });

    it('should be catchable as ValidationError', () => {
      // ARRANGE: Function that throws ValidationError
      const throwError = (): void => {
        throw new ValidationError('Spec validation failed');
      };

      // ACT & ASSERT: Should catch specific error type
      try {
        throwError();
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.message).toBe('Spec validation failed');
        }
      }
    });
  });
});
