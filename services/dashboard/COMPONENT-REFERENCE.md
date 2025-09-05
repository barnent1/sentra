# SENTRA Dashboard Component Reference Guide

## Overview

This reference guide provides comprehensive documentation for all Vue.js components in the SENTRA Evolution Dashboard. Each component is documented with its props, events, usage examples, and integration patterns.

## Table of Contents

1. [Core Components](#core-components)
2. [Chart Components](#chart-components)
3. [Agent Components](#agent-components)
4. [Evolution Components](#evolution-components)
5. [UI Components](#ui-components)
6. [Navigation Components](#navigation-components)
7. [View Components](#view-components)
8. [Store Integration](#store-integration)
9. [Component Patterns](#component-patterns)
10. [Best Practices](#best-practices)

## Core Components

### App.vue
The root application component providing layout structure and theme integration.

**Structure:**
- Main layout with sidebar navigation
- Router view with page transitions
- Theme initialization and management

**Features:**
- Responsive design with mobile adaptation
- Smooth page transitions
- Global theme management
- Persistent navigation sidebar

**Usage:**
```vue
<!-- Root component - automatically rendered -->
<div class="min-h-screen bg-background">
  <NavigationSidebar />
  <main class="lg:ml-64">
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </main>
</div>
```

### StatCard.vue
Displays key performance indicators with trend analysis.

**Props:**
- `title: string` - Card title/label
- `value: string | number` - Main metric value to display
- `icon: string` - Heroicon component name
- `color: 'blue' | 'green' | 'purple' | 'amber'` - Color theme
- `trend?: { direction: 'up' | 'down', value: number }` - Trend indicator

**Usage:**
```vue
<StatCard
  title="Active Agents"
  :value="stats.activeAgents"
  icon="UserGroupIcon"
  color="blue"
  :trend="{ direction: 'up', value: 5 }"
/>
```

**Features:**
- Large, readable metric display
- Color-coded trend indicators
- Icon integration with Heroicons
- Responsive sizing and typography

## Chart Components

### PerformanceChart.vue
Line chart component for displaying performance metrics over time.

**Props:**
- `data: DataPoint[]` - Array of chart data points
  ```typescript
  interface DataPoint {
    x: number
    y: number
    label?: string
  }
  ```

**Features:**
- Chart.js integration with Vue reactivity
- Theme-aware styling (light/dark mode)
- Responsive canvas sizing
- Interactive tooltips and hover effects
- Empty state handling

**Usage:**
```vue
<PerformanceChart :data="performanceData" />
```

**Chart Configuration:**
- Line chart with filled area
- Success rate percentage on Y-axis
- Time points on X-axis
- Blue color scheme with opacity
- Custom tooltip formatting

### AgentActivityChart.vue
Chart component for visualizing agent activity patterns.

**Props:**
- `data: Array<{ hour: string, count: number }>` - Activity data by hour

**Features:**
- Bar chart visualization
- Hourly activity distribution
- Interactive hover states
- Theme integration
- Automatic scaling

**Usage:**
```vue
<AgentActivityChart :data="activityData" />
```

### AgentComparisonChart.vue
Multi-agent performance comparison visualization.

**Props:**
- `agents: AgentComparisonData[]` - Agent data for comparison
- `metric: keyof PerformanceMetrics` - Selected performance metric
- `showComparison: boolean` - Enable comparison mode
- `maxAgents: number` - Maximum agents to display

**Features:**
- Side-by-side agent comparison
- Multiple metric support
- Configurable agent limits
- Color-coded performance levels
- Interactive legend

**Usage:**
```vue
<AgentComparisonChart
  :agents="comparisonData"
  :metric="selectedMetric"
  :show-comparison="true"
  :max-agents="8"
/>
```

### PerformanceTimelineChart.vue
Time-series visualization for performance trends.

**Props:**
- `data: TimelineData[]` - Time-series performance data
- `timeRange: 'hour' | 'day' | 'week' | 'month'` - Analysis time range
- `selectedMetrics: string[]` - Metrics to display

**Features:**
- Multi-metric overlay
- Time range adaptation
- Zoom and pan controls
- Performance correlation analysis
- Export-ready formatting

**Usage:**
```vue
<PerformanceTimelineChart
  :data="performanceTimelineData"
  :time-range="selectedTimeRange"
  :selected-metrics="['successRate', 'codeQualityScore']"
/>
```

### GeneticMarkersChart.vue
Radar chart for genetic trait visualization.

**Props:**
- `markers: GeneticMarkers[]` - Genetic marker data
- `labels: string[]` - Chart labels
- `width: number` - Chart width
- `height: number` - Chart height

**Features:**
- Radar/polar chart visualization
- Multi-dimensional trait display
- Comparative analysis support
- Interactive trait selection
- Normalized scaling

**Usage:**
```vue
<GeneticMarkersChart
  :markers="selectedDnaMarkers"
  :labels="selectedDnaLabels"
  :width="350"
  :height="300"
/>
```

## Agent Components

### AgentStatusCard.vue
Comprehensive agent information display card.

**Props:**
- `agent: AgentInstance` - Agent instance data
- `metrics?: AgentMetrics` - Performance metrics
- `dna?: EvolutionDna` - Genetic information
- `currentTask?: Task` - Active task information
- `taskProgress?: number` - Task completion percentage (0-100)

**Events:**
- `@view-details` - Emitted when user clicks "View Details"
- `@manage-agent` - Emitted when user clicks "Manage"

**Features:**
- Status indicator with color coding
- Performance metrics display
- DNA genetics overview
- Task progress visualization
- Action button controls
- Responsive card layout

**Usage:**
```vue
<AgentStatusCard
  :agent="agent"
  :metrics="agentMetrics"
  :dna="agentDna"
  :current-task="currentTask"
  :task-progress="75"
  @view-details="handleViewDetails"
  @manage-agent="handleManageAgent"
/>
```

**Status Indicators:**
- Green dot: Active agent
- Yellow dot: Inactive agent
- Red dot: Error state
- Gray dot: Archived agent

### AgentPoolOverview.vue
Aggregate view of entire agent pool with management controls.

**Props:**
- `agents: AgentInstance[]` - All agents in pool
- `stats: AgentPoolStats` - Pool-level statistics
- `agentMetrics: Map<AgentInstanceId, AgentMetrics>` - Performance metrics map
- `isConnected: boolean` - WebSocket connection status

**Events:**
- `@select-agent` - Agent selection for detailed view
- `@refresh-pool` - Manual pool data refresh
- `@spawn-agent` - New agent creation request
- `@manage-pool` - Pool-level management actions

**Features:**
- Pool statistics dashboard
- Agent grid layout
- Bulk operations support
- Connection status integration
- Performance aggregations

**Usage:**
```vue
<AgentPoolOverview
  :agents="agentsStore.agents"
  :stats="agentsStore.poolStats"
  :agent-metrics="agentMetricsMap"
  :is-connected="webSocketStore.isConnected"
  @select-agent="selectAgent"
  @refresh-pool="refreshPool"
  @spawn-agent="spawnNewAgent"
  @manage-pool="managePool"
/>
```

## Evolution Components

### EvolutionTimeline.vue
Chronological display of evolution events.

**Props:**
- `events: EvolutionEvent[]` - Evolution events to display

**Features:**
- Chronological event ordering
- Event type differentiation
- Expandable event details
- Filter integration
- Infinite scroll support

**Usage:**
```vue
<EvolutionTimeline :events="recentEvents" />
```

**Event Types:**
- Performance threshold triggers
- Manual evolution requests
- Time-based evolutionary cycles
- Pattern recognition triggers

### EvolutionLineageTree.vue
Interactive tree visualization of evolutionary relationships.

**Props:**
- `dnaPatterns: (id: EvolutionDnaId) => EvolutionDna | undefined` - DNA pattern getter
- `lineages: (id: EvolutionDnaId) => EvolutionLineage | undefined` - Lineage getter
- `fitnessScores: (id: EvolutionDnaId) => number[]` - Fitness history getter
- `selectedNode?: EvolutionDnaId` - Currently selected node

**Events:**
- `@select-node` - Node selection event

**Features:**
- Interactive tree navigation
- Parent-child relationship visualization
- Fitness score integration
- Node selection highlighting
- Zoom and pan controls

**Usage:**
```vue
<EvolutionLineageTree
  :dna-patterns="evolutionStore.getDnaPattern"
  :lineages="evolutionStore.getLineage"
  :fitness-scores="evolutionStore.getFitnessHistory"
  :selected-node="selectedDnaNode"
  @select-node="selectDnaNode"
/>
```

### DNATreeView.vue
Hierarchical DNA structure visualization.

**Props:**
- `dnaData: EvolutionDna[]` - DNA structure data
- `expandLevel: number` - Default expansion level

**Features:**
- Collapsible tree structure
- DNA property visualization
- Generation markers
- Search and filter integration

### DNATreeNode.vue
Individual node component for DNA tree structures.

**Props:**
- `node: EvolutionDna` - DNA node data
- `level: number` - Tree depth level
- `isExpanded: boolean` - Expansion state

**Events:**
- `@toggle` - Node expansion toggle
- `@select` - Node selection

**Features:**
- Expandable/collapsible behavior
- Visual depth indication
- Selection highlighting
- Context menu integration

### PatternVisualization.vue
Visual representation of evolutionary patterns.

**Props:**
- `patterns: EvolutionPattern[]` - Pattern data
- `viewMode: 'grid' | 'flow'` - Display mode

**Features:**
- Multiple visualization modes
- Pattern comparison
- Interactive exploration
- Export capabilities

## UI Components

### ThemeToggle.vue
Light/dark mode theme switcher.

**Features:**
- Toggle button with smooth transitions
- System preference detection
- Local storage persistence
- Icon animation effects

**Usage:**
```vue
<ThemeToggle />
```

**Implementation:**
- Stores theme preference in localStorage
- Applies theme classes to document root
- Smooth transition animations
- Accessibility support

### ConnectionStatus.vue
WebSocket connection status indicator.

**Features:**
- Real-time connection status display
- Color-coded status indicators
- Automatic status updates
- Tooltip information

**Usage:**
```vue
<ConnectionStatus />
```

**Status States:**
- Green: Connected
- Yellow: Connecting
- Red: Disconnected/Error

### ToggleSwitch.vue
Reusable toggle switch component.

**Props:**
- `modelValue: boolean` - Switch state
- `disabled?: boolean` - Disabled state
- `label?: string` - Switch label

**Events:**
- `@update:modelValue` - State change event

**Features:**
- Smooth toggle animations
- Accessibility compliance
- Keyboard navigation support
- Custom styling options

**Usage:**
```vue
<ToggleSwitch
  v-model="autoRefresh"
  label="Auto Refresh"
  :disabled="!isConnected"
/>
```

## Navigation Components

### NavigationSidebar.vue
Main navigation sidebar with routing and status.

**Features:**
- Route-based active state highlighting
- Recent activity feed
- Connection status display
- Theme toggle integration
- Responsive collapse behavior

**Navigation Items:**
- Dashboard (/) - Main overview
- Evolution Monitor (/evolution) - Genetic analysis
- Agent Management (/agents) - Agent operations
- Analytics (/analytics) - Performance analysis
- Settings (/settings) - Configuration

**Usage:**
```vue
<NavigationSidebar />
```

**Recent Activity Integration:**
- Real-time event feed
- Event type filtering
- Timestamp formatting
- Click-through navigation

## View Components

### Dashboard.vue
Main dashboard overview with key metrics and charts.

**Features:**
- Real-time statistics cards
- Performance and activity charts
- Evolution timeline
- WebSocket connection management
- Auto-refresh functionality

**Data Integration:**
- WebSocket store for real-time data
- Agents store for pool statistics
- Evolution store for recent events
- Computed reactive properties

### EvolutionMonitor.vue
Comprehensive evolution monitoring interface.

**Features:**
- Advanced filtering system
- DNA lineage tree visualization
- Genetic markers analysis
- Evolution statistics
- Real-time event monitoring

**Filter Options:**
- Evolution trigger type
- Time range selection
- Confidence threshold
- Results counting

### AgentManagement.vue
Agent lifecycle and performance management.

**View Modes:**
- Pool Overview - Aggregate statistics
- Individual Agents - Detailed agent cards
- Performance Analysis - Comparative charts

**Features:**
- Agent spawning modal
- Performance comparison
- Timeline analysis
- Bulk operations

### Analytics.vue
Advanced analytics and reporting interface.

**Features:**
- Comprehensive performance metrics
- Historical trend analysis
- Predictive analytics
- Export capabilities
- Custom reporting

### Settings.vue
Dashboard configuration and preferences.

**Features:**
- Theme preferences
- Connection settings
- Data retention policies
- Export/import options
- User preferences

## Store Integration

### WebSocket Store Integration

Components integrate with the WebSocket store for real-time data:

```typescript
import { useWebSocketStore } from '../stores/websocket'

const webSocketStore = useWebSocketStore()

// Access real-time data
const evolutionEvents = computed(() => webSocketStore.evolutionEvents)
const agentUpdates = computed(() => webSocketStore.agentUpdates)
const isConnected = computed(() => webSocketStore.isConnected)
```

### Agents Store Integration

Agent-related components use the agents store:

```typescript
import { useAgentsStore } from '../stores/agents'

const agentsStore = useAgentsStore()

// Access agent data
const agents = computed(() => agentsStore.agents)
const poolStats = computed(() => agentsStore.poolStats)
const topPerformers = computed(() => agentsStore.topPerformers)
```

### Evolution Store Integration

Evolution components integrate with evolution data:

```typescript
import { useEvolutionStore } from '../stores/evolution'

const evolutionStore = useEvolutionStore()

// Access evolution data
const dnaPatterns = computed(() => evolutionStore.dnaPatterns)
const lineageData = computed(() => evolutionStore.lineageData)
const evolutionRate = computed(() => evolutionStore.evolutionRate)
```

## Component Patterns

### Composition API Pattern

All components use Vue 3 Composition API:

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { PropType } from 'vue'

// Props definition
interface Props {
  data: DataType[]
  isLoading?: boolean
}

const props = defineProps<Props>()

// Events definition
const emit = defineEmits<{
  'update:selection': [value: string]
  'data-change': [data: DataType]
}>()

// Reactive state
const selectedItem = ref<string | null>(null)
const isVisible = ref(true)

// Computed properties
const processedData = computed(() => {
  return props.data.filter(item => item.isActive)
})

// Methods
const handleSelection = (value: string) => {
  selectedItem.value = value
  emit('update:selection', value)
}

// Lifecycle
onMounted(() => {
  // Component initialization
})

// Watchers
watch(() => props.data, (newData) => {
  // Handle data changes
}, { deep: true })
</script>
```

### TypeScript Integration

Strict TypeScript usage with proper type definitions:

```typescript
// Type imports from shared types package
import type { 
  AgentInstance, 
  AgentInstanceId,
  EvolutionDna,
  PerformanceMetrics 
} from '@sentra/types'

// Component-specific interfaces
interface ComponentProps {
  readonly agents: AgentInstance[]
  readonly metrics?: Map<AgentInstanceId, PerformanceMetrics>
}

// Event handler types
type SelectionHandler = (agentId: AgentInstanceId) => void
type UpdateHandler = (data: Partial<AgentInstance>) => void
```

### Reactive Data Patterns

Efficient reactive data management:

```typescript
// Computed properties for derived state
const filteredAgents = computed(() => {
  return agents.value.filter(agent => {
    if (statusFilter.value && agent.status !== statusFilter.value) {
      return false
    }
    if (searchQuery.value) {
      return agent.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    }
    return true
  })
})

// Watchers for side effects
watch(
  () => webSocketStore.agentUpdates,
  (newUpdates) => {
    // Handle real-time updates
    newUpdates.forEach(update => {
      handleAgentUpdate(update)
    })
  },
  { deep: true, immediate: true }
)
```

## Best Practices

### Performance Optimization

1. **Computed Properties**: Use computed properties for derived state
2. **Shallow Reactive**: Use `shallowRef` for large datasets
3. **Virtual Scrolling**: Implement for large lists
4. **Debounced Updates**: Debounce frequent updates

```typescript
import { debounce } from 'lodash-es'

const debouncedUpdate = debounce((value: string) => {
  searchQuery.value = value
}, 300)
```

### Error Handling

1. **Error Boundaries**: Implement error boundary patterns
2. **Graceful Degradation**: Handle missing data gracefully
3. **Loading States**: Show appropriate loading indicators
4. **Retry Mechanisms**: Implement retry for failed operations

```typescript
const { data, error, isLoading } = await fetchData()

if (error.value) {
  // Handle error state
  showErrorMessage(error.value.message)
}

if (isLoading.value) {
  // Show loading state
  return <LoadingSpinner />
}
```

### Accessibility

1. **ARIA Labels**: Provide meaningful labels
2. **Keyboard Navigation**: Support keyboard interaction
3. **Screen Reader Support**: Ensure screen reader compatibility
4. **Color Contrast**: Maintain adequate color contrast

```vue
<button
  :aria-label="`View details for ${agent.name}`"
  :aria-pressed="isSelected"
  @click="handleViewDetails"
  @keydown.enter="handleViewDetails"
  @keydown.space.prevent="handleViewDetails"
>
  View Details
</button>
```

### Code Organization

1. **Single Responsibility**: One concern per component
2. **Composition**: Use composables for shared logic
3. **Props Validation**: Validate props with TypeScript
4. **Event Naming**: Use descriptive event names

```typescript
// Composable for shared agent logic
export function useAgentOperations() {
  const agentsStore = useAgentsStore()
  
  const spawnAgent = async (config: AgentConfig) => {
    // Agent spawning logic
  }
  
  const removeAgent = async (agentId: AgentInstanceId) => {
    // Agent removal logic
  }
  
  return {
    spawnAgent,
    removeAgent
  }
}
```

### Testing Considerations

1. **Unit Tests**: Test component logic in isolation
2. **Integration Tests**: Test component interactions
3. **Mock Dependencies**: Mock stores and external dependencies
4. **Accessibility Tests**: Test accessibility compliance

```typescript
// Component testing example
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AgentStatusCard from './AgentStatusCard.vue'

describe('AgentStatusCard', () => {
  it('displays agent information correctly', () => {
    const wrapper = mount(AgentStatusCard, {
      props: {
        agent: mockAgent,
        metrics: mockMetrics
      },
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    expect(wrapper.find('[data-testid="agent-name"]').text()).toBe(mockAgent.name)
    expect(wrapper.find('[data-testid="success-rate"]').text()).toContain('85%')
  })
})
```

This component reference guide provides comprehensive documentation for all Vue.js components in the SENTRA Evolution Dashboard, including usage patterns, integration examples, and best practices for development and maintenance.