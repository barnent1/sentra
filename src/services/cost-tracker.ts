/**
 * Cost Tracker Service
 *
 * Tracks API costs for OpenAI and Anthropic calls in real-time.
 * Calculates costs based on current pricing tables.
 * Provides aggregation by project, model, provider, and time range.
 *
 * Usage:
 *   const tracker = new CostTracker();
 *   tracker.trackOpenAICall({ model: 'gpt-4o', projectId: 'quetrex', inputTokens: 1000, outputTokens: 500 });
 *   const summary = tracker.getCostSummary();
 */

// ============================================================================
// Types
// ============================================================================

export type Provider = 'openai' | 'anthropic';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'whisper-1'
  | 'tts-1'
  | 'tts-1-hd';

export type AnthropicModel =
  | 'claude-opus-4'
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-3-5'
  | 'claude-haiku-3-5';

export interface APICall {
  id: string;
  timestamp: Date;
  provider: Provider;
  model: string;
  projectId: string;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number; // For Whisper
  characters?: number; // For TTS
  cost: number;
}

export interface CostBreakdown {
  cost: number;
  calls: number;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface CostSummary {
  totalCost: number;
  totalCalls: number;
  totalTokens: {
    input: number;
    output: number;
  };
  byProvider: Record<Provider, CostBreakdown>;
  byModel: Record<string, CostBreakdown>;
  byProject: Record<string, CostBreakdown>;
}

export interface ProjectCosts extends CostSummary {
  projectId: string;
}

export interface DailyCost {
  date: string; // ISO date string
  cost: number;
  calls: number;
}

export interface ModelPricing {
  input: number; // Cost per 1K tokens
  output: number; // Cost per 1K tokens
}

export interface PricingTable {
  openai: Record<string, ModelPricing | { perMinute?: number; perMillionChars?: number }>;
  anthropic: Record<string, ModelPricing>;
}

// ============================================================================
// Pricing Tables (Updated as of November 2025)
// ============================================================================

const OPENAI_PRICING: Record<
  OpenAIModel,
  ModelPricing | { perMinute?: number; perMillionChars?: number }
> = {
  // Chat models (per 1K tokens)
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Audio models
  'whisper-1': { perMinute: 0.006 },
  'tts-1': { perMillionChars: 15 },
  'tts-1-hd': { perMillionChars: 30 },
};

const ANTHROPIC_PRICING: Record<AnthropicModel, ModelPricing> = {
  'claude-opus-4': { input: 0.015, output: 0.075 },
  'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
  'claude-sonnet-3-5': { input: 0.003, output: 0.015 },
  'claude-haiku-3-5': { input: 0.0008, output: 0.004 },
};

// ============================================================================
// Cost Tracker Class
// ============================================================================

export class CostTracker {
  private calls: APICall[] = [];

  constructor(initialCalls?: APICall[]) {
    if (initialCalls) {
      // Ensure timestamps are Date objects (may be strings from JSON)
      this.calls = initialCalls.map(call => ({
        ...call,
        timestamp: call.timestamp instanceof Date ? call.timestamp : new Date(call.timestamp),
      }));
    }
  }

  // --------------------------------------------------------------------------
  // Track API Calls
  // --------------------------------------------------------------------------

  trackOpenAICall(params: {
    model: OpenAIModel;
    projectId: string;
    inputTokens?: number;
    outputTokens?: number;
    audioSeconds?: number;
    characters?: number;
  }): APICall {
    const { model, projectId, inputTokens, outputTokens, audioSeconds, characters } = params;

    const pricing = OPENAI_PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown OpenAI model: ${model}`);
    }

    let cost = 0;

    // Calculate cost based on model type
    if ('perMinute' in pricing && pricing.perMinute !== undefined && audioSeconds !== undefined) {
      // Whisper STT
      const minutes = audioSeconds / 60;
      cost = minutes * pricing.perMinute;
    } else if ('perMillionChars' in pricing && pricing.perMillionChars !== undefined && characters !== undefined) {
      // TTS
      cost = (characters / 1000000) * pricing.perMillionChars;
    } else if ('input' in pricing && inputTokens !== undefined && outputTokens !== undefined) {
      // Chat models
      cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    } else {
      throw new Error(
        `Missing required parameters for model ${model}. Chat models need inputTokens and outputTokens. Whisper needs audioSeconds. TTS needs characters.`
      );
    }

    const call: APICall = {
      id: this.generateId(),
      timestamp: new Date(),
      provider: 'openai',
      model,
      projectId,
      inputTokens,
      outputTokens,
      audioSeconds,
      characters,
      cost,
    };

    this.calls.push(call);
    return call;
  }

  trackAnthropicCall(params: {
    model: AnthropicModel;
    projectId: string;
    inputTokens: number;
    outputTokens: number;
  }): APICall {
    const { model, projectId, inputTokens, outputTokens } = params;

    const pricing = ANTHROPIC_PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown Anthropic model: ${model}`);
    }

    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;

    const call: APICall = {
      id: this.generateId(),
      timestamp: new Date(),
      provider: 'anthropic',
      model,
      projectId,
      inputTokens,
      outputTokens,
      cost,
    };

    this.calls.push(call);
    return call;
  }

  // --------------------------------------------------------------------------
  // Query Methods
  // --------------------------------------------------------------------------

  getCostSummary(): CostSummary {
    return this.aggregateCalls(this.calls);
  }

  getProjectCosts(projectId: string): ProjectCosts {
    const projectCalls = this.calls.filter(call => call.projectId === projectId);
    return {
      projectId,
      ...this.aggregateCalls(projectCalls),
    };
  }

  getCostsByTimeRange(start: Date, end: Date): CostSummary {
    const filteredCalls = this.calls.filter(
      call => call.timestamp >= start && call.timestamp <= end
    );
    return this.aggregateCalls(filteredCalls);
  }

  getDailyCosts(days: number): DailyCost[] {
    const dailyMap = new Map<string, { cost: number; calls: number }>();

    // Get date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Filter calls within range
    const recentCalls = this.calls.filter(call => call.timestamp >= startDate);

    // Group by day
    recentCalls.forEach(call => {
      const dateKey = call.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { cost: 0, calls: 0 };
      dailyMap.set(dateKey, {
        cost: existing.cost + call.cost,
        calls: existing.calls + 1,
      });
    });

    // Convert to array and sort descending (newest first)
    const result = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        cost: data.cost,
        calls: data.calls,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }

  getMostExpensiveOperations(limit: number): APICall[] {
    return [...this.calls].sort((a, b) => b.cost - a.cost).slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // Data Management
  // --------------------------------------------------------------------------

  clear(): void {
    this.calls = [];
  }

  exportData(): { calls: APICall[]; exportedAt: Date } {
    return {
      calls: this.calls,
      exportedAt: new Date(),
    };
  }

  importData(data: { calls: APICall[]; exportedAt: Date }): void {
    // Ensure timestamps are Date objects
    this.calls = data.calls.map(call => ({
      ...call,
      timestamp: call.timestamp instanceof Date ? call.timestamp : new Date(call.timestamp),
    }));
  }

  // --------------------------------------------------------------------------
  // Static Methods
  // --------------------------------------------------------------------------

  static getPricing(): PricingTable {
    return {
      openai: OPENAI_PRICING,
      anthropic: ANTHROPIC_PRICING,
    };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private aggregateCalls(calls: APICall[]): CostSummary {
    const summary: CostSummary = {
      totalCost: 0,
      totalCalls: calls.length,
      totalTokens: {
        input: 0,
        output: 0,
      },
      byProvider: {} as Record<Provider, CostBreakdown>,
      byModel: {},
      byProject: {},
    };

    calls.forEach(call => {
      // Total cost
      summary.totalCost += call.cost;

      // Total tokens
      if (call.inputTokens) summary.totalTokens.input += call.inputTokens;
      if (call.outputTokens) summary.totalTokens.output += call.outputTokens;

      // By provider
      if (!summary.byProvider[call.provider]) {
        summary.byProvider[call.provider] = {
          cost: 0,
          calls: 0,
          tokens: { input: 0, output: 0 },
        };
      }
      summary.byProvider[call.provider].cost += call.cost;
      summary.byProvider[call.provider].calls += 1;
      if (call.inputTokens)
        summary.byProvider[call.provider].tokens!.input += call.inputTokens;
      if (call.outputTokens)
        summary.byProvider[call.provider].tokens!.output += call.outputTokens;

      // By model
      if (!summary.byModel[call.model]) {
        summary.byModel[call.model] = {
          cost: 0,
          calls: 0,
          tokens: { input: 0, output: 0 },
        };
      }
      summary.byModel[call.model].cost += call.cost;
      summary.byModel[call.model].calls += 1;
      if (call.inputTokens) summary.byModel[call.model].tokens!.input += call.inputTokens;
      if (call.outputTokens) summary.byModel[call.model].tokens!.output += call.outputTokens;

      // By project
      if (!summary.byProject[call.projectId]) {
        summary.byProject[call.projectId] = {
          cost: 0,
          calls: 0,
          tokens: { input: 0, output: 0 },
        };
      }
      summary.byProject[call.projectId].cost += call.cost;
      summary.byProject[call.projectId].calls += 1;
      if (call.inputTokens)
        summary.byProject[call.projectId].tokens!.input += call.inputTokens;
      if (call.outputTokens)
        summary.byProject[call.projectId].tokens!.output += call.outputTokens;
    });

    return summary;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
