#!/usr/bin/env python3.11
"""
Phase 1 Docker Containerization Verification Script

This script verifies that all Phase 1 security features are working correctly:
1. Python 3.11 and anthropic package
2. GitHub CLI availability
3. File system access (read project files)
4. Security constraints (non-root user, appropriate permissions)

Created by: Glen Barnhardt with Claude Code
"""

import sys
import os
import subprocess
import json
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_check(name, passed, details=""):
    """Print a check result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"    {details}")

def main():
    """Run all verification checks"""
    print_header("Phase 1 Docker Containerization Verification")

    results = {
        "python": False,
        "anthropic": False,
        "github_cli": False,
        "file_access": False,
        "security": False
    }

    # Check 1: Python version
    print_header("Check 1: Python Environment")
    try:
        version = sys.version
        print_check("Python 3.11", "3.11" in version, version.split()[0])
        results["python"] = "3.11" in version
    except Exception as e:
        print_check("Python 3.11", False, str(e))

    # Check 2: Anthropic package
    print_header("Check 2: Anthropic SDK")
    try:
        import anthropic
        version = anthropic.__version__
        print_check("Anthropic package import", True, f"version {version}")
        results["anthropic"] = True
    except ImportError as e:
        print_check("Anthropic package import", False, str(e))

    # Check 3: GitHub CLI
    print_header("Check 3: GitHub CLI")
    try:
        result = subprocess.run(
            ["gh", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print_check("GitHub CLI (gh)", True, version_line)
            results["github_cli"] = True
        else:
            print_check("GitHub CLI (gh)", False, "Command failed")
    except FileNotFoundError:
        print_check("GitHub CLI (gh)", False, "gh command not found")
    except Exception as e:
        print_check("GitHub CLI (gh)", False, str(e))

    # Check 4: File system access
    print_header("Check 4: File System Access")
    try:
        # Check if we can read project files
        readme_path = Path("/home/claude-agent/workspace/README.md")
        workspace_path = Path("/__w/sentra/sentra/README.md")

        # Try both possible locations
        test_path = None
        if readme_path.exists():
            test_path = readme_path
        elif workspace_path.exists():
            test_path = workspace_path

        if test_path and test_path.exists():
            content = test_path.read_text()
            size = len(content)
            print_check("Read project files", True, f"Read {size} bytes from README.md")
            results["file_access"] = True
        else:
            # Try listing files in current directory
            cwd = Path.cwd()
            files = list(cwd.glob("*.md"))
            if files:
                print_check("Read project files", True, f"Found {len(files)} markdown files in {cwd}")
                results["file_access"] = True
            else:
                print_check("Read project files", False, f"No files found in {cwd}")
    except Exception as e:
        print_check("Read project files", False, str(e))

    # Check 5: Security constraints
    print_header("Check 5: Security Constraints")

    # Check user ID
    try:
        uid = os.getuid()
        is_non_root = uid != 0
        print_check("Non-root user", is_non_root, f"UID: {uid}")

        # Check username
        result = subprocess.run(
            ["whoami"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            username = result.stdout.strip()
            is_claude_agent = username == "claude-agent"
            print_check("Correct user (claude-agent)", is_claude_agent, f"User: {username}")

            results["security"] = is_non_root and is_claude_agent
        else:
            results["security"] = is_non_root

    except Exception as e:
        print_check("Security constraints", False, str(e))

    # Summary
    print_header("Verification Summary")

    total_checks = len(results)
    passed_checks = sum(results.values())

    print(f"Results: {passed_checks}/{total_checks} checks passed\n")

    for check, passed in results.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {check.replace('_', ' ').title()}")

    print("\n" + "="*80)

    if passed_checks == total_checks:
        print("🎯 Phase 1 Verification: COMPLETE")
        print("All security features are working correctly!")
        print("="*80 + "\n")
        return 0
    else:
        print("⚠️  Phase 1 Verification: INCOMPLETE")
        print(f"{total_checks - passed_checks} check(s) failed")
        print("="*80 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
