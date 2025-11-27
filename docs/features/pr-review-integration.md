# PR Review Integration - GitHub API Backend

## Overview

The PR review modal now connects to GitHub's REST API through the Quetrex backend, allowing users to review and merge pull requests directly from the application without opening GitHub in the browser.

## Architecture

```
Frontend (PRReviewPanel)
    ↓ API calls via quetrex-api.ts
Backend API (/api/github/*)
    ↓ Authenticated with user's GitHub token
GitHub REST API
    ↓ PR data, diff, review actions
Backend responds to frontend
```

## Implementation Details

### Backend Controller

**File**: `backend/src/controllers/github.ts`

Implements five main operations:

1. **GET /api/github/pr/:owner/:repo/:number** - Get PR details
   - Fetches PR metadata from GitHub
   - Fetches check runs to determine status
   - Fetches review comments
   - Returns unified PR data object

2. **GET /api/github/pr/:owner/:repo/:number/diff** - Get PR diff
   - Fetches PR diff in unified diff format
   - Returns plain text diff for display

3. **POST /api/github/pr/:owner/:repo/:number/approve** - Approve PR
   - Creates approval review on GitHub
   - Optional comment parameter
   - Returns success status

4. **POST /api/github/pr/:owner/:repo/:number/request-changes** - Request changes
   - Creates request changes review on GitHub
   - Required comment parameter
   - Returns success status

5. **POST /api/github/pr/:owner/:repo/:number/merge** - Merge PR
   - Merges PR on GitHub
   - Supports merge, squash, and rebase methods
   - Returns success status

### Authentication

All endpoints:
- Require JWT authentication (via `authenticateToken` middleware)
- Retrieve GitHub token from user settings (encrypted in database)
- Decrypt token and use it for GitHub API calls
- Return 400 if GitHub token not configured

### Error Handling

Comprehensive error handling for:
- **401 Unauthorized**: Invalid GitHub token
- **404 Not Found**: PR not found
- **403 Forbidden**: Insufficient permissions
- **405 Method Not Allowed**: PR not mergeable
- **500 Internal Server Error**: Generic errors

Error messages are user-friendly and actionable.

### Frontend Integration

**File**: `src/services/quetrex-api.ts`

Updated functions to call backend instead of returning mock data:
- `getPullRequest()` - Calls `/api/github/pr/:owner/:repo/:number`
- `getPRDiff()` - Calls `/api/github/pr/:owner/:repo/:number/diff`
- `approvePullRequest()` - Calls `/api/github/pr/:owner/:repo/:number/approve`
- `requestChangesPullRequest()` - Calls `/api/github/pr/:owner/:repo/:number/request-changes`
- `mergePullRequest()` - Calls `/api/github/pr/:owner/:repo/:number/merge`

All functions use `fetchWithAuth()` to include JWT token in requests.

### UI Improvements

**File**: `src/components/PRReviewPanel.tsx`

Added GitHub token validation:
- Checks for GitHub token on panel open
- Shows warning banner if token not configured
- Provides instructions for setting up GitHub token
- Lists required token scopes (repo, pull_request)
- Improved error messages with specific guidance

## GitHub Token Setup

### Required Scopes

Users need a GitHub Personal Access Token with:
- **repo** - Full control of private repositories
- **pull_request** - Read and write pull requests

### How to Generate Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `pull_request`
4. Generate token and copy it
5. In Quetrex: Settings → GitHub Token → Paste token

### Security

- Token is encrypted at rest using AES-256-GCM
- Token is decrypted only when needed for API calls
- Token is never exposed to frontend
- All GitHub API calls go through backend proxy

## Usage

### Review a PR

1. Open PR review panel (from project card or menu)
2. Panel fetches PR data from GitHub via backend
3. Review changes in diff viewer
4. Add comments and approve/request changes
5. Actions are sent to GitHub via backend

### Merge a PR

1. Open PR review panel
2. Verify checks are passing (green status)
3. Click "Merge" button
4. Select merge method (squash, merge, rebase)
5. PR is merged on GitHub via backend

## API Reference

### Get PR Details

```typescript
GET /api/github/pr/:owner/:repo/:number
Headers:
  Authorization: Bearer <jwt-token>

Response: {
  pr: {
    number: number
    title: string
    body: string
    state: string
    author: string
    createdAt: string
    updatedAt: string
    headBranch: string
    baseBranch: string
    mergeable: boolean
    url: string
    checksStatus: "success" | "failure" | "pending"
  },
  comments: Array<{
    id: number
    author: string
    body: string
    createdAt: string
    path?: string
    line?: number
  }>
}
```

### Get PR Diff

```typescript
GET /api/github/pr/:owner/:repo/:number/diff
Headers:
  Authorization: Bearer <jwt-token>

Response: {
  diff: string // Unified diff format
}
```

### Approve PR

```typescript
POST /api/github/pr/:owner/:repo/:number/approve
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body: {
  comment?: string // Optional approval comment
}

Response: {
  success: true
}
```

### Request Changes

```typescript
POST /api/github/pr/:owner/:repo/:number/request-changes
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body: {
  comment: string // Required comment explaining changes
}

Response: {
  success: true
}
```

### Merge PR

```typescript
POST /api/github/pr/:owner/:repo/:number/merge
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body: {
  mergeMethod: "merge" | "squash" | "rebase"
}

Response: {
  success: true
}
```

## Testing

### Manual Testing

1. Configure GitHub token in Settings
2. Open PR review panel with a real PR
3. Verify PR data loads correctly
4. Test approve action
5. Test request changes action
6. Test merge action (use test repository)

### Error Testing

1. Remove GitHub token → Verify warning banner shows
2. Use invalid token → Verify error message
3. Try to access non-existent PR → Verify 404 error
4. Try to merge unmergeable PR → Verify error message

## Future Enhancements

- [ ] Add PR creation from UI
- [ ] Add inline comment support
- [ ] Add file-level review comments
- [ ] Add support for GitHub Apps (instead of PAT)
- [ ] Add PR activity timeline
- [ ] Add draft PR support
- [ ] Add PR template support
- [ ] Cache PR data for performance

## Related Files

- `backend/src/controllers/github.ts` - GitHub API controller
- `backend/src/routes/github.ts` - GitHub API routes
- `backend/src/server.ts` - Route registration
- `src/services/quetrex-api.ts` - Frontend API client
- `src/components/PRReviewPanel.tsx` - PR review UI
- `src/db/schema.ts` - Database schema (githubToken field)
- `src/services/encryption.ts` - Token encryption service

## References

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Pull Requests API](https://docs.github.com/en/rest/pulls/pulls)
- [GitHub Reviews API](https://docs.github.com/en/rest/pulls/reviews)
