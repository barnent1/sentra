<template>
  <div class="w-full h-full overflow-auto">
    <svg 
      ref="svgRef" 
      :width="svgWidth" 
      :height="svgHeight"
      class="bg-white dark:bg-gray-800"
    >
      <!-- Tree links (edges) -->
      <g class="links">
        <path
          v-for="link in links"
          :key="`${link.source.id}-${link.target.id}`"
          :d="createLinkPath(link)"
          stroke="#6B7280"
          stroke-width="2"
          fill="none"
          :stroke-dasharray="link.target.generation > currentGeneration - 2 ? '5,5' : 'none'"
          class="transition-all duration-300"
        />
      </g>
      
      <!-- Tree nodes -->
      <g class="nodes">
        <g
          v-for="node in nodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          class="cursor-pointer transition-transform duration-300 hover:scale-110"
          @click="$emit('select-node', node.id)"
          @mouseenter="showTooltip(node, $event)"
          @mouseleave="hideTooltip"
        >
          <!-- Node circle -->
          <circle
            :r="getNodeRadius(node)"
            :fill="getNodeColor(node)"
            :stroke="getNodeStroke(node)"
            :stroke-width="node.id === selectedNode ? 3 : 1"
            class="transition-all duration-200"
          />
          
          <!-- Generation indicator -->
          <text
            :y="4"
            text-anchor="middle"
            :fill="getTextColor(node)"
            font-size="10"
            font-weight="bold"
          >
            G{{ node.generation }}
          </text>
          
          <!-- Node label -->
          <text
            :y="getNodeRadius(node) + 15"
            text-anchor="middle"
            fill="currentColor"
            font-size="11"
            class="text-gray-700 dark:text-gray-300"
          >
            {{ getNodeLabel(node) }}
          </text>
          
          <!-- Fitness score -->
          <text
            :y="getNodeRadius(node) + 28"
            text-anchor="middle"
            fill="currentColor"
            font-size="9"
            class="text-gray-500 dark:text-gray-400"
          >
            {{ getNodeFitness(node) }}
          </text>
        </g>
      </g>
    </svg>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      class="absolute z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg pointer-events-none"
    >
      <div class="font-semibold">{{ tooltip.data?.patternType || 'Pattern' }}</div>
      <div class="text-xs text-gray-300 mt-1">
        Generation: {{ tooltip.data?.generation }}
      </div>
      <div class="text-xs text-gray-300">
        Fitness: {{ tooltip.fitnessScore }}
      </div>
      <div class="mt-2 space-y-1">
        <div class="text-xs">
          <span class="text-gray-400">Complexity:</span>
          <span class="ml-1">{{ (tooltip.data?.genetics.complexity * 100 || 0).toFixed(1) }}%</span>
        </div>
        <div class="text-xs">
          <span class="text-gray-400">Adaptability:</span>
          <span class="ml-1">{{ (tooltip.data?.genetics.adaptability * 100 || 0).toFixed(1) }}%</span>
        </div>
        <div class="text-xs">
          <span class="text-gray-400">Success Rate:</span>
          <span class="ml-1">{{ (tooltip.data?.genetics.successRate * 100 || 0).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="absolute top-4 right-4 flex flex-col space-y-2">
      <button
        @click="zoomIn"
        class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </button>
      <button
        @click="zoomOut"
        class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
        </svg>
      </button>
      <button
        @click="resetZoom"
        class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
      <div class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Legend</div>
      <div class="space-y-1 text-xs">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded-full bg-green-500"></div>
          <span class="text-gray-700 dark:text-gray-300">High Performance</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-gray-700 dark:text-gray-300">Medium Performance</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded-full bg-red-500"></div>
          <span class="text-gray-700 dark:text-gray-300">Low Performance</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-1 bg-gray-400" style="border: 1px dashed"></div>
          <span class="text-gray-700 dark:text-gray-300">Recent Evolution</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type PropType } from 'vue'
import type { EvolutionDna, EvolutionDnaId, FitnessScore } from '@sentra/types'
import type { EvolutionLineage } from '../../stores/evolution'

interface TreeNode extends EvolutionDna {
  x: number
  y: number
  children: TreeNode[]
}

interface TreeLink {
  source: TreeNode
  target: TreeNode
}

interface Props {
  dnaPatterns: Map<EvolutionDnaId, EvolutionDna>
  lineages: Map<EvolutionDnaId, EvolutionLineage>
  fitnessScores: Map<EvolutionDnaId, FitnessScore[]>
  selectedNode?: EvolutionDnaId
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-node': [nodeId: EvolutionDnaId]
}>()

const svgRef = ref<SVGElement | null>(null)
const svgWidth = ref(800)
const svgHeight = ref(600)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as EvolutionDna | null,
  fitnessScore: '0.0'
})

// Tree layout constants
const nodeSpacing = 150
const levelSpacing = 120

// Calculate tree nodes and positions
const nodes = computed((): TreeNode[] => {
  const rootNodes = Array.from(props.dnaPatterns.values())
    .filter(dna => !dna.parentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const allNodes: TreeNode[] = []
  const processedIds = new Set<string>()

  const buildTree = (dna: EvolutionDna, depth: number, siblingIndex: number): TreeNode => {
    if (processedIds.has(dna.id)) {
      // Return a reference to prevent infinite loops
      return allNodes.find(n => n.id === dna.id)!
    }

    const children = Array.from(props.dnaPatterns.values())
      .filter(child => child.parentId === dna.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const node: TreeNode = {
      ...dna,
      x: siblingIndex * nodeSpacing + 100,
      y: depth * levelSpacing + 80,
      children: []
    }

    processedIds.add(dna.id)
    allNodes.push(node)

    // Recursively build children
    node.children = children.map((child, index) => 
      buildTree(child, depth + 1, siblingIndex * children.length + index)
    )

    return node
  }

  // Build trees for each root node
  rootNodes.forEach((root, index) => {
    buildTree(root, 0, index)
  })

  return allNodes
})

// Generate links between nodes
const links = computed((): TreeLink[] => {
  const linkList: TreeLink[] = []
  
  nodes.value.forEach(node => {
    node.children.forEach(child => {
      linkList.push({
        source: node,
        target: child
      })
    })
  })
  
  return linkList
})

const currentGeneration = computed(() => {
  return Math.max(...nodes.value.map(n => n.generation))
})

// Helper functions
const getNodeRadius = (node: TreeNode): number => {
  const baseRadius = 20
  const fitness = getLatestFitness(node.id)
  return baseRadius + (fitness * 10) // Larger nodes for higher fitness
}

const getNodeColor = (node: TreeNode): string => {
  const fitness = getLatestFitness(node.id)
  
  if (fitness > 0.7) return '#10B981' // Green
  if (fitness > 0.4) return '#F59E0B' // Yellow
  return '#EF4444' // Red
}

const getNodeStroke = (node: TreeNode): string => {
  if (node.id === props.selectedNode) return '#3B82F6'
  return '#6B7280'
}

const getTextColor = (node: TreeNode): string => {
  const fitness = getLatestFitness(node.id)
  return fitness > 0.5 ? '#FFFFFF' : '#1F2937'
}

const getNodeLabel = (node: TreeNode): string => {
  return node.patternType.slice(0, 8) + (node.patternType.length > 8 ? '...' : '')
}

const getNodeFitness = (node: TreeNode): string => {
  const fitness = getLatestFitness(node.id)
  return fitness.toFixed(2)
}

const getLatestFitness = (nodeId: EvolutionDnaId): number => {
  const scores = props.fitnessScores.get(nodeId) || []
  return scores.length > 0 ? scores[scores.length - 1] as number : 0
}

const createLinkPath = (link: TreeLink): string => {
  const sourceX = link.source.x
  const sourceY = link.source.y + getNodeRadius(link.source)
  const targetX = link.target.x  
  const targetY = link.target.y - getNodeRadius(link.target)
  
  // Create curved path
  const midY = (sourceY + targetY) / 2
  
  return `M ${sourceX} ${sourceY} 
          C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`
}

// Zoom and pan functions
const zoomIn = () => {
  zoom.value = Math.min(zoom.value * 1.2, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value / 1.2, 0.5)
}

const resetZoom = () => {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

// Tooltip functions
const showTooltip = (node: TreeNode, event: MouseEvent) => {
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect) return

  tooltip.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    data: node,
    fitnessScore: getNodeFitness(node)
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

// Update SVG dimensions based on tree size
const updateSvgDimensions = () => {
  if (nodes.value.length === 0) return
  
  const maxX = Math.max(...nodes.value.map(n => n.x)) + 100
  const maxY = Math.max(...nodes.value.map(n => n.y)) + 100
  
  svgWidth.value = Math.max(800, maxX)
  svgHeight.value = Math.max(600, maxY)
}

// Watch for changes and update dimensions
watch(nodes, updateSvgDimensions, { immediate: true })

onMounted(() => {
  updateSvgDimensions()
})
</script>

<style scoped>
svg {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.dark svg {
  border-color: #374151;
}
</style>