import type { EvolutionWebSocketEvent } from '../composables/useEvolutionWebSocket'

interface DemoConfig {
  readonly sessionIds: readonly string[]
  readonly sourceApps: readonly string[]
  readonly eventTypes: readonly string[]
  readonly species: readonly string[]
  readonly mutations: readonly string[]
}

const DEMO_CONFIG: DemoConfig = {
  sessionIds: [
    'evolution-session-001',
    'evolution-session-002', 
    'dna-lab-session-01',
    'agent-pool-alpha',
    'learning-cluster-beta'
  ],
  sourceApps: [
    'evolution-engine',
    'dna-laboratory',
    'agent-pool-manager',
    'learning-optimizer',
    'fitness-evaluator'
  ],
  eventTypes: [
    'evolution_event',
    'dna_mutation',
    'agent_spawn',
    'agent_death',
    'agent_update',
    'learning_outcome',
    'performance_update'
  ],
  species: [
    'adaptive-agent-v2',
    'neural-optimizer',
    'reinforcement-learner',
    'genetic-algorithm-agent',
    'swarm-intelligence-node',
    'evolutionary-strategist'
  ],
  mutations: [
    'learning-rate-boost',
    'neural-pathway-enhancement',
    'memory-expansion',
    'decision-tree-pruning',
    'attention-mechanism-upgrade',
    'reward-system-refinement',
    'exploration-balance-adjustment'
  ]
} as const

export class DemoDataGenerator {
  private eventCounter = 0
  private readonly startTime = Date.now()

  generateEvent(): EvolutionWebSocketEvent {
    this.eventCounter++
    
    const eventType = this.randomChoice(DEMO_CONFIG.eventTypes)
    const sessionId = this.randomChoice(DEMO_CONFIG.sessionIds)
    const sourceApp = this.randomChoice(DEMO_CONFIG.sourceApps)
    const timestamp = this.startTime + Math.random() * 3600000 // Within last hour
    
    return {
      id: this.eventCounter,
      source_app: sourceApp,
      session_id: sessionId,
      hook_event_type: eventType,
      payload: this.generatePayload(eventType),
      summary: this.generateSummary(eventType),
      timestamp
    }
  }

  generateBatch(count: number): EvolutionWebSocketEvent[] {
    return Array.from({ length: count }, () => this.generateEvent())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  }

  generateStreamEvent(): EvolutionWebSocketEvent {
    // Generate events with recent timestamps for live streaming
    const event = this.generateEvent()
    return {
      ...event,
      timestamp: Date.now() - Math.random() * 30000 // Within last 30 seconds
    }
  }

  private generatePayload(eventType: string): Record<string, unknown> {
    switch (eventType) {
      case 'evolution_event':
        return {
          species: this.randomChoice(DEMO_CONFIG.species),
          generation: Math.floor(Math.random() * 100) + 1,
          fitness: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)), // 0.6-1.0
          mutation: this.randomChoice(DEMO_CONFIG.mutations),
          parentFitness: parseFloat((Math.random() * 0.3 + 0.5).toFixed(3)), // 0.5-0.8
          populationSize: Math.floor(Math.random() * 50) + 10
        }
        
      case 'dna_mutation':
        return {
          mutation: this.randomChoice(DEMO_CONFIG.mutations),
          oldDna: `baseline-v${Math.floor(Math.random() * 5) + 1}`,
          newDna: `enhanced-v${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}`,
          improvement: parseFloat((Math.random() * 0.3 + 0.05).toFixed(3)), // 0.05-0.35
          stabilityScore: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)) // 0.6-1.0
        }
        
      case 'agent_spawn':
        return {
          agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
          species: this.randomChoice(DEMO_CONFIG.species),
          parentIds: this.generateParentIds(),
          initialFitness: parseFloat((Math.random() * 0.3 + 0.4).toFixed(3)), // 0.4-0.7
          dnaVariant: this.randomChoice(DEMO_CONFIG.mutations),
          spawnReason: this.randomChoice(['crossover', 'mutation', 'elitism', 'exploration'])
        }
        
      case 'agent_death':
        return {
          agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
          species: this.randomChoice(DEMO_CONFIG.species),
          finalFitness: parseFloat((Math.random() * 0.6 + 0.2).toFixed(3)), // 0.2-0.8
          lifespan: Math.floor(Math.random() * 3600) + 300, // 5min-1hour in seconds
          deathReason: this.randomChoice(['low-fitness', 'resource-limit', 'age-limit', 'replaced'])
        }
        
      case 'learning_outcome':
        return {
          agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
          learningType: this.randomChoice(['reinforcement', 'supervised', 'unsupervised', 'meta-learning']),
          performanceGain: parseFloat((Math.random() * 0.2 + 0.05).toFixed(3)), // 0.05-0.25
          learningRate: parseFloat((Math.random() * 0.01 + 0.001).toFixed(4)), // 0.001-0.011
          episodeCount: Math.floor(Math.random() * 1000) + 100,
          convergence: Math.random() > 0.3 // 70% convergence rate
        }
        
      case 'performance_update':
        return {
          agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
          performance: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)), // 0.6-1.0
          previousPerformance: parseFloat((Math.random() * 0.4 + 0.4).toFixed(3)), // 0.4-0.8
          tasksCompleted: Math.floor(Math.random() * 50) + 10,
          averageResponseTime: Math.floor(Math.random() * 500) + 50, // 50-550ms
          errorRate: parseFloat((Math.random() * 0.1).toFixed(3)) // 0-0.1
        }
        
      default:
        return {
          eventData: 'generic-event-data',
          timestamp: Date.now(),
          randomValue: Math.random()
        }
    }
  }

  private generateSummary(eventType: string): string {
    const summaries: Record<string, readonly string[]> = {
      evolution_event: [
        'Significant evolution breakthrough detected',
        'New species variant emerged with improved capabilities',
        'Population fitness increased through selective pressure',
        'Genetic diversity expanded with novel mutations',
        'Evolutionary algorithm reached new performance milestone'
      ],
      dna_mutation: [
        'DNA mutation resulted in enhanced neural pathways',
        'Beneficial genetic variation introduced to population',
        'Structural DNA changes improved agent adaptation',
        'Mutation cascade triggered performance improvements',
        'Genetic recombination yielded superior offspring'
      ],
      agent_spawn: [
        'New agent spawned from high-performing parents',
        'Crossover operation produced promising offspring',
        'Elite agent characteristics passed to new generation',
        'Diverse genetic material combined in new agent',
        'Successful reproduction event expanded population'
      ],
      agent_death: [
        'Low-performing agent removed from population',
        'Resource-limited agent lifecycle completed',
        'Natural selection eliminated unfit individual',
        'Agent replacement cycle maintained population health',
        'Evolutionary pressure removed suboptimal variant'
      ],
      learning_outcome: [
        'Agent achieved significant learning milestone',
        'Reinforcement learning cycle completed successfully',
        'Knowledge transfer improved decision-making ability',
        'Meta-learning algorithm adapted to new challenges',
        'Performance optimization through experience gained'
      ],
      performance_update: [
        'Agent performance metrics updated and analyzed',
        'Task completion efficiency reached new benchmark',
        'Response time optimization showed measurable gains',
        'Error rate reduction indicates improved reliability',
        'Overall system performance trending positively'
      ]
    } as const
    
    const eventSummaries = summaries[eventType] || ['Generic event occurred in the system']
    return this.randomChoice(eventSummaries)
  }

  private generateParentIds(): readonly string[] {
    const numParents = Math.random() > 0.7 ? 2 : 1 // 30% chance of two parents
    return Array.from({ length: numParents }, () => 
      `agent-${Math.random().toString(36).substr(2, 9)}`
    )
  }

  private randomChoice<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }
}

// Singleton instance for consistency
export const demoGenerator = new DemoDataGenerator()