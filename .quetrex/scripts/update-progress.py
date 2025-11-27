#!/usr/bin/env python3
"""
Update Progress - Post-Merge Progress Updates

Called after PR merge to update progress tracking.
Updates progress.json with completion status, marks dependent issues ready,
updates batch completion, and triggers next batch if ready.

Exit codes:
  0 - Success
  1 - Error

Usage:
  python update-progress.py --issue 45 --status complete
  python update-progress.py --issue 45 --status complete --pr-url https://github.com/user/repo/pull/123
  python update-progress.py --issue 45 --status in_progress
  python update-progress.py --issue 45 --status failed --reason "Tests failed"
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional
import importlib.util

# Import dependency manager from same directory
def load_dependency_manager():
    """Load DependencyManager and IssueStatus from dependency-manager.py"""
    script_dir = Path(__file__).parent
    module_path = script_dir / "dependency-manager.py"

    spec = importlib.util.spec_from_file_location("dependency_manager", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module.DependencyManager, module.IssueStatus

DependencyManager, IssueStatus = load_dependency_manager()


def update_issue_progress(
    issue_id: int,
    status: str,
    project_root: Path,
    pr_url: Optional[str] = None,
    failure_reason: Optional[str] = None,
    verbose: bool = False
) -> bool:
    """
    Update issue progress.

    Args:
        issue_id: Issue to update
        status: New status (complete, in_progress, failed)
        project_root: Project root directory
        pr_url: PR URL (optional)
        failure_reason: Failure reason if status is failed
        verbose: Print detailed information

    Returns:
        True if successful, False otherwise
    """
    try:
        manager = DependencyManager(project_root)

        # Validate issue exists
        if issue_id not in manager.issues:
            print(f"ERROR: Issue {issue_id} not found in dependency graph", file=sys.stderr)
            return False

        issue = manager.issues[issue_id]
        from datetime import timezone
        now = datetime.now(timezone.utc).isoformat()

        # Update based on status
        if status == "complete":
            if verbose:
                print(f"Marking issue #{issue_id} as complete...")

            # Use manager's mark_complete method
            manager.mark_complete(issue_id, pr_url)

            if verbose:
                print(f"✅ Issue #{issue_id} marked complete")
                if pr_url:
                    print(f"   PR: {pr_url}")

                # Show what became unblocked
                newly_ready = []
                for other_issue in manager.issues.values():
                    if issue_id in other_issue.depends_on:
                        can_start, _ = manager.can_start_issue(other_issue.id)
                        if can_start:
                            newly_ready.append(other_issue.id)

                if newly_ready:
                    print(f"\n🎯 Issues now ready to start: {newly_ready}")

                # Check batch completion
                batch = manager.batches.get(issue.batch)
                if batch:
                    complete_count = sum(
                        1 for i in batch.issues
                        if i in manager.issues and manager.issues[i].status == IssueStatus.COMPLETE
                    )
                    total_count = len(batch.issues)
                    percentage = round((complete_count / total_count * 100), 1)

                    print(f"\nBatch {issue.batch} ({batch.name}) progress:")
                    print(f"  {complete_count}/{total_count} issues complete ({percentage}%)")

                    if complete_count == total_count:
                        print(f"  🎉 Batch complete!")

        elif status == "in_progress":
            if verbose:
                print(f"Marking issue #{issue_id} as in progress...")

            issue.status = IssueStatus.IN_PROGRESS
            issue.started_at = now

            # Update progress.json
            manager.progress["issues"][str(issue_id)] = {
                "status": "in_progress",
                "started_at": now,
                "completed_at": None,
                "pr_url": None
            }
            manager.progress["updated_at"] = now
            manager._save_progress(manager.progress)

            if verbose:
                print(f"✅ Issue #{issue_id} marked in progress")

                # Show potential conflicts
                conflicts = manager.detect_conflicts(issue_id)
                if conflicts:
                    print(f"\n⚠️  WARNING: Conflicts detected:")
                    for conflict in conflicts:
                        print(f"  #{conflict['issue_id']}: {conflict['reason']}")

        elif status == "failed":
            if verbose:
                print(f"Marking issue #{issue_id} as failed...")

            issue.status = IssueStatus.FAILED

            # Update progress.json
            manager.progress["issues"][str(issue_id)] = {
                "status": "failed",
                "started_at": issue.started_at,
                "completed_at": None,
                "pr_url": pr_url,
                "failure_reason": failure_reason or "Unknown"
            }
            manager.progress["updated_at"] = now
            manager._save_progress(manager.progress)

            if verbose:
                print(f"❌ Issue #{issue_id} marked failed")
                if failure_reason:
                    print(f"   Reason: {failure_reason}")

                # Show what's blocked
                blocked_issues = [
                    other_issue.id
                    for other_issue in manager.issues.values()
                    if issue_id in other_issue.depends_on
                ]
                if blocked_issues:
                    print(f"\n⚠️  Issues blocked by this failure: {blocked_issues}")

        else:
            print(f"ERROR: Unknown status: {status}", file=sys.stderr)
            print("Valid statuses: complete, in_progress, failed", file=sys.stderr)
            return False

        # Show overall progress
        if verbose:
            print()
            summary = manager.get_progress_summary()
            print(f"Overall progress: {summary['complete']}/{summary['total_issues']} ({summary['completion_percentage']}%)")

        return True

    except FileNotFoundError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Update issue progress after PR merge or status change",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Mark issue complete after PR merge
  python update-progress.py --issue 45 --status complete \\
    --pr-url https://github.com/user/repo/pull/123

  # Mark issue as in progress
  python update-progress.py --issue 45 --status in_progress

  # Mark issue as failed
  python update-progress.py --issue 45 --status failed \\
    --reason "Tests failed with coverage below threshold"

  # Use in GitHub Actions (after merge)
  python .quetrex/scripts/update-progress.py \\
    --issue ${{ github.event.issue.number }} \\
    --status complete \\
    --pr-url ${{ github.event.pull_request.html_url }}

Exit codes:
  0 - Success
  1 - Error (invalid issue, invalid status, or file not found)
        """
    )

    parser.add_argument(
        "--issue",
        type=int,
        required=True,
        metavar="ISSUE_ID",
        help="Issue ID to update"
    )

    parser.add_argument(
        "--status",
        required=True,
        choices=["complete", "in_progress", "failed"],
        help="New status"
    )

    parser.add_argument(
        "--pr-url",
        metavar="URL",
        help="Pull request URL (optional)"
    )

    parser.add_argument(
        "--reason",
        metavar="TEXT",
        help="Failure reason (required if status=failed)"
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

    # Validate
    if not args.project_root.exists():
        print(f"ERROR: Project root does not exist: {args.project_root}", file=sys.stderr)
        sys.exit(1)

    if args.status == "failed" and not args.reason:
        print("ERROR: --reason required when status=failed", file=sys.stderr)
        sys.exit(1)

    # Update progress
    success = update_issue_progress(
        args.issue,
        args.status,
        args.project_root,
        args.pr_url,
        args.reason,
        args.verbose
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
