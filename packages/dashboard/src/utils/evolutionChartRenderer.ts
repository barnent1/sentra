export interface ChartDimensions {
  readonly width: number
  readonly height: number
  readonly padding: {
    readonly top: number
    readonly right: number
    readonly bottom: number
    readonly left: number
  }
}

export interface EvolutionChartConfig {
  readonly maxDataPoints: number
  readonly animationDuration: number
  readonly barWidth: number
  readonly barGap: number
  readonly colors: {
    readonly primary: string
    readonly glow: string
    readonly axis: string
    readonly text: string
  }
}

export interface EvolutionDataPoint {
  readonly timestamp: number
  readonly count: number
  readonly eventTypes: Record<string, number>
  readonly sessions: Record<string, number>
  readonly agentTypes?: Record<string, number>
  readonly dnaVariants?: Record<string, number>
}

export function createEvolutionChartRenderer(
  canvas: HTMLCanvasElement,
  dimensions: ChartDimensions,
  config: EvolutionChartConfig
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas')
  }

  let animationFrame: number | null = null

  const resize = (newDimensions: ChartDimensions) => {
    canvas.width = newDimensions.width * window.devicePixelRatio
    canvas.height = newDimensions.height * window.devicePixelRatio
    canvas.style.width = newDimensions.width + 'px'
    canvas.style.height = newDimensions.height + 'px'
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    Object.assign(dimensions, newDimensions)
  }

  const clear = () => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)
  }

  const drawBackground = () => {
    const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height)
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)')
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
  }

  const drawAxes = () => {
    ctx.strokeStyle = config.colors.axis
    ctx.lineWidth = 1
    
    // Y-axis
    ctx.beginPath()
    ctx.moveTo(dimensions.padding.left, dimensions.padding.top)
    ctx.lineTo(dimensions.padding.left, dimensions.height - dimensions.padding.bottom)
    ctx.stroke()
    
    // X-axis
    ctx.beginPath()
    ctx.moveTo(dimensions.padding.left, dimensions.height - dimensions.padding.bottom)
    ctx.lineTo(dimensions.width - dimensions.padding.right, dimensions.height - dimensions.padding.bottom)
    ctx.stroke()
  }

  const drawTimeLabels = (timeRange: '1m' | '3m' | '5m') => {
    ctx.fillStyle = config.colors.text
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    
    const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right
    const numLabels = 4
    const labelSpacing = chartWidth / (numLabels - 1)
    
    const now = Date.now()
    const rangeMs = timeRange === '1m' ? 60000 : timeRange === '3m' ? 180000 : 300000
    
    for (let i = 0; i < numLabels; i++) {
      const x = dimensions.padding.left + i * labelSpacing
      const timeOffset = (rangeMs * (numLabels - 1 - i)) / (numLabels - 1)
      const time = new Date(now - timeOffset)
      const label = time.getMinutes().toString().padStart(2, '0') + ':' + 
                   time.getSeconds().toString().padStart(2, '0')
      
      ctx.fillText(label, x, dimensions.height - 5)
    }
  }

  const drawBars = (
    data: EvolutionDataPoint[], 
    maxValue: number,
    opacity: number,
    formatLabel: (eventType: string) => string,
    getColorForSession: (sessionId: string) => string
  ) => {
    if (data.length === 0) return
    
    const chartArea = {
      x: dimensions.padding.left,
      y: dimensions.padding.top,
      width: dimensions.width - dimensions.padding.left - dimensions.padding.right,
      height: dimensions.height - dimensions.padding.top - dimensions.padding.bottom
    }
    
    const barWidth = Math.max(config.barWidth, chartArea.width / data.length - config.barGap)
    const barSpacing = chartArea.width / data.length
    
    data.forEach((point, index) => {
      if (point.count === 0) return
      
      const x = chartArea.x + index * barSpacing + (barSpacing - barWidth) / 2
      const barHeight = (point.count / maxValue) * chartArea.height
      const y = chartArea.y + chartArea.height - barHeight
      
      // Create gradient for evolution activity
      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y)
      gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity * 0.8})`)
      gradient.addColorStop(0.5, `rgba(99, 102, 241, ${opacity * 0.9})`)
      gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity})`)
      
      // Draw main bar
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)
      
      // Add glow effect for active evolution
      if (point.count > 0) {
        ctx.shadowColor = config.colors.glow
        ctx.shadowBlur = 8 * opacity
        ctx.fillRect(x, y, barWidth, barHeight)
        ctx.shadowBlur = 0
      }
      
      // Draw stacked segments for different event types
      let segmentY = y + barHeight
      const eventTypes = Object.entries(point.eventTypes || {})
      
      eventTypes.forEach(([eventType, count], segmentIndex) => {
        const segmentHeight = (count / point.count) * barHeight
        segmentY -= segmentHeight
        
        // Color based on event type
        let color = config.colors.primary
        switch (eventType) {
          case 'dna_mutation':
            color = '#EF4444' // red
            break
          case 'agent_spawn':
            color = '#10B981' // green
            break
          case 'agent_death':
            color = '#F59E0B' // amber
            break
          case 'learning_outcome':
            color = '#8B5CF6' // purple
            break
          case 'performance_update':
            color = '#06B6D4' // cyan
            break
          default:
            color = config.colors.primary
        }
        
        ctx.fillStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
        ctx.fillRect(x, segmentY, barWidth, segmentHeight)
      })
    })
  }

  const drawPulseEffect = (x: number, y: number, radius: number, opacity: number) => {
    ctx.save()
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`)
    gradient.addColorStop(0.5, `rgba(99, 102, 241, ${opacity * 0.5})`)
    gradient.addColorStop(1, `rgba(139, 92, 246, 0)`)
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.restore()
  }

  const drawEvolutionMetrics = (data: EvolutionDataPoint[]) => {
    if (data.length === 0) return
    
    const latest = data[data.length - 1]
    
    ctx.fillStyle = config.colors.text
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    
    const metricsX = dimensions.width - dimensions.padding.right - 10
    let metricsY = dimensions.padding.top + 20
    
    // DNA variants count
    const dnaVariants = Object.keys(latest.dnaVariants || {}).length
    ctx.fillText(`DNA Variants: ${dnaVariants}`, metricsX, metricsY)
    metricsY += 16
    
    // Active agents count  
    const agentTypes = Object.keys(latest.agentTypes || {}).length
    ctx.fillText(`Agent Types: ${agentTypes}`, metricsX, metricsY)
    metricsY += 16
    
    // Evolution rate
    const evolutionRate = latest.count / (data.length > 1 ? data.length - 1 : 1)
    ctx.fillText(`Evolution Rate: ${evolutionRate.toFixed(2)}/min`, metricsX, metricsY)
  }

  const stopAnimation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  // Initialize
  resize(dimensions)

  return {
    resize,
    clear,
    drawBackground,
    drawAxes,
    drawTimeLabels,
    drawBars,
    drawPulseEffect,
    drawEvolutionMetrics,
    stopAnimation
  }
}