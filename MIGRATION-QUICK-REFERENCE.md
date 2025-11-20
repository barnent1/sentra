# Backend Migration - Quick Reference

## What Developers Need to Know

### Single Command Development
**Before**: Two terminals, two commands
```bash
npm run dev          # Terminal 1: Frontend
npm run backend:dev  # Terminal 2: Backend
```

**After**: One terminal, one command
```bash
npm run dev  # Runs everything
```

### API Endpoint Changes
**Before**: External backend
```typescript
fetch('http://localhost:3001/api/projects')
```

**After**: Same-origin API routes
```typescript
fetch('/api/projects')  // Automatic via fetchWithAuth()
```

### Authentication Pattern
**Backend extracted user from JWT in middleware**:
```typescript
// Express middleware set req.user
if (!req.user) { ... }
```

**Now extracted from headers in API route**:
```typescript
import { requireAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const user = requireAuthUser(request)  // Throws if not authenticated
  // user.userId, user.email available
}
```

### Dynamic Route Params (IMPORTANT)
**Next.js 15 changed params to async**:

```typescript
// OLD (won't work)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params  // ❌ Error
}

// NEW (correct)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params  // ✅ Await params
  const { id } = params
}
```

### SSE → Polling
**Before**: Server-Sent Events for real-time logs
```typescript
const eventSource = new EventSource('/api/agents/:id/logs/stream')
```

**After**: Polling endpoint
```typescript
// Poll every 2 seconds
const interval = setInterval(async () => {
  const response = await fetch('/api/agents/:id/logs')
  const { logs, status } = await response.json()
}, 2000)
```

### Runtime Selection
All routes use **Node.js runtime** (not Edge):
```typescript
export const runtime = 'nodejs'
```

**Reason**: Database operations, bcrypt, jsonwebtoken require Node.js APIs.

### Middleware Flow
```
Request → Middleware (JWT check) → API Route Handler
                ↓
         Set x-user-id, x-user-email headers
```

### Public Routes
These skip authentication:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh`
- `/api/realtime-token`

All other `/api/*` routes require valid JWT.

### Error Handling Pattern
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    // Your logic here

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[Controller] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Testing API Routes
Use Next.js built-in testing or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# Get dashboard (with token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Deployment Checklist
- [x] Set environment variables in Vercel
  - JWT_SECRET
  - JWT_REFRESH_SECRET
  - ENCRYPTION_SECRET
  - DATABASE_URL
- [ ] Update frontend API base URL (already done)
- [ ] Test all endpoints in production
- [ ] Remove backend folder

### Common Gotchas

1. **Params are async** - Always `await context.params`
2. **Middleware runs on all `/api/*`** - Add public paths to `PUBLIC_PATHS` array
3. **JWT in Edge runtime fails** - Use Node.js runtime for auth
4. **Database errors at build time** - Expected, Vercel handles at runtime

---

**For detailed migration info, see**: `BACKEND-MIGRATION-COMPLETE.md`
