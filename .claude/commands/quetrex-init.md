# Quetrex Init - Register Project

Register the current project with Quetrex for AI-powered development.

## Process

### Step 1: Check for Existing Configuration

```bash
cat .quetrex/config.json 2>/dev/null
```

If config exists, tell the user this project is already registered and show the project ID.

### Step 2: Login

Ask the user for their Quetrex credentials:

> I'll register this project with Quetrex.
>
> Don't have an account? Sign up free at http://localhost:3000/signup
>
> Please provide your Quetrex login:
> 1. Email
> 2. Password

### Step 3: Get Token

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "<EMAIL>", "password": "<PASSWORD>"}' \
  http://localhost:3000/api/auth/token
```

If successful, you get a token. If not, show the error and ask user to try again.

### Step 4: Get Organization

```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/api/organizations
```

Use the first organization (personal org) for the project.

### Step 5: Get Project Info

```bash
basename "$PWD"  # Project name
pwd              # Project path
```

### Step 6: Register Project

```bash
curl -s -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "<NAME>", "path": "<PATH>", "orgId": "<ORG_ID>"}' \
  http://localhost:3000/api/projects
```

### Step 7: Create Config

```bash
mkdir -p .quetrex
echo '{"projectId": "<ID>", "orgId": "<ORG>", "api": "http://localhost:3000"}' > .quetrex/config.json
```

### Step 8: Update .gitignore

```bash
grep -q "\.quetrex" .gitignore 2>/dev/null || echo -e "\n# Quetrex\n.quetrex/" >> .gitignore
```

### Step 9: Success

```
PROJECT REGISTERED!

Name: <PROJECT_NAME>
ID: <PROJECT_ID>

Config saved to .quetrex/config.json

NEXT:
  /quetrex-run    - Create AI task
  /quetrex-status - Check runner
```

## Example

```
User: /quetrex-init

Claude: I'll register this project with Quetrex.

Please provide your login:
1. Email
2. Password

User: test@example.com / password123

Claude: [authenticates, registers project]

Done! "my-project" is now registered.
Config saved to .quetrex/config.json

Use /quetrex-run to create your first AI task!
```
