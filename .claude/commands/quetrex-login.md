# Quetrex Login - Authenticate with Quetrex

Authenticate with Quetrex to enable project registration and AI agent workflows.

## Process

### Step 1: Ask for Credentials

**Ask the user:**
> To authenticate with Quetrex, I need your login credentials.
>
> Don't have an account? Sign up at https://quetrex.io/signup
>
> Please provide:
> 1. Your email address
> 2. Your password

Wait for the user to provide both.

### Step 2: Authenticate

Once you have the credentials, authenticate:

```bash
# For local development, use localhost:3000
# For production, use quetrex.io
API_URL="${QUETREX_API_URL:-http://localhost:3000}"

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "<USER_EMAIL>", "password": "<USER_PASSWORD>"}' \
  "$API_URL/api/auth/token"
```

### Step 3: Handle Response

**If successful**, the response will contain a token:
```json
{
  "token": "eyJ...",
  "expiresIn": "30 days",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

Store the token for the session and inform the user:

```
===============================================
  LOGGED IN TO QUETREX
===============================================

Welcome, <USER_NAME>!
Email: <USER_EMAIL>

Your session is now active.

NEXT STEPS:
  /quetrex-init   - Register this project
  /quetrex-status - Check runner status
  /quetrex-run    - Create an AI task

Token expires in 30 days.
===============================================
```

**If failed**, show the error:
```
Login failed: <ERROR_MESSAGE>

Please check your email and password and try again.
Need an account? https://quetrex.io/signup
```

### Step 4: Save Token for Session

The token should be kept available for subsequent commands in this session.
Tell the user the token will be used automatically for other quetrex commands.

## Example Session

```
User: /quetrex-login

Claude: I'll help you log in to Quetrex.

Please provide your login credentials:
1. Email address
2. Password

User: email: user@example.com, password: mypassword123

Claude: Authenticating with Quetrex...

Welcome, John! You're now logged in.

Your token is active for this session. You can now use:
  /quetrex-init   - Register this project
  /quetrex-status - Check runner status
```

## Notes
- Password is only used for authentication, never stored
- Token is kept in session memory only
- For local development, API calls go to localhost:3000
- For production, API calls go to quetrex.io
