# Agent × Skills Matrix

This matrix shows which skills each agent uses. Agents are kept small by referencing comprehensive skills.

## Matrix View

| Agent | quality-gates | architecture-patterns | code-review-standards | typescript-strict-guard | nextjs-15-specialist | drizzle-orm-patterns | react-19-patterns | zod-validation-patterns | security-sentinel | tdd-enforcer | voice-system-expert | quetrex-architect | semantic-code-hunter |
|-------|--------------|---------------------|---------------------|----------------------|-------------------|-------------------|------------------|----------------------|------------------|-------------|-------------------|----------------|-------------------|
| **orchestrator** | ✅ | ✅ | | | | | | | | | | | |
| **test-writer** | ✅ | ✅ | | | | | | | | ✅ | | | |
| **implementation** | ✅ | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ | | | | | |
| **code-reviewer** | ✅ | ✅ | ✅ | ✅ | ✅ | | | | ✅ | | | | |
| **test-runner** | ✅ | | | | | | | | | | | | |
| **security-auditor** | | | ✅ | | | | | | ✅ | | | | |
| **refactoring-agent** | ✅ | ✅ | | ✅ | | | | | | | | | |
| **architecture-advisor** | | ✅ | | | ✅ | ✅ | | | | | | | |
| **meta-orchestrator** | ✅ | ✅ | | | | | | | | | | | |
| **codebase-archaeologist** | | ✅ | | | | | | | | | | | ✅ |
| **voice-architect** | | | | | ✅ | | | | | | ✅ | | |

## Skill Usage Statistics

| Skill | Used By (# agents) | Agents |
|-------|-------------------|---------|
| **quality-gates** | 7 | orchestrator, test-writer, implementation, code-reviewer, test-runner, refactoring-agent, meta-orchestrator |
| **architecture-patterns** | 7 | orchestrator, test-writer, implementation, code-reviewer, refactoring-agent, architecture-advisor, meta-orchestrator, codebase-archaeologist |
| **typescript-strict-guard** | 3 | implementation, code-reviewer, refactoring-agent |
| **nextjs-15-specialist** | 3 | implementation, code-reviewer, architecture-advisor, voice-architect |
| **code-review-standards** | 2 | code-reviewer, security-auditor |
| **security-sentinel** | 2 | code-reviewer, security-auditor |
| **drizzle-orm-patterns** | 2 | implementation, architecture-advisor |
| **react-19-patterns** | 1 | implementation |
| **zod-validation-patterns** | 1 | implementation |
| **tdd-enforcer** | 1 | test-writer |
| **voice-system-expert** | 1 | voice-architect |
| **semantic-code-hunter** | 1 | codebase-archaeologist |
| **quetrex-architect** | 0 | (available for all agents via main context) |

## Agent Details

### orchestrator (297 lines)
**Purpose:** Plans work, coordinates specialized agents
**Skills:** quality-gates, architecture-patterns
**Model:** opus (planning requires reasoning)

### test-writer (181 lines)
**Purpose:** Writes tests FIRST (TDD)
**Skills:** quality-gates, tdd-enforcer, architecture-patterns
**Model:** sonnet

### implementation (221 lines)
**Purpose:** Makes tests pass with production-quality code
**Skills:** quality-gates, architecture-patterns, typescript-strict-guard, nextjs-15-specialist, drizzle-orm-patterns, react-19-patterns, zod-validation-patterns
**Model:** sonnet
**Note:** Most skill-heavy agent (7 skills) - needs comprehensive knowledge to write correct code

### code-reviewer (175 lines)
**Purpose:** Finds bugs, edge cases, quality issues before production
**Skills:** code-review-standards, quality-gates, security-sentinel, typescript-strict-guard, nextjs-15-specialist, architecture-patterns
**Model:** sonnet
**Note:** Second most skill-heavy (6 skills) - needs broad knowledge to catch all issue types

### test-runner (451 lines)
**Purpose:** Runs tests, reports coverage
**Skills:** quality-gates
**Model:** sonnet

### security-auditor (456 lines)
**Purpose:** OWASP Top 10 security audits
**Skills:** security-sentinel, code-review-standards
**Model:** sonnet

### refactoring-agent (392 lines)
**Purpose:** Improves code quality without changing behavior
**Skills:** architecture-patterns, typescript-strict-guard, quality-gates
**Model:** sonnet

### architecture-advisor (841 lines)
**Purpose:** Makes architecture decisions, pattern selection
**Skills:** architecture-patterns, nextjs-15-specialist, drizzle-orm-patterns
**Model:** opus (architecture requires reasoning)

### meta-orchestrator (1,306 lines)
**Purpose:** Multi-project orchestration, high-level planning
**Skills:** architecture-patterns, quality-gates
**Model:** opus (meta-level planning requires reasoning)

### codebase-archaeologist (1,538 lines)
**Purpose:** Code discovery, understanding existing patterns
**Skills:** architecture-patterns, semantic-code-hunter
**Model:** opus (deep analysis requires reasoning)

### voice-architect (1,234 lines)
**Purpose:** Voice feature planning, requirements gathering
**Skills:** voice-system-expert, nextjs-15-specialist
**Model:** opus (complex feature planning requires reasoning)

## Size Comparison: Before vs After Refactoring

| Agent | Before (lines) | After (lines) | Reduction | % Reduction |
|-------|---------------|--------------|-----------|------------|
| implementation | 507 | 221 | -286 | 56.4% |
| code-reviewer | 448 | 175 | -273 | 60.9% |
| test-writer | 466 | 181 | -285 | 61.2% |
| test-runner | 450 | 451 | +1 | +0.2% (skills added) |
| orchestrator | 296 | 297 | +1 | +0.3% (skills added) |
| security-auditor | 455 | 456 | +1 | +0.2% (skills added) |
| refactoring-agent | 391 | 392 | +1 | +0.3% (skills added) |
| architecture-advisor | 841 | 841 | 0 | 0% (already large, skills added) |
| meta-orchestrator | 1,305 | 1,306 | +1 | +0.1% (skills added) |
| codebase-archaeologist | 1,537 | 1,538 | +1 | +0.1% (skills added) |
| voice-architect | 1,234 | 1,234 | 0 | 0% (already large, skills added) |
| **TOTAL** | **7,929** | **7,092** | **-837** | **10.6%** |

**Note:** The 3 heavily-refactored agents (implementation, code-reviewer, test-writer) achieved 56-61% size reduction by removing duplicated content and referencing skills instead. Other agents only had `skills:` field added with minimal size change.

## Integration Layer: quality-gates/validate.py

The `validate.py` aggregator runs all skill validators:

```python
validators = [
    Validator("TypeScript Strict Mode", "typescript-strict-guard/validate-types.py"),
    Validator("Security Vulnerabilities", "security-sentinel/validate-security.py"),
    Validator("Next.js Patterns", "nextjs-15-specialist/validate-patterns.py"),
    Validator("Database Queries", "drizzle-orm-patterns/validate-queries.py"),
    Validator("React 19 Patterns", "react-19-patterns/validate-react.py"),
]
```

**Run all validators:**
```bash
.claude/skills/quality-gates/validate.py
```

**Exit codes:**
- 0: All validators passed
- 1: One or more validators failed

**Used by:**
- Pre-commit hooks (blocks commits on failure)
- CI/CD pipeline (blocks merges on failure)
- Agents (validates before finishing work)

## Benefits of Agent + Skill Architecture

### 1. Knowledge Reuse
- TypeScript standards defined ONCE in typescript-strict-guard
- Referenced by 3 agents (implementation, code-reviewer, refactoring-agent)
- Update once → all 3 agents benefit

### 2. Smaller Agents
- implementation: 507 → 221 lines (56% reduction)
- code-reviewer: 448 → 175 lines (61% reduction)
- test-writer: 466 → 181 lines (61% reduction)
- Easier to understand, faster to load

### 3. Deeper Skills
- nextjs-15-specialist: 6,215 lines of comprehensive patterns
- drizzle-orm-patterns: 7,840 lines of database expertise
- Skills can be as detailed as needed without bloating agents

### 4. Progressive Disclosure
- Agents load SKILL.md first (metadata, ~300 lines)
- Load detailed files only when needed
- Prevents token budget exhaustion

### 5. Quality Enforcement
- 5 validators (Python scripts) enforce standards
- quality-gates/validate.py aggregates all
- Pre-commit hook blocks violations
- CI/CD enforces before merge

### 6. Clear Separation
- **Agents** = workflow, process, orchestration
- **Skills** = technical knowledge, patterns, standards
- **Validators** = automated quality enforcement

## Future Improvements

### Short Term
- Add more validators (React patterns, Zod validation)
- Create skill dependency graph visualization
- Add skill version tracking

### Long Term
- Auto-generate skill documentation from code analysis
- Machine learning to suggest which skills to add to new agents
- Skill effectiveness metrics (catch rate, false positives)

---

**Last updated:** 2025-11-23 (Team 7 integration layer)
