# Cost Tracking System

**Status:** Implemented and Tested (100% statement coverage, 96% branch coverage)

**Last Updated:** 2025-11-13

---

## Overview

The cost tracking system monitors OpenAI and Anthropic API usage in real-time, calculating costs based on current pricing tables. It provides detailed breakdowns by project, model, provider, and time range.

## Features

- Real-time cost calculation for all API calls
- Support for OpenAI (GPT-4, GPT-3.5, Whisper, TTS) and Anthropic (Claude) models
- Automatic API call interception (no manual tracking needed)
- Per-project cost breakdown
- Time-based filtering (daily, weekly, monthly)
- Export/import functionality for cost data
- 100% TypeScript with strict mode compliance
- 90%+ test coverage

---

## Quick Start

### 1. Basic Usage

```typescript
import { CostTracker } from '@/services/cost-tracker';

// Create tracker instance
const tracker = new CostTracker();

// Track an OpenAI call
tracker.trackOpenAICall({
  model: 'gpt-4o',
  projectId: 'sentra',
  inputTokens: 1000,
  outputTokens: 500,
});

// Track an Anthropic call
tracker.trackAnthropicCall({
  model: 'claude-sonnet-4-5',
  projectId: 'sentra',
  inputTokens: 2000,
  outputTokens: 1000,
});

// Get cost summary
const summary = tracker.getCostSummary();
console.log(`Total cost: $${summary.totalCost.toFixed(2)}`);
console.log(`Total calls: ${summary.totalCalls}`);
```

### 2. Automatic Interception (Recommended)

```typescript
import { initializeGlobalCostTracking, getGlobalCostTracker } from '@/lib/openai-interceptor';

// Initialize once at app startup
const tracker = initializeGlobalCostTracking('sentra');

// All OpenAI API calls will now be tracked automatically
// No need to manually call trackOpenAICall()

// Later, get the tracker to view costs
const costTracker = getGlobalCostTracker();
if (costTracker) {
  const summary = costTracker.getCostSummary();
  console.log('Costs:', summary);
}
```

---

## API Reference

### CostTracker Class

#### Constructor

```typescript
new CostTracker(initialCalls?: APICall[])
```

Create a new cost tracker instance, optionally with pre-existing call data.

#### Methods

##### trackOpenAICall()

Track an OpenAI API call and calculate its cost.

```typescript
trackOpenAICall(params: {
  model: OpenAIModel;
  projectId: string;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  characters?: number;
}): APICall
```

**Supported Models:**
- Chat: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- Audio: `whisper-1` (requires `audioSeconds`)
- TTS: `tts-1`, `tts-1-hd` (requires `characters`)

**Examples:**

```typescript
// Chat completion
tracker.trackOpenAICall({
  model: 'gpt-4o',
  projectId: 'sentra',
  inputTokens: 1000,
  outputTokens: 500,
});

// Whisper transcription
tracker.trackOpenAICall({
  model: 'whisper-1',
  projectId: 'sentra',
  audioSeconds: 90, // 1.5 minutes
});

// Text-to-speech
tracker.trackOpenAICall({
  model: 'tts-1',
  projectId: 'sentra',
  characters: 50000,
});
```

##### trackAnthropicCall()

Track an Anthropic API call and calculate its cost.

```typescript
trackAnthropicCall(params: {
  model: AnthropicModel;
  projectId: string;
  inputTokens: number;
  outputTokens: number;
}): APICall
```

**Supported Models:** `claude-opus-4`, `claude-sonnet-4-5`, `claude-sonnet-3-5`, `claude-haiku-3-5`

**Example:**

```typescript
tracker.trackAnthropicCall({
  model: 'claude-sonnet-4-5',
  projectId: 'sentra',
  inputTokens: 2000,
  outputTokens: 1000,
});
```

##### getCostSummary()

Get aggregated costs across all tracked calls.

```typescript
getCostSummary(): CostSummary
```

**Returns:**

```typescript
{
  totalCost: number;           // Total cost in USD
  totalCalls: number;          // Number of API calls
  totalTokens: {
    input: number;
    output: number;
  };
  byProvider: {                // Breakdown by provider
    openai: CostBreakdown;
    anthropic: CostBreakdown;
  };
  byModel: {                   // Breakdown by model
    [model: string]: CostBreakdown;
  };
  byProject: {                 // Breakdown by project
    [projectId: string]: CostBreakdown;
  };
}
```

**Example:**

```typescript
const summary = tracker.getCostSummary();

console.log(`Total: $${summary.totalCost.toFixed(2)}`);
console.log(`OpenAI: $${summary.byProvider.openai?.cost.toFixed(2) || 0}`);
console.log(`Anthropic: $${summary.byProvider.anthropic?.cost.toFixed(2) || 0}`);
console.log(`GPT-4o calls: ${summary.byModel['gpt-4o']?.calls || 0}`);
```

##### getProjectCosts()

Get costs for a specific project.

```typescript
getProjectCosts(projectId: string): ProjectCosts
```

**Example:**

```typescript
const sentraCosts = tracker.getProjectCosts('sentra');
console.log(`Sentra total: $${sentraCosts.totalCost.toFixed(2)}`);
console.log(`Sentra calls: ${sentraCosts.totalCalls}`);
```

##### getCostsByTimeRange()

Get costs within a specific date range.

```typescript
getCostsByTimeRange(start: Date, end: Date): CostSummary
```

**Example:**

```typescript
// Last 7 days
const now = new Date();
const weekAgo = new Date(now);
weekAgo.setDate(now.getDate() - 7);

const weeklyCosts = tracker.getCostsByTimeRange(weekAgo, now);
console.log(`Last 7 days: $${weeklyCosts.totalCost.toFixed(2)}`);
```

##### getDailyCosts()

Get costs grouped by day.

```typescript
getDailyCosts(days: number): DailyCost[]
```

**Returns:** Array of `{ date: string, cost: number, calls: number }` sorted newest first.

**Example:**

```typescript
const dailyCosts = tracker.getDailyCosts(30); // Last 30 days

dailyCosts.forEach(day => {
  console.log(`${day.date}: $${day.cost.toFixed(2)} (${day.calls} calls)`);
});
```

##### getMostExpensiveOperations()

Get the most expensive API calls.

```typescript
getMostExpensiveOperations(limit: number): APICall[]
```

**Example:**

```typescript
const top10 = tracker.getMostExpensiveOperations(10);

top10.forEach((call, i) => {
  console.log(`${i + 1}. ${call.model} - $${call.cost.toFixed(4)} (${call.projectId})`);
});
```

##### exportData() / importData()

Export and import cost data for persistence.

```typescript
exportData(): { calls: APICall[], exportedAt: Date }
importData(data: { calls: APICall[], exportedAt: Date }): void
```

**Example:**

```typescript
// Export to localStorage
const data = tracker.exportData();
localStorage.setItem('costData', JSON.stringify(data));

// Import from localStorage
const stored = localStorage.getItem('costData');
if (stored) {
  const data = JSON.parse(stored);
  tracker.importData(data);
}
```

##### clear()

Remove all tracked calls.

```typescript
clear(): void
```

##### getPricing() (static)

Get current pricing tables for all models.

```typescript
static getPricing(): PricingTable
```

---

## Pricing Tables

Pricing as of November 2025:

### OpenAI

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| gpt-4o | $0.0025 | $0.01 |
| gpt-4o-mini | $0.00015 | $0.0006 |
| gpt-4-turbo | $0.01 | $0.03 |
| gpt-4 | $0.03 | $0.06 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |

| Model | Pricing |
|-------|---------|
| whisper-1 | $0.006 per minute |
| tts-1 | $15 per 1M characters |
| tts-1-hd | $30 per 1M characters |

### Anthropic

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| claude-opus-4 | $0.015 | $0.075 |
| claude-sonnet-4-5 | $0.003 | $0.015 |
| claude-sonnet-3-5 | $0.003 | $0.015 |
| claude-haiku-3-5 | $0.0008 | $0.004 |

---

## Integration with Dashboard

### Display Total Costs

```typescript
import { getGlobalCostTracker } from '@/lib/openai-interceptor';

function CostWidget() {
  const tracker = getGlobalCostTracker();
  const summary = tracker?.getCostSummary();

  return (
    <div>
      <h3>Total Costs</h3>
      <p>${summary?.totalCost.toFixed(2) || '0.00'}</p>
      <p>{summary?.totalCalls || 0} API calls</p>
    </div>
  );
}
```

### Per-Project Costs

```typescript
function ProjectCostsWidget({ projectId }: { projectId: string }) {
  const tracker = getGlobalCostTracker();
  const costs = tracker?.getProjectCosts(projectId);

  return (
    <div>
      <h4>{projectId} Costs</h4>
      <p>${costs?.totalCost.toFixed(2) || '0.00'}</p>
    </div>
  );
}
```

### Daily Spending Chart

```typescript
function DailySpendingChart() {
  const tracker = getGlobalCostTracker();
  const dailyCosts = tracker?.getDailyCosts(30) || [];

  return (
    <div>
      {dailyCosts.map(day => (
        <div key={day.date}>
          <span>{day.date}</span>
          <span>${day.cost.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

The cost tracker has 100% statement coverage and 96% branch coverage.

Run tests:

```bash
npm test -- tests/unit/services/cost-tracker.test.ts
```

Run with coverage:

```bash
npm test -- tests/unit/services/cost-tracker.test.ts --coverage
```

---

## Architecture

### File Structure

```
src/
├── services/
│   ├── cost-tracker.ts          # Core service (100% coverage)
│   └── README-COST-TRACKING.md  # This file
├── lib/
│   └── openai-interceptor.ts    # Automatic tracking via fetch interception
tests/
└── unit/
    └── services/
        └── cost-tracker.test.ts # 42 comprehensive tests
```

### Design Decisions

1. **In-Memory Storage**: Costs are stored in-memory and can be persisted to localStorage. Future versions may use a database.

2. **Fetch Interception**: The interceptor wraps `window.fetch` to automatically track OpenAI calls without modifying existing code.

3. **TypeScript Strict Mode**: All code follows TypeScript strict mode with explicit types, no `any`, no `@ts-ignore`.

4. **Test-Driven Development**: Tests were written FIRST, then implementation made them pass.

5. **Cost Calculation**: Costs are calculated client-side using pricing tables. This allows instant feedback without API calls.

---

## Future Enhancements

- [ ] Backend storage for cost data (PostgreSQL)
- [ ] Cost budgets and alerts
- [ ] Cost optimization recommendations
- [ ] Support for additional providers (Cohere, HuggingFace, etc.)
- [ ] Real-time cost streaming to dashboard
- [ ] Export to CSV/Excel
- [ ] Cost forecasting based on historical trends

---

## Related Documentation

- [/docs/roadmap/observability.md](/docs/roadmap/observability.md) - Observability vision
- [/docs/roadmap/dashboard-redesign.md](/docs/roadmap/dashboard-redesign.md) - Dashboard design

---

*Implemented by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
