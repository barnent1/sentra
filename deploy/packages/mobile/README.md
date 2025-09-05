# Sentra Mobile - PWA Interface

A Progressive Web App (PWA) mobile interface for approving evolutionary agent decisions and monitoring system status in the SENTRA evolutionary agent system.

## Features

### Core Functionality
- **Agent Decision Approvals**: Touch-optimized interface for approving/rejecting agent decisions
- **Critical System Alerts**: Real-time notifications for critical system events
- **Agent Status Monitoring**: Simplified mobile view of agent health and performance
- **Task Status Updates**: Quick task progress monitoring and updates
- **Emergency Controls**: Emergency agent management controls for critical situations

### PWA Features
- **Service Worker**: Offline functionality with intelligent caching strategies
- **Web App Manifest**: Native-like app experience with app icons and splash screens
- **Push Notifications**: Critical alert notifications even when app is closed
- **Offline Data Caching**: Local data storage with automatic synchronization
- **Background Sync**: Queues actions when offline and syncs when connection restored

### Mobile Optimizations
- **Touch-First Design**: All interactive elements are touch-optimized (44px minimum)
- **Gesture Support**: Swipe gestures for quick approvals/rejections
- **Safe Area Handling**: Proper support for devices with notches/dynamic islands
- **Responsive Layout**: Optimized for various screen sizes from phones to tablets
- **Performance Optimized**: Lazy loading, skeleton screens, and efficient rendering

### Technical Stack
- **Vue 3**: Reactive UI framework with Composition API
- **TypeScript**: Strict typing with branded types following SENTRA standards
- **Pinia**: State management with reactive stores
- **Vue Router**: Client-side routing with navigation guards
- **Tailwind CSS**: Utility-first CSS with custom mobile-optimized utilities
- **Vite**: Fast build tool with PWA plugin
- **IndexedDB**: Client-side database for offline data storage
- **WebSockets**: Real-time communication with the agent system

## Project Structure

```
packages/mobile/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # PWA icons and splash screens
├── src/
│   ├── components/
│   │   ├── approvals/         # Approval-related components
│   │   ├── alerts/            # Alert/notification components
│   │   ├── controls/          # Emergency control components
│   │   ├── navigation/        # Navigation components
│   │   └── ui/               # Reusable UI components
│   ├── composables/          # Vue composables for shared logic
│   ├── stores/               # Pinia stores
│   │   ├── mobile-websocket.ts  # WebSocket integration
│   │   ├── approvals.ts         # Approval management
│   │   ├── mobile-agents.ts     # Agent status management
│   │   ├── offline.ts           # Offline data and sync
│   │   └── notifications.ts     # Push notifications
│   ├── types/
│   │   ├── mobile.ts         # Mobile-specific types
│   │   └── index.ts          # Type exports
│   ├── views/                # Main app views/pages
│   │   ├── ApprovalsView.vue    # Main approvals interface
│   │   ├── AlertsView.vue       # System alerts view
│   │   ├── AgentsView.vue       # Agent status view
│   │   └── ControlsView.vue     # Emergency controls view
│   ├── App.vue              # Root component
│   ├── main.ts              # App entry point
│   └── style.css            # Global styles and utilities
├── index.html               # HTML template with PWA meta tags
├── vite.config.ts           # Vite configuration with PWA plugin
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration (strict)
└── package.json            # Dependencies and scripts
```

## Key Components

### Mobile WebSocket Store (`mobile-websocket.ts`)
- Real-time connection to SENTRA WebSocket server
- Automatic reconnection with exponential backoff
- Message handling for approvals, alerts, and agent updates
- Offline action queuing and synchronization
- Heartbeat monitoring for connection health

### Approvals Store (`approvals.ts`)
- Approval request management and filtering
- Batch operations (approve/reject multiple requests)
- Decision tracking and retry logic
- Priority-based sorting and urgent approval detection

### Offline Store (`offline.ts`)
- IndexedDB integration for local data storage
- Automatic sync when connection restored
- Conflict resolution for offline actions
- Cache management with size limits

### Notifications Store (`notifications.ts`)
- Push notification subscription management
- Notification permission handling
- Custom notification actions (approve, reject, acknowledge)
- Quiet hours and notification filtering

## Mobile-Specific Features

### Touch Gestures
- **Swipe Left**: Quick reject approval
- **Swipe Right**: Quick approve approval
- **Long Press**: Show context menu
- **Pull to Refresh**: Sync latest data

### Touch Optimizations
- Minimum 44px touch targets for accessibility
- Touch-friendly spacing and button sizes
- Haptic feedback simulation through visual cues
- Optimized scrolling with momentum

### Performance Features
- **Skeleton Loading**: Smooth loading states
- **Virtual Scrolling**: Efficient large list rendering
- **Image Optimization**: Responsive images with lazy loading
- **Bundle Splitting**: Code splitting for faster initial load

### Offline Capabilities
- **Local Data Cache**: Store approvals, alerts, and agent status
- **Action Queuing**: Queue decisions when offline
- **Background Sync**: Automatic sync when online
- **Cache Management**: Intelligent cache invalidation and cleanup

## Environment Variables

```env
VITE_API_URL=https://api.sentra.dev
VITE_WS_URL=wss://api.sentra.dev/mobile-ws
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_ENABLE_PWA=true
```

## Development

### Setup
```bash
cd packages/mobile
npm install
```

### Development Server
```bash
npm run dev
```
Starts development server with hot reload at `http://localhost:5174`

### Build for Production
```bash
npm run build
```

### PWA Development
```bash
npm run build:pwa
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## PWA Installation

The app can be installed on mobile devices through:

1. **iOS Safari**: Add to Home Screen
2. **Android Chrome**: Install App prompt
3. **Desktop**: Install button in address bar

## TypeScript Standards

Following SENTRA project standards:

- **Strict TypeScript**: All `any` types prohibited
- **Branded Types**: Type-safe IDs with branded types
- **Readonly Interfaces**: All interfaces use readonly properties
- **Generic Constraints**: Proper type constraints for vector operations
- **No Legacy Patterns**: Modern TypeScript patterns only

## Security Features

- **Content Security Policy**: Strict CSP headers
- **HTTPS Only**: All production traffic over HTTPS
- **Token Validation**: JWT token validation for API calls
- **Input Sanitization**: All user input properly sanitized
- **XSS Protection**: Vue's built-in XSS protection

## Performance Optimizations

- **Bundle Size**: < 500KB initial bundle
- **First Contentful Paint**: < 1.5s on 3G
- **Time to Interactive**: < 3s on 3G
- **Lighthouse Score**: 90+ on all metrics
- **Memory Usage**: Optimized for mobile memory constraints

## Browser Support

- **iOS Safari**: 13+
- **Chrome Mobile**: 80+
- **Firefox Mobile**: 75+
- **Samsung Internet**: 12+
- **Edge Mobile**: 80+

## Testing

The mobile interface includes comprehensive testing:

- **Unit Tests**: Component and store testing with Jest
- **Integration Tests**: User flow testing with Playwright
- **PWA Testing**: Service worker and offline functionality
- **Performance Testing**: Lighthouse CI integration
- **Device Testing**: Real device testing on various screen sizes

This PWA provides a complete mobile solution for SENTRA agent approvals with enterprise-grade offline capabilities, push notifications, and mobile-optimized user experience.