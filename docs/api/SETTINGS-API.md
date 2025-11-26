# Settings API Reference

**Audience:** Developers managing Sentra configuration
**Last Updated:** 2025-11-23

---

## Overview

The Settings API manages user preferences, API key storage, project configuration, and security settings. All sensitive data (API keys, tokens) is encrypted at rest using AES-256-GCM.

**Base URL:** `https://your-sentra-instance.com/api`

**Authentication:** Bearer token (JWT) required for all endpoints

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get User Settings](#get-user-settings)
  - [Update User Settings](#update-user-settings)
  - [Get API Keys](#get-api-keys)
  - [Set API Key](#set-api-key)
  - [Delete API Key](#delete-api-key)
  - [Get Project Settings](#get-project-settings)
  - [Update Project Settings](#update-project-settings)
- [Encryption](#encryption)
- [Environment Variable Fallbacks](#environment-variable-fallbacks)
- [Security Considerations](#security-considerations)
- [Code Examples](#code-examples)

---

## Authentication

All endpoints require a JWT bearer token in the `Authorization` header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

See [Architect API - Authentication](./ARCHITECT-API.md#authentication) for details.

---

## Endpoints

### Get User Settings

Retrieve all user preferences.

**Endpoint:** `GET /api/settings/user`

**Authentication:** Required

**Example:**
```bash
curl https://your-sentra-instance.com/api/settings/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "userId": "user_123",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "voiceEnabled": true,
    "notifications": {
      "email": true,
      "push": false,
      "agentUpdates": true,
      "prReviews": true
    },
    "dashboard": {
      "defaultView": "grid",
      "projectsPerPage": 12,
      "showCosts": true
    },
    "voice": {
      "defaultMode": "realtime",
      "autoPlay": true,
      "voiceId": "alloy"
    }
  },
  "updatedAt": "2025-11-23T14:32:15.000Z"
}
```

---

### Update User Settings

Update user preferences (partial updates supported).

**Endpoint:** `PATCH /api/settings/user`

**Authentication:** Required

**Request Body:**
```typescript
interface UpdateUserSettingsRequest {
  preferences: {
    theme?: 'light' | 'dark'
    language?: string
    voiceEnabled?: boolean
    notifications?: {
      email?: boolean
      push?: boolean
      agentUpdates?: boolean
      prReviews?: boolean
    }
    dashboard?: {
      defaultView?: 'grid' | 'list'
      projectsPerPage?: number
      showCosts?: boolean
    }
    voice?: {
      defaultMode?: 'http' | 'realtime'
      autoPlay?: boolean
      voiceId?: string
    }
  }
}
```

**Example:**
```bash
curl -X PATCH https://your-sentra-instance.com/api/settings/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "dark",
      "voice": {
        "defaultMode": "realtime",
        "autoPlay": true
      }
    }
  }'
```

**Response:**
```json
{
  "userId": "user_123",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "voiceEnabled": true,
    "voice": {
      "defaultMode": "realtime",
      "autoPlay": true,
      "voiceId": "alloy"
    }
  },
  "updatedAt": "2025-11-23T14:35:20.000Z"
}
```

---

### Get API Keys

Retrieve stored API keys (returns masked values for security).

**Endpoint:** `GET /api/settings/api-keys`

**Authentication:** Required

**Example:**
```bash
curl https://your-sentra-instance.com/api/settings/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "userId": "user_123",
  "apiKeys": {
    "openai": {
      "exists": true,
      "maskedValue": "sk-proj-***********xyz",
      "source": "database",
      "lastUsed": "2025-11-23T14:30:00.000Z",
      "createdAt": "2025-11-20T10:00:00.000Z"
    },
    "anthropic": {
      "exists": true,
      "maskedValue": "sk-ant-***********abc",
      "source": "database",
      "lastUsed": "2025-11-23T14:32:00.000Z",
      "createdAt": "2025-11-20T10:00:00.000Z"
    },
    "github": {
      "exists": false,
      "maskedValue": null,
      "source": "environment",
      "lastUsed": null,
      "createdAt": null
    }
  },
  "environmentFallback": {
    "openai": false,
    "anthropic": false,
    "github": true
  }
}
```

**Notes:**
- API key values are NEVER returned in full
- `maskedValue` shows first 10 and last 3 characters
- `source` indicates if key is from database or environment variable
- `exists` is `true` if key is set (database or environment)

---

### Set API Key

Store or update an API key (encrypted at rest).

**Endpoint:** `PUT /api/settings/api-keys/{provider}`

**Authentication:** Required

**Path Parameters:**
- `provider`: One of `openai`, `anthropic`, `github`

**Request Body:**
```typescript
interface SetApiKeyRequest {
  apiKey: string        // Full API key value
}
```

**Example:**
```bash
curl -X PUT https://your-sentra-instance.com/api/settings/api-keys/openai \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-proj-abcdefghijklmnopqrstuvwxyz123456789"
  }'
```

**Response:**
```json
{
  "provider": "openai",
  "maskedValue": "sk-proj-***********789",
  "source": "database",
  "createdAt": "2025-11-23T14:40:00.000Z",
  "encrypted": true
}
```

**Security:**
- API key is encrypted using AES-256-GCM before storage
- Encryption key derived from user's password (never stored in plaintext)
- Each key has unique IV (initialization vector)
- Authentication tag ensures data integrity

---

### Delete API Key

Remove a stored API key from database.

**Endpoint:** `DELETE /api/settings/api-keys/{provider}`

**Authentication:** Required

**Path Parameters:**
- `provider`: One of `openai`, `anthropic`, `github`

**Example:**
```bash
curl -X DELETE https://your-sentra-instance.com/api/settings/api-keys/openai \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "provider": "openai",
  "deleted": true,
  "fallbackAvailable": false
}
```

**Notes:**
- After deletion, system checks for environment variable fallback
- If `OPENAI_API_KEY` environment variable exists, it will be used
- `fallbackAvailable: true` means requests will still work via environment

---

### Get Project Settings

Retrieve settings for a specific project.

**Endpoint:** `GET /api/settings/projects/{projectId}`

**Authentication:** Required

**Example:**
```bash
curl https://your-sentra-instance.com/api/settings/projects/proj_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "projectId": "proj_abc123",
  "settings": {
    "notifications": {
      "agentStarted": true,
      "agentCompleted": true,
      "agentFailed": true,
      "prCreated": true,
      "prMerged": false
    },
    "automation": {
      "autoApproveSpecs": false,
      "autoMergePRs": false,
      "runTestsBeforePR": true
    },
    "costTracking": {
      "enabled": true,
      "monthlyBudget": 100,
      "alertThreshold": 0.8
    }
  },
  "updatedAt": "2025-11-23T14:32:15.000Z"
}
```

---

### Update Project Settings

Update project-specific settings (partial updates supported).

**Endpoint:** `PATCH /api/settings/projects/{projectId}`

**Authentication:** Required

**Request Body:**
```typescript
interface UpdateProjectSettingsRequest {
  settings: {
    notifications?: {
      agentStarted?: boolean
      agentCompleted?: boolean
      agentFailed?: boolean
      prCreated?: boolean
      prMerged?: boolean
    }
    automation?: {
      autoApproveSpecs?: boolean
      autoMergePRs?: boolean
      runTestsBeforePR?: boolean
    }
    costTracking?: {
      enabled?: boolean
      monthlyBudget?: number
      alertThreshold?: number
    }
  }
}
```

**Example:**
```bash
curl -X PATCH https://your-sentra-instance.com/api/settings/projects/proj_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "notifications": {
        "agentStarted": true,
        "prMerged": true
      },
      "costTracking": {
        "monthlyBudget": 150
      }
    }
  }'
```

**Response:**
```json
{
  "projectId": "proj_abc123",
  "settings": {
    "notifications": {
      "agentStarted": true,
      "agentCompleted": true,
      "agentFailed": true,
      "prCreated": true,
      "prMerged": true
    },
    "automation": {
      "autoApproveSpecs": false,
      "autoMergePRs": false,
      "runTestsBeforePR": true
    },
    "costTracking": {
      "enabled": true,
      "monthlyBudget": 150,
      "alertThreshold": 0.8
    }
  },
  "updatedAt": "2025-11-23T14:45:00.000Z"
}
```

---

## Encryption

### How API Keys Are Encrypted

Sentra uses **AES-256-GCM** (Galois/Counter Mode) for API key encryption.

**Encryption Flow:**

```
User API Key
    ↓
Generate random IV (12 bytes)
    ↓
Derive encryption key from user password
(PBKDF2, 100,000 iterations, SHA-256)
    ↓
Encrypt API key with AES-256-GCM
    ↓
Store: {encrypted_value, iv, auth_tag}
```

**Storage Format:**
```json
{
  "encrypted_value": "base64-encoded-ciphertext",
  "iv": "base64-encoded-initialization-vector",
  "auth_tag": "base64-encoded-authentication-tag"
}
```

**Decryption Flow:**

```
Retrieve: {encrypted_value, iv, auth_tag}
    ↓
Derive encryption key from user password
    ↓
Verify auth_tag (ensures data integrity)
    ↓
Decrypt with AES-256-GCM
    ↓
Return plaintext API key
```

### Security Properties

1. **Confidentiality:** Only user with correct password can decrypt
2. **Integrity:** Authentication tag prevents tampering
3. **Unique IVs:** Each encryption uses new random IV
4. **Forward Secrecy:** Changing password re-encrypts all keys
5. **No Plaintext Storage:** Keys never stored unencrypted

### Key Derivation

```typescript
// Derive encryption key from user password
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
```

---

## Environment Variable Fallbacks

If API key is not in database, Sentra checks environment variables as fallback.

### Priority Order

1. **Database (encrypted)** - User-stored key
2. **Environment variable** - Server environment
3. **Error** - No key available

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# GitHub
GITHUB_TOKEN=ghp_...
```

### Behavior

**Scenario A: Key in database**
```
GET /api/settings/api-keys
→ Returns: source="database", exists=true
```

**Scenario B: Key in environment only**
```
GET /api/settings/api-keys
→ Returns: source="environment", exists=true, maskedValue="sk-***-***"
```

**Scenario C: No key available**
```
GET /api/settings/api-keys
→ Returns: source=null, exists=false, maskedValue=null
```

**API Request Behavior:**

```typescript
async function getOpenAIKey(): Promise<string> {
  // 1. Try database first
  const dbKey = await database.getApiKey('openai', userId)
  if (dbKey) {
    return decrypt(dbKey)
  }

  // 2. Fallback to environment
  const envKey = process.env.OPENAI_API_KEY
  if (envKey) {
    return envKey
  }

  // 3. No key available
  throw new Error('OPENAI_API_KEY not configured')
}
```

---

## Security Considerations

### Best Practices

**1. Never log API keys**
```typescript
// ❌ BAD
console.log('OpenAI key:', apiKey)

// ✅ GOOD
console.log('OpenAI key:', maskApiKey(apiKey))
// Output: "OpenAI key: sk-proj-***********xyz"
```

**2. Rotate keys regularly**
```bash
# Every 90 days minimum
curl -X PUT https://your-sentra-instance.com/api/settings/api-keys/openai \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"apiKey": "NEW_KEY"}'
```

**3. Use database storage for user-specific keys**
```typescript
// ✅ GOOD - Per-user encryption
await setApiKey('openai', userApiKey, userId)

// ❌ BAD - Shared environment variable
process.env.OPENAI_API_KEY = userApiKey
```

**4. Validate API key format**
```typescript
function validateOpenAIKey(key: string): boolean {
  return /^sk-proj-[A-Za-z0-9]{32,}$/.test(key)
}

function validateAnthropicKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{95,}$/.test(key)
}
```

### Encryption Key Management

**Password Change Flow:**

When user changes password, all API keys must be re-encrypted:

```typescript
async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  // 1. Decrypt all keys with old password
  const keys = await getAllApiKeys(userId)
  const decryptedKeys = await Promise.all(
    keys.map(k => decryptKey(k, oldPassword))
  )

  // 2. Re-encrypt with new password
  const reencryptedKeys = await Promise.all(
    decryptedKeys.map(k => encryptKey(k, newPassword))
  )

  // 3. Update database
  await updateAllApiKeys(userId, reencryptedKeys)
}
```

### Rate Limiting

**API key endpoints have stricter rate limits:**

```
GET  /api/settings/api-keys        - 10 req/min
PUT  /api/settings/api-keys/:id    - 5 req/min
DELETE /api/settings/api-keys/:id  - 5 req/min
```

**Response when rate limited:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many API key requests. Try again in 42 seconds.",
    "details": {
      "limit": 5,
      "window": 60,
      "retryAfter": 42
    }
  }
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios'

const API_BASE = 'https://your-sentra-instance.com/api'
const TOKEN = 'your-jwt-token'

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
}

// Get user settings
async function getUserSettings() {
  const response = await axios.get(`${API_BASE}/settings/user`, { headers })
  return response.data
}

// Update theme preference
async function setTheme(theme: 'light' | 'dark') {
  const response = await axios.patch(
    `${API_BASE}/settings/user`,
    { preferences: { theme } },
    { headers }
  )
  return response.data
}

// Set API key
async function setApiKey(provider: string, apiKey: string) {
  const response = await axios.put(
    `${API_BASE}/settings/api-keys/${provider}`,
    { apiKey },
    { headers }
  )
  return response.data
}

// Get API keys (masked)
async function getApiKeys() {
  const response = await axios.get(`${API_BASE}/settings/api-keys`, { headers })
  return response.data
}

// Update project notifications
async function updateProjectNotifications(projectId: string, enabled: boolean) {
  const response = await axios.patch(
    `${API_BASE}/settings/projects/${projectId}`,
    {
      settings: {
        notifications: {
          agentStarted: enabled,
          agentCompleted: enabled,
          agentFailed: enabled
        }
      }
    },
    { headers }
  )
  return response.data
}
```

### Python

```python
import requests

API_BASE = 'https://your-sentra-instance.com/api'
TOKEN = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Get user settings
def get_user_settings():
    response = requests.get(f'{API_BASE}/settings/user', headers=headers)
    response.raise_for_status()
    return response.json()

# Update theme
def set_theme(theme: str):
    response = requests.patch(
        f'{API_BASE}/settings/user',
        json={'preferences': {'theme': theme}},
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Set API key
def set_api_key(provider: str, api_key: str):
    response = requests.put(
        f'{API_BASE}/settings/api-keys/{provider}',
        json={'apiKey': api_key},
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Get API keys
def get_api_keys():
    response = requests.get(f'{API_BASE}/settings/api-keys', headers=headers)
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Get user settings
curl https://your-sentra-instance.com/api/settings/user \
  -H "Authorization: Bearer $TOKEN"

# Update theme
curl -X PATCH https://your-sentra-instance.com/api/settings/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"theme": "dark"}}'

# Set OpenAI API key
curl -X PUT https://your-sentra-instance.com/api/settings/api-keys/openai \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-proj-abcdefghijklmnopqrstuvwxyz"}'

# Get API keys (masked)
curl https://your-sentra-instance.com/api/settings/api-keys \
  -H "Authorization: Bearer $TOKEN"

# Delete API key
curl -X DELETE https://your-sentra-instance.com/api/settings/api-keys/openai \
  -H "Authorization: Bearer $TOKEN"

# Update project settings
curl -X PATCH https://your-sentra-instance.com/api/settings/projects/proj_abc123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "notifications": {"agentStarted": true},
      "costTracking": {"monthlyBudget": 150}
    }
  }'
```

---

## Summary

**Key Endpoints:**

- `GET /api/settings/user` - Get user preferences
- `PATCH /api/settings/user` - Update preferences
- `GET /api/settings/api-keys` - Get API keys (masked)
- `PUT /api/settings/api-keys/:provider` - Set API key
- `DELETE /api/settings/api-keys/:provider` - Delete API key
- `GET /api/settings/projects/:id` - Get project settings
- `PATCH /api/settings/projects/:id` - Update project settings

**Security Features:**

- AES-256-GCM encryption for API keys
- PBKDF2 key derivation (100,000 iterations)
- Unique IV per encryption
- Authentication tags for integrity
- Environment variable fallbacks
- Masked values in responses

**Best Practices:**

1. Store user API keys in database (encrypted)
2. Use environment variables for shared/server keys
3. Rotate API keys every 90 days
4. Never log full API key values
5. Validate API key format before storage

**Resources:**

- [Architect API](./ARCHITECT-API.md)
- [Security Guide](../guides/SECURITY.md)
- [Multi-Session Architect](../guides/MULTI-SESSION-ARCHITECT.md)

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
