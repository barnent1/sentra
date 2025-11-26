/**
 * Unit Tests for GitHub Integration Library
 *
 * Tests spec parsing, label extraction, and issue creation logic
 */

import { describe, it, expect } from 'vitest'
import {
  parseSpecMarkdown,
  extractLabelsFromSpec,
  isValidGitHubToken,
} from '@/lib/github'

describe('GitHub Integration Library', () => {
  describe('parseSpecMarkdown', () => {
    it('should extract title from H1 heading', () => {
      const spec = '# Dark Mode Feature\n\nThis is a spec about dark mode.'
      const { title } = parseSpecMarkdown(spec)
      expect(title).toBe('Dark Mode Feature')
    })

    it('should handle spec without H1 heading', () => {
      const spec = 'This is a spec without heading\n\nSome content here.'
      const { title } = parseSpecMarkdown(spec)
      expect(title).toBe('Untitled Specification')
    })

    it('should extract description after title', () => {
      const spec = '# Title\n\nThis is the description.\n\nMore details here.'
      const { description } = parseSpecMarkdown(spec)
      expect(description).toContain('This is the description')
      expect(description).toContain('More details here')
      expect(description).not.toContain('# Title')
    })

    it('should handle empty description', () => {
      const spec = '# Title\n\n'
      const { description } = parseSpecMarkdown(spec)
      expect(description).toBe('')
    })

    it('should handle spec with multiple headings', () => {
      const spec = `# Main Title
## Section 1
Content here
## Section 2
More content`
      const { title, description } = parseSpecMarkdown(spec)
      expect(title).toBe('Main Title')
      expect(description).toContain('## Section 1')
      expect(description).toContain('## Section 2')
    })
  })

  describe('extractLabelsFromSpec', () => {
    it('should extract P1 priority label', () => {
      const spec = '# Feature\n\n[P1] This is a priority 1 feature'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('p1')
    })

    it('should extract bug label', () => {
      const spec = '# Bug Fix\n\n[bug] This fixes a critical bug'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('bug')
    })

    it('should extract feature label', () => {
      const spec = '# New Feature\n\n[feature] Add new capability'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('feature')
    })

    it('should always include ai-feature label', () => {
      const spec = '# Some spec'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('ai-feature')
    })

    it('should extract multiple labels', () => {
      const spec = '[P0] [feature] [enhancement] A complex spec'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('p0')
      expect(labels).toContain('feature')
      expect(labels).toContain('enhancement')
    })

    it('should ignore non-label brackets', () => {
      const spec = '[not a label] and [something] and [P1] valid'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('p1')
      expect(labels).not.toContain('not a label')
      expect(labels).not.toContain('something')
    })

    it('should remove duplicate labels', () => {
      const spec = '[P1] [P1] [bug] [bug]'
      const labels = extractLabelsFromSpec(spec)
      const p1Count = labels.filter((l) => l === 'p1').length
      const bugCount = labels.filter((l) => l === 'bug').length
      expect(p1Count).toBe(1)
      expect(bugCount).toBe(1)
    })

    it('should be case insensitive', () => {
      const spec = '[P1] [BUG] [FEATURE]'
      const labels = extractLabelsFromSpec(spec)
      expect(labels).toContain('p1')
      expect(labels).toContain('bug')
      expect(labels).toContain('feature')
    })
  })

  describe('isValidGitHubToken', () => {
    it('should accept valid token format', () => {
      const token = 'ghp_validTokenWithSufficientLength'
      expect(isValidGitHubToken(token)).toBe(true)
    })

    it('should accept github_pat format', () => {
      const token = 'github_pat_1234567890abcdef'
      expect(isValidGitHubToken(token)).toBe(true)
    })

    it('should reject empty token', () => {
      expect(isValidGitHubToken('')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(isValidGitHubToken(null as unknown as string)).toBe(false)
      expect(isValidGitHubToken(undefined as unknown as string)).toBe(false)
    })

    it('should reject short tokens', () => {
      expect(isValidGitHubToken('short')).toBe(false)
    })

    it('should accept any sufficiently long string as basic format check', () => {
      // The actual validation happens at API call time
      const token = 'a'.repeat(15)
      expect(isValidGitHubToken(token)).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle real-world spec with all features', () => {
      const realSpec = `# Add Dark Mode Theme

[P1] [feature] [enhancement]

## Description
This feature adds comprehensive dark mode support to the dashboard.

## Requirements
- [ ] Create dark theme colors
- [ ] Update all components
- [ ] Add theme toggle

## Implementation Details
\`\`\`typescript
interface Theme {
  name: string;
  colors: Record<string, string>;
}
\`\`\`

## Testing
- [ ] Visual regression tests
- [ ] Accessibility tests`

      const { title, description } = parseSpecMarkdown(realSpec)
      const labels = extractLabelsFromSpec(realSpec)

      expect(title).toBe('Add Dark Mode Theme')
      expect(description).toContain('## Description')
      expect(description).toContain('## Requirements')
      expect(labels).toContain('p1')
      expect(labels).toContain('feature')
      expect(labels).toContain('enhancement')
      expect(labels).toContain('ai-feature')
    })

    it('should handle spec with links and special characters', () => {
      const spec = `# Complex Spec [P2]

Reference: [GitHub Issue](https://github.com/example/repo/issues/123)

## Details
- Point 1 with [bracket content]
- Point 2 with special chars: @#$%`

      const { title } = parseSpecMarkdown(spec)
      const labels = extractLabelsFromSpec(spec)

      expect(title).toBe('Complex Spec [P2]')
      expect(labels).toContain('p2')
    })
  })
})
