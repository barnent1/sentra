---
title: "[BM-009] Create auth utility functions (bcrypt, JWT)"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Implement authentication utilities for password hashing, JWT token generation, and verification.

## Acceptance Criteria
- [ ] Password hashing function with bcrypt (10 salt rounds)
- [ ] Password comparison function
- [ ] JWT token generation function (7 day expiration)
- [ ] JWT token verification function
- [ ] All functions have 90%+ test coverage
- [ ] Error handling for invalid tokens
- [ ] TypeScript types for JWT payload

## Dependencies
- BM-004 (requires User model)
- BM-008 (requires JWT_SECRET env var)

## Blocks
- BM-011 (register endpoint)
- BM-012 (login endpoint)
- BM-013 (auth/me endpoint)
- BM-014 (auth middleware)

## Files to Create/Modify
- `src/lib/auth.ts` - Authentication utilities
- `tests/unit/lib/auth.test.ts` - Unit tests (90%+ coverage)

## Technical Context
**Implementation (from security-model.md):**

```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from './env'

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

/**
 * Hash password with bcrypt (10 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token (7 day expiration)
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * Verify JWT token and return payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}
```

**Test Coverage Requirements:**
- Test password hashing produces different hashes
- Test password comparison with correct password
- Test password comparison with wrong password
- Test token generation includes userId and email
- Test token verification with valid token
- Test token verification with expired token
- Test token verification with invalid token
- Test token verification with wrong secret

## E2E Test Requirements
Not applicable (unit tests only).

## Estimated Complexity
**Medium** (3-4 hours)
- 90%+ test coverage required
