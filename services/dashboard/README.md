# Sentra Evolution Dashboard

A modern Vue.js dashboard for monitoring and managing evolutionary agents in the Sentra system.

## Features

### Core Dashboard Components
- **Real-time Evolution Monitoring**: Live tracking of agent evolution events
- **Interactive DNA Tree Visualization**: Hierarchical view of genetic lineage
- **Performance Analytics**: Charts and metrics for agent performance
- **Agent Management**: Monitor and control active agents
- **WebSocket Integration**: Real-time updates without page refresh

### UI/UX Features
- **Dark/Light/System Theme Support**: Adaptive theming with smooth transitions
- **Responsive Design**: Mobile-first approach with tablet and desktop layouts
- **Smooth Animations**: Page transitions and micro-interactions
- **Accessibility**: WCAG AA compliant design
- **Modern Design System**: Clean, intuitive interface with proper spacing

## Technical Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** with strict mode and branded types
- **Tailwind CSS** for styling with custom design tokens
- **Pinia** for state management
- **Vue Router 4** for client-side routing
- **Chart.js** for data visualization
- **Heroicons** for consistent iconography
- **Vite** for fast development and building

## Project Structure

```
src/
├── components/
│   ├── charts/              # Chart components (Performance, Activity)
│   ├── dashboard/           # Dashboard-specific components (StatCard)
│   ├── evolution/           # Evolution monitoring components
│   ├── navigation/          # Navigation sidebar
│   └── ui/                 # Reusable UI components
├── stores/                 # Pinia stores
│   ├── theme.ts            # Theme management
│   └── websocket.ts        # Real-time WebSocket connection
├── views/                  # Route components
│   ├── Dashboard.vue       # Main dashboard view
│   ├── EvolutionMonitor.vue # Evolution tracking view
│   ├── AgentManagement.vue # Agent control view
│   ├── Analytics.vue       # Analytics view
│   └── Settings.vue        # Settings view
├── router/                 # Vue Router configuration
└── main.ts                # Application entry point
```

## Key Components

### Navigation Sidebar
- **Features**: Logo, theme toggle, connection status, recent activity
- **Responsive**: Collapsible on mobile, always visible on desktop
- **Real-time Updates**: Shows latest evolution events

### Evolution Timeline
- **Visual Representation**: Timeline view of evolution events
- **Interactive**: Clickable events with detailed information
- **Real-time**: Updates automatically as new events occur
- **Filtering**: Support for trigger type, confidence, and time range

### Pattern Visualization
- **Evolution Flow**: Visual representation of genetic lineage
- **Heatmap**: Genetic changes frequency and impact
- **Timeline Chart**: Confidence scores over time
- **Performance Metrics**: Success rate and improvement tracking

### DNA Tree View
- **Hierarchical Display**: Parent-child relationships in genetic lineage
- **Interactive**: Expandable/collapsible nodes
- **Detailed Information**: Genetic changes, confidence scores, generations
- **Selection**: Click to view detailed node information

### WebSocket Integration
- **Real-time Connection**: Automatic connection with reconnection logic
- **Event Streaming**: Evolution events, agent updates, performance metrics
- **Connection Status**: Visual indicators for connection health
- **Exponential Backoff**: Smart reconnection strategy

### Theme System
- **Three Modes**: Light, Dark, and System preference
- **Persistent**: Saves preference to localStorage
- **Smooth Transitions**: Animated theme switching
- **System Integration**: Respects OS preference in system mode

## Integration Points

### Type Safety
- Uses branded types from `@sentra/types` for ID safety
- Strict TypeScript configuration with proper Vue 3 support
- Readonly interfaces following SENTRA project standards

### WebSocket API
- Connects to evolution events stream
- Handles agent status updates
- Processes performance metrics
- Manages learning outcomes

### Responsive Design
- **Mobile**: Collapsible sidebar, stacked layout
- **Tablet**: Optimized spacing and component sizing
- **Desktop**: Full sidebar, multi-column layouts
- **Accessibility**: Proper focus management and keyboard navigation

## Development

### Prerequisites
- Node.js 18+
- npm 8+

### Setup
```bash
cd packages/dashboard
npm install
```

### Development Server
```bash
npm run dev
```
Starts development server at `http://localhost:5173`

### Build
```bash
npm run build
```
Builds production-ready files to `dist/`

### Type Checking
```bash
npm run type-check
```
Runs Vue TypeScript compiler for type checking

## Configuration

### WebSocket Connection
Default WebSocket URL: `ws://localhost:8080/ws`
Can be configured in Settings view or via environment variables.

### Theme Configuration
Themes are automatically detected and applied:
- Light mode: Clean white/gray palette
- Dark mode: Rich dark grays with proper contrast
- System mode: Follows OS preference

## Performance

### Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Removes unused code in production
- **Asset Optimization**: Minified CSS/JS with gzip compression
- **Lazy Loading**: Components loaded on demand
- **WebSocket Efficiency**: Batched updates and connection pooling

### Bundle Size
- Main bundle: ~113KB (44KB gzipped)
- Route chunks: 1-23KB per route
- Total assets: ~350KB (115KB gzipped)

## Future Enhancements

- [ ] Advanced filtering and search capabilities
- [ ] Export functionality for charts and data
- [ ] Customizable dashboard layouts
- [ ] Real-time collaboration features
- [ ] Enhanced mobile experience
- [ ] Integration with external monitoring tools

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Modern browsers with ES2022 support required.