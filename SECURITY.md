# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

We take security seriously. If you discover a security vulnerability in Sentra, please report it responsibly.

### How to Report

Send an email to: **security@sentra.ai** (or the maintainer's email: barnent1@gmail.com)

Include the following information:

- **Type of issue** (e.g., XSS, SQL injection, command injection, authentication bypass)
- **Full path of the source file(s)** related to the vulnerability
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact assessment** - What can an attacker do with this vulnerability?

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within **48 hours**
2. **Assessment**: We will assess the vulnerability and determine severity within **5 business days**
3. **Fix Timeline**:
   - **Critical/High**: Patch within 7 days
   - **Medium**: Patch within 30 days
   - **Low**: Patch in next regular release
4. **Disclosure**: We will coordinate with you on public disclosure timing (typically 90 days after patch)

### Bug Bounty

While we don't currently offer a formal bug bounty program, we deeply appreciate security researchers who help keep Sentra safe. We will:

- Acknowledge your contribution in our CHANGELOG
- Add you to our security acknowledgments (if desired)
- Send Sentra swag (if available)

## Security Measures

### Current Security Implementation

Sentra implements multiple layers of security:

#### 1. **Input Validation**
- All user input validated with Zod schemas
- File path sanitization prevents directory traversal
- API key format validation
- String length limits prevent DoS attacks

#### 2. **Security Headers** (Next.js middleware)
- `Content-Security-Policy`: Prevents XSS attacks
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing
- `Strict-Transport-Security`: Forces HTTPS in production
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Disables unused browser features

#### 3. **Secrets Management**
- Environment variables for all secrets
- API keys never hardcoded in source
- Settings stored locally in `~/.claude/sentra/settings.json`
- `.env` files excluded from version control

#### 4. **Safe Dependencies**
- Regular `npm audit` scans (currently 0 vulnerabilities)
- Minimal dependency tree
- Trusted packages only (Next.js, React, Tauri)

#### 5. **Tauri Native Security**
- IPC commands use explicit allow-list
- No dangerous system calls exposed to frontend
- Rust backend prevents memory safety issues

#### 6. **AI Agent Isolation** (Phase 1 - In Progress)
- Docker containerization with resource limits
- Read-only filesystem with ephemeral tmpfs
- Non-root user execution
- Capability dropping (CAP_DROP=ALL)
- See: `docs/architecture/SECURITY-ARCHITECTURE.md`

### Known Limitations

These are NOT vulnerabilities but architectural limitations to be aware of:

1. **Local API Keys**: API keys stored in local settings file (`~/.claude/sentra/settings.json`)
   - Encrypted storage planned for v0.2
   - Current recommendation: Use OS-level filesystem encryption

2. **GitHub CLI Trust**: We trust `gh` CLI output
   - Assumes `gh` CLI is not compromised
   - User must keep `gh` CLI updated

3. **Shell Command Execution**: Rust backend executes `gh` CLI commands
   - Input sanitization prevents injection
   - Commands use safe argument passing (no shell interpolation)

## Security Best Practices for Users

If you're using Sentra:

1. **API Keys**:
   - Use API keys with minimal necessary permissions
   - Rotate keys regularly (every 90 days)
   - Never share your `~/.claude/sentra/settings.json` file

2. **GitHub Token**:
   - Use fine-grained tokens with `repo` scope only
   - Set expiration dates (max 90 days)
   - Revoke immediately if compromised

3. **System Security**:
   - Keep Sentra updated to latest version
   - Enable OS-level filesystem encryption
   - Use strong authentication on your development machine

4. **Project Isolation**:
   - Don't run AI agents on projects with production credentials
   - Use separate GitHub repos for AI-managed projects
   - Review all agent changes before merging to production

## Security Roadmap

### Phase 2: Credential Proxy (Weeks 2-4)
- Unix socket-based credential proxy
- Credentials never exposed to agent containers
- Full audit trail of credential usage
- Protection against prompt injection attacks

### Phase 3: gVisor Migration (Q1 2026)
- User-space kernel for agent execution
- Syscall interception and validation
- Industry-leading security matching Claude Code for Web

### Future Enhancements
- Encrypted local storage for API keys
- Multi-factor authentication for sensitive operations
- Anomaly detection for unusual agent behavior
- Network egress filtering for agents

## Security Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:

- (No reports yet - you could be first!)

## Contact

For security questions or concerns that are not vulnerabilities:
- GitHub Discussions: https://github.com/barnent1/sentra/discussions
- Email: barnent1@gmail.com

For security vulnerabilities: **security@sentra.ai**

---

*Last updated: 2025-11-13*
*Security contact: barnent1@gmail.com*
