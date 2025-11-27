# Bookmark Manager - Security Model

## Overview
This document defines the security architecture for the Bookmark Manager application, following industry best practices and the Quetrex security standards.

---

## Authentication

### Password Security

**Hashing Algorithm: bcrypt**
- Salt rounds: 10
- Automatically generates unique salt per password
- Resistant to rainbow table attacks
- Computationally expensive for brute force

**Implementation:**
```typescript
import bcrypt from 'bcryptjs'

// Registration
const hashedPassword = await bcrypt.hash(password, 10)
await prisma.user.create({
  data: { email, password: hashedPassword }
})

// Login
const user = await prisma.user.findUnique({ where: { email } })
const valid = await bcrypt.compare(password, user.password)
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- No maximum length (store hashed version only)

**Password Validation (Zod Schema):**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain one uppercase letter')
  .regex(/[a-z]/, 'Password must contain one lowercase letter')
  .regex(/[0-9]/, 'Password must contain one number')
```

### JWT Authentication

**Token Generation:**
```typescript
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
)
```

**Token Structure:**
- Payload: `{ userId, email, iat, exp }`
- Expiration: 7 days
- Algorithm: HS256
- Secret: Environment variable (min 32 characters)

**Token Storage (Client):**
- Store in HTTP-only cookie (preferred for web)
- OR localStorage (for mobile/SPA)
- Include in Authorization header: `Bearer <token>`

**Token Verification (Middleware):**
```typescript
export async function authMiddleware(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new Error('No token provided')
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return payload.userId
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}
```

### Session Management

**Token Lifecycle:**
1. User logs in → Server issues JWT
2. Client stores JWT (cookie or localStorage)
3. Client includes JWT in all API requests
4. Server verifies JWT on each request
5. Token expires after 7 days → User must re-login

**Logout:**
- Client removes JWT from storage
- No server-side session tracking (stateless)

**Token Refresh (Optional v2 Feature):**
- Issue refresh token (30 days)
- Store in HTTP-only cookie
- Exchange for new access token

---

## Authorization

### User Isolation

**Principle: Users can ONLY access their own bookmarks**

**Database Query Pattern:**
```typescript
// ✅ CORRECT: Always filter by userId
const bookmarks = await prisma.bookmark.findMany({
  where: { userId: currentUserId }
})

// ❌ WRONG: Missing userId filter
const bookmarks = await prisma.bookmark.findMany()
```

**Row-Level Security:**
- All bookmark queries MUST include `userId` filter
- Enforced at service layer (never trust client)
- Validated in unit tests (90% coverage)

**API Route Protection:**
```typescript
// src/app/api/bookmarks/route.ts
export async function GET(req: Request) {
  const userId = await authMiddleware(req) // Throws if not authenticated

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId } // REQUIRED filter
  })

  return Response.json({ bookmarks })
}
```

**Ownership Verification (Edit/Delete):**
```typescript
// Before updating/deleting, verify ownership
const bookmark = await prisma.bookmark.findUnique({
  where: { id: bookmarkId }
})

if (!bookmark || bookmark.userId !== currentUserId) {
  throw new Error('Bookmark not found or access denied')
}
```

### Permission Model

**User Permissions:**
- Create: Own bookmarks only
- Read: Own bookmarks only
- Update: Own bookmarks only
- Delete: Own bookmarks only

**No Admin Role (v1):**
- All users equal permissions
- No cross-user access
- No user management UI

---

## Input Validation

### Validation Strategy

**Library: Zod**
- Runtime type checking
- Comprehensive error messages
- Composable schemas

### User Input Schemas

**Registration Schema:**
```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string().max(100).optional()
})
```

**Login Schema:**
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required')
})
```

**Bookmark Schema:**
```typescript
const bookmarkSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .refine(url => url.startsWith('http'), 'Only HTTP/HTTPS URLs allowed'),

  title: z.string()
    .min(1, 'Title required')
    .max(500, 'Title too long'),

  description: z.string()
    .max(2000, 'Description too long')
    .optional(),

  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag too long')
      .regex(/^[a-z0-9-]+$/, 'Tags must be lowercase alphanumeric with hyphens')
  ).max(20, 'Maximum 20 tags allowed')
})
```

**Update Schema (Partial):**
```typescript
const updateBookmarkSchema = bookmarkSchema.partial()
```

### Validation Enforcement

**API Route Pattern:**
```typescript
export async function POST(req: Request) {
  const userId = await authMiddleware(req)

  // Parse and validate input
  const body = await req.json()
  const validated = bookmarkSchema.parse(body) // Throws if invalid

  // Create bookmark with validated data
  const bookmark = await prisma.bookmark.create({
    data: { ...validated, userId }
  })

  return Response.json({ bookmark }, { status: 201 })
}
```

**Error Handling:**
```typescript
try {
  const validated = schema.parse(input)
} catch (error) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: error.errors[0].message, code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }
}
```

---

## XSS Prevention

### URL Sanitization

**Prevent JavaScript URLs:**
```typescript
const url = z.string().refine(
  url => !url.toLowerCase().startsWith('javascript:'),
  'JavaScript URLs not allowed'
)
```

**Sanitize User Input:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

// Sanitize description before storing
const sanitized = DOMPurify.sanitize(description)
```

### Output Encoding

**React Auto-Escapes:**
- React automatically escapes JSX content
- Use `dangerouslySetInnerHTML` ONLY with sanitized HTML

```typescript
// ✅ Safe: React escapes automatically
<p>{bookmark.description}</p>

// ❌ Dangerous: Only use with DOMPurify
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

---

## CSRF Protection

### Same-Origin Policy
- API and frontend on same domain
- Credentials included in requests

### CSRF Token (Optional for Cookies)
```typescript
// If using cookies, add CSRF middleware
import csrf from 'edge-csrf'

const csrfProtect = csrf({
  cookie: { httpOnly: true, sameSite: 'strict' }
})
```

---

## Rate Limiting

### API Rate Limits

**Per-User Limits:**
- Login attempts: 5 per 15 minutes
- Registration: 3 per hour
- Bookmark creation: 100 per hour
- Search queries: 200 per minute

**Implementation (Upstash Redis):**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests', code: 'RATE_LIMIT' },
      { status: 429 }
    )
  }

  // Continue with login...
}
```

---

## SQL Injection Prevention

### Prisma ORM Protection

**Prisma Automatically Parameterizes Queries:**
```typescript
// ✅ Safe: Prisma uses parameterized queries
const bookmarks = await prisma.bookmark.findMany({
  where: {
    title: { contains: userInput } // Automatically escaped
  }
})

// ❌ Dangerous: Raw SQL (only use with validation)
await prisma.$queryRaw`SELECT * FROM bookmarks WHERE title LIKE '%${userInput}%'`
```

**Use Prisma Raw Queries Safely:**
```typescript
import { Prisma } from '@prisma/client'

// ✅ Safe: Parameterized raw query
await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM bookmarks WHERE title LIKE ${'%' + userInput + '%'}`
)
```

---

## Environment Variables

### Required Secrets

```bash
# .env (NEVER commit to git)

# Database
DATABASE_URL="postgresql://user:password@host:5432/bookmarks"

# Authentication
JWT_SECRET="at-least-32-random-characters-here" # Generate with: openssl rand -base64 32

# Rate Limiting (Optional)
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."
```

### Secret Management

**Development:**
- Store in `.env` file (gitignored)
- Each developer has own secrets
- Use `.env.example` as template

**Production:**
- Store in Vercel environment variables
- Never log secrets
- Rotate JWT_SECRET periodically

---

## HTTPS Enforcement

### Production Requirements

**Vercel Automatic HTTPS:**
- All production deployments use HTTPS
- HTTP redirects to HTTPS
- HSTS headers enabled

**Cookie Security:**
```typescript
// Production cookie settings
{
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 // 7 days
}
```

---

## Data Privacy

### Password Storage
- NEVER store plaintext passwords
- NEVER log passwords
- NEVER return password field in API responses

**Prisma Exclusion:**
```typescript
// ✅ Exclude password from all queries
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    name: true,
    createdAt: true
    // password intentionally excluded
  }
})
```

### User Data Deletion

**Account Deletion (v2 Feature):**
- Delete user → Cascade deletes all bookmarks (Prisma constraint)
- No orphaned data
- Permanent deletion (no soft delete)

---

## Security Testing

### Test Coverage Requirements

**Authentication Tests:**
- Register with valid data → Success
- Register with duplicate email → Error
- Login with valid credentials → Returns token
- Login with invalid credentials → Error
- Access protected route without token → 401
- Access protected route with expired token → 401

**Authorization Tests:**
- User A cannot access User B's bookmarks
- User A cannot edit User B's bookmarks
- User A cannot delete User B's bookmarks

**Input Validation Tests:**
- Invalid email → Error
- Weak password → Error
- JavaScript URL → Error
- XSS in description → Sanitized
- Too long inputs → Error
- Invalid tag format → Error

### Security Audit Checklist

**Before Production:**
- [ ] All passwords hashed with bcrypt
- [ ] JWT_SECRET is 32+ random characters
- [ ] All API routes check authentication
- [ ] All bookmark queries filter by userId
- [ ] Input validation on all endpoints
- [ ] XSS prevention tested
- [ ] SQL injection prevention verified
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Secrets not in git history
- [ ] Error messages don't leak sensitive info

---

## Incident Response

### Security Breach Response

**If JWT_SECRET Compromised:**
1. Rotate JWT_SECRET immediately
2. All users logged out
3. Force password reset for all users
4. Audit logs for suspicious activity

**If User Password Compromised:**
1. Reset user password
2. Invalidate all user sessions
3. Email security notification
4. Enable MFA (v2 feature)

### Logging

**Security Events to Log:**
- Failed login attempts (IP, timestamp)
- Account creation (IP, timestamp)
- Password changes
- Unusual API activity (high rate, suspicious patterns)

**DO NOT Log:**
- Passwords (plaintext or hashed)
- JWT tokens
- Full user data

---

## Future Security Enhancements (v2+)

### Multi-Factor Authentication (MFA)
- TOTP (Google Authenticator, Authy)
- Email verification codes
- Backup codes

### Password Reset Flow
- Email verification link
- Temporary reset token (15 min expiration)
- Rate limit reset requests

### Session Management
- Track active sessions
- Remote logout
- Session expiration notifications

### Advanced Rate Limiting
- Per-user quotas
- Suspicious activity detection
- IP-based blocking

### Security Headers
```typescript
// Next.js middleware
export function middleware(req: Request) {
  const headers = new Headers(req.headers)
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return NextResponse.next({ headers })
}
```

### Content Security Policy (CSP)
```typescript
// Restrict script sources
headers.set('Content-Security-Policy',
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
)
```

---

## Compliance

### GDPR Considerations (Europe)
- User data export endpoint
- User data deletion endpoint
- Privacy policy
- Cookie consent banner

### Data Retention
- User data: Retained until account deletion
- Logs: 90 days retention
- Backups: 30 days retention

---

*Security is not a feature, it's a requirement. All security measures are mandatory, not optional.*
