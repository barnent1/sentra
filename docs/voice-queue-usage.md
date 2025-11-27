# Voice Queue System

## Overview

The voice queue system prevents overlapping voice announcements in multi-project scenarios. It provides:

- **Priority-based queuing** (error > warning > info)
- **Per-project muting** to silence notifications from specific projects
- **Echo prevention** delay (1000ms) between messages
- **Race condition safety** for concurrent operations
- **TypeScript strict mode** compliance

## Architecture

```
┌─────────────────────────────────────────────┐
│  Application Layer                          │
│  (Dashboard, Settings, etc.)                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  voice-notifications.ts                     │
│  - initVoiceNotifications()                 │
│  - queueVoiceNotification()                 │
│  - setProjectMuted()                        │
│  - Helper functions                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  VoiceQueue (voice-queue.ts)                │
│  - Priority queue implementation            │
│  - Mute filtering                           │
│  - Sequential processing                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  OpenAI TTS API                             │
│  - Text-to-speech conversion                │
│  - Audio playback                           │
└─────────────────────────────────────────────┘
```

## Usage

### 1. Initialize the Voice Queue

```typescript
import { initVoiceNotifications } from '@/lib/voice-notifications';

// Initialize with OpenAI API key and voice model
initVoiceNotifications(apiKey, 'nova');
```

### 2. Queue Voice Notifications

```typescript
import { queueVoiceNotification } from '@/lib/voice-notifications';

// Queue a notification with priority
await queueVoiceNotification({
  text: 'Build completed successfully',
  projectName: 'quetrex',
  priority: 'info' // or 'warning' or 'error'
});
```

### 3. Use Helper Functions

```typescript
import {
  notifySuccess,
  notifyWarning,
  notifyError,
  notifyAgentCompletion,
  notifyAgentFailure,
  notifyAgentStart
} from '@/lib/voice-notifications';

// Simple notifications
await notifySuccess('quetrex', 'Tests passed');
await notifyWarning('workcell', 'Low memory detected');
await notifyError('aidio', 'Deployment failed');

// Agent lifecycle notifications
await notifyAgentStart('quetrex', 'Implement voice queue');
await notifyAgentCompletion('quetrex', 'Implement voice queue');
await notifyAgentFailure('quetrex', 'Implement voice queue', 'Tests failed');
```

### 4. Mute/Unmute Projects

```typescript
import { setProjectMuted, isProjectMuted } from '@/lib/voice-notifications';

// Mute a project (no voice notifications)
setProjectMuted('quetrex', true);

// Unmute a project
setProjectMuted('quetrex', false);

// Check mute status
if (isProjectMuted('quetrex')) {
  console.log('Quetrex is muted');
}
```

### 5. Monitor Queue Status

```typescript
import { getVoiceQueueStatus } from '@/lib/voice-notifications';

const status = getVoiceQueueStatus();
if (status) {
  console.log(`Queue length: ${status.queueLength}`);
  console.log(`Is processing: ${status.isProcessing}`);
  console.log(`Current message: ${status.currentMessage?.text}`);
}
```

### 6. Clear Queue

```typescript
import { clearVoiceQueue, clearProjectNotifications } from '@/lib/voice-notifications';

// Clear all pending notifications
clearVoiceQueue();

// Clear notifications for a specific project
clearProjectNotifications('quetrex');
```

### 7. Cleanup

```typescript
import { cleanupVoiceNotifications } from '@/lib/voice-notifications';

// Clean up when unmounting or closing
cleanupVoiceNotifications();
```

## Priority Levels

Messages are processed in this order:

1. **error** (highest priority) - Critical failures, exceptions
2. **warning** - Important but non-critical issues
3. **info** (lowest priority) - General notifications, completions

Within the same priority level, messages are processed FIFO (first-in, first-out).

## Echo Prevention

The system automatically adds a 1000ms delay after each TTS message to prevent:
- Voice output triggering voice input
- Overlapping announcements
- Audio feedback loops

This delay is in addition to the TTS playback time.

## Multi-Project Support

The queue handles multiple projects simultaneously:

```typescript
// These will be spoken in order, but quetrex can be muted independently
await notifySuccess('quetrex', 'Build complete');
await notifySuccess('workcell', 'Deploy complete');
await notifyError('aidio', 'Test failed'); // This will jump ahead (higher priority)

// Mute quetrex - its messages will be filtered out
setProjectMuted('quetrex', true);
```

## Testing

The voice queue has 90%+ test coverage:

```bash
npm test -- tests/unit/services/voice-queue.test.ts --run --coverage
```

Test coverage includes:
- Priority ordering
- Mute filtering
- Echo prevention
- Race conditions
- Edge cases
- Error handling

## Integration with Dashboard

The dashboard can display queue status:

```typescript
import { getVoiceQueueStatus } from '@/lib/voice-notifications';

function VoiceQueueIndicator() {
  const status = getVoiceQueueStatus();

  if (!status || status.queueLength === 0) {
    return null;
  }

  return (
    <div className="voice-queue-status">
      {status.isProcessing && (
        <div>Speaking: {status.currentMessage?.projectName}</div>
      )}
      {status.queueLength > 0 && (
        <div>Queued: {status.queueLength} messages</div>
      )}
    </div>
  );
}
```

## Files

- `/src/services/voice-queue.ts` - Core queue implementation
- `/src/lib/voice-notifications.ts` - Integration layer with OpenAI TTS
- `/tests/unit/services/voice-queue.test.ts` - Comprehensive tests (42 tests, 90%+ coverage)
- `/docs/voice-queue-usage.md` - This file

## References

- Dashboard Design: `/docs/roadmap/dashboard-redesign.md` (lines 250-300)
- Echo Prevention: `/src/lib/openai-voice.ts` (line 145)
- Mute Settings: `/src/lib/tauri.ts` (Project interface, line 60)
