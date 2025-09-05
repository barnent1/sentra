# SENTRA Dashboard Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Launch Dashboard
```bash
cd packages/dashboard
npm run dev
```
Open http://localhost:5173

### 2. Verify Connection
- Check WebSocket status indicator in sidebar (should be green)
- If disconnected, click "Connect WebSocket" button
- Ensure SENTRA system is running on default port 8080

### 3. Explore Main Views

#### Dashboard Overview (`/`)
- **Key Metrics**: Active agents, evolution events, success rates
- **Real-time Charts**: Performance timeline and activity distribution
- **Recent Activity**: Latest evolution events and changes

#### Agent Management (`/agents`)
- **Pool View**: Overall agent statistics and health
- **Individual View**: Detailed agent status cards
- **Performance Analysis**: Comparative charts and metrics

#### Evolution Monitor (`/evolution`)
- **Lineage Tree**: Interactive DNA evolution visualization
- **Genetic Analysis**: Trait distributions and markers
- **Event Timeline**: Chronological evolution history

### 4. Common Tasks

#### Monitor Agent Performance
1. Go to Agent Management → Individual view
2. Review agent status cards for health indicators
3. Check success rates and task completion metrics
4. Use "View Details" for in-depth analysis

#### Analyze Evolution Patterns
1. Navigate to Evolution Monitor
2. Use filters to focus on specific time periods
3. Explore DNA lineage tree by clicking nodes
4. Review genetic markers in radar chart

#### Spawn New Agent
1. Go to Agent Management
2. Click "Spawn Agent" button
3. Configure name, specialization, and capabilities
4. Submit form to create new agent

### 5. Key Features

#### Real-Time Updates
- **WebSocket Connection**: Live data streaming
- **Auto Refresh**: Metrics update automatically
- **Status Indicators**: Visual connection and health status

#### Interactive Visualizations
- **Chart.js Integration**: Responsive, interactive charts
- **Click Navigation**: Click elements to drill down
- **Hover Details**: Tooltips with additional information

#### Responsive Design
- **Mobile Support**: Works on all screen sizes
- **Touch-Friendly**: Optimized for touch interfaces
- **Dark Mode**: Toggle between light and dark themes

## 📊 Dashboard Features Summary

### Core Monitoring Capabilities
- **Real-time agent status tracking** with visual indicators
- **Performance metrics visualization** using Chart.js
- **DNA evolution monitoring** with interactive lineage trees
- **Task execution tracking** with progress indicators
- **Agent pool management** with spawning and lifecycle controls

### Advanced Analytics
- **Comparative analysis** between multiple agents
- **Historical performance trends** over configurable time periods
- **Genetic marker analysis** using radar charts
- **Evolution pattern recognition** with filtering and search
- **Predictive performance insights** based on historical data

### User Interface Highlights
- **Navigation sidebar** with persistent menu and recent activity
- **Theme toggle** supporting light/dark modes with system integration
- **Connection status** indicator with auto-reconnection
- **Responsive layout** adapting to all screen sizes
- **Interactive components** with hover states and click actions

### Integration Features
- **WebSocket real-time streaming** with exponential backoff reconnection
- **Pinia state management** for reactive data flow
- **Vue Router navigation** with smooth page transitions
- **TypeScript strict typing** for development safety
- **Chart.js visualization** with theme-aware styling

## 🔧 Technical Architecture

### Frontend Stack
- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** with strict type checking
- **Pinia** for state management
- **Vue Router** for navigation
- **TailwindCSS** for styling
- **Chart.js** for data visualization
- **Heroicons** for consistent iconography

### Real-Time Data Flow
1. **WebSocket Connection** to SENTRA system (ws://localhost:8080/ws)
2. **Message Processing** through WebSocket store
3. **State Updates** via Pinia reactive stores
4. **UI Updates** through Vue's reactivity system
5. **Chart Updates** with smooth animations

### Component Architecture
- **App.vue**: Root layout with navigation and routing
- **View Components**: Page-level components (Dashboard, AgentManagement, etc.)
- **Feature Components**: Specialized components (AgentStatusCard, EvolutionTimeline)
- **UI Components**: Reusable interface elements (StatCard, ThemeToggle)
- **Chart Components**: Visualization components with Chart.js integration

## 📱 Mobile Integration

### Responsive Features
- **Collapsible sidebar** navigation on mobile devices
- **Touch-optimized** buttons and interactive elements
- **Readable typography** with appropriate sizing
- **Fluid layouts** adapting to portrait/landscape orientations

### Mobile Workflows
- **Quick status checks** with condensed information display
- **Essential metrics** prioritized for small screens
- **Touch navigation** optimized for finger interaction
- **Offline resilience** with graceful degradation

## 🔍 Troubleshooting Quick Reference

### Connection Issues
- **Red connection status**: Check if SENTRA system is running
- **Manual reconnection**: Use "Connect WebSocket" button
- **Network issues**: Verify firewall and proxy settings

### Performance Issues
- **Slow charts**: Reduce time range or filter data
- **Memory growth**: Refresh page periodically
- **Missing data**: Check WebSocket connection and filters

### UI Issues
- **Theme not applying**: Clear browser cache and local storage
- **Layout problems**: Reset browser zoom to 100%
- **Charts not displaying**: Verify browser Canvas support

## 📚 Further Reading

- **[DASHBOARD-USAGE-GUIDE.md](./DASHBOARD-USAGE-GUIDE.md)**: Comprehensive feature documentation
- **[COMPONENT-REFERENCE.md](./COMPONENT-REFERENCE.md)**: Detailed component API reference
- **SENTRA Core Documentation**: System-wide architecture and APIs
- **Vue 3 Documentation**: Framework-specific guidance
- **Chart.js Documentation**: Visualization library reference

## 🎯 Key Dashboard Features Covered

### Dashboard Functionality
✅ **Real-time agent monitoring** with status indicators and performance metrics  
✅ **Agent performance analytics** with success rates, completion times, and quality scores  
✅ **DNA evolution visualization** with lineage trees and genetic marker analysis  
✅ **Task execution monitoring** with progress tracking and resource allocation  
✅ **Agent pool management** with spawning, lifecycle control, and capacity planning  

### User Interface Elements
✅ **Navigation sidebar** with routing, theme toggle, and connection status  
✅ **Dashboard widgets** including stat cards, charts, and timeline components  
✅ **Interactive charts** using Chart.js with hover states and click navigation  
✅ **Real-time updates** via WebSocket with automatic reconnection  
✅ **Filtering and search** capabilities across all major views  

### User Workflows
✅ **Daily monitoring routines** for agent health and system performance  
✅ **Agent lifecycle management** from spawning to optimization  
✅ **Evolution pattern analysis** with genetic tracking and correlation  
✅ **Performance troubleshooting** with detailed diagnostics and resolution  
✅ **Analytics and reporting** with export capabilities and trend analysis  

### Technical Integration
✅ **WebSocket connection management** with robust error handling  
✅ **Chart.js visualizations** with theme integration and responsive design  
✅ **Vue.js component architecture** with Composition API and TypeScript  
✅ **Responsive design features** supporting mobile and desktop usage  
✅ **State management** using Pinia with reactive data flow  

The SENTRA Evolution Dashboard provides a comprehensive, real-time monitoring solution for evolutionary agent systems with advanced visualization, intuitive user workflows, and robust technical integration.