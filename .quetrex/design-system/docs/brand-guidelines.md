# Quetrex Brand Guidelines

**Version:** 1.0.0
**Last Updated:** 2025-11-28
**Created By:** Glen Barnhardt with Maya (Design Specialist)

---

## Brand Essence

### What is Quetrex?

Quetrex is an AI-Powered SaaS Factory that enables anyone—developers, non-technical founders, and agencies—to build stellar applications through conversational AI assistance.

### Brand Personality

Quetrex embodies five core traits:

| Trait | Expression |
|-------|------------|
| **Calm** | Clean interfaces, ample whitespace, no visual noise |
| **Focused** | Data-dense but organized, prioritizes what matters |
| **Futuristic** | Modern aesthetics, subtle innovation cues |
| **Professional** | Enterprise-ready, trustworthy, reliable |
| **Trustworthy** | Consistent, predictable, secure |

### Voice & Tone

- **Professional yet approachable** — Expert without being condescending
- **Clear and concise** — No jargon unless necessary, then explain it
- **Confident but not arrogant** — We're good at what we do, but humble
- **Helpful and guiding** — Like a knowledgeable colleague, not a manual

**Examples:**

| ❌ Don't | ✅ Do |
|----------|-------|
| "Error occurred" | "We couldn't save your changes. Check your connection and try again." |
| "Invalid input" | "Project names can only contain letters, numbers, and hyphens." |
| "Processing..." | "Building your project... This usually takes about 30 seconds." |

---

## Visual Identity

### Primary Color: Indigo

**Value:** `#6366f1` (Indigo 500)

**Why Indigo?**
- Balances futuristic creativity (violet) with professional trust (blue)
- More universally appealing than pure purple
- Distinctive without being "AI startup cliché"
- Works beautifully in both dark and light modes

**Usage:**
- Primary buttons and CTAs
- Links and interactive elements
- Focus states and selections
- Key data highlights

**Indigo Scale:**
```
50:  #eef2ff  - Subtle backgrounds (light mode)
100: #e0e7ff  - Hover backgrounds (light mode)
400: #818cf8  - Hover state (dark mode)
500: #6366f1  - Primary accent ⭐
600: #4f46e5  - Pressed state
900: #312e81  - Dark accents
```

### Semantic Colors

| Color | Value | Usage |
|-------|-------|-------|
| Success | `#22c55e` | Completed actions, passing tests, positive states |
| Warning | `#f59e0b` | Caution states, pending items, attention needed |
| Error | `#ef4444` | Failed actions, validation errors, destructive actions |
| Info | `#3b82f6` | Informational messages, tips, neutral highlights |

### Background Colors

**Dark Theme (Default):**
- Base: `#0a0a0a` — True dark, not gray
- Surface: `#18181b` — Cards, panels
- Elevated: `#27272a` — Modals, popovers

**Light Theme:**
- Base: `#fafafa` — Soft white
- Surface: `#ffffff` — Pure white cards
- Elevated: `#ffffff` — White with shadow

### Typography

**Heading Font: Plus Jakarta Sans**
- Used for: Page titles, section headers, card titles
- Weights: 600 (semibold), 700 (bold), 800 (extrabold)
- Character: Modern, geometric, distinctive

**Body Font: Inter**
- Used for: Paragraphs, labels, descriptions, UI text
- Weights: 400 (normal), 500 (medium)
- Character: Highly readable, professional

**Monospace Font: JetBrains Mono**
- Used for: Code blocks, technical values, terminal output
- Weights: 400 (normal), 500 (medium)
- Character: Developer-friendly, ligature support

### Border Radius

Quetrex uses a **rounded** aesthetic (like Linear):

| Element | Radius |
|---------|--------|
| Buttons | `rounded-lg` (8px) |
| Cards | `rounded-xl` (12px) |
| Inputs | `rounded-lg` (8px) |
| Badges | `rounded-full` (pill) |
| Modals | `rounded-xl` (12px) |
| Avatars | `rounded-full` |

### Shadows & Elevation

Dark mode uses subtle elevation through border lightness, not heavy shadows:

```css
/* Card on dark background */
.card {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Elevated on hover */
.card:hover {
  border-color: rgba(99, 102, 241, 0.3); /* Indigo tint */
}
```

Light mode uses traditional shadows:
```css
.card {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

---

## Component Guidelines

### Buttons

**Primary (Indigo):**
```jsx
<Button className="bg-indigo-500 hover:bg-indigo-400 text-white">
  Create Project
</Button>
```

**Secondary (Ghost):**
```jsx
<Button className="border border-white/10 hover:bg-white/5 text-zinc-300">
  Cancel
</Button>
```

**Destructive:**
```jsx
<Button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
  Delete
</Button>
```

### Cards

```jsx
<Card className="bg-neutral-900 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-colors">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-zinc-400">
    Content here
  </CardContent>
</Card>
```

### Inputs

```jsx
<Input
  className="bg-neutral-900 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/50"
  placeholder="Enter value..."
/>
```

### Badges

```jsx
// Status badges
<Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Active</Badge>
<Badge className="bg-green-500/10 text-green-400 border border-green-500/20">Success</Badge>
<Badge className="bg-red-500/10 text-red-400 border border-red-500/20">Error</Badge>
```

---

## Motion & Animation

### Principles

1. **Purposeful** — Every animation communicates something
2. **Subtle** — Enhance, don't distract
3. **Consistent** — Same timing across similar interactions

### Timing

| Type | Duration | Use Case |
|------|----------|----------|
| Fast | 150ms | Hovers, toggles, micro-interactions |
| Normal | 200ms | Most transitions |
| Slow | 300ms | Page transitions, modals |

### Easing

Default: `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out)

```css
.element {
  transition: all 200ms cubic-bezier(0.33, 1, 0.68, 1);
}
```

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

### Focus States

All interactive elements must have visible focus indicators:
```css
.button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
```

### Motion

Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Design Inspirations

- **Linear** (linear.app) — Dark mode, minimal UI, subtle animations
- **TailwindCSS** (tailwindcss.com) — Developer-focused, clean typography

---

## File Locations

Design tokens: `.quetrex/design-system/tokens/`
- `core/` — Primitive values (colors, typography, spacing)
- `semantic/` — Contextual usage (background, text, accent)
- `themes/` — Theme overrides (dark, light)

---

*Created with Quetrex AI-Powered SaaS Factory*
