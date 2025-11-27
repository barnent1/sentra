# Security Quick Reference

Quick guide for developers working on Quetrex. Read this BEFORE making changes.

## 🚨 Golden Rules

1. **NEVER commit secrets** to git
2. **ALWAYS validate user input** with Zod schemas
3. **NEVER use `eval()`, `innerHTML`, or shell interpolation**
4. **ALWAYS sanitize file paths** before filesystem operations
5. **NEVER hardcode API keys** in source code

---

## Common Security Patterns

### ✅ Validating User Input (DO THIS)

```typescript
import { validateOrThrow, SettingsSchema } from '@/lib/validation'

function saveSettings(input: unknown) {
  // Validate BEFORE using
  const validated = validateOrThrow(SettingsSchema, input)

  // Now safe to use
  await saveSettingsToFile(validated)
}
```

### ❌ NO Validation (DON'T DO THIS)

```typescript
function saveSettings(input: any) {  // ❌ Using 'any'
  // ❌ No validation - DANGEROUS!
  await saveSettingsToFile(input)
}
```

---

### ✅ Safe File Path Handling (DO THIS)

```typescript
import { sanitizeFilePath, FilePathSchema } from '@/lib/validation'

function readProjectFile(userPath: string) {
  // Validate path
  const validated = FilePathSchema.parse(userPath)

  // Sanitize for extra safety
  const safe = sanitizeFilePath(validated)

  return fs.readFileSync(safe)
}
```

### ❌ Unsafe Path Handling (DON'T DO THIS)

```typescript
function readProjectFile(userPath: string) {
  // ❌ No validation - allows ../../../etc/passwd
  return fs.readFileSync(userPath)
}
```

---

### ✅ Safe Command Execution (DO THIS)

```rust
// In Rust - SAFE approach
use std::process::Command;

let output = Command::new("gh")
    .args(&[
        "pr",
        "view",
        &pr_number.to_string(),  // Separate args, not interpolated
        "--repo",
        &format!("{}/{}", owner, repo),
    ])
    .output()?;
```

### ❌ Unsafe Command Execution (DON'T DO THIS)

```rust
// ❌ NEVER DO THIS - Shell injection vulnerability
let output = Command::new("sh")
    .arg("-c")
    .arg(format!("gh pr view {} --repo {}/{}", pr_number, owner, repo))
    .output()?;
```

---

### ✅ Safe HTML Rendering (DO THIS)

```tsx
import { sanitizeHTML } from '@/lib/validation'

function UserComment({ text }: { text: string }) {
  // Option 1: Let React escape automatically
  return <div>{text}</div>

  // Option 2: If you MUST use HTML, sanitize first
  const safe = sanitizeHTML(text)
  return <div dangerouslySetInnerHTML={{ __html: safe }} />
}
```

### ❌ XSS Vulnerability (DON'T DO THIS)

```tsx
function UserComment({ text }: { text: string }) {
  // ❌ NEVER do this - XSS vulnerability!
  return <div dangerouslySetInnerHTML={{ __html: text }} />
}
```

---

### ✅ Safe Secret Storage (DO THIS)

```typescript
// In settings or config files
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

```bash
# In .env (NOT committed)
OPENAI_API_KEY=sk-proj-xxxxx
```

### ❌ Hardcoded Secrets (DON'T DO THIS)

```typescript
// ❌ NEVER hardcode secrets!
const apiKey = 'sk-proj-abc123xyz'
```

---

## Security Checklist for PRs

Before submitting a PR, verify:

- [ ] All user input validated with Zod schemas
- [ ] No hardcoded secrets (`git grep -i "sk-\|ghp_\|sk-ant"`)
- [ ] No `.env` file in commit (`git status`)
- [ ] File paths sanitized (no `..` allowed)
- [ ] No `eval()` or `dangerouslySetInnerHTML`
- [ ] Security tests pass (`npm test`)
- [ ] No new npm audit warnings (`npm audit`)

---

## Available Validation Schemas

Import from `@/lib/validation`:

| Schema | Use For |
|--------|---------|
| `SettingsSchema` | User settings (API keys, voice, etc) |
| `CreateProjectSchema` | New project creation |
| `FilePathSchema` | Any file path from user |
| `GitHubIssueSchema` | GitHub issue creation |
| `ChatMessageSchema` | Architect AI chat |
| `PRNumberSchema` | Pull request numbers |
| `ReviewCommentSchema` | PR review comments |
| `SpecContentSchema` | Spec file content |

---

## Testing for Vulnerabilities

### XSS Test
```typescript
// Try this in any text input:
<script>alert('xss')</script>

// Should be escaped/sanitized
```

### Path Traversal Test
```typescript
// Try this in file path inputs:
../../../etc/passwd

// Should be rejected by validation
```

### SQL Injection Test
```typescript
// Try this in text fields (if using SQL):
' OR '1'='1

// Should be safe (we use Prisma ORM)
```

### Command Injection Test
```typescript
// Try this in project name:
test; rm -rf /

// Should be rejected by validation
```

---

## Emergency: I Found a Security Bug!

### If you discover a vulnerability:

1. **DO NOT** open a public GitHub issue
2. **DO** email security@quetrex.ai immediately
3. **DO** include:
   - Vulnerability type (XSS, injection, etc)
   - Affected file(s)
   - Steps to reproduce
   - Proof of concept (if safe to share)

See [SECURITY.md](../SECURITY.md) for full disclosure policy.

---

## Security Resources

- **Full Security Policy**: [SECURITY.md](../SECURITY.md)
- **Pre-Deployment Checklist**: [SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md)
- **Audit Findings**: [SECURITY-AUDIT-FINDINGS.md](./SECURITY-AUDIT-FINDINGS.md)
- **Architecture**: [SECURITY-ARCHITECTURE.md](./architecture/SECURITY-ARCHITECTURE.md)

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Trusting User Input
```typescript
// ❌ BAD
function deleteProject(projectPath: string) {
  fs.rmSync(projectPath, { recursive: true })
}

// ✅ GOOD
function deleteProject(projectPath: string) {
  const validated = FilePathSchema.parse(projectPath)
  if (!validated.startsWith('/home/user/projects/')) {
    throw new Error('Invalid project path')
  }
  fs.rmSync(validated, { recursive: true })
}
```

### ❌ Mistake 2: Logging Secrets
```typescript
// ❌ BAD
console.log('Settings:', settings)  // Contains API keys!

// ✅ GOOD
console.log('Settings:', {
  ...settings,
  openaiApiKey: '[REDACTED]'
})
```

### ❌ Mistake 3: Client-Side Validation Only
```typescript
// ❌ BAD - Frontend only
function createProject(data: ProjectData) {
  // Validation only in React component
  if (data.name.length > 0) {
    await api.createProject(data)
  }
}

// ✅ GOOD - Backend validation too
#[tauri::command]
pub fn create_project(data: ProjectData) -> Result<(), String> {
  // ALWAYS validate on backend
  if data.name.is_empty() || data.name.len() > 100 {
    return Err("Invalid project name".to_string())
  }
  // ... create project
}
```

---

## Quick Command Reference

```bash
# Check for secrets before commit
git grep -i -E '(sk-|ghp_|sk-ant)'

# Run security audit
npm audit

# Check for common vulnerabilities
grep -r "eval(" src/
grep -r "innerHTML" src/
grep -r "dangerouslySetInnerHTML" src/

# Verify .env is ignored
git check-ignore .env
```

---

*Keep this document handy while coding!*
*Last updated: 2025-11-13*
