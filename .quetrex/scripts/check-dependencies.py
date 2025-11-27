#!/usr/bin/env python3
"""
Check Dependencies - Pre-Issue Validation Script

Called by GitHub Actions before starting an issue.
Validates that all dependencies are met and no conflicts exist.

Exit codes:
  0 - Issue can start
  1 - Issue is blocked (with reason)

Usage:
  python check-dependencies.py --issue 45
  python check-dependencies.py --issue 45 --verbose
"""

import sys
import argparse
from pathlib import Path
from typing import Optional
import importlib.util

# Import dependency manager from same directory
def load_dependency_manager():
    """Load DependencyManager class from dependency-manager.py"""
    script_dir = Path(__file__).parent
    module_path = script_dir / "dependency-manager.py"

    spec = importlib.util.spec_from_file_location("dependency_manager", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module.DependencyManager

DependencyManager = load_dependency_manager()


def check_issue_dependencies(
    issue_id: int,
    project_root: Path,
    verbose: bool = False
) -> tuple[bool, Optional[str]]:
    """
    Check if issue can start.

    Args:
        issue_id: Issue to check
        project_root: Project root directory
        verbose: Print detailed information

    Returns:
        (can_start, blocking_reason)
    """
    try:
        manager = DependencyManager(project_root)

        # Check if issue exists
        if issue_id not in manager.issues:
            return False, f"Issue {issue_id} not found in dependency graph"

        issue = manager.issues[issue_id]

        if verbose:
            print(f"Checking issue #{issue_id}")
            print(f"  Batch: {issue.batch}")
            print(f"  Current status: {issue.status.value}")
            print(f"  Hard dependencies: {issue.depends_on}")
            print(f"  Soft dependencies: {issue.soft_depends_on}")
            print(f"  Blocks: {issue.blocks}")
            print(f"  Conflicts with: {issue.conflicts_with}")
            print(f"  Files: {issue.files}")
            print()

        # Check if can start
        can_start, reason = manager.can_start_issue(issue_id)

        if verbose:
            if can_start:
                print("✅ All checks passed")

                # Show soft dependency warnings
                if issue.soft_depends_on:
                    incomplete_soft = [
                        dep_id for dep_id in issue.soft_depends_on
                        if dep_id not in manager.issues or
                        manager.issues[dep_id].status.value != "complete"
                    ]
                    if incomplete_soft:
                        print(f"\n⚠️  WARNING: Soft dependencies not complete: {incomplete_soft}")
                        print("   (Not blocking, but recommended to wait)")

            else:
                print(f"❌ BLOCKED: {reason}")

                # Show details of blocking issues
                if "issue #" in reason.lower():
                    # Extract issue number from reason
                    import re
                    match = re.search(r'#(\d+)', reason)
                    if match:
                        dep_id = int(match.group(1))
                        if dep_id in manager.issues:
                            dep_issue = manager.issues[dep_id]
                            print(f"\n   Blocking issue #{dep_id}:")
                            print(f"     Status: {dep_issue.status.value}")
                            if dep_issue.pr_url:
                                print(f"     PR: {dep_issue.pr_url}")

                # Show conflicts
                conflicts = manager.detect_conflicts(issue_id)
                if conflicts:
                    print(f"\n   Conflicts with {len(conflicts)} in-progress issues:")
                    for conflict in conflicts:
                        print(f"     #{conflict['issue_id']}: {conflict['reason']}")
                        if conflict['files']:
                            print(f"       Files: {', '.join(conflict['files'])}")

        return can_start, reason

    except FileNotFoundError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Unexpected error: {e}"


def main():
    parser = argparse.ArgumentParser(
        description="Check if issue can start (pre-issue validation)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check if issue 45 can start
  python check-dependencies.py --issue 45

  # Check with verbose output
  python check-dependencies.py --issue 45 --verbose

  # Use in GitHub Actions
  python .quetrex/scripts/check-dependencies.py --issue ${{ github.event.issue.number }}

Exit codes:
  0 - Issue can start (all dependencies met)
  1 - Issue is blocked (dependencies not met or conflicts exist)
        """
    )

    parser.add_argument(
        "--issue",
        type=int,
        required=True,
        metavar="ISSUE_ID",
        help="Issue ID to check"
    )

    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Project root directory (default: current directory)"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Print detailed information"
    )

    args = parser.parse_args()

    # Validate project root
    if not args.project_root.exists():
        print(f"ERROR: Project root does not exist: {args.project_root}", file=sys.stderr)
        sys.exit(1)

    # Check dependencies
    can_start, reason = check_issue_dependencies(
        args.issue,
        args.project_root,
        args.verbose
    )

    if can_start:
        if not args.verbose:
            print(f"✅ Issue {args.issue} can start")
        sys.exit(0)
    else:
        if not args.verbose:
            print(f"❌ Issue {args.issue} blocked: {reason}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
