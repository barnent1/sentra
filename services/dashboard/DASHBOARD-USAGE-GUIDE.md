# SENTRA Evolution Dashboard Usage Guide

## Overview

The SENTRA Evolution Dashboard is a comprehensive Vue.js-based monitoring interface designed for real-time oversight and management of evolutionary agents. Built with modern technologies including Vue 3, TypeScript, Pinia state management, and Chart.js visualizations, the dashboard provides deep insights into agent performance, evolution patterns, and system health.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Architecture](#dashboard-architecture)
3. [Core Features](#core-features)
4. [Navigation & Layout](#navigation--layout)
5. [Main Dashboard Views](#main-dashboard-views)
6. [Real-Time Monitoring](#real-time-monitoring)
7. [Agent Management](#agent-management)
8. [Evolution Monitoring](#evolution-monitoring)
9. [Performance Analytics](#performance-analytics)
10. [User Interface Components](#user-interface-components)
11. [User Workflows](#user-workflows)
12. [Technical Integration](#technical-integration)
13. [Troubleshooting](#troubleshooting)
14. [Advanced Usage](#advanced-usage)

## Getting Started

### Prerequisites
- Node.js 18+ 
- Modern web browser with WebSocket support
- Active SENTRA evolutionary agent system
- WebSocket endpoint configured (default: ws://localhost:8080/ws)

### Launch Dashboard
```bash
cd packages/dashboard
npm run dev
```

The dashboard will open at `http://localhost:5173` with automatic hot-reload enabled.

### Initial Setup
1. **WebSocket Connection**: Dashboard auto-connects to the evolution system WebSocket
2. **Theme Configuration**: Choose between light/dark themes via the theme toggle
3. **Data Synchronization**: Real-time data streams begin immediately upon connection

## Dashboard Architecture

### Technology Stack
- **Frontend Framework**: Vue 3 with Composition API
- **State Management**: Pinia stores for reactive data management
- **Styling**: TailwindCSS with dark mode support
- **Charts**: Chart.js with vue-chartjs integration
- **Icons**: Heroicons Vue components
- **Build Tool**: Vite for fast development and optimized builds

### Core Stores
- **WebSocket Store**: Real-time data streaming and connection management
- **Agents Store**: Agent lifecycle, metrics, and performance tracking
- **Evolution Store**: DNA patterns, lineage trees, and genetic changes
- **Theme Store**: UI theme and appearance management

## Core Features

### Real-Time Agent Monitoring
- **Live Status Tracking**: Continuous monitoring of agent status, performance, and activity
- **Performance Metrics**: Success rates, task completion times, quality scores
- **Health Indicators**: Visual status indicators (active/inactive/error states)
- **Resource Usage**: Memory, CPU, and task queue utilization

### DNA Evolution Visualization
- **Lineage Tree**: Interactive tree showing evolutionary relationships
- **Genetic Markers**: Radar charts displaying trait distributions
- **Pattern Recognition**: Visual identification of successful evolutionary paths
- **Mutation Tracking**: Real-time genetic change monitoring

### Task Execution Monitoring
- **Progress Tracking**: Live task progress bars and completion status
- **Performance Analytics**: Success rates, completion times, error patterns
- **Resource Allocation**: Task distribution across agent pool
- **Bottleneck Identification**: Performance constraint analysis

### Agent Pool Management
- **Pool Overview**: High-level statistics and health metrics
- **Individual Monitoring**: Detailed per-agent performance views
- **Lifecycle Control**: Agent spawning, pausing, and termination
- **Capacity Planning**: Pool size optimization recommendations

## Navigation & Layout

### Sidebar Navigation
The persistent sidebar provides access to all major dashboard sections:

#### Main Navigation Items
1. **Dashboard** (`/`) - Overview and key metrics
2. **Evolution Monitor** (`/evolution`) - DNA patterns and evolutionary analysis
3. **Agent Management** (`/agents`) - Individual and pool management
4. **Analytics** (`/analytics`) - Advanced performance analysis
5. **Settings** (`/settings`) - Configuration and preferences

#### Sidebar Features
- **Theme Toggle**: Light/dark mode switcher in header
- **Connection Status**: Real-time WebSocket connection indicator
- **Recent Activity**: Live feed of evolution events
- **Responsive Design**: Collapsible on mobile devices

### Main Content Area
- **Responsive Layout**: Adapts to screen size with fluid grid systems
- **Page Transitions**: Smooth navigation with fade/slide effects
- **Loading States**: Progressive loading indicators for better UX
- **Error Boundaries**: Graceful error handling and recovery

## Main Dashboard Views

### Overview Dashboard (`/`)

#### Key Statistics Cards
- **Active Agents**: Current count with trend indicators
- **Evolution Events**: Recent evolutionary activity count
- **Success Rate**: Overall agent performance percentage
- **Learning Outcomes**: Knowledge acquisition metrics

#### Real-Time Charts
- **Performance Timeline**: Agent success rates over time
- **Activity Chart**: Agent activity distribution by hour
- **Evolution Timeline**: Recent genetic changes and mutations

#### Dashboard Features
- **Auto-Refresh**: Real-time updates every minute
- **WebSocket Reconnection**: Automatic connection recovery
- **Last Updated Timestamp**: Data freshness indicator
- **Manual Refresh**: Force data synchronization button

### Evolution Monitor (`/evolution`)

#### Advanced Filtering System
- **Evolution Trigger Filter**: Filter by trigger type (performance, manual, time-based, pattern recognition)
- **Time Range Selector**: 1h, 6h, 24h, 7d, or all time
- **Confidence Threshold**: Minimum confidence level slider
- **Results Counter**: Live count of filtered events

#### DNA Lineage Tree
- **Interactive Visualization**: Click nodes to explore lineage relationships
- **Fitness Scoring**: Visual representation of evolutionary fitness
- **Generation Tracking**: Clear generation markers and progression
- **Selection Highlighting**: Focus on specific evolutionary branches

#### Genetic Analysis Sidebar
- **Marker Analysis**: Radar chart showing genetic trait distributions
- **Evolution Statistics**: Comprehensive metrics and success rates
- **Recent Changes**: Live feed of genetic modifications
- **Performance Correlation**: Link between genetics and performance

### Agent Management (`/agents`)

#### Three View Modes

##### Pool Overview
- **Aggregate Statistics**: Total agents, active/inactive counts, daily spawns
- **Performance Metrics**: Average success rates, task completion statistics
- **Health Dashboard**: System-wide performance indicators
- **Management Actions**: Bulk operations and pool-level controls

##### Individual Agents
- **Agent Cards**: Detailed status cards for each agent
  - Current task progress with visual progress bars
  - Performance metrics (success rate, tasks completed)
  - DNA genetics overview (complexity, adaptability, stability)
  - Last activity timestamps
  - Management action buttons
- **Grid Layout**: Responsive card grid adapting to screen size
- **Empty State**: Guidance for spawning first agent

##### Performance Analysis
- **Comparison Charts**: Side-by-side agent performance analysis
- **Timeline Visualization**: Performance trends over configurable time periods
- **Metric Selection**: Choose between success rate, completion time, code quality
- **Multi-Agent Views**: Compare up to 8 agents simultaneously

#### Agent Spawning Modal
- **Agent Configuration**: Name, specialization, and capabilities selection
- **Capability Matrix**: Multi-select checkboxes for skills and technologies
- **Validation**: Form validation with real-time feedback
- **Preview**: Agent configuration summary before creation

## Real-Time Monitoring

### WebSocket Integration

#### Connection Management
- **Auto-Connect**: Automatic connection on dashboard load
- **Reconnection Logic**: Exponential backoff with max retry attempts
- **Connection Status**: Visual indicators for connection state
- **Manual Reconnection**: User-initiated connection retry

#### Data Streaming
- **Message Types**: Evolution events, agent updates, performance metrics, learning outcomes
- **Real-Time Processing**: Immediate UI updates on data receipt
- **Data Buffering**: Efficient handling of high-frequency updates
- **Error Resilience**: Graceful handling of malformed messages

#### Performance Optimization
- **Data Limits**: Automatic pruning of old data to prevent memory issues
- **Selective Updates**: Only update changed data to minimize re-renders
- **Batched Operations**: Group multiple updates for better performance
- **Memory Management**: Efficient data structure usage

### Live Updates

#### Dashboard Metrics
- **Statistics Refresh**: Real-time stat card updates
- **Chart Animation**: Smooth transitions for new data points
- **Trend Indicators**: Up/down arrows with change values
- **Timestamp Tracking**: Last update indicators

#### Agent Status
- **Status Changes**: Immediate visual updates for agent state changes
- **Performance Metrics**: Live success rate and completion time updates
- **Task Progress**: Real-time progress bar updates
- **Activity Timestamps**: Current activity status

## Agent Management

### Individual Agent Monitoring

#### Agent Status Cards
Each agent displays comprehensive status information:

##### Header Section
- **Status Indicator**: Color-coded dot (green=active, yellow=inactive, red=error)
- **Agent Identity**: Name, role, and generation number
- **Status Badge**: Current status with appropriate styling

##### Performance Metrics
- **Success Rate**: Percentage with large, readable display
- **Tasks Completed**: Total completed task count
- **Current Task**: Active task with progress bar and title
- **Progress Indicator**: Visual progress bar with percentage

##### DNA Overview
- **Complexity**: Genetic complexity percentage
- **Adaptability**: Adaptation capability score
- **Stability**: Genetic stability measurement
- **Generation**: Current evolution generation

##### Activity Tracking
- **Last Active**: Human-readable timestamp (just now, 5m ago, 2h ago)
- **Status History**: Implicit through activity patterns

##### Action Controls
- **View Details**: Deep dive into agent specifics
- **Manage**: Access to agent configuration and controls

#### Agent Pool Overview

##### Pool Statistics Dashboard
- **Total Agents**: Complete agent count across all statuses
- **Active/Inactive**: Breakdown of current agent states
- **Daily Spawns**: New agents created today
- **Performance Averages**: Pool-wide success rate calculations

##### Pool Management Actions
- **Refresh Pool**: Manually sync pool data
- **Spawn Agent**: Launch new agent creation modal
- **Pool Management**: Access to bulk operations and policies

### Agent Lifecycle Management

#### Spawning New Agents
1. **Configuration Phase**:
   - Agent name specification
   - Specialization selection (Developer, Tester, Reviewer, Analyst, Designer)
   - Capability matrix selection from available technologies
   
2. **Validation Phase**:
   - Form validation with error messaging
   - Required field checking
   - Capability conflict resolution

3. **Creation Phase**:
   - API call to spawn endpoint
   - Progress indication during creation
   - Success/failure feedback

#### Agent Operations
- **Status Management**: Pause, resume, terminate agents
- **Configuration Updates**: Modify capabilities and parameters
- **Performance Tuning**: Adjust agent-specific settings
- **Task Assignment**: Direct task allocation to specific agents

### Performance Analysis

#### Agent Comparison Charts
- **Multi-Agent View**: Side-by-side performance comparison
- **Metric Selection**: Choose comparison criteria (success rate, completion time, quality)
- **Visual Comparison**: Bar charts and trend lines
- **Performance Ranking**: Automatic sorting by selected metric

#### Performance Timeline
- **Historical Data**: Performance trends over selectable time periods
- **Multi-Metric Display**: Overlay multiple performance indicators
- **Zoom Controls**: Focus on specific time ranges
- **Export Options**: Data export for external analysis

## Evolution Monitoring

### DNA Lineage Visualization

#### Interactive Tree Structure
- **Node-Based Layout**: Each DNA pattern as interactive node
- **Parent-Child Relationships**: Clear evolutionary connections
- **Generation Layers**: Horizontal stratification by generation
- **Selection Highlighting**: Visual focus on selected lineage branch

#### Tree Navigation
- **Click Interaction**: Select nodes for detailed analysis
- **Zoom Controls**: Navigate large lineage trees
- **Pan Functionality**: Explore tree areas
- **Reset View**: Return to overview perspective

#### Fitness Integration
- **Performance Mapping**: Link DNA patterns to performance outcomes
- **Success Indicators**: Visual representation of evolutionary success
- **Branch Pruning**: Highlight successful vs. unsuccessful paths
- **Trend Analysis**: Identify improving evolutionary patterns

### Genetic Markers Analysis

#### Radar Chart Visualization
- **Multi-Dimensional Display**: Show multiple genetic traits simultaneously
- **Comparative Analysis**: Overlay multiple DNA patterns
- **Trait Scaling**: Normalized display for easy comparison
- **Interactive Legend**: Toggle trait visibility

#### Genetic Traits Tracked
- **Complexity**: Problem-solving sophistication
- **Adaptability**: Environmental change response
- **Stability**: Consistent performance maintenance
- **Innovation**: Novel solution generation
- **Efficiency**: Resource utilization optimization
- **Cooperation**: Multi-agent collaboration ability

### Evolution Timeline

#### Event Stream
- **Chronological Display**: Events ordered by occurrence time
- **Event Details**: Comprehensive information for each evolution
- **Filtering Options**: Filter by trigger type, confidence, time range
- **Interactive Elements**: Click events for detailed analysis

#### Event Types
- **Performance Threshold**: Evolution triggered by performance criteria
- **Manual**: User-initiated evolutionary changes
- **Time-Based**: Scheduled evolutionary updates
- **Pattern Recognition**: AI-detected improvement opportunities

### Genetic Change Tracking

#### Recent Changes Display
- **Property Modifications**: Show specific genetic property changes
- **Before/After Values**: Clear representation of changes
- **Change Impact**: Link genetic changes to performance outcomes
- **Change Frequency**: Identify most commonly modified traits

#### Change Analysis
- **Success Correlation**: Link genetic changes to performance improvements
- **Rollback Tracking**: Identify reversions and their reasons
- **Change Patterns**: Recognize successful modification strategies
- **Impact Assessment**: Measure change effectiveness

## Performance Analytics

### Comprehensive Metrics Dashboard

#### Agent Performance Metrics
- **Success Rate**: Task completion success percentage
- **Average Completion Time**: Mean time for task completion
- **Code Quality Score**: Quality assessment of generated code
- **User Satisfaction Rating**: Feedback-based satisfaction metrics
- **Adaptation Speed**: Rate of learning and improvement
- **Error Recovery Rate**: Ability to recover from failures

#### System Performance Metrics
- **Pool Utilization**: Percentage of agents actively working
- **Throughput**: Tasks completed per unit time
- **Queue Length**: Pending task backlog
- **Resource Usage**: System resource consumption
- **Scalability Metrics**: Performance under varying loads

### Advanced Analytics

#### Performance Timeline Charts
- **Multi-Metric Display**: Overlay multiple performance indicators
- **Time Range Selection**: Configurable analysis periods
- **Trend Analysis**: Identify performance patterns and cycles
- **Anomaly Detection**: Highlight unusual performance patterns

#### Comparative Analysis
- **Agent-to-Agent**: Side-by-side performance comparison
- **Historical Comparison**: Current vs. historical performance
- **Benchmark Analysis**: Performance against defined benchmarks
- **Cohort Analysis**: Group performance by spawn time or generation

#### Predictive Analytics
- **Performance Forecasting**: Predict future performance trends
- **Capacity Planning**: Recommend optimal pool sizes
- **Maintenance Scheduling**: Predict optimal evolution timing
- **Resource Planning**: Forecast resource requirements

## User Interface Components

### Core Components

#### StatCard Component
Displays key performance indicators with:
- **Large Number Display**: Prominent metric value
- **Trend Indicators**: Up/down arrows with change values
- **Color Coding**: Visual status indication (blue, green, purple, amber)
- **Icon Integration**: Relevant Heroicons for visual context

#### AgentStatusCard Component
Comprehensive agent information display:
- **Status Indicators**: Visual status representation
- **Performance Metrics**: Success rates and task counts
- **DNA Overview**: Genetic trait summaries
- **Action Buttons**: Management and detail access

#### EvolutionTimeline Component
Event stream visualization:
- **Chronological Layout**: Time-ordered event display
- **Event Details**: Comprehensive evolution information
- **Interactive Elements**: Clickable events for detailed analysis
- **Filtering Integration**: Responsive to filter settings

#### Chart Components
- **PerformanceChart**: Line charts for performance metrics
- **AgentActivityChart**: Activity distribution visualization
- **AgentComparisonChart**: Multi-agent comparison displays
- **PerformanceTimelineChart**: Time-series performance analysis
- **GeneticMarkersChart**: Radar charts for genetic analysis

### Interactive Elements

#### Navigation Components
- **NavigationSidebar**: Persistent navigation with active state indication
- **ThemeToggle**: Light/dark mode switcher with smooth transitions
- **ConnectionStatus**: Real-time WebSocket status indicator

#### Control Components
- **Filter Controls**: Multi-type filtering for data views
- **Time Range Selectors**: Configurable time period selection
- **Metric Selectors**: Choose analysis metrics and parameters
- **Action Buttons**: Primary, secondary, and danger action styling

#### Modal Components
- **Agent Spawn Modal**: Multi-step agent creation interface
- **Confirmation Modals**: User action confirmation dialogs
- **Detail Views**: Expanded information displays

### Responsive Design

#### Screen Size Adaptation
- **Mobile**: Single column layouts, collapsed navigation
- **Tablet**: Two-column grids, condensed navigation
- **Desktop**: Full grid layouts, expanded navigation
- **Large Screens**: Multi-column layouts, extended charts

#### Component Responsiveness
- **Flexible Grids**: CSS Grid with responsive breakpoints
- **Fluid Charts**: Charts that adapt to container size
- **Scalable Typography**: Responsive text sizing
- **Touch-Friendly Controls**: Appropriate target sizes for mobile

## User Workflows

### Daily Monitoring Routine

#### Morning Review
1. **Dashboard Overview**: Check overnight activity and status
2. **Agent Health Check**: Review agent status cards for issues
3. **Performance Review**: Analyze overnight performance metrics
4. **Evolution Activity**: Check for significant evolutionary changes

#### During Development
1. **Task Monitoring**: Track active task progress
2. **Performance Tracking**: Monitor real-time success rates
3. **Issue Detection**: Watch for error indicators and failures
4. **Resource Management**: Monitor pool utilization and capacity

#### End-of-Day Analysis
1. **Performance Summary**: Review daily performance metrics
2. **Evolution Analysis**: Analyze genetic changes and improvements
3. **Planning**: Identify optimization opportunities
4. **Reporting**: Export data for stakeholder reporting

### Agent Management Workflows

#### New Agent Deployment
1. **Requirements Analysis**: Determine needed capabilities
2. **Agent Configuration**: Set up agent with appropriate skills
3. **Spawn Process**: Use modal to create and configure agent
4. **Initial Monitoring**: Watch new agent performance
5. **Performance Tuning**: Adjust configuration based on results

#### Performance Optimization
1. **Performance Analysis**: Identify underperforming agents
2. **Root Cause Analysis**: Investigate performance issues
3. **Configuration Adjustment**: Modify agent parameters
4. **Evolution Trigger**: Initiate evolutionary improvements
5. **Results Validation**: Verify improvement effectiveness

#### Issue Resolution
1. **Problem Detection**: Identify failing or stuck agents
2. **Diagnostics**: Use detail views to analyze issues
3. **Corrective Action**: Apply fixes or restart agents
4. **Monitoring**: Track resolution effectiveness
5. **Prevention**: Implement measures to prevent recurrence

### Evolution Management Workflows

#### Evolution Monitoring
1. **Timeline Review**: Check recent evolutionary events
2. **Success Analysis**: Identify successful evolutionary patterns
3. **Genetic Review**: Analyze genetic marker changes
4. **Performance Correlation**: Link genetics to performance outcomes

#### Manual Evolution Triggers
1. **Performance Assessment**: Evaluate current performance
2. **Evolution Decision**: Determine need for evolutionary changes
3. **Trigger Execution**: Initiate manual evolution process
4. **Impact Monitoring**: Track evolution effectiveness
5. **Adjustment**: Fine-tune evolution parameters

### Analytics and Reporting

#### Performance Reporting
1. **Data Collection**: Gather relevant performance metrics
2. **Analysis Configuration**: Set up appropriate time ranges and filters
3. **Visualization**: Generate charts and graphs for presentation
4. **Export**: Extract data for external reporting tools
5. **Distribution**: Share insights with stakeholders

#### Trend Analysis
1. **Historical Review**: Analyze long-term performance trends
2. **Pattern Recognition**: Identify cyclical or seasonal patterns
3. **Predictive Modeling**: Forecast future performance
4. **Optimization Planning**: Plan improvement initiatives
5. **Implementation**: Execute optimization strategies

## Technical Integration

### WebSocket Architecture

#### Connection Management
```typescript
// Connection configuration
const connect = (url: string = 'ws://localhost:8080/ws') => {
  // WebSocket initialization with auto-reconnection
  // Exponential backoff for failed connections
  // Connection state management
}
```

#### Message Handling
```typescript
interface WebSocketMessage {
  readonly type: 'evolution_event' | 'agent_update' | 'performance_update' | 'learning_outcome'
  readonly data: EvolutionEvent | AgentInstance | PerformanceMetrics | LearningOutcome
  readonly timestamp: Date
}
```

#### Data Streaming
- **Real-Time Updates**: Immediate UI updates on data receipt
- **Data Persistence**: Maintain rolling data history
- **Error Recovery**: Graceful handling of connection issues
- **Performance Optimization**: Efficient data processing

### State Management with Pinia

#### Store Architecture
- **WebSocket Store**: Real-time data streaming and connection management
- **Agents Store**: Agent lifecycle, metrics, and performance tracking
- **Evolution Store**: DNA patterns, lineage trees, and genetic changes
- **Theme Store**: UI theme and appearance management

#### Reactive Data Flow
```typescript
// Example agent metrics computation
const poolStats = computed((): AgentPoolStats => {
  const avgPerformance = agents.value.length > 0 
    ? agents.value.reduce((sum, agent) => {
        const metrics = agentMetrics.value.get(agent.id)
        return sum + (metrics?.successRate || 0)
      }, 0) / agents.value.length
    : 0
    
  return {
    totalAgents: agents.value.length,
    activeAgents: activeAgents.value.length,
    averagePerformance: avgPerformance,
    // ... additional metrics
  }
})
```

#### Data Persistence
- **Local Storage**: Theme preferences and user settings
- **Session Storage**: Temporary filter states and view preferences
- **Memory Management**: Automatic data pruning for performance

### Chart.js Integration

#### Chart Configuration
```typescript
// Performance chart setup with theme integration
const createChart = async () => {
  const isDark = themeStore.isDark
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? '#374151' : '#e5e7eb'

  chart.value = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels: props.data.map((_, index) => `T${index + 1}`),
      datasets: [{
        label: 'Success Rate',
        data: props.data.map(point => point.y),
        borderColor: '#3b82f6',
        backgroundColor: isDark 
          ? 'rgba(59, 130, 246, 0.1)' 
          : 'rgba(59, 130, 246, 0.1)',
        // ... additional styling
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // ... chart configuration
    }
  })
}
```

#### Dynamic Updates
- **Real-Time Data**: Charts update automatically with new data
- **Theme Responsiveness**: Charts adapt to light/dark theme changes
- **Performance Optimization**: Efficient chart redrawing and updates
- **Interactive Features**: Click, hover, and zoom functionality

### Vue Router Integration

#### Route Configuration
```typescript
const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/evolution', name: 'EvolutionMonitor', component: EvolutionMonitor },
  { path: '/agents', name: 'AgentManagement', component: AgentManagement },
  { path: '/analytics', name: 'Analytics', component: Analytics },
  { path: '/settings', name: 'Settings', component: Settings }
]
```

#### Navigation Features
- **Page Transitions**: Smooth transitions between views
- **Active State**: Visual indication of current page
- **Programmatic Navigation**: Navigate based on user actions
- **Route Guards**: Protect routes based on connection state

### Component Architecture

#### Composition API Usage
```typescript
// Typical component setup
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocketStore } from '../stores/websocket'
import { useAgentsStore } from '../stores/agents'

const webSocketStore = useWebSocketStore()
const agentsStore = useAgentsStore()

// Reactive state
const selectedView = ref('pool')
const isLoading = ref(false)

// Computed properties
const activeAgents = computed(() => agentsStore.activeAgents)
const poolStats = computed(() => agentsStore.poolStats)

// Lifecycle management
onMounted(() => {
  if (!webSocketStore.isConnected) {
    webSocketStore.connect()
  }
})

onUnmounted(() => {
  // Cleanup logic
})
</script>
```

#### TypeScript Integration
- **Strict Typing**: Full TypeScript coverage with strict mode
- **Interface Definitions**: Comprehensive type definitions for all data structures
- **Generic Components**: Reusable components with proper type constraints
- **Type Safety**: Compile-time error detection and prevention

## Troubleshooting

### Connection Issues

#### WebSocket Connection Problems
**Symptoms**: Connection status shows "disconnected" or "error"

**Solutions**:
1. **Check Server Status**: Ensure SENTRA system is running
2. **Verify Endpoint**: Confirm WebSocket URL is correct
3. **Network Issues**: Check firewall and proxy settings
4. **Manual Reconnection**: Use "Connect WebSocket" button
5. **Browser Console**: Check for detailed error messages

#### Auto-Reconnection Failures
**Symptoms**: Repeated connection attempts without success

**Solutions**:
1. **Check Max Attempts**: System stops after 5 failed attempts
2. **Server Availability**: Verify server is accepting connections
3. **Network Stability**: Ensure stable internet connection
4. **Refresh Dashboard**: Hard refresh to reset connection state

### Performance Issues

#### Slow Chart Rendering
**Symptoms**: Charts take long to render or update

**Solutions**:
1. **Data Volume**: Reduce time range or filter data
2. **Browser Performance**: Close unnecessary tabs and applications
3. **Hardware Acceleration**: Enable GPU acceleration in browser
4. **Data Limits**: System automatically limits data to prevent issues

#### Memory Usage Growth
**Symptoms**: Browser memory usage increases over time

**Solutions**:
1. **Data Pruning**: System automatically limits stored data
2. **Page Refresh**: Periodic refresh to clear accumulated data
3. **Close Unused Views**: Navigate away from data-heavy views
4. **Browser Restart**: Restart browser if memory usage is excessive

### Data Display Issues

#### Missing or Stale Data
**Symptoms**: Data not updating or showing as unavailable

**Solutions**:
1. **Connection Check**: Verify WebSocket connection status
2. **Manual Refresh**: Use refresh buttons to force data update
3. **Time Synchronization**: Ensure system clocks are synchronized
4. **Filter Settings**: Check if filters are hiding expected data

#### Chart Display Problems
**Symptoms**: Charts not displaying or showing incorrectly

**Solutions**:
1. **Data Availability**: Verify data exists for selected time range
2. **Theme Issues**: Toggle theme to reset chart rendering
3. **Browser Compatibility**: Ensure modern browser with Canvas support
4. **Window Resize**: Resize window to trigger chart redraw

### User Interface Issues

#### Theme Not Applying
**Symptoms**: Theme toggle not working or partially applied

**Solutions**:
1. **Local Storage**: Clear browser local storage
2. **CSS Loading**: Ensure all CSS files loaded correctly
3. **Browser Cache**: Clear browser cache and reload
4. **System Preference**: Check if system dark mode conflicts

#### Responsive Layout Problems
**Symptoms**: Layout not adapting to screen size

**Solutions**:
1. **Browser Zoom**: Reset browser zoom to 100%
2. **Viewport Meta**: Ensure proper viewport meta tag
3. **CSS Grid Support**: Verify browser supports CSS Grid
4. **Window Refresh**: Refresh after changing screen orientation

## Advanced Usage

### Custom Filtering and Analysis

#### Creating Custom Filters
1. **Navigate to Evolution Monitor**: Access advanced filtering options
2. **Combine Filter Types**: Use multiple filter criteria simultaneously
3. **Save Filter States**: Browser remembers filter settings per session
4. **Export Filtered Data**: Use browser developer tools to access filtered results

#### Advanced Time Range Analysis
1. **Custom Ranges**: Use date picker for specific time periods
2. **Comparative Analysis**: Compare same periods across different time frames
3. **Trend Identification**: Look for patterns across different time scales
4. **Seasonal Analysis**: Identify recurring patterns by time of day/week

### Integration with External Tools

#### Data Export
1. **Browser DevTools**: Access raw data through console
2. **Screenshot Capture**: Use browser screenshot tools for charts
3. **Network Tab**: Monitor WebSocket messages for data extraction
4. **CSV Export**: Copy table data for spreadsheet analysis

#### API Integration
1. **WebSocket Data**: Tap into real-time data stream
2. **REST Endpoints**: Access historical data through APIs
3. **Webhook Integration**: Set up notifications for specific events
4. **External Dashboards**: Integrate with tools like Grafana or Tableau

### Performance Optimization

#### Dashboard Performance
1. **Selective Views**: Focus on specific data subsets
2. **Time Range Limits**: Use shorter time ranges for better performance
3. **Filter Early**: Apply filters to reduce data processing
4. **Regular Refresh**: Restart dashboard periodically for optimal performance

#### System Monitoring
1. **Connection Quality**: Monitor WebSocket connection stability
2. **Data Volume**: Track data throughput and storage
3. **Browser Performance**: Use performance profiling tools
4. **Resource Usage**: Monitor system resource consumption

### Customization Options

#### Theme Customization
1. **Built-in Themes**: Light and dark mode options
2. **System Integration**: Automatic theme based on system preference
3. **Persistence**: Theme choice saved across sessions
4. **Component Consistency**: All components respect theme settings

#### View Preferences
1. **Default Views**: Set preferred starting views for each section
2. **Chart Types**: Choose preferred visualization styles
3. **Time Ranges**: Set default analysis periods
4. **Filter Presets**: Save commonly used filter combinations

### Mobile Usage

#### Responsive Features
1. **Touch Navigation**: Optimized for touch interfaces
2. **Collapsed Menus**: Space-efficient navigation on small screens
3. **Readable Text**: Appropriate text sizing for mobile devices
4. **Touch-Friendly Controls**: Buttons and controls sized for finger interaction

#### Mobile-Specific Workflows
1. **Quick Status Checks**: Rapid overview of system status
2. **Alert Monitoring**: Real-time notification of critical events
3. **Simplified Views**: Essential information for mobile context
4. **Offline Resilience**: Graceful degradation when connection is poor

This comprehensive usage guide provides detailed information about all aspects of the SENTRA Evolution Dashboard. For additional support or feature requests, consult the project documentation or contact the development team.