# Integrated Architecture Migration Plan

**Goal:** Align Sentra with Anthropic's integrated agent + skill architecture
**Current Compliance:** 70%
**Target Compliance:** 100%
**Estimated Effort:** 12-16 hours over 3 phases

---

## Phase 1: Core Skills Foundation (4-6 hours)

### Priority: CRITICAL
### Goal: Create missing cross-cutting skills that all agents need

#### Task 1.1: Create `quality-gates` Skill (2 hours)

**Structure:**
```
.claude/skills/quality-gates/
├── SKILL.md (core framework, ~150 lines)
├── validation-rules.md (detailed rules, load on-demand)
├── test-patterns.md (AAA pattern, coverage rules)
├── checkpoint-framework.md (gate definitions)
└── validate.py (executable validation script)
```

**SKILL.md Contents:**
```markdown
---
name: quality-gates
description: >
  Validate code implementations against quality standards.
  Use when writing, testing, or reviewing code to ensure
  completeness, correctness, and consistency.
---

# Quality Gates Skill

## When to Use
- Before writing code (pre-implementation gate)
- After writing code (implementation gate)
- Before committing (testing gate)
- During code review (review gate)

## Checkpoint Framework

### Pre-Implementation Gate
Load: checkpoint-framework.md#pre-implementation
- [ ] Requirements fully understood
- [ ] Architecture decision logged
- [ ] Type definitions planned
- [ ] Test cases identified

### Implementation Gate
Load: checkpoint-framework.md#implementation
- [ ] TypeScript strict mode passes
- [ ] No `any` types (see validation-rules.md)
- [ ] Error handling complete
- [ ] Security validated

### Testing Gate
Load: checkpoint-framework.md#testing
- [ ] Tests written FIRST (TDD)
- [ ] AAA pattern used (see test-patterns.md)
- [ ] Coverage ≥ 75% (90% for services)
- [ ] All edge cases tested

### Review Gate
Load: checkpoint-framework.md#review
- [ ] Code review passed
- [ ] Security audit passed (for sensitive code)
- [ ] All quality checks passed

## Executable Validation

Run deterministic checks:
```bash
python .claude/skills/quality-gates/validate.py --file src/services/auth.ts
```

See: validation-rules.md for detailed criteria
```

**validate.py Implementation:**
```python
#!/usr/bin/env python3
"""
Quality Gates Validation Script
Runs deterministic checks without loading into context
"""
import re
import sys
from pathlib import Path

def validate_typescript_strict(file_path):
    """Check TypeScript strict mode compliance"""
    content = Path(file_path).read_text()
    errors = []

    # Check for 'any' type
    if re.search(r':\s*any\b', content):
        errors.append(f"Found 'any' type usage")

    # Check for @ts-ignore
    if '@ts-ignore' in content:
        errors.append(f"Found @ts-ignore comment")

    # Check for non-null assertion
    if re.search(r'\w+!\.', content):
        errors.append(f"Found non-null assertion (!)")

    # Check for console.log in production
    if 'console.log' in content and 'test' not in file_path:
        errors.append(f"Found console.log in production code")

    return errors

def validate_test_coverage(file_path):
    """Check test coverage requirements"""
    # Implementation for coverage checking
    pass

def main():
    if len(sys.argv) < 2:
        print("Usage: validate.py --file <path>")
        sys.exit(1)

    file_path = sys.argv[2]
    errors = validate_typescript_strict(file_path)

    if errors:
        print(f"❌ Validation failed for {file_path}")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print(f"✅ Validation passed for {file_path}")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

**Deliverables:**
- [ ] SKILL.md with checkpoint framework
- [ ] validation-rules.md with detailed TypeScript/security rules
- [ ] test-patterns.md with AAA pattern examples
- [ ] checkpoint-framework.md with gate definitions
- [ ] validate.py executable script
- [ ] Test the skill by loading it manually

---

#### Task 1.2: Create `architecture-patterns` Skill (2 hours)

**Structure:**
```
.claude/skills/architecture-patterns/
├── SKILL.md (pattern index, ~100 lines)
├── nextjs-patterns.md (App Router, RSC, Server Actions)
├── typescript-conventions.md (strict mode, type patterns)
├── database-patterns.md (Drizzle ORM patterns)
├── state-management-patterns.md (React Query, useState, Context)
└── api-patterns.md (Zod validation, error handling)
```

**SKILL.md Contents:**
```markdown
---
name: architecture-patterns
description: >
  Organizational coding patterns for Sentra.
  Use when implementing features to follow established conventions.
---

# Architecture Patterns Skill

## Pattern Categories

### Data Fetching
- **pattern-sse-reactive-data**: Real-time updates via Server-Sent Events
- **pattern-rsc-data-fetching**: Server Components for initial data
See: nextjs-patterns.md#data-fetching

### State Management
- **pattern-react-query-state**: Server state management
- **pattern-usestate-local-ui**: Local UI state
- **pattern-context-shared-ui**: Shared UI state
See: state-management-patterns.md

### Type Safety
- **pattern-typescript-strict**: No any, explicit types
- **pattern-type-guards**: Runtime type validation
See: typescript-conventions.md

### API Design
- **pattern-zod-validation**: Input validation with Zod
- **pattern-error-handling**: Custom error classes
See: api-patterns.md

### Database
- **pattern-drizzle-orm**: Drizzle query patterns
- **pattern-transactions**: Transaction handling
See: database-patterns.md

## Usage

When implementing features:
1. Identify applicable patterns based on requirements
2. Load relevant pattern file (e.g., nextjs-patterns.md)
3. Follow pattern structure exactly
4. Reuse existing helpers/hooks
5. Verify pattern compliance in tests
```

**Migrate from `.sentra/memory/patterns.md`:**
- Extract patterns into separate files
- Add pattern IDs for easy reference
- Add code examples for each pattern
- Add anti-patterns (what NOT to do)

**Deliverables:**
- [ ] SKILL.md with pattern index
- [ ] nextjs-patterns.md with App Router patterns
- [ ] typescript-conventions.md with strict mode patterns
- [ ] database-patterns.md with Drizzle patterns
- [ ] state-management-patterns.md with state patterns
- [ ] api-patterns.md with API patterns

---

#### Task 1.3: Create `code-review-standards` Skill (1-2 hours)

**Structure:**
```
.claude/skills/code-review-standards/
├── SKILL.md (review framework, ~100 lines)
├── security-checklist.md (OWASP Top 10, auth, crypto)
├── performance-criteria.md (N+1 queries, caching, lazy loading)
├── maintainability-rules.md (naming, dead code, comments)
└── review-templates.md (verdict templates, severity levels)
```

**SKILL.md Contents:**
```markdown
---
name: code-review-standards
description: >
  Code review criteria for Sentra.
  Use when reviewing code for quality, security, and maintainability.
---

# Code Review Standards Skill

## Review Checklist

### 1. Correctness
- Logic correct for all test cases
- Edge cases handled (null, empty, max, min)
- Error conditions handled
Load: maintainability-rules.md#correctness

### 2. Security
- No SQL injection vulnerabilities
- No XSS vulnerabilities
- Secrets in environment variables
Load: security-checklist.md

### 3. Performance
- No N+1 query problems
- Proper caching strategy
- Async operations parallelized
Load: performance-criteria.md

### 4. Maintainability
- Clear naming conventions
- No dead code
- Proper error messages
Load: maintainability-rules.md

## Severity Levels
See: review-templates.md#severity-levels
- 🚨 Critical (MUST fix): Security, data corruption
- ⚠️ High (Should fix): Logic bugs, missing edge cases
- ℹ️ Medium (Nice to fix): Performance, duplication
- 💡 Low (Optional): Style, comments

## Review Verdict Templates
See: review-templates.md#verdicts
- ⛔ BLOCKED: Critical issues
- ✅ APPROVED: No blocking issues
- ⚠️ APPROVED WITH CONDITIONS: Fix in follow-up
```

**Deliverables:**
- [ ] SKILL.md with review framework
- [ ] security-checklist.md with OWASP criteria
- [ ] performance-criteria.md with performance rules
- [ ] maintainability-rules.md with code quality rules
- [ ] review-templates.md with verdict templates

---

## Phase 2: Agent Integration (4-6 hours)

### Priority: HIGH
### Goal: Add `skills:` field to all agents and refactor to use skills

#### Task 2.1: Add `skills:` Field to Agent YAML (1 hour)

**For each agent, add skills field:**

**implementation.md:**
```yaml
---
name: implementation
description: Writes implementation code to make failing tests pass
tools: Read, Write, Edit, Grep, Glob, Bash
skills: [quality-gates, architecture-patterns, typescript-strict-guard, tdd-enforcer]
model: sonnet
---
```

**code-reviewer.md:**
```yaml
---
name: code-reviewer
description: Reviews implementation for bugs, edge cases, and quality
tools: Read, Grep, Glob, Bash
skills: [code-review-standards, quality-gates, security-sentinel, typescript-strict-guard]
model: sonnet
---
```

**test-writer.md:**
```yaml
---
name: test-writer
description: Writes tests BEFORE implementation (TDD)
tools: Read, Write, Edit, Grep, Glob, Bash
skills: [quality-gates, tdd-enforcer, architecture-patterns]
model: sonnet
---
```

**orchestrator.md:**
```yaml
---
name: orchestrator
description: Plans work and coordinates specialized agents
tools: Task, Read, Grep, Glob, AskUserQuestion
skills: [architecture-patterns, quality-gates]
model: opus
---
```

**security-auditor.md:**
```yaml
---
name: security-auditor
description: Audits code for security vulnerabilities
tools: Read, Grep, Glob, Bash
skills: [security-sentinel, code-review-standards]
model: sonnet
---
```

**Complete Agent Skills Matrix:**
| Agent | Skills |
|-------|--------|
| implementation | quality-gates, architecture-patterns, typescript-strict-guard, tdd-enforcer |
| code-reviewer | code-review-standards, quality-gates, security-sentinel, typescript-strict-guard |
| test-writer | quality-gates, tdd-enforcer, architecture-patterns |
| test-runner | quality-gates |
| orchestrator | architecture-patterns, quality-gates |
| security-auditor | security-sentinel, code-review-standards |
| refactoring-agent | architecture-patterns, typescript-strict-guard, quality-gates |
| architecture-advisor | architecture-patterns, nextjs-15-specialist |
| meta-orchestrator | architecture-patterns, quality-gates |
| codebase-archaeologist | architecture-patterns |
| voice-architect | voice-system-expert |

**Deliverables:**
- [ ] Update all 11 agent YAML frontmatters with skills field
- [ ] Document agent-skill mappings

---

#### Task 2.2: Refactor Agent Prompts to Reference Skills (3-5 hours)

**Current Problem:** Knowledge duplicated inline

**Example - implementation.md before:**
```markdown
### TypeScript Strict Mode

**DO:**
```typescript
// Explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```
[100 more lines of TypeScript examples...]
```

**Example - implementation.md after:**
```markdown
### TypeScript Strict Mode

Follow typescript-strict-guard skill for all type requirements.

Quick reference:
- No `any` types → Use explicit types or `unknown` with type guards
- No `@ts-ignore` → Fix underlying issue
- Explicit return types → All functions must declare return type

For detailed rules and examples, reference:
- typescript-strict-guard skill (auto-loaded)
- quality-gates skill → validation-rules.md#typescript
```

**Refactoring Strategy:**

1. **Identify duplicated knowledge:**
   - Grep for TypeScript rules across agents
   - Grep for security examples across agents
   - Grep for testing patterns across agents

2. **Replace with skill references:**
   - Keep brief summary (3-5 bullet points)
   - Add "For details, see [skill-name]"
   - Remove duplicated examples

3. **Reduce agent prompt size:**
   - implementation.md: 507 lines → target 250 lines
   - code-reviewer.md: 449 lines → target 200 lines
   - test-writer.md: (via tdd-enforcer) → verify no duplication

**Deliverables:**
- [ ] Refactor implementation.md to reference skills
- [ ] Refactor code-reviewer.md to reference skills
- [ ] Refactor orchestrator.md to reference skills
- [ ] Verify no knowledge duplication across agents
- [ ] Measure prompt size reduction (target: 40-50%)

---

## Phase 3: Progressive Disclosure Enhancement (4 hours)

### Priority: MEDIUM
### Goal: Add supporting files to existing skills for progressive disclosure

#### Task 3.1: Enhance `tdd-enforcer` Skill (1 hour)

**Current:** Single SKILL.md file (476 lines)

**Refactor to:**
```
.claude/skills/tdd-enforcer/
├── SKILL.md (core TDD workflow, ~100 lines)
├── aaa-pattern.md (Arrange-Act-Assert examples)
├── test-structure.md (describe blocks, test names)
├── coverage-requirements.md (75%/90% thresholds)
└── test-quality-checklist.md (behavior vs implementation, edge cases)
```

**SKILL.md becomes index:**
```markdown
# TDD Workflow Enforcer

## TDD Process (MANDATORY)
1. Write tests FIRST (RED)
2. Verify tests fail
3. Write implementation (GREEN)
4. Verify tests pass
5. Refactor (REFACTOR)

## Test Structure
See: aaa-pattern.md for examples
See: test-structure.md for organization

## Coverage Requirements
See: coverage-requirements.md
- Overall: 75%+
- Business Logic: 90%+
- UI Components: 60%+

## Test Quality
See: test-quality-checklist.md
```

**Deliverables:**
- [ ] Refactor tdd-enforcer SKILL.md
- [ ] Create aaa-pattern.md with examples
- [ ] Create test-structure.md with organization rules
- [ ] Create coverage-requirements.md with thresholds
- [ ] Create test-quality-checklist.md

---

#### Task 3.2: Enhance `typescript-strict-guard` Skill (1 hour)

**Current:** Single SKILL.md file (386 lines)

**Refactor to:**
```
.claude/skills/typescript-strict-guard/
├── SKILL.md (core requirements, ~80 lines)
├── violation-fixes.md (common violations and solutions)
├── type-guard-patterns.md (type guard examples)
├── generic-patterns.md (generic type usage)
└── react-typescript-patterns.md (React-specific types)
```

**Deliverables:**
- [ ] Refactor typescript-strict-guard SKILL.md
- [ ] Create violation-fixes.md
- [ ] Create type-guard-patterns.md
- [ ] Create generic-patterns.md
- [ ] Create react-typescript-patterns.md

---

#### Task 3.3: Enhance `security-sentinel` Skill (1 hour)

**Add supporting files:**
```
.claude/skills/security-sentinel/
├── SKILL.md (security overview)
├── owasp-top-10.md (detailed OWASP criteria)
├── auth-security.md (authentication best practices)
├── data-protection.md (encryption, sensitive data)
└── api-security.md (rate limiting, validation)
```

---

#### Task 3.4: Enhance Remaining Skills (1 hour)

- nextjs-15-specialist
- sentra-architect
- semantic-code-hunter
- voice-system-expert

Add 2-3 supporting files each for progressive disclosure.

---

## Phase 4: Validation & Testing (2 hours)

### Task 4.1: Test Skill Loading (1 hour)

**Verify:**
1. Agents auto-load skills specified in YAML
2. Skills load metadata first (~100 tokens)
3. Full skill content loads when referenced
4. Supporting files load on-demand
5. Executable code runs without loading into context

**Test Cases:**
```bash
# Test 1: Implementation agent loads quality-gates automatically
claude "Implement user registration" --agent implementation

# Test 2: Code reviewer loads code-review-standards automatically
claude "Review auth.ts" --agent code-reviewer

# Test 3: Validate executable runs
python .claude/skills/quality-gates/validate.py --file src/services/auth.ts
```

**Deliverables:**
- [ ] Test each agent loads specified skills
- [ ] Verify progressive disclosure works
- [ ] Verify executable validation works

---

### Task 4.2: Update Documentation (1 hour)

**Update CLAUDE.md:**
```markdown
## Agent + Skill Architecture

Sentra follows Anthropic's integrated agent + skill architecture:

**Skills = Cross-cutting expertise**
- quality-gates: Validation framework for all agents
- architecture-patterns: Organizational coding standards
- code-review-standards: Review criteria
- [7 more skills]

**Agents = Execution specialists**
- implementation: Writes code using quality-gates + architecture-patterns
- code-reviewer: Reviews using code-review-standards + security-sentinel
- [9 more agents]

**Integration:**
- Agents auto-load skills via YAML `skills:` field
- Skills use progressive disclosure (metadata → full content → supporting files)
- Executable skill code runs deterministically (0 tokens)

See: .claude/docs/INTEGRATED-ARCHITECTURE-ASSESSMENT.md for details
```

**Update Agent Documentation:**
- Document which skills each agent uses
- Document skill loading behavior
- Document progressive disclosure pattern

**Deliverables:**
- [ ] Update CLAUDE.md with architecture explanation
- [ ] Update agent documentation
- [ ] Create skill usage guide for developers

---

## Success Criteria

**Phase 1 Complete:**
- [ ] quality-gates skill exists with validate.py
- [ ] architecture-patterns skill exists with pattern files
- [ ] code-review-standards skill exists with checklists

**Phase 2 Complete:**
- [ ] All agents have `skills:` field in YAML
- [ ] Agent prompts reference skills instead of duplicating
- [ ] Prompt size reduced by 40-50%

**Phase 3 Complete:**
- [ ] All skills have progressive disclosure files
- [ ] Supporting files load on-demand
- [ ] Metadata loads first (~100 tokens)

**Phase 4 Complete:**
- [ ] Skill loading tested and verified
- [ ] Documentation updated
- [ ] Architecture 100% compliant with Anthropic's vision

---

## Rollout Strategy

### Week 1: Foundation
- Day 1-2: Phase 1 (core skills)
- Day 3-4: Phase 2 Task 2.1 (add skills field)
- Day 5: Phase 2 Task 2.2 (refactor implementation.md)

### Week 2: Completion
- Day 1-2: Phase 2 Task 2.2 continued (refactor remaining agents)
- Day 3-4: Phase 3 (progressive disclosure)
- Day 5: Phase 4 (validation & docs)

**Total Time:** 2 weeks with one developer
**Effort:** 12-16 hours development + 4 hours testing/docs = 16-20 hours

---

## Benefits After Migration

### 1. Knowledge Composition (Not Duplication)
- Quality standards in ONE place (quality-gates skill)
- Changes propagate automatically to all agents
- No drift between agent implementations

### 2. Context Efficiency
- Metadata loads first (~100 tokens)
- Full content loads when needed (~2k tokens)
- Supporting files load on-demand (~5k tokens)
- **Estimated token savings: 40-50% per agent invocation**

### 3. Maintainability
- Update skill once → affects all agents
- Clear separation of concerns (knowledge vs execution)
- Easy to add new agents (just reference existing skills)

### 4. Scalability
- Add new patterns without touching agents
- Add new validation rules without touching agents
- Onboard new developers faster (read skills, understand system)

### 5. Quality
- Deterministic validation via executable code
- Consistent standards enforcement
- Progressive quality gates prevent bugs earlier

---

## Risk Mitigation

**Risk 1:** Agents don't load skills correctly
- Mitigation: Test each agent individually in Phase 4
- Rollback: Keep old agents in `.claude/agents.backup/`

**Risk 2:** Progressive disclosure doesn't work as expected
- Mitigation: Start with one skill (quality-gates), verify before continuing
- Rollback: Keep single-file SKILLs in backup folder

**Risk 3:** Refactoring introduces regressions
- Mitigation: Run full test suite after each phase
- Rollback: Git branches for each phase

---

## Next Steps

**Immediate:**
1. Review this plan with Glen
2. Get approval for phased approach
3. Create git branch: `feature/integrated-architecture-migration`

**Phase 1 Start:**
1. Create quality-gates skill (Task 1.1)
2. Test with implementation agent
3. Verify validate.py works
4. Continue to architecture-patterns (Task 1.2)

---

*Last updated: 2025-11-23 by Claude Code*
