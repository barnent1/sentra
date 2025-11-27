---
title: "[BM-011] Implement POST /api/auth/register endpoint"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Create user registration endpoint with email/password validation, password hashing, and JWT token generation.

## Acceptance Criteria
- [ ] POST /api/auth/register endpoint created
- [ ] Email validation (valid format, unique check)
- [ ] Password validation (min 8 chars, uppercase, lowercase, number)
- [ ] Password hashed with bcrypt before storage
- [ ] JWT token returned on success
- [ ] User object returned (without password field)
- [ ] Proper error responses for duplicate email
- [ ] 90%+ test coverage for service layer
- [ ] E2E test for registration flow

## Dependencies
- BM-002 (Prisma)
- BM-004 (User model)
- BM-009 (auth utilities)
- BM-010 (API middleware)

## Blocks
- BM-026 (register form component)
- BM-027 (login form component)

## Files to Create/Modify
- `src/app/api/auth/register/route.ts` - Register endpoint
- `tests/unit/api/auth/register.test.ts` - Unit tests (90%+ coverage)
- `tests/e2e/auth.spec.ts` - E2E tests

## Technical Context
See api-spec.yaml and security-model.md for full specification.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe" // optional
}
```

**Response (201):**
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

**Error Responses:**
- 400: Email already exists
- 422: Validation error (weak password, invalid email)

## E2E Test Requirements
```gherkin
Scenario: Successful registration
Given I am on /auth in register mode
When I submit valid email, password, and name
Then I receive 201 status
And I receive JWT token
And I am redirected to /dashboard
```

## Estimated Complexity
**Medium** (4-6 hours)
