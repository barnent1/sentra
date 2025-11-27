#!/usr/bin/env python3
"""
PostToolUse Hook: Verify File Changes

This hook validates EVERY file edit after it happens.
Checks for common issues: syntax errors, security vulnerabilities, test modifications.

Exit code 2 = BLOCKED (change will be shown to Claude with error)
"""

import sys
import json
import os
import re
import subprocess

def check_typescript_syntax(file_path):
    """
    Quick TypeScript syntax check.
    Returns (is_valid, error_message)
    """
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", "--skipLibCheck", file_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            return False, result.stdout + result.stderr
        return True, None
    except Exception as e:
        # If tsc not available, skip check
        return True, None

def check_for_security_issues(content, file_path):
    """
    Basic security checks for common vulnerabilities.
    Returns (is_safe, issues_found)
    """
    issues = []

    # Check for potential XSS (dangerouslySetInnerHTML without sanitization)
    if "dangerouslySetInnerHTML" in content:
        if "DOMPurify" not in content and "sanitize" not in content:
            issues.append("⚠️  dangerouslySetInnerHTML used without DOMPurify sanitization")

    # Check for SQL injection patterns (raw string concatenation in queries)
    sql_patterns = [
        r"query\s*=\s*['\"].*\+.*['\"]",
        r"execute\s*\(['\"].*\+.*['\"]\)"
    ]
    for pattern in sql_patterns:
        if re.search(pattern, content):
            issues.append("⚠️  Potential SQL injection - use parameterized queries")

    # Check for exposed secrets
    secret_patterns = [
        (r"api[_-]?key\s*=\s*['\"][^'\"]{20,}['\"]", "Hardcoded API key"),
        (r"password\s*=\s*['\"][^'\"]+['\"]", "Hardcoded password"),
        (r"secret\s*=\s*['\"][^'\"]{20,}['\"]", "Hardcoded secret"),
    ]
    for pattern, name in secret_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append(f"⚠️  {name} detected - use environment variables")

    # Check for eval() usage
    if re.search(r"\beval\s*\(", content):
        issues.append("⚠️  eval() usage detected - security risk")

    # Check for console.log in production code (warn only)
    if "console.log" in content and "/src/" in file_path:
        if "__tests__" not in file_path and ".test." not in file_path:
            issues.append("ℹ️  console.log found - remove before production")

    return len(issues) == 0 or all(i.startswith("ℹ️") for i in issues), issues

def check_test_modifications(file_path, tool_name):
    """
    Check if test files are being modified.
    Test files should not be modified without explicit permission.
    """
    if tool_name not in ["Write", "Edit"]:
        return True, None

    test_indicators = [".test.", ".spec.", "/__tests__/", "/tests/"]
    if any(indicator in file_path for indicator in test_indicators):
        return False, "🚫 Test files cannot be modified without explicit user permission.\n\nTests are the specification and should remain stable."

    return True, None

def check_architectural_patterns(content: str, file_path: str):
    """Check if code follows architectural patterns"""
    issues = []

    # Check SSE pattern for React components
    if file_path.endswith(('.tsx', '.jsx')):
        # Data fetching without SSE (warn only, not block)
        if re.search(r'useEffect.*fetch\(', content, re.DOTALL):
            if not any(p in content for p in ['EventSource', 'useSSE', '/stream']):
                issues.append(
                    "⚠️  Pattern suggestion: Consider using SSE pattern for reactive data. "
                    "See pattern-sse-reactive-data in .quetrex/memory/patterns.md"
                )

    # Check for 'any' type (architectural requirement)
    if file_path.endswith(('.ts', '.tsx')):
        if re.search(r':\s*any\b|<any>|\bany\[\]', content):
            issues.append(
                "❌ Pattern violation: TypeScript 'any' type not allowed. "
                "See pattern-typescript-strict in .quetrex/memory/patterns.md"
            )

    # Check for client component with async (architectural error)
    if file_path.endswith(('.tsx', '.jsx')):
        has_use_client = "'use client'" in content or '"use client"' in content
        has_async = re.search(r'export\s+default\s+async\s+function', content)
        if has_use_client and has_async:
            issues.append(
                "❌ Pattern violation: Cannot use async in client component. "
                "See pattern-client-component-boundaries in .quetrex/memory/patterns.md"
            )

    # Check API routes for Zod validation
    if file_path.endswith('route.ts') and '/api/' in file_path:
        handles_mutations = any([
            re.search(r'export\s+async\s+function\s+POST', content),
            re.search(r'export\s+async\s+function\s+PATCH', content),
            re.search(r'export\s+async\s+function\s+PUT', content),
        ])
        uses_zod = any([
            'z.object' in content,
            '.parse(' in content,
            '.safeParse(' in content,
        ])
        if handles_mutations and not uses_zod:
            issues.append(
                "❌ Pattern violation: API route must use Zod validation. "
                "See pattern-zod-validation in .quetrex/memory/patterns.md"
            )

    # Separate blocking issues from warnings
    blocking_issues = [i for i in issues if i.startswith("❌")]
    warning_issues = [i for i in issues if i.startswith("⚠️")]

    return len(blocking_issues) == 0, issues

def check_typescript_rules(content, file_path):
    """
    Check for TypeScript best practices violations.
    """
    issues = []

    # Check for 'any' type (should be explicit)
    # NOTE: This is now also checked in check_architectural_patterns
    # keeping this for backward compatibility
    if re.search(r":\s*any\b", content):
        issues.append("⚠️  'any' type used - use explicit types")

    # Check for @ts-ignore (should use @ts-expect-error instead)
    if "@ts-ignore" in content:
        issues.append("⚠️  @ts-ignore used - prefer @ts-expect-error with explanation")

    # Check for non-null assertion without comment
    non_null_pattern = r"!\s*\."
    if re.search(non_null_pattern, content):
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if re.search(non_null_pattern, line):
                # Check if there's a comment on this line or line before
                has_comment = "//" in line or (i > 0 and "//" in lines[i-1])
                if not has_comment:
                    issues.append(f"⚠️  Non-null assertion (!) without comment at line {i+1}")
                    break

    return len(issues) == 0, issues

def verify_file_change(hook_context):
    """
    Main verification logic for file changes.
    """
    tool_name = hook_context.get("toolName", "")
    tool_input = hook_context.get("toolInput", {})
    tool_result = hook_context.get("toolResult", {})

    # Only process Write and Edit operations
    if tool_name not in ["Write", "Edit"]:
        return {"continue": True}

    file_path = tool_input.get("file_path", "")

    # Skip if no file path
    if not file_path:
        return {"continue": True}

    # Check if test file is being modified
    is_valid, error = check_test_modifications(file_path, tool_name)
    if not is_valid:
        return {
            "continue": False,
            "stopReason": error,
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "validationFailed": True
            }
        }

    # Read the file content
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        # If file can't be read, allow (might be binary or deleted)
        return {"continue": True}

    issues = []

    # Check TypeScript files
    if file_path.endswith((".ts", ".tsx")):
        # TypeScript syntax check
        is_valid, error = check_typescript_syntax(file_path)
        if not is_valid:
            return {
                "continue": False,
                "stopReason": f"🚫 TypeScript syntax error:\n\n{error}",
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "validationFailed": True
                }
            }

        # TypeScript rules check
        is_valid, ts_issues = check_typescript_rules(content, file_path)
        issues.extend(ts_issues)

    # Security checks for all code files
    if file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        is_safe, security_issues = check_for_security_issues(content, file_path)
        if not is_safe:
            return {
                "continue": False,
                "stopReason": f"🚫 Security issues detected:\n\n" + "\n".join(security_issues),
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "securityIssues": security_issues
                }
            }
        issues.extend(security_issues)

    # Architectural pattern checks for all code files
    if file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        is_arch_valid, arch_issues = check_architectural_patterns(content, file_path)
        if not is_arch_valid:
            return {
                "continue": False,
                "stopReason": "🚫 Architectural violations:\n\n" + "\n".join(arch_issues),
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "architectureViolations": arch_issues
                }
            }
        issues.extend(arch_issues)

    # If only warnings (not errors), allow but log
    if issues:
        return {
            "continue": True,
            "stopReason": "\n".join(issues),
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "warnings": issues
            }
        }

    return {
        "continue": True,
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "validationPassed": True
        }
    }

def main():
    """Main entry point for hook execution."""
    try:
        # Read hook context from stdin
        hook_context = json.loads(sys.stdin.read())

        # Verify changes
        result = verify_file_change(hook_context)

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
                "hookEventName": "PostToolUse",
                "error": str(e)
            }
        }
        print(json.dumps(error_result))
        sys.exit(0)

if __name__ == "__main__":
    main()
