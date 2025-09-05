import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  EvolutionDna,
  EvolutionDnaId,
  EvolutionEvent,
  GeneticMarkers,
  PerformanceMetrics,
  AgentInstanceId,
  LearningOutcome,
  FitnessScore
} from '@sentra/types'

export interface EvolutionLineage {
  readonly id: EvolutionDnaId
  readonly parentId: EvolutionDnaId | undefined
  readonly children: EvolutionDnaId[]
  readonly generation: number
  readonly depth: number
}

export interface EvolutionTrend {
  readonly metric: keyof GeneticMarkers
  readonly values: Array<{ generation: number; value: number; timestamp: Date }>
  readonly trend: 'improving' | 'declining' | 'stable'
  readonly changeRate: number
}

export interface GenerationStats {
  readonly generation: number
  readonly count: number
  readonly averageFitness: number
  readonly topPerformer: EvolutionDnaId
  readonly averageGenetics: GeneticMarkers
  readonly timestamp: Date
}

export interface MutationImpact {
  readonly mutationId: string
  readonly dnaId: EvolutionDnaId
  readonly strategy: string
  readonly fitnessChange: number
  readonly successRate: number
  readonly adoptionRate: number
  readonly timestamp: Date
}

export const useEvolutionStore = defineStore('evolution', () => {
  // Core DNA data
  const dnaPatterns = ref<Map<EvolutionDnaId, EvolutionDna>>(new Map())
  const evolutionEvents = ref<EvolutionEvent[]>([])
  const lineages = ref<Map<EvolutionDnaId, EvolutionLineage>>(new Map())
  
  // Evolution analytics
  const generationStats = ref<Map<number, GenerationStats>>(new Map())
  const evolutionTrends = ref<Map<keyof GeneticMarkers, EvolutionTrend>>(new Map())
  const mutationImpacts = ref<MutationImpact[]>([])
  
  // Performance tracking
  const fitnessScores = ref<Map<EvolutionDnaId, FitnessScore[]>>(new Map())
  const performanceCorrelations = ref<Map<string, number>>(new Map())
  
  // Loading states
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed values
  const totalPatterns = computed(() => dnaPatterns.value.size)
  
  const currentGeneration = computed(() => {
    if (dnaPatterns.value.size === 0) return 0
    return Math.max(...Array.from(dnaPatterns.value.values()).map(dna => dna.generation))
  })
  
  const generationCounts = computed(() => {
    const counts = new Map<number, number>()
    for (const dna of dnaPatterns.value.values()) {
      counts.set(dna.generation, (counts.get(dna.generation) || 0) + 1)
    }
    return counts
  })
  
  const topPerformers = computed(() => {
    return Array.from(dnaPatterns.value.values())
      .sort((a, b) => {
        const aFitness = fitnessScores.value.get(a.id)?.slice(-1)[0] || 0
        const bFitness = fitnessScores.value.get(b.id)?.slice(-1)[0] || 0
        return (bFitness as number) - (aFitness as number)
      })
      .slice(0, 10)
  })
  
  const evolutionRate = computed(() => {
    const recentEvents = evolutionEvents.value
      .filter(event => event.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000))
    return recentEvents.length
  })
  
  const avgGeneticMarkers = computed((): GeneticMarkers => {
    if (dnaPatterns.value.size === 0) {
      return {
        complexity: 0,
        adaptability: 0,
        successRate: 0,
        transferability: 0,
        stability: 0,
        novelty: 0
      }
    }
    
    const patterns = Array.from(dnaPatterns.value.values())
    const sum = patterns.reduce((acc, pattern) => ({
      complexity: acc.complexity + pattern.genetics.complexity,
      adaptability: acc.adaptability + pattern.genetics.adaptability,
      successRate: acc.successRate + pattern.genetics.successRate,
      transferability: acc.transferability + pattern.genetics.transferability,
      stability: acc.stability + pattern.genetics.stability,
      novelty: acc.novelty + pattern.genetics.novelty
    }), {
      complexity: 0,
      adaptability: 0,
      successRate: 0,
      transferability: 0,
      stability: 0,
      novelty: 0
    })
    
    const count = patterns.length
    return {
      complexity: sum.complexity / count,
      adaptability: sum.adaptability / count,
      successRate: sum.successRate / count,
      transferability: sum.transferability / count,
      stability: sum.stability / count,
      novelty: sum.novelty / count
    }
  })

  // Actions
  const fetchEvolutionData = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Fetching evolution data from API...')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch evolution data'
    } finally {
      isLoading.value = false
    }
  }

  const addDnaPattern = (dna: EvolutionDna): void => {
    dnaPatterns.value.set(dna.id, dna)
    
    // Update lineage information
    updateLineage(dna)
    
    // Update generation stats
    updateGenerationStats(dna.generation)
  }

  const updateDnaPattern = (dnaId: EvolutionDnaId, updates: Partial<EvolutionDna>): void => {
    const existing = dnaPatterns.value.get(dnaId)
    if (existing) {
      const updated = { ...existing, ...updates }
      dnaPatterns.value.set(dnaId, updated)
      
      if (updates.generation !== undefined) {
        updateGenerationStats(updates.generation)
      }
    }
  }

  const removeDnaPattern = (dnaId: EvolutionDnaId): void => {
    dnaPatterns.value.delete(dnaId)
    lineages.value.delete(dnaId)
    fitnessScores.value.delete(dnaId)
  }

  const addEvolutionEvent = (event: EvolutionEvent): void => {
    evolutionEvents.value.unshift(event)
    
    // Keep only last 1000 events
    if (evolutionEvents.value.length > 1000) {
      evolutionEvents.value = evolutionEvents.value.slice(0, 1000)
    }
    
    // Update trends based on the event
    updateEvolutionTrends(event)
  }

  const addFitnessScore = (dnaId: EvolutionDnaId, score: FitnessScore): void => {
    const scores = fitnessScores.value.get(dnaId) || []
    scores.push(score)
    
    // Keep only last 50 scores per DNA pattern
    if (scores.length > 50) {
      scores.splice(0, scores.length - 50)
    }
    
    fitnessScores.value.set(dnaId, scores)
  }

  const addMutationImpact = (impact: MutationImpact): void => {
    mutationImpacts.value.unshift(impact)
    
    // Keep only last 100 mutation impacts
    if (mutationImpacts.value.length > 100) {
      mutationImpacts.value = mutationImpacts.value.slice(0, 100)
    }
  }

  const updateLineage = (dna: EvolutionDna): void => {
    const lineage: EvolutionLineage = {
      id: dna.id,
      parentId: dna.parentId,
      children: [],
      generation: dna.generation,
      depth: calculateDepth(dna)
    }
    
    lineages.value.set(dna.id, lineage)
    
    // Update parent's children list
    if (dna.parentId) {
      const parentLineage = lineages.value.get(dna.parentId)
      if (parentLineage && !parentLineage.children.includes(dna.id)) {
        lineages.value.set(dna.parentId, {
          ...parentLineage,
          children: [...parentLineage.children, dna.id]
        })
      }
    }
  }

  const calculateDepth = (dna: EvolutionDna): number => {
    let depth = 0
    let currentParentId = dna.parentId
    
    while (currentParentId) {
      depth++
      const parentDna = dnaPatterns.value.get(currentParentId)
      currentParentId = parentDna?.parentId
      
      // Prevent infinite loops
      if (depth > 1000) break
    }
    
    return depth
  }

  const updateGenerationStats = (generation: number): void => {
    const patternsInGeneration = Array.from(dnaPatterns.value.values())
      .filter(dna => dna.generation === generation)
    
    if (patternsInGeneration.length === 0) return
    
    const avgFitness = patternsInGeneration.reduce((sum, dna) => {
      const scores = fitnessScores.value.get(dna.id) || []
      const latestScore = scores[scores.length - 1] || 0
      return sum + (latestScore as number)
    }, 0) / patternsInGeneration.length
    
    const topPerformer = patternsInGeneration.reduce((best, current) => {
      const bestScore = fitnessScores.value.get(best.id)?.[0] || 0
      const currentScore = fitnessScores.value.get(current.id)?.[0] || 0
      return (currentScore as number) > (bestScore as number) ? current : best
    }).id
    
    const avgGenetics = patternsInGeneration.reduce((sum, dna) => ({
      complexity: sum.complexity + dna.genetics.complexity,
      adaptability: sum.adaptability + dna.genetics.adaptability,
      successRate: sum.successRate + dna.genetics.successRate,
      transferability: sum.transferability + dna.genetics.transferability,
      stability: sum.stability + dna.genetics.stability,
      novelty: sum.novelty + dna.genetics.novelty
    }), {
      complexity: 0,
      adaptability: 0,
      successRate: 0,
      transferability: 0,
      stability: 0,
      novelty: 0
    })
    
    const count = patternsInGeneration.length
    const averageGenetics: GeneticMarkers = {
      complexity: avgGenetics.complexity / count,
      adaptability: avgGenetics.adaptability / count,
      successRate: avgGenetics.successRate / count,
      transferability: avgGenetics.transferability / count,
      stability: avgGenetics.stability / count,
      novelty: avgGenetics.novelty / count
    }
    
    const stats: GenerationStats = {
      generation,
      count: patternsInGeneration.length,
      averageFitness: avgFitness,
      topPerformer,
      averageGenetics,
      timestamp: new Date()
    }
    
    generationStats.value.set(generation, stats)
  }

  const updateEvolutionTrends = (event: EvolutionEvent): void => {
    const parentDna = dnaPatterns.value.get(event.parentDnaId)
    const childDna = dnaPatterns.value.get(event.childDnaId)
    
    if (!parentDna || !childDna) return
    
    // Update trends for each genetic marker
    const geneticMarkers: (keyof GeneticMarkers)[] = [
      'complexity', 'adaptability', 'successRate', 
      'transferability', 'stability', 'novelty'
    ]
    
    geneticMarkers.forEach(marker => {
      const existing = evolutionTrends.value.get(marker)
      const newValue = {
        generation: childDna.generation,
        value: childDna.genetics[marker],
        timestamp: event.createdAt
      }
      
      if (existing) {
        const values = [...existing.values, newValue]
        const trend = calculateTrend(values.slice(-10)) // Use last 10 values for trend
        const changeRate = calculateChangeRate(values.slice(-5)) // Use last 5 for change rate
        
        evolutionTrends.value.set(marker, {
          ...existing,
          values: values.slice(-100), // Keep last 100 values
          trend,
          changeRate
        })
      } else {
        evolutionTrends.value.set(marker, {
          metric: marker,
          values: [newValue],
          trend: 'stable',
          changeRate: 0
        })
      }
    })
  }

  const calculateTrend = (values: Array<{ value: number }>): 'improving' | 'declining' | 'stable' => {
    if (values.length < 3) return 'stable'
    
    const recent = values.slice(-3).map(v => v.value)
    const earlier = values.slice(0, 3).map(v => v.value)
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length
    
    const threshold = 0.05 // 5% change threshold
    const change = (recentAvg - earlierAvg) / earlierAvg
    
    if (change > threshold) return 'improving'
    if (change < -threshold) return 'declining'
    return 'stable'
  }

  const calculateChangeRate = (values: Array<{ value: number }>): number => {
    if (values.length < 2) return 0
    
    const first = values[0].value
    const last = values[values.length - 1].value
    
    return first === 0 ? 0 : (last - first) / first
  }

  // Getters
  const getDnaPattern = (dnaId: EvolutionDnaId): EvolutionDna | undefined => {
    return dnaPatterns.value.get(dnaId)
  }

  const getLineage = (dnaId: EvolutionDnaId): EvolutionLineage | undefined => {
    return lineages.value.get(dnaId)
  }

  const getFitnessHistory = (dnaId: EvolutionDnaId): FitnessScore[] => {
    return fitnessScores.value.get(dnaId) || []
  }

  const getGenerationStats = (generation: number): GenerationStats | undefined => {
    return generationStats.value.get(generation)
  }

  const getEvolutionTrend = (metric: keyof GeneticMarkers): EvolutionTrend | undefined => {
    return evolutionTrends.value.get(metric)
  }

  const clearData = (): void => {
    dnaPatterns.value.clear()
    evolutionEvents.value = []
    lineages.value.clear()
    generationStats.value.clear()
    evolutionTrends.value.clear()
    mutationImpacts.value = []
    fitnessScores.value.clear()
    performanceCorrelations.value.clear()
    error.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    evolutionEvents: readonly(evolutionEvents),
    mutationImpacts: readonly(mutationImpacts),
    
    // Computed
    totalPatterns,
    currentGeneration,
    generationCounts,
    topPerformers,
    evolutionRate,
    avgGeneticMarkers,
    
    // Actions
    fetchEvolutionData,
    addDnaPattern,
    updateDnaPattern,
    removeDnaPattern,
    addEvolutionEvent,
    addFitnessScore,
    addMutationImpact,
    
    // Getters
    getDnaPattern,
    getLineage,
    getFitnessHistory,
    getGenerationStats,
    getEvolutionTrend,
    
    // Utilities
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}