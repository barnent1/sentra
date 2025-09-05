// Basic types for the dashboard
export interface EvolutionEvent {
  id?: number
  source_app: string
  session_id: string  
  hook_event_type: string
  payload: any
  chat?: any[]
  summary?: string
  timestamp?: number
}

export interface AgentInstance {
  id: string
  type: string
  status: string
  performance?: any
}

export interface PerformanceMetrics {
  id: string
  metrics: Record<string, number>
  timestamp: number
}

export interface LearningOutcome {
  id: string
  outcome: string
  confidence: number
  timestamp: number
}
