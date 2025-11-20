---
name: security-sentinel
description: Use when working with authentication, API routes, user input, or sensitive data. Audits code for security vulnerabilities based on OWASP Top 10. Critical for payment processing, auth systems, and data handling.
allowed-tools: Read, Grep, Bash
---

# Security Sentinel (OWASP Auditor)

## When to Use
- API routes (especially POST/PATCH/PUT)
- Authentication/authorization code
- User input handling
- Database queries
- File operations
- Environment variable usage
- Payment processing
- Session management
- Data encryption

## OWASP Top 10 Security Checks

### 1. Injection Attacks

#### SQL Injection
```typescript
// ❌ DON'T: String concatenation in queries
const query = `SELECT * FROM users WHERE email = '${email}'`
// Vulnerable to: email = "' OR '1'='1"

// ✅ DO: Use Prisma (parameterized queries)
const user = await prisma.user.findUnique({
  where: { email },
})
```

#### Command Injection
```typescript
// ❌ DON'T: Unvalidated shell commands
const fileName = req.body.fileName
exec(`cat ${fileName}`) // Vulnerable to: fileName = "; rm -rf /"

// ✅ DO: Validate input and use safe APIs
const allowedFiles = ['log.txt', 'data.csv']
if (!allowedFiles.includes(fileName)) {
  throw new Error('Invalid file name')
}
const content = await fs.readFile(path.join(SAFE_DIR, fileName))
```

#### NoSQL Injection
```typescript
// ❌ DON'T: Direct object insertion
const user = await db.users.findOne({ email: req.body.email })
// Vulnerable to: { email: { $ne: null } }

// ✅ DO: Validate input with Zod
const emailSchema = z.string().email()
const email = emailSchema.parse(req.body.email)
const user = await db.users.findOne({ email })
```

### 2. Broken Authentication

#### Password Storage
```typescript
// ❌ DON'T: Plain text passwords
const user = await prisma.user.create({
  data: {
    email,
    password, // Never store plain text!
  },
})

// ✅ DO: Hash with bcrypt
import bcrypt from 'bcrypt'

const hashedPassword = await bcrypt.hash(password, 12) // 12 rounds minimum
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
  },
})
```

#### Session Management
```typescript
// ❌ DON'T: Weak session tokens
const sessionId = Math.random().toString()

// ✅ DO: Cryptographically secure tokens
import crypto from 'crypto'
const sessionId = crypto.randomBytes(32).toString('hex')

// ✅ DO: Set secure session cookie
res.setHeader('Set-Cookie', [
  `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
])
```

#### JWT Security
```typescript
// ❌ DON'T: Weak secret
const token = jwt.sign(payload, 'secret123')

// ✅ DO: Strong secret from environment
const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  expiresIn: '1h',
  algorithm: 'HS256',
})

// ✅ DO: Verify JWT properly
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
  // Use decoded data
} catch (error) {
  throw new Error('Invalid token')
}
```

### 3. Sensitive Data Exposure

#### Environment Variables
```typescript
// ❌ DON'T: Hardcoded secrets
const apiKey = 'sk_live_abc123def456'
const dbPassword = 'mypassword123'

// ✅ DO: Environment variables
const apiKey = process.env.STRIPE_API_KEY
const dbPassword = process.env.DATABASE_PASSWORD

if (!apiKey || !dbPassword) {
  throw new Error('Missing required environment variables')
}
```

#### Data in Logs
```typescript
// ❌ DON'T: Log sensitive data
console.log('User data:', { email, password, creditCard })

// ✅ DO: Redact sensitive fields
const safeUserData = {
  email,
  creditCard: creditCard.slice(-4).padStart(creditCard.length, '*'),
}
console.log('User data:', safeUserData)
```

#### Never Return Sensitive Data
```typescript
// ❌ DON'T: Return password in API
const user = await prisma.user.findUnique({ where: { id } })
return user // Includes password hash!

// ✅ DO: Exclude sensitive fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // password field excluded
  },
})
return user
```

### 4. XML External Entities (XXE)
```typescript
// ❌ DON'T: Parse untrusted XML
const doc = xmlParser.parse(userInput)

// ✅ DO: Disable external entities
const parser = new xml2js.Parser({
  explicitChildren: false,
  explicitRoot: false,
  ignoreAttrs: true,
  xmlns: false,
})
```

### 5. Broken Access Control

#### Authorization Checks
```typescript
// ❌ DON'T: Missing authorization
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.project.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}

// ✅ DO: Verify ownership
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
  })

  if (!project) {
    return new Response('Not found', { status: 404 })
  }

  if (project.userId !== user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  await prisma.project.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}
```

#### IDOR (Insecure Direct Object Reference)
```typescript
// ❌ DON'T: Trust user input for IDs
const userId = req.query.userId
const data = await getPrivateData(userId) // Any user can access any data!

// ✅ DO: Use authenticated user's ID
const userId = req.user.id // From authenticated session
const data = await getPrivateData(userId)
```

### 6. Security Misconfiguration

#### CORS
```typescript
// ❌ DON'T: Allow all origins
res.setHeader('Access-Control-Allow-Origin', '*')

// ✅ DO: Whitelist specific origins
const allowedOrigins = [
  'https://app.sentra.com',
  'https://staging.sentra.com',
]

const origin = req.headers.get('origin')
if (origin && allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin)
}
```

#### Error Messages
```typescript
// ❌ DON'T: Expose internal details
catch (error) {
  res.status(500).json({
    error: error.message, // Could leak stack trace, DB structure, etc.
  })
}

// ✅ DO: Generic error messages
catch (error) {
  console.error('Internal error:', error) // Log internally
  res.status(500).json({
    error: 'An internal error occurred',
  })
}
```

### 7. Cross-Site Scripting (XSS)

#### dangerouslySetInnerHTML
```typescript
// ❌ DON'T: Unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// Vulnerable to: userInput = "<script>alert('XSS')</script>"

// ✅ DO: Sanitize with DOMPurify
import DOMPurify from 'dompurify'

const sanitized = DOMPurify.sanitize(userInput)
<div dangerouslySetInnerHTML={{ __html: sanitized }} />

// ✅ BETTER: Avoid dangerouslySetInnerHTML entirely
<div>{userInput}</div> // React escapes by default
```

#### URL Handling
```typescript
// ❌ DON'T: Unsanitized URLs
<a href={userInput}>Click here</a>
// Vulnerable to: userInput = "javascript:alert('XSS')"

// ✅ DO: Validate URLs
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const href = isSafeUrl(userInput) ? userInput : '#'
<a href={href}>Click here</a>
```

### 8. Insecure Deserialization
```typescript
// ❌ DON'T: eval() or Function()
const code = req.body.code
eval(code) // NEVER DO THIS

// ❌ DON'T: Unvalidated JSON
const data = JSON.parse(userInput)
// Use data directly without validation

// ✅ DO: Validate with Zod
const data = JSON.parse(userInput)
const validated = dataSchema.parse(data) // Validates structure and types
```

### 9. Using Components with Known Vulnerabilities
```bash
# ✅ DO: Regular dependency audits
npm audit --audit-level=high

# ✅ DO: Keep dependencies updated
npm update

# ✅ DO: Use automated tools
npm install -g snyk
snyk test
```

### 10. Insufficient Logging & Monitoring
```typescript
// ❌ DON'T: No logging
export async function POST(request: Request) {
  const user = await createUser(data)
  return Response.json(user)
}

// ✅ DO: Log security events
export async function POST(request: Request) {
  try {
    const user = await createUser(data)
    logger.info('User created', {
      userId: user.id,
      email: user.email,
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
    })
    return Response.json(user)
  } catch (error) {
    logger.error('User creation failed', {
      error: error.message,
      email: data.email,
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}
```

## Input Validation Checklist

```typescript
// ✅ Complete input validation example
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string().min(1).max(100).optional(),
})

export async function POST(request: Request) {
  // 1. Parse and validate input
  const body = await request.json()
  const validated = createUserSchema.parse(body) // Throws on validation error

  // 2. Additional business logic validation
  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  })
  if (existing) {
    throw new Error('Email already exists')
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12)

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      // password excluded
    },
  })

  // 5. Log security event
  logger.info('User registered', { userId: user.id, email: user.email })

  return Response.json(user, { status: 201 })
}
```

## Security Headers
```typescript
// ✅ DO: Set security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  return response
}
```

## Security Review Checklist

For each code change, verify:

- [ ] All user input validated with Zod
- [ ] No hardcoded secrets (use environment variables)
- [ ] SQL queries parameterized (using Prisma)
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWT tokens use strong secret and expire
- [ ] Authorization checks on all protected routes
- [ ] No dangerouslySetInnerHTML without DOMPurify
- [ ] No eval() or Function() with user input
- [ ] CORS configured for specific origins
- [ ] Error messages don't leak internal details
- [ ] Security headers set correctly
- [ ] Sensitive data excluded from API responses
- [ ] Security events logged
- [ ] Dependencies audited (npm audit)
- [ ] HTTPS enforced in production
