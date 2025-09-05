# SENTRA Evolution Dashboard

A modern Vue.js 3 dashboard for real-time monitoring of evolutionary agents in the SENTRA system.

## Features

### 🔬 Real-time Agent Monitoring
- **Agent Pool Overview**: Real-time statistics of your agent ecosystem
- **Individual Agent Cards**: Detailed status, DNA information, and current tasks
- **Performance Analytics**: Agent comparison charts and timeline analysis
- **Task Execution Tracking**: Monitor agent workload and progress

### 🧬 DNA Evolution Visualization
- **Evolution Lineage Tree**: Interactive visualization of DNA evolution paths
- **Genetic Markers Radar Chart**: Compare complexity, adaptability, success rates
- **Evolution Timeline**: Track mutation events and triggers
- **Fitness Score Tracking**: Monitor DNA pattern performance over time

### 📊 Performance Analytics
- **Performance Timeline Charts**: Multi-metric performance tracking over time
- **Agent Comparison Charts**: Side-by-side agent performance analysis
- **Success Rate Monitoring**: Track agent task completion rates
- **Code Quality Metrics**: Monitor maintainability and error rates

### 🚀 Modern UI Features
- **Dark/Light Theme**: Automatic system preference detection
- **Real-time WebSocket**: Live updates from agent system
- **Responsive Design**: Works on desktop, tablet, and mobile
- **TypeScript**: Strict type safety throughout
- **Vue 3 Composition API**: Modern reactive architecture

## Quick Start

### Development
```bash
# From the dashboard directory
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Testing
```bash
npm run test          # Unit tests
npm run e2e           # End-to-end tests
npm run test:coverage # Coverage report
```

## Architecture

### Stores (Pinia)
- **`agents.ts`**: Agent lifecycle, performance metrics, task execution
- **`evolution.ts`**: DNA patterns, lineage tracking, mutation events
- **`websocket.ts`**: Real-time communication with agent system
- **`theme.ts`**: UI theme and preferences

### Key Components

#### Agent Management
- `AgentStatusCard`: Individual agent monitoring
- `AgentPoolOverview`: Pool-level statistics and controls
- `AgentComparisonChart`: Performance comparison visualization

#### Evolution Monitoring
- `EvolutionLineageTree`: Interactive DNA evolution tree
- `GeneticMarkersChart`: Radar chart for genetic traits
- `PerformanceTimelineChart`: Time-series performance data

#### Charts & Analytics
- Chart.js integration for performance visualization
- Real-time data updates with WebSocket integration
- Responsive charts with dark/light theme support

## Configuration

### WebSocket Connection
The dashboard connects to the agent system via WebSocket (default: `ws://localhost:8080/ws`).

### Environment Variables
- `VITE_API_BASE_URL`: API endpoint for REST calls
- `VITE_WS_URL`: WebSocket endpoint for real-time updates

## Integration with Core System

The dashboard integrates seamlessly with:
- **`@sentra/core`**: Agent system and DNA evolution engine
- **`@sentra/types`**: Shared TypeScript type definitions
- **Agent API**: REST endpoints for agent management
- **WebSocket Events**: Real-time agent and evolution updates

## Data Flow

1. **WebSocket Connection**: Live updates from agent system
2. **Store Management**: Pinia stores manage application state
3. **Component Reactivity**: Vue 3 reactivity updates UI automatically
4. **Chart Updates**: Real-time chart updates with performance data

## Agent System Integration

The dashboard is designed to work with the SENTRA evolutionary agent system:

- **BaseEvolutionaryAgent**: Core agent implementation
- **OrchestratorAgent**: Task coordination and agent management
- **DeveloperAgent**: Code generation and development tasks
- **DNA Evolution Engine**: Genetic algorithm implementation
- **AgentManager**: Agent lifecycle and pool management

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Performance

- **Bundle Size**: ~400KB (gzipped)
- **First Load**: <2s on 3G connection
- **WebSocket Updates**: <50ms latency
- **Chart Rendering**: 60fps smooth animations