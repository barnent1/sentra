# Agent Worker Architecture: Why Claude Code CLI

**Decision Date:** 2025-11-13
**Decision Maker:** Glen Barnhardt with help from Claude Code
**Status:** Active Architecture Decision

---

## Executive Summary

Sentra uses **Claude Code CLI** as the agent execution engine for GitHub issue automation, NOT direct Anthropic SDK calls. This document explains why this architectural decision was made and why it must not be reversed.

## The Decision

**We use Claude Code CLI (`claude` command) to execute GitHub issues, NOT the Anthropic Python SDK.**

### What This Means

```python
# ❌ WRONG: Direct SDK approach (what we migrated away from)
from anthropic import Anthropic

client = Anthropic(api_key=api_key)
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": prompt}],
    tools=custom_tools  # We build our own tools
)

# ✅ CORRECT: Claude Code CLI approach (what we actually use)
import subprocess

result = subprocess.run(
    ["claude", "--prompt", prompt_file],
    cwd=repo_path,
    capture_output=True,
    text=True
)
```

---

## Why Claude Code CLI?

### 1. Evolving Platform with Continuous Improvements

**Problem:** The AI assistant landscape evolves rapidly. New features, tools, and capabilities are released constantly.

**Solution:** Claude Code is Anthropic's official CLI that receives regular updates:

- **New tools added automatically** - As Anthropic adds new capabilities (extended thinking, computer use, etc.), Claude Code CLI automatically includes them
- **Performance optimizations** - Context caching, streaming improvements, rate limiting enhancements
- **Security updates** - Prompt injection defenses, sandbox improvements
- **Bug fixes** - Issues discovered in production are fixed centrally

**Example:**
- **Nov 2024:** Claude Code added extended thinking mode for complex reasoning
- **Our benefit:** Agents automatically got better at architectural decisions without code changes
- **If we used SDK:** Would need to manually implement, test, and deploy new feature

**Key Point:** We automatically benefit from Anthropic's continuous investment in Claude Code without touching our codebase.

---

### 2. Built-in Agent Ecosystem

**Problem:** Different types of tasks require different agent specializations. A single agent has "tunnel vision" and misses issues.

**Solution:** Claude Code provides a complete agent ecosystem in `.claude/agents/`:

```
.claude/agents/
├── orchestrator.md          # Plans and coordinates multi-step tasks
├── test-writer.md           # Writes comprehensive test suites
├── implementation.md        # Implements features following patterns
├── code-reviewer.md         # Reviews code for bugs and issues
├── test-runner.md           # Runs and validates test results
├── security-auditor.md      # Audits for security vulnerabilities
├── architecture-advisor.md  # Ensures architectural consistency
└── refactoring-agent.md     # Safely refactors code
```

**Multi-Agent Workflow (from CLAUDE.md):**
1. Orchestrator creates plan → gets user approval
2. Orchestrator spawns test-writer → writes tests FIRST
3. Orchestrator spawns implementation → makes tests pass
4. Orchestrator spawns code-reviewer → finds bugs
5. Orchestrator spawns test-runner → verifies all pass
6. (Optional) Orchestrator spawns security-auditor for sensitive code

**Impact:** "Single agents get tunnel vision. Multi-agent review catches 90.2% more issues." (CLAUDE.md line 305)

**If we used SDK:** Would need to build our own agent coordination system, agent prompts, task delegation logic, etc.

---

### 3. Quality Enforcement Hooks

**Problem:** Agents can make mistakes - introduce bugs, bypass tests, use dangerous commands, commit broken code.

**Solution:** Claude Code has a sophisticated hook system that validates agent actions:

#### Hook Types

**PreToolUse Hooks** - Run BEFORE dangerous operations:
- `validate-bash.py` - Blocks dangerous commands (`rm -rf`, `git --no-verify`, credential exposure)
- Prevents agent from bypassing quality checks
- Catches security issues before they happen

**PostToolUse Hooks** - Run AFTER file changes:
- `verify-changes.py` - Validates file edits
- Checks TypeScript syntax
- Detects security anti-patterns
- Can REVERT changes if validation fails

**Stop Hooks** - Run when agent tries to finish:
- `quality-gate.sh` - Comprehensive quality gate
- TypeScript type checking
- ESLint (0 errors, 0 warnings)
- Tests with coverage thresholds
- Build verification
- Security audit
- **Agent CANNOT finish until all checks pass**

#### Hook Architecture (from CLAUDE.md)

```
Agent wants to run command/edit file
    ↓
PreToolUse Hook (BLOCKS if dangerous)
    ↓
If allowed → Command executes
    ↓
PostToolUse Hook (REVERTS if invalid)
    ↓
Agent continues working
    ↓
... many iterations ...
    ↓
Agent tries to finish
    ↓
Stop Hook (BLOCKS if quality fails)
    ↓
If all checks pass → Agent finishes
If any check fails → Agent must fix issues
```

**From CLAUDE.md (lines 360-371):**
> "This project uses the Perfect Agentic Structure:
> - 6-layer defense system prevents bugs from being committed
> - PreToolUse hooks BLOCK dangerous operations (git --no-verify)
> - PostToolUse hooks VALIDATE every file change
> - Stop hook is UNBYPASSABLE - runs comprehensive quality gate
>
> The 9-month bug pain will NEVER happen again because:
> 1. Git bypass is blocked at 3 layers (settings, hook, MCP)
> 2. Tests must be written FIRST (enforced by workflow)
> 3. Multi-agent review catches issues single agent misses
> 4. Stop hook prevents finishing until ALL checks pass
> 5. CI/CD enforces quality gates (cannot be bypassed)"

**If we used SDK:** Would need to build our own hook system, validation logic, quality gates, etc.

---

### 4. Comprehensive Tool Integration

**Problem:** Agents need to read files, write code, search codebases, run builds, execute tests, create PRs, etc.

**Solution:** Claude Code provides battle-tested tools optimized for software development:

- **Read** - Read any file with proper error handling
- **Write** - Create files with validation
- **Edit** - Make precise find/replace edits
- **Bash** - Execute shell commands safely
- **Glob** - Fast file pattern matching
- **Grep** - Powerful codebase search (ripgrep)
- **TodoWrite** - Task tracking and progress updates
- **NotebookEdit** - Jupyter notebook support
- **WebFetch** - Fetch and analyze web content
- **WebSearch** - Search the web for current information

**Key Benefits:**
- **Optimized for codebase work** - Not generic API tools
- **Error handling built-in** - Handles edge cases we'd miss
- **Context management** - Automatically manages conversation history
- **Rate limiting** - Built-in throttling to prevent 429 errors
- **Timeouts** - Prevents hung operations

**If we used SDK:** Would need to implement all these tools ourselves, handle all edge cases, manage errors, etc.

---

### 5. Automatic Context Management

**Problem:** Large codebases generate massive context. Without proper management, you hit token limits and fail.

**Solution:** Claude Code automatically manages context:

- **Smart truncation** - Keeps relevant context, drops old messages
- **Context caching** - Reuses common context (CLAUDE.md, project structure)
- **Conversation history trimming** - Prevents unbounded growth
- **Tool result summarization** - Large outputs are summarized

**From ai-agent-worker.py (lines 977-981):**
```python
# Claude Code handles this automatically
# We would need to manually implement:
# - Trim conversation after N messages
# - Cache project context
# - Summarize large tool outputs
# - Manage token budgets
```

**If we used SDK:** Would need to manually track tokens, trim history, implement caching, etc.

---

### 6. Proven Reliability

**Problem:** Building a production-ready agent system is HARD. There are countless edge cases.

**Solution:** Claude Code is Anthropic's official, battle-tested CLI:

- **Used by thousands** - Production-proven across many projects
- **Edge cases handled** - File encoding issues, permission errors, network failures
- **Rate limit handling** - Automatic retries with exponential backoff
- **Error recovery** - Graceful degradation when things go wrong

**If we used SDK:** Would hit all these edge cases ourselves and need to fix them one by one.

---

## What We DON'T Use Direct SDK For

### ❌ Building Our Own Tool Execution System

**DON'T:**
```python
def execute_tool(tool_name, tool_input):
    if tool_name == "read_file":
        # Handle file reading
        # Handle errors
        # Handle encoding
        # Handle permissions
        # ...
    elif tool_name == "write_file":
        # Handle file writing
        # Create directories
        # Handle permissions
        # ...
```

**Claude Code handles all of this.**

---

### ❌ Reimplementing File Operations

**DON'T:**
```python
def read_file(path):
    try:
        with open(path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "Error: File not found"
    except PermissionError:
        return "Error: Permission denied"
    # ... 20 more edge cases
```

**Claude Code's Read tool is already production-hardened.**

---

### ❌ Creating Conversation Loops from Scratch

**DON'T:**
```python
while True:
    response = client.messages.create(...)
    if response.stop_reason == "end_turn":
        break
    elif response.stop_reason == "tool_use":
        # Execute tools
        # Build tool results
        # Continue conversation
        # ...
```

**Claude Code manages the conversation loop for us.**

---

### ❌ Managing Context Windows Manually

**DON'T:**
```python
def trim_conversation(messages, max_tokens):
    # Count tokens
    # Drop old messages
    # Keep system context
    # Preserve important context
    # ...
```

**Claude Code does this automatically.**

---

## What We DO Use Claude Code For

### ✅ Execute GitHub Issues Through Claude Code CLI

**DO:**
```python
# In ai-agent-worker.py
def execute_claude_code(self, prompt: str) -> Tuple[int, str, str]:
    """Execute Claude using Claude Code CLI"""

    # Write prompt to file
    prompt_file = self.telemetry_dir / f"prompt-{self.issue_number}.txt"
    prompt_file.write_text(prompt)

    # Execute Claude Code
    result = subprocess.run(
        ["claude", "--prompt", str(prompt_file)],
        cwd=self.repo_path,
        capture_output=True,
        text=True,
        timeout=self.config.max_execution_time
    )

    return (result.returncode, result.stdout, result.stderr)
```

---

### ✅ Let Claude Use Specialized Agents via `/task` Command

**DO:**
```markdown
# In the prompt we give Claude
Your task is to implement this feature.

You have access to specialized agents:
- Use `/task orchestrator` for complex multi-step features
- Use `/task test-writer` to write comprehensive tests
- Use `/task code-reviewer` to review your changes

Follow the multi-agent workflow for best results.
```

**Claude Code automatically routes to the right agent.**

---

### ✅ Leverage Hooks for Quality Enforcement

**DO:**
```bash
# .claude/hooks/hooks.json
{
  "hooks": {
    "PreToolUse": [
      {
        "name": "validate-bash",
        "command": ["python3", ".claude/hooks/validate-bash.py"],
        "blocking": true
      }
    ],
    "PostToolUse": [
      {
        "name": "verify-changes",
        "command": ["python3", ".claude/hooks/verify-changes.py"],
        "blocking": true
      }
    ],
    "Stop": [
      {
        "name": "quality-gate",
        "command": ["bash", ".claude/hooks/quality-gate.sh"],
        "blocking": true
      }
    ]
  }
}
```

**These hooks run automatically - no SDK integration needed.**

---

### ✅ Benefit from Future Claude Code Improvements

**DO:**
- Keep Claude Code CLI updated (`npm install -g @anthropic-ai/claude`)
- Automatically get new features
- Automatically get performance improvements
- Automatically get security updates

**DON'T:**
- Lock ourselves to a specific SDK version
- Miss out on platform improvements
- Need to manually implement new features

---

## The Mistake We Made (And Won't Repeat)

### What Happened

On 2025-11-13, we migrated from Claude Code CLI to the Anthropic Python SDK because:
1. We thought we'd have "more control"
2. We thought we could build a "better" tool system
3. We underestimated the complexity of the Claude Code ecosystem

### Why It Was Wrong

1. **Lost agent ecosystem** - No more specialized agents
2. **Lost quality hooks** - No more automatic validation
3. **Lost automatic updates** - Stuck maintaining custom code
4. **Increased complexity** - 1700+ lines of tool execution code
5. **More bugs** - Hit edge cases Claude Code already handles

### The Fix

**Revert to Claude Code CLI immediately.** (This is being done now)

---

## Implementation

### Current Architecture

See `.claude/scripts/ai-agent-worker.py` for the complete implementation.

**Key components:**

1. **Prompt Builder** - Constructs comprehensive prompt from issue + context
2. **Claude Code Executor** - Invokes `claude` CLI with prompt
3. **Result Handler** - Processes stdout/stderr from Claude
4. **Quality Gates** - Hooks run automatically via Claude Code
5. **PR Creator** - Uses `gh` CLI after Claude finishes

### How It Works

```
GitHub Issue Created (ai-feature label)
    ↓
GitHub Actions Workflow Triggered
    ↓
Docker Container Starts
    ↓
ai-agent-worker.py runs:
    1. Fetch issue details
    2. Load project context
    3. Build comprehensive prompt
    4. Execute: claude --prompt prompt.txt
    ↓
Claude Code CLI runs:
    - Uses specialized agents as needed
    - Runs PreToolUse hooks before commands
    - Runs PostToolUse hooks after edits
    - Runs Stop hook before finishing
    ↓
Agent finishes (all quality checks pass)
    ↓
ai-agent-worker.py continues:
    5. Verify changes exist
    6. Run build
    7. Run tests (if required)
    8. Commit changes
    9. Push branch
    10. Create pull request
    ↓
PR Created for Human Review
```

---

## Migration Path (DO NOT DO THIS)

**If you're thinking about migrating to direct SDK:**

### ❌ DON'T

You would need to:
1. Implement all tools (Read, Write, Edit, Bash, Glob, Grep, etc.)
2. Handle all edge cases (permissions, encoding, timeouts, etc.)
3. Build conversation loop with proper stop reasons
4. Implement context management (trimming, caching)
5. Build agent coordination system
6. Recreate quality hooks integration
7. Handle rate limiting (429 errors)
8. Implement proper error recovery
9. Test all edge cases
10. Maintain all of this code forever

**Estimated effort:** 2-4 weeks of development + ongoing maintenance

**Benefit:** "More control" (which you don't actually need)

**Cost:** All the benefits of Claude Code ecosystem (agents, hooks, updates)

### ✅ DO

**Keep using Claude Code CLI.**

You get all of this for free:
- Agent ecosystem
- Quality hooks
- Tool integration
- Context management
- Rate limiting
- Error recovery
- Continuous updates
- Battle-tested reliability

**Estimated effort:** 0 hours

**Benefit:** Focus on your actual product, not building infrastructure

---

## Decision Criteria for Future

**When should we consider direct SDK?**

ONLY if ALL of the following are true:
1. ✅ Claude Code CLI is fundamentally incompatible with our use case
2. ✅ We've exhausted all configuration options in Claude Code
3. ✅ We've reached out to Anthropic and confirmed no solution exists
4. ✅ We're willing to lose the agent ecosystem
5. ✅ We're willing to lose quality hooks
6. ✅ We're willing to lose automatic updates
7. ✅ We have 2-4 weeks to build and test custom infrastructure
8. ✅ We have resources for ongoing maintenance
9. ✅ The benefits CLEARLY outweigh the massive costs

**Spoiler:** This will almost never happen.

---

## References

- **Claude Code Documentation:** https://docs.claude.com/claude-code
- **Agent Ecosystem:** `/Users/barnent1/Projects/sentra/.claude/agents/`
- **Quality Hooks:** `/Users/barnent1/Projects/sentra/.claude/hooks/`
- **Implementation:** `/Users/barnent1/Projects/sentra/.claude/scripts/ai-agent-worker.py`
- **Project Context:** `/Users/barnent1/Projects/sentra/CLAUDE.md`

---

## Conclusion

**Use Claude Code CLI. Don't migrate to SDK.**

The Claude Code ecosystem (agents, hooks, tools, updates) is far more valuable than the "control" of using the SDK directly. We made this mistake once. We won't make it again.

---

**Document Owner:** Glen Barnhardt with help from Claude Code
**Last Updated:** 2025-11-13
**Status:** Active Architecture Decision
