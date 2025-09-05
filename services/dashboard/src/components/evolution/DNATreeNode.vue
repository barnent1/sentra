<template>
  <div class="select-none">
    <!-- Node itself -->
    <div 
      class="flex items-center py-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors duration-150"
      :style="{ paddingLeft: `${level * 20 + 8}px` }"
      @click="$emit('select', node)"
    >
      <!-- Expand/Collapse button -->
      <button
        v-if="node.children.length > 0"
        @click.stop="$emit('toggle', node.dnaId)"
        class="flex items-center justify-center w-4 h-4 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <ChevronRightIcon 
          :class="[
            'w-3 h-3 transition-transform duration-150',
            isExpanded ? 'rotate-90' : ''
          ]" 
        />
      </button>
      <div v-else class="w-6 mr-2"></div>

      <!-- Node icon and content -->
      <div class="flex items-center space-x-2 flex-1 min-w-0">
        <!-- DNA Icon with generation-based color -->
        <div 
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
            getNodeColor(node.generation),
            selectedNode?.dnaId === node.dnaId ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''
          ]"
        >
          {{ node.generation }}
        </div>

        <!-- Node info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <code class="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded truncate">
              {{ node.dnaId.slice(0, 8) }}...
            </code>
            
            <!-- Evolution trigger badge -->
            <span 
              v-if="node.evolutionTrigger"
              :class="[
                'px-1.5 py-0.5 rounded text-xs font-medium',
                getTriggerColor(node.evolutionTrigger)
              ]"
            >
              {{ formatTrigger(node.evolutionTrigger) }}
            </span>
          </div>
          
          <!-- Confidence score -->
          <div v-if="node.confidenceScore" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ (node.confidenceScore * 100).toFixed(0) }}% confidence
          </div>
        </div>

        <!-- Child count badge -->
        <div 
          v-if="node.children.length > 0"
          class="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium"
        >
          {{ node.children.length }}
        </div>
      </div>
    </div>

    <!-- Children (when expanded) -->
    <div v-if="isExpanded && node.children.length > 0" class="ml-2">
      <DNATreeNode
        v-for="child in node.children"
        :key="child.dnaId"
        :node="child"
        :level="level + 1"
        :expanded-nodes="expandedNodes"
        :selected-node="selectedNode"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

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
  node: TreeNode
  level: number
  expandedNodes: Set<string>
  selectedNode?: TreeNode | null
}

const props = defineProps<Props>()

defineEmits<{
  toggle: [dnaId: string]
  select: [node: TreeNode]
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.node.dnaId))

const getNodeColor = (generation: number) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500'
  ]
  return colors[generation % colors.length]
}

const getTriggerColor = (trigger: string) => {
  const colors = {
    performance_threshold: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    manual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    time_based: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    pattern_recognition: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
  }
  return colors[trigger as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const formatTrigger = (trigger: string) => {
  const formatted = trigger.split('_')[0]
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
</script>