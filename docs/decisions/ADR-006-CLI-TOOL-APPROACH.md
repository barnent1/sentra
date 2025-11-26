# ADR-006: Hybrid CLI Tool Approach for E2E Test Generation

**Status:** Accepted

**Date:** 2025-11-22

**Decision Maker:** Glen Barnhardt

**Context Author:** Glen Barnhardt with help from Claude Code

---

## Context

Sentra's E2E test generation system can automatically create Playwright tests from design specifications (see [ADR-004](./ADR-004-E2E-TEST-GENERATION.md)). We need to decide how developers interact with this system:

**Option A: CLI-Only Tool**
- Standalone command: `npx sentra generate-tests spec.yaml`
- Developer runs manually when needed
- No auto-triggering

**Option B: Auto-Only Integration**
- Tests generated automatically during spec approval workflow
- No standalone CLI tool
- Fully integrated into Sentra UI

**Option C: Hybrid Approach** ⭐
- Both standalone CLI AND auto-trigger
- Developer choice: manual or automatic
- Maximum flexibility

---

## Decision Drivers

1. **Developer Experience:** Easy to use for both manual and automated workflows
2. **Flexibility:** Support different team workflows (CI/CD, local dev, auto-generation)
3. **Debugging:** Ability to test generation locally before committing
4. **Integration:** Seamless integration with Sentra's spec approval workflow
5. **Maintenance:** Single codebase serving both use cases

---

## Decision

**We adopt Option C: Hybrid Approach (CLI + Auto-Trigger)**

### Rationale

1. **Best Developer Experience**
   - Manual control when debugging test generation
   - Automatic when in "flow state" with Sentra
   - No forced workflow

2. **Flexibility**
   - Teams can choose their workflow
   - CLI for CI/CD pipelines
   - Auto-trigger for rapid iteration
   - Both options from same codebase

3. **Debugging**
   - Test generation locally before committing
   - Iterate on specs without full workflow
   - See generated tests immediately

4. **Gradual Adoption**
   - Start with CLI (lower barrier to entry)
   - Enable auto-trigger when confident
   - Not all-or-nothing

---

## Implementation

### CLI Tool

```bash
# Install globally
npm install -g @sentra/test-generator

# Or use npx
npx @sentra/test-generator generate spec.yaml

# With options
npx @sentra/test-generator generate spec.yaml \
  --output tests/e2e/ \
  --format typescript \
  --dry-run
```

**CLI API:**
```typescript
interface CLIOptions {
  input: string           // Path to spec file(s)
  output?: string         // Output directory (default: tests/e2e/)
  format?: 'typescript' | 'javascript'  // Default: typescript
  dryRun?: boolean        // Preview without writing files
  verbose?: boolean       // Show detailed logs
  template?: string       // Override template directory
  llmProvider?: 'claude' | 'openai' | 'none'  // LLM fallback
}
```

### Auto-Trigger Integration

```typescript
// In Sentra's spec approval workflow
async function onSpecApproved(spec: Specification) {
  // 1. Generate E2E tests automatically
  const tests = await generateE2ETests(spec)

  // 2. Commit to feature branch
  await git.add('tests/e2e/')
  await git.commit('test: generate E2E tests from approved spec')

  // 3. Continue with agent implementation
  await startAgentWorker(spec)
}
```

### Shared Core

Both CLI and auto-trigger use the same core library:

```typescript
import { TestGenerator } from '@sentra/test-generator'

const generator = new TestGenerator({
  templateDir: '.claude/templates/e2e',
  llmProvider: 'claude',
  apiKey: process.env.ANTHROPIC_API_KEY
})

const tests = await generator.generate(spec)
```

---

## Consequences

### Positive

1. **Developer Freedom**
   - Use CLI for manual control
   - Use auto-trigger for speed
   - Switch between workflows easily

2. **Better Testing**
   - Test generation locally before commit
   - Iterate faster on specs
   - See generated tests before approval

3. **CI/CD Integration**
   - CLI works in any pipeline
   - No dependency on Sentra UI
   - Standard tooling

4. **Lower Barrier to Entry**
   - Try CLI without full Sentra setup
   - Gradual adoption path
   - Not locked into workflow

### Negative

1. **More Code to Maintain**
   - CLI interface + integration layer
   - Documentation for both approaches
   - Testing both paths

2. **Potential Confusion**
   - Developers may not know which to use
   - Need clear guidance
   - Possible duplicate runs (CLI + auto)

3. **Version Sync**
   - CLI and Sentra must stay in sync
   - Breaking changes affect both
   - Need versioning strategy

---

## Usage Guidelines

### When to Use CLI

**✅ Good for:**
- Testing spec changes locally
- Debugging test generation
- CI/CD pipelines
- One-off test generation
- Teams not using full Sentra workflow

**Example:**
```bash
# Develop spec locally
vim project-spec.yaml

# Generate tests to see output
npx @sentra/test-generator generate project-spec.yaml --dry-run

# Looks good? Write files
npx @sentra/test-generator generate project-spec.yaml

# Review generated tests
git diff tests/e2e/

# Commit when satisfied
git add tests/e2e/ project-spec.yaml
git commit -m "feat: add project spec and E2E tests"
```

### When to Use Auto-Trigger

**✅ Good for:**
- Rapid iteration with Sentra architect
- Full automation workflows
- Teams using Sentra for spec approval
- Reducing manual steps

**Example:**
```bash
# 1. Talk to Sentra architect
Sentra: "Your spec is ready. Approve?"

# 2. Click "Approve" in UI
# (Tests generated automatically)

# 3. Agent starts implementation
# (Tests already committed to feature branch)

# 4. Review PR with tests included
# (No manual test generation needed)
```

---

## Technical Specifications

### CLI Package Structure

```
@sentra/test-generator/
├── src/
│   ├── cli/
│   │   ├── index.ts          # CLI entry point
│   │   ├── commands/
│   │   │   ├── generate.ts   # Generate command
│   │   │   └── validate.ts   # Validate spec command
│   │   └── options.ts        # CLI option parser
│   ├── core/
│   │   ├── generator.ts      # Core test generator
│   │   ├── templates.ts      # Template engine
│   │   └── llm.ts            # LLM fallback
│   └── index.ts              # Library export
├── package.json
└── README.md
```

### Integration API

```typescript
// For programmatic use (Sentra integration)
import { generateE2ETests } from '@sentra/test-generator'

const result = await generateE2ETests({
  spec: specObject,
  outputDir: 'tests/e2e/',
  llmProvider: 'claude',
  apiKey: process.env.ANTHROPIC_API_KEY
})

console.log(`Generated ${result.tests.length} tests`)
console.log(`Success rate: ${result.successRate}%`)
console.log(`Cost: $${result.cost.toFixed(2)}`)
```

---

## Success Metrics

### Week 1 (CLI Release)
- ✅ CLI package published to npm
- ✅ Documentation complete
- ✅ Works with example specs
- ✅ Zero installation errors

### Week 2 (Integration)
- ✅ Auto-trigger integrated into Sentra
- ✅ Both paths use same core
- ✅ Version parity maintained
- ✅ E2E tests for both workflows

### Month 1 (Adoption)
- ✅ 50+ CLI downloads/month
- ✅ 100+ auto-trigger uses/month
- ✅ 90%+ positive feedback
- ✅ <5 bugs reported

---

## Alternatives Considered

### Alternative 1: CLI-Only

**Pros:**
- Simpler implementation
- Standard tooling approach
- No UI dependencies

**Cons:**
- Extra manual step
- Slower iteration
- Less integrated experience

**Decision:** ❌ Rejected - Misses automation benefits

### Alternative 2: Auto-Only

**Pros:**
- Fully automated
- Zero manual steps
- Tightest integration

**Cons:**
- No manual control
- Can't test locally
- Locked into Sentra workflow

**Decision:** ❌ Rejected - Too restrictive

### Alternative 3: Separate Implementations

**Pros:**
- Optimized for each use case
- No shared code complexity

**Cons:**
- Code duplication
- Maintenance burden
- Version drift risk

**Decision:** ❌ Rejected - Maintenance nightmare

---

## Future Enhancements

### Phase 2 (Planned)

**Watch Mode:**
```bash
npx @sentra/test-generator watch spec.yaml
# Regenerates tests on spec file changes
```

**Diff Mode:**
```bash
npx @sentra/test-generator diff old-spec.yaml new-spec.yaml
# Shows test changes before generating
```

**Interactive Mode:**
```bash
npx @sentra/test-generator generate --interactive
# Prompts for spec details interactively
```

### Phase 3 (Future)

**Multi-Spec Support:**
```bash
npx @sentra/test-generator generate specs/**/*.yaml
# Generates tests for all specs in directory
```

**Custom Templates:**
```bash
npx @sentra/test-generator generate spec.yaml \
  --templates ./custom-templates/
```

---

## Approval

**Approved by:** Glen Barnhardt

**Date:** 2025-11-22

**Status:** Accepted

**Implementation:** Phase 2.3 (E2E Test Generation)

**Next Steps:**
1. Create `@sentra/test-generator` package
2. Implement CLI interface
3. Add to Sentra spec approval workflow
4. Write documentation for both approaches
5. Publish to npm

---

*Last updated: 2025-11-23 by Glen Barnhardt with help from Claude Code*
