# OpenAI API Key Integration Flow

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ├─────────────┐
                                 │             │
                                 ▼             ▼
                    ┌──────────────────┐  ┌─────────────────┐
                    │  Settings UI     │  │  App Startup    │
                    │  (Save API Key)  │  │  (Load Keys)    │
                    └──────────────────┘  └─────────────────┘
                                 │             │
                                 ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  PUT /api/settings          │  GET /api/settings                │
│  - Encrypts API key         │  - Decrypts API key               │
│  - Stores in database       │  - Returns to client              │
│  (AES-256-GCM)             │                                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND CACHING                            │
├─────────────────────────────────────────────────────────────────┤
│  React Query (useSettings hook)                                 │
│  - Caches settings for 5 minutes                                │
│  - Auto-refresh on mount/reconnect                              │
│  - Provides: settings, isLoading, error, refetch()              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌────────────────────┐    ┌──────────────────────┐
        │ VoiceInitializer   │    │  Components          │
        │ (Global Setup)     │    │  (On-Demand Usage)   │
        └────────────────────┘    └──────────────────────┘
                    │                         │
                    ▼                         ▼
        ┌────────────────────┐    ┌──────────────────────┐
        │ Voice Notifications│    │ Realtime Voice Chat  │
        │ (TTS Queue)        │    │ (WebRTC)             │
        └────────────────────┘    └──────────────────────┘
                    │                         │
                    ▼                         ▼
        ┌────────────────────┐    ┌──────────────────────┐
        │ OpenAI TTS API     │    │ OpenAI Realtime API  │
        │ /v1/audio/speech   │    │ /v1/realtime         │
        └────────────────────┘    └──────────────────────┘
```

## Component Interactions

### 1. App Initialization

```
RootLayout (src/app/layout.tsx)
  └── QueryProvider
      └── AuthProvider
          ├── VoiceInitializer  ← NEW COMPONENT
          │   └── useSettings() → Fetches OpenAI key
          │       └── initVoiceNotifications(key, voice)
          │           └── Global TTS queue ready
          │
          └── Page components
              └── ArchitectChat, Dashboard, etc.
```

### 2. Settings Hook Flow

```typescript
// Any component can use this hook
const { settings, isLoading, error, refetch } = useSettings();

// Flow:
useSettings()
  → React Query checks cache (5min TTL)
  → Cache miss? Fetch from API
      → GET /api/settings
          → Backend decrypts from DB
          → Returns { openaiApiKey, anthropicApiKey, ... }
  → Cache hit? Return cached data
  → Store in React Query cache
  → Return to component
```

### 3. Voice Notification Flow

```
Component wants to notify user:
  ↓
queueVoiceNotification({ text, projectName, priority })
  ↓
Voice Queue (initialized by VoiceInitializer)
  ↓
Check if project is muted
  ↓
Add to priority queue
  ↓
Process queue (FIFO with priority)
  ↓
speakText(text) → Uses OpenAI key from initVoiceNotifications()
  ↓
POST https://api.openai.com/v1/audio/speech
  Headers: { Authorization: `Bearer ${openaiApiKey}` }
  Body: { model: 'tts-1', voice: settings.voice, input: text }
  ↓
Receive audio data
  ↓
Play through HTMLAudioElement
```

### 4. Realtime Voice Chat Flow

```
User clicks "Speak to Architect"
  ↓
ArchitectChat component opens
  ↓
Uses useSettings() to get API key (or getSettings() - can be optimized)
  ↓
Creates RealtimeConversation instance
  ↓
RealtimeConversation.connect()
  ├── Reads API key from localStorage (fallback)
  ├── POST /api/realtime-token { apiKey }
  │   └── Backend generates ephemeral token (60s TTL)
  ├── Receives { client_secret, expires_at }
  └── Establishes WebRTC connection with token
  ↓
Conversation active with browser echo cancellation
  ↓
User speaks → Server VAD detects → AI responds → Audio plays
```

## Storage Locations

### Database (Encrypted)

```
settings table:
  - userId: string
  - openaiApiKey: string (encrypted with AES-256-GCM)
  - anthropicApiKey: string (encrypted)
  - voice: string
  - notificationSettings: json
```

### React Query Cache (In-Memory)

```typescript
{
  queryKey: ['settings'],
  data: {
    openaiApiKey: 'sk-...',  // Decrypted
    anthropicApiKey: 'sk-ant-...',  // Decrypted
    voice: 'alloy',
    userName: 'Glen',
    // ... other settings
  },
  staleTime: 5 * 60 * 1000,  // 5 minutes
}
```

### localStorage (Fallback for RealtimeConversation)

```typescript
{
  sentra_settings: {
    openaiApiKey: 'sk-...',
    // ... other settings
  }
}
```

## Security Measures

1. **At Rest:** Encrypted in database (AES-256-GCM)
2. **In Transit:** HTTPS only
3. **In Memory:** React Query cache (cleared on page refresh)
4. **API Calls:** Bearer token authentication
5. **Ephemeral Tokens:** WebRTC tokens expire in 60 seconds
6. **No Logging:** Keys never logged to console

## Error Handling

```
Missing API Key Flow:
  ↓
useSettings() returns { openaiApiKey: '' }
  ↓
VoiceInitializer checks if key exists
  ├── No key? Log warning and skip initialization
  └── Key exists? Initialize voice notifications
  ↓
Component checks settings.openaiApiKey
  ├── No key? Show SettingsWarning component
  └── Key exists? Proceed with feature
  ↓
User clicks "Configure in Settings"
  ↓
Settings modal opens
  ↓
User enters key and saves
  ↓
Settings updated in DB
  ↓
React Query cache invalidated
  ↓
useSettings() refetches
  ↓
VoiceInitializer sees new key
  ↓
Voice notifications initialized
  ↓
Features now available
```

## File Reference

### Core Integration Files

1. **`src/hooks/useSettings.ts`** - React Query hook for settings
2. **`src/components/VoiceInitializer.tsx`** - Global voice setup
3. **`src/components/SettingsWarning.tsx`** - Missing key warning UI
4. **`src/app/layout.tsx`** - App root with VoiceInitializer

### Supporting Files

5. **`src/lib/settings.ts`** - Settings helper functions
6. **`src/lib/voice-notifications.ts`** - Voice notification queue
7. **`src/lib/openai-realtime.ts`** - WebRTC voice chat
8. **`backend/src/controllers/settings.ts`** - Settings API endpoints

### API Routes

9. **`backend/src/routes/settings.ts`** - Settings CRUD routes
10. **`src/app/api/realtime-token/route.ts`** - Ephemeral token generation

## Usage Examples

### Example 1: Using Settings in a Component

```typescript
import { useSettings } from '@/hooks/useSettings';

function MyComponent() {
  const { settings, isLoading } = useSettings();

  if (isLoading) return <div>Loading...</div>;

  if (!settings.openaiApiKey) {
    return <SettingsWarning requiredKeys={['openai']} />;
  }

  // Use settings.openaiApiKey for API calls
  return <div>OpenAI features available!</div>;
}
```

### Example 2: Queueing a Voice Notification

```typescript
import { queueVoiceNotification } from '@/lib/voice-notifications';

// Anywhere in the app after VoiceInitializer runs:
await queueVoiceNotification({
  text: 'Build completed successfully',
  projectName: 'sentra',
  priority: 'info'
});
```

### Example 3: Starting a Voice Conversation

```typescript
import { useSettings } from '@/hooks/useSettings';
import { RealtimeConversation } from '@/lib/openai-realtime';

function VoiceChat() {
  const { settings } = useSettings();

  const startChat = async () => {
    const conversation = new RealtimeConversation({
      projectName: 'my-project',
      voice: settings.voice,
      // ... callbacks
    });

    await conversation.connect();
    // Voice chat active!
  };

  return <button onClick={startChat}>Start Voice Chat</button>;
}
```

## Summary

The OpenAI API key from database settings is now fully integrated and flows through:

1. **Backend:** Encrypted storage and secure API endpoints
2. **Frontend Cache:** React Query for efficient data access
3. **Global Setup:** VoiceInitializer for app-wide voice notifications
4. **Components:** useSettings hook for on-demand access
5. **OpenAI APIs:** TTS and Realtime voice with proper authentication

All integrations are secure, TypeScript-compliant, and follow React best practices.
