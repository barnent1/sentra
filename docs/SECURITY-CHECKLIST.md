# Security Checklist

This checklist ensures all security measures are implemented before deployment.

## Pre-Deployment Security Review

### 1. Code Security

- [ ] **No hardcoded secrets** in source code
  ```bash
  # Run this check:
  git grep -i -E '(api_key|secret|password|token).*=.*["\047]sk-|ghp_|sk-ant'
  # Should return NO matches in source files
  ```

- [ ] **All user input validated** with Zod schemas
  - [ ] Settings validation (`SettingsSchema`)
  - [ ] Project creation validation (`CreateProjectSchema`)
  - [ ] File path validation (`FilePathSchema`)
  - [ ] Chat message validation (`ChatMessageSchema`)
  - [ ] PR review validation

- [ ] **SQL injection prevention**
  - [ ] Using Prisma ORM (parameterized queries)
  - [ ] No raw SQL with user input

- [ ] **Command injection prevention**
  - [ ] No shell execution with user input
  - [ ] Using `Command::new()` with separate args (Rust)
  - [ ] File paths sanitized before use

- [ ] **XSS prevention**
  - [ ] No `dangerouslySetInnerHTML` in React components
  - [ ] User content sanitized with `sanitizeHTML()`
  - [ ] Content-Security-Policy header configured

- [ ] **Path traversal prevention**
  - [ ] File paths validated with `FilePathSchema`
  - [ ] No `..` in user-provided paths
  - [ ] Using `path.join()` for path construction

### 2. Dependencies

- [ ] **No known vulnerabilities**
  ```bash
  npm audit
  # Should show: 0 vulnerabilities
  ```

- [ ] **Rust dependencies secure** (once cargo-audit installed)
  ```bash
  cargo audit
  # Should show: 0 vulnerabilities
  ```

- [ ] **Dependencies up to date**
  ```bash
  npm outdated
  ```

### 3. Environment & Secrets

- [ ] **`.env` file NOT in git**
  ```bash
  git ls-files | grep "\.env$"
  # Should return NO results
  ```

- [ ] **`.env.example` exists** with placeholder values

- [ ] **Secrets documented** in `.env.example`

- [ ] **API keys validated** with proper format regex

### 4. Headers & CSP

- [ ] **Security headers configured** in `src/middleware.ts`
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security (production only)
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy

- [ ] **CSP allows only necessary sources**
  - [ ] `connect-src` limited to API endpoints
  - [ ] `script-src` doesn't include `'unsafe-eval'` in production
  - [ ] `frame-ancestors 'none'`

### 5. Authentication & Authorization

- [ ] **API keys stored securely** (`~/.claude/quetrex/settings.json`)

- [ ] **File permissions correct** on settings file
  ```bash
  # Should be 600 (user read/write only)
  ls -la ~/.claude/quetrex/settings.json
  ```

- [ ] **GitHub token has minimal scope** (`repo` only)

- [ ] **OpenAI/Anthropic keys have rate limits** (check provider dashboards)

### 6. Tauri Security

- [ ] **IPC commands use allow-list** (no wildcard commands)

- [ ] **File system access restricted** to project directories

- [ ] **No dangerous system calls** exposed to frontend

- [ ] **Tauri security config reviewed** (`src-tauri/tauri.conf.json`)

### 7. AI Agent Security (Phase 1)

- [ ] **Agent execution isolated** in Docker containers

- [ ] **Resource limits configured**
  - [ ] Memory: 2GB max
  - [ ] CPU: 2 cores max
  - [ ] Processes: 100 max

- [ ] **Filesystem restrictions**
  - [ ] Read-only root filesystem
  - [ ] Ephemeral tmpfs for `/tmp`

- [ ] **User isolation**
  - [ ] Running as non-root user (`claude-agent:claude-agent`)
  - [ ] No sudo access

- [ ] **Capability dropping**
  - [ ] `CAP_DROP=ALL`
  - [ ] Only essential capabilities added back

### 8. Testing

- [ ] **Security tests pass**
  ```bash
  npm test -- tests/security/
  ```

- [ ] **No secrets in test files**
  ```bash
  git grep -i -E '(api_key|secret|password|token)' tests/
  # Should only show mock/fake values
  ```

### 9. Documentation

- [ ] **SECURITY.md** exists with disclosure policy

- [ ] **Security contact** documented

- [ ] **Known vulnerabilities** documented

- [ ] **Security roadmap** up to date

### 10. Production Environment

- [ ] **HTTPS enforced** (Strict-Transport-Security header)

- [ ] **Environment variables set** in production
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` (production database)
  - [ ] API keys configured

- [ ] **Error messages sanitized** (no stack traces to users)

- [ ] **Logging configured** (no sensitive data in logs)

- [ ] **Rate limiting enabled** (if using Express backend)

---

## Penetration Testing Recommendations

Before production release, consider these penetration tests:

### 1. **OWASP ZAP Scan**
```bash
# Basic scan
zap-cli quick-scan http://localhost:3000

# Full scan
zap-cli active-scan http://localhost:3000
```

### 2. **Manual Testing**

- [ ] **XSS Testing**: Try injecting `<script>alert('xss')</script>` in all inputs
- [ ] **SQL Injection**: Try `' OR '1'='1` in text inputs
- [ ] **Path Traversal**: Try `../../../etc/passwd` in file paths
- [ ] **Command Injection**: Try `; ls -la` in project names
- [ ] **CSRF**: Test state-changing operations without proper tokens

### 3. **Automated Scanning**

```bash
# npm security audit
npm audit --production

# Check for outdated packages
npm outdated

# Static analysis (if available)
npx eslint . --ext .ts,.tsx

# Type checking
npm run type-check
```

### 4. **Third-Party Security Review**

For production deployments, consider:
- Professional penetration testing service
- Bug bounty program (HackerOne, Bugcrowd)
- Security audit from certified firm

---

## Post-Deployment Monitoring

After deployment, monitor for:

- [ ] **Unusual API usage patterns** (OpenAI/Anthropic dashboards)
- [ ] **Failed authentication attempts** (logs)
- [ ] **Suspicious file access** (audit logs)
- [ ] **Unexpected network traffic** (firewall logs)
- [ ] **Security advisories** for dependencies (GitHub Dependabot)

---

## Incident Response Plan

If a security incident occurs:

1. **Contain**: Disable affected features immediately
2. **Investigate**: Identify root cause and scope
3. **Notify**: Contact affected users within 72 hours
4. **Patch**: Deploy fix as emergency release
5. **Disclose**: Publish security advisory after fix deployed
6. **Learn**: Update this checklist with lessons learned

---

## Emergency Contacts

- **Security Lead**: Glen Barnhardt (barnent1@gmail.com)
- **GitHub Security**: security@github.com (for platform issues)
- **OpenAI Security**: security@openai.com (for API issues)
- **Anthropic Security**: security@anthropic.com (for API issues)

---

*Last updated: 2025-11-13*
*Review this checklist before EVERY deployment*
