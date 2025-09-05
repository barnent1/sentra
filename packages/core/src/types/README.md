# Sentra Evolutionary Agent Type System

> Comprehensive TypeScript type definitions for the Sentra Evolutionary Agent System following strict TypeScript patterns with branded types and readonly interfaces.

## Overview

The Sentra type system provides a complete foundation for building evolutionary AI agents with full type safety, performance monitoring, and event-driven architecture. All types follow SENTRA project standards:

- **Strict TypeScript**: Latest TypeScript features with strict mode
- **Branded Types**: Type-safe IDs using brand patterns
- **Readonly Interfaces**: Immutable data structures throughout
- **Generic Constraints**: Proper constraints for AI/ML operations
- **Comprehensive JSDoc**: Full documentation for all types

## Architecture

The type system is organized into four main modules:

```
types/
├── evolution.ts    # Evolutionary DNA, genetics, and mutation types
├── agents.ts       # Agent interfaces, capabilities, and behaviors  
├── events.ts       # Event-driven architecture types
├── monitoring.ts   # Performance monitoring and metrics
└── index.ts        # Unified exports and utilities
```

## Core Modules

### 1. Evolution Types (`evolution.ts`)

Comprehensive type system for evolutionary learning and genetic operations:

```typescript
import { CodeDNA, GeneticMarkers, EvolutionEngine } from '@sentra/core/types';

// Enhanced genetic markers with normalized 0-1 values
interface GeneticMarkers {
  readonly complexity: number;        // Problem handling complexity
  readonly adaptability: number;      // Speed of adaptation
  readonly successRate: number;       // Historical success rate
  readonly transferability: number;   // Cross-project knowledge transfer
  readonly stability: number;         // Performance consistency
  readonly novelty: number;          // Unique solution tendency
  // ... 16 total genetic traits
}

// Complete DNA record with lifecycle tracking
interface CodeDNA {
  readonly id: EvolutionDnaId;
  readonly patternType: PatternTypeEnum;
  readonly genetics: GeneticMarkers;
  readonly performance: PerformanceMetrics;
  readonly mutations: readonly Mutation[];
  readonly embedding: readonly number[];   // Vector similarity matching
  readonly evolutionHistory: readonly EvolutionStep[];
  readonly fitnessScore: FitnessScore;
  // ... complete lifecycle tracking
}
```

**Key Features:**
- 🧬 16 comprehensive genetic markers
- 🔄 Complete mutation tracking with confidence scores  
- 📊 Multi-dimensional performance metrics
- 🎯 Vector operations with proper generic constraints
- 📈 Evolution history and fitness assessment

### 2. Agent Types (`agents.ts`)

Abstract base classes and interfaces for all agent types:

```typescript
import { BaseEvolutionaryAgent, AgentCapabilities } from '@sentra/core/types';

// Abstract base class all agents must implement
abstract class BaseEvolutionaryAgent<TCapabilities extends AgentCapabilities> {
  abstract readonly capabilities: TCapabilities;
  abstract readonly memory: MemorySystem;
  
  abstract learn(outcome: LearningOutcome): Promise<void>;
  abstract adapt(context: ProjectContext): Promise<void>;
  abstract evolve(feedback: PerformanceFeedback): Promise<EvolutionResult>;
  abstract executeTask(task: AgentTask): Promise<TaskResult>;
}

// Memory system with vector-based retrieval
interface MemorySystem {
  store(memory: AgentMemory): Promise<AgentMemory>;
  recall(query: string, type?: MemoryTypeEnum): Promise<readonly AgentMemory[]>;
  reinforce(memoryId: AgentMemoryId, strengthDelta: number): Promise<void>;
  consolidate(): Promise<number>;
}
```

**Key Features:**
- 🤖 Abstract agent base class with strict interface
- 🧠 Vector-based memory system with forgetting
- 💭 Emotional state modeling affecting behavior
- 🎓 Learning sessions with breakthrough tracking
- 🤝 Collaboration and knowledge transfer interfaces
- 🔧 Specialized agent types (CodeGenerator, Testing, PM)

### 3. Event Types (`events.ts`)

Event-driven architecture for system coordination:

```typescript
import { SentraEvent, EventBus, EventHandler } from '@sentra/core/types';

// Union of all possible system events
type SentraEvent = 
  | AgentSpawnedEvent
  | TaskCompletedEvent  
  | LearningBreakthroughEvent
  | DnaEvolutionTriggeredEvent
  | PerformanceThresholdCrossedEvent
  // ... 20+ event types

// Event bus for real-time processing
interface EventBus {
  publish(event: BaseEvent): Promise<void>;
  subscribe<T extends BaseEvent>(
    eventType: T['type'], 
    handler: EventHandler<T>
  ): Promise<string>;
  subscribeWithFilter<T extends BaseEvent>(
    filter: (event: BaseEvent) => event is T,
    handler: EventHandler<T>
  ): Promise<string>;
}
```

**Key Features:**
- 📡 20+ comprehensive event types covering all system activities
- 🔄 Real-time event bus with subscription management  
- 🎯 Type-safe event handlers with proper generics
- 📊 Event correlation and causation tracking
- 🚨 Event-driven alerting and monitoring
- 📈 Event store with time-series querying

### 4. Monitoring Types (`monitoring.ts`)

Performance monitoring and observability:

```typescript
import { MonitoringService, PerformanceProfile, Dashboard } from '@sentra/core/types';

// Comprehensive monitoring service
interface MonitoringService {
  collectMetric(metric: MetricDataPoint): Promise<void>;
  queryMetrics(
    metricType: MetricTypeEnum,
    timeWindow: TimeWindowEnum,
    aggregation: MetricAggregationEnum
  ): Promise<readonly AggregatedMetric[]>;
  generatePerformanceProfile(agentId: AgentInstanceId): Promise<PerformanceProfile>;
  createAlert(alert: Alert): Promise<AlertId>;
}

// Multi-dimensional performance profiling
interface PerformanceProfile {
  readonly executionProfile: ExecutionProfile;
  readonly resourceProfile: ResourceProfile;
  readonly learningProfile: LearningProfile;
  readonly collaborationProfile: CollaborationProfile;
  readonly overallAssessment: ProfileAssessment;
}
```

**Key Features:**
- 📊 25+ metric types from latency to learning velocity
- 📈 Time-series data with trend analysis and forecasting
- 🎨 Configurable dashboards with 12+ widget types
- 🚨 Smart alerting with threshold management
- 👤 Comprehensive agent profiling
- 🔍 Anomaly detection and root cause analysis

## Usage Examples

### Basic Agent Creation

```typescript
import { BaseEvolutionaryAgent, AgentCapabilities } from '@sentra/core/types';

class MyEvolutionaryAgent extends BaseEvolutionaryAgent<AgentCapabilities> {
  readonly type = AgentSpecialization.FULL_STACK_DEVELOPER;
  
  async learn(outcome: LearningOutcome): Promise<void> {
    // Store learning outcome in memory
    await this.memory.store({
      type: MemoryType.EPISODIC,
      content: outcome.lessonLearned,
      context: { taskId: outcome.taskId },
      // ... 
    });
  }
  
  async executeTask(task: AgentTask): Promise<TaskResult> {
    // Retrieve relevant memories
    const memories = await this.memory.recall(task.description);
    
    // Execute task using memories and capabilities
    return {
      success: true,
      taskId: task.id,
      output: { /* task results */ },
      performance: { /* performance metrics */ }
    };
  }
}
```

### Event-Driven Monitoring

```typescript
import { EventBus, MonitoringService } from '@sentra/core/types';

// Subscribe to task completion events
await eventBus.subscribe('task_completed', async (event: TaskCompletedEvent) => {
  // Collect performance metrics
  await monitoringService.collectMetric({
    type: MetricType.SUCCESS_RATE,
    value: event.data.result.success ? 1 : 0,
    source: { type: 'agent', id: event.data.agentId },
    // ...
  });
  
  // Trigger evolution if performance threshold reached
  if (event.data.result.performance.successRate < 0.8) {
    await eventBus.publish({
      type: 'dna_evolution_triggered',
      data: { 
        dnaId: event.data.result.dnaId,
        trigger: 'performance_threshold'
      }
    });
  }
});
```

### Performance Dashboard

```typescript
import { Dashboard, DashboardWidget } from '@sentra/core/types';

const agentDashboard: Dashboard = {
  id: 'agent-performance-dashboard' as DashboardId,
  name: 'Agent Performance Overview',
  widgets: [
    {
      id: 'success-rate-chart',
      type: DashboardWidgetType.LINE_CHART,
      title: 'Success Rate Trend',
      datasource: {
        type: 'metrics',
        query: 'success_rate',
        aggregation: MetricAggregation.AVERAGE,
        timeWindow: TimeWindow.DAY
      },
      // ...
    },
    {
      id: 'learning-velocity-gauge', 
      type: DashboardWidgetType.GAUGE,
      title: 'Learning Velocity',
      configuration: {
        thresholds: [
          { value: 0.8, comparison: 'less_than', color: 'red' },
          { value: 0.9, comparison: 'greater_than', color: 'green' }
        ]
      }
      // ...
    }
  ]
  // ...
};
```

## Type Safety Features

### Branded Types

All IDs use branded types for compile-time safety:

```typescript
// ❌ This will cause a TypeScript error:
const agentId: AgentInstanceId = "random-string";

// ✅ Must use proper branded type:
const agentId: AgentInstanceId = "agent-123" as AgentInstanceId;
```

### Vector Operations with Constraints

```typescript
// Type-safe vector operations with dimensionality checking
interface VectorLike<D extends number = number> {
  readonly length: D;
  readonly [index: number]: number;
}

function cosineSimilarity<D extends number>(
  a: VectorLike<D>, 
  b: VectorLike<D>
): number {
  // Implementation ensures both vectors have same dimensionality
}
```

### Readonly Interfaces

All interfaces are deeply readonly to prevent mutation:

```typescript
interface GeneticMarkers {
  readonly complexity: number;          // Cannot be mutated
  readonly adaptability: number;        // Cannot be mutated
  // ... all properties readonly
}
```

## Integration with Database Schema

Types integrate seamlessly with the Drizzle ORM schema:

```typescript
// Database schema uses branded types from type system
export const evolutionDna = pgTable('evolution_dna', {
  id: uuid('id').$type<EvolutionDnaId>(),
  genetics: jsonb('genetics').$type<GeneticMarkers>(),
  performance: jsonb('performance').$type<PerformanceMetrics>(),
  // ...
});
```

## Performance Considerations

- **Vector Operations**: Optimized for high-dimensional embeddings (1536D default)
- **Memory Management**: Built-in memory forgetting and consolidation
- **Event Processing**: Efficient event filtering and batching
- **Monitoring**: Configurable sampling rates and aggregation windows

## Extension Points

The type system is designed for extensibility:

### Custom Agent Types

```typescript
interface MySpecializedAgent extends BaseEvolutionaryAgent<MyCapabilities> {
  customMethod(params: MyParams): Promise<MyResult>;
}
```

### Custom Events

```typescript
interface MyCustomEvent extends BaseEvent {
  readonly type: 'my_custom_event';
  readonly data: {
    readonly customField: string;
    // ...
  };
}
```

### Custom Metrics

```typescript
// Add to MetricType enum
export const MyMetricType = {
  ...MetricType,
  MY_CUSTOM_METRIC: 'my_custom_metric',
} as const;
```

## Best Practices

1. **Use Branded Types**: Always use branded IDs for type safety
2. **Readonly Everywhere**: Prefer readonly interfaces and arrays
3. **Generic Constraints**: Use proper constraints for ML operations
4. **Event-Driven**: Leverage events for loose coupling
5. **Comprehensive Monitoring**: Monitor all agent activities
6. **Memory Management**: Implement proper forgetting policies

## Version Compatibility

- **Schema Version**: v1.0.0
- **TypeScript**: >=5.0.0 required
- **Backward Compatibility**: Semantic versioning for breaking changes

## Documentation

- **JSDoc Coverage**: 100% - all types documented
- **Examples**: Comprehensive usage examples throughout
- **API Reference**: Generated from TypeScript declarations
- **Migration Guide**: Available for version upgrades

---

**Built with ❤️ by the Sentra Development Team**

*Following SENTRA project standards for evolutionary agent architecture*