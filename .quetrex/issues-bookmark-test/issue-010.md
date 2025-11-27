---
title: "[BM-010] Create API middleware (error handling, CORS)"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Create reusable API middleware for error handling, CORS, and common response patterns.

## Acceptance Criteria
- [ ] Error handling middleware created
- [ ] CORS middleware created
- [ ] API response helpers created
- [ ] Consistent error response format
- [ ] All middleware has 90%+ test coverage
- [ ] TypeScript types for API responses

## Dependencies
- BM-001 (requires project structure)

## Blocks
All API endpoints (BM-011 through BM-025)

## Files to Create/Modify
- `src/middleware.ts` - Next.js middleware (CORS)
- `src/lib/api-utils.ts` - API utilities and error handling
- `tests/unit/lib/api-utils.test.ts` - Unit tests

## Technical Context
**API Utilities:**

```typescript
// src/lib/api-utils.ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiError {
  error: string
  code: string
}

export interface ApiSuccess<T> {
  data?: T
  message?: string
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data?: T,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status })
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  code: string,
  status: number = 400
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, code },
    { status }
  )
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    return errorResponse(
      error.errors[0].message,
      'VALIDATION_ERROR',
      422
    )
  }

  if (error instanceof Error) {
    if (error.message === 'Invalid or expired token') {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    if (error.message === 'Bookmark not found') {
      return errorResponse(
        'Bookmark not found',
        'NOT_FOUND',
        404
      )
    }

    return errorResponse(
      error.message,
      'INTERNAL_ERROR',
      500
    )
  }

  return errorResponse(
    'Internal server error',
    'INTERNAL_ERROR',
    500
  )
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch(handleApiError)
}
```

**CORS Middleware:**

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')

  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

## E2E Test Requirements
Not applicable (unit tests only).

## Estimated Complexity
**Small** (2-3 hours)
