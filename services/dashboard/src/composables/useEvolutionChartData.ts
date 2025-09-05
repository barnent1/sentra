import { ref, computed } from 'vue'
import type { EvolutionWebSocketEvent } from './useEvolutionWebSocket'
import type { EvolutionDataPoint } from '../utils/evolutionChartRenderer'

export type TimeRange = '1m' | '3m' | '5m'

export function useEvolutionChartData() {
  const timeRange = ref<TimeRange>('1m')
  const dataPoints = ref<EvolutionDataPoint[]>([])
  
  // Cleanup interval
  let cleanupInterval: number | null = null

  const getBucketSize = (range: TimeRange): number => {
    switch (range) {
      case '1m': return 1000  // 1 second buckets
      case '3m': return 3000  // 3 second buckets  
      case '5m': return 5000  // 5 second buckets
      default: return 1000
    }
  }

  const getMaxAge = (range: TimeRange): number => {
    switch (range) {
      case '1m': return 60000   // 1 minute
      case '3m': return 180000  // 3 minutes
      case '5m': return 300000  // 5 minutes
      default: return 60000
    }
  }

  const setTimeRange = (range: TimeRange) => {
    timeRange.value = range
    // Re-process existing data with new bucket size
    updateDataPoints()
  }

  const addEvent = (event: EvolutionWebSocketEvent) => {
    const timestamp = event.timestamp || Date.now()
    const bucketSize = getBucketSize(timeRange.value)
    const bucketTimestamp = Math.floor(timestamp / bucketSize) * bucketSize
    
    // Find or create data point for this time bucket
    let dataPoint = dataPoints.value.find(dp => dp.timestamp === bucketTimestamp)
    
    if (!dataPoint) {
      dataPoint = {
        timestamp: bucketTimestamp,
        count: 0,
        eventTypes: {},
        sessions: {},
        agentTypes: {},
        dnaVariants: {}
      }
      dataPoints.value.push(dataPoint)
    }
    
    // Update counts
    dataPoint.count++
    
    // Update event types
    const eventType = event.hook_event_type
    dataPoint.eventTypes[eventType] = (dataPoint.eventTypes[eventType] || 0) + 1
    
    // Update sessions
    const sessionId = event.session_id
    dataPoint.sessions[sessionId] = (dataPoint.sessions[sessionId] || 0) + 1
    
    // Extract agent type from payload if available
    if (event.payload && typeof event.payload === 'object') {
      const payload = event.payload as Record<string, unknown>
      
      if (payload.agentType && typeof payload.agentType === 'string') {
        dataPoint.agentTypes![payload.agentType] = (dataPoint.agentTypes![payload.agentType] || 0) + 1
      }
      
      if (payload.dnaVariant && typeof payload.dnaVariant === 'string') {
        dataPoint.dnaVariants![payload.dnaVariant] = (dataPoint.dnaVariants![payload.dnaVariant] || 0) + 1
      }
      
      // Handle evolution event specific data
      if (eventType === 'evolution_event' || eventType === 'dna_mutation') {
        if (payload.species && typeof payload.species === 'string') {
          dataPoint.agentTypes![payload.species] = (dataPoint.agentTypes![payload.species] || 0) + 1
        }
        
        if (payload.mutation && typeof payload.mutation === 'string') {
          dataPoint.dnaVariants![payload.mutation] = (dataPoint.dnaVariants![payload.mutation] || 0) + 1
        }
      }
    }
    
    // Sort data points by timestamp
    dataPoints.value.sort((a, b) => a.timestamp - b.timestamp)
    
    // Clean up old data points
    cleanupOldData()
  }

  const updateDataPoints = () => {
    // This would re-process all events if we had them stored
    // For now, just clean up old data
    cleanupOldData()
  }

  const cleanupOldData = () => {
    const maxAge = getMaxAge(timeRange.value)
    const cutoff = Date.now() - maxAge
    
    dataPoints.value = dataPoints.value.filter(dp => dp.timestamp >= cutoff)
  }

  const getChartData = (): EvolutionDataPoint[] => {
    const maxAge = getMaxAge(timeRange.value)
    const bucketSize = getBucketSize(timeRange.value)
    const now = Date.now()
    const startTime = now - maxAge
    
    // Create time buckets for the entire range
    const buckets: EvolutionDataPoint[] = []
    for (let timestamp = startTime; timestamp <= now; timestamp += bucketSize) {
      const bucketStart = Math.floor(timestamp / bucketSize) * bucketSize
      const existingPoint = dataPoints.value.find(dp => dp.timestamp === bucketStart)
      
      if (existingPoint) {
        buckets.push(existingPoint)
      } else {
        // Create empty bucket
        buckets.push({
          timestamp: bucketStart,
          count: 0,
          eventTypes: {},
          sessions: {},
          agentTypes: {},
          dnaVariants: {}
        })
      }
    }
    
    return buckets
  }

  const getEvolutionMetrics = () => {
    const data = getChartData()
    const recentData = data.slice(-10) // Last 10 data points
    
    const totalEvents = recentData.reduce((sum, dp) => sum + dp.count, 0)
    const uniqueSessions = new Set(recentData.flatMap(dp => Object.keys(dp.sessions))).size
    const uniqueAgentTypes = new Set(recentData.flatMap(dp => Object.keys(dp.agentTypes || {}))).size
    const uniqueDnaVariants = new Set(recentData.flatMap(dp => Object.keys(dp.dnaVariants || {}))).size
    
    // Calculate evolution rate (events per minute)
    const timeSpan = recentData.length * getBucketSize(timeRange.value) / 1000 / 60 // minutes
    const evolutionRate = timeSpan > 0 ? totalEvents / timeSpan : 0
    
    return {
      totalEvents,
      uniqueSessions,
      uniqueAgentTypes,
      uniqueDnaVariants,
      evolutionRate
    }
  }

  const cleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
    dataPoints.value = []
  }

  // Set up periodic cleanup
  cleanupInterval = setInterval(cleanupOldData, 10000) as unknown as number // Every 10 seconds

  return {
    timeRange: readonly(timeRange),
    dataPoints: readonly(dataPoints),
    addEvent,
    getChartData,
    getEvolutionMetrics,
    setTimeRange,
    cleanup
  }
}

// Helper function to make refs readonly  
function readonly<T>(ref: any): Readonly<T> {
  return ref
}