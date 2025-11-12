# Architecture Intelligence System - Phase 1

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Created:** 2025-11-12
**Last Updated:** 2025-11-12

---

## Overview

The Architecture Intelligence System is a 3-phase AI-powered system that helps establish, maintain, and enforce architectural patterns in the Sentra project. This document describes **Phase 1**, which provides:

1. **Default Patterns** - Comprehensive architectural pattern library
2. **Codebase Scanner** - Automated pattern detection and conflict identification
3. **Architecture Advisor Agent** - AI assistant for architectural decisions

---

## Components

### 1. Default Architectural Patterns

**File:** `.sentra/memory/patterns.md`

A comprehensive library of 15 architectural patterns covering:

- **Data Fetching** (3 patterns)
  - Server-Sent Events for reactive data
  - Tauri Events for native desktop apps
  - React Server Components for initial loads

- **State Management** (3 patterns)
  - React Query for server state
  - useState for local UI state
  - Context API for shared UI state

- **API Design** (2 patterns)
  - Zod validation for all inputs
  - REST API with standard methods

- **Component Architecture** (1 pattern)
  - Client component boundaries ('use client')

- **Code Quality** (1 pattern)
  - TypeScript strict mode

- **Security** (3 patterns)
  - Environment variable validation
  - SQL injection prevention (Prisma ORM)
  - XSS prevention

- **Performance** (1 pattern)
  - Next.js Image optimization

- **Testing** (2 patterns)
  - AAA test structure
  - Coverage thresholds

Each pattern includes:
- When to use / when NOT to use
- Complete implementation code
- Detection rules for scanner
- Validation criteria
- Testing requirements
- Good and bad examples

**Usage:**
```bash
# View patterns
cat .sentra/memory/patterns.md

# Patterns are automatically loaded by Architecture Advisor Agent
```

---

### 2. Codebase Architecture Scanner

**File:** `.claude/scripts/architecture-scanner.py`

A Python script that scans your entire codebase to:

- Detect which patterns are used and where
- Identify architectural conflicts (multiple patterns for same problem)
- Find anti-patterns (code smells)
- Generate comprehensive reports
- Provide recommendations

**Usage:**
```bash
# JSON output (for parsing)
python3 .claude/scripts/architecture-scanner.py .

# Markdown report (for reading)
python3 .claude/scripts/architecture-scanner.py . --format=markdown

# Save to file
python3 .claude/scripts/architecture-scanner.py . --format=markdown --output=report.md

# Scan specific directory
python3 .claude/scripts/architecture-scanner.py /path/to/project
```

**Example Output:**
```
📊 ARCHITECTURE ANALYSIS COMPLETE

Found 28 patterns across 11 files.

⚠️ Conflicts (2 found):

1. Data Fetching (HIGH priority)
   - Server-Sent Events: 1 file
   - Polling: 1 file
   Recommendation: Standardize on Server-Sent Events

2. State Management (MEDIUM priority)
   - React Query: 1 file
   - useState: 4 files
   - Context: 1 file
   Recommendation: Use React Query for server state

✅ Consistent Areas:
- TypeScript: Strict mode enabled
- Component Architecture: Good client boundaries

💡 Recommendations:
- ⚠️ Standardize data fetching on SSE
- ❌ Remove 2 instances of 'any' type
- ❌ Remove 2 instances of '@ts-ignore'
```

**What it detects:**

✅ **Patterns:**
- SSE, Tauri Events, React Server Components
- React Query, useState, Context, Zustand
- Zod validation, REST APIs
- Client components ('use client')
- TypeScript strict mode
- Security patterns
- Performance patterns
- Testing patterns

❌ **Anti-patterns:**
- Fetch in useEffect
- Polling with setInterval
- TypeScript `any` types
- `@ts-ignore` comments
- Regular `<img>` tags (instead of next/image)
- dangerouslySetInnerHTML without sanitization
- Raw SQL queries

**Customization:**

Add new patterns by editing the scanner:

```python
# .claude/scripts/architecture-scanner.py

def detect_your_pattern(self, files: List[Path]) -> List[PatternUsage]:
    """Detect your custom pattern"""
    patterns = []

    # Define detection regex
    pattern = re.compile(r'your-pattern-regex')

    patterns.extend(
        self.search_pattern(
            files,
            'pattern-your-id',
            'Your Pattern Name',
            'category',
            pattern
        )
    )

    return patterns
```

---

### 3. Architecture Advisor Agent

**File:** `.claude/agents/architecture-advisor.md`

An AI agent specialized in architectural decisions. It:

- Analyzes requirements and existing codebases
- Proposes solutions with clear tradeoffs
- Helps users make informed decisions
- Documents patterns and decisions
- Creates implementation and refactoring plans

**How to use:**

1. **Invoke the agent:**
   ```
   @architecture-advisor
   ```

2. **For new projects:**
   ```
   I'm building [description of project].
   I need to [specific requirement].
   What architectural approach should I use?
   ```

   The agent will:
   - Ask clarifying questions
   - Propose 2-3 options with pros/cons
   - Provide recommendation
   - Show code examples
   - Document the decision

3. **For existing projects:**
   ```
   Analyze my codebase architecture and identify issues
   ```

   The agent will:
   - Run the scanner
   - Present findings
   - Identify conflicts
   - Recommend solutions
   - Create refactoring plan

**Example Dialog:**

```
User: I need real-time updates for my dashboard

Agent:
I'll help you choose the right approach. Let me ask a few questions:

1. Is this for native desktop (Tauri) or web?
2. How many concurrent users?
3. Update frequency needed?

[User answers: Native desktop, 10 users, every 2 seconds]

Agent:
Perfect! For a native Tauri app with 10 users and 2-second updates,
I recommend: Tauri Events

Why?
✅ Native performance (< 50ms latency)
✅ Built into Tauri (no extra dependencies)
✅ Automatic type safety across Rust/TS boundary
✅ Perfect for your scale

[Shows code example]

Shall I document this as your data fetching pattern?

[User: Yes]

Agent:
✅ Documented in .sentra/memory/patterns.md
✅ Created detailed guide in docs/architecture/DATA-FETCHING.md
✅ Updated CLAUDE.md with quick reference

Next steps:
- [ ] Implement base hook: hooks/useTauriEvent.ts
- [ ] Add event emission to Rust backend
- [ ] Create example component
```

**Agent capabilities:**

- ✅ Asks clarifying questions
- ✅ Presents multiple options with tradeoffs
- ✅ Shows concrete code examples
- ✅ Documents decisions in 3 places
- ✅ Creates actionable implementation plans
- ✅ Runs architecture scanner
- ✅ Identifies conflicts and anti-patterns
- ✅ Creates refactoring plans with estimates

---

### 4. Documentation Template

**File:** `docs/architecture/TEMPLATE.md`

A comprehensive template for creating detailed architecture documentation. Use it when documenting new patterns.

**Structure:**
- Overview
- Core Principle
- Primary Pattern (implementation, testing, examples)
- Alternative Patterns (with tradeoffs)
- Migration Guide
- Validation & Enforcement
- Troubleshooting
- References
- Decision Log
- Appendix

**Usage:**
```bash
# Copy template
cp docs/architecture/TEMPLATE.md docs/architecture/YOUR-CATEGORY.md

# Fill in all [placeholders]
# Delete template instructions
# Review and approve
```

**Example:** See `docs/architecture/DATA-FETCHING.md` for a complete example.

---

## Workflows

### Workflow 1: Establishing Architecture for New Project

**Scenario:** Starting a new project, need to establish architectural patterns.

**Steps:**

1. **Invoke Architecture Advisor Agent**
   ```
   @architecture-advisor

   I'm starting a new [type] project with [requirements].
   Help me establish the architecture.
   ```

2. **Answer clarifying questions**
   - The agent will ask about scale, performance, team, infrastructure

3. **Review proposed options**
   - Agent presents 2-3 approaches with pros/cons
   - Read code examples
   - Consider tradeoffs

4. **Make decision**
   - Agent uses `AskUserQuestion` to get your choice
   - Or type your preference

5. **Review documentation**
   - Agent documents pattern in `.sentra/memory/patterns.md`
   - Creates detailed doc in `docs/architecture/[CATEGORY].md`
   - Updates `CLAUDE.md` with quick reference

6. **Follow implementation plan**
   - Agent creates concrete TODO list
   - Can create GitHub issues (optional)
   - Offers to implement code or provide guidance

**Time:** 15-30 minutes per major architectural decision

---

### Workflow 2: Analyzing Existing Codebase

**Scenario:** Existing codebase, want to identify architectural issues.

**Steps:**

1. **Run architecture scanner manually** (optional first step)
   ```bash
   python3 .claude/scripts/architecture-scanner.py . --format=markdown --output=report.md
   ```

2. **Or invoke agent to run it**
   ```
   @architecture-advisor

   Analyze my codebase architecture and identify issues
   ```

3. **Review findings**
   - Agent presents summary of patterns found
   - Highlights conflicts (HIGH/MEDIUM/LOW priority)
   - Shows consistent areas
   - Lists anti-patterns

4. **Prioritize issues**
   - Agent recommends order to tackle issues
   - Provides effort estimates

5. **Choose issue to resolve**
   - Agent presents options for standardization
   - Shows tradeoffs and impact

6. **Get refactoring plan**
   - Agent creates detailed plan with file-by-file breakdown
   - Provides time estimates
   - Offers to help with implementation

**Time:** 30-60 minutes for analysis + planning

---

### Workflow 3: Making a Specific Architectural Decision

**Scenario:** Building a feature, need to choose approach.

**Steps:**

1. **Ask agent for advice**
   ```
   @architecture-advisor

   I need to [specific requirement].
   What pattern should I use?
   ```

2. **Provide context** (if agent asks)
   - Scale, performance needs, constraints

3. **Review options**
   - Agent shows 2-3 approaches
   - Code examples for each
   - Pros/cons clearly explained

4. **Make choice**
   - Select option or propose alternative

5. **Get implementation**
   - Agent provides complete code
   - Shows where to put files
   - Includes tests

6. **Documentation updated**
   - Pattern added to patterns.md (if new)
   - Project-specific decision documented

**Time:** 10-20 minutes

---

### Workflow 4: Migrating/Refactoring Existing Code

**Scenario:** Want to standardize codebase on approved patterns.

**Steps:**

1. **Identify scope**
   ```bash
   python3 .claude/scripts/architecture-scanner.py .
   ```

2. **Get migration plan from agent**
   ```
   @architecture-advisor

   I want to standardize [category] on [pattern].
   Create a migration plan.
   ```

3. **Agent creates plan**
   - Phase 1: Infrastructure setup
   - Phase 2: File-by-file migration
   - Phase 3: Validation
   - Includes time estimates

4. **Choose implementation approach**
   - Agent does it (automated)
   - Guided (you do it with help)
   - Gradual (as-needed basis)

5. **Execute migration**
   - Follow plan
   - Agent reviews each file
   - Run tests continuously

6. **Validate**
   ```bash
   python3 .claude/scripts/architecture-scanner.py .
   ```
   - Verify consistency
   - Check metrics

**Time:** Varies by scope (2 hours to 2 days)

---

## Integration with Development Process

### During Development

**Before implementing a feature:**
1. Check patterns.md for existing patterns
2. If uncertain, ask Architecture Advisor Agent
3. Follow documented pattern
4. Write tests using AAA structure

**During code review:**
1. Check pattern compliance
2. Run architecture scanner
3. Verify documentation updated

**In CI/CD:**
```yaml
# .github/workflows/architecture-validation.yml
- name: Validate Architecture
  run: |
    python3 .claude/scripts/architecture-scanner.py . --format=json > report.json
    # Add validation that fails CI if critical issues found
```

### Weekly/Monthly

**Architecture Review:**
1. Run scanner on main branch
2. Track metrics over time:
   - Pattern consistency score
   - Anti-pattern count
   - Test coverage
3. Identify technical debt
4. Plan refactoring sprints

---

## Metrics

Track these metrics to measure architectural health:

### Pattern Consistency Score
```
Consistency = (Files following pattern) / (Total files in category) * 100
Target: 95%+
```

### Anti-Pattern Count
```
Count of:
- any types
- @ts-ignore
- fetch in useEffect
- polling
- img tags
Target: 0
```

### Test Coverage
```
Overall: 75%+
Business Logic: 90%+
Utilities: 90%+
```

### Documentation Coverage
```
(Documented patterns) / (Detected patterns) * 100
Target: 100%
```

**View metrics:**
```bash
python3 .claude/scripts/architecture-scanner.py . --format=json | jq '.summary'
```

---

## Best Practices

### For Users (Developers)

**DO:**
- ✅ Consult patterns.md before implementing features
- ✅ Ask Architecture Advisor Agent when uncertain
- ✅ Document new patterns immediately
- ✅ Run scanner regularly
- ✅ Follow documented patterns consistently
- ✅ Update documentation when patterns change

**DON'T:**
- ❌ Invent new patterns without discussion
- ❌ Skip documentation ("we'll do it later")
- ❌ Ignore scanner warnings
- ❌ Use anti-patterns knowingly
- ❌ Leave TODOs without issues

### For Architecture Advisor Agent

**DO:**
- ✅ Ask clarifying questions before proposing
- ✅ Present multiple options with honest tradeoffs
- ✅ Show concrete code examples
- ✅ Document in all 3 places (patterns.md, docs/, CLAUDE.md)
- ✅ Create actionable plans
- ✅ Consider team's context

**DON'T:**
- ❌ Assume requirements
- ❌ Present one option as "only way"
- ❌ Use buzzwords without explaining
- ❌ Skip documentation
- ❌ Ignore existing patterns

---

## Troubleshooting

### Scanner doesn't detect my pattern

**Solution:** Add detection rule to scanner:

```python
# .claude/scripts/architecture-scanner.py
def detect_your_pattern(self, files):
    pattern = re.compile(r'your-regex')
    return self.search_pattern(files, 'pattern-id', 'Name', 'category', pattern)
```

### Agent doesn't follow my project's patterns

**Solution:** Ensure patterns are documented in `.sentra/memory/patterns.md`. The agent loads patterns from there.

### Scanner reports false positives

**Solution:** Refine detection regex or add exclusion pattern:

```python
self.search_pattern(
    files,
    pattern_id='...',
    exclude_pattern=re.compile(r'exception-case')
)
```

### How to add a new pattern category?

1. Add category to `patterns_found` dict in scanner:
   ```python
   found = {
       'your_category': [],
       # ... existing categories
   }
   ```

2. Create detection function:
   ```python
   def detect_your_category_patterns(self, files):
       patterns = []
       # Add detection logic
       return patterns
   ```

3. Call it in `detect_patterns()`:
   ```python
   found['your_category'].extend(self.detect_your_category_patterns(files))
   ```

---

## Future Phases

This is **Phase 1** of the Architecture Intelligence System. Future phases:

### Phase 2: Automated Enforcement (Planned)

- Pre-commit hooks that run scanner
- CI/CD integration that blocks non-compliant code
- Automatic PR comments with pattern violations
- Pattern suggestion during code writing
- Real-time IDE integration

### Phase 3: Pattern Learning (Future)

- AI learns project-specific patterns from codebase
- Automatically proposes new patterns
- Detects emerging anti-patterns
- Cross-project pattern sharing
- Pattern effectiveness metrics

---

## Files Reference

**Core System:**
- `.sentra/memory/patterns.md` - Pattern library
- `.claude/scripts/architecture-scanner.py` - Scanner tool
- `.claude/agents/architecture-advisor.md` - Agent config
- `docs/architecture/TEMPLATE.md` - Documentation template

**Example Documentation:**
- `docs/architecture/DATA-FETCHING.md` - Complete example

**Generated Reports:**
- `/tmp/sentra-architecture-report.md` - Latest scan results

---

## Getting Help

**Questions about patterns:**
```
@architecture-advisor
[your question]
```

**Issues with scanner:**
1. Check Python version: `python3 --version` (3.8+)
2. Check file permissions: `ls -la .claude/scripts/`
3. Run with verbose output: `python3 -v .claude/scripts/architecture-scanner.py .`

**Documentation unclear:**
1. See example: `docs/architecture/DATA-FETCHING.md`
2. Check template: `docs/architecture/TEMPLATE.md`
3. Ask agent: `@architecture-advisor explain [pattern name]`

---

## Changelog

### 1.0.0 (2025-11-12)
- ✅ Initial release
- ✅ 15 default patterns defined
- ✅ Architecture scanner implemented
- ✅ Architecture Advisor Agent created
- ✅ Documentation template created
- ✅ Example documentation (DATA-FETCHING.md)
- ✅ Tested on Sentra codebase

---

## Credits

**Created by:** Architecture Intelligence System
**For project:** Sentra - Voice-First AI Assistant Platform
**Author:** Glen Barnhardt with help from Claude Code
**Date:** November 12, 2025

---

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2025-11-12
