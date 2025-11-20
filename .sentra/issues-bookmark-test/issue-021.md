---
title: "[BM-021] Implement GET /api/bookmarks/tags (tag list with counts)"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Get all tags for user with usage counts

## Acceptance Criteria
- [ ] Endpoint implemented per api-spec.yaml
- [ ] Authentication required (uses authMiddleware)
- [ ] User isolation enforced (userId filter)
- [ ] Input validation with Zod schemas
- [ ] Proper error responses
- [ ] 90%+ test coverage for service layer
- [ ] E2E tests added to tests/e2e/bookmarks.spec.ts

## Dependencies
See dependency-graph-bookmark-test.yml

## Files to Create/Modify
- `src/app/api/bookmarks/...` - Endpoint implementation
- `tests/unit/api/bookmarks/...` - Unit tests
- `tests/e2e/bookmarks.spec.ts` - E2E tests

## Technical Context
See api-spec.yaml for complete specification.

## Estimated Complexity
**medium** (3-6 hours)
