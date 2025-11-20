# Real-Time Agent Log Streaming

This document explains how to use the real-time agent log streaming feature in Sentra.

## Overview

Sentra implements Server-Sent Events (SSE) for streaming agent execution logs in real-time from the backend to the frontend. This allows users to see agent output as it happens, without polling or manual refreshing.

## Architecture

### Backend (Express + SSE)

**Endpoint:** `GET /api/agents/:agentId/logs/stream`

**Authentication:** JWT token via query parameter (EventSource limitation) or Authorization header

**Response Type:** `text/event-stream`

**Features:**
- Streams logs as they are written to database
- Auto-closes when agent completes or fails
- 1-second polling interval for updates
- Handles client disconnection gracefully

### Frontend (React + EventSource API)

**Hook:** `useAgentLogs(agentId, options)`

**Features:**
- Auto-connects to SSE stream on mount
- Receives real-time log updates
- Tracks connection status
- Auto-reconnects on error
- Proper cleanup on unmount

## Usage

### Basic Example

```tsx
import { useAgentLogs } from '@/hooks/useAgentLogs'

function AgentMonitor({ agentId }: { agentId: string }) {
  const { logs, status, isConnected } = useAgentLogs(agentId)

  return (
    <div>
      <div>Status: {status}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <pre>{logs}</pre>
    </div>
  )
}
```

### Using the AgentLogsViewer Component

```tsx
import { AgentLogsViewer } from '@/components/AgentLogsViewer'

function AgentPage({ agentId }: { agentId: string }) {
  return (
    <div>
      <h1>Agent Execution</h1>
      <AgentLogsViewer agentId={agentId} />
    </div>
  )
}
```

### Advanced Usage with Callbacks

```tsx
const { logs, status, isConnected, error, connect, disconnect } = useAgentLogs(
  agentId,
  {
    autoConnect: true,
    onConnect: () => console.log('Connected to log stream'),
    onClose: () => console.log('Log stream closed'),
    onError: (err) => console.error('Stream error:', err),
    onUpdate: (data) => console.log('New logs:', data.logs),
  }
)
```

## API Reference

### `useAgentLogs(agentId, options)`

**Parameters:**
- `agentId: string` - The agent ID to stream logs from
- `options?: UseAgentLogsOptions` - Optional configuration

**Options:**
- `autoConnect?: boolean` - Auto-connect on mount (default: true)
- `onConnect?: () => void` - Called when connection established
- `onClose?: () => void` - Called when connection closed
- `onError?: (error: Error) => void` - Called on error
- `onUpdate?: (data: AgentLogStreamData) => void` - Called on new logs

**Returns:**
- `logs: string` - Current logs content
- `status: 'running' | 'completed' | 'failed' | null` - Agent status
- `isConnected: boolean` - Whether SSE connection is active
- `isConnecting: boolean` - Whether initial connection is being established
- `error: Error | null` - Last error encountered
- `connect: () => void` - Manually connect to stream
- `disconnect: () => void` - Manually disconnect from stream

### Backend: `GET /api/agents/:agentId/logs/stream`

**Authentication:**
- Query parameter: `?token=<jwt-token>`
- OR Authorization header: `Bearer <jwt-token>`

**Response Format:**
```
data: {"logs": "log content here\nmore logs\n", "status": "running"}

data: {"logs": "updated logs\n", "status": "running"}

data: {"logs": "final logs\n", "status": "completed", "final": true}
```

**Status Codes:**
- `200` - Success (SSE stream)
- `401` - Not authenticated
- `403` - Access denied (not user's agent)
- `404` - Agent not found

## Implementation Details

### Log Storage

Logs are stored in the `agents` table in the `logs` column as plain text:

```typescript
// Append logs to an agent
await drizzleDb.appendAgentLogs(agentId, 'New log line\nAnother line')
```

### Backwards Compatibility

The system supports both formats:
- **New format:** Plain text (string)
- **Old format:** JSON array (for backwards compatibility)

The deserialization automatically handles both formats.

### Authentication for SSE

Since `EventSource` doesn't support custom headers, authentication is handled via query parameter:

```typescript
const token = localStorage.getItem('token')
const url = `${API_URL}/api/agents/${agentId}/logs/stream?token=${token}`
const eventSource = new EventSource(url)
```

The backend `authenticateSSE` middleware accepts tokens from both query params and headers.

### Auto-Disconnect

The stream automatically closes when:
1. Agent status changes to 'completed' or 'failed'
2. Client disconnects
3. Error occurs

## Testing

### Manual Testing

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `npm run dev`
3. Create an agent (or use existing agent ID)
4. Open browser and navigate to a page using `AgentLogsViewer`
5. Watch logs stream in real-time

### Integration Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentLogs } from '@/hooks/useAgentLogs'

test('streams agent logs in real-time', async () => {
  const { result } = renderHook(() => useAgentLogs('agent-123'))

  // Should connect
  await waitFor(() => expect(result.current.isConnected).toBe(true))

  // Should receive logs
  await waitFor(() => expect(result.current.logs).toBeTruthy())

  // Should show agent status
  expect(result.current.status).toBeOneOf(['running', 'completed', 'failed'])
})
```

## Troubleshooting

### "Not authenticated" error

Make sure JWT token is stored in localStorage:
```typescript
localStorage.setItem('token', 'your-jwt-token')
```

### Connection fails immediately

Check:
1. Backend is running on correct port
2. `NEXT_PUBLIC_API_URL` is set correctly
3. Agent exists and belongs to the user
4. CORS is configured properly

### Logs not updating

Check:
1. Agent status is 'running' (stream closes on completion)
2. Backend is actually writing logs to database
3. Browser network tab shows SSE connection active
4. No JavaScript errors in console

## Performance Considerations

- **Polling Interval:** Currently 1 second. Adjust based on needs.
- **Connection Limit:** EventSource has per-domain connection limits (typically 6)
- **Memory:** Logs are kept in memory on client. Consider limiting log size for long-running agents.

## Future Improvements

1. **WebSocket upgrade:** For bidirectional communication
2. **Log pagination:** Stream only recent logs, fetch older logs on demand
3. **Compression:** Compress logs before streaming
4. **Filtering:** Server-side log filtering by level/keyword
5. **Multiple agents:** Stream logs from multiple agents simultaneously

---

**Related Files:**
- Backend: `backend/src/controllers/logs.ts`
- Middleware: `backend/src/middleware/auth.ts`
- Hook: `src/hooks/useAgentLogs.ts`
- Component: `src/components/AgentLogsViewer.tsx`
- Database: `src/services/database-drizzle.ts`
