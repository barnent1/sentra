# Sentra Implementation Status

**Version:** 2.0
**Last Updated:** 2025-01-12
**Status:** Phase 1 - Native App Core (50% complete)

---

## Architecture Overview

Sentra uses a **hybrid deployment model:**
- **Native apps** (Mac, Windows, Linux) - Tauri + Next.js
- **Cloud web app** - Next.js + Node.js API
- **Shared codebase** - Same frontend works in both modes

See: [Cloud Architecture Documentation](../docs/architecture/sentra-cloud-architecture.md)

---

## Documentation

📚 **Key Documents:**
- [Cloud Architecture](../docs/architecture/sentra-cloud-architecture.md) - Complete system design with Mermaid diagrams
- [Implementation Plan](../docs/SENTRA-IMPLEMENTATION-PLAN.md) - Detailed task breakdown (4 phases, 20+ tasks)
- [ADR 0001](../docs/adr/0001-hybrid-deployment-model.md) - Hybrid deployment decision
- [GitHub Issue Template](../.github/ISSUE_TEMPLATE/sentra-task.md) - Template for creating tasks

---

## Phase Progress

### Phase 1: Native App Core (50% complete) 🟡
**Goal:** Complete spec approval workflow
**Status:** In Progress
**Tasks:** 6 total (3 complete, 3 remaining)

#### Completed ✅
- Task 1.0: Voice conversation with echo prevention
- Task 1.0: Spec generation via Claude
- Task 1.0: Backend spec storage (Rust commands)

#### In Progress 🚧
- Task 1.1: SpecViewer component ❌
- Task 1.2: Project card badge ❌
- Task 1.3: Approve/reject handlers ❌
- Task 1.4: Change storage to `.sentra/specs/` ❌
- Task 1.5: Create GitHub issue from spec ❌
- Task 1.6: End-to-end testing ❌

### Phase 2: Cloud Backend (0% complete) ⚪
**Goal:** API server + database
**Status:** Not Started
**Tasks:** 7 (database, auth, GitHub integration, APIs)

### Phase 3: Cloud Frontend (0% complete) ⚪
**Goal:** Web app accessible from anywhere
**Status:** Not Started
**Tasks:** 4 (abstraction layer, login, register, deploy)

### Phase 4: Agent Improvements (0% complete) ⚪
**Goal:** Cost tracking, auto-retry, prioritization
**Status:** Not Started
**Tasks:** 3 (costs, retry logic, prioritization)

---

## Current Session: Spec Approval Workflow

### Completed ✅

#### 1. OpenAI Realtime API Integration
- ✅ WebSocket proxy in Rust (src-tauri/src/realtime_proxy.rs)
- ✅ Frontend client (src/lib/openai-realtime.ts)
- ✅ Voice conversation with echo prevention
- ✅ Greeting when conversation starts
- ✅ Automatic handoff detection
- ✅ Conversation text collection in ref (fixed state timing issue)

#### 2. Spec Generation
- ✅ Voice conversation with Sentra (OpenAI Realtime API)
- ✅ Spec creation via Claude Sonnet/Opus (Anthropic API)
- ✅ Handoff only triggers on explicit user confirmation:
  - "No" (in response to "Anything else?")
  - "I'm done"
  - "Nothing else"
  - "That's all"
  - "That's everything"
  - **NOT** "That's it" (too ambiguous)

#### 3. Backend Spec Storage (Rust)
- ✅ Added `pendingSpec: Option<String>` to Project struct
- ✅ Created `save_pending_spec` command
- ✅ Created `approve_spec` command (moves to approved-spec.md)
- ✅ Created `reject_spec` command (deletes pending spec)
- ✅ Registered all commands in lib.rs
- ✅ Projects automatically load pending spec if exists

#### 4. Frontend Spec Storage (TypeScript)
- ✅ Updated Project interface with `pendingSpec?: string`
- ✅ Added `savePendingSpec()` function
- ✅ Added `approveSpec()` function
- ✅ Added `rejectSpec()` function
- ✅ Handoff handler saves spec to `.claude/pending-spec.md`

### In Progress 🚧

#### 5. Spec Approval UI
- ⏸️ **STOPPED HERE** - Need to implement:
  1. SpecViewer component with markdown preview
  2. "View Spec" button on project cards (when pendingSpec exists)
  3. Approve/Reject buttons in SpecViewer
  4. Re-open voice conversation when spec rejected

### Next Steps 📋

1. **Create SpecViewer Component** (`src/components/SpecViewer.tsx`)
   - Modal dialog with markdown preview
   - Scrollable content area
   - Approve button (green)
   - Reject button (red)
   - On reject: allow reopening conversation with Sentra

2. **Update Project Card** (`src/app/page.tsx` or wherever project cards are)
   - Show "View Spec" badge/button when project.pendingSpec exists
   - Click to open SpecViewer modal

3. **Wire Up Actions**
   - Approve: call `approveSpec()`, refresh projects, show success message
   - Reject: call `rejectSpec()`, optionally reopen voice dialog for revision

### File Locations

**Backend (Rust):**
- `src-tauri/src/commands.rs` - Project struct & spec commands
- `src-tauri/src/lib.rs` - Command registration
- `src-tauri/src/realtime_proxy.rs` - WebSocket proxy

**Frontend (TypeScript/React):**
- `src/lib/tauri.ts` - Tauri command wrappers
- `src/lib/openai-realtime.ts` - Realtime API client
- `src/components/ArchitectChat.tsx` - Voice conversation UI
- `src/app/page.tsx` - Main dashboard (TODO: add View Spec button)

**Spec Storage Location (WILL CHANGE in Task 1.4):**
- **Current:** `<project>/.claude/pending-spec.md` and `approved-spec.md`
- **Target:** `<project>/.sentra/specs/pending-spec.md` and `approved-spec.md`
- **Archive:** `<project>/.sentra/specs/archive/YYYY-MM-DD-HH-MM.md`

### Technical Notes

- **Who creates the spec?** Claude (Anthropic), NOT OpenAI
- **OpenAI's role:** Voice conversation only (Realtime API)
- **Claude's role:** Creates technical specification
- **Echo prevention:** 1000ms delay before resuming recording after Sentra speaks
- **State management:** Using refs for conversation text to avoid React timing issues

### Current Workflow

1. ✅ User opens voice dialog → Sentra greets
2. ✅ User describes features → Sentra listens and asks clarifying questions
3. ✅ User confirms done → Sentra triggers handoff
4. ✅ Claude creates spec
5. ✅ Spec saved to `.claude/pending-spec.md`
6. ✅ Dialog closes
7. ❌ **MISSING:** User sees "View Spec" on project card
8. ❌ **MISSING:** User clicks to view formatted markdown
9. ❌ **MISSING:** User approves or rejects spec
10. ❌ **TODO:** If approved → spawn agents to work on issues
11. ❌ **TODO:** If rejected → reopen conversation for revision

### Dependencies to Install

**Phase 1 (Native App):**
- [ ] `react-markdown` - Markdown rendering
- [ ] `remark-gfm` - GitHub Flavored Markdown
- [ ] `remark-highlight.js` - Code syntax highlighting

**Phase 2 (Cloud Backend):**
- [ ] `express` - Web framework
- [ ] `prisma` - Database ORM
- [ ] `passport` - Authentication
- [ ] `jsonwebtoken` - JWT tokens
- [ ] `speakeasy` - TOTP 2FA
- [ ] `zod` - Validation

---

## Using Sentra to Build Sentra 🐕

**Meta Strategy:** Dogfooding from day one!

1. ✅ Created detailed implementation plan
2. ⏳ Create GitHub issues for each task (in progress)
3. ⏳ Use Sentra voice to create specs
4. ⏳ Approve specs via Sentra UI (once built!)
5. ⏳ Let agents implement tasks
6. ⏳ Review PRs and iterate

**Current Limitation:**
- Phase 1 tasks need manual implementation (chicken-egg problem)
- Once Phase 1 complete → use Sentra to build Phase 2+

---

## Next Immediate Actions

### 1. Create GitHub Issues (Manual)
- [ ] Create issue for Task 1.1 (SpecViewer)
- [ ] Create issue for Task 1.2 (Project card badge)
- [ ] Create issue for Task 1.3 (Approve/reject handlers)
- [ ] Create issue for Task 1.4 (Change to `.sentra/specs/`)
- [ ] Create issue for Task 1.5 (GitHub issue creation)
- [ ] Create issue for Task 1.6 (E2E testing)

### 2. Start with Task 1.1 (Manual Implementation)
**Why manual?** Need working UI before we can use Sentra to build Sentra!

**Steps:**
1. Install `react-markdown` and `remark-gfm`
2. Create `SpecViewer.tsx` component
3. Test with sample markdown
4. Integrate with project card
5. Wire up approve/reject

### 3. Test the Workflow
- Voice → Spec → Approve → GitHub Issue
- If working → create issue for Task 1.2 using Sentra voice!

---

## Risk Mitigation

**Risk:** Context loss between tasks
**Solution:** Each task in implementation plan is fully self-contained

**Risk:** Agent breaks existing code
**Solution:** Pre-commit hooks catch build failures (from Phase I)

**Risk:** Sentra not good enough to build itself yet
**Solution:** Start manual, transition to agents gradually

---

## Architecture & Security Decisions

**Decision Date:** November 12, 2025
**Approved By:** Glen Barnhardt
**Status:** Approved - Implementation Starting This Week

Based on comprehensive research into Claude Code for Web's architecture, Sentra will implement a 3-phase containerization and security approach for its AI agent system.

### Context

Sentra's GitHub Actions-based AI agents currently have critical security gaps compared to Claude Code for Web:
- No filesystem isolation
- No network isolation
- Credentials in environment variables
- Persistent runner state

**Risk Level:** CRITICAL (credential theft possible via prompt injection)

### Approved 3-Phase Plan

#### Phase 1: Docker Containerization (THIS WEEK - Weeks 1-2)
**Goal:** Immediate risk reduction through container isolation
**Timeline:** Starting this week
**Risk Reduction:** 60-70%

**Implementation:**
- Create Dockerfile with minimal Ubuntu 22.04 base
- Run agents in isolated Docker containers on GitHub Actions
- Read-only root filesystem with tmpfs for /tmp
- Drop all capabilities except essential ones
- Process and memory limits via cgroups
- Non-root user execution

**Deliverables:**
- [ ] Dockerfile for AI agent runtime
- [ ] Updated workflow YAML with container directive
- [ ] Security verification tests
- [ ] Documentation

#### Phase 2: Credential Proxy Service (Weeks 2-4)
**Goal:** Eliminate credential exposure to agent processes
**Timeline:** Immediately after Phase 1
**Risk Reduction:** 30% (CRITICAL - prevents credential theft)

**Implementation:**
- Sidecar proxy service running on GitHub Actions host
- Unix socket communication between container and proxy
- Credentials never passed to container environment
- Request validation before credential attachment
- Audit log of all credential usage

**Deliverables:**
- [ ] Credential proxy service implementation
- [ ] Integration with Docker workflow
- [ ] Audit logging system
- [ ] Documentation

#### Phase 3: gVisor Migration (Q1 2026)
**Goal:** Industry-leading security matching Claude Code for Web
**Timeline:** Months 2-3 (Q1 2026)
**Risk Reduction:** 15% (remaining gap)

**Implementation:**
- Custom infrastructure with gVisor runtime
- User-space kernel isolation (no direct host kernel access)
- Complete syscall interception
- Move off GitHub Actions to custom runners

**Deliverables:**
- [ ] gVisor infrastructure design
- [ ] Custom runner deployment
- [ ] Migration from GitHub Actions
- [ ] Enterprise-grade security posture

### Infrastructure Decision

**Approved Approach:** Run on GitHub Actions (Phases 1-2), migrate to custom infrastructure (Phase 3)

**Rationale:**
- Phase 1-2 can use existing GitHub Actions infrastructure
- Provides 85% security posture with minimal infrastructure overhead
- Phase 3 requires custom infrastructure but provides industry-leading security
- Pragmatic phased approach balances risk reduction with engineering effort

### SDK Decision

**Approved Approach:** Use Anthropic Python SDK directly (not fake CLI wrapper)

**Rationale:**
- Current CLI subprocess approach is fragile (parsing stdout/stderr)
- Anthropic SDK provides structured tool ecosystem
- Automatic context management and compaction
- Better error handling and recovery
- Future-proof as Claude Code features evolve

**Migration:** Planned for Phase 2 (Weeks 2-4)

### Next Steps

**This Week (Phase 1 Start):**
1. Create Dockerfile for agent runtime
2. Update GitHub Actions workflow with container directive
3. Implement security verification tests
4. Deploy to test environment

**See Also:**
- `/docs/architecture/SECURITY-ARCHITECTURE.md` - Comprehensive security design
- `CRITICAL_SECURITY_FINDINGS.md` - Research findings
- `ADR_0001_CONTAINER_SECURITY.md` - Architecture decision record
- `TECHNICAL_RESEARCH_CLAUDE_CODE.md` - Deep technical analysis

---

## Success Criteria (Phase 1)

- [ ] Voice → Spec → Approve → GitHub Issue (full workflow)
- [ ] 10 test runs with 90%+ success rate
- [ ] Specs stored in `.sentra/specs/` directory
- [ ] Native app works on Mac (Windows/Linux later)
- [ ] Ready to use Sentra to build remaining phases
- [ ] Docker containerization deployed (Phase 1 security)
