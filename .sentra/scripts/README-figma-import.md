# Figma → Sentra Import Script

Imports Figma designs and merges them with architect's behavioral specifications to create complete screen specs ready for AI agent consumption.

## Overview

This script is part of Sentra's AI-Powered SaaS Factory architecture. It bridges the gap between visual design (Figma) and behavioral specifications (Architect sessions) to create comprehensive screen specifications that agents can implement.

**What it does:**
1. Fetches design from Figma REST API
2. Parses screens (frames) and components
3. Extracts design tokens (colors, spacing, typography)
4. Loads behavioral specs from architect session
5. Merges visual + behavioral into complete YAML specs
6. Outputs specs to `docs/specs/screens/` for agent consumption

## Prerequisites

### 1. Python Dependencies

```bash
pip install requests pyyaml python-dotenv
```

### 2. Figma Access Token

Get your personal access token at: https://www.figma.com/settings

Add to `.env` file:
```bash
FIGMA_ACCESS_TOKEN=your_token_here
```

### 3. Architect Session

You must have an architect session with behavioral specs:
```
.sentra/architect-sessions/<project-name>/
└── ui-screens.md   # Required: Screen behaviors
```

Create this using Voice Architect:
```bash
/architect new --project "bookmark-manager" --voice
```

## Usage

### Basic Import

```bash
python .sentra/scripts/figma-import.py \
  --figma-url https://figma.com/file/abc123/BookmarkManager \
  --project bookmark-manager
```

### Import Specific Frame

```bash
python .sentra/scripts/figma-import.py \
  --figma-url https://figma.com/file/abc123/App?node-id=123:456 \
  --project my-app
```

### Custom Output Directory

```bash
python .sentra/scripts/figma-import.py \
  --figma-url https://figma.com/file/abc123/App \
  --project my-app \
  --output ./custom/specs/
```

### Verbose Logging

```bash
python .sentra/scripts/figma-import.py \
  --figma-url https://figma.com/file/abc123/App \
  --project my-app \
  --verbose
```

## Figma File Requirements

### Screen Organization

Screens should be organized as **top-level frames** on a Figma canvas/page:

```
Figma File
├── Page: "Screens"
│   ├── Frame: "Dashboard"         ← Becomes screen spec
│   ├── Frame: "BookmarkDetail"    ← Becomes screen spec
│   └── Frame: "Settings"          ← Becomes screen spec
└── Page: "Components"
    └── Component library
```

### Naming Convention

**Screen names in Figma MUST match screen names in ui-screens.md**

Example:
- Figma frame: "Dashboard"
- ui-screens.md: `## Screen: Dashboard`
- Output: `dashboard.yml`

### Auto Layout

Use Figma Auto Layout for best results:
- Automatic flex direction detection
- Spacing and padding extraction
- Alignment properties

## Architect Session Format

The `ui-screens.md` file should follow this structure:

```markdown
## Screen: ScreenName

### On Load
- Action 1
- Action 2

### User Actions
- **Action name**: Result description

### States
- State 1
- State 2

### Validation
- Rule 1
- Rule 2

### Error Handling
- Error 1
- Error 2

### E2E Tests
- **Test name**:
  1. Step 1
  2. Step 2
  3. Step 3
```

See `.sentra/architect-sessions/example-project/ui-screens.md` for complete example.

## Output Format

Generated YAML specs contain merged visual + behavioral data:

```yaml
# docs/specs/screens/dashboard.yml

screen: "Dashboard"
route: "/dashboard"
figma_url: "https://figma.com/file/abc123/BookmarkManager"
v0_source: "docs/specs/v0-exports/dashboard.tsx"  # Optional

# FROM FIGMA: Visual structure
layout:
  type: "flex"
  direction: "horizontal"
  spacing: 24
  padding:
    top: 32
    right: 32
    bottom: 32
    left: 32
  children:
    - name: "Sidebar"
      type: "FRAME"
      component: "Sidebar"
      properties:
        width: 256
    - name: "MainContent"
      type: "FRAME"
      component: "Container"
      properties:
        width: 1024

components:
  - "Button"
  - "Card"
  - "Modal"

# FROM ARCHITECT: Behavior
behavior:
  on_load:
    - "Fetch user's bookmarks from API"
    - "Show skeleton loading state"
  user_actions:
    - action: "Click quick add button"
      result: "Opens QuickAddModal for adding new bookmark"
  states:
    - "Empty state: No bookmarks yet"
    - "Loading state: Skeleton cards"
  validation_rules:
    - "User must be authenticated"
  error_handling:
    - "Network error: Show retry button"

# FROM ARCHITECT: E2E tests
e2e_tests:
  - name: "User adds first bookmark"
    description: "User adds first bookmark"
    steps:
      - "Navigate to /dashboard"
      - "See empty state message"
      - "Click quick add button"
      - "Paste URL in modal"
      - "Click save"
      - "Verify bookmark appears in grid"
    assertions: []

# FROM FIGMA: Design tokens
design_tokens:
  colors:
    background: "#FFFFFF"
    accent: "#7C3AED"
  spacing:
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
  typography:
    heading:
      fontFamily: "Inter"
      fontSize: "24px"
      fontWeight: 600

metadata:
  created_at: "2025-11-17T10:30:00Z"
  figma_file_id: "abc123"
  figma_node_id: "456:789"
```

## Error Handling

### Invalid Figma URL

```
Error: Invalid Figma URL format
Expected: https://www.figma.com/file/{file_id}/{title}
```

**Fix:** Check URL format

### Authentication Failed

```
Figma API Error: Authentication failed.
Please check your FIGMA_ACCESS_TOKEN.
Get your token at: https://www.figma.com/settings
```

**Fix:** Verify `FIGMA_ACCESS_TOKEN` in `.env`

### File Not Found

```
Figma API Error: File not found: abc123
Make sure the file exists and you have access to it.
```

**Fix:** Check file ID and permissions in Figma

### Architect Spec Not Found

```
Architect UI screens spec not found: .sentra/architect-sessions/bookmark-manager/ui-screens.md

Please run voice architect to create behavioral specs first:
  /architect new --project "bookmark-manager" --voice
```

**Fix:** Create architect session with behavioral specs

### Screen Name Mismatch

```
⚠️  No behavioral spec found for 'Dashboard Page' - skipping
```

**Fix:** Ensure Figma frame name matches `## Screen: Dashboard Page` in ui-screens.md

## Integration with Meta-Orchestrator

Once screen specs are generated, they're consumed by Meta-Orchestrator:

```bash
# 1. Import Figma designs
python .sentra/scripts/figma-import.py \
  --figma-url https://figma.com/file/abc123/App \
  --project bookmark-manager

# 2. Meta-orchestrator reads specs and creates issues
/orchestrator generate --project bookmark-manager

# 3. AI agents build screens
# (Automated via GitHub Actions)
```

## Workflow

```
┌─────────────────┐
│  Voice Session  │  Human + Architect define behavior
│   with Voice    │  → ui-screens.md created
│    Architect    │
└────────┬────────┘
         │
         │ Behavioral specs
         ▼
┌─────────────────┐
│  Figma Design   │  Designer creates visual structure
│     (Frames)    │  → Screens, components, styles
└────────┬────────┘
         │
         │ Visual structure
         ▼
┌─────────────────┐
│  figma-import   │  ← YOU ARE HERE
│      .py        │  Merges visual + behavioral
└────────┬────────┘
         │
         │ Complete specs (YAML)
         ▼
┌─────────────────┐
│      Meta-      │  Breaks into parallelizable issues
│  Orchestrator   │  → GitHub issues created
└────────┬────────┘
         │
         │ Issues
         ▼
┌─────────────────┐
│   AI Agents     │  Implement screens in parallel
│  (Multi-agent)  │  → PRs created, tests pass
└─────────────────┘
```

## Advanced Features

### V0 Export Detection

If you exported components from Vercel V0, the script will automatically link them:

```
docs/specs/v0-exports/
├── dashboard.tsx
├── bookmark-detail.tsx
└── settings.tsx
```

Script matches by screen name and includes in spec:
```yaml
v0_source: "docs/specs/v0-exports/dashboard.tsx"
```

### Design Token Extraction

The script extracts design tokens from Figma:

1. **Colors**: From fill styles
2. **Typography**: From text styles
3. **Spacing**: Inferred from Auto Layout
4. **Effects**: From effect styles (shadows, etc.)

These become the design system for implementation.

### Layout Type Detection

Automatically detects CSS layout type:
- **Flex**: Figma Auto Layout
- **Grid**: Figma layout grids
- **Absolute**: Manual positioning

## Troubleshooting

### Rate Limiting

Figma API has rate limits (1000 requests/hour). If you hit the limit:
```
Figma API Error: Rate limit exceeded
```

**Fix:** Wait 1 hour or use `--node-id` to fetch specific frames only

### Large Files

For files with 100+ frames, consider:
1. Use specific node IDs: `?node-id=123:456`
2. Process pages separately
3. Split into multiple Figma files

### Missing Dependencies

```
Error: Missing required dependency: No module named 'requests'
```

**Fix:**
```bash
pip install requests pyyaml python-dotenv
```

## See Also

- [HANDOVER-2025-11-17-SENTRA-COMPLETE-VISION.md](../../HANDOVER-2025-11-17-SENTRA-COMPLETE-VISION.md) - Component 3: Figma → Sentra Import
- [Example architect session](.sentra/architect-sessions/example-project/)
- [Figma REST API Documentation](https://www.figma.com/developers/api)

## Support

For issues or questions:
1. Check this README
2. Review example architect session
3. Enable `--verbose` for detailed logs
4. Check `.env` has `FIGMA_ACCESS_TOKEN`

---

**Last Updated:** 2025-11-17
**Author:** Glen Barnhardt with Claude Code
