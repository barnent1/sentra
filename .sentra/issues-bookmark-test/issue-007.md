---
title: "[BM-007] Configure dark theme with TailwindCSS"
labels: ["ai-feature", "bookmark-test", "p1", "foundation"]
---

## Description
Configure TailwindCSS with dark theme colors, typography, and component styles matching the design system.

## Acceptance Criteria
- [ ] Tailwind dark theme configured
- [ ] Color palette matches ui-screens.md specification
- [ ] Typography configured (Inter font family)
- [ ] Global styles applied
- [ ] Sample component uses theme colors
- [ ] Dark theme verified in browser

## Dependencies
- BM-001 (requires Tailwind setup)

## Blocks
All UI components (BM-026 through BM-040)

## Files to Create/Modify
- `tailwind.config.ts` - Theme configuration
- `src/app/globals.css` - Global dark theme styles
- `src/app/layout.tsx` - Font configuration

## Technical Context
**Color Palette (from ui-screens.md):**
- Background: `#0a0a0a` (true black)
- Surface: `#1a1a1a` (dark cards)
- Primary: `#8b5cf6` (violet-500)
- Primary Hover: `#7c3aed` (violet-600)
- Text Primary: `#ffffff`
- Text Secondary: `#a1a1aa` (zinc-400)
- Border: `#27272a` (zinc-800)
- Error: `#ef4444` (red-500)
- Success: `#10b981` (green-500)

**Tailwind Config:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#1a1a1a',
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed'
        },
        text: {
          primary: '#ffffff',
          secondary: '#a1a1aa'
        },
        border: '#27272a',
        error: '#ef4444',
        success: '#10b981'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      }
    }
  },
  plugins: [],
}

export default config
```

**Global Styles:**
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-text-primary antialiased;
  }
}
```

## E2E Test Requirements
Not applicable for theme configuration.

## Estimated Complexity
**Small** (2-3 hours)
