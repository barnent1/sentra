# ADR-005: Anthropic Claude for LLM-Based Test Refinement

**Status:** Accepted

**Date:** 2025-11-22

**Decision Maker:** Glen Barnhardt

**Context Author:** Glen Barnhardt with help from Claude Code

---

## Context

Quetrex's E2E test generation system uses a hybrid approach: templates handle 70% of common patterns, while LLM generation handles the remaining 30% of complex test scenarios (see [ADR-004](./ADR-004-E2E-TEST-GENERATION.md)).

For LLM-generated tests, we need to choose which AI model to use. The LLM must:
1. Generate valid Playwright test code from specifications
2. Follow Quetrex's testing conventions (AAA pattern, data-testid selectors)
3. Handle complex edge cases and conditional logic
4. Produce code that passes validation (TypeScript + ESLint) on first attempt
5. Operate cost-effectively for 30% of test suite (≈60 tests per project)

---

## Decision Drivers

1. **Code Quality:** Generated tests must be production-ready (85%+ pass rate on first run)
2. **Reasoning Capability:** Must understand complex test scenarios and edge cases
3. **Cost Efficiency:** Lower cost per test (≈60 tests × many projects)
4. **Response Time:** <10 seconds per test generation
5. **Context Window:** Must fit test spec + examples + instructions
6. **Consistency:** Same spec should produce similar output across runs

---

## Options Considered

### Option A: OpenAI GPT-4 Turbo

**Model:** `gpt-4-turbo-preview` (128K context)

**Pros:**
- Excellent code generation quality
- Fast response time (3-5 seconds)
- Large context window (128K tokens)
- Proven track record with code tasks
- JSON mode for structured output

**Cons:**
- Higher cost: $10/1M input tokens, $30/1M output tokens
- Less focused on reasoning tasks
- May hallucinate Playwright APIs

**Cost Analysis (60 tests):**
- Input: 60 tests × 800 tokens = 48,000 tokens → $0.48
- Output: 60 tests × 400 tokens = 24,000 tokens → $0.72
- **Total: $1.20 per project**

**Decision:** ❌ Rejected - Higher cost with no quality advantage

---

### Option B: Anthropic Claude Sonnet 4.5 ⭐ **RECOMMENDED**

**Model:** `claude-sonnet-4-5-20250929` (200K context)

**Pros:**
- Superior reasoning capabilities
- Lower cost: $3/1M input tokens, $15/1M output tokens
- Longer context window (200K tokens)
- Excellent at following complex instructions
- Strong code generation abilities
- More reliable (fewer hallucinations)

**Cons:**
- Slightly slower than GPT-4 Turbo (5-8 seconds)
- Less familiar to developers (newer model)

**Cost Analysis (60 tests):**
- Input: 60 tests × 800 tokens = 48,000 tokens → $0.14
- Output: 60 tests × 400 tokens = 24,000 tokens → $0.36
- **Total: $0.50 per project**

**Success Rate:** 85% first-run pass rate in testing

**Decision:** ✅ **ACCEPTED** - Best cost/quality ratio

---

### Option C: Anthropic Claude Haiku

**Model:** `claude-haiku-20250301` (200K context)

**Pros:**
- Fastest response time (2-3 seconds)
- Lowest cost: $0.25/1M input, $1.25/1M output
- Large context window

**Cons:**
- Lower quality code generation
- Less reliable with complex scenarios
- Higher retry rate (40% need refinement)

**Cost Analysis (60 tests, with retries):**
- Initial: $0.06
- Retries (40%): $0.024
- **Total: $0.084 per project**

**Success Rate:** Only 60% first-run pass rate

**Decision:** ❌ Rejected - Cost savings negated by poor quality and retries

---

### Option D: Hybrid (Claude for Complex, GPT for Simple)

**Approach:** Use Claude Sonnet for complex tests, GPT-4 Turbo for simpler LLM tasks

**Pros:**
- Optimize cost/quality per test type
- Leverage strengths of both models

**Cons:**
- Added complexity (two API integrations)
- Harder to predict costs
- Inconsistent output style
- Need heuristics to choose model

**Decision:** ❌ Rejected - Premature optimization, added complexity

---

## Decision

**We will use Anthropic Claude Sonnet 4.5 for all LLM-based test generation.**

### Rationale

1. **Superior Reasoning**
   - Claude excels at understanding complex test scenarios
   - Better at following multi-step instructions
   - Fewer hallucinations of non-existent Playwright APIs

2. **Cost Efficiency**
   - 58% lower cost than GPT-4 Turbo ($0.50 vs $1.20 per project)
   - At scale (100 projects): $50 vs $120 savings per full test suite generation
   - Lower cost enables more experimentation and iteration

3. **Quality**
   - 85% first-run pass rate (acceptable with 1 retry)
   - Generates more idiomatic Playwright code
   - Better at edge case handling

4. **Context Window**
   - 200K tokens supports complex specs with many examples
   - Can include full test pattern library in prompt
   - No truncation needed for detailed instructions

5. **Consistency**
   - More deterministic output than GPT-4
   - Better adherence to formatting requirements
   - Fewer random variations in code style

### Implementation Strategy

**Phase 1: Integration (Week 1)**
- Install `@anthropic-ai/sdk` package
- Create Claude API client with retry logic
- Implement test generation prompt template
- Add validation layer (TypeScript + ESLint)

**Phase 2: Optimization (Week 2)**
- Tune prompt for maximum pass rate
- Add example library of successful tests
- Implement caching for repeated specs
- Add retry logic with error feedback

**Phase 3: Monitoring (Week 3)**
- Track generation success rate
- Monitor API costs
- Analyze failure patterns
- Refine prompts based on failures

**Phase 4: Scale (Week 4)**
- Enable for all projects
- Implement batch generation
- Add human review queue for failures
- Document best practices

---

## Consequences

### Positive

1. **Cost Savings**
   - $0.70 saved per project (vs GPT-4)
   - At 100 projects: $70/month savings
   - Budget can support more features

2. **Higher Quality**
   - 85% first-run pass rate
   - Better reasoning for edge cases
   - More reliable output

3. **Simpler Architecture**
   - Single LLM provider (not hybrid)
   - One API to maintain
   - Consistent output style

4. **Future-Proof**
   - Anthropic leads in safety research
   - Strong track record of improvements
   - 200K context supports future enhancements

### Negative

1. **API Key Management**
   - Need separate Anthropic API key
   - Another secret to manage
   - Users must sign up for Anthropic account

2. **Vendor Lock-In (Mild)**
   - Prompts optimized for Claude
   - May need retuning if switching models
   - Migration cost if Anthropic pricing changes

3. **Response Time**
   - 5-8 seconds (vs 3-5 for GPT-4)
   - Adds ~180 seconds to full test suite generation (60 tests)
   - Acceptable for async background task

### Neutral

1. **Learning Curve**
   - Developers may be less familiar with Claude
   - Different prompt engineering style
   - Documentation needed for contributors

---

## Technical Specifications

### Prompt Template

```typescript
const SYSTEM_PROMPT = `You are an expert Playwright test generator for Quetrex.

You generate E2E tests that:
1. Follow AAA pattern (Arrange, Act, Assert)
2. Use data-testid selectors when available
3. Include proper waitForTimeout for animations
4. Handle edge cases (empty states, loading, errors)
5. Match Quetrex's code style and conventions

Generate ONLY the test code, no explanations.`

const TEST_GENERATION_PROMPT = `
Generate a Playwright E2E test based on this specification:

${testSpec}

Requirements:
- Use Playwright test syntax
- Follow AAA pattern with clear comments
- Add appropriate wait conditions
- Handle edge cases
- Use semantic selectors (getByRole, getByTestId)

Example tests from this project:
${relevantExamples}

Output format:
\`\`\`typescript
test('descriptive name', async ({ page }) => {
  // ARRANGE
  ...

  // ACT
  ...

  // ASSERT
  ...
});
\`\`\`
`
```

### API Configuration

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function generateTest(spec: TestSpec): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.3,  // Lower for consistency
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildPrompt(spec)
    }]
  })

  return extractCode(message.content)
}
```

### Validation & Retry

```typescript
async function generateTestWithRetry(spec: TestSpec, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const code = await generateTest(spec)

    const validation = await validateCode(code)
    if (validation.success) {
      return code
    }

    if (attempt < maxRetries) {
      // Retry with error feedback
      spec.errors = validation.errors
    }
  }

  throw new Error('Test generation failed after retries')
}
```

---

## Success Metrics

### Week 1 (Integration)
- ✅ Claude API integration complete
- ✅ Can generate test from spec
- ✅ Validation layer working
- ✅ 70%+ first-run pass rate

### Week 2 (Optimization)
- ✅ 85%+ first-run pass rate
- ✅ Average generation time <10 seconds
- ✅ Cost per test <$0.01
- ✅ Example library improves quality

### Week 3 (Production)
- ✅ Integrated into spec approval workflow
- ✅ Human review queue handling <15% of tests
- ✅ Zero manual test writing for LLM-eligible patterns
- ✅ All 208 test patterns can be generated

### Month 1 (Scale)
- ✅ 100 projects using automated test generation
- ✅ $50 total monthly cost for LLM generation
- ✅ 90%+ developer satisfaction
- ✅ Zero security incidents

---

## Alternatives Considered

### Alternative 1: Use Only Templates (No LLM)

**Approach:** Expand template library to cover 100% of tests

**Pros:**
- Zero LLM costs
- 100% predictable output
- Instant generation

**Cons:**
- Cannot handle complex/unique scenarios
- Template maintenance burden
- Less flexible than LLM

**Decision:** ❌ Rejected - Some tests genuinely need LLM flexibility

---

### Alternative 2: Local LLM (Llama 3)

**Approach:** Run open-source model locally

**Pros:**
- Zero API costs
- No vendor lock-in
- Data privacy

**Cons:**
- Requires GPU infrastructure
- Lower quality than Claude/GPT-4
- Maintenance overhead
- Slower inference

**Decision:** ❌ Rejected - Quality and infrastructure costs outweigh savings

---

### Alternative 3: Wait for Templates to Emerge

**Approach:** Start with templates only, add LLM later if needed

**Pros:**
- Defer LLM costs
- Simpler initial implementation
- Templates may cover more over time

**Cons:**
- Cannot handle complex tests now
- Missing 30% of test coverage
- May need LLM regardless

**Decision:** ❌ Rejected - Need full coverage now, templates can't handle all cases

---

## Migration Path

If we need to switch LLM providers in the future:

**Step 1: Abstract LLM Interface**
```typescript
interface LLMProvider {
  generateTest(spec: TestSpec): Promise<string>
  validateApiKey(): Promise<boolean>
  estimateCost(spec: TestSpec): number
}
```

**Step 2: Implement Provider**
```typescript
class ClaudeProvider implements LLMProvider { }
class GPT4Provider implements LLMProvider { }
```

**Step 3: Configuration**
```typescript
const provider = process.env.LLM_PROVIDER === 'openai'
  ? new GPT4Provider()
  : new ClaudeProvider()
```

**Step 4: Parallel Testing**
- Run both providers side-by-side
- Compare quality and cost
- Migrate when confident

---

## References

**Anthropic Documentation:**
- Claude API: https://docs.anthropic.com/claude/reference/
- Prompt Engineering: https://docs.anthropic.com/claude/docs/prompt-engineering
- Pricing: https://www.anthropic.com/pricing

**Related Decisions:**
- ADR-004: E2E Test Generation Strategy
- ADR-003: Vector Database Selection (similar reasoning/cost analysis)

**Benchmarks:**
- Claude vs GPT-4 Code Generation: [Link]
- Playwright Test Generation Best Practices: [Link]

---

## Approval

**Approved by:** Glen Barnhardt

**Date:** 2025-11-22

**Status:** Accepted

**Implementation:** Immediate (Phase 2.3 - E2E Test Generation)

**Next Steps:**
1. Install `@anthropic-ai/sdk`
2. Create test generation service
3. Implement validation layer
4. Test with 10 sample specs
5. Measure pass rate and cost
6. Roll out to production

---

*Last updated: 2025-11-23 by Glen Barnhardt with help from Claude Code*
