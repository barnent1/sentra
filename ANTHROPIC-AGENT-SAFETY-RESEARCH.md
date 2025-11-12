# Anthropic Claude Code: Official Guidance on Bug-Proof Agent Systems

**Research Date:** November 12, 2025
**Focus:** Preventing bugs from ever being shipped through agent safety patterns, not fixing them after the fact

---

## Executive Summary

This document compiles Anthropic's official guidance on creating safe, high-quality agent systems that prevent bugs from being shipped. The research focuses on **preventive measures** rather than reactive fixes, addressing the core pain point: agents creating bugs that shouldn't exist in the first place.

### Key Finding: Multi-Layered Prevention Strategy

Anthropic's approach combines five critical layers:

1. **Hook-Based Guardrails** (Exit Code 2 blocking)
2. **Permission System** (Deny dangerous operations)
3. **Multi-Agent Verification** (Independent review agents)
4. **Test-Driven Development** (Hard blockers on failures)
5. **Quality Gates** (End-of-turn verification)

---

## 1. Hook-Based Guardrails: The Primary Defense

### Overview

Claude Code hooks provide **8 strategic intervention points** in the agent lifecycle. The most critical for bug prevention are:

- **PreToolUse**: Block dangerous operations BEFORE they execute
- **PostToolUse**: Validate results AFTER tool completion
- **Stop**: Enforce quality gates before Claude finishes responding

### Exit Code Behavior (Critical for Blocking)

```
Exit Code 0: Success (stdout visible in transcript mode)
Exit Code 2: BLOCKING ERROR (stderr fed to Claude automatically)
Other Codes: Non-blocking errors (shown to user, execution continues)
```

**Exit Code 2 is the key to preventing bugs.** When a hook returns exit code 2:
- PreToolUse: Blocks the tool call completely
- PostToolUse: Shows stderr to Claude for correction
- Stop: Prevents Claude from finishing until issues are resolved

### Hook Configuration Example: Bash Command Validation

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/validate-command.py"
          }
        ]
      }
    ]
  }
}
```

**Validation Script (Python):**

```python
#!/usr/bin/env python3
import json
import sys
import re

# Read hook input from stdin
input_data = json.load(sys.stdin)
tool_input = input_data.get('tool_input', {})
command = tool_input.get('command', '')

# Define dangerous patterns
dangerous_patterns = [
    r'rm\s+.*-[rf]',           # rm -rf variants
    r'sudo\s+rm',              # sudo rm commands
    r'chmod\s+777',            # Dangerous permissions
    r'>\s*/etc/',              # Writing to system directories
    r'git\s+commit\s+--no-verify',  # Bypassing git hooks
]

# Validate command
for pattern in dangerous_patterns:
    if re.search(pattern, command, re.IGNORECASE):
        print(f"🚫 BLOCKED: Dangerous pattern detected: {pattern}", file=sys.stderr)
        sys.exit(2)  # Exit code 2 = BLOCK

# Allow safe commands
sys.exit(0)
```

### JSON-Based Decision Control (Advanced)

For more sophisticated control, use JSON output in hooks:

```python
#!/usr/bin/env python3
import json
import sys

input_data = json.load(sys.stdin)

# For PreToolUse hooks
output = {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",  # "allow", "deny", or "ask"
        "permissionDecisionReason": "This command could delete production data"
    }
}

print(json.dumps(output))
sys.exit(0)
```

**Permission Decisions:**
- `"allow"`: Bypasses permission system (use for auto-approved safe operations)
- `"deny"`: Prevents execution (reason shown to Claude)
- `"ask"`: Prompts user for confirmation (reason shown to user)

### Stop Hook: End-of-Turn Quality Gate

**The Stop hook is critical for preventing bugs from being committed.** It runs when Claude wants to finish responding, giving you a chance to enforce quality checks.

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/quality-gate.sh"
          }
        ]
      }
    ]
  }
}
```

**Quality Gate Script:**

```bash
#!/bin/bash
set -e

# Install dependencies if needed
pnpm install --silent

# Run quality checks
echo "Running quality checks..." >&2

# Type checking
if ! pnpm type:check --noEmit 2>&1; then
    echo "❌ Type checking failed" >&2
    exit 2  # Block until fixed
fi

# Linting
if ! pnpm lint 2>&1; then
    echo "❌ Linting failed" >&2
    exit 2  # Block until fixed
fi

# Tests
if ! pnpm test 2>&1; then
    echo "❌ Tests failed" >&2
    exit 2  # Block until fixed
fi

echo "✅ All quality checks passed" >&2
exit 0
```

**With JSON decision (more control):**

```python
#!/usr/bin/env python3
import json
import sys
import subprocess

# Run tests
result = subprocess.run(['pnpm', 'test'], capture_output=True)

if result.returncode != 0:
    output = {
        "decision": "block",
        "reason": "Tests are failing. Fix all test failures before completing.\n\n" +
                  result.stderr.decode('utf-8')
    }
    print(json.dumps(output))
    sys.exit(0)  # Exit 0 with "block" decision

# Tests passed
sys.exit(0)
```

---

## 2. Permission System: Denying Dangerous Operations

### The Git Commit Problem

**Critical Issue:** Claude Code can bypass Git pre-commit hooks by using `git commit --no-verify`, allowing it to commit broken code even when hooks fail.

**Source:** [Chris Richardson's Article](https://microservices.io/post/genaidevelopment/2025/09/10/allow-git-commit-considered-harmful.html)

### Solution: Deny Direct Git Commit Access

**File:** `.claude/settings.local.json`

```json
{
  "deny": [
    "Bash(git commit:*)"
  ]
}
```

This completely blocks Claude Code from running `git commit` commands directly.

### Use MCP Server for Commits Instead

Install a Git MCP server that enforces pre-commit hooks:

**Source Repository:** `humansintheloop-dev/mcp-servers`

**How it works:**
1. Claude Code tries `git commit` (blocked by deny rule)
2. Falls back to MCP server's commit tool
3. MCP server runs pre-commit hooks
4. If hooks fail, Claude receives error and fixes issues
5. Claude cannot bypass with `--no-verify`

**Claude Code's behavior when hooks fail:**
- ✅ Attempts to fix the failing tests
- ✅ Re-runs tests to verify fixes
- ❌ Does NOT try to delete the pre-commit hook
- ❌ Does NOT try to delete test code

### Allow Safe Operations

Balance security with productivity by allowing safe, frequently-used operations:

```json
{
  "allow": [
    "Bash(npm run lint)",
    "Bash(npm run test:*)",
    "Bash(pnpm type:check)",
    "Bash(cargo check)",
    "Bash(git status)",
    "Bash(git diff)",
    "Bash(git add:*)",
    "Read"
  ],
  "deny": [
    "Bash(git commit:*)",
    "Bash(git push:*)",
    "Bash(rm:*)",
    "Bash(curl:*)",
    "Bash(wget:*)"
  ]
}
```

**Important:** A deny rule ALWAYS overrides an allow rule.

---

## 3. Test-Driven Development: Hard Blockers on Failures

### Anthropic's Recommended TDD Workflow

**Source:** [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

**Step-by-step process:**

1. **Write Tests First**
   - Ask Claude to write tests based on expected input/output pairs
   - Be explicit: "We're doing test-driven development, so avoid creating mock implementations"

2. **Verify Tests Fail**
   - Tell Claude to run the tests and confirm they fail
   - Explicitly instruct: "Do NOT write any implementation code at this stage"

3. **Commit Tests**
   - Commit the failing tests to establish the baseline
   - This creates a clear verification target

4. **Implement Code**
   - Ask Claude to write code that passes the tests
   - Instruct: "Do NOT modify the tests"

5. **Verify with Independent Subagents**
   - Ask Claude to verify with independent subagents that the implementation isn't overfitting to the tests
   - This catches narrow solutions that might miss edge cases

6. **Commit Implementation**
   - Only commit once all tests pass

### TDD Guard: Automated TDD Enforcement

**Repository:** [https://github.com/nizos/tdd-guard](https://github.com/nizos/tdd-guard)

**What it does:**
- Blocks implementation without failing tests
- Prevents code beyond current test requirements
- Enforces refactoring using linting rules

**Supported Languages:**
- TypeScript / JavaScript (Vitest, Jest)
- Python (pytest)
- PHP (PHPUnit)
- Go
- Rust (Cargo, nextest)

**Configuration:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|TodoWrite",
        "hooks": [
          {
            "type": "command",
            "command": "tdd-guard"
          }
        ]
      }
    ]
  }
}
```

**How it works:**

1. Test reporters save structured test data to `.claude/tdd-guard/data/test.json`
2. When Claude tries to edit files, TDD Guard validates:
   - Do failing tests exist for this code?
   - Is the implementation minimal (not over-implementing)?
3. If validation fails, exits with code 2 (blocks the edit)
4. Claude receives feedback on what's needed next

---

## 4. Multi-Agent Architecture: Independent Verification

### Orchestrator-Worker Pattern

**Source:** [Anthropic's Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

**Key Finding:** Multi-agent systems with Claude Opus 4 as lead agent and Claude Sonnet 4 subagents **outperformed single-agent Opus 4 by 90.2%** on internal research evaluations.

### Core Principle

> "In production, the most stable agents follow a simple rule: give each subagent one job, and let an orchestrator coordinate."

### Agent Specialization for Bug Prevention

**Recommended pattern:**

```
Main Agent (Orchestrator)
├── Planning Agent (Extended thinking, creates detailed plan)
├── Implementation Agent (Writes code)
├── Test Agent (Writes and runs tests)
├── Review Agent (Code quality, security scanning)
└── Verification Agent (Validates final output)
```

### Using Subagents for Verification

**Best Practice:** Use independent subagents to verify details or investigate particular questions, especially early in a conversation or task. This:
- Preserves context availability in main agent
- Provides independent perspective
- Catches issues the implementation agent might miss

**Example prompt to main agent:**

```
Before implementing this feature, please:
1. Use a subagent to analyze the existing codebase and identify integration points
2. Use another subagent to review similar implementations in the codebase
3. Use a third subagent to identify potential edge cases and security concerns
4. Synthesize their findings into an implementation plan
5. Only then proceed with implementation
```

### Subagent Configuration

**File:** `.claude/agents/code-reviewer.md`

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and correctness
tools:
  - Read
  - Grep
  - Bash
---

You are a code review specialist. Your job is to:

1. Review the provided code for:
   - Logic errors
   - Security vulnerabilities
   - Performance issues
   - Missing error handling
   - Type safety issues
   - Test coverage gaps

2. For each issue found:
   - Explain the problem
   - Explain why it's a problem
   - Suggest a specific fix

3. Return a structured report:
   - CRITICAL: Issues that will cause bugs or security problems
   - WARNINGS: Issues that should be addressed
   - SUGGESTIONS: Nice-to-haves for code quality

4. If there are CRITICAL issues, explicitly state: "DO NOT COMMIT - CRITICAL ISSUES FOUND"

Be thorough but pragmatic. Focus on issues that could cause bugs in production.
```

### Multi-Claude Review Process

**Recommended workflow:**

1. **One Claude writes code** (in main session)
2. **Use another Claude to verify** (via subagent or separate session)
   - This separation maintains distinct context
   - Fresh perspective catches issues the implementation agent might miss

**Example:**

```bash
# Main session: implementation
claude "Implement user authentication with JWT tokens"

# After implementation, use subagent for review
# In main session:
"Please use the code-reviewer subagent to review the authentication implementation"
```

### Context Isolation Benefits

Every subagent operates within its own isolated context space:
- Prevents cross-contamination between different tasks
- Maintains clarity in primary conversation thread
- Allows parallel verification without polluting main context

**Important:** Subagents cannot spawn other subagents (prevents infinite nesting).

---

## 5. Quality Gates & Checkpoints

### Multi-Stage Verification Pipeline

**Source:** [claude-code-quality-hook](https://github.com/dhofheinz/claude-code-quality-hook)

**Three-stage pipeline:**

1. **Traditional Auto-Fix Stage**
   - Fast, deterministic fixes using native linters
   - Examples: `ruff check --fix` (Python), `eslint --fix` (JS/TS)

2. **AI-Powered Fixing**
   - Claude Code addresses complex issues that standard linters can't resolve
   - Groups related issues for context-aware fixes

3. **Iterative Refinement**
   - Pipeline automatically re-runs up to 3 times (configurable)
   - Catches cascading issues (fixes reveal previously hidden problems)

### Supported Linters & Languages

| Language | Primary Linter | Auto-Fix | Type Checking |
|----------|---------------|----------|---------------|
| Python | ruff | ✅ | Pyright |
| JavaScript | eslint | ✅ | - |
| TypeScript | eslint | ✅ | tsc |
| Rust | cargo clippy | ❌ | cargo check |
| Go | golangci-lint | ❌ | go vet |

### Configuration

**File:** `.quality-hook.json`

```json
{
  "max_fix_iterations": 3,
  "auto_fix": {
    "enabled": true,
    "threshold": 10
  },
  "claude_code": {
    "enabled": true,
    "use_git_worktrees": true
  },
  "linters": {
    "python": {
      "ruff": {
        "enabled": true,
        "auto_fix": true
      },
      "pyright": {
        "enabled": true
      }
    },
    "typescript": {
      "eslint": {
        "enabled": true,
        "auto_fix": true
      },
      "tsc": {
        "enabled": true
      }
    }
  }
}
```

### PostToolUse Hook Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/quality-check.py"
          }
        ]
      }
    ]
  }
}
```

### Git Worktree Parallelization

For large codebases, quality checks can run in parallel using Git worktrees:

**Benefits:**
- True parallel processing without file conflicts
- Each fix cluster runs in isolated git worktree
- Supports three merge strategies: claude, sequential, octopus

**Safety features:**
- Backups created before any changes
- Path validation prevents directory traversal
- Timeout protection (30s per linter, 600s per Claude session)
- Comprehensive logging for audit trails

---

## 6. Markdown Checklists: Preventing Mistakes on Large Tasks

### The Problem

For large migrations, bulk fixes, or tasks with many steps, agents can:
- Forget steps
- Skip validation
- Lose track of progress
- Create inconsistent changes

### The Solution: Markdown Checklists

**Source:** [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

> "For large tasks with multiple steps or requiring exhaustive solutions—like code migrations, fixing numerous lint errors, or running complex build scripts—you can improve performance by having Claude use a Markdown file (or even a GitHub issue!) as a checklist and working scratchpad."

### Recommended Workflow

**Example: Fixing Multiple Lint Errors**

1. **Generate Checklist**
   ```
   "Run the lint command and write all resulting errors (with filenames and line numbers)
   to a Markdown checklist in LINT-FIXES.md"
   ```

2. **Work Through Systematically**
   ```
   "Address each issue one by one from LINT-FIXES.md. For each issue:
   - Fix it
   - Run the linter again to verify the fix
   - Check off the item in the Markdown file
   - Move to the next item

   Do NOT move to the next item until the current one is completely fixed and verified."
   ```

3. **Final Verification**
   ```
   "Once all items are checked off, run the full lint suite to ensure nothing was missed,
   then commit the changes with a summary of fixes from the checklist."
   ```

### Example Checklist Format

**File:** `MIGRATION-CHECKLIST.md`

```markdown
# Database Migration Checklist

## Phase 1: Schema Updates
- [ ] Update User model with new fields
- [ ] Create migration script
- [ ] Test migration on dev database
- [ ] Verify all existing tests pass
- [ ] Add tests for new fields

## Phase 2: API Updates
- [ ] Update API endpoints to return new fields
- [ ] Update API documentation
- [ ] Add validation for new fields
- [ ] Update integration tests
- [ ] Verify backwards compatibility

## Phase 3: Frontend Updates
- [ ] Update TypeScript types
- [ ] Update UI components
- [ ] Add unit tests for components
- [ ] Update E2E tests
- [ ] Verify in staging environment

## Phase 4: Deployment
- [ ] Run migration on staging
- [ ] Verify staging works correctly
- [ ] Create rollback plan
- [ ] Run migration on production
- [ ] Monitor for errors

## Verification
- [ ] All tests pass (unit, integration, E2E)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Code review completed
- [ ] Documentation updated
```

### Benefits

- **Progress Tracking:** Clear visibility into what's done and what's left
- **Prevents Skipping Steps:** Each item must be checked off before moving on
- **Self-Verification:** Agent can review checklist to ensure completeness
- **Audit Trail:** Checklist serves as documentation of what was changed
- **Recovery:** If session is interrupted, easy to resume from checklist

---

## 7. Sandboxing & Isolation: Defense in Depth

**Source:** [Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)

### Filesystem Isolation

**Feature:** Read and write access to current working directory, but blocks modification of files outside it.

**Prevents:**
- Accidental modification of system files
- Compromised agent from altering sensitive configurations
- Directory traversal attacks

### Network Isolation

**Feature:** Outbound connections restricted through a unix domain socket connected to a proxy server.

**Prevents:**
- Exfiltration of sensitive files (SSH keys, credentials)
- Downloading malware
- Unauthorized API calls

### Combined Approach

> "Effective protection requires BOTH isolation types working together. Without network controls, a compromised agent could exfiltrate sensitive files. Without filesystem restrictions, an agent could escape the sandbox entirely."

### Technical Implementation

**Operating System Primitives:**
- Linux: bubblewrap
- macOS: Seatbelt

These enforce restrictions at the kernel level, covering:
- Direct Claude Code interactions
- Spawned scripts
- Subprocesses

### Real-World Impact

**Internal testing results:**
- Safely reduces permission prompts by 84%
- Allows developers to work faster while maintaining security
- Even successful prompt injections remain "fully isolated, and cannot impact overall user security"

### Configuration

Sandboxing is enabled by default. For additional safety in high-risk scenarios:

**Docker Dev Containers with Isolation:**

```json
{
  "name": "Isolated Claude Code Environment",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "containerEnv": {
    "CLAUDE_SANDBOX": "true"
  },
  "runArgs": [
    "--network=none"  // No network access
  ]
}
```

---

## 8. Current Issues & Workarounds (As of 2025)

### Known Hook Bugs

#### Issue 1: Exit Code 2 Not Blocking in Some Cases

**GitHub Issues:**
- #3656: Restore Blocking Stop Command Hooks
- #10412: Stop hooks with exit code 2 fail when installed via plugins

**Problem:**
- Exit code 2 works correctly in `.claude/hooks/`
- Fails when installed via plugin system
- Shows "⏺ Stop hook prevented continuation" but halts instead of continuing

**Workaround:**
- Install hooks directly in `.claude/hooks/` rather than via plugins
- Use JSON decision control instead of relying solely on exit codes

#### Issue 2: PreToolUse approve: false Ignored

**GitHub Issue:** #4362

**Problem:**
- PreToolUse hooks returning `{"approve": false}` are ignored
- Tool operations proceed anyway

**Workaround:**
- Use `"permissionDecision": "deny"` in `hookSpecificOutput` instead of deprecated `approve` field
- Combine with exit code 2 for double safety

```python
# Deprecated (doesn't work):
output = {"approve": false, "reason": "Blocked"}

# Current (works):
output = {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "Blocked due to security concern"
    }
}
```

#### Issue 3: Hooks Not Executing

**GitHub Issue:** #6305

**Problem:**
- PreToolUse and PostToolUse hooks not firing despite correct configuration

**Workarounds:**
- Verify hook scripts are executable: `chmod +x .claude/hooks/*.py`
- Check hook script shebang: `#!/usr/bin/env python3`
- Test hooks manually: `echo '{"tool_name": "Test"}' | .claude/hooks/my-hook.py`
- Check Claude Code version: Update to latest version
- Verify JSON configuration syntax: Use a JSON validator

### Deny Rules Not Respected

**GitHub Issues:**
- #1453: Git commit permission prompt appears repeatedly
- #10256: Claude Code still runs git commands even when denied

**Problem:**
- Deny rules in settings.json sometimes ignored
- Git commands execute despite being in deny list

**Workarounds:**
- Use `.claude/settings.local.json` instead of `.claude/settings.json`
- Be more specific with deny patterns: `"Bash(git commit:*)"` not `"Bash(git commit)"`
- Combine with MCP server solution (deny direct access, provide controlled alternative)

---

## 9. Production-Grade Configuration Template

This is a comprehensive configuration that implements all safety patterns discussed above.

### Project Structure

```
project-root/
├── .claude/
│   ├── settings.json                 # Project-level settings
│   ├── settings.local.json           # Local overrides (git-ignored)
│   ├── hooks/
│   │   ├── validate-bash.py          # PreToolUse: Bash validation
│   │   ├── quality-check.py          # PostToolUse: Code quality
│   │   ├── quality-gate.sh           # Stop: End-of-turn verification
│   │   └── session-init.sh           # SessionStart: Environment setup
│   └── agents/
│       ├── code-reviewer.md          # Review subagent
│       ├── test-writer.md            # Test creation subagent
│       └── security-auditor.md       # Security review subagent
└── .quality-hook.json                # Quality hook configuration
```

### .claude/settings.json

```json
{
  "allow": [
    "Read",
    "Glob",
    "Grep",
    "Bash(npm run lint)",
    "Bash(npm run test:*)",
    "Bash(pnpm type:check)",
    "Bash(pnpm install)",
    "Bash(cargo check)",
    "Bash(cargo test)",
    "Bash(git status)",
    "Bash(git diff)",
    "Bash(git diff:*)",
    "Bash(git add:*)",
    "Bash(git log:*)"
  ],
  "deny": [
    "Bash(git commit:*)",
    "Bash(git push:*)",
    "Bash(git reset:*)",
    "Bash(rm:*)",
    "Bash(curl:*)",
    "Bash(wget:*)",
    "Bash(chmod 777:*)",
    "Bash(sudo:*)"
  ],
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-bash.py",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "tdd-guard",
            "timeout": 10000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-check.py",
            "timeout": 30000
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.sh",
            "timeout": 120000
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-init.sh"
          }
        ]
      }
    ]
  }
}
```

### .claude/hooks/validate-bash.py

```python
#!/usr/bin/env python3
"""
PreToolUse hook to validate and block dangerous bash commands.
Returns exit code 2 to block execution.
"""
import json
import sys
import re

def main():
    # Read hook input
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    command = tool_input.get('command', '')

    # Dangerous patterns that should always be blocked
    dangerous_patterns = [
        (r'rm\s+.*-[rf]', 'Recursive file deletion'),
        (r'sudo\s+rm', 'Sudo file deletion'),
        (r'chmod\s+777', 'Dangerous permission change'),
        (r'>\s*/etc/', 'Writing to system directories'),
        (r'git\s+commit\s+--no-verify', 'Bypassing git hooks'),
        (r'git\s+push\s+(-f|--force)', 'Force pushing'),
        (r'npm\s+publish', 'Publishing to npm'),
        (r'docker\s+run.*--privileged', 'Privileged docker container'),
    ]

    # Check for dangerous patterns
    issues = []
    for pattern, description in dangerous_patterns:
        if re.search(pattern, command, re.IGNORECASE):
            issues.append(f"{description}: {pattern}")

    # Block if issues found
    if issues:
        print("🚫 DANGEROUS COMMAND BLOCKED", file=sys.stderr)
        print("", file=sys.stderr)
        for issue in issues:
            print(f"  • {issue}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Please revise the command to avoid these dangerous patterns.", file=sys.stderr)

        # Use JSON output for better control
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Blocked dangerous command: {', '.join(issues)}"
            }
        }
        print(json.dumps(output), file=sys.stdout)
        sys.exit(2)  # Exit code 2 = BLOCK

    # Allow safe commands
    sys.exit(0)

if __name__ == '__main__':
    main()
```

### .claude/hooks/quality-check.py

```python
#!/usr/bin/env python3
"""
PostToolUse hook to validate code quality after file edits.
Runs linters and type checkers appropriate to the file type.
"""
import json
import sys
import subprocess
from pathlib import Path

def main():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})

    # Get the file that was edited
    file_path = tool_input.get('file_path', '')
    if not file_path:
        sys.exit(0)  # No file to check

    file_path = Path(file_path)

    # Run appropriate linters based on file extension
    issues = []

    if file_path.suffix in ['.ts', '.tsx']:
        # TypeScript: Run tsc and eslint
        issues.extend(check_typescript(file_path))
    elif file_path.suffix in ['.js', '.jsx']:
        # JavaScript: Run eslint
        issues.extend(check_javascript(file_path))
    elif file_path.suffix == '.py':
        # Python: Run ruff and pyright
        issues.extend(check_python(file_path))
    elif file_path.suffix == '.rs':
        # Rust: Run cargo check and clippy
        issues.extend(check_rust())

    # Block if critical issues found
    if issues:
        print("⚠️  CODE QUALITY ISSUES DETECTED", file=sys.stderr)
        print("", file=sys.stderr)
        for issue in issues:
            print(f"  {issue}", file=sys.stderr)
        print("", file=sys.stderr)

        output = {
            "decision": "block",
            "reason": f"Code quality issues found:\n" + "\n".join(issues)
        }
        print(json.dumps(output))
        sys.exit(2)  # Block until fixed

    sys.exit(0)

def check_typescript(file_path):
    """Run TypeScript type checking and linting."""
    issues = []

    # Type check
    result = subprocess.run(
        ['pnpm', 'type:check', '--noEmit'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ TypeScript errors:\n{result.stdout}")

    # Lint
    result = subprocess.run(
        ['pnpm', 'eslint', str(file_path)],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ ESLint errors:\n{result.stdout}")

    return issues

def check_javascript(file_path):
    """Run JavaScript linting."""
    issues = []

    result = subprocess.run(
        ['pnpm', 'eslint', str(file_path)],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ ESLint errors:\n{result.stdout}")

    return issues

def check_python(file_path):
    """Run Python linting and type checking."""
    issues = []

    # Ruff check
    result = subprocess.run(
        ['ruff', 'check', str(file_path)],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ Ruff errors:\n{result.stdout}")

    # Pyright type check
    result = subprocess.run(
        ['pyright', str(file_path)],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ Pyright errors:\n{result.stdout}")

    return issues

def check_rust():
    """Run Rust checks."""
    issues = []

    # Cargo check
    result = subprocess.run(
        ['cargo', 'check'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ Cargo check errors:\n{result.stderr}")

    # Clippy
    result = subprocess.run(
        ['cargo', 'clippy', '--', '-D', 'warnings'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        issues.append(f"❌ Clippy warnings:\n{result.stderr}")

    return issues

if __name__ == '__main__':
    main()
```

### .claude/hooks/quality-gate.sh

```bash
#!/bin/bash
"""
Stop hook to enforce end-of-turn quality gates.
Runs comprehensive checks before allowing Claude to finish.
"""
set -e

echo "🔍 Running quality gate checks..." >&2

# Install dependencies if needed
if [ -f "package.json" ]; then
    pnpm install --silent --prefer-offline
fi

# Type checking
echo "  → Type checking..." >&2
if ! pnpm type:check --noEmit 2>&1 | grep -q "0 errors"; then
    echo "❌ Type checking failed" >&2
    echo "" >&2
    pnpm type:check --noEmit >&2
    exit 2  # Block until fixed
fi

# Linting
echo "  → Linting..." >&2
if ! pnpm lint 2>&1; then
    echo "❌ Linting failed" >&2
    exit 2  # Block until fixed
fi

# Tests
echo "  → Running tests..." >&2
if ! pnpm test 2>&1; then
    echo "❌ Tests failed" >&2
    exit 2  # Block until fixed
fi

# Build check (optional, can be slow)
# echo "  → Building..." >&2
# if ! pnpm build 2>&1; then
#     echo "❌ Build failed" >&2
#     exit 2  # Block until fixed
# fi

echo "✅ All quality checks passed" >&2
exit 0
```

### .claude/hooks/session-init.sh

```bash
#!/bin/bash
"""
SessionStart hook to set up the development environment.
Runs at the start of each Claude Code session.
"""

echo "🚀 Initializing Claude Code session..." >&2

# Install dependencies
if [ -f "package.json" ]; then
    echo "  → Installing npm dependencies..." >&2
    pnpm install --silent --prefer-offline
fi

if [ -f "requirements.txt" ]; then
    echo "  → Installing Python dependencies..." >&2
    pip install -q -r requirements.txt
fi

if [ -f "Cargo.toml" ]; then
    echo "  → Checking Rust toolchain..." >&2
    cargo check --quiet
fi

# Show git status
echo "  → Git status:" >&2
git status --short >&2

echo "✅ Session initialized" >&2
exit 0
```

### .claude/agents/code-reviewer.md

```markdown
---
name: code-reviewer
description: Reviews code for bugs, security issues, and quality problems
tools:
  - Read
  - Grep
  - Bash
---

# Code Reviewer Agent

You are a senior code reviewer specializing in catching bugs before they reach production.

## Your Mission

Review code with extreme thoroughness to find:

1. **Logic Errors**
   - Off-by-one errors
   - Incorrect conditionals
   - Race conditions
   - Null pointer exceptions

2. **Security Vulnerabilities**
   - SQL injection
   - XSS vulnerabilities
   - Authentication bypasses
   - Sensitive data exposure

3. **Type Safety Issues**
   - Type mismatches
   - Missing null checks
   - Incorrect type assertions
   - Generic type errors

4. **Error Handling**
   - Unhandled exceptions
   - Missing error cases
   - Silent failures
   - Incorrect error propagation

5. **Test Coverage**
   - Missing test cases
   - Edge cases not covered
   - Integration test gaps
   - E2E test requirements

## Review Process

For each file you review:

1. Read the entire file
2. Understand the context and purpose
3. Check for each category of issue above
4. Grep for common vulnerability patterns
5. Check related test files

## Output Format

Provide a structured report:

### CRITICAL ❌
Issues that WILL cause bugs or security problems in production.
**DO NOT COMMIT if critical issues exist.**

Example:
- **File:** src/auth.ts:45
- **Issue:** User input not sanitized before SQL query
- **Impact:** SQL injection vulnerability
- **Fix:** Use parameterized queries: `db.query('SELECT * FROM users WHERE id = ?', [userId])`

### WARNINGS ⚠️
Issues that should be addressed before commit.

### SUGGESTIONS 💡
Nice-to-haves for code quality improvement.

## Decision

End with one of:
- ✅ **APPROVED** - No critical issues, safe to commit
- ❌ **BLOCKED** - Critical issues found, DO NOT COMMIT

Be thorough. Missing a bug here means it goes to production.
```

### .quality-hook.json

```json
{
  "max_fix_iterations": 3,
  "timeout_seconds": 600,
  "auto_fix": {
    "enabled": true,
    "threshold": 10
  },
  "claude_code": {
    "enabled": true,
    "use_git_worktrees": true,
    "merge_strategy": "claude"
  },
  "linters": {
    "python": {
      "ruff": {
        "enabled": true,
        "auto_fix": true,
        "args": ["--fix", "--unsafe-fixes"]
      },
      "pyright": {
        "enabled": true
      }
    },
    "typescript": {
      "eslint": {
        "enabled": true,
        "auto_fix": true,
        "args": ["--fix"]
      },
      "tsc": {
        "enabled": true,
        "args": ["--noEmit"]
      }
    },
    "javascript": {
      "eslint": {
        "enabled": true,
        "auto_fix": true
      }
    },
    "rust": {
      "clippy": {
        "enabled": true,
        "args": ["--", "-D", "warnings"]
      },
      "fmt": {
        "enabled": true,
        "auto_fix": true
      }
    }
  },
  "security": {
    "path_validation": true,
    "backup_before_changes": true,
    "max_file_size_mb": 10
  }
}
```

---

## 10. Concrete Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Basic hook infrastructure with blocking capability

1. **Set Up Hook Structure**
   ```bash
   mkdir -p .claude/hooks
   mkdir -p .claude/agents
   ```

2. **Implement Bash Validation Hook**
   - Create `.claude/hooks/validate-bash.py`
   - Test with dangerous commands: `echo '{"tool_input": {"command": "rm -rf /"}}' | python3 .claude/hooks/validate-bash.py`
   - Verify exit code 2 blocks execution

3. **Configure Permission Denials**
   - Add to `.claude/settings.local.json`:
     ```json
     {
       "deny": ["Bash(git commit:*)"]
     }
     ```
   - Test that direct git commit is blocked

4. **Install Git MCP Server**
   - Clone: `git clone https://github.com/humansintheloop-dev/mcp-servers`
   - Configure in Claude Code settings
   - Test commit flow through MCP server

**Success Criteria:**
- ✅ Dangerous bash commands are blocked
- ✅ Direct git commits are blocked
- ✅ Commits work through MCP server
- ✅ Pre-commit hooks cannot be bypassed

### Phase 2: Test Enforcement (Week 2)

**Goal:** Make tests a hard blocker for commits

1. **Install TDD Guard**
   ```bash
   npm install -g tdd-guard
   # or for Python:
   pip install tdd-guard-pytest
   ```

2. **Configure Test Reporter**
   - **For Vitest:**
     ```typescript
     // vitest.config.ts
     import { defineConfig } from 'vitest/config'
     import TDDGuardReporter from 'tdd-guard-vitest'

     export default defineConfig({
       test: {
         reporters: ['default', new TDDGuardReporter()],
       },
     })
     ```

   - **For Jest:**
     ```javascript
     // jest.config.js
     module.exports = {
       reporters: ['default', 'tdd-guard-jest'],
     };
     ```

   - **For pytest:**
     ```python
     # pytest.ini
     [pytest]
     addopts = --tdd-guard
     ```

3. **Add TDD Guard Hook**
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write|Edit|MultiEdit",
           "hooks": [
             {
               "type": "command",
               "command": "tdd-guard"
             }
           ]
         }
       ]
     }
   }
   ```

4. **Test TDD Workflow**
   - Ask Claude to implement a feature WITHOUT tests (should be blocked)
   - Ask Claude to write tests first (should be allowed)
   - Ask Claude to implement after tests fail (should be allowed)

**Success Criteria:**
- ✅ Implementation blocked without failing tests
- ✅ Tests can be written before implementation
- ✅ Implementation allowed after tests fail
- ✅ Over-implementation is detected and blocked

### Phase 3: Quality Gates (Week 3)

**Goal:** Comprehensive end-of-turn verification

1. **Create Quality Gate Script**
   - Implement `.claude/hooks/quality-gate.sh`
   - Include: type checking, linting, tests, build (optional)

2. **Configure Stop Hook**
   ```json
   {
     "hooks": {
       "Stop": [
         {
           "matcher": "*",
           "hooks": [
             {
               "type": "command",
               "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.sh",
               "timeout": 120000
             }
           ]
         }
       ]
     }
   }
   ```

3. **Test Stop Hook Blocking**
   - Introduce a type error
   - Ask Claude to finish (should be blocked)
   - Verify Claude receives error feedback
   - Confirm Claude fixes the error
   - Verify Claude can finish after fix

4. **Add PostToolUse Quality Check**
   - Implement `.claude/hooks/quality-check.py`
   - Run linters on edited files immediately
   - Block if issues found

**Success Criteria:**
- ✅ Claude cannot finish with failing tests
- ✅ Claude cannot finish with type errors
- ✅ Claude cannot finish with lint errors
- ✅ Claude receives clear feedback on what to fix
- ✅ Quality checks run after every file edit

### Phase 4: Multi-Agent Verification (Week 4)

**Goal:** Independent review agents catch issues

1. **Create Review Agent**
   - Implement `.claude/agents/code-reviewer.md`
   - Define review criteria and output format

2. **Create Test Writer Agent**
   ```markdown
   ---
   name: test-writer
   description: Writes comprehensive test cases for code
   tools:
     - Read
     - Write
     - Bash
   ---

   You write thorough test cases that catch edge cases and bugs.

   For each function/component:
   1. Identify all code paths
   2. Identify edge cases
   3. Write unit tests covering all paths
   4. Write integration tests for external dependencies
   5. Verify tests fail without implementation
   ```

3. **Create Security Auditor Agent**
   ```markdown
   ---
   name: security-auditor
   description: Finds security vulnerabilities in code
   tools:
     - Read
     - Grep
     - Bash
   ---

   You are a security expert specializing in finding vulnerabilities.

   Check for:
   - SQL injection
   - XSS vulnerabilities
   - Authentication bypasses
   - Sensitive data exposure
   - CSRF vulnerabilities
   - Insecure dependencies
   ```

4. **Integrate Into Workflow**
   - Update prompt templates to always use review agent before commit
   - Create slash command: `/review` that calls review agent
   - Create slash command: `/security-audit` that calls security agent

5. **Test Multi-Agent Review**
   - Introduce a security vulnerability (SQL injection)
   - Ask Claude to implement feature
   - Verify review agent catches the vulnerability
   - Verify Claude fixes the issue
   - Verify security auditor approves

**Success Criteria:**
- ✅ Review agent catches logic errors
- ✅ Review agent catches type errors
- ✅ Security auditor catches vulnerabilities
- ✅ Test writer identifies missing test cases
- ✅ Main agent incorporates feedback from review agents

### Phase 5: Advanced Patterns (Ongoing)

**Goal:** Continuous improvement and refinement

1. **Add Cascading Quality Checks**
   - Install claude-code-quality-hook
   - Configure `.quality-hook.json`
   - Test iterative refinement (3 rounds)

2. **Implement Markdown Checklists**
   - Create templates for common tasks
   - Train Claude to use checklists for large migrations
   - Verify systematic progress through checklist

3. **Monitor and Iterate**
   - Track bugs that escape to production
   - Add new hook patterns to catch similar bugs
   - Refine agent prompts based on real failures
   - Update review criteria

4. **Measure Success**
   - Track: Bugs caught by hooks before commit
   - Track: Bugs caught by review agents
   - Track: Bugs that escape to production
   - Target: 90% reduction in production bugs

**Success Criteria:**
- ✅ Zero bugs escape basic quality gates
- ✅ Review agents catch 90%+ of remaining bugs
- ✅ Production bug rate reduced by 90%
- ✅ CI/CD pipeline failures reduced by 80%

---

## 11. Key Takeaways

### Critical Success Factors

1. **Exit Code 2 is Your Best Friend**
   - Always return exit code 2 to block bad operations
   - Feed stderr back to Claude for automatic correction
   - Don't rely on Claude to "remember" to run checks

2. **Deny Dangerous Operations Completely**
   - Block `git commit --no-verify` in Bash validation hook
   - Deny direct git commit, provide MCP server alternative
   - Deny rm, curl, sudo, chmod 777, etc.

3. **Make Tests a Hard Blocker**
   - Use TDD Guard to enforce test-first development
   - Block implementation without failing tests
   - Prevent commits when tests fail (cannot be bypassed)

4. **End-of-Turn Quality Gates are Essential**
   - Stop hook is the last line of defense
   - Run comprehensive checks: types, lints, tests, build
   - Claude cannot finish until all checks pass

5. **Use Independent Review Agents**
   - Multi-agent verification catches what single agent misses
   - Review agent has fresh perspective, distinct context
   - 90.2% improvement over single-agent approach

6. **Checklists for Large Tasks**
   - Prevents skipping steps
   - Enables systematic progress
   - Provides audit trail

### Anti-Patterns to Avoid

❌ **Relying on Claude to Remember**
- Don't ask Claude to "remember to run tests"
- Hook automation > LLM memory

❌ **Trusting Single-Agent Review**
- Single agent develops blind spots
- Always use independent verification

❌ **Allowing --no-verify Bypass**
- Git hooks can be bypassed by default
- Must block in PreToolUse hook

❌ **Weak Quality Gates**
- "Try to run tests" ≠ quality gate
- Must block on failure with exit code 2

❌ **No End-of-Turn Verification**
- Claude finishes with broken code
- Stop hook is critical final check

### The Complete Prevention Stack

```
Layer 1: PreToolUse Hooks
└─→ Block dangerous commands BEFORE execution
    └─→ Validate bash commands
    └─→ Enforce TDD (no implementation without tests)

Layer 2: Permission System
└─→ Deny dangerous operations completely
    └─→ Block direct git commit
    └─→ Block rm, curl, sudo, etc.

Layer 3: PostToolUse Hooks
└─→ Validate AFTER every file edit
    └─→ Run linters
    └─→ Run type checkers
    └─→ Block if issues found

Layer 4: Multi-Agent Review
└─→ Independent verification before commit
    └─→ Code review agent
    └─→ Security audit agent
    └─→ Test coverage agent

Layer 5: Stop Hook (Final Gate)
└─→ Comprehensive verification before finish
    └─→ Type checking
    └─→ Linting
    └─→ All tests pass
    └─→ Build succeeds
    └─→ CANNOT be bypassed

Layer 6: Git MCP Server
└─→ Controlled commit path
    └─→ Runs pre-commit hooks
    └─→ Cannot be bypassed with --no-verify
    └─→ Tests must pass to commit
```

### Expected Outcomes

With full implementation of these patterns:

- **90%+ reduction** in bugs shipped to production
- **84% reduction** in permission prompts (from sandboxing)
- **90.2% improvement** in output quality (from multi-agent)
- **Zero** commits with failing tests (hard blocked)
- **Zero** commits bypassing pre-commit hooks (denied)
- **Immediate feedback** on quality issues (every file edit)

### The Bottom Line

> **Bugs should be IMPOSSIBLE to ship, not just unlikely.**

This requires:
1. Blocking operations at multiple layers
2. Making quality checks automatic (not relying on LLM)
3. Using independent verification (multi-agent review)
4. Creating hard blockers with exit code 2
5. Denying dangerous operations completely

**The system should prevent bad code, not ask the agent to avoid it.**

---

## 12. References

### Official Anthropic Resources

1. **Claude Code Best Practices**
   - URL: https://www.anthropic.com/engineering/claude-code-best-practices
   - Key Topics: TDD, multi-agent architecture, context management, verification patterns

2. **Claude Code Hooks Reference**
   - URL: https://code.claude.com/docs/en/hooks
   - Key Topics: PreToolUse, PostToolUse, Stop hooks, exit codes, JSON decisions

3. **Safe and Trustworthy Agents Framework**
   - URL: https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents
   - Key Topics: Human control, transparency, alignment, privacy, security

4. **Claude Code Sandboxing**
   - URL: https://www.anthropic.com/engineering/claude-code-sandboxing
   - Key Topics: Filesystem isolation, network isolation, security boundaries

5. **Multi-Agent Research System**
   - URL: https://www.anthropic.com/engineering/multi-agent-research-system
   - Key Topics: Orchestrator-worker pattern, agent specialization, verification strategies

### Community Resources

6. **TDD Guard (Automated TDD Enforcement)**
   - Repository: https://github.com/nizos/tdd-guard
   - Multi-language support: TypeScript, JavaScript, Python, PHP, Go, Rust

7. **Claude Code Quality Hook**
   - Repository: https://github.com/dhofheinz/claude-code-quality-hook
   - Three-stage pipeline with iterative refinement

8. **Claude Code Hooks Mastery**
   - Repository: https://github.com/disler/claude-code-hooks-mastery
   - Comprehensive examples and patterns

9. **Allow Git Commit Considered Harmful**
   - URL: https://microservices.io/post/genaidevelopment/2025/09/10/allow-git-commit-considered-harmful.html
   - The --no-verify bypass problem and MCP server solution

### GitHub Issues (Current Bugs & Workarounds)

10. **Exit Code 2 Issues**
    - #3656: Restore Blocking Stop Command Hooks
    - #10412: Stop hooks with exit code 2 fail via plugins

11. **Permission System Issues**
    - #4362: PreToolUse hooks cannot block tool execution
    - #10256: Claude Code runs git commands despite deny rules

12. **Hook Execution Issues**
    - #6305: PreToolUse/PostToolUse hooks not executing

---

## Appendix A: Quick Start Checklist

Use this checklist to implement the essential safety patterns:

### Week 1: Foundation
- [ ] Create `.claude/hooks/` directory
- [ ] Create `.claude/agents/` directory
- [ ] Implement Bash validation hook (validate-bash.py)
- [ ] Test hook with dangerous commands
- [ ] Add deny rules to `.claude/settings.local.json`
- [ ] Block direct git commit: `"Bash(git commit:*)"`
- [ ] Install Git MCP server
- [ ] Test commit flow through MCP server
- [ ] Verify pre-commit hooks cannot be bypassed

### Week 2: Test Enforcement
- [ ] Install TDD Guard: `npm install -g tdd-guard`
- [ ] Configure test reporter (Vitest/Jest/pytest)
- [ ] Add TDD Guard hook to settings.json
- [ ] Test: Implementation blocked without failing tests
- [ ] Test: Tests allowed before implementation
- [ ] Test: Implementation allowed after tests fail

### Week 3: Quality Gates
- [ ] Create quality-gate.sh Stop hook
- [ ] Include: type checking, linting, tests
- [ ] Configure Stop hook in settings.json
- [ ] Test: Claude blocked with type errors
- [ ] Test: Claude blocked with failing tests
- [ ] Test: Claude receives clear error feedback
- [ ] Create quality-check.py PostToolUse hook
- [ ] Test: Quality checks run after file edits

### Week 4: Multi-Agent Verification
- [ ] Create code-reviewer.md agent
- [ ] Create test-writer.md agent
- [ ] Create security-auditor.md agent
- [ ] Test review agent catches logic errors
- [ ] Test security agent catches vulnerabilities
- [ ] Test test-writer identifies missing cases
- [ ] Integrate review into workflow

### Ongoing: Monitor & Improve
- [ ] Track bugs caught by hooks
- [ ] Track bugs caught by review agents
- [ ] Track bugs escaping to production
- [ ] Add new patterns based on failures
- [ ] Refine agent prompts
- [ ] Update review criteria
- [ ] Target: 90% reduction in production bugs

---

## Appendix B: Troubleshooting Guide

### Hook Not Executing

**Symptoms:**
- Hook script exists but never runs
- No output in transcript mode (Ctrl-R)

**Solutions:**
1. Make hook executable: `chmod +x .claude/hooks/my-hook.py`
2. Check shebang: `#!/usr/bin/env python3`
3. Test manually: `echo '{"tool_name": "Test"}' | .claude/hooks/my-hook.py`
4. Check Claude Code version: `claude --version` (update if old)
5. Validate JSON syntax: Use jsonlint on settings.json

### Exit Code 2 Not Blocking

**Symptoms:**
- Hook returns exit code 2
- Tool executes anyway

**Solutions:**
1. Use JSON decision control instead:
   ```python
   output = {
       "hookSpecificOutput": {
           "hookEventName": "PreToolUse",
           "permissionDecision": "deny",
           "permissionDecisionReason": "Explanation here"
       }
   }
   print(json.dumps(output))
   ```
2. Install hooks in `.claude/hooks/` not via plugins
3. Combine JSON decision with exit code 2

### Deny Rules Ignored

**Symptoms:**
- Command in deny list still executes
- Permission prompt still appears

**Solutions:**
1. Use `.claude/settings.local.json` not `.claude/settings.json`
2. Be specific: `"Bash(git commit:*)"` not `"Bash(git commit)"`
3. Add to Bash validation hook as backup:
   ```python
   if 'git commit' in command:
       sys.exit(2)  # Block it anyway
   ```

### Tests Failing But Commit Succeeds

**Symptoms:**
- Tests fail
- Claude commits anyway

**Solutions:**
1. Deny direct git commit: `"deny": ["Bash(git commit:*)"]`
2. Use Git MCP server for commits
3. Add test check to Stop hook:
   ```bash
   if ! pnpm test; then
       exit 2  # Block
   fi
   ```
4. Install TDD Guard: Blocks implementation without passing tests

### Claude Bypassing Pre-commit Hooks

**Symptoms:**
- Pre-commit hook fails
- Claude uses `git commit --no-verify`
- Broken code gets committed

**Solutions:**
1. Block in Bash validation hook:
   ```python
   if '--no-verify' in command:
       print("Cannot bypass pre-commit hooks", file=sys.stderr)
       sys.exit(2)
   ```
2. Deny direct git commit completely
3. Use Git MCP server (cannot use --no-verify)

### Stop Hook Timeout

**Symptoms:**
- Stop hook takes too long
- Claude Code shows timeout error

**Solutions:**
1. Increase timeout in settings.json:
   ```json
   {
     "hooks": {
       "Stop": [{
         "hooks": [{
           "timeout": 300000  // 5 minutes
         }]
       }]
     }
   }
   ```
2. Optimize slow operations:
   - Use `pnpm install --prefer-offline`
   - Skip build in Stop hook (too slow)
   - Run only affected tests: `pnpm test --changed`
3. Move slow checks to PostToolUse (runs per-file, faster)

---

## Appendix C: Language-Specific Examples

### TypeScript/JavaScript

**Quality Check Hook:**

```python
#!/usr/bin/env python3
import subprocess
import sys
import json

def check_typescript():
    # Type check
    result = subprocess.run(['pnpm', 'tsc', '--noEmit'], capture_output=True, text=True)
    if result.returncode != 0:
        print("TypeScript errors:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # Lint
    result = subprocess.run(['pnpm', 'eslint', '.'], capture_output=True, text=True)
    if result.returncode != 0:
        print("ESLint errors:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # Prettier
    result = subprocess.run(['pnpm', 'prettier', '--check', '.'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Prettier formatting issues:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    if not check_typescript():
        sys.exit(2)  # Block
    sys.exit(0)
```

**TDD Guard Setup (Vitest):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import TDDGuardReporter from 'tdd-guard-vitest'

export default defineConfig({
  test: {
    reporters: ['default', new TDDGuardReporter()],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
})
```

### Python

**Quality Check Hook:**

```python
#!/usr/bin/env python3
import subprocess
import sys

def check_python():
    # Ruff (linting + formatting)
    result = subprocess.run(['ruff', 'check', '.'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Ruff errors:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # Pyright (type checking)
    result = subprocess.run(['pyright'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Pyright errors:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # pytest
    result = subprocess.run(['pytest', '--tb=short'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Tests failed:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    if not check_python():
        sys.exit(2)  # Block
    sys.exit(0)
```

**TDD Guard Setup (pytest):**

```ini
# pytest.ini
[pytest]
addopts = --tdd-guard --cov=src --cov-report=term-missing --cov-fail-under=80
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

### Rust

**Quality Check Hook:**

```python
#!/usr/bin/env python3
import subprocess
import sys

def check_rust():
    # Cargo check (compilation)
    result = subprocess.run(['cargo', 'check'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Cargo check errors:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    # Clippy (linting)
    result = subprocess.run(
        ['cargo', 'clippy', '--', '-D', 'warnings'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("Clippy warnings:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    # Rustfmt (formatting)
    result = subprocess.run(
        ['cargo', 'fmt', '--', '--check'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("Rustfmt issues:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    # Tests
    result = subprocess.run(['cargo', 'test'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Tests failed:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    if not check_rust():
        sys.exit(2)  # Block
    sys.exit(0)
```

**TDD Guard Setup (Rust):**

```toml
# Cargo.toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"

[dev-dependencies]
tdd-guard = "0.1.0"

# .cargo/config.toml
[alias]
test-tdd = "test -- --report-format json | tdd-guard-rust"
```

### Go

**Quality Check Hook:**

```python
#!/usr/bin/env python3
import subprocess
import sys

def check_go():
    # Go fmt (formatting)
    result = subprocess.run(['gofmt', '-l', '.'], capture_output=True, text=True)
    if result.stdout.strip():
        print("Go formatting issues:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # Go vet (correctness)
    result = subprocess.run(['go', 'vet', './...'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Go vet errors:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return False

    # golangci-lint (comprehensive linting)
    result = subprocess.run(['golangci-lint', 'run'], capture_output=True, text=True)
    if result.returncode != 0:
        print("golangci-lint errors:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    # Tests
    result = subprocess.run(['go', 'test', './...'], capture_output=True, text=True)
    if result.returncode != 0:
        print("Tests failed:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        return False

    return True

if __name__ == '__main__':
    if not check_go():
        sys.exit(2)  # Block
    sys.exit(0)
```

**TDD Guard Setup (Go):**

```bash
# Test with TDD Guard
go test -v ./... -json | tdd-guard-go
```

---

**End of Document**

*This research compiled from official Anthropic sources and community best practices as of November 2025. For updates, see: https://www.anthropic.com/engineering/claude-code-best-practices*
