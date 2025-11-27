# Architect API Reference

**Audience:** Developers integrating with Quetrex's multi-session architect
**Last Updated:** 2025-11-23

---

## Overview

The Architect API enables multi-session conversations with Quetrex's AI architect. The architect helps refine software specifications through natural language conversations that span days or weeks, maintaining perfect memory across sessions.

**Base URL:** `https://your-quetrex-instance.com/api`

**Authentication:** Bearer token (JWT) required for all endpoints except health check

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Create Session](#create-session)
  - [List Sessions](#list-sessions)
  - [Get Session](#get-session)
  - [Send Message](#send-message)
  - [Get Session Progress](#get-session-progress)
  - [Resume Session](#resume-session)
  - [Generate Specification](#generate-specification)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

---

## Authentication

All API requests (except `/health`) require a JWT bearer token.

### Getting a Token

```bash
# Login to get token
curl -X POST https://your-quetrex-instance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Using the Token

Include in `Authorization` header for all requests:

```bash
curl -X GET https://your-quetrex-instance.com/api/architect/sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoints

### Health Check

Check API availability.

**Endpoint:** `GET /api/health`

**Authentication:** None required

**Request:**
```bash
curl https://your-quetrex-instance.com/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T14:32:15.000Z",
  "version": "0.1.0"
}
```

---

### Create Session

Start a new architect session for a project.

**Endpoint:** `POST /api/architect/sessions`

**Authentication:** Required

**Request Body:**
```typescript
interface CreateSessionRequest {
  projectId: string           // Project ID
  initialMessage?: string     // Optional first message
  recapPreference?: 'detailed' | 'quick' | 'none'  // Default: 'detailed'
}
```

**Example:**
```bash
curl -X POST https://your-quetrex-instance.com/api/architect/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_abc123",
    "initialMessage": "I want to build a bookmark manager for developers",
    "recapPreference": "detailed"
  }'
```

**Response:**
```json
{
  "sessionId": "sess_xyz789",
  "projectId": "proj_abc123",
  "status": "active",
  "createdAt": "2025-11-23T14:32:15.000Z",
  "progress": {
    "overallCompletion": 0,
    "readinessScore": 0,
    "categories": {
      "businessRequirements": { "completion": 0, "confidence": 0, "status": "not_started" },
      "databaseArchitecture": { "completion": 0, "confidence": 0, "status": "not_started" },
      "apiDesign": { "completion": 0, "confidence": 0, "status": "not_started" },
      "uiUxScreens": { "completion": 0, "confidence": 0, "status": "not_started" },
      "securityModel": { "completion": 0, "confidence": 0, "status": "not_started" },
      "thirdPartyIntegrations": { "completion": 0, "confidence": 0, "status": "not_started" },
      "performanceRequirements": { "completion": 0, "confidence": 0, "status": "not_started" },
      "deploymentStrategy": { "completion": 0, "confidence": 0, "status": "not_started" },
      "testingStrategy": { "completion": 0, "confidence": 0, "status": "not_started" }
    }
  },
  "messages": []
}
```

---

### List Sessions

Get all architect sessions for a project.

**Endpoint:** `GET /api/architect/sessions?projectId={projectId}`

**Authentication:** Required

**Query Parameters:**
- `projectId` (required): Filter sessions by project
- `status` (optional): Filter by status (`active`, `paused`, `completed`)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl "https://your-quetrex-instance.com/api/architect/sessions?projectId=proj_abc123&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "sess_xyz789",
      "projectId": "proj_abc123",
      "status": "active",
      "createdAt": "2025-11-23T14:32:15.000Z",
      "updatedAt": "2025-11-23T15:45:30.000Z",
      "progress": {
        "overallCompletion": 45,
        "readinessScore": 68
      },
      "messageCount": 23
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### Get Session

Retrieve complete session details including conversation history.

**Endpoint:** `GET /api/architect/sessions/{sessionId}`

**Authentication:** Required

**Example:**
```bash
curl https://your-quetrex-instance.com/api/architect/sessions/sess_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "sessionId": "sess_xyz789",
  "projectId": "proj_abc123",
  "status": "active",
  "createdAt": "2025-11-23T14:32:15.000Z",
  "updatedAt": "2025-11-23T15:45:30.000Z",
  "progress": {
    "overallCompletion": 45,
    "readinessScore": 68,
    "categories": {
      "businessRequirements": {
        "completion": 92,
        "confidence": 88,
        "status": "complete",
        "questionsAnswered": 5,
        "totalQuestions": 5
      },
      "databaseArchitecture": {
        "completion": 95,
        "confidence": 91,
        "status": "complete",
        "questionsAnswered": 4,
        "totalQuestions": 4
      },
      "apiDesign": {
        "completion": 78,
        "confidence": 75,
        "status": "in_progress",
        "questionsAnswered": 3,
        "totalQuestions": 5
      }
    }
  },
  "messages": [
    {
      "messageId": "msg_001",
      "role": "user",
      "content": "I want to build a bookmark manager for developers",
      "timestamp": "2025-11-23T14:32:15.000Z"
    },
    {
      "messageId": "msg_002",
      "role": "assistant",
      "content": "Great! Let's define your bookmark manager. Who is your primary target user?",
      "timestamp": "2025-11-23T14:32:18.000Z",
      "categoryFocus": "businessRequirements"
    }
  ],
  "decisions": [
    {
      "decisionId": "dec_001",
      "category": "databaseArchitecture",
      "question": "What database will you use?",
      "answer": "PostgreSQL with pgvector for semantic search",
      "timestamp": "2025-11-23T14:40:22.000Z"
    }
  ]
}
```

---

### Send Message

Send a message to the architect and get a response.

**Endpoint:** `POST /api/architect/sessions/{sessionId}/messages`

**Authentication:** Required

**Request Body:**
```typescript
interface SendMessageRequest {
  content: string              // User message
  metadata?: {
    voiceEnabled?: boolean     // True if message was spoken
    language?: string          // Language code (default: 'en')
  }
}
```

**Example:**
```bash
curl -X POST https://your-quetrex-instance.com/api/architect/sessions/sess_xyz789/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Individual developers and knowledge workers. Target 100-1000 bookmarks per user.",
    "metadata": {
      "voiceEnabled": true,
      "language": "en"
    }
  }'
```

**Response:**
```json
{
  "messageId": "msg_003",
  "role": "assistant",
  "content": "Perfect! 100-1000 bookmarks per user is a good scale. That influences our database design. Next, what problem are you solving for these knowledge workers?",
  "timestamp": "2025-11-23T14:35:20.000Z",
  "categoryFocus": "businessRequirements",
  "progressUpdate": {
    "businessRequirements": {
      "completion": 40,
      "confidence": 35,
      "questionsAnswered": 2,
      "totalQuestions": 5
    }
  }
}
```

---

### Get Session Progress

Get current progress and readiness score for a session.

**Endpoint:** `GET /api/architect/sessions/{sessionId}/progress`

**Authentication:** Required

**Example:**
```bash
curl https://your-quetrex-instance.com/api/architect/sessions/sess_xyz789/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "overallCompletion": 45,
  "readinessScore": 68,
  "specReady": false,
  "categories": {
    "businessRequirements": {
      "completion": 92,
      "confidence": 88,
      "status": "complete",
      "weight": 0.15,
      "missingItems": []
    },
    "databaseArchitecture": {
      "completion": 95,
      "confidence": 91,
      "status": "complete",
      "weight": 0.15,
      "missingItems": []
    },
    "apiDesign": {
      "completion": 78,
      "confidence": 75,
      "status": "in_progress",
      "weight": 0.15,
      "missingItems": [
        "Error handling approach",
        "Rate limiting strategy"
      ]
    },
    "uiUxScreens": {
      "completion": 12,
      "confidence": 10,
      "status": "not_started",
      "weight": 0.15,
      "missingItems": [
        "Screen layouts",
        "Navigation flow",
        "Responsive design"
      ]
    }
  },
  "readyForSpecGeneration": false,
  "minimumThreshold": 90
}
```

---

### Resume Session

Resume a paused session with optional recap.

**Endpoint:** `POST /api/architect/sessions/{sessionId}/resume`

**Authentication:** Required

**Request Body:**
```typescript
interface ResumeSessionRequest {
  recapPreference: 'detailed' | 'quick' | 'none'
}
```

**Example:**
```bash
curl -X POST https://your-quetrex-instance.com/api/architect/sessions/sess_xyz789/resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recapPreference": "detailed"
  }'
```

**Response:**
```json
{
  "sessionId": "sess_xyz789",
  "status": "active",
  "recap": {
    "type": "detailed",
    "summary": "Welcome back to your Bookmark Manager project! We've accomplished: defined target users (knowledge workers), database (PostgreSQL with pgvector), and authentication (JWT). Still need to discuss: API design, UI screens, and testing strategy. Your spec is 45% complete with 68% readiness.",
    "completedCategories": [
      "businessRequirements",
      "databaseArchitecture"
    ],
    "inProgressCategories": [
      "apiDesign"
    ],
    "notStartedCategories": [
      "uiUxScreens",
      "securityModel",
      "testingStrategy",
      "deploymentStrategy"
    ],
    "keyDecisions": [
      "PostgreSQL with pgvector for semantic search",
      "JWT authentication with 7-day expiration",
      "100-1000 bookmarks per user target scale"
    ],
    "nextFocus": "apiDesign"
  },
  "nextMessage": {
    "role": "assistant",
    "content": "Ready to continue? I suggest we focus on API design next. What RESTful endpoints will you need for bookmark management?",
    "categoryFocus": "apiDesign"
  }
}
```

---

### Generate Specification

Generate final specification document when readiness score ≥ 90%.

**Endpoint:** `POST /api/architect/sessions/{sessionId}/generate-spec`

**Authentication:** Required

**Request Body:**
```typescript
interface GenerateSpecRequest {
  format?: 'markdown' | 'json' | 'yaml'  // Default: 'markdown'
  includeTests?: boolean                 // Include E2E test specs (default: true)
}
```

**Example:**
```bash
curl -X POST https://your-quetrex-instance.com/api/architect/sessions/sess_xyz789/generate-spec \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "markdown",
    "includeTests": true
  }'
```

**Response:**
```json
{
  "specId": "spec_001",
  "sessionId": "sess_xyz789",
  "projectId": "proj_abc123",
  "format": "markdown",
  "generatedAt": "2025-11-23T16:00:00.000Z",
  "readinessScore": 92,
  "content": "# Bookmark Manager Specification\n\n## Executive Summary\n\nA bookmark management SaaS application for knowledge workers...",
  "sections": {
    "executiveSummary": true,
    "technicalArchitecture": true,
    "databaseDesign": true,
    "apiDocumentation": true,
    "uiScreens": true,
    "securitySpecification": true,
    "testingStrategy": true,
    "deploymentGuide": true
  },
  "downloadUrl": "/api/specs/spec_001/download"
}
```

---

## Request/Response Schemas

### Category Status

```typescript
type CategoryStatus = 'not_started' | 'in_progress' | 'complete'

interface CategoryProgress {
  completion: number        // 0-100
  confidence: number        // 0-100
  status: CategoryStatus
  weight: number           // Category weight (0.05-0.15)
  questionsAnswered: number
  totalQuestions: number
  missingItems: string[]
}
```

### Session Status

```typescript
type SessionStatus = 'active' | 'paused' | 'completed'

interface Session {
  sessionId: string
  projectId: string
  status: SessionStatus
  createdAt: string        // ISO 8601
  updatedAt: string        // ISO 8601
  progress: SessionProgress
  messages: Message[]
  decisions: Decision[]
}
```

### Message

```typescript
interface Message {
  messageId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string        // ISO 8601
  categoryFocus?: string
  metadata?: {
    voiceEnabled?: boolean
    language?: string
  }
}
```

### Decision

```typescript
interface Decision {
  decisionId: string
  category: string
  question: string
  answer: string
  timestamp: string        // ISO 8601
  resolved: boolean
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2025-11-23T14:32:15.000Z"
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Session created |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Session not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance mode |

### Common Error Codes

**Authentication Errors:**
- `AUTH_TOKEN_MISSING` - No token provided
- `AUTH_TOKEN_INVALID` - Token is invalid or expired
- `AUTH_TOKEN_EXPIRED` - Token has expired

**Validation Errors:**
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Field format is invalid

**Resource Errors:**
- `SESSION_NOT_FOUND` - Session does not exist
- `PROJECT_NOT_FOUND` - Project does not exist
- `SPEC_NOT_READY` - Readiness score < 90%

**Rate Limiting:**
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Example Error Response

```json
{
  "error": {
    "code": "SPEC_NOT_READY",
    "message": "Specification readiness score is below 90% threshold",
    "details": {
      "currentScore": 68,
      "requiredScore": 90,
      "missingCategories": ["uiUxScreens", "securityModel"]
    }
  },
  "timestamp": "2025-11-23T14:32:15.000Z"
}
```

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user
- 10,000 requests per day per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637692800
```

**When rate limited:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "details": {
      "limit": 100,
      "retryAfter": 45
    }
  },
  "timestamp": "2025-11-23T14:32:15.000Z"
}
```

---

## Code Examples

### TypeScript/JavaScript

```typescript
// Install: npm install axios

import axios from 'axios'

const API_BASE = 'https://your-quetrex-instance.com/api'
const TOKEN = 'your-jwt-token'

// Create session
async function createSession(projectId: string, initialMessage: string) {
  const response = await axios.post(
    `${API_BASE}/architect/sessions`,
    {
      projectId,
      initialMessage,
      recapPreference: 'detailed'
    },
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

// Send message
async function sendMessage(sessionId: string, content: string) {
  const response = await axios.post(
    `${API_BASE}/architect/sessions/${sessionId}/messages`,
    { content },
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

// Get progress
async function getProgress(sessionId: string) {
  const response = await axios.get(
    `${API_BASE}/architect/sessions/${sessionId}/progress`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    }
  )

  return response.data
}

// Generate spec when ready
async function generateSpec(sessionId: string) {
  const progress = await getProgress(sessionId)

  if (progress.readinessScore < 90) {
    throw new Error(`Not ready: ${progress.readinessScore}% (need 90%+)`)
  }

  const response = await axios.post(
    `${API_BASE}/architect/sessions/${sessionId}/generate-spec`,
    { format: 'markdown', includeTests: true },
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}
```

### Python

```python
# Install: pip install requests

import requests

API_BASE = 'https://your-quetrex-instance.com/api'
TOKEN = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Create session
def create_session(project_id: str, initial_message: str):
    response = requests.post(
        f'{API_BASE}/architect/sessions',
        json={
            'projectId': project_id,
            'initialMessage': initial_message,
            'recapPreference': 'detailed'
        },
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Send message
def send_message(session_id: str, content: str):
    response = requests.post(
        f'{API_BASE}/architect/sessions/{session_id}/messages',
        json={'content': content},
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Get progress
def get_progress(session_id: str):
    response = requests.get(
        f'{API_BASE}/architect/sessions/{session_id}/progress',
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Generate spec
def generate_spec(session_id: str):
    progress = get_progress(session_id)

    if progress['readinessScore'] < 90:
        raise ValueError(f"Not ready: {progress['readinessScore']}% (need 90%+)")

    response = requests.post(
        f'{API_BASE}/architect/sessions/{session_id}/generate-spec',
        json={'format': 'markdown', 'includeTests': True},
        headers=headers
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Set variables
export API_BASE="https://your-quetrex-instance.com/api"
export TOKEN="your-jwt-token"

# Create session
curl -X POST "$API_BASE/architect/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_abc123",
    "initialMessage": "I want to build a bookmark manager",
    "recapPreference": "detailed"
  }'

# Send message
curl -X POST "$API_BASE/architect/sessions/sess_xyz789/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Individual developers, 100-1000 bookmarks per user"
  }'

# Get progress
curl -X GET "$API_BASE/architect/sessions/sess_xyz789/progress" \
  -H "Authorization: Bearer $TOKEN"

# Generate spec
curl -X POST "$API_BASE/architect/sessions/sess_xyz789/generate-spec" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "markdown",
    "includeTests": true
  }'
```

---

## Summary

**Key Endpoints:**

- `POST /api/architect/sessions` - Create session
- `GET /api/architect/sessions` - List sessions
- `POST /api/architect/sessions/:id/messages` - Send message
- `GET /api/architect/sessions/:id/progress` - Get progress
- `POST /api/architect/sessions/:id/resume` - Resume session
- `POST /api/architect/sessions/:id/generate-spec` - Generate spec

**Authentication:** Bearer token required (JWT)

**Rate Limits:** 100 req/min, 1000 req/hour, 10,000 req/day

**Next Steps:**

1. Get authentication token
2. Create architect session
3. Send messages to refine spec
4. Monitor progress (aim for 90%+ readiness)
5. Generate specification document

**Resources:**

- [Multi-Session Architect Guide](../guides/MULTI-SESSION-ARCHITECT.md)
- [Settings API](./SETTINGS-API.md)
- [Security Guide](../guides/SECURITY.md)

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
