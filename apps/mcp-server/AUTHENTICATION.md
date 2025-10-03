# Ed25519 Request Authentication

This document describes the Ed25519 signature-based authentication system implemented for the Sentra MCP server.

## Overview

The authentication system uses Ed25519 digital signatures to verify that requests come from authorized users. Each request must include a signature that proves the sender has access to the private key associated with a registered API key.

## Features

- **Ed25519 Signatures**: Cryptographically secure authentication using Ed25519 public-key cryptography
- **Timestamp Validation**: Prevents replay attacks with configurable time windows
- **Rate Limiting**: User-specific rate limits for authenticated requests
- **Database Integration**: Public keys stored in PostgreSQL with user associations
- **Revocation Support**: API keys can be revoked without deleting records

## Database Schema

### `api_keys` Table

```sql
CREATE TABLE "api_keys" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "publicKey" text NOT NULL,  -- Base64-encoded Ed25519 public key (32 bytes)
  "name" text NOT NULL,        -- Human-readable name
  "lastUsedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "revokedAt" timestamp
);
```

## Request Format

### Required Headers

Every authenticated request must include these headers:

- `X-User-Id`: The user ID (integer as string)
- `X-Signature-Timestamp`: ISO 8601 timestamp (e.g., "2025-10-03T14:30:00.000Z")
- `X-Signature-Ed25519`: Base64-encoded signature

### Signature Generation

The signature is computed over a "signature base" string with the following format:

```
METHOD\nPATH\nTIMESTAMP\nBODY
```

Where:
- `METHOD`: HTTP method in uppercase (e.g., "GET", "POST")
- `PATH`: Full request path including query string (e.g., "/mcp?sessionId=abc123")
- `TIMESTAMP`: The value from `X-Signature-Timestamp` header
- `BODY`: Stringified request body (empty string for GET requests)

Each component is separated by a newline character (`\n`).

### Example Signature Base

For a POST request to `/mcp` with a JSON body:

```
POST
/mcp
2025-10-03T14:30:00.000Z
{"jsonrpc":"2.0","method":"tools/list","id":1}
```

For a GET request with no body:

```
GET
/mcp?sessionId=abc123
2025-10-03T14:30:00.000Z

```

## Key Format

- **Public Keys**: Base64-encoded raw Ed25519 public keys (32 bytes)
- **Signatures**: Base64-encoded Ed25519 signatures (64 bytes)

## Timestamp Validation

Timestamps are validated to prevent replay attacks:

- **Maximum Age**: 60 seconds (configurable via `AUTH_TIMESTAMP_MAX_AGE`)
- **Clock Skew**: 5 seconds allowance (configurable via `AUTH_CLOCK_SKEW`)

A request is valid if:
```
|request_time - current_time| <= max_age + clock_skew
```

And the request timestamp is not more than `clock_skew` seconds in the future.

## Rate Limiting

Authenticated requests have higher rate limits than unauthenticated requests:

- **Authenticated**: 100 requests per minute per user
- **Unauthenticated**: 20 requests per minute per IP address

Rate limits are tracked using the user ID for authenticated requests.

## Configuration

### Environment Variables

```bash
# Enable/disable authentication
AUTH_ENABLED=false

# Timestamp validation (in seconds)
AUTH_TIMESTAMP_MAX_AGE=60
AUTH_CLOCK_SKEW=5
```

### Enabling Authentication

Set `AUTH_ENABLED=true` in your `.env` file to enable authentication for all MCP endpoints.

When disabled, the authentication middleware is not applied and requests proceed without signature verification.

## Implementation Files

### Core Files

- `src/types/auth.ts` - TypeScript type definitions
- `src/utils/crypto.ts` - Ed25519 signature verification utilities
- `src/middleware/auth.ts` - Authentication middleware
- `src/middleware/rateLimiter.ts` - Rate limiting middleware
- `db/schema/auth.ts` - Database schema for API keys

### Integration Points

- `src/routes/mcp.ts` - MCP routes with conditional authentication
- `src/config/server.ts` - Server configuration with auth settings
- `src/types/mcp.ts` - Extended server config interface

## Usage Example

### 1. Register an API Key

First, insert a user's public key into the database:

```sql
INSERT INTO api_keys (userId, publicKey, name)
VALUES (1, 'base64_encoded_public_key_here', 'My API Key');
```

### 2. Generate a Signature

Using Node.js crypto:

```javascript
import { createSign } from 'crypto';

const privateKey = '...'; // Ed25519 private key in PEM or JWK format
const method = 'POST';
const path = '/mcp';
const timestamp = new Date().toISOString();
const body = JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

const signatureBase = `${method}\n${path}\n${timestamp}\n${body}`;

const sign = createSign(null);
sign.update(signatureBase);
const signature = sign.sign(privateKey).toString('base64');
```

### 3. Make the Request

```bash
curl -X POST https://your-server.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -H "X-Signature-Timestamp: 2025-10-03T14:30:00.000Z" \
  -H "X-Signature-Ed25519: base64_signature_here" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Error Codes

The authentication middleware returns these error codes:

- `AUTH_MISSING_HEADERS` (401): Required authentication headers are missing
- `AUTH_INVALID_USER_ID` (401): User ID is not a valid integer
- `AUTH_INVALID_TIMESTAMP` (401): Timestamp is outside the valid window
- `AUTH_INVALID_KEY` (401): No active API key found for the user
- `AUTH_INVALID_SIGNATURE` (401): Signature verification failed
- `AUTH_ERROR` (401): Unexpected authentication error
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

## Security Considerations

1. **Private Key Security**: Private keys must never be transmitted or stored on the server
2. **Key Rotation**: Users should periodically rotate their API keys
3. **Revocation**: Compromised keys should be immediately revoked by setting `revokedAt`
4. **HTTPS Required**: Always use HTTPS in production to prevent signature interception
5. **Timestamp Replay**: The timestamp validation window should be as small as practical
6. **Database Security**: Protect the `api_keys` table with appropriate access controls

## Migration

The database migration file is located at:
```
db/migrations/0001_naive_dark_beast.sql
```

Run migrations with:
```bash
npm run db:migrate
```

## Testing

Run type checking to verify the implementation:
```bash
npm run typecheck
```

## Future Enhancements

Potential improvements for future versions:

1. **Nonce Support**: Add optional nonce to prevent replay attacks completely
2. **Key Expiration**: Automatic expiration of API keys after a configurable period
3. **Scope/Permissions**: Associate permissions with API keys for fine-grained access control
4. **Audit Logging**: Log all authentication attempts in the `audit_log` table
5. **Multiple Keys**: Support multiple active keys per user for key rotation
