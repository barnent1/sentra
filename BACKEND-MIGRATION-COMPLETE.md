# Backend Migration to Next.js API Routes - COMPLETE

## Overview

Successfully migrated the entire backend from separate Express server to Next.js API routes (Vercel Functions).

## Architecture Change

### Before
- Separate Express backend running on port 3001
- Frontend calls `http://localhost:3001/api/*`
- Requires two processes: `npm run dev` + `npm run backend:dev`

### After
- Single Next.js application with API routes
- Frontend calls relative `/api/*` endpoints (same origin)
- Single process: `npm run dev`
- Ready for Vercel deployment

## Migration Summary

### 1. Authentication Middleware
- **File**: `src/middleware.ts`
- Added JWT authentication to Next.js middleware
- Validates tokens for all `/api/*` routes except public paths
- Attaches user info to request headers (`x-user-id`, `x-user-email`)

### 2. Auth Helper Utility
- **File**: `src/lib/auth-helpers.ts`
- `getAuthUser(request)`: Extract user from headers
- `requireAuthUser(request)`: Get user or throw error

### 3. API Routes Created

#### Auth Routes (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

#### Settings Routes
- `GET /api/settings` - Get user settings (decrypted)
- `PUT /api/settings` - Update settings (auto-encrypts)
- `POST /api/settings/validate` - Validate API keys

#### Dashboard Routes
- `GET /api/dashboard` - Dashboard summary with stats
- Uses **Edge runtime** for performance

#### Projects Routes
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project with relations
- `DELETE /api/projects/:id` - Delete project
- Uses **Edge runtime** for performance

#### Agents Routes
- `GET /api/agents` - List agents (with filters)
- `GET /api/agents/:agentId/logs` - Get agent logs (polling)
- Uses **Edge runtime** for performance

#### Costs Routes
- `GET /api/costs` - List costs (with filters)
- `POST /api/costs` - Create cost entry
- Uses **Edge runtime** for performance

#### Activity Routes
- `GET /api/activity` - List activities (with pagination)
- `POST /api/activity` - Create activity entry
- Uses **Edge runtime** for performance

#### GitHub PR Routes
- `GET /api/github/pr/:owner/:repo/:number` - Get PR details
- `GET /api/github/pr/:owner/:repo/:number/diff` - Get PR diff
- `POST /api/github/pr/:owner/:repo/:number/approve` - Approve PR
- `POST /api/github/pr/:owner/:repo/:number/request-changes` - Request changes
- `POST /api/github/pr/:owner/:repo/:number/merge` - Merge PR

### 4. SSE to Polling Conversion
- **Reason**: Vercel Functions have 30s timeout, SSE not ideal
- **Change**: Agent logs endpoint now returns current state
- **Frontend**: Should poll `/api/agents/:agentId/logs` every 2 seconds

### 5. Frontend Updates
- **File**: `src/services/api.ts`
- Changed `API_URL` from `http://localhost:3001` to empty string (same origin)
- All API calls now use relative `/api/*` paths
- Fixed token storage keys (`token` instead of `accessToken`)

### 6. Package.json Updates
- Removed `backend:dev`, `backend:build`, `backend:start` scripts
- Removed `test:backend` script
- Single `npm run dev` now starts everything

## What Was NOT Migrated

The following backend files can be safely removed (but kept for reference):
- `backend/` directory (entire Express server)
- `backend/src/server.ts`
- `backend/src/controllers/*`
- `backend/src/middleware/*`
- `backend/src/routes/*`
- `backend/src/types.ts`
- `backend/tsconfig.json`

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] User registration and login work
- [ ] Settings CRUD operations work
- [ ] Dashboard data loads correctly
- [ ] Project operations work
- [ ] GitHub PR review works
- [ ] Agent logs polling works
- [ ] All endpoints require authentication (except public routes)

## Environment Variables

No changes needed! Same environment variables work:

```bash
# Database
DATABASE_URL="postgresql://..."

# JWT (required)
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Encryption (required)
ENCRYPTION_SECRET="your-encryption-key"

# API Keys (optional, user-configurable)
# OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."
# GITHUB_TOKEN="ghp_..."
```

## Deployment

### Vercel (Recommended)
```bash
npm run deploy:vercel
```

**Automatic Features**:
- Edge runtime enabled on compatible routes
- Auto-scaling based on traffic
- Global CDN distribution
- Zero-config SSL

### Environment Variables in Vercel
Add these in Vercel Dashboard → Settings → Environment Variables:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_SECRET`
- `DATABASE_URL` (use Vercel Postgres or Neon)

## Performance Optimizations

### Edge Runtime
Routes using Edge runtime (faster, globally distributed):
- Dashboard
- Projects (list and detail)
- Agents
- Costs
- Activity

### Node.js Runtime
Routes requiring Node.js (bcrypt, complex encryption):
- Auth (register, login, refresh)
- Settings (encryption)

## Known Limitations

### 1. SSE Not Used
- **Before**: Real-time agent log streaming via SSE
- **After**: Polling every 2 seconds
- **Reason**: Vercel Functions timeout after 30s (not suitable for long-lived connections)

### 2. Edge Runtime Restrictions
- Can't use bcrypt in Edge runtime (uses Node.js crypto)
- Can't use fs/path modules in Edge runtime
- Settings encryption might need Node.js runtime

## Next Steps

1. **Test all endpoints** with Postman or frontend
2. **Update frontend** to poll agent logs instead of SSE
3. **Remove backend folder** after confirming everything works
4. **Deploy to Vercel** and test in production
5. **Update CI/CD** to remove backend build step

## Rollback Plan

If issues arise, rollback by:
1. `git revert <this-commit>`
2. Restore `backend/` directory
3. Update `src/services/api.ts` to use `http://localhost:3001`
4. Run `npm run backend:dev` and `npm run dev` separately

---

**Migration completed**: November 20, 2025
**Migrated by**: Glen Barnhardt with help from Claude Code
