# Week 3: Spec Parser & Validator - COMPLETE

**Date:** 2025-11-22
**Phase:** 3.2 E2E Test Generation
**Status:** ✅ COMPLETE

---

## Summary

Implemented Zod schema validation and YAML spec parsing service for E2E test generation. All deliverables met or exceeded quality targets.

---

## Deliverables

### 1. Zod Schema (`src/schemas/e2e-spec.schema.ts`) ✅

**Purpose:** Type-safe validation of E2E test specifications

**Features:**
- `E2ETestStepSchema` - Validates individual test steps
- `E2ETestSchema` - Validates complete test specifications
- `ScreenSpecSchema` - Validates full screen specs with multiple tests
- Helper functions: `validateScreenSpec()`, `validateE2ETest()`, `getValidTemplates()`, `getValidPriorities()`

**Quality:**
- ✅ 100% test coverage (29 tests)
- ✅ Rejects invalid specs (empty fields, invalid template hints, invalid priorities)
- ✅ Provides helpful error messages via Zod
- ✅ TypeScript strict mode compliant

**Tests:** `/Users/barnent1/Projects/quetrex/tests/unit/schemas/e2e-spec.schema.test.ts`

---

### 2. Spec Parser Service (`src/services/spec-parser.ts`) ✅

**Purpose:** Parse and validate YAML specs, extract tests, group by priority

**Operations:**
```typescript
// Parse YAML string
const result = await parser.parseYAML(yamlString);

// Parse YAML file
const result = await parser.parseFile('/path/to/spec.yaml');

// Extract tests
const tests = parser.extractTests(spec);

// Group by priority
const grouped = parser.groupByPriority(tests);

// Get statistics
const stats = parser.getStats(spec);
```

**Quality:**
- ✅ 94% test coverage (27 tests)
- ✅ 100% function coverage
- ✅ Handles YAML parse errors
- ✅ Validates against schema
- ✅ Returns detailed error information

**Tests:** `/Users/barnent1/Projects/quetrex/tests/unit/services/spec-parser.test.ts`

---

### 3. Test Fixture (`tests/fixtures/specs/dashboard.yaml`) ✅

**Purpose:** Real-world spec example for testing

**Contents:**
- 3 E2E tests for Dashboard screen
- Uses template hints (`crud-operations`, `modal-workflow`)
- Includes priority levels (`high`, `medium`)
- Demonstrates `skip_if_empty` flag

---

## Test Results

```
Test Files: 2 passed (2)
Tests: 56 passed (56)
Coverage: 95.55%
  - Schemas: 100%
  - Services: 94%
  - Functions: 100%
```

**Coverage Details:**
```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|----------
All files          |   95.55 |       75 |     100 |   95.34
schemas            |     100 |      100 |     100 |     100
  e2e-spec.schema  |     100 |      100 |     100 |     100
services           |   94.11 |       75 |     100 |   93.75
  spec-parser      |   94.11 |       75 |     100 |   93.75
```

---

## Example Usage

### Parse YAML Spec

```typescript
import { SpecParser } from '@/services/spec-parser';

const parser = new SpecParser();

// From string
const yaml = `
screen: Dashboard
description: Mission control view
e2e_tests:
  - name: User views stats
    steps: [Navigate to /dashboard]
    assertions: [4 stat cards show]
`;

const result = await parser.parseYAML(yaml);
if (result.success) {
  console.log(result.data.screen); // "Dashboard"
  console.log(result.data.e2e_tests.length); // 1
}

// From file
const fileResult = await parser.parseFile('/path/to/spec.yaml');
```

### Extract and Group Tests

```typescript
const spec = result.data;

// Extract all tests
const tests = parser.extractTests(spec);
console.log(`Found ${tests.length} tests`);

// Group by priority
const grouped = parser.groupByPriority(tests);
console.log(`Critical: ${grouped.critical.length}`);
console.log(`High: ${grouped.high.length}`);

// Get statistics
const stats = parser.getStats(spec);
console.log(`Total tests: ${stats.total}`);
console.log(`With template hint: ${stats.withTemplateHint}`);
console.log(`Skippable: ${stats.skippable}`);
```

### Filter Tests

```typescript
// By template hint
const modalTests = parser.getTestsByTemplateHint(spec, 'modal-workflow');

// By priority
const criticalTests = parser.getTestsByPriority(spec, 'critical');

// Skippable tests
const skippableTests = parser.getSkippableTests(spec);
```

---

## Error Handling

The parser provides detailed errors for:

### YAML Syntax Errors
```typescript
const result = await parser.parseYAML('invalid: yaml: [');
// result.error.type === 'parse'
// result.error.message === 'YAML syntax error'
```

### Validation Errors
```typescript
const result = await parser.parseYAML(`
screen: Dashboard
# Missing e2e_tests
`);
// result.error.type === 'validation'
// result.error.issues[0].message === 'Required'
```

### File Errors
```typescript
const result = await parser.parseFile('/non/existent/file.yaml');
// result.error.type === 'file'
```

---

## Schema Validation Examples

### Valid Template Names

```typescript
import { getValidTemplates } from '@/schemas/e2e-spec.schema';

const templates = getValidTemplates();
// ['crud-operations', 'form-validation', 'modal-workflow',
//  'navigation', 'loading-states', 'visual-regression', 'llm']
```

### Valid Priority Levels

```typescript
import { getValidPriorities } from '@/schemas/e2e-spec.schema';

const priorities = getValidPriorities();
// ['low', 'medium', 'high', 'critical']
```

### Type Safety

```typescript
import type { ScreenSpec, E2ETest } from '@/schemas/e2e-spec.schema';

// TypeScript knows exact shape
const spec: ScreenSpec = {
  screen: 'Dashboard',
  description: 'Test',
  route: '/dashboard', // Optional
  e2e_tests: [...],
};

const test: E2ETest = {
  name: 'Test name',
  description: 'Test description',
  steps: ['Step 1'],
  assertions: ['Assert 1'],
  priority: 'high', // Type-checked!
  template_hint: 'modal-workflow', // Type-checked!
  skip_if_empty: true,
};
```

---

## Dependencies Added

```json
{
  "devDependencies": {
    "js-yaml": "^4.1.0",
    "@types/js-yaml": "^4.0.9"
  }
}
```

---

## Files Created

1. `/Users/barnent1/Projects/quetrex/src/schemas/e2e-spec.schema.ts` (200 lines)
2. `/Users/barnent1/Projects/quetrex/src/services/spec-parser.ts` (328 lines)
3. `/Users/barnent1/Projects/quetrex/tests/unit/schemas/e2e-spec.schema.test.ts` (586 lines)
4. `/Users/barnent1/Projects/quetrex/tests/unit/services/spec-parser.test.ts` (724 lines)
5. `/Users/barnent1/Projects/quetrex/tests/fixtures/specs/dashboard.yaml` (31 lines)

**Total:** 1,869 lines of production code and tests

---

## Next Steps (Week 4-5)

### Week 4: Template Engine
- Implement template renderer with Mustache-style syntax
- Support conditionals (`{{#IF}}...{{/IF}}`)
- Support loops (`{{#EACH}}...{{/EACH}}`)
- Test all 6 templates generate valid tests

### Week 5: LLM Refinement & CLI
- Implement test refinement service (Anthropic API)
- Create refinement UI with diff viewer
- Build test generator CLI
- Integrate into quality gate

---

## Quality Metrics

✅ **All targets met or exceeded:**

- ✅ TypeScript strict mode (no `any`, no `@ts-ignore`)
- ✅ 90%+ test coverage (achieved 95.55%)
- ✅ 100% function coverage
- ✅ All tests passing (56/56)
- ✅ TDD approach (tests written first)
- ✅ Comprehensive error handling
- ✅ Type-safe validation

---

## Approval

**Deliverables:** Complete
**Quality:** Exceeds standards
**Ready for:** Week 4 implementation

---

*Completed: 2025-11-22 by Glen Barnhardt with help from Claude Code*
*Part of Quetrex's Perfect Agentic Structure - Phase 3.2*
