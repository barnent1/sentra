#!/usr/bin/env python3
"""
PreToolUse Hook: Validate Bash Commands

CRITICAL: This hook blocks dangerous bash commands BEFORE execution.
Exit code 2 = BLOCKED (command will NOT run)

Primary Purpose: Prevent git commit bypass with --no-verify
This is the ROOT CAUSE of bugs being committed despite failing hooks.
"""

import sys
import json
import re

def validate_bash_command(tool_input):
    """
    Validate bash commands and block dangerous operations.

    Returns:
        dict: Hook response with continue=False if blocked
    """
    command = tool_input.get("command", "")

    # CRITICAL: Block git commit bypass
    # Claude Code uses "git commit --no-verify" which skips ALL pre-commit hooks
    if "--no-verify" in command or " -n " in command:
        return {
            "continue": False,
            "stopReason": "🚫 Cannot bypass git hooks with --no-verify or -n flag.\n\nThis is the ROOT CAUSE of bugs being committed.\n\nUse Git MCP server for commits instead.",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny"
            }
        }

    # Block force push to main/master
    if "git push" in command and ("--force" in command or " -f " in command):
        if "main" in command or "master" in command:
            return {
                "continue": False,
                "stopReason": "🚫 Cannot force push to main/master branch.\n\nThis can destroy team members' work.",
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny"
                }
            }

    # Block interactive git commands (not supported)
    interactive_patterns = [
        r"git\s+rebase\s+-i",
        r"git\s+add\s+-i",
        r"git\s+commit\s+-i"
    ]
    for pattern in interactive_patterns:
        if re.search(pattern, command):
            return {
                "continue": False,
                "stopReason": f"🚫 Interactive git commands not supported in automation.\n\nCommand: {command}",
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny"
                }
            }

    # Block destructive file operations on critical paths
    if re.search(r"rm\s+-rf?\s+/", command):
        return {
            "continue": False,
            "stopReason": "🚫 Cannot run recursive delete on root directory.",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny"
            }
        }

    # Block modifying test files without explicit permission
    if any(op in command for op in ["rm ", "mv "]):
        if any(test in command for test in [".test.", ".spec.", "/__tests__/", "/tests/"]):
            return {
                "continue": False,
                "stopReason": "🚫 Cannot delete or move test files.\n\nTests are the specification - they should not be modified without explicit permission.",
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny"
                }
            }

    # Block modifying hook files (prevent self-modification)
    if any(op in command for op in ["rm ", "mv ", "chmod 000"]):
        if ".claude/hooks/" in command:
            return {
                "continue": False,
                "stopReason": "🚫 Cannot modify hook files.\n\nHooks are security boundaries and should not be self-modifiable.",
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny"
                }
            }

    # Allow command
    return {
        "continue": True,
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow"
        }
    }

def main():
    """Main entry point for hook execution."""
    try:
        # Read hook context from stdin
        hook_context = json.loads(sys.stdin.read())

        # Extract tool input
        tool_input = hook_context.get("toolInput", {})

        # Validate command
        result = validate_bash_command(tool_input)

        # Output result
        print(json.dumps(result))

        # Exit code 2 = BLOCKED
        if not result.get("continue", True):
            sys.exit(2)

        sys.exit(0)

    except Exception as e:
        # On error, allow but log
        error_result = {
            "continue": True,
            "stopReason": f"Hook error (allowing): {str(e)}",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "error": str(e)
            }
        }
        print(json.dumps(error_result))
        sys.exit(0)

if __name__ == "__main__":
    main()
