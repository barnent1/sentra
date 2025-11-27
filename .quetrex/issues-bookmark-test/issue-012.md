---
title: "[BM-012] Implement POST /api/auth/login endpoint"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Create user login endpoint with credential validation and JWT token generation.

## Acceptance Criteria
- [ ] POST /api/auth/login endpoint created
- [ ] Email and password validation
- [ ] Password comparison with bcrypt
- [ ] JWT token returned on success
- [ ] User object returned (without password field)
- [ ] Proper error for invalid credentials
- [ ] 90%+ test coverage for service layer
- [ ] E2E test for login flow

## Dependencies
- BM-002 (Prisma)
- BM-004 (User model)
- BM-009 (auth utilities)
- BM-010 (API middleware)

## Blocks
- BM-026 (login form component)
- BM-027 (register form component)

## Files to Create/Modify
- `src/app/api/auth/login/route.ts` - Login endpoint
- `tests/unit/api/auth/login.test.ts` - Unit tests (90%+ coverage)
- `tests/e2e/auth.spec.ts` - E2E tests (append to existing)

## Technical Context
See api-spec.yaml and security-model.md.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clh1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

## E2E Test Requirements
```gherkin
Scenario: Successful login
Given a registered user exists
When I submit valid credentials
Then I receive 200 status
And I receive JWT token
And I am redirected to /dashboard
```

## Estimated Complexity
**Medium** (4-6 hours)
