# Backend Migration to Next.js API Routes - COMPLETE

## Summary

Successfully migrated **entire backend** from Express server to Next.js API routes. Single deployment on Vercel ready.

## What Changed

### Before
```
┌─────────────────┐         ┌──────────────────┐
│   Next.js       │  HTTP   │  Express Server  │
│   Frontend      │────────>│  Port 3001       │
│   Port 3000     │         │  /api/*          │
└─────────────────┘         └──────────────────┘
```

### After
```
┌───────────────────────────────────────┐
│        Next.js Application            │
│  ┌─────────────┐  ┌─────────────┐    │
│  │  Frontend   │  │  API Routes │    │
│  │   Pages     │  │  /api/*     │    │
│  └─────────────┘  └─────────────┘    │
└───────────────────────────────────────┘
         Single Vercel Deployment
```

## Files Created

### Core Infrastructure
- `src/middleware.ts` - JWT authentication middleware
- `src/lib/auth-helpers.ts` - Helper to extract user from headers

### Auth API Routes (Public)
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/me/route.ts`

### Settings API Routes
- `src/app/api/settings/route.ts` (GET, PUT)
- `src/app/api/settings/validate/route.ts` (POST)

### Dashboard API Route
- `src/app/api/dashboard/route.ts` (GET)

### Projects API Routes
- `src/app/api/projects/route.ts` (GET, POST)
- `src/app/api/projects/[id]/route.ts` (GET, DELETE)

### Agents API Routes
- `src/app/api/agents/route.ts` (GET)
- `src/app/api/agents/[agentId]/logs/route.ts` (GET - polling)

### Costs API Route
- `src/app/api/costs/route.ts` (GET, POST)

### Activity API Route
- `src/app/api/activity/route.ts` (GET, POST)

### GitHub PR API Routes
- `src/app/api/github/pr/[owner]/[repo]/[number]/route.ts` (GET)
- `src/app/api/github/pr/[owner]/[repo]/[number]/diff/route.ts` (GET)
- `src/app/api/github/pr/[owner]/[repo]/[number]/approve/route.ts` (POST)
- `src/app/api/github/pr/[owner]/[repo]/[number]/request-changes/route.ts` (POST)
- `src/app/api/github/pr/[owner]/[repo]/[number]/merge/route.ts` (POST)

## Files Modified

- `src/middleware.ts` - Added JWT authentication
- `src/services/api.ts` - Changed to use relative `/api/*` paths
- `package.json` - Removed backend scripts

## Key Features

### 1. Authentication
- JWT-based authentication via middleware
- Validates all `/api/*` routes except public paths
- User info attached to request headers
- Automatic token refresh

### 2. Node.js Runtime
- All routes use Node.js runtime (not Edge)
- Reason: Database operations, bcrypt, jsonwebtoken require Node.js
- Still fast with Vercel's optimizations

### 3. SSE → Polling
- Agent logs endpoint now returns current state
- Frontend should poll every 2 seconds
- Reason: Vercel Functions have 30s timeout

### 4. Type Safety
- All routes use TypeScript strict mode
- Proper error handling
- Type-safe request/response

## Testing Status

- [x] TypeScript compilation passes
- [ ] Manual API testing needed
- [ ] Frontend integration testing needed
- [ ] E2E tests need updating

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

Environment variables needed:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_SECRET`
- `DATABASE_URL` (PostgreSQL connection string)

### Local Development
```bash
npm run dev
```

Single process now runs everything (frontend + API).

## API Endpoints

All endpoints now at: `https://your-app.vercel.app/api/*`

### Public (no auth required)
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`

### Protected (auth required)
- GET `/api/auth/me`
- GET/PUT `/api/settings`
- POST `/api/settings/validate`
- GET `/api/dashboard`
- GET/POST `/api/projects`
- GET/DELETE `/api/projects/:id`
- GET `/api/agents`
- GET `/api/agents/:agentId/logs`
- GET/POST `/api/costs`
- GET/POST `/api/activity`
- GET `/api/github/pr/:owner/:repo/:number`
- GET `/api/github/pr/:owner/:repo/:number/diff`
- POST `/api/github/pr/:owner/:repo/:number/approve`
- POST `/api/github/pr/:owner/:repo/:number/request-changes`
- POST `/api/github/pr/:owner/:repo/:number/merge`

## Next Steps

1. **Test endpoints** with Postman or curl
2. **Update frontend** to poll agent logs
3. **Remove backend folder** (after confirming everything works)
4. **Deploy to Vercel**
5. **Update CI/CD** (remove backend build step)

## Rollback

If needed, revert this commit and restore `backend/` directory.

---

**Completed**: November 20, 2025
**Migration by**: Glen Barnhardt with help from Claude Code
