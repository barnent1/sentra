<template>
  <div class="relative">
    <div v-if="events.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <div class="w-12 h-12 mx-auto mb-4">
        <svg class="w-full h-full text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L13.09 8.26L22 9L16 14.74L17.18 22L12 18.27L6.82 22L8 14.74L2 9L10.91 8.26L12 2Z"/>
        </svg>
      </div>
      <p>No DNA tree available</p>
      <p class="text-sm">Tree will build as evolution progresses</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Tree Controls -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2">
          <button
            @click="expandAll"
            class="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30"
          >
            Expand All
          </button>
          <button
            @click="collapseAll"
            class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Collapse All
          </button>
        </div>
        <div class="text-gray-500 dark:text-gray-400">
          {{ treeNodes.length }} nodes
        </div>
      </div>

      <!-- DNA Tree -->
      <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div class="space-y-2">
          <DNATreeNode
            v-for="node in rootNodes"
            :key="node.dnaId"
            :node="node"
            :level="0"
            :expanded-nodes="expandedNodes"
            @toggle="toggleNode"
            @select="selectNode"
            :selected-node="selectedNode"
          />
        </div>
      </div>

      <!-- Selected Node Details -->
      <div v-if="selectedNode" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">
          DNA Details: {{ selectedNode.dnaId.slice(0, 12) }}...
        </h4>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Generation:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedNode.generation }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Children:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedNode.children.length }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Trigger:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ formatTrigger(selectedNode.evolutionTrigger || 'unknown') }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Confidence:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ selectedNode.confidenceScore ? (selectedNode.confidenceScore * 100).toFixed(0) + '%' : 'N/A' }}
            </span>
          </div>
        </div>

        <div v-if="selectedNode.geneticChanges && Object.keys(selectedNode.geneticChanges).length > 0" class="mt-3">
          <h5 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Genetic Changes
          </h5>
          <div class="space-y-1">
            <div 
              v-for="[key, change] in Object.entries(selectedNode.geneticChanges).slice(0, 3)"
              :key="key"
              class="text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1"
            >
              <span class="font-medium">{{ formatPropertyName(key) }}:</span>
              <span class="text-gray-600 dark:text-gray-400 ml-1">
                {{ String(change.from) }} → {{ String(change.to) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EvolutionEvent } from '@sentra/types'
import DNATreeNode from './DNATreeNode.vue'

interface TreeNode {
  dnaId: string
  parentId?: string
  children: TreeNode[]
  generation: number
  evolutionTrigger?: string
  confidenceScore?: number
  geneticChanges?: Record<string, any>
  createdAt: Date
}

interface Props {
  events: readonly EvolutionEvent[]
}

const props = defineProps<Props>()

const expandedNodes = ref(new Set<string>())
const selectedNode = ref<TreeNode | null>(null)

// Build tree structure from evolution events
const treeNodes = computed(() => {
  const nodeMap = new Map<string, TreeNode>()
  
  // Create nodes from events
  props.events.forEach(event => {
    // Add parent node if not exists
    if (!nodeMap.has(event.parentDnaId)) {
      nodeMap.set(event.parentDnaId, {
        dnaId: event.parentDnaId,
        children: [],
        generation: getGenerationFromId(event.parentDnaId),
        createdAt: event.createdAt
      })
    }
    
    // Add child node
    if (!nodeMap.has(event.childDnaId)) {
      nodeMap.set(event.childDnaId, {
        dnaId: event.childDnaId,
        parentId: event.parentDnaId,
        children: [],
        generation: getGenerationFromId(event.childDnaId),
        evolutionTrigger: event.evolutionTrigger,
        confidenceScore: event.confidenceScore,
        geneticChanges: event.geneticChanges,
        createdAt: event.createdAt
      })
    }
  })
  
  // Build parent-child relationships
  nodeMap.forEach(node => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId)
      if (parent && !parent.children.find(child => child.dnaId === node.dnaId)) {
        parent.children.push(node)
      }
    }
  })
  
  // Sort children by creation time
  nodeMap.forEach(node => {
    node.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  })
  
  return Array.from(nodeMap.values())
})

// Get root nodes (nodes without parents or orphaned nodes)
const rootNodes = computed(() => {
  return treeNodes.value.filter(node => {
    return !node.parentId || !treeNodes.value.find(n => n.dnaId === node.parentId)
  }).sort((a, b) => a.generation - b.generation)
})

const toggleNode = (dnaId: string) => {
  if (expandedNodes.value.has(dnaId)) {
    expandedNodes.value.delete(dnaId)
  } else {
    expandedNodes.value.add(dnaId)
  }
}

const selectNode = (node: TreeNode) => {
  selectedNode.value = node
}

const expandAll = () => {
  treeNodes.value.forEach(node => {
    if (node.children.length > 0) {
      expandedNodes.value.add(node.dnaId)
    }
  })
}

const collapseAll = () => {
  expandedNodes.value.clear()
}

const getGenerationFromId = (dnaId: string): number => {
  // Mock generation extraction - in real implementation this would be more sophisticated
  return Math.abs(dnaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 10 + 1
}

const formatTrigger = (trigger: string) => {
  return trigger.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatPropertyName = (property: string) => {
  return property.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
}
</script>