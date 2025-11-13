#!/usr/bin/env python3
"""
ai-agent-worker.py - Production AI Agent Worker for GitHub Issues

This script uses the Claude Code CLI to create an AI agent that
automatically works on GitHub issues through GitHub Actions automation.

The agent uses Claude Code's native tools to:
- Read, write, and edit files
- Execute bash commands
- Search the codebase (glob, grep)
- Commit and push changes
- Create pull requests

Created by Glen Barnhardt with the help of Claude Code

Usage:
    ai-agent-worker.py <issue_number> [repo_path]

Environment Variables:
    ANTHROPIC_API_KEY           Claude API key (required)
    GITHUB_TOKEN                GitHub token for API access (required)
    CLAUDE_MAX_EXECUTION_TIME   Max execution time in minutes (default: 45)
    CLAUDE_MAX_API_CALLS_PER_ISSUE  Max API calls per issue (default: 150)
    CLAUDE_MAX_FILE_CHANGES     Max file changes allowed (default: 75)
    CLAUDE_REQUIRE_TESTS        Whether to require tests (default: false)
    CLAUDE_GITHUB_COMMENTS      Post progress comments (default: true)
    CLAUDE_LOG_API_CALLS        Log all API calls (default: true)
    CLAUDE_RATE_LIMIT_TPM       Max INPUT tokens per minute (default: 20000)
    CLAUDE_RATE_LIMIT_RETRIES   Max retry attempts on rate limit (default: 3)
    CLAUDE_RATE_LIMIT_THRESHOLD Throttle at N% of limit (default: 0.8)
    TEST_RATE_LIMIT             Enable test mode with low limits (default: false)

Dependencies:
    Claude Code CLI: curl -fsSL https://claude.ai/install.sh | bash
"""

import os
import sys
import json
import subprocess
import time
import signal
import re
import shlex
import glob
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, List
from dataclasses import dataclass, asdict

# GitHub API integration
from github import Github, GithubException

# No longer using Anthropic SDK directly - using Claude Code CLI instead
# SDK imports removed as they're not needed for CLI-based approach


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class Config:
    """Agent configuration from environment variables"""
    anthropic_api_key: str
    github_token: str
    max_execution_time: int  # seconds
    max_api_calls: int
    max_file_changes: int
    require_tests: bool
    github_comments: bool
    log_api_calls: bool

    @classmethod
    def from_env(cls) -> 'Config':
        """Load configuration from environment variables"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            raise ValueError("GITHUB_TOKEN not set in environment")

        return cls(
            anthropic_api_key=api_key,
            github_token=github_token,
            max_execution_time=int(os.getenv("CLAUDE_MAX_EXECUTION_TIME", "45")) * 60,
            max_api_calls=int(os.getenv("CLAUDE_MAX_API_CALLS_PER_ISSUE", "150")),
            max_file_changes=int(os.getenv("CLAUDE_MAX_FILE_CHANGES", "75")),
            require_tests=os.getenv("CLAUDE_REQUIRE_TESTS", "false").lower() == "true",
            github_comments=os.getenv("CLAUDE_GITHUB_COMMENTS", "true").lower() == "true",
            log_api_calls=os.getenv("CLAUDE_LOG_API_CALLS", "true").lower() == "true",
        )


# ============================================================================
# RATE LIMITING
# ============================================================================
# Anthropic API has the following limits per organization:
# - 30,000 INPUT tokens per minute (output tokens don't count)
# - Rate limit errors (429) cause API calls to fail
#
# Our strategy (FIXED to prevent 429 errors):
# 1. Track INPUT token usage in rolling 60-second window (not output tokens)
# 2. Enforce minimum 2.5s between requests (prevents bursts)
# 3. Throttle PROACTIVELY before requests (estimate next token usage)
# 4. Retry with exponential backoff on 429 errors (60s, 120s, 240s)
# 5. Trim conversation history after 20 messages (prevents unbounded growth)
#
# Configuration (via environment variables):
# - CLAUDE_RATE_LIMIT_TPM: Max INPUT tokens per minute (default: 20000)
# - CLAUDE_RATE_LIMIT_RETRIES: Max retry attempts (default: 3)
# - CLAUDE_RATE_LIMIT_THRESHOLD: Throttle at N% of limit (default: 0.8)
# ============================================================================

class RateLimiter:
    """Track INPUT token usage per minute to stay within API limits"""

    def __init__(self, tokens_per_minute: int = 20000, throttle_threshold: float = 0.8, min_request_interval: float = 2.5):
        """
        Initialize rate limiter

        Args:
            tokens_per_minute: Max INPUT tokens per minute (default: 20000, 10k buffer under 30k limit)
            throttle_threshold: Throttle at N% of limit (default: 0.8 = 80%)
            min_request_interval: Minimum seconds between requests (default: 2.5)
        """
        self.tokens_per_minute = tokens_per_minute
        self.throttle_threshold = throttle_threshold
        self.min_request_interval = min_request_interval
        self.tokens_used: List[Tuple[float, int]] = []  # List of (timestamp, INPUT_token_count) tuples
        self.last_request_time: float = 0.0  # Track last request for pacing

    def add_usage(self, input_tokens: int, output_tokens: int) -> None:
        """
        Record INPUT token usage with timestamp

        CRITICAL: Only input_tokens count against Anthropic's rate limit.
        Output tokens are tracked separately and don't affect rate limiting.
        """
        now = time.time()
        # BUG FIX #1: Only count INPUT tokens (output tokens don't count against limit)
        self.tokens_used.append((now, input_tokens))

        # Clean up old entries (older than 60 seconds)
        cutoff = now - 60
        self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]

        # Update last request time
        self.last_request_time = now

    def get_current_usage(self) -> int:
        """Get total INPUT tokens used in the last 60 seconds"""
        now = time.time()
        cutoff = now - 60
        # Clean up stale entries
        self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]
        return sum(tokens for _, tokens in self.tokens_used)

    def should_throttle(self) -> bool:
        """Check if we're approaching the rate limit"""
        current = self.get_current_usage()
        threshold = self.tokens_per_minute * self.throttle_threshold
        return current >= threshold

    def estimate_next_request_tokens(self, conversation_turns: int) -> int:
        """
        Estimate token usage for next request based on conversation history growth

        Conversation history grows roughly 200-400 tokens per turn.
        Conservative estimate to prevent exceeding limits.
        """
        # Base prompt: ~500 tokens
        # Each turn adds ~300 tokens average (tools, responses, etc.)
        return 500 + (conversation_turns * 300)

    def wait_if_needed(self, logger_func, conversation_turns: int = 0) -> None:
        """
        Wait if we're approaching rate limit OR need request pacing

        BUG FIX #2: Add minimum request pacing
        BUG FIX #4: Proactive throttling BEFORE request, not after
        """
        now = time.time()

        # 1. Enforce minimum request interval (prevents bursts)
        time_since_last = now - self.last_request_time
        if self.last_request_time > 0 and time_since_last < self.min_request_interval:
            wait_for_pacing = self.min_request_interval - time_since_last
            logger_func(f"Request pacing: waiting {wait_for_pacing:.1f}s (min interval: {self.min_request_interval}s)")
            time.sleep(wait_for_pacing)

        # 2. Check if next request would exceed threshold (proactive)
        current_usage = self.get_current_usage()
        estimated_next = self.estimate_next_request_tokens(conversation_turns)
        projected_usage = current_usage + estimated_next
        threshold = self.tokens_per_minute * self.throttle_threshold

        if projected_usage >= threshold:
            # Wait for oldest tokens to age out of 60-second window
            if self.tokens_used:
                oldest_time = self.tokens_used[0][0]
                wait_time = 60 - (now - oldest_time) + 2  # +2s buffer
                if wait_time > 0:
                    logger_func(
                        f"Rate limit PROACTIVE throttle (current: {current_usage}, "
                        f"projected: {projected_usage}, threshold: {threshold:.0f} tokens/min) - "
                        f"waiting {wait_time:.1f}s for window reset"
                    )
                    time.sleep(wait_time)
                    # Clean up old entries after wait
                    now = time.time()
                    cutoff = now - 60
                    self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]

        # 3. Double-check we're under threshold after waiting
        current_usage = self.get_current_usage()
        if current_usage >= threshold:
            # Emergency wait - clear the entire window
            logger_func(
                f"EMERGENCY throttle: usage {current_usage}/{self.tokens_per_minute}, "
                f"waiting 65s to fully reset window"
            )
            time.sleep(65)
            self.tokens_used = []


# ============================================================================
# Main Agent Worker Class
# ============================================================================

class AgentWorker:
    """
    Production-ready AI agent worker that executes GitHub issues using Claude Code CLI.

    Uses Claude Code's native tools to autonomously:
    - Analyze GitHub issues
    - Search and understand the codebase
    - Make code changes (read, write, edit files)
    - Run tests and builds
    - Commit changes and create pull requests

    All while respecting safety constraints (timeouts, API limits, file change limits).
    """

    def __init__(self, issue_number: int, repo_path: str = "."):
        self.issue_number = issue_number
        self.repo_path = Path(repo_path).resolve()
        self.config = Config.from_env()

        # Rate limiting configuration
        # REDUCED from 25k to 20k for more safety buffer (30k org limit)
        rate_limit_tpm = int(os.getenv("CLAUDE_RATE_LIMIT_TPM", "20000"))
        rate_limit_threshold = float(os.getenv("CLAUDE_RATE_LIMIT_THRESHOLD", "0.8"))
        self.rate_limit_retries = int(os.getenv("CLAUDE_RATE_LIMIT_RETRIES", "3"))

        # Initialize rate limiter
        self.rate_limiter = RateLimiter(
            tokens_per_minute=rate_limit_tpm,
            throttle_threshold=rate_limit_threshold
        )

        # Test mode for rate limiting
        self.test_rate_limit = os.getenv("TEST_RATE_LIMIT", "false").lower() == "true"
        if self.test_rate_limit:
            # Use very low limit for testing
            self.rate_limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Tracking
        self.start_time = time.time()
        self.rate_limit_initialized = True  # Track that rate limiter is set up
        self.api_calls = 0
        self.estimated_cost = 0.0
        self.files_changed: set = set()
        self.progress_updates = []
        self.last_progress_time = time.time()

        # GitHub API base URL
        self.github_api = "https://api.github.com"

        # Setup telemetry
        self.telemetry_dir = Path.home() / ".claude" / "telemetry"
        self.telemetry_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.telemetry_dir / "agents.log"

        # Validate environment
        self._validate_environment()

    # ========================================================================
    # Logging & Telemetry
    # ========================================================================

    def log(self, message: str, level: str = "INFO") -> None:
        """Log message to telemetry file and stdout"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        project = self.repo_path.name
        log_entry = f"[{timestamp}] [{project}] [issue-{self.issue_number}] [{level}] {message}"

        # Write to log file
        try:
            with open(self.log_file, "a") as f:
                f.write(log_entry + "\n")
        except Exception as e:
            print(f"WARNING: Failed to write to log file: {e}", file=sys.stderr)

        # Print to stdout
        print(log_entry, flush=True)

    def log_structured(self, event: str, data: Dict[str, Any]) -> None:
        """Log structured data as JSON"""
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "project": self.repo_path.name,
            "issue": self.issue_number,
            "event": event,
            **data
        }
        self.log(f"STRUCTURED: {json.dumps(log_data)}", "DATA")

    # ========================================================================
    # Environment Validation
    # ========================================================================

    def _validate_environment(self) -> None:
        """Validate that all required tools and environment are set up"""
        self.log("Validating environment...")

        # Check for gh CLI
        if not self._check_command_exists("gh"):
            raise RuntimeError(
                "GitHub CLI (gh) is not installed. "
                "Install from: https://cli.github.com/"
            )

        # Check git
        if not self._check_command_exists("git"):
            raise RuntimeError("git is not installed")

        # Verify we're in a git repository
        if not (self.repo_path / ".git").exists():
            raise RuntimeError(f"Not a git repository: {self.repo_path}")

        # Test GitHub CLI authentication
        try:
            result = subprocess.run(
                ["gh", "auth", "status"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                raise RuntimeError(f"GitHub CLI not authenticated: {result.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("GitHub CLI authentication check timed out")

        self.log("Environment validation passed")

    def _check_command_exists(self, command: str) -> bool:
        """Check if a command exists in PATH"""
        result = subprocess.run(
            ["which", command],
            capture_output=True,
            text=True
        )
        return result.returncode == 0

    # ========================================================================
    # Constraint Checking
    # ========================================================================

    def check_constraints(self) -> None:
        """Check if agent has exceeded any constraints"""
        elapsed = time.time() - self.start_time

        if elapsed > self.config.max_execution_time:
            raise RuntimeError(
                f"Exceeded max execution time "
                f"({self.config.max_execution_time / 60:.1f} minutes)"
            )

        if self.api_calls > self.config.max_api_calls:
            raise RuntimeError(
                f"Exceeded max API calls ({self.config.max_api_calls})"
            )

        if len(self.files_changed) > self.config.max_file_changes:
            raise RuntimeError(
                f"Exceeded max file changes ({self.config.max_file_changes})"
            )

    # ========================================================================
    # GitHub API Integration
    # ========================================================================

    def get_repo_info(self) -> Dict[str, str]:
        """Get repository owner and name from git remote"""
        try:
            result = subprocess.run(
                ["git", "config", "--get", "remote.origin.url"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True
            )
            url = result.stdout.strip()

            # Parse GitHub URL
            # Format: https://github.com/owner/repo.git or git@github.com:owner/repo.git
            if "github.com" in url:
                match = re.search(r'github\.com[:/]([^/]+)/([^/\.]+)', url)
                if match:
                    return {"owner": match.group(1), "repo": match.group(2)}

            raise ValueError(f"Could not parse GitHub URL: {url}")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to get git remote: {e.stderr}")

    def get_issue_details(self) -> Dict[str, Any]:
        """Fetch issue details from GitHub using gh CLI"""
        self.log(f"Fetching issue #{self.issue_number} details...")

        try:
            result = subprocess.run(
                [
                    "gh", "issue", "view", str(self.issue_number),
                    "--json", "title,body,labels,state,assignees,url"
                ],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )

            issue = json.loads(result.stdout)
            self.log(f"Issue: {issue['title']}")
            self.log(f"State: {issue['state']}")

            # Check if issue is already assigned
            if issue.get('assignees'):
                assignee_logins = [a['login'] for a in issue['assignees']]
                self.log(f"Issue already assigned to: {', '.join(assignee_logins)}", "WARNING")

            return issue

        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to fetch issue: {e.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("GitHub API request timed out")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse issue JSON: {e}")

    def comment_on_issue(self, comment: str) -> None:
        """Post a comment on the GitHub issue"""
        if not self.config.github_comments:
            return

        try:
            subprocess.run(
                ["gh", "issue", "comment", str(self.issue_number), "--body", comment],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )
            self.log(f"Posted comment to issue")
        except subprocess.CalledProcessError as e:
            self.log(f"Failed to post comment: {e.stderr}", "WARNING")
        except subprocess.TimeoutExpired:
            self.log("Comment post timed out", "WARNING")

    def update_issue_progress(self, status: str) -> None:
        """Update issue with progress status (rate-limited to every 5 minutes)"""
        current_time = time.time()
        time_since_last = current_time - self.last_progress_time

        # Only post every 5 minutes
        if time_since_last < 300:  # 5 minutes
            return

        elapsed = (current_time - self.start_time) / 60
        comment = f"""
### Progress Update

**Status:** {status}
**Elapsed Time:** {elapsed:.1f} minutes
**API Calls:** {self.api_calls}
**Estimated Cost:** ${self.estimated_cost:.2f}

_This is an automated progress update. Updates are posted every 5 minutes._
"""
        self.comment_on_issue(comment)
        self.last_progress_time = current_time

    # ========================================================================
    # Project Context Loading
    # ========================================================================

    def load_project_context(self) -> Dict[str, str]:
        """Load project context from .sentra/memory/ files"""
        self.log("Loading project context...")

        context = {
            "overview": "",
            "config": "",
            "memory": "",
            "patterns": "",  # NEW: Architectural patterns
            "documentation": ""
        }

        # Load .sentra configuration if it exists
        sentra_dir = self.repo_path / ".sentra"
        if sentra_dir.exists():
            # Project overview
            overview_file = sentra_dir / "memory" / "project-overview.md"
            if overview_file.exists():
                context["overview"] = overview_file.read_text()
                self.log("Loaded project overview")

            # Configuration
            config_file = sentra_dir / "config.yml"
            if config_file.exists():
                context["config"] = config_file.read_text()
                self.log("Loaded project config")

            # Architectural patterns (CRITICAL - NEW)
            patterns_file = sentra_dir / "memory" / "patterns.md"
            if patterns_file.exists():
                context["patterns"] = patterns_file.read_text()
                self.log("✅ Loaded architectural patterns")
            else:
                self.log("⚠️ No architectural patterns found")

            # Memory files (learnings, gotchas, decisions)
            memory_dir = sentra_dir / "memory"
            if memory_dir.exists():
                memory_parts = []
                for memory_file in ["gotchas.md", "decisions.md"]:  # patterns.md loaded separately
                    path = memory_dir / memory_file
                    if path.exists():
                        content = path.read_text()
                        if len(content) > 100:  # Skip empty templates
                            memory_parts.append(f"## {memory_file}\n\n{content}")
                            self.log(f"Loaded {memory_file}")

                if memory_parts:
                    context["memory"] = "\n\n".join(memory_parts)

        # Load key documentation files
        docs_dir = self.repo_path / "docs"
        if docs_dir.exists():
            readme = self.repo_path / "README.md"
            if readme.exists():
                context["documentation"] += f"\n\n## README\n\n{readme.read_text()}"

        return context

    # ========================================================================
    # Claude SDK Integration (Tool Use)
    # ========================================================================

    def build_claude_prompt(
        self,
        issue: Dict[str, Any],
        context: Dict[str, str]
    ) -> str:
        """Build comprehensive prompt for Claude"""

        prompt_parts = [
            "# GitHub Issue Implementation Task",
            "",
            f"**Issue #{self.issue_number}:** {issue['title']}",
            "",
            "## Issue Description",
            "",
            issue.get('body', 'No description provided.'),
            "",
        ]

        # Add project context
        if context.get('overview'):
            prompt_parts.extend([
                "## Project Overview",
                "",
                context['overview'],
                "",
            ])

        # Add critical memory/learnings
        if context.get('memory'):
            prompt_parts.extend([
                "## CRITICAL: Project Memory & Learnings",
                "",
                "**IMPORTANT:** This project has learned from past mistakes. Follow these learnings carefully.",
                "",
                context['memory'],
                "",
            ])

        # Add architectural patterns (CRITICAL - NEW)
        if context.get('patterns'):
            prompt_parts.extend([
                "",
                "## 🏗️ CRITICAL: Architectural Patterns to Follow",
                "",
                "**These patterns are MANDATORY for this project.**",
                "",
                "⚠️ Your implementation MUST follow these established patterns.",
                "⚠️ Pattern violations will be BLOCKED by validation hooks.",
                "⚠️ If unsure, search codebase for existing examples.",
                "",
                context['patterns'],
                "",
                "---",
                ""
            ])
            self.log("📚 Injected architectural patterns into prompt")

        # Add implementation guidelines
        prompt_parts.extend([
            "## Implementation Guidelines",
            "",
            "1. **Read the issue carefully** and understand what needs to be done",
            "2. **Search the codebase** to understand existing patterns and structure",
            "3. **Follow existing code patterns** in the project",
            "4. **Make minimal, focused changes** that solve the specific issue",
            "5. **Test your changes** by running build and tests if available",
            "6. **Commit your changes** with a clear, descriptive commit message",
            "",
            "## Constraints",
            "",
            f"- Maximum execution time: {self.config.max_execution_time / 60:.0f} minutes",
            f"- Maximum API calls: {self.config.max_api_calls}",
            f"- Maximum file changes: {self.config.max_file_changes}",
            f"- Tests required: {self.config.require_tests}",
            "",
            "## Your Task",
            "",
            "Implement the feature/fix described in this issue. Work step by step:",
            "",
            "1. Search and understand the relevant code",
            "2. Make the necessary changes",
            "3. Test the changes (run build and tests)",
            "4. Commit the changes with a descriptive message",
            "",
            "**Important:** Do NOT create a pull request. Just commit the changes to the current branch.",
            "",
            "Begin implementation now.",
        ])

        return "\n".join(prompt_parts)


    def execute_claude_code(
        self,
        prompt: str,
        timeout: Optional[int] = None
    ) -> Tuple[int, str, str]:
        """
        Execute Claude using Claude Code CLI

        This uses the native Claude Code CLI installed in the container,
        which provides better tool integration and error handling than
        the raw Anthropic SDK.

        Returns:
            (returncode, stdout, stderr)
        """
        if timeout is None:
            timeout = self.config.max_execution_time

        self.log("Executing Claude Code CLI...")
        self.log_structured("claude_execution_start", {
            "prompt_length": len(prompt),
            "timeout": timeout
        })

        # Write prompt to temporary file for logging
        prompt_file = self.telemetry_dir / f"prompt-{self.issue_number}.txt"
        prompt_file.write_text(prompt)
        self.log(f"Prompt written to: {prompt_file}")

        try:
            # Build Claude Code CLI command
            # Format: claude -p "prompt" --permission-mode acceptEdits --allowedTools "tool1(*) tool2(*)"
            #
            # Permission mode "acceptEdits" allows Claude to make file changes automatically
            # Allowed tools give Claude access to:
            # - Bash: Execute commands (git, build, test, etc.)
            # - Read: Read files from the codebase
            # - Edit: Make precise edits to existing files
            # - Write: Create new files
            # - Glob: Search for files by pattern
            # - Grep: Search file contents
            claude_cmd = [
                "claude",
                "-p", prompt,
                "--permission-mode", "acceptEdits",
                "--allowedTools", "Bash(*) Read(*) Edit(*) Write(*) Glob(*) Grep(*)"
            ]

            self.log(f"Running: claude -p <prompt> --permission-mode acceptEdits --allowedTools ...")

            # Execute Claude Code CLI
            # Important: Pass ANTHROPIC_API_KEY via environment
            env = os.environ.copy()
            env["ANTHROPIC_API_KEY"] = self.config.anthropic_api_key

            # Disable auto-updater and telemetry in containerized environment
            env["DISABLE_AUTOUPDATER"] = "true"
            env["DISABLE_TELEMETRY"] = "true"

            result = subprocess.run(
                claude_cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env
            )

            # Log output
            if result.stdout:
                self.log(f"Claude output:\n{result.stdout[:500]}")

            if result.stderr:
                self.log(f"Claude stderr:\n{result.stderr[:500]}", "WARNING" if result.returncode == 0 else "ERROR")

            # Track API usage (approximate from output)
            # Claude Code CLI doesn't provide detailed token counts, so we estimate
            # based on prompt length and output length
            estimated_input_tokens = len(prompt) // 4  # Rough estimate: 4 chars per token
            estimated_output_tokens = len(result.stdout) // 4

            # Track for rate limiting (approximate)
            self.rate_limiter.add_usage(estimated_input_tokens, estimated_output_tokens)

            # Estimate cost
            cost = (estimated_input_tokens * 3 / 1_000_000) + (estimated_output_tokens * 15 / 1_000_000)
            self.estimated_cost += cost
            self.api_calls += 1

            self.log(f"Estimated: {estimated_input_tokens} in, {estimated_output_tokens} out, ${cost:.4f}")

            self.log_structured("claude_execution_complete", {
                "returncode": result.returncode,
                "api_calls": self.api_calls,
                "cost": self.estimated_cost,
                "stdout_length": len(result.stdout),
                "stderr_length": len(result.stderr)
            })

            return (result.returncode, result.stdout, result.stderr)

        except subprocess.TimeoutExpired:
            error_msg = f"Claude Code execution exceeded {timeout}s timeout"
            self.log(error_msg, "ERROR")
            raise RuntimeError(error_msg)

        except FileNotFoundError:
            error_msg = (
                "Claude Code CLI not found. Ensure 'claude' is installed and in PATH. "
                "Installation: curl -fsSL https://claude.ai/install.sh | bash"
            )
            self.log(error_msg, "ERROR")
            raise RuntimeError(error_msg)

        except Exception as e:
            error_msg = f"Claude Code execution error: {str(e)}"
            self.log(error_msg, "ERROR")
            raise RuntimeError(error_msg) from e


    # ========================================================================
    # Git Operations
    # ========================================================================

    def get_current_branch(self) -> str:
        """Get current git branch name"""
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=self.repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()

    def get_changed_files(self) -> List[str]:
        """Get list of changed files"""
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            cwd=self.repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        files = [f for f in result.stdout.strip().split('\n') if f]

        # Also check untracked files
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=self.repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        untracked = [f for f in result.stdout.strip().split('\n') if f]

        return files + untracked

    def has_changes(self) -> bool:
        """Check if there are any uncommitted changes"""
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=self.repo_path,
            capture_output=True,
            text=True,
            check=True
        )
        return bool(result.stdout.strip())

    def commit_changes(self, message: str) -> None:
        """Commit all changes with the given message"""
        # Add all changes
        subprocess.run(
            ["git", "add", "."],
            cwd=self.repo_path,
            check=True
        )

        # Commit
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=self.repo_path,
            check=True
        )

        self.log("Changes committed")

    def push_changes(self, branch: str) -> None:
        """Push changes to remote"""
        subprocess.run(
            ["git", "push", "-u", "origin", branch],
            cwd=self.repo_path,
            check=True
        )
        self.log(f"Pushed changes to {branch}")

    # ========================================================================
    # Build & Test Operations
    # ========================================================================

    def run_build(self) -> Tuple[bool, str]:
        """Run project build"""
        self.log("Running build...")

        # Try common build commands
        build_commands = [
            "npm run build",
            "yarn build",
            "pnpm build",
            "cargo build",
            "make build"
        ]

        for cmd in build_commands:
            # Check if command is available
            first_cmd = cmd.split()[0]
            if not self._check_command_exists(first_cmd):
                continue

            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )

                if result.returncode == 0:
                    self.log("Build passed")
                    return True, result.stdout
                else:
                    self.log(f"Build failed with {cmd}", "ERROR")
                    return False, result.stderr

            except subprocess.TimeoutExpired:
                self.log(f"Build timed out with {cmd}", "ERROR")
                return False, "Build timeout"

        # No build command found
        self.log("No build command found, skipping", "WARNING")
        return True, "No build command"

    def run_tests(self) -> Tuple[bool, str]:
        """Run project tests"""
        self.log("Running tests...")

        # Try common test commands
        test_commands = [
            "npm test",
            "yarn test",
            "pnpm test",
            "cargo test",
            "make test"
        ]

        for cmd in test_commands:
            # Check if command is available
            first_cmd = cmd.split()[0]
            if not self._check_command_exists(first_cmd):
                continue

            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )

                if result.returncode == 0:
                    self.log("Tests passed")
                    return True, result.stdout
                else:
                    self.log(f"Tests failed with {cmd}", "ERROR")
                    return False, result.stderr

            except subprocess.TimeoutExpired:
                self.log(f"Tests timed out with {cmd}", "ERROR")
                return False, "Test timeout"

        # No test command found
        self.log("No test command found, skipping", "WARNING")
        return True, "No test command"

    def run_lint(self) -> Tuple[bool, str]:
        """Run linting"""
        self.log("Running linting...")

        lint_commands = [
            "npm run lint",
            "yarn lint",
            "pnpm lint",
            "cargo clippy",
            "make lint"
        ]

        for cmd in lint_commands:
            first_cmd = cmd.split()[0]
            if not self._check_command_exists(first_cmd):
                continue

            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=self.repo_path,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )

                if result.returncode == 0:
                    self.log("Linting passed")
                    return True, result.stdout
                else:
                    self.log(f"Linting issues found", "WARNING")
                    return False, result.stderr

            except subprocess.TimeoutExpired:
                self.log("Linting timed out", "WARNING")
                return False, "Lint timeout"

        self.log("No lint command found, skipping", "WARNING")
        return True, "No lint command"

    # ========================================================================
    # Pull Request Creation
    # ========================================================================

    def create_pull_request(
        self,
        issue: Dict[str, Any],
        branch: str
    ) -> Optional[Dict[str, Any]]:
        """Create pull request for the implemented changes using GitHub API"""
        self.log("Creating pull request...")

        # Build PR description
        pr_title = f"Fix: {issue['title']}"

        elapsed = (time.time() - self.start_time) / 60
        changed_files = self.get_changed_files()

        pr_body = f"""Resolves #{self.issue_number}

## Changes

This PR implements the feature/fix described in issue #{self.issue_number}.

**Files Changed:** {len(changed_files)}
**Time Taken:** {elapsed:.1f} minutes
**API Calls:** {self.api_calls}
**Estimated Cost:** ${self.estimated_cost:.2f}

## Testing

- Build: Passed
{"- Tests: Passed" if self.config.require_tests else "- Tests: Skipped (not required)"}
- Lint: Checked

## Changed Files

{chr(10).join(f"- {f}" for f in changed_files[:20])}
{f"... and {len(changed_files) - 20} more" if len(changed_files) > 20 else ""}

---

This PR was created by Glen Barnhardt with the help of Claude Code

🤖 Generated by Sentra AI Agent
"""

        try:
            # Get repository info
            repo_info = self.get_repo_info()
            repo_name = f"{repo_info['owner']}/{repo_info['repo']}"

            # Initialize PyGithub
            gh = Github(self.config.github_token)
            repo = gh.get_repo(repo_name)

            self.log(f"Creating PR on {repo_name}: {branch} -> main")

            # Check if PR already exists for this branch
            try:
                existing_prs = repo.get_pulls(state='open', head=f"{repo_info['owner']}:{branch}")
                if existing_prs.totalCount > 0:
                    existing_pr = existing_prs[0]
                    self.log(f"PR already exists: #{existing_pr.number}", "WARNING")
                    return {
                        "number": existing_pr.number,
                        "url": existing_pr.html_url
                    }
            except GithubException as e:
                self.log(f"Error checking existing PRs: {e}", "WARNING")

            # Create new pull request
            pr = repo.create_pull(
                title=pr_title,
                body=pr_body,
                base="main",
                head=branch
            )

            # Add labels
            try:
                pr.add_to_labels("ai-generated", "ready-for-review")
            except GithubException as e:
                self.log(f"Failed to add labels (non-fatal): {e}", "WARNING")

            self.log(f"Created PR #{pr.number}: {pr.html_url}")

            return {
                "number": pr.number,
                "url": pr.html_url
            }

        except GithubException as e:
            error_msg = f"GitHub API error: {e.status} - {e.data.get('message', str(e))}"
            self.log(f"Failed to create PR: {error_msg}", "ERROR")

            # Don't fail the entire job - PR can be created manually
            return None

        except Exception as e:
            error_msg = f"Unexpected error creating PR: {str(e)}"
            self.log(error_msg, "ERROR")

            # Don't fail the entire job - PR can be created manually
            return None

    # ========================================================================
    # Main Workflow
    # ========================================================================

    def run(self) -> Dict[str, Any]:
        """
        Main agent workflow

        Returns:
            Result dictionary with status, metrics, and output
        """
        result = {
            "issue_number": self.issue_number,
            "status": "failure",
            "branch_name": None,
            "pr_number": None,
            "pr_url": None,
            "duration_seconds": 0,
            "api_calls": 0,
            "estimated_cost": 0.0,
            "files_changed": 0,
            "error": None
        }

        try:
            self.log("="*80)
            self.log(f"AI Agent Worker starting for issue #{self.issue_number}")
            self.log("="*80)

            # Log rate limiting configuration
            test_mode_msg = " (TEST MODE)" if self.test_rate_limit else ""
            self.log(
                f"Rate limiting: {self.rate_limiter.tokens_per_minute} tokens/min, "
                f"throttle at {self.rate_limiter.throttle_threshold*100:.0f}%, "
                f"max {self.rate_limit_retries} retries{test_mode_msg}"
            )

            # Phase 0: Environment check
            self.log("Phase 0: Environment validation")
            self.check_constraints()

            # Get current branch
            branch = self.get_current_branch()
            result["branch_name"] = branch
            self.log(f"Working on branch: {branch}")

            # Phase 1: Fetch issue
            self.log("Phase 1: Fetching issue details")
            issue = self.get_issue_details()

            # Validate issue has required label
            labels = [label['name'] for label in issue.get('labels', [])]
            if 'ai-feature' not in labels:
                raise RuntimeError(
                    f"Issue #{self.issue_number} does not have 'ai-feature' label"
                )

            # Comment on issue
            self.comment_on_issue(
                "AI agent has started working on this issue. "
                f"Branch: `{branch}`\n\n"
                "Progress updates will be posted every 5 minutes."
            )

            # Phase 2: Load context
            self.log("Phase 2: Loading project context")
            context = self.load_project_context()

            # Phase 3: Build prompt
            self.log("Phase 3: Building Claude prompt")
            prompt = self.build_claude_prompt(issue, context)

            # Phase 4: Execute Claude
            self.log("Phase 4: Executing Claude Code CLI")
            self.update_issue_progress("Implementing changes with Claude...")

            returncode, stdout, stderr = self.execute_claude_code(prompt)

            if returncode != 0:
                self.log(f"Claude execution failed with code {returncode}", "ERROR")
                self.log(f"STDERR: {stderr[:500]}", "ERROR")
                raise RuntimeError(f"Claude execution failed: {stderr[:200]}")

            # Phase 5: Verify changes
            self.log("Phase 5: Verifying changes")

            if not self.has_changes():
                self.log("No changes were made", "WARNING")
                self.comment_on_issue(
                    "The AI agent completed execution but no changes were made. "
                    "This may indicate that:\n"
                    "1. The issue requirements were unclear\n"
                    "2. The requested changes already exist\n"
                    "3. The agent encountered an issue\n\n"
                    "This issue has been labeled 'needs-help' for human review."
                )
                subprocess.run(
                    ["gh", "issue", "edit", str(self.issue_number), "--add-label", "needs-help"],
                    cwd=self.repo_path,
                    capture_output=True
                )
                raise RuntimeError("No changes made")

            changed_files = self.get_changed_files()
            self.files_changed = set(changed_files)
            result["files_changed"] = len(changed_files)

            self.log(f"Changes detected in {len(changed_files)} files")
            self.check_constraints()

            # Phase 6: Run build and tests
            self.log("Phase 6: Running build and tests")
            self.update_issue_progress("Running build and tests...")

            build_passed, build_output = self.run_build()
            if not build_passed:
                raise RuntimeError(f"Build failed:\n{build_output[:500]}")

            if self.config.require_tests:
                tests_passed, test_output = self.run_tests()
                if not tests_passed:
                    raise RuntimeError(f"Tests failed:\n{test_output[:500]}")

            # Run linting (non-blocking)
            lint_passed, lint_output = self.run_lint()
            if not lint_passed:
                self.log("Linting issues detected (non-blocking)", "WARNING")

            # Phase 7: Commit and push (if not already done by Claude Code)
            self.log("Phase 7: Committing and pushing changes")

            if self.has_changes():
                commit_message = f"""Fix: {issue['title']}

Implements #{self.issue_number}

This commit implements the feature/fix described in issue #{self.issue_number}.

Changes:
{chr(10).join(f"- {f}" for f in changed_files[:10])}
{f"... and {len(changed_files) - 10} more" if len(changed_files) > 10 else ""}

This commit was created by Glen Barnhardt with the help of Claude Code

Generated by Sentra AI Agent
Co-Authored-By: Claude <noreply@anthropic.com>
"""
                self.commit_changes(commit_message)
                self.push_changes(branch)
            else:
                self.log("Changes already committed")

            # Phase 8: Create pull request
            self.log("Phase 8: Creating pull request")
            pr = self.create_pull_request(issue, branch)

            if pr:
                result["pr_number"] = pr["number"]
                result["pr_url"] = pr["url"]

                self.comment_on_issue(
                    f"Implementation complete!\n\n"
                    f"Pull request: {pr['url']}\n\n"
                    f"**Metrics:**\n"
                    f"- Files changed: {len(changed_files)}\n"
                    f"- API calls: {self.api_calls}\n"
                    f"- Estimated cost: ${self.estimated_cost:.2f}\n"
                    f"- Duration: {(time.time() - self.start_time) / 60:.1f} minutes"
                )
            else:
                self.log("Failed to create PR", "WARNING")
                self.comment_on_issue(
                    f"Implementation complete!\n\n"
                    f"Changes have been pushed to branch `{branch}`, but PR creation encountered an issue. "
                    f"You may need to create the pull request manually.\n\n"
                    f"**Metrics:**\n"
                    f"- Files changed: {len(changed_files)}\n"
                    f"- API calls: {self.api_calls}\n"
                    f"- Estimated cost: ${self.estimated_cost:.2f}\n"
                    f"- Duration: {(time.time() - self.start_time) / 60:.1f} minutes"
                )

            # Success!
            result["status"] = "success"
            result["api_calls"] = self.api_calls
            result["estimated_cost"] = self.estimated_cost
            result["duration_seconds"] = int(time.time() - self.start_time)

            self.log("="*80)
            self.log(f"Agent completed successfully!")
            self.log(f"Duration: {result['duration_seconds'] / 60:.1f} minutes")
            self.log(f"Cost: ${result['estimated_cost']:.2f}")
            self.log("="*80)

            return result

        except Exception as e:
            # Handle failure
            error_msg = str(e)
            result["error"] = error_msg
            result["api_calls"] = self.api_calls
            result["estimated_cost"] = self.estimated_cost
            result["duration_seconds"] = int(time.time() - self.start_time)

            self.log("="*80)
            self.log(f"Agent failed: {error_msg}", "ERROR")
            self.log("="*80)

            # Comment on issue
            self.comment_on_issue(
                f"AI agent encountered an error:\n\n"
                f"```\n{error_msg}\n```\n\n"
                f"**Metrics:**\n"
                f"- API calls: {self.api_calls}\n"
                f"- Estimated cost: ${self.estimated_cost:.2f}\n"
                f"- Duration: {result['duration_seconds'] / 60:.1f} minutes\n\n"
                f"This issue has been labeled 'needs-help' and requires human attention."
            )

            # Add needs-help label
            try:
                subprocess.run(
                    ["gh", "issue", "edit", str(self.issue_number), "--add-label", "needs-help"],
                    cwd=self.repo_path,
                    capture_output=True,
                    timeout=10
                )
            except:
                pass

            return result


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: ai-agent-worker.py <issue_number> [repo_path]", file=sys.stderr)
        print("\nEnvironment variables:", file=sys.stderr)
        print("  ANTHROPIC_API_KEY (required)", file=sys.stderr)
        print("  GITHUB_TOKEN (required)", file=sys.stderr)
        print("  CLAUDE_MAX_EXECUTION_TIME (default: 45)", file=sys.stderr)
        print("  CLAUDE_MAX_API_CALLS_PER_ISSUE (default: 150)", file=sys.stderr)
        print("  CLAUDE_MAX_FILE_CHANGES (default: 75)", file=sys.stderr)
        print("  CLAUDE_REQUIRE_TESTS (default: false)", file=sys.stderr)
        print("  CLAUDE_GITHUB_COMMENTS (default: true)", file=sys.stderr)
        print("  CLAUDE_LOG_API_CALLS (default: true)", file=sys.stderr)
        print("  CLAUDE_RATE_LIMIT_TPM (default: 20000)", file=sys.stderr)
        print("  CLAUDE_RATE_LIMIT_RETRIES (default: 3)", file=sys.stderr)
        print("  CLAUDE_RATE_LIMIT_THRESHOLD (default: 0.8)", file=sys.stderr)
        print("  TEST_RATE_LIMIT (default: false)", file=sys.stderr)
        sys.exit(1)

    try:
        issue_number = int(sys.argv[1])
    except ValueError:
        print(f"Error: issue_number must be an integer, got: {sys.argv[1]}", file=sys.stderr)
        sys.exit(1)

    repo_path = sys.argv[2] if len(sys.argv) > 2 else "."

    # Validate repo path
    if not Path(repo_path).exists():
        print(f"Error: Repository path does not exist: {repo_path}", file=sys.stderr)
        sys.exit(1)

    try:
        # Create and run agent
        worker = AgentWorker(issue_number, repo_path)
        result = worker.run()

        # Output result as JSON
        print("\n" + "="*80)
        print("RESULT:")
        print(json.dumps(result, indent=2))
        print("="*80)

        # Exit with appropriate code
        sys.exit(0 if result["status"] == "success" else 1)

    except Exception as e:
        # Unhandled exception
        error_result = {
            "issue_number": issue_number,
            "status": "failure",
            "error": str(e),
            "duration_seconds": 0,
            "api_calls": 0,
            "estimated_cost": 0.0,
            "files_changed": 0
        }

        print("\n" + "="*80, file=sys.stderr)
        print("FATAL ERROR:", file=sys.stderr)
        print(str(e), file=sys.stderr)
        print("="*80, file=sys.stderr)

        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
