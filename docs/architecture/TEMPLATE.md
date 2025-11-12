# [Category] Architecture

> **Template Instructions:** Replace all `[placeholders]` with actual content. Delete this instruction block when done.
>
> **Categories:** Data Fetching, State Management, Authentication, API Design, Component Architecture, Security, Performance, Testing, Deployment

**Status:** [Draft | Approved | Deprecated]
**Author:** [Name or "Architecture Advisor Agent"]
**Date:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]
**Reviewers:** [Names]

---

## Overview

[2-3 sentence summary of this architectural area and why it matters for the project]

**What this covers:**
- [Aspect 1]
- [Aspect 2]
- [Aspect 3]

**What this does NOT cover:**
- [Out of scope 1]
- [Out of scope 2]

---

## Core Principle

> [The fundamental guiding principle for all decisions in this area - one clear sentence]

**Rationale:**
[2-3 sentences explaining WHY this principle matters for this project specifically]

---

## Pattern: [Primary Pattern Name]

**Status:** ✅ Approved | ⚠️ Conditional | ❌ Deprecated
**Mandatory:** YES | NO | CONDITIONAL
**Applies To:** [File types, components, services where this applies]

### When to Use

Use this pattern when:
- [Specific condition 1]
- [Specific condition 2]
- [Specific condition 3]

**Do NOT use** when:
- [Anti-condition 1]
- [Anti-condition 2]

### Implementation

#### Step 1: [Setup/Configuration]

[Explain what needs to be configured first]

```bash
# Installation
npm install [packages]
```

```typescript
// Configuration
// [file path: lib/config.ts]
[configuration code]
```

#### Step 2: [Core Implementation]

[Explain the main implementation]

```typescript
// [file path: hooks/useExample.ts]
import { dependency } from 'package';

export function useExample() {
  // Implementation
  return result;
}
```

#### Step 3: [Usage]

[Show how to use it in actual code]

```typescript
// [file path: components/Example.tsx]
'use client';

import { useExample } from '@/hooks/useExample';

export function Example() {
  const data = useExample();

  return <div>{data}</div>;
}
```

### Directory Structure

```
project/
├── lib/
│   └── [category]/
│       ├── client.ts       # Core client/utility
│       ├── types.ts        # TypeScript types
│       └── config.ts       # Configuration
├── hooks/
│   └── use[Name].ts        # React hooks
├── app/api/
│   └── [endpoint]/
│       └── route.ts        # API implementation
└── tests/
    └── integration/
        └── [category].test.ts
```

### Testing

**Unit Tests:**
```typescript
// tests/unit/[category].test.ts
describe('[Component/Function]', () => {
  it('should [behavior]', () => {
    // ARRANGE
    const input = [test data];

    // ACT
    const result = functionUnderTest(input);

    // ASSERT
    expect(result).toEqual([expected]);
  });
});
```

**Integration Tests:**
```typescript
// tests/integration/[category].test.ts
describe('[Feature] integration', () => {
  it('should [end-to-end behavior]', async () => {
    // Test the complete flow
  });
});
```

**Coverage Requirements:**
- Business logic: 90%+
- API routes: 75%+
- Components: 60%+

### Examples

#### ✅ Good Example

```typescript
// [Describe why this is good]
// [file path: examples/good-example.tsx]
export function GoodExample() {
  // Show best practices
}
```

**Why this is good:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

#### ❌ Bad Example (Anti-pattern)

```typescript
// [Describe why this is bad]
// [file path: examples/bad-example.tsx]
export function BadExample() {
  // Show what NOT to do
}
```

**Why this is bad:**
- [Problem 1]
- [Problem 2]
- [Problem 3]

**How to fix it:**
[Show the corrected version or link to good example]

### Common Pitfalls

#### Pitfall 1: [Name]

**Problem:**
[Describe the common mistake]

**Solution:**
```typescript
// ❌ WRONG
[bad code]

// ✅ CORRECT
[good code]
```

#### Pitfall 2: [Name]

**Problem:**
[Describe the common mistake]

**Solution:**
[Explanation and correct code]

### Performance Considerations

**Optimization tips:**
- [Tip 1]
- [Tip 2]
- [Tip 3]

**Benchmarks:**
- [Metric]: [Expected value]
- [Metric]: [Expected value]

**When to optimize:**
- [Condition 1]
- [Condition 2]

---

## Alternative Patterns

### Pattern: [Alternative Pattern Name]

**Status:** [Approved | Conditional | Deprecated]

**When to use instead:**
- [Specific case 1]
- [Specific case 2]

**Tradeoffs:**

| Aspect | Primary Pattern | Alternative Pattern |
|--------|----------------|---------------------|
| Complexity | [Level] | [Level] |
| Performance | [Description] | [Description] |
| Scalability | [Description] | [Description] |
| Learning Curve | [Description] | [Description] |
| Best For | [Use case] | [Use case] |

**Example:**
```typescript
// Alternative implementation
```

---

## Migration Guide

If you have existing code using a different pattern, follow these steps:

### Assessment

1. **Identify current pattern:**
   ```bash
   # Use architecture scanner
   python3 .claude/scripts/architecture-scanner.py . --format=markdown
   ```

2. **Count files to migrate:**
   ```bash
   # Search for old pattern
   grep -r "old-pattern" src/ | wc -l
   ```

3. **Estimate effort:**
   - Small project (< 10 files): [X hours]
   - Medium project (10-50 files): [Y hours]
   - Large project (50+ files): [Z hours]

### Step-by-Step Migration

#### Phase 1: Prepare New Infrastructure

- [ ] Install dependencies
- [ ] Create new utilities/hooks
- [ ] Write tests for new code
- [ ] Create examples

#### Phase 2: Migrate Gradually

**For each file:**

1. **Create new implementation alongside old:**
   ```typescript
   // OLD - Keep temporarily
   const oldApproach = useOldPattern();

   // NEW - Add new pattern
   const newApproach = useNewPattern();

   // Use old for now
   const data = oldApproach;
   ```

2. **Test new implementation:**
   ```typescript
   // Switch to new
   const data = newApproach;

   // Verify behavior matches
   ```

3. **Remove old code:**
   ```typescript
   // Only new pattern remains
   const data = useNewPattern();
   ```

#### Phase 3: Cleanup

- [ ] Remove old dependencies
- [ ] Delete old utilities
- [ ] Update documentation
- [ ] Run architecture scanner to verify

### Rollback Plan

If issues arise:

1. **Revert individual files:**
   ```bash
   git checkout HEAD -- [file-path]
   ```

2. **Keep both patterns temporarily:**
   - Document when to use each
   - Set migration deadline
   - Track progress in issues

3. **Emergency rollback:**
   ```bash
   git revert [commit-hash]
   ```

---

## Validation & Enforcement

### Manual Validation

**Checklist for code review:**
- [ ] Pattern matches documented approach
- [ ] Tests written and passing
- [ ] Types are explicit (no `any`)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Documentation updated

### Automated Validation

**Architecture Scanner:**
```bash
# Detect pattern usage
python3 .claude/scripts/architecture-scanner.py .
```

**Expected output:**
```
✅ [Category]: [Pattern Name] used consistently in [N] files
❌ [Anti-pattern]: Found in [N] files - needs refactoring
```

**CI/CD Integration:**
```yaml
# .github/workflows/architecture-validation.yml
- name: Validate Architecture
  run: |
    python3 .claude/scripts/architecture-scanner.py . --format=json > report.json
    # Add validation logic
```

### Metrics

Track these metrics over time:

- **Consistency Score:** [N]% of files follow pattern
- **Anti-pattern Count:** [N] instances to fix
- **Test Coverage:** [N]% for this category
- **Migration Progress:** [N]/[Total] files migrated

---

## Troubleshooting

### Issue: [Common Problem 1]

**Symptoms:**
- [What you see]
- [Error message]

**Cause:**
[Why this happens]

**Solution:**
```typescript
// Fix
```

### Issue: [Common Problem 2]

**Symptoms:**
- [What you see]

**Cause:**
[Why this happens]

**Solution:**
[Step-by-step fix]

### Getting Help

If you encounter issues:

1. **Check examples:** See `examples/[category]/`
2. **Run tests:** `npm test tests/integration/[category].test.ts`
3. **Search docs:** [Link to related docs]
4. **Ask team:** [Team channel/contact]

---

## References

### Official Documentation
- [Framework/Library Name]: [URL]
- [Related Tool]: [URL]

### Best Practices
- [Article/Blog]: [URL]
- [Video Tutorial]: [URL]

### Related Patterns
- [Pattern Name]: See `docs/architecture/[OTHER].md`
- [Pattern Name]: See `docs/architecture/[OTHER].md`

### Examples in This Codebase
- [File path]: [Description]
- [File path]: [Description]

---

## Decision Log

| Date | Decision | Rationale | Decision Maker |
|------|----------|-----------|----------------|
| YYYY-MM-DD | [Initial pattern adoption] | [Why chosen] | [Name] |
| YYYY-MM-DD | [Pattern update/change] | [Why changed] | [Name] |

---

## Appendix

### TypeScript Types

```typescript
// Common types for this pattern
export interface [TypeName] {
  [property]: [type];
}

export type [TypeName] = [definition];
```

### Configuration Options

```typescript
// All available configuration options
export interface [ConfigName] {
  [option]: [type];  // [description]
  [option]: [type];  // [description]
}
```

### API Reference

If this pattern involves an API:

#### `functionName(param1, param2)`

**Description:** [What it does]

**Parameters:**
- `param1` (Type): [Description]
- `param2` (Type): [Description]

**Returns:** `ReturnType` - [Description]

**Example:**
```typescript
const result = functionName(value1, value2);
```

---

**Version:** 1.0.0
**Maintained By:** [Team/Person]
**Next Review:** [Date]

---

## Template Metadata

**Template Version:** 1.0.0
**Last Updated:** 2025-11-12
**Purpose:** Standard template for all architecture documentation
**Usage:** Copy this template when creating new architecture docs
