# Design Generation Implementation Tasks

**Project:** Prototype Generation Feature
**Spec:** `.quetrex/DESIGN-GENERATION-SPEC.md`
**Status:** Ready to Start
**Started:** 2025-11-24

---

## Phase 1: Core v0 Integration (Weeks 1-2)

### Setup & Dependencies
- [ ] Install v0-sdk: `npm install v0-sdk`
- [ ] Add V0_API_KEY to environment variables
- [ ] Install @vercel/client: `npm install @vercel/client`
- [ ] Add Vercel credentials to environment

### Database Schema
- [ ] Create migration: `drizzle/0004_add_prototypes.sql`
- [ ] Add `prototypes` table to schema
- [ ] Add `prototypeIterations` table to schema
- [ ] Run migration: `npm run db:migrate`
- [ ] Verify tables created: `npm run db:studio`

### Service Layer - v0 Integration
- [ ] Create `src/services/v0-integration.ts`
- [ ] Implement `generate()` method
- [ ] Implement `iterate()` method
- [ ] Implement `exportCode()` method
- [ ] Add error handling & retries
- [ ] Write unit tests (target 90%+)

### Service Layer - Spec to Prompt
- [ ] Create `src/services/spec-to-prompt.ts`
- [ ] Implement `buildV0Prompt()` method
- [ ] Implement `extractDesignTokens()` method
- [ ] Implement `validateSpec()` method
- [ ] Write unit tests (target 90%+)

### Service Layer - Prototype Deployment
- [ ] Create `src/services/prototype-deployment.ts`
- [ ] Implement `deploy()` method (basic v0 URLs for now)
- [ ] Implement `getStatus()` method
- [ ] Implement `delete()` method
- [ ] Write unit tests (target 90%+)

### API Endpoints
- [ ] Create `src/app/api/prototypes/generate/route.ts`
- [ ] Create `src/app/api/prototypes/[id]/route.ts`
- [ ] Create `src/app/api/prototypes/[id]/iterate/route.ts`
- [ ] Create `src/app/api/prototypes/[id]/code/route.ts`
- [ ] Add authentication middleware
- [ ] Write integration tests

### Design Agent
- [ ] Create `.claude/agents/design-agent.md`
- [ ] Define agent responsibilities
- [ ] Add skills: nextjs-15-specialist, typescript-strict-guard, shadcn-ui-patterns
- [ ] Implement workflow (read spec → generate → return URL)
- [ ] Add error handling
- [ ] Test with sample architect specs

### Voice Architect Integration
- [ ] Update `.claude/agents/voice-architect.md`
- [ ] Add prototype generation prompt (at 90% confidence)
- [ ] Implement handoff to design-agent
- [ ] Add prototype approval workflow
- [ ] Test end-to-end voice → prototype flow

### Testing & Validation
- [ ] Manual test: Voice session → prototype generation
- [ ] Verify v0 API returns working demo URL
- [ ] Test iteration: Change design via feedback
- [ ] Run all unit tests: `npm test`
- [ ] Run integration tests
- [ ] Document any issues found

### Documentation
- [ ] Create `docs/features/prototype-generation.md` (user guide)
- [ ] Create `docs/architecture/PROTOTYPE-GENERATION.md` (technical)
- [ ] Update CLAUDE.md with design agent workflow
- [ ] Add examples to documentation

---

## Phase 2: Quetrex-Hosted Deployments (Weeks 3-4)

### Vercel Project Setup
- [ ] Create separate Vercel project: `quetrex-prototypes`
- [ ] Configure custom domain: `prototypes.quetrex.app`
- [ ] Set up DNS records
- [ ] Test domain resolves correctly

### Deployment Service Enhancement
- [ ] Update `prototype-deployment.ts` for Vercel deployments
- [ ] Implement `deploy()` with Vercel API
- [ ] Implement `redeploy()` for iterations
- [ ] Add deployment status polling
- [ ] Add deployment logs retrieval
- [ ] Update unit tests

### Database Updates
- [ ] Add `deploymentUrl` field (Quetrex URLs)
- [ ] Add `deploymentStatus` tracking
- [ ] Update prototype creation to include deployment
- [ ] Add indexes for performance

### API Endpoint Updates
- [ ] Update `/api/prototypes/generate` to deploy to Quetrex
- [ ] Update `/api/prototypes/[id]/iterate` to redeploy
- [ ] Add `/api/prototypes/[id]/status` endpoint
- [ ] Add `/api/prototypes/[id]/logs` endpoint

### Dashboard UI
- [ ] Add "Prototypes" section to project detail panel
- [ ] Show prototype list with URLs
- [ ] Add "View Prototype" button
- [ ] Add "Iterate" button (opens modal)
- [ ] Add deployment status indicator
- [ ] Add version history

### Testing
- [ ] Test Vercel deployment works
- [ ] Verify custom domain URLs resolve
- [ ] Test iteration updates same URL
- [ ] Test on mobile/tablet/desktop
- [ ] Load test (10 concurrent deployments)

---

## Phase 3: E2E Test Integration (Weeks 5-6)

### Prototype Analysis Service
- [ ] Create `src/services/prototype-analyzer.ts`
- [ ] Implement Playwright-based DOM analysis
- [ ] Extract interactive elements (buttons, links, inputs)
- [ ] Map elements to test scenarios
- [ ] Write unit tests

### E2E Generator Enhancement
- [ ] Update existing E2E generator (Phase 3.2)
- [ ] Add prototype-aware selector generation
- [ ] Use prototype DOM structure for accurate selectors
- [ ] Combine with architect behavior spec
- [ ] Write tests for generator

### Integration
- [ ] After prototype approved → trigger E2E generation
- [ ] Save tests to `tests/e2e/{project}-prototype.spec.ts`
- [ ] Include tests in GitHub issue creation
- [ ] Validate tests run successfully

### Testing
- [ ] Generate E2E tests from sample prototype
- [ ] Run generated tests: `npm run test:e2e`
- [ ] Verify selectors are stable (rerun tests)
- [ ] Test with 3 different prototype types

---

## Phase 4: Figma Integration (Weeks 7-8)

### Figma MCP Server Setup
- [ ] Install Figma MCP Server
- [ ] Configure in Claude Code settings
- [ ] Test Figma file reading via MCP
- [ ] Verify design token extraction

### Design Token Service
- [ ] Create `src/services/design-tokens.ts`
- [ ] Implement Figma token extraction
- [ ] Implement W3C Design Tokens format
- [ ] Convert tokens to Tailwind config
- [ ] Write unit tests

### v0 Integration Enhancement
- [ ] Update v0 prompt builder to include design tokens
- [ ] Test token application (colors, spacing, typography)
- [ ] Verify visual consistency with Figma

### Voice Architect Enhancement
- [ ] Add Figma URL detection
- [ ] Prompt user: "Extract tokens from Figma?" if URL provided
- [ ] Extract tokens → pass to design agent
- [ ] Test with sample Figma file

### Testing
- [ ] Test with 3 different Figma files
- [ ] Verify tokens extracted correctly
- [ ] Verify v0 prototypes match Figma design
- [ ] Test iteration with Figma tokens

---

## Quality Gates

### Before Phase 1 Complete
- [ ] All unit tests passing (≥90% coverage)
- [ ] Integration test passing (voice → prototype)
- [ ] Manual test: Can generate prototype from voice session
- [ ] Design agent can return working demo URL

### Before Phase 2 Complete
- [ ] Prototypes deploy to prototypes.quetrex.app
- [ ] Custom domain resolves correctly
- [ ] Iteration updates same URL (not new URL)
- [ ] Dashboard UI shows prototypes list

### Before Phase 3 Complete
- [ ] E2E tests auto-generated from prototypes
- [ ] Generated tests run successfully
- [ ] Tests use prototype-accurate selectors
- [ ] Tests included in GitHub issues

### Before Phase 4 Complete
- [ ] Figma MCP Server integrated
- [ ] Design tokens extracted from Figma
- [ ] Tokens applied to v0 prototypes
- [ ] Visual consistency validated

---

## Continuous Tasks

### Throughout All Phases
- [ ] Update documentation as features complete
- [ ] Run test suite after each major change
- [ ] Monitor v0 API usage and costs
- [ ] Track any v0 API issues or limitations
- [ ] Keep DESIGN-GENERATION-SPEC.md updated
- [ ] Mark tasks complete in this file

---

## Success Criteria (End of All Phases)

- [ ] User can generate prototype during voice session
- [ ] Prototype deploys to Quetrex-hosted URL
- [ ] User can iterate on design via voice feedback
- [ ] E2E tests auto-generated from prototype
- [ ] Figma integration extracts design tokens
- [ ] All tests passing (unit + integration + E2E)
- [ ] Documentation complete (user + developer)
- [ ] Feature demo'd to team
- [ ] Ready for production use

---

## Notes & Blockers

### Blockers
(None yet - will update as we encounter them)

### Questions
(Will be answered during implementation)

### Decisions Made
- Using v0 Platform API (not Claude Artifacts) for primary generation
- Quetrex-hosted deployments (not v0 URLs)
- Figma integration secondary priority

---

**Last Updated:** 2025-11-24
**Completed Tasks:** 0/72
**Current Phase:** Phase 1 Setup
