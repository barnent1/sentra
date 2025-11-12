#!/usr/bin/env python3
"""
PostToolUse Hook: Validate Test Quality

Ensures tests for UI components include proper DOM assertions,
not just mock function call checks.

Exit codes:
- 0: Test quality is acceptable
- 1: Warning (allow but report)
- 2: Block (test quality insufficient)
"""

import sys
import re
import json
from pathlib import Path

def validate_test_quality(file_path: str) -> dict:
    """Validate that test files have proper assertions"""

    # Only validate test files
    if not file_path.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
        return {"continue": True}

    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except (FileNotFoundError, IOError):
        # If file doesn't exist or can't be read, allow (might be deleted or binary)
        return {"continue": True}

    # Check if this is a UI component test
    is_ui_component = any([
        '/components/' in file_path,
        '/app/' in file_path,
        'render(<' in content,  # React Testing Library usage
    ])

    if not is_ui_component:
        # Non-UI tests don't need DOM assertions
        return {"continue": True}

    # Patterns that indicate proper DOM testing
    good_patterns = [
        r'expect\([^)]+\)\.toHaveClass',
        r'expect\([^)]+\)\.toHaveStyle',
        r'expect\([^)]+\)\.toHaveAttribute',
        r'expect\([^)]+\)\.toBeVisible',
        r'expect\([^)]+\)\.toBeInTheDocument',
        r'expect\([^)]+\)\.toHaveTextContent',
    ]

    # Patterns that indicate shallow testing
    shallow_patterns = [
        r'expect\(mock\w+\)\.toHaveBeenCalled',
        r'expect\(spy\w+\)\.toHaveBeenCalled',
    ]

    has_dom_assertions = any(re.search(pattern, content) for pattern in good_patterns)
    has_only_mocks = any(re.search(pattern, content) for pattern in shallow_patterns) and not has_dom_assertions

    if has_only_mocks:
        return {
            "continue": False,
            "systemMessage": f"""
❌ Test Quality Issue: {file_path}

This UI component test only checks mock function calls without verifying actual DOM state.

Required: Add DOM assertions like:
- expect(element).toHaveClass('expected-class')
- expect(element).toBeVisible()
- expect(element).toHaveAttribute('data-state', 'value')

Tests must verify what the user sees, not just internal function calls.
"""
        }

    if not has_dom_assertions:
        return {
            "continue": False,
            "systemMessage": f"""
⚠️ Test Quality Warning: {file_path}

This UI component test doesn't include DOM state assertions.

UI tests should verify:
- CSS classes and styles
- Element visibility
- Attributes and content
- What the user actually sees

Add assertions like toHaveClass(), toBeVisible(), toHaveAttribute().
"""
        }

    return {"continue": True}

if __name__ == '__main__':
    try:
        # Read hook context from stdin (like other hooks)
        hook_context = json.loads(sys.stdin.read())

        # Extract file path from toolInput
        tool_input = hook_context.get("toolInput", {})
        file_path = tool_input.get("file_path", "")

        # If no file path, allow
        if not file_path:
            print(json.dumps({"continue": True}))
            sys.exit(0)

        # Validate test quality
        result = validate_test_quality(file_path)

        print(json.dumps(result))

        if not result.get("continue", True):
            sys.exit(2)
        else:
            sys.exit(0)

    except Exception as e:
        # On error, allow but log
        error_result = {
            "continue": True,
            "stopReason": f"Hook error (allowing): {str(e)}",
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "error": str(e)
            }
        }
        print(json.dumps(error_result))
        sys.exit(0)
