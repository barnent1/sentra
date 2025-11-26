# Design Generation Feature Specification

**Status:** Ready for Implementation
**Priority:** P0 (Equal to E2E Generation)
**Owner:** Glen Barnhardt
**Created:** 2025-11-24
**Target:** No fixed date, build when ready

---

## Executive Summary

Enable Sentra's voice architect to generate working, interactive prototypes during conversation. Users can show these prototypes to customers for validation before development begins.

---

## Architecture Decisions

### Primary Tool: v0 Platform API
- **Reason:** Official API, matches our stack (Next.js 15, React 19, shadcn/ui, TypeScript strict)
- **API Docs:** https://v0.dev/docs/api/platform
- **SDK:** v0-sdk (npm package)
- **Cost:** $2-5 per prototype (~$20-50/month usage)

### Hosting: Sentra-Hosted Demos (NOT v0 URLs)
- **Reason:** User preference for branded demos
- **Deployment:** Vercel preview deployments per prototype
- **URL Format:** `https://<project-slug>-prototype.sentra.app`

### Figma Integration: Secondary (Phase 2)
- **Use Figma MCP Server** (native Claude Code integration)
- **Purpose:** Extract design tokens from existing designs
- **Priority:** After v0 integration working

---

## Technical Architecture

### New Agent: Design Agent

**Location:** `.claude/agents/design-agent.md`

**Responsibilities:**
1. Accept specifications from voice architect (≥90% confidence)
2. Generate prototypes via v0 Platform API
3. Deploy to Sentra-hosted preview URLs
4. Iterate based on user feedback
5. Extract prototype code for implementation agents

**Skills Used:**
- `nextjs-15-specialist`
- `typescript-strict-guard`
- `shadcn-ui-patterns`

**Tools:**
- v0-sdk (TypeScript SDK)
- Vercel deployment API
- Read/Write for code extraction

---

## Services Architecture

### 1. v0 Integration Service

**File:** `src/services/v0-integration.ts`

```typescript
interface V0GenerationRequest {
  prompt: string;
  designTokens?: DesignTokens;
  framework: 'nextjs';
  styling: 'tailwind';
}

interface V0GenerationResponse {
  chatId: string;
  files: CodeFile[];
  demoUrl: string; // v0's URL (we'll replace with our own)
}

class V0IntegrationService {
  async generate(request: V0GenerationRequest): Promise<V0GenerationResponse>
  async iterate(chatId: string, feedback: string): Promise<V0GenerationResponse>
  async exportCode(chatId: string): Promise<CodeFile[]>
}
```

**Test Coverage:** 90%+ required

---

### 2. Prototype Deployment Service

**File:** `src/services/prototype-deployment.ts`

```typescript
interface DeploymentRequest {
  projectName: string;
  prototypeId: string;
  files: CodeFile[];
  environmentVars?: Record<string, string>;
}

interface DeploymentResponse {
  url: string; // https://<project>-prototype.sentra.app
  status: 'deploying' | 'ready' | 'error';
  logs?: string[];
}

class PrototypeDeploymentService {
  async deploy(request: DeploymentRequest): Promise<DeploymentResponse>
  async getStatus(deploymentId: string): Promise<DeploymentResponse>
  async redeploy(deploymentId: string): Promise<DeploymentResponse>
  async delete(deploymentId: string): Promise<void>
}
```

**Test Coverage:** 90%+ required

---

### 3. Spec to Prompt Translator

**File:** `src/services/spec-to-prompt.ts`

```typescript
interface ArchitectSpec {
  screen: string;
  description: string;
  route: string;
  layout: LayoutSpec;
  components: ComponentSpec[];
  behavior: BehaviorSpec;
  design_tokens?: DesignTokens;
}

class SpecToPromptService {
  buildV0Prompt(spec: ArchitectSpec): string
  extractDesignTokens(spec: ArchitectSpec): DesignTokens
  validateSpec(spec: ArchitectSpec): ValidationResult
}
```

**Test Coverage:** 90%+ required

---

## Database Schema Updates

### New Table: prototypes

```typescript
// src/db/schema.ts
export const prototypes = pgTable('prototypes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // v0 Integration
  v0ChatId: text('v0_chat_id').notNull(), // For iteration
  v0DemoUrl: text('v0_demo_url'), // Original v0 URL

  // Sentra Hosting
  deploymentUrl: text('deployment_url').notNull(), // Our hosted URL
  deploymentStatus: text('deployment_status', {
    enum: ['pending', 'deploying', 'ready', 'error']
  }).notNull(),

  // Metadata
  title: text('title').notNull(),
  description: text('description'),
  specPath: text('spec_path'), // Path to architect spec YAML

  // Code
  files: json('files').$type<CodeFile[]>(), // All generated files

  // Iteration tracking
  version: integer('version').notNull().default(1),
  parentId: text('parent_id').references(() => prototypes.id), // For iterations

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const prototypeIterations = pgTable('prototype_iterations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  prototypeId: text('prototype_id').notNull().references(() => prototypes.id, { onDelete: 'cascade' }),

  feedback: text('feedback').notNull(),
  changesApplied: text('changes_applied').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Migration:** `drizzle/0004_add_prototypes.sql`

---

## API Endpoints

### POST /api/prototypes/generate

**Request:**
```typescript
{
  projectId: string;
  specPath: string; // Path to architect spec
  title: string;
}
```

**Response:**
```typescript
{
  prototypeId: string;
  deploymentUrl: string;
  status: 'deploying' | 'ready';
}
```

**Authentication:** Required (JWT)

---

### POST /api/prototypes/:id/iterate

**Request:**
```typescript
{
  feedback: string; // Natural language feedback
}
```

**Response:**
```typescript
{
  prototypeId: string;
  version: number;
  deploymentUrl: string; // Same URL, updated content
  status: 'deploying' | 'ready';
}
```

---

### GET /api/prototypes/:id

**Response:**
```typescript
{
  id: string;
  projectId: string;
  title: string;
  description: string;
  deploymentUrl: string;
  deploymentStatus: string;
  version: number;
  iterations: Iteration[];
  createdAt: string;
  updatedAt: string;
}
```

---

### GET /api/prototypes/:id/code

**Response:**
```typescript
{
  files: CodeFile[];
}
```

**Purpose:** Extract code for implementation agents

---

## Voice Architect Integration

### Handoff Flow

```yaml
# Voice architect reaches 90%+ confidence
confidence_check:
  threshold: 0.90
  action: "prompt_user_for_design_generation"

# User approves
user_approval:
  prompt: "I have 93% confidence in the specification. Ready to generate the design?"
  options: ["Yes, create prototype", "No, keep discussing", "Skip prototype"]

# Generate prototype
design_generation:
  agent: "design-agent"
  input: "architect-spec.yml"
  output: "prototype-url"

# Return control to voice architect
handoff_back:
  message: "Prototype ready at {url}. Continue with questions or finalize spec?"
```

### Updated Voice Architect Prompt

```markdown
## Prototype Generation

After reaching ≥90% confidence, ask the user:

"I have {confidence}% confidence in the specification. Ready to generate a working prototype?"

**If YES:**
1. Save complete specification to `.sentra/architect-sessions/{project}/spec.yml`
2. Call design-agent with spec path
3. Wait for prototype URL
4. Share URL with user: "Prototype ready at {url}. Try clicking around!"
5. Ask: "Would you like to make any changes, or shall we finalize?"

**If user requests changes:**
1. Collect feedback in natural language
2. Call design-agent to iterate
3. Confirm: "Updated! Refresh {url} to see changes."

**When user approves:**
1. Mark prototype as approved in database
2. Generate E2E tests from prototype interactions
3. Create GitHub issue with spec + tests + prototype URL
```

---

## Design Agent Specification

### Agent File: `.claude/agents/design-agent.md`

```markdown
---
name: design-agent
description: Generates interactive prototypes from architect specifications using v0 Platform API
tools: Read, Write, Bash
skills: [nextjs-15-specialist, typescript-strict-guard, shadcn-ui-patterns]
model: claude-sonnet-4-20250929
---

# Design Agent

## Mission

Generate production-ready Next.js prototypes from architect specifications. Deploy to Sentra-hosted preview URLs for customer validation.

## Workflow

1. **Read Specification**
   - Load architect spec from `.sentra/architect-sessions/{project}/spec.yml`
   - Validate completeness (≥90% confidence required)

2. **Translate to v0 Prompt**
   - Use `SpecToPromptService.buildV0Prompt(spec)`
   - Include design tokens if available
   - Specify Next.js 15, React 19, shadcn/ui, TypeScript strict

3. **Generate via v0 API**
   - Call `V0IntegrationService.generate(prompt)`
   - Wait for code files + demo URL

4. **Deploy to Sentra**
   - Extract code files from v0 response
   - Call `PrototypeDeploymentService.deploy(files)`
   - Wait for Sentra-hosted URL

5. **Save to Database**
   - Create prototype record
   - Store v0ChatId for iteration
   - Store deployment URL
   - Link to project

6. **Return URL**
   - Share Sentra-hosted URL with user
   - Store prototype path in architect session

## Iteration Flow

1. **Receive Feedback**
   - User provides natural language feedback
   - Example: "Move sidebar to left side"

2. **Iterate via v0 API**
   - Call `V0IntegrationService.iterate(chatId, feedback)`
   - v0 updates the design

3. **Redeploy**
   - Extract updated code files
   - Call `PrototypeDeploymentService.redeploy(deploymentId)`
   - Same URL, updated content

4. **Track Iteration**
   - Increment version number
   - Log feedback + changes in database
   - Return success confirmation

## Error Handling

- v0 API failures → Retry 3x with exponential backoff
- Deployment failures → Save code locally, deploy manually
- Validation errors → Return to voice architect with specific issues

## Success Criteria

- Prototype deploys successfully
- All navigation links work
- Matches architect specification (visual + behavioral)
- Accessible via public URL
- Ready for customer demo
```

---

## Deployment Architecture

### Vercel Preview Deployments

**Project Structure:**
```
sentra-prototypes/ (Separate Vercel project)
├── prototypes/
│   ├── project-abc-v1/
│   │   ├── generated code from v0
│   ├── project-abc-v2/
│   │   ├── iteration 2
│   ├── project-xyz-v1/
│       ├── another project
```

**Deployment Config:**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "prototypes/*/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/project-abc/(.*)",
      "dest": "/prototypes/project-abc-v1/$1"
    }
  ]
}
```

**URL Structure:**
- Main: `https://prototypes.sentra.app`
- Project: `https://prototypes.sentra.app/project-abc` → Latest version
- Specific: `https://prototypes.sentra.app/project-abc/v2` → Version 2

---

## E2E Test Integration

### Auto-Generate from Prototype

**After prototype approved:**

1. **Analyze Prototype DOM**
   - Use Playwright to visit prototype URL
   - Extract all interactive elements (buttons, links, inputs)
   - Map to test scenarios

2. **Generate E2E Tests**
   - Use existing template system (Phase 3.2)
   - Selectors based on prototype structure
   - Assertions based on architect behavior spec

3. **Save Tests**
   - `tests/e2e/{project}-interactions.spec.ts`
   - Include in GitHub issue

**Example:**
```typescript
// Auto-generated from prototype + architect spec
test('User toggles mute button', async ({ page }) => {
  await page.goto('https://prototypes.sentra.app/project-abc');

  // Selector extracted from prototype DOM
  const muteBtn = page.locator('[data-testid="project-mute-btn"]');

  await muteBtn.click();

  // Behavior from architect spec
  await expect(muteBtn).toHaveClass(/bg-violet-600/);
  await expect(muteBtn).toHaveAttribute('aria-pressed', 'true');
});
```

---

## Security Considerations

### API Key Management
- Store v0 API key in environment variable: `V0_API_KEY`
- Encrypt in database (Phase 2 credential proxy)
- Never expose in client-side code

### Prototype Access Control
- Prototypes are PUBLIC URLs (for customer sharing)
- No authentication required for viewing
- Add `robots.txt` to prevent indexing
- Optional: Password protection via query param

### Rate Limiting
- v0 API: Unknown limits (monitor usage)
- Vercel deployments: 100/hour (Team plan)
- Implement queue if limits hit

---

## Cost Projections

### Monthly (10 prototypes, 2 iterations each)

| Item | Cost |
|------|------|
| v0 Premium plan | $20 |
| v0 API usage (10 prototypes) | $20-50 |
| v0 API usage (20 iterations) | $10-20 |
| Vercel Pro (prototype hosting) | $20 |
| **Total** | **$70-110/month** |

**Per prototype:** $3.50-5.50 (including iterations)

**ROI:**
- Human designer: $500-2000 per mockup
- Sentra: $5 per working prototype
- **99% cost savings**

---

## Success Metrics

### Technical Metrics
- Prototype generation time: <30 seconds
- Deployment time: <2 minutes
- Iteration time: <15 seconds
- Uptime: 99%+

### Quality Metrics
- Customer approval rate: >80%
- Iterations per prototype: <3 average
- Design-to-implementation match: >90%
- E2E test generation success: >95%

### Business Metrics
- Time to customer validation: <10 minutes (vs days)
- Development rework: -50% (validated before coding)
- Customer satisfaction: Measured via feedback

---

## Implementation Phases

### Phase 1: Core v0 Integration (Weeks 1-2)
- v0 SDK integration
- Design agent implementation
- Basic deployment (v0 URLs acceptable for now)
- Voice architect handoff

**Definition of Done:**
- Can generate prototype from architect spec
- Returns working demo URL
- Manual iteration works

---

### Phase 2: Sentra-Hosted Deployments (Weeks 3-4)
- Vercel preview deployment automation
- Custom domain setup (prototypes.sentra.app)
- Database schema for prototypes
- API endpoints

**Definition of Done:**
- Prototypes hosted on sentra.app domain
- Automated deployment pipeline
- Iteration tracking in database

---

### Phase 3: E2E Test Integration (Weeks 5-6)
- Prototype DOM analysis
- Auto-generate E2E tests
- Integrate with existing E2E generation
- Include in GitHub issues

**Definition of Done:**
- E2E tests generated from prototypes
- Tests use prototype-accurate selectors
- Tests included in implementation issues

---

### Phase 4: Figma Integration (Weeks 7-8)
- Figma MCP Server setup
- Design token extraction
- Pass tokens to v0 API
- Optional: Skip v0 if Figma complete

**Definition of Done:**
- Can extract design tokens from Figma
- Tokens applied to v0-generated prototypes
- Visual consistency maintained

---

## File Structure

```
sentra/
├── .claude/
│   ├── agents/
│   │   ├── design-agent.md (NEW)
│   │   └── voice-architect.md (UPDATED)
│   └── skills/ (existing)
├── src/
│   ├── services/
│   │   ├── v0-integration.ts (NEW)
│   │   ├── prototype-deployment.ts (NEW)
│   │   └── spec-to-prompt.ts (NEW)
│   ├── db/
│   │   └── schema.ts (UPDATED - add prototypes table)
│   └── app/api/
│       └── prototypes/ (NEW)
│           ├── generate/route.ts
│           ├── [id]/route.ts
│           ├── [id]/iterate/route.ts
│           └── [id]/code/route.ts
├── tests/
│   ├── unit/services/
│   │   ├── v0-integration.test.ts (NEW)
│   │   ├── prototype-deployment.test.ts (NEW)
│   │   └── spec-to-prompt.test.ts (NEW)
│   └── integration/
│       └── prototype-generation.test.ts (NEW)
├── drizzle/
│   └── 0004_add_prototypes.sql (NEW)
└── .sentra/
    ├── DESIGN-GENERATION-SPEC.md (THIS FILE)
    └── DESIGN-GENERATION-TASKS.md (TASK LIST)
```

---

## Dependencies

### New npm Packages
```json
{
  "v0-sdk": "^latest",
  "@vercel/client": "^latest"
}
```

### Environment Variables
```bash
# v0 Integration
V0_API_KEY=your_v0_api_key_here

# Vercel Deployment
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=prototype_project_id
VERCEL_ORG_ID=your_org_id

# Prototype Hosting
PROTOTYPE_BASE_URL=https://prototypes.sentra.app
```

---

## Testing Strategy

### Unit Tests (90%+ coverage)
- v0 integration service (mocked API)
- Spec to prompt translator
- Prototype deployment service (mocked Vercel API)

### Integration Tests
- End-to-end prototype generation
- Voice architect → design agent handoff
- Iteration workflow
- E2E test generation from prototype

### Manual Testing Checklist
- [ ] Generate prototype from voice session
- [ ] Verify Sentra-hosted URL works
- [ ] Test iteration (change design)
- [ ] Verify E2E tests generated correctly
- [ ] Share URL with external user (customer simulation)
- [ ] Test on mobile/tablet/desktop
- [ ] Verify all navigation links work

---

## Documentation

### User-Facing Docs

**Location:** `docs/features/prototype-generation.md`

**Contents:**
- How to generate prototypes during voice sessions
- Sharing prototypes with customers
- Iterating on designs
- Approving prototypes for implementation
- Exporting code

### Developer Docs

**Location:** `docs/architecture/PROTOTYPE-GENERATION.md`

**Contents:**
- v0 API integration details
- Deployment architecture
- Database schema
- API endpoint specifications
- Agent coordination

---

## Risk Mitigation

### Risk: v0 API Changes (Beta)
**Mitigation:**
- Abstract v0 calls behind service interface
- Easy to swap v0 for alternative (Claude Artifacts, etc.)
- Monitor v0 changelog

### Risk: Deployment Failures
**Mitigation:**
- Fallback to v0-hosted URLs
- Manual deployment option
- Clear error messages for user

### Risk: Cost Overruns
**Mitigation:**
- Set usage alerts in v0 dashboard
- Cache generated prototypes
- Limit iterations (max 5 per prototype)

### Risk: Poor Prototype Quality
**Mitigation:**
- High-quality prompts from architect specs
- Manual review before sharing with customers
- Feedback loop to improve prompts

---

## Future Enhancements (Post-MVP)

1. **Multi-Screen Prototypes**
   - Generate entire app (not just single screens)
   - Navigation between screens

2. **Real Data Integration**
   - Connect prototypes to staging database
   - Show real content in demos

3. **Collaboration Features**
   - Comments on prototypes
   - Version comparison
   - Approval workflows

4. **Advanced Figma Integration**
   - Two-way sync (Figma ↔ Sentra)
   - Auto-update prototypes when Figma changes

5. **Alternative AI Design Tools**
   - Support Galileo AI, Uizard, etc.
   - User chooses preferred tool

---

## Appendix

### Research References
- v0 Platform API: https://vercel.com/blog/build-your-own-ai-app-builder-with-the-v0-platform-api
- v0 SDK: https://github.com/vercel/v0-sdk
- Figma MCP Server: https://www.figma.com/blog/introducing-figma-mcp-server/
- W3C Design Tokens: https://www.w3.org/community/design-tokens/

### Related Specifications
- Voice Architect: `.claude/agents/voice-architect.md`
- E2E Test Generation: `docs/decisions/ADR-004-E2E-TEST-GENERATION.md`
- V0/Figma Integration: `docs/architecture/V0-FIGMA-INTEGRATION.md`

---

**End of Specification**
