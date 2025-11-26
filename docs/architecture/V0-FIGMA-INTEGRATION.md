# V0/Figma Integration Architecture

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Author:** Glen Barnhardt with Claude Code
**Status:** Research & Design
**Phase:** Phase 4+ (Future Enhancement)
**Priority:** P1 (High Impact, After MVP)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Integration Approaches](#integration-approaches)
4. [V0 by Vercel Integration](#v0-by-vercel-integration)
5. [Figma Integration](#figma-integration)
6. [Vision Model Integration](#vision-model-integration)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Implementation Timeline](#implementation-timeline)
9. [Cost Analysis](#cost-analysis)
10. [Alternative Approaches](#alternative-approaches)

---

## Executive Summary

### Goal

Enable Sentra's voice architect to automatically extract visual UI information from design tools (V0, Figma) and combine with behavioral specifications to generate complete, production-ready implementations.

### Current State (Phase 3)

**What voice architect captures:**
- Screen behaviors (user interactions, state changes)
- E2E test specifications
- Business requirements

**What's missing:**
- Visual layout (component hierarchy, positioning)
- Design tokens (colors, spacing, typography)
- Responsive breakpoints
- Component relationships

**Current workaround:**
- User manually describes visual structure
- Architect relies on text descriptions
- Implementation agents infer layout from descriptions
- Results in inconsistency with original designs

### Proposed State (With Integration)

**V0 integration:**
1. User shares V0 URL: `https://v0.dev/chat/abc123`
2. Architect extracts React component code automatically
3. Architect parses component tree, props, styling
4. User describes behavior in voice
5. Architect combines visual + behavioral spec
6. E2E tests generated with correct selectors

**Figma integration:**
1. User shares Figma URL: `https://figma.com/file/abc123`
2. Architect uses Figma API to export design
3. Vision model (Claude Opus with vision) analyzes screenshot
4. Vision model extracts: layout, colors, spacing, components
5. User describes behavior in voice
6. Architect combines visual + behavioral spec
7. E2E tests generated with design-accurate selectors

### Impact

**Without integration:**
- 30% of architect session time spent describing UI layout
- 20% implementation time fixing layout inconsistencies
- Manual component mapping required

**With integration:**
- Zero time describing UI (extracted automatically)
- 90%+ design fidelity in implementation
- Automatic component selector generation
- E2E tests match actual design structure

---

## Problem Statement

### Current Pain Points

1. **Inefficient UI Description**
   - Voice architect sessions spend significant time on visual details
   - "The button is in the top-right, violet color, 48px height..."
   - Prone to human error and incomplete specification

2. **Implementation Drift**
   - Designs in Figma/V0 don't match implemented UI
   - No automated way to verify design fidelity
   - Engineers make ad-hoc layout decisions

3. **E2E Test Brittleness**
   - Tests use generic selectors: `button[type="submit"]`
   - Selectors break when layout changes
   - Manual mapping from design to DOM structure

4. **Lack of Design Tokens**
   - Colors, spacing, typography copied manually
   - Inconsistent application across components
   - No single source of truth

### User Story

**As Glen (using voice architect):**
> "I've designed my dashboard in V0. I want to describe the behavior (what happens when users click buttons, how data loads, etc.) without having to verbally describe every visual detail. Sentra should automatically extract the layout, components, and styling from V0, then I just tell it what each element DOES."

**Current experience (BAD):**
```
Glen: "The dashboard has a grid of project cards..."
Architect: "How many columns in the grid?"
Glen: "4 on desktop, 2 on tablet, 1 on mobile"
Architect: "What does each card contain?"
Glen: "Project name, status badge, last activity, and 3 action buttons"
Architect: "What do the action buttons look like?"
Glen: "They're icon buttons, violet on hover, arranged horizontally..."

[15 minutes describing visual layout]
```

**Desired experience (GOOD):**
```
Glen: [Shares V0 link] "Here's the design"
Architect: [Automatically extracts layout] "I see 4-column grid, project cards with name/status/actions. Now, what happens when users click the mute button?"
Glen: "The button toggles violet color, and the project stops showing notifications"
Architect: "Got it. What happens when they click the settings icon?"
Glen: "Opens a modal with project settings..."

[2 minutes on actual behavior, zero time on visual layout]
```

---

## Integration Approaches

### Approach 1: V0 Code Extraction (Recommended for MVP)

**How V0 works:**
- V0 by Vercel generates React components from text prompts
- Each generation has a unique URL: `https://v0.dev/chat/<session-id>`
- Component code is TypeScript/React with Tailwind CSS
- Code includes layout, styling, components

**Integration strategy:**

**Option A: Official V0 API (if available)**
```typescript
// Hypothetical V0 API
const v0Component = await v0.getComponent({
  url: 'https://v0.dev/chat/abc123',
  apiKey: process.env.V0_API_KEY,
});

// Returns:
{
  code: "export default function Dashboard() { ... }",
  dependencies: ["shadcn/ui", "lucide-react"],
  meta: {
    created_at: "2025-11-23T10:00:00Z",
    prompt: "Dashboard with project cards"
  }
}
```

**Option B: Screenshot + Vision Model**
If no API exists, use browser automation:
```typescript
// Use Playwright to screenshot V0 page
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://v0.dev/chat/abc123');

// Extract code from V0 interface
const code = await page.locator('.code-block').textContent();

// Screenshot for vision model
const screenshot = await page.screenshot();

// Analyze with Claude Opus (vision)
const analysis = await anthropic.messages.create({
  model: 'claude-opus-4-20250514',
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshot.toString('base64'),
        },
      },
      {
        type: 'text',
        text: 'Extract component hierarchy, layout, and styling from this V0 design.',
      },
    ],
  }],
});
```

**Pros:**
- V0 code is already React/TypeScript (matches our stack)
- Tailwind CSS styling (matches our styling approach)
- High fidelity (1:1 code extraction)
- Can directly use components or modify

**Cons:**
- V0 might not have official API (research needed)
- Requires V0 Pro subscription
- Limited to V0-supported components

**Feasibility:** HIGH (code is directly accessible)
**Timeline:** 1-2 weeks (with API), 2-3 weeks (with screenshot method)

---

### Approach 2: Figma Integration

**How Figma API works:**
- Figma has robust REST API: https://www.figma.com/developers/api
- Access designs via file keys
- Export images, components, design tokens
- Requires Figma access token (OAuth or Personal Access Token)

**Integration strategy:**

**Step 1: Extract Figma Design Data**
```typescript
// Using Figma API
import { Figma } from 'figma-api';

const figma = new Figma({
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
});

// Get file data
const fileKey = 'abc123def456'; // From URL: figma.com/file/abc123def456
const file = await figma.getFile(fileKey);

// Returns:
{
  name: "Sentra Dashboard",
  document: {
    children: [
      {
        type: "FRAME",
        name: "Dashboard",
        children: [
          { type: "TEXT", characters: "Projects", ... },
          { type: "RECTANGLE", fills: [...], ... },
          { type: "COMPONENT", name: "ProjectCard", ... }
        ]
      }
    ]
  },
  styles: {
    "color-primary": { color: { r: 0.48, g: 0.23, b: 0.93 } }, // Violet
    "spacing-4": { value: "16px" }
  }
}
```

**Step 2: Export Screenshots for Vision Model**
```typescript
// Export specific frame as PNG
const imageUrl = await figma.getImage(fileKey, {
  ids: 'node-id-123', // Frame ID
  format: 'png',
  scale: 2, // Retina resolution
});

// Download image
const response = await fetch(imageUrl.images['node-id-123']);
const imageBuffer = await response.buffer();

// Send to Claude Opus with vision
const analysis = await anthropic.messages.create({
  model: 'claude-opus-4-20250514',
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: imageBuffer.toString('base64'),
        },
      },
      {
        type: 'text',
        text: `
Analyze this Figma design and extract:
1. Component hierarchy (layout tree)
2. Positioning and spacing (Flexbox, Grid)
3. Colors and design tokens
4. Typography (font sizes, weights)
5. Interactive elements (buttons, inputs, etc.)

Return as structured JSON matching our screen spec schema.
        `,
      },
    ],
  }],
});
```

**Step 3: Combine Figma Data + Vision Analysis**
```typescript
// Parse vision model response
const visionAnalysis = JSON.parse(analysis.content[0].text);

// Merge with Figma API data
const enrichedSpec = {
  screen: file.document.name,
  description: visionAnalysis.description,
  route: '/dashboard', // User provides

  // FROM FIGMA API: Precise design tokens
  design_tokens: {
    colors: extractColors(file.styles),
    spacing: extractSpacing(file.styles),
    typography: extractTypography(file.styles),
  },

  // FROM VISION MODEL: Component hierarchy & layout
  layout: visionAnalysis.layout,
  components: visionAnalysis.components,

  // FROM USER (voice): Behavior
  behavior: {
    on_load: ['Fetch projects', 'Show skeleton loader'],
    user_actions: [
      { action: 'Click mute button', result: 'Toggle mute state' },
      // ... user describes in voice
    ],
  },

  // AUTO-GENERATED: E2E tests
  e2e_tests: generateE2ETests(visionAnalysis, userBehavior),
};
```

**Pros:**
- Works with any Figma design (most common tool)
- Rich design data (precise colors, spacing, fonts)
- Vision model understands spatial relationships
- Design tokens directly extractable

**Cons:**
- Figma API doesn't provide component code (just metadata)
- Vision model needed to understand layout (adds cost)
- Mapping Figma components to React components is non-trivial
- Requires Figma access token (privacy concern)

**Feasibility:** MEDIUM (requires vision model + translation layer)
**Timeline:** 3-4 weeks

---

## V0 by Vercel Integration

### Research Findings

**V0 capabilities:**
- Generates React + TypeScript + Tailwind components
- Uses shadcn/ui component library
- Exports code directly (copy/paste or download)
- Supports iterations (refine generation)

**Access methods:**

#### Method 1: Official API (Research needed)
**Status:** Unknown - requires outreach to Vercel team
**If available:**
```typescript
// Hypothetical
const v0 = new V0Client({ apiKey: process.env.V0_API_KEY });
const component = await v0.getComponent('chat-session-id');
```

**Action item:** Email Vercel/V0 team to inquire about API access

#### Method 2: Scraping V0 Interface
**Status:** Feasible but fragile
**Approach:**
```typescript
// Use Playwright
const page = await browser.newPage();
await page.goto('https://v0.dev/chat/abc123');

// Wait for code block to load
await page.waitForSelector('[data-testid="code-block"]');

// Extract code
const code = await page.$eval('[data-testid="code-block"]', (el) => el.textContent);
```

**Risks:**
- V0 interface changes break scraper
- Terms of Service violation?
- Rate limiting

#### Method 3: Screenshot + Vision Model
**Status:** Most robust fallback
**Approach:**
```typescript
// Screenshot V0 preview
const screenshot = await page.screenshot({
  clip: { x: 0, y: 0, width: 1200, height: 800 }, // Preview area
});

// Analyze with Claude Opus
const analysis = await anthropic.messages.create({
  model: 'claude-opus-4-20250514',
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshot.toString('base64'),
        },
      },
      {
        type: 'text',
        text: `
Analyze this V0-generated React component preview.

Extract:
1. Component hierarchy (nested structure)
2. Layout system (Flexbox, Grid, positioning)
3. Interactive elements (buttons, inputs, cards)
4. Color scheme and design tokens
5. Typography (sizes, weights, families)
6. Spacing and padding patterns

Return as JSON matching this schema:
{
  "components": [
    {"type": "Card", "children": [...], "props": {...}}
  ],
  "layout": {"type": "grid", "columns": 4, "gap": "16px"},
  "design_tokens": {"colors": {...}, "spacing": {...}, "typography": {...}}
}
        `,
      },
    ],
  }],
});
```

**Pros:**
- Works regardless of V0 API availability
- Vision model very good at understanding UI structure
- No scraping fragility

**Cons:**
- Costs: ~$0.10-0.20 per screenshot analysis (Opus with vision)
- Slightly less precise than code extraction
- Requires manual mapping to React components

---

## Figma Integration

### Figma API Overview

**Official API:** https://www.figma.com/developers/api

**Key endpoints:**

#### Get File
```bash
GET https://api.figma.com/v1/files/:file_key
```

**Returns:**
- Component tree (FRAME, TEXT, RECTANGLE, etc.)
- Styles and design tokens
- Constraints and layout rules
- Prototyping flows (interactions)

#### Get Images
```bash
GET https://api.figma.com/v1/images/:file_key
```

**Returns:**
- PNG/JPG/SVG exports of specific nodes
- Retina-ready images (scale 1x, 2x, 3x)

#### Get Styles
```bash
GET https://api.figma.com/v1/files/:file_key/styles
```

**Returns:**
- Color styles
- Text styles
- Effect styles
- Grid styles

### Integration Architecture

**Step-by-step flow:**

1. **User shares Figma link**
   ```
   User: "Here's the design: https://figma.com/file/abc123/Sentra-Dashboard"
   ```

2. **Architect extracts file key**
   ```typescript
   const fileKey = extractFigmaFileKey(url); // "abc123"
   ```

3. **Fetch Figma data via API**
   ```typescript
   const file = await figma.getFile(fileKey);
   const styles = await figma.getStyles(fileKey);
   ```

4. **Identify target frame**
   ```
   Architect: "I found 3 screens in this file: Dashboard, Settings, Profile. Which one should we specify?"
   User: "Dashboard"
   ```

5. **Export frame screenshot**
   ```typescript
   const frameId = findFrameByName(file, 'Dashboard');
   const imageUrl = await figma.getImage(fileKey, { ids: frameId });
   const screenshot = await downloadImage(imageUrl);
   ```

6. **Analyze with vision model**
   ```typescript
   const visionAnalysis = await analyzeDesignWithVision(screenshot, {
     extractComponents: true,
     extractLayout: true,
     extractDesignTokens: true,
   });
   ```

7. **Merge Figma API data + vision analysis**
   ```typescript
   const spec = {
     // FROM FIGMA API: Precise design tokens
     design_tokens: {
       colors: mapFigmaStylesToTokens(styles.colors),
       typography: mapFigmaStylesToTokens(styles.text),
       spacing: extractSpacingFromStyles(styles),
     },

     // FROM VISION MODEL: Component hierarchy
     layout: visionAnalysis.layout,
     components: visionAnalysis.components,

     // FROM USER: Behavior (voice conversation)
     behavior: {}, // Populated during voice session
   };
   ```

8. **Generate component selectors**
   ```typescript
   // Map Figma components to DOM selectors
   const selectors = {
     'ProjectCard': '[data-component="project-card"]',
     'MuteButton': 'button[aria-label="Mute project"]',
     'SettingsIcon': 'button[aria-label="Project settings"]',
   };
   ```

9. **Create E2E tests with design-accurate selectors**
   ```typescript
   // E2E test using Figma-derived selectors
   test('User toggles mute button', async ({ page }) => {
     await page.goto('/dashboard');

     // Selector derived from Figma component name
     const muteButton = page.locator('[data-component="project-card"] button[aria-label="Mute project"]');

     await muteButton.click();

     // Verify color change (from Figma design tokens)
     await expect(muteButton).toHaveCSS('background-color', 'rgb(124, 58, 237)'); // Violet
   });
   ```

### Figma API Authentication

**Options:**

#### Personal Access Token
```typescript
const figma = new Figma({
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
});
```

**Pros:** Simple, no OAuth flow
**Cons:** Requires user to generate token, security risk

#### OAuth 2.0
```typescript
// User authorizes Sentra to access their Figma files
const authUrl = figma.getOAuthUrl({
  client_id: process.env.FIGMA_CLIENT_ID,
  redirect_uri: 'https://sentra.app/auth/figma/callback',
  scope: 'file_read',
});

// After authorization, exchange code for token
const token = await figma.getAccessToken(code);
```

**Pros:** Secure, user controls access
**Cons:** More complex setup, requires Figma app registration

**Recommendation:** Start with Personal Access Token (MVP), migrate to OAuth (production)

---

## Vision Model Integration

### Claude Opus with Vision

**Model:** `claude-opus-4-20250514`
**Capabilities:**
- Analyze images (PNG, JPEG, WebP)
- Understand UI layouts and component hierarchies
- Extract text, colors, spacing
- Identify interactive elements

**Usage:**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeDesign(screenshotBuffer: Buffer) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: screenshotBuffer.toString('base64'),
          },
        },
        {
          type: 'text',
          text: `
Analyze this UI design and extract structured information.

Identify:
1. Layout type (Grid, Flexbox, Absolute positioning)
2. Component hierarchy (parent-child relationships)
3. Interactive elements (buttons, inputs, links, etc.)
4. Color palette (primary, secondary, accent colors)
5. Typography (font sizes, weights, families if visible)
6. Spacing patterns (padding, margins, gaps)

Return as JSON:
{
  "layout": {
    "type": "grid" | "flex" | "absolute",
    "columns": number,
    "rows": number,
    "gap": string
  },
  "components": [
    {
      "type": "Card" | "Button" | "Input" | etc,
      "text": string,
      "position": {"x": number, "y": number},
      "size": {"width": number, "height": number},
      "children": [...]
    }
  ],
  "design_tokens": {
    "colors": {
      "primary": string,
      "secondary": string,
      "accent": string,
      "background": string,
      "text": string
    },
    "spacing": {
      "xs": string,
      "sm": string,
      "md": string,
      "lg": string,
      "xl": string
    },
    "typography": {
      "heading": {"size": string, "weight": string},
      "body": {"size": string, "weight": string}
    }
  }
}

Be as precise as possible with measurements and colors.
          `,
        },
      ],
    }],
  });

  return JSON.parse(response.content[0].text);
}
```

**Prompt engineering tips:**

1. **Be specific about output format**
   - Request JSON with exact schema
   - Provide examples of expected values
   - Specify units (px, rem, hex colors)

2. **Guide the analysis**
   - Ask for component hierarchy (parent-child)
   - Request precise measurements where possible
   - Specify color format (hex, rgb)

3. **Handle ambiguity**
   - Ask vision model to mark uncertain extractions
   - Request confidence scores for layout inferences
   - Allow "unknown" values for unclear elements

**Cost:**
- Input: ~$15 per million tokens (~1500 images at 1200x800)
- Output: ~$75 per million tokens (~4K tokens per analysis)
- **Per analysis:** ~$0.10-0.20 (1 image + 4K token response)

**Optimization:**
- Cache common design patterns
- Use lower-cost models (Sonnet) for simpler designs
- Batch analyze multiple screens in one request

---

## Data Flow Architecture

### End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User shares design URL                                          │
│ "Here's the dashboard: https://v0.dev/chat/abc123"             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ Voice Architect detects URL type                                │
│ - V0 URL? → V0 extraction flow                                 │
│ - Figma URL? → Figma extraction flow                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ↓ (V0 FLOW)                     ↓ (FIGMA FLOW)
┌──────────────────┐            ┌──────────────────┐
│ Extract V0 Code  │            │ Figma API Call   │
│                  │            │                  │
│ - Fetch code     │            │ - Get file data  │
│ - Parse JSX      │            │ - Get styles     │
│ - Extract props  │            │ - Export frames  │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         ↓                               ↓
┌──────────────────┐            ┌──────────────────┐
│ Screenshot V0    │            │ Screenshot Figma │
│ Preview          │            │ Frame            │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Vision Model Analysis (Claude Opus)                             │
│                                                                  │
│ Input: Screenshot (PNG/JPEG)                                    │
│ Output: Structured JSON                                         │
│   - Component hierarchy                                         │
│   - Layout information                                          │
│   - Design tokens                                               │
│   - Interactive elements                                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ Merge Visual + Design Token Data                                │
│                                                                  │
│ spec = {                                                        │
│   screen: "Dashboard",                                          │
│   visual_source: "v0" | "figma",                               │
│   design_tokens: {...},    // FROM: Figma API or Vision model  │
│   layout: {...},            // FROM: Vision model               │
│   components: [...],        // FROM: Vision model + V0 code     │
│   behavior: {},             // PENDING: User voice input        │
│   e2e_tests: []            // PENDING: After behavior defined   │
│ }                                                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ Voice Conversation: Capture Behavior                            │
│                                                                  │
│ Architect: "I see the dashboard layout with project cards.      │
│             What happens when users click the mute button?"     │
│                                                                  │
│ User: "The button toggles violet color, and the project stops   │
│        sending notifications."                                  │
│                                                                  │
│ [Architect updates spec.behavior]                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ Generate E2E Tests                                              │
│                                                                  │
│ - Use design-accurate selectors from visual analysis           │
│ - Include color/spacing assertions from design tokens          │
│ - Map user actions to component hierarchy                       │
│                                                                  │
│ Example:                                                        │
│   test('User toggles mute', async ({ page }) => {              │
│     const btn = page.locator('[data-component="mute-btn"]');   │
│     await btn.click();                                          │
│     await expect(btn).toHaveCSS('color', '#7C3AED'); // Violet │
│   });                                                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ Save Complete Specification                                     │
│                                                                  │
│ Files created:                                                  │
│ - .sentra/architect-sessions/<project>/ui-screens.md           │
│ - .sentra/architect-sessions/<project>/design-tokens.json      │
│ - .sentra/architect-sessions/<project>/v0-exports/dashboard.tsx│
│ - tests/e2e/dashboard-interactions.spec.ts                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Timeline

### Phase 1: V0 Integration (Weeks 1-2)

**Goal:** Extract V0 component code and generate specs

**Tasks:**
- [ ] Research V0 API availability (email Vercel team)
- [ ] Implement V0 URL detection in voice architect
- [ ] Build V0 code extraction (API or scraping)
- [ ] Parse V0 React components (JSX parsing)
- [ ] Extract component hierarchy and props
- [ ] Integrate vision model for screenshot analysis
- [ ] Merge V0 code + vision analysis
- [ ] Generate design-accurate E2E tests
- [ ] Test with 5 sample V0 designs

**Deliverables:**
- V0 integration module
- Component parser
- E2E test generator (V0-aware)
- Documentation: V0 usage guide

### Phase 2: Figma Integration (Weeks 3-4)

**Goal:** Extract Figma designs and generate specs

**Tasks:**
- [ ] Set up Figma API client
- [ ] Implement Figma URL detection
- [ ] Build Figma file data fetcher
- [ ] Extract design tokens from Figma styles
- [ ] Export frame screenshots via Figma API
- [ ] Integrate vision model for Figma screenshots
- [ ] Map Figma components to React components
- [ ] Generate selectors from Figma component names
- [ ] Test with 5 sample Figma designs

**Deliverables:**
- Figma integration module
- Design token extractor
- E2E test generator (Figma-aware)
- Documentation: Figma usage guide

### Phase 3: Vision Model Optimization (Week 5)

**Goal:** Improve vision model accuracy and reduce costs

**Tasks:**
- [ ] Refine vision model prompts
- [ ] Add confidence scoring to vision model output
- [ ] Implement result caching (avoid re-analyzing same design)
- [ ] Experiment with Sonnet for simpler designs (cost reduction)
- [ ] Build fallback logic (retry with Opus if Sonnet fails)
- [ ] Add user feedback loop (correct vision model errors)

**Deliverables:**
- Optimized vision model prompts
- Caching system
- Multi-model strategy (Opus/Sonnet)
- Cost tracking and reporting

### Phase 4: UI Selector Generation (Week 6)

**Goal:** Generate robust, design-aware selectors

**Tasks:**
- [ ] Implement data-component attribute injection
- [ ] Map visual components to semantic selectors
- [ ] Generate ARIA label selectors
- [ ] Build selector fallback strategy (CSS, text, position)
- [ ] Validate selectors against real implementation
- [ ] Add selector stability scoring

**Deliverables:**
- Selector generation library
- Selector validation tool
- Documentation: Selector best practices

---

## Cost Analysis

### Vision Model Costs (Claude Opus)

**Per analysis:**
- Input: 1 image (1200x800 PNG, ~500KB) + prompt (~500 tokens)
- Output: ~4000 tokens (structured JSON)
- Cost: ~$0.10-0.20 per analysis

**Monthly estimate:**
- 10 projects/month
- 5 screens/project
- 50 analyses/month
- **Total: $5-10/month**

**Optimization opportunities:**
- Use Sonnet for simple designs: $0.03-0.05 per analysis
- Cache common patterns: -30% cost
- Batch analyze multiple screens: -20% cost

### Figma API Costs

**Figma API:** FREE (up to 10,000 requests/month)

**Beyond free tier:**
- Not applicable for our use case (low volume)

### V0 Costs

**V0 Pro:** $20/month (unlimited generations)
**API costs:** Unknown (requires Vercel outreach)

**Assumption:** If API exists, likely included in Pro subscription

### Total Monthly Cost Estimate

| Item | Cost |
|------|------|
| Vision model (Opus) | $5-10 |
| Figma API | $0 |
| V0 Pro subscription | $20 |
| **Total** | **$25-30/month** |

**Cost per project:**
- ~$2.50-3.00 (10 projects/month)
- **Highly affordable**

---

## Alternative Approaches

### Alternative 1: Screenshot-Only (No API)

**Approach:**
- Use Playwright to screenshot V0/Figma
- Analyze with vision model only
- No API calls

**Pros:**
- Simpler implementation
- Works with any design tool (not just V0/Figma)
- No API dependencies

**Cons:**
- Less precise than API data
- Higher vision model costs (no design token extraction)
- Selector generation harder without semantic information

**Use case:** Fallback if APIs unavailable

### Alternative 2: Manual Component Mapping

**Approach:**
- User manually maps Figma/V0 components to React components
- Voice architect captures mapping in conversation
- E2E tests use manual mappings

**Pros:**
- No vision model costs
- User retains full control
- Works with any design

**Cons:**
- Time-consuming (defeats purpose of automation)
- Prone to human error
- Doesn't scale

**Use case:** Very complex designs where automation struggles

### Alternative 3: Code Generation from Vision Model

**Approach:**
- Vision model directly generates React component code
- Skip V0/Figma entirely
- User describes design in voice, vision model sees screenshot

**Pros:**
- Tool-agnostic
- Single model (Opus) handles everything
- No separate APIs needed

**Cons:**
- Vision model code generation quality variable
- Requires extensive prompt engineering
- More expensive (larger output tokens)

**Use case:** Prototype rapidly without design tools

---

## Recommended Path Forward

### Immediate (Week 1)

1. **Research V0 API availability**
   - Email: support@v0.dev or devrel@vercel.com
   - Ask: API access, pricing, documentation

2. **Test vision model with sample screenshots**
   - Take 5 screenshots (V0 previews, Figma exports)
   - Run through Claude Opus vision analysis
   - Evaluate accuracy of extracted data

3. **Prototype V0 code extraction**
   - Build Playwright script to fetch V0 code
   - Parse JSX component structure
   - Extract props and styling

### Short-term (Weeks 2-4)

1. **Implement V0 integration (MVP)**
   - Use screenshot + code extraction hybrid
   - Integrate into voice architect agent
   - Test with real Sentra designs

2. **Validate approach with Glen**
   - Run full voice architect session with V0 design
   - Measure time savings vs manual description
   - Gather feedback on accuracy

3. **Implement Figma integration (if valuable)**
   - Only if V0 integration proves successful
   - Focus on design token extraction
   - Test with sample Figma files

### Long-term (Weeks 5-8)

1. **Optimize vision model usage**
   - Refine prompts based on real usage
   - Implement caching and cost optimizations
   - Add error handling and retries

2. **Build selector generation library**
   - Design-aware selectors
   - Fallback strategies
   - Validation tools

3. **Production rollout**
   - Document V0/Figma integration workflows
   - Train users on best practices
   - Monitor usage and costs

---

## Success Metrics

**Measure integration success by:**

1. **Time savings:** 50%+ reduction in UI description time
2. **Design fidelity:** 90%+ match between design and implementation
3. **E2E test stability:** 30%+ reduction in selector breakage
4. **User satisfaction:** Voice architect sessions feel "effortless"

**KPIs:**
- Time spent on visual description: < 2 minutes (vs 10-15 minutes)
- E2E tests passing on first run: 95%+
- Manual selector fixes: < 5%
- Cost per project: < $5

---

**Document Owner:** Glen Barnhardt with Claude Code
**Last Updated:** November 23, 2025
**Version:** 1.0
**Status:** Research & Design - Ready for Implementation Planning

**Next steps:**
1. Email Vercel/V0 team (research API)
2. Test vision model with sample designs
3. Build V0 extraction prototype
4. Validate with real usage
