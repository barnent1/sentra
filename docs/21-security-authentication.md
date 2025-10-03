# Security & Authentication

## Overview

Sentra provides **seamless authentication** with zero manual token management. The CLI automatically generates and manages cryptographic keys, while the dashboard uses traditional email/password login. All communication with the MCP server is authenticated and authorized.

## Design Philosophy

**Zero manual configuration:** Users should never copy/paste tokens or API keys.

**Security by default:** All communication encrypted, all requests authenticated.

**Multi-machine support:** Users can work from multiple machines without conflict.

**Transparent:** Security happens automatically in the background.

## Authentication Surfaces

Sentra has two authentication surfaces:

### 1. Dashboard (Web UI)

**Traditional email/password authentication:**
- User registers/logs in via dashboard
- Email/password stored securely (bcrypt hash)
- Session managed via cookies
- JWT tokens for API calls

### 2. CLI & MCP (Programmatic)

**Automatic cryptographic key authentication:**
- CLI generates Ed25519 key pair locally
- Private key never leaves user's machine
- All MCP requests signed with private key
- MCP verifies signatures with public key
- No manual token copying

## CLI Authentication Flow

### First-Time Setup (New User)

```bash
sentra setup

🔍 Analyzing project...
✅ Stack detected: Next.js 15 + TypeScript

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 Sentra Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No Sentra account found. Let's create one!

Email: user@example.com
Password: ********
Confirm password: ********

Creating account...
✅ Account created!

Generating authentication keys...
✅ Keys generated and stored securely

Registering with Sentra MCP server...
✅ MCP connection authenticated!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Sentra User ID: user_abc123

You can now:
  • Create tasks in the dashboard: https://app.sentra.dev
  • Use the CLI to manage projects
  • Run workflows via MCP

Keys stored in: ~/.sentra/credentials
```

**What happens behind the scenes:**

1. **User provides email/password**
   - CLI sends registration request to Sentra API
   - Backend validates email, hashes password (bcrypt)
   - User account created in database

2. **CLI generates Ed25519 key pair**
   ```typescript
   const keypair = generateKeyPair();
   // keypair.privateKey (stays local)
   // keypair.publicKey (sent to backend)
   ```

3. **Private key stored locally**
   ```json
   // ~/.sentra/credentials
   {
     "userId": "user_abc123",
     "email": "user@example.com",
     "privateKey": "ed25519_private_...",
     "publicKey": "ed25519_public_...",
     "createdAt": "2025-10-03T14:30:00Z"
   }
   ```

4. **Public key registered with backend**
   - CLI sends publicKey + userId to API
   - Backend stores in `userKeys` table
   - Returns confirmation

5. **CLI tests MCP connection**
   - Signs test request with private key
   - MCP verifies signature with public key
   - Connection confirmed

### Existing User on New Machine

```bash
sentra setup

🔍 Analyzing project...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 Sentra Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do you have a Sentra account? (y/n): y

Email: user@example.com
Password: ********

Authenticating...
✅ Logged in!

Generating authentication keys for this machine...
✅ Keys generated (Machine: work-laptop)

Registering keys with Sentra...
✅ MCP connection authenticated!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Sentra User ID: user_abc123

This machine is now registered.
You have 2 registered machines.
```

**What happens:**

1. User provides email/password
2. CLI authenticates with backend (validates credentials)
3. CLI generates **new** key pair for this machine
4. Private key stored in `~/.sentra/credentials` on this machine
5. Public key registered with backend (associated with userId)
6. User now has 2 registered machines

## Asymmetric Encryption (Ed25519)

### Why Ed25519?

- **Fast**: Signature generation and verification are extremely fast
- **Secure**: 128-bit security level, resistant to timing attacks
- **Small**: Keys and signatures are small (32 bytes)
- **Deterministic**: Same input always produces same output

### Key Generation

```typescript
import nacl from 'tweetnacl';

// Generate key pair
const keypair = nacl.sign.keyPair();

// keypair.secretKey (64 bytes) - PRIVATE KEY
// keypair.publicKey (32 bytes) - PUBLIC KEY

// Store private key locally (encrypted)
await storePrivateKey(keypair.secretKey);

// Send public key to backend
await registerPublicKey(keypair.publicKey);
```

### Request Signing

Every MCP request is signed:

```typescript
// CLI side (signing)
const payload = {
  projectId: 'proj_abc123',
  taskId: 'task_xyz789',
  workflowName: 'plan',
  timestamp: Date.now(),
};

// Serialize payload
const message = JSON.stringify(payload);

// Sign with private key
const signature = nacl.sign.detached(
  new TextEncoder().encode(message),
  privateKey
);

// Send to MCP
await mcpClient.callTool('sentra_execute_workflow', {
  ...payload,
  signature: Buffer.from(signature).toString('base64'),
  publicKey: Buffer.from(publicKey).toString('base64'),
});
```

### Signature Verification

```typescript
// MCP server side (verification)
async function verifyRequest(request: MCPRequest): Promise<boolean> {
  const { signature, publicKey, ...payload } = request;

  // Reconstruct message
  const message = JSON.stringify(payload);

  // Decode signature and public key
  const signatureBytes = Buffer.from(signature, 'base64');
  const publicKeyBytes = Buffer.from(publicKey, 'base64');

  // Verify signature
  const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    signatureBytes,
    publicKeyBytes
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // Check timestamp (prevent replay attacks)
  const age = Date.now() - payload.timestamp;
  if (age > 60000) { // 60 seconds
    throw new Error('Request expired');
  }

  // Verify public key is registered
  const userKey = await db
    .select()
    .from(userKeys)
    .where(eq(userKeys.publicKey, publicKey))
    .where(isNull(userKeys.revokedAt))
    .limit(1);

  if (userKey.length === 0) {
    throw new Error('Public key not registered or revoked');
  }

  return true;
}
```

## Credential Storage

### Local Storage (User's Machine)

**Location:** `~/.sentra/credentials`

**Format:**
```json
{
  "userId": "user_abc123",
  "email": "user@example.com",
  "privateKey": "base64_encoded_ed25519_private_key",
  "publicKey": "base64_encoded_ed25519_public_key",
  "machineName": "macbook-pro",
  "createdAt": "2025-10-03T14:30:00Z"
}
```

**Security:**
- File permissions: `0600` (read/write by owner only)
- Stored in OS-specific secure location:
  - **macOS:** `~/Library/Application Support/sentra/credentials`
  - **Linux:** `~/.config/sentra/credentials`
  - **Windows:** `%APPDATA%\sentra\credentials`
- **CRITICAL:** Private keys encrypted using OS-native keychain integration:
  - **macOS:** Keychain Services API
  - **Linux:** libsecret (GNOME Keyring/KWallet)
  - **Windows:** Windows Credential Manager (Data Protection API)
- Only encrypted blob stored in credentials file; decryption key in OS keychain
- **Fallback:** If keychain unavailable, warn user and use file permissions only

### Backend Storage

**Database tables:**

```typescript
// User accounts
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(), // bcrypt
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Registered public keys
export const userKeys = pgTable('user_keys', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),

  publicKey: text('public_key').notNull().unique(),
  machineName: varchar('machine_name', { length: 255 }),

  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
});

// Sessions (for dashboard)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),

  token: text('token').notNull(), // JWT
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit log - APPEND ONLY (no updates/deletes allowed)
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }),

  action: varchar('action', { length: 100 }).notNull(),
  // Actions: login, mcp_call, key_generated, key_revoked, workflow_executed

  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // CRITICAL: Audit immutability enforced via:
  // 1. Database triggers: PREVENT UPDATE/DELETE on audit_log table
  // 2. Application layer: No update/delete methods exist for this table
  // 3. Permissions: Application role has INSERT/SELECT only
});
```

## Dashboard Authentication

### Email/Password Login

**Technology:** NextAuth.js (or similar)

**Login flow:**

```
User visits https://app.sentra.dev
  ↓
Login page (email + password)
  ↓
POST /api/auth/signin
  ↓
Backend validates:
  - Email exists
  - Password matches hash
  ↓
Create session:
  - Generate JWT
  - Store in session table
  - Set HTTP-only cookie
  ↓
Redirect to dashboard
  ↓
Dashboard makes API calls with JWT in Authorization header
```

**Session management:**

```typescript
// Generate JWT
const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Store session
await db.insert(sessions).values({
  id: generateId(),
  userId,
  token,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});

// Set HTTP-only cookie
res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
```

**API authorization:**

```typescript
// Middleware for protected routes
async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Unauthorized');
  }

  // Verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check session exists and not expired
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .where(gt(sessions.expiresAt, new Date()))
    .limit(1);

  if (session.length === 0) {
    throw new Error('Session expired');
  }

  return { userId: decoded.userId };
}
```

## MCP Request Flow

### Complete Request/Response Cycle

```typescript
// 1. CLI prepares request
const payload = {
  projectId: 'proj_abc123',
  taskId: 'task_xyz789',
  workflowName: 'plan',
  timestamp: Date.now(),
};

// 2. CLI signs request
const signature = signPayload(payload, privateKey);

// 3. CLI sends to MCP
const response = await fetch('https://mcp.sentra.dev/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...payload,
    signature,
    publicKey,
  }),
});

// 4. MCP verifies signature
const isValid = verifySignature(payload, signature, publicKey);
if (!isValid) throw new Error('Invalid signature');

// 5. MCP checks authorization
const userKey = await getUserKey(publicKey);
if (!userKey || userKey.revokedAt) throw new Error('Unauthorized');

// 6. MCP updates last used timestamp
await updateLastUsed(userKey.id);

// 7. MCP executes workflow
const result = await executeWorkflow(payload);

// 8. MCP logs to audit trail
await logAuditEvent({
  userId: userKey.userId,
  action: 'workflow_executed',
  metadata: { workflowName: payload.workflowName, taskId: payload.taskId },
});

// 9. MCP returns result
return result;
```

## Multi-Machine Support

### Scenario: User works on 3 machines

**Machines:**
1. MacBook Pro (home)
2. Work Desktop (office)
3. Linux Server (cloud dev)

**Setup:**

```bash
# Machine 1: MacBook Pro
sentra setup
# Email: user@example.com
# Password: ********
# → Generates keypair_1
# → Stores in ~/.sentra/credentials

# Machine 2: Work Desktop
sentra setup
# Existing account? y
# Email: user@example.com
# Password: ********
# → Generates keypair_2 (different from keypair_1)
# → Stores in ~/.sentra/credentials

# Machine 3: Linux Server
sentra setup
# Existing account? y
# Email: user@example.com
# Password: ********
# → Generates keypair_3
# → Stores in ~/.config/sentra/credentials
```

**Backend state:**

```
users table:
  user_abc123 (email: user@example.com)

userKeys table:
  key_001 → publicKey_1, machineName: "macbook-pro"
  key_002 → publicKey_2, machineName: "work-desktop"
  key_003 → publicKey_3, machineName: "linux-server"
```

**Each machine uses its own private key:**
- All requests from MacBook Pro signed with `privateKey_1`
- All requests from Work Desktop signed with `privateKey_2`
- All requests from Linux Server signed with `privateKey_3`

**MCP accepts all three public keys** (as long as they're registered and not revoked).

### Dashboard: Manage Devices

```tsx
// Dashboard: /settings/devices
function DevicesPage() {
  const devices = [
    { id: 'key_001', name: 'MacBook Pro', registeredAt: '2025-10-01', lastUsed: '2 mins ago' },
    { id: 'key_002', name: 'Work Desktop', registeredAt: '2025-10-02', lastUsed: '3 hours ago' },
    { id: 'key_003', name: 'Linux Server', registeredAt: '2025-10-03', lastUsed: '1 day ago' },
  ];

  async function revokeDevice(keyId: string) {
    await fetch(`/api/keys/${keyId}/revoke`, { method: 'POST' });
    // Device immediately loses MCP access
  }

  return (
    <div>
      <h1>Your Devices</h1>
      {devices.map(device => (
        <div key={device.id}>
          <h3>{device.name}</h3>
          <p>Registered: {device.registeredAt}</p>
          <p>Last used: {device.lastUsed}</p>
          <button onClick={() => revokeDevice(device.id)}>Revoke Access</button>
        </div>
      ))}
    </div>
  );
}
```

**Revoking a key:**

```typescript
// API route: /api/keys/[keyId]/revoke
export async function POST(req: Request, { params }: { params: { keyId: string } }) {
  const userId = await requireAuth(req);

  // Verify key belongs to user
  const key = await db
    .select()
    .from(userKeys)
    .where(eq(userKeys.id, params.keyId))
    .where(eq(userKeys.userId, userId))
    .limit(1);

  if (key.length === 0) {
    return Response.json({ error: 'Key not found' }, { status: 404 });
  }

  // Revoke key
  await db
    .update(userKeys)
    .set({ revokedAt: new Date() })
    .where(eq(userKeys.id, params.keyId));

  // Log audit event
  await db.insert(auditLog).values({
    userId,
    action: 'key_revoked',
    metadata: { keyId: params.keyId, machineName: key[0].machineName },
  });

  return Response.json({ success: true });
}
```

**Next MCP request from revoked machine:**

```
MCP checks key status:
  SELECT * FROM user_keys WHERE public_key = ? AND revoked_at IS NULL

Result: empty (key is revoked)

MCP rejects request:
  Error: "Public key not registered or revoked"

CLI receives error:
  ❌ Authentication failed: Your key has been revoked
  Run 'sentra setup' to generate a new key
```

## Security Features

### 1. Rate Limiting

**Per user:**
- 1000 MCP requests per hour
- 100 workflows per day
- 50 concurrent tasks

**Per IP:**
- 10 failed authentication attempts per hour
- 1000 API requests per hour

**Implementation:**

```typescript
import rateLimit from 'express-rate-limit';

const mcpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // per user
  keyGenerator: (req) => req.userId,
  message: 'Rate limit exceeded. Try again in 1 hour.',
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: 'Too many failed login attempts.',
});
```

### 2. Request Expiry (Prevent Replay Attacks)

```typescript
// MCP signature verification includes timestamp check
const age = Date.now() - payload.timestamp;

if (age > 60000) { // 60 seconds
  throw new Error('Request expired');
}
```

**Why:** Prevents attacker from capturing a signed request and replaying it later.

### 3. Key Rotation

**Automatic reminders:**

```bash
sentra status

⚠️  Your authentication key is 89 days old.
Consider rotating it for better security:
  sentra keys rotate
```

**Manual rotation:**

```bash
sentra keys rotate

Generating new authentication key...
✅ New key generated

Registering with Sentra...
✅ New key registered

⚠️  Old key will remain valid for 30 days, then be automatically revoked.

Old key ID: key_001
New key ID: key_004
```

### 4. Audit Logging

**All security events logged:**

```typescript
auditLog table:
  - User login
  - Failed login attempts
  - Key generation
  - Key revocation
  - MCP call executed
  - Workflow started/completed
  - Project created/deleted
```

**Immutability enforcement:**

```sql
-- Database migration: Create audit log protection trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable. Cannot modify or delete records.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_audit_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Application database role has INSERT/SELECT only
GRANT INSERT, SELECT ON audit_log TO sentra_app_role;
REVOKE UPDATE, DELETE ON audit_log FROM sentra_app_role;
```

**Dashboard: Audit Log**

```tsx
function AuditLogPage() {
  const logs = [
    { action: 'login', timestamp: '2025-10-03 14:30', ip: '192.168.1.1' },
    { action: 'mcp_call', metadata: { workflow: 'plan', taskId: 'task_123' }, timestamp: '2025-10-03 14:35' },
    { action: 'key_revoked', metadata: { machineName: 'old-laptop' }, timestamp: '2025-10-03 15:00' },
  ];

  return (
    <div>
      <h1>Security Audit Log</h1>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Details</th>
            <th>Timestamp</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.timestamp}>
              <td>{log.action}</td>
              <td>{JSON.stringify(log.metadata)}</td>
              <td>{log.timestamp}</td>
              <td>{log.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. TLS/HTTPS Everywhere

**All communication encrypted:**
- CLI → Sentra API: `https://api.sentra.dev`
- CLI → MCP Server: `https://mcp.sentra.dev`
- Dashboard → Sentra API: `https://api.sentra.dev`

**TLS configuration:**
- TLS 1.3 only
- Strong cipher suites
- HSTS headers
- Certificate pinning (future enhancement)

### 6. Secrets Management

**Never log secrets:**

```typescript
// ❌ BAD
console.log('User token:', user.privateKey);

// ✅ GOOD
console.log('User authenticated:', user.id);
```

**Sanitize error messages:**

```typescript
// ❌ BAD
throw new Error(`Invalid signature: ${signature}`);

// ✅ GOOD
throw new Error('Invalid signature');
```

### 7. Two-Factor Authentication (2FA)

**Optional for dashboard login:**

```bash
# Enable 2FA in dashboard settings
Dashboard → Settings → Security → Enable 2FA

# Scan QR code with authenticator app
# Enter 6-digit code to verify

✅ 2FA enabled!
```

**Login flow with 2FA:**

```
User enters email + password
  ↓
Backend validates credentials
  ↓
Prompt for 2FA code
  ↓
User enters 6-digit code
  ↓
Backend verifies TOTP code
  ↓
Create session
```

## Best Practices

### For Users

1. **Don't share credentials:**
   - Never share `~/.sentra/credentials` file
   - Each machine should have its own key

2. **Revoke lost devices:**
   - If you lose a laptop, revoke its key immediately from dashboard

3. **Use strong passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

4. **Enable 2FA:**
   - Optional but highly recommended

### For Sentra Developers

1. **Private keys never leave user's machine:**
   - Never transmit private keys
   - Never log private keys
   - Never store private keys in backend

2. **Verify all MCP requests:**
   - Check signature
   - Check timestamp
   - Check key is registered and not revoked

3. **Log security events:**
   - All authentication attempts
   - All key operations
   - All MCP calls

4. **Use environment variables for secrets:**
   - JWT_SECRET
   - DATABASE_URL
   - API keys

## Summary

Sentra's security architecture provides:

1. **Zero manual configuration** - CLI automatically generates and manages keys
2. **Asymmetric encryption** - Ed25519 for request signing
3. **Multi-machine support** - Each device has its own key pair
4. **Dashboard management** - Revoke devices, view audit logs
5. **Rate limiting** - Prevent abuse
6. **Audit logging** - Track all security events
7. **TLS everywhere** - All communication encrypted
8. **2FA optional** - Extra security for dashboard login

**Key Principle:** Security should be invisible to the user. It just works.
