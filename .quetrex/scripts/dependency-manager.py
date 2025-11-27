#!/usr/bin/env python3
"""
Dependency Manager - Core Dependency Tracking Logic

Manages issue dependencies, conflict detection, and batch progression.
Reads dependency graph from .quetrex/dependency-graph.yml
Tracks progress in .quetrex/progress.json

Part of Quetrex's AI-Powered SaaS Factory architecture.
"""

import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Set, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum


class IssueStatus(Enum):
    """Issue lifecycle states"""
    PENDING = "pending"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    BLOCKED = "blocked"
    FAILED = "failed"


class DependencyType(Enum):
    """Types of dependencies between issues"""
    HARD = "hard"        # MUST complete first
    SOFT = "soft"        # SHOULD complete first
    BLOCKS = "blocks"    # This issue blocks others
    CONFLICTS = "conflicts"  # Cannot run in parallel


@dataclass
class Issue:
    """Issue metadata with dependencies"""
    id: int
    batch: str
    status: IssueStatus
    depends_on: List[int]  # Hard dependencies
    soft_depends_on: List[int]  # Soft dependencies
    blocks: List[int]  # Issues this blocks
    conflicts_with: List[int]  # Cannot run simultaneously
    files: List[str]  # Files this issue modifies
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    pr_url: Optional[str] = None


@dataclass
class Batch:
    """Batch of related issues"""
    id: str
    name: str
    parallel_limit: int
    issues: List[int]
    depends_on_batches: List[str]
    estimated_duration: str


class DependencyManager:
    """Core dependency tracking and conflict resolution"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.dependency_graph_path = project_root / ".quetrex" / "dependency-graph.yml"
        self.progress_path = project_root / ".quetrex" / "progress.json"

        # Load data
        self.dependency_graph = self._load_dependency_graph()
        self.progress = self._load_progress()

        # Build lookup structures
        self.issues: Dict[int, Issue] = {}
        self.batches: Dict[str, Batch] = {}
        self._build_issue_index()

    def _load_dependency_graph(self) -> Dict[str, Any]:
        """Load dependency graph YAML"""
        if not self.dependency_graph_path.exists():
            raise FileNotFoundError(
                f"Dependency graph not found: {self.dependency_graph_path}\n"
                f"Create .quetrex/dependency-graph.yml first."
            )

        with open(self.dependency_graph_path) as f:
            return yaml.safe_load(f)

    def _load_progress(self) -> Dict[str, Any]:
        """Load progress JSON (or create if missing)"""
        if not self.progress_path.exists():
            # Initialize empty progress
            progress = {
                "project": self.dependency_graph.get("project", "Unknown"),
                "started_at": None,
                "updated_at": None,
                "issues": {},
                "batches": {}
            }
            self._save_progress(progress)
            return progress

        with open(self.progress_path) as f:
            return json.load(f)

    def _save_progress(self, progress: Dict[str, Any]) -> None:
        """Save progress JSON"""
        self.progress_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.progress_path, 'w') as f:
            json.dump(progress, f, indent=2)

    def _build_issue_index(self) -> None:
        """Build issue and batch lookup structures"""
        # Parse batches
        for batch_id, batch_data in self.dependency_graph.get("batches", {}).items():
            # Handle dependencies field (can be dict or list)
            dependencies = batch_data.get("dependencies", {})
            if isinstance(dependencies, dict):
                depends_on_batches = dependencies.get("all_from_batch", [])
            elif isinstance(dependencies, list):
                depends_on_batches = dependencies
            else:
                depends_on_batches = []

            self.batches[batch_id] = Batch(
                id=batch_id,
                name=batch_data.get("name", batch_id),
                parallel_limit=batch_data.get("parallel_limit", 10),
                issues=batch_data.get("issues", []),
                depends_on_batches=depends_on_batches,
                estimated_duration=batch_data.get("estimated_duration", "Unknown")
            )

        # Parse issues
        issue_definitions = self.dependency_graph.get("issues", [])
        for issue_def in issue_definitions:
            issue_id = issue_def["id"]

            # Get progress status
            issue_progress = self.progress["issues"].get(str(issue_id), {})
            status_str = issue_progress.get("status", "pending")
            status = IssueStatus(status_str)

            # Find batch
            batch_id = None
            for bid, batch in self.batches.items():
                if issue_id in batch.issues:
                    batch_id = bid
                    break

            # Create issue
            self.issues[issue_id] = Issue(
                id=issue_id,
                batch=batch_id or "unknown",
                status=status,
                depends_on=issue_def.get("depends_on", []),
                soft_depends_on=issue_def.get("soft_depends_on", []),
                blocks=issue_def.get("blocks", []),
                conflicts_with=issue_def.get("conflicts_with", []),
                files=issue_def.get("files", []),
                started_at=issue_progress.get("started_at"),
                completed_at=issue_progress.get("completed_at"),
                pr_url=issue_progress.get("pr_url")
            )

    def can_start_issue(self, issue_id: int) -> Tuple[bool, Optional[str]]:
        """
        Check if issue can start.

        Returns:
            (can_start, blocking_reason)
        """
        # Reload progress to get latest state
        self.progress = self._load_progress()

        if issue_id not in self.issues:
            return False, f"Issue {issue_id} not found in dependency graph"

        issue = self.issues[issue_id]

        # Check if already complete or in progress
        if issue.status == IssueStatus.COMPLETE:
            return False, f"Issue {issue_id} is already complete"

        if issue.status == IssueStatus.IN_PROGRESS:
            return False, f"Issue {issue_id} is already in progress"

        # Check batch dependencies
        batch = self.batches.get(issue.batch)
        if batch:
            for dep_batch_id in batch.depends_on_batches:
                if not self._is_batch_complete(dep_batch_id):
                    return False, f"Blocked by batch {dep_batch_id} (not complete)"

        # Check hard dependencies
        for dep_id in issue.depends_on:
            dep_issue = self.issues.get(dep_id)
            if not dep_issue or dep_issue.status != IssueStatus.COMPLETE:
                return False, f"Blocked by issue #{dep_id} (dependency not complete)"

        # Check conflicts with in-progress issues
        conflicts = self.detect_conflicts(issue_id)
        if conflicts:
            conflict_ids = [c["issue_id"] for c in conflicts]
            return False, f"Conflicts with in-progress issues: {conflict_ids}"

        # Check batch parallel limit
        if batch:
            in_progress_count = sum(
                1 for i in batch.issues
                if i in self.issues and self.issues[i].status == IssueStatus.IN_PROGRESS
            )
            if in_progress_count >= batch.parallel_limit:
                return False, f"Batch {issue.batch} parallel limit reached ({batch.parallel_limit})"

        return True, None

    def get_blocked_issues(self) -> List[Dict[str, Any]]:
        """
        Find all issues that are blocked by dependencies.

        Returns:
            List of dicts with issue_id, blocking_reason
        """
        blocked = []

        for issue_id, issue in self.issues.items():
            if issue.status in [IssueStatus.COMPLETE, IssueStatus.IN_PROGRESS]:
                continue

            can_start, reason = self.can_start_issue(issue_id)
            if not can_start:
                blocked.append({
                    "issue_id": issue_id,
                    "batch": issue.batch,
                    "blocking_reason": reason
                })

        return blocked

    def get_ready_issues(self, batch_id: Optional[str] = None) -> List[int]:
        """
        Get issues ready to start (all dependencies met).

        Args:
            batch_id: Filter to specific batch (optional)

        Returns:
            List of issue IDs ready to start
        """
        ready = []

        issues_to_check = self.issues.values()
        if batch_id:
            batch = self.batches.get(batch_id)
            if batch:
                issues_to_check = [self.issues[i] for i in batch.issues if i in self.issues]

        for issue in issues_to_check:
            if issue.status != IssueStatus.PENDING:
                continue

            can_start, _ = self.can_start_issue(issue.id)
            if can_start:
                ready.append(issue.id)

        return ready

    def detect_conflicts(self, issue_id: int) -> List[Dict[str, Any]]:
        """
        Detect conflicts with in-progress issues.

        Conflicts occur when:
        1. Explicit conflicts_with relationship
        2. Same files being modified

        Returns:
            List of conflicts with issue_id, type, files
        """
        if issue_id not in self.issues:
            return []

        issue = self.issues[issue_id]
        conflicts = []

        # Get all in-progress issues
        in_progress = [
            i for i in self.issues.values()
            if i.status == IssueStatus.IN_PROGRESS
        ]

        for other_issue in in_progress:
            # Explicit conflict
            if other_issue.id in issue.conflicts_with:
                conflicts.append({
                    "issue_id": other_issue.id,
                    "type": "explicit",
                    "reason": "Explicit conflict relationship",
                    "files": []
                })
                continue

            # File conflicts
            conflicting_files = set(issue.files) & set(other_issue.files)
            if conflicting_files:
                conflicts.append({
                    "issue_id": other_issue.id,
                    "type": "file_conflict",
                    "reason": "Modifying same files",
                    "files": list(conflicting_files)
                })

        return conflicts

    def resolve_conflict(self, strategy: str, issues: List[int]) -> Dict[str, Any]:
        """
        Auto-resolve conflicts using specified strategy.

        Strategies:
        - sequential: Execute issues one at a time
        - partition: Partition files (if possible)
        - human: Escalate to human

        Args:
            strategy: Resolution strategy
            issues: List of conflicting issue IDs

        Returns:
            Resolution result with actions taken
        """
        if strategy == "sequential":
            # Sort by priority/dependency order
            sorted_issues = self._sort_by_priority(issues)
            return {
                "strategy": "sequential",
                "actions": [
                    {"issue": issue_id, "action": "queue"}
                    for issue_id in sorted_issues
                ],
                "message": f"Will execute sequentially: {sorted_issues}"
            }

        elif strategy == "partition":
            # Check if file partitioning is possible
            partitions = self._attempt_file_partition(issues)
            if partitions:
                return {
                    "strategy": "partition",
                    "actions": partitions,
                    "message": "Files partitioned successfully"
                }
            else:
                # Fall back to sequential
                return self.resolve_conflict("sequential", issues)

        elif strategy == "human":
            return {
                "strategy": "human",
                "actions": [],
                "message": f"Escalated to human: issues {issues}"
            }

        else:
            raise ValueError(f"Unknown strategy: {strategy}")

    def mark_complete(self, issue_id: int, pr_url: Optional[str] = None) -> None:
        """
        Mark issue as complete and update dependent issues.

        Args:
            issue_id: Issue to mark complete
            pr_url: PR URL (optional)
        """
        if issue_id not in self.issues:
            raise ValueError(f"Issue {issue_id} not found")

        issue = self.issues[issue_id]
        issue.status = IssueStatus.COMPLETE

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        issue.completed_at = now
        if pr_url:
            issue.pr_url = pr_url

        # Update progress.json
        self.progress["issues"][str(issue_id)] = {
            "status": "complete",
            "started_at": issue.started_at,
            "completed_at": now,
            "pr_url": pr_url
        }
        self.progress["updated_at"] = now
        self._save_progress(self.progress)

        # Check if batch is complete
        batch = self.batches.get(issue.batch)
        if batch and self._is_batch_complete(issue.batch):
            self._on_batch_complete(issue.batch)

    def _is_batch_complete(self, batch_id: str) -> bool:
        """Check if all issues in batch are complete"""
        # Check progress.json first (authoritative source)
        batch_progress = self.progress.get("batches", {}).get(batch_id, {})
        if batch_progress.get("status") == "complete":
            return True

        # Fall back to checking individual issues
        batch = self.batches.get(batch_id)
        if not batch:
            return False

        for issue_id in batch.issues:
            issue = self.issues.get(issue_id)
            if not issue or issue.status != IssueStatus.COMPLETE:
                return False

        return True

    def _on_batch_complete(self, batch_id: str) -> None:
        """Handle batch completion - update progress, mark dependent issues ready"""
        from datetime import datetime, timezone

        # Update batch progress
        batch = self.batches[batch_id]
        self.progress["batches"][batch_id] = {
            "status": "complete",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "issues_count": len(batch.issues)
        }

        # Mark dependent issues as ready
        for issue in self.issues.values():
            if issue.status == IssueStatus.PENDING:
                can_start, _ = self.can_start_issue(issue.id)
                if can_start:
                    issue.status = IssueStatus.READY

        self._save_progress(self.progress)

        print(f"✅ Batch {batch_id} ({batch.name}) complete!")
        print(f"   {len(batch.issues)} issues finished")

        # Check if next batch is ready
        self._check_next_batches()

    def _check_next_batches(self) -> None:
        """Check which batches are now ready to start"""
        for batch_id, batch in self.batches.items():
            batch_progress = self.progress["batches"].get(batch_id, {})
            if batch_progress.get("status") == "complete":
                continue

            # Check if all dependency batches are complete
            all_deps_complete = all(
                self._is_batch_complete(dep_batch)
                for dep_batch in batch.depends_on_batches
            )

            if all_deps_complete:
                print(f"🎯 Batch {batch_id} ({batch.name}) is now ready!")
                print(f"   Issues: {batch.issues}")
                print(f"   Parallel limit: {batch.parallel_limit}")

    def _sort_by_priority(self, issues: List[int]) -> List[int]:
        """Sort issues by dependency order (topological sort)"""
        # Simple implementation: issues with fewer dependencies first
        issue_objs = [self.issues[i] for i in issues if i in self.issues]
        sorted_objs = sorted(issue_objs, key=lambda i: len(i.depends_on))
        return [i.id for i in sorted_objs]

    def _attempt_file_partition(self, issues: List[int]) -> Optional[List[Dict[str, Any]]]:
        """
        Attempt to partition files between issues.

        Returns:
            List of partition actions if possible, None if not
        """
        # Check if files can be cleanly partitioned
        issue_objs = [self.issues[i] for i in issues if i in self.issues]

        # Simple check: if no file overlap, partition is possible
        all_files = []
        for issue in issue_objs:
            all_files.extend(issue.files)

        # If total files = sum of issue files, no overlap
        unique_files = set(all_files)
        if len(all_files) == len(unique_files):
            return [
                {
                    "issue": issue.id,
                    "action": "allow_parallel",
                    "files": issue.files
                }
                for issue in issue_objs
            ]

        return None

    def get_progress_summary(self) -> Dict[str, Any]:
        """Get project progress summary"""
        total_issues = len(self.issues)
        complete_count = sum(1 for i in self.issues.values() if i.status == IssueStatus.COMPLETE)
        in_progress_count = sum(1 for i in self.issues.values() if i.status == IssueStatus.IN_PROGRESS)
        blocked_count = len(self.get_blocked_issues())

        return {
            "project": self.dependency_graph.get("project", "Unknown"),
            "total_issues": total_issues,
            "complete": complete_count,
            "in_progress": in_progress_count,
            "blocked": blocked_count,
            "pending": total_issues - complete_count - in_progress_count - blocked_count,
            "completion_percentage": round((complete_count / total_issues * 100), 1) if total_issues > 0 else 0,
            "batches": {
                batch_id: {
                    "name": batch.name,
                    "total": len(batch.issues),
                    "complete": sum(1 for i in batch.issues if i in self.issues and self.issues[i].status == IssueStatus.COMPLETE),
                    "status": "complete" if self._is_batch_complete(batch_id) else "in_progress"
                }
                for batch_id, batch in self.batches.items()
            }
        }


# CLI for testing
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Dependency Manager - Core Logic")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    parser.add_argument("--check", type=int, metavar="ISSUE_ID", help="Check if issue can start")
    parser.add_argument("--blocked", action="store_true", help="Show blocked issues")
    parser.add_argument("--ready", action="store_true", help="Show ready issues")
    parser.add_argument("--batch", help="Filter to specific batch")
    parser.add_argument("--conflicts", type=int, metavar="ISSUE_ID", help="Check conflicts for issue")
    parser.add_argument("--progress", action="store_true", help="Show progress summary")

    args = parser.parse_args()

    try:
        manager = DependencyManager(Path(args.project_root))

        if args.check:
            can_start, reason = manager.can_start_issue(args.check)
            if can_start:
                print(f"✅ Issue {args.check} CAN start")
                sys.exit(0)
            else:
                print(f"❌ Issue {args.check} BLOCKED: {reason}")
                sys.exit(1)

        elif args.blocked:
            blocked = manager.get_blocked_issues()
            if blocked:
                print(f"Blocked issues: {len(blocked)}")
                for item in blocked:
                    print(f"  #{item['issue_id']}: {item['blocking_reason']}")
            else:
                print("No blocked issues")

        elif args.ready:
            ready = manager.get_ready_issues(args.batch)
            if ready:
                print(f"Ready issues: {ready}")
            else:
                print("No ready issues")

        elif args.conflicts:
            conflicts = manager.detect_conflicts(args.conflicts)
            if conflicts:
                print(f"Conflicts for issue {args.conflicts}:")
                for conflict in conflicts:
                    print(f"  #{conflict['issue_id']}: {conflict['reason']}")
                    if conflict['files']:
                        print(f"    Files: {conflict['files']}")
            else:
                print(f"No conflicts for issue {args.conflicts}")

        elif args.progress:
            summary = manager.get_progress_summary()
            print(f"\n{summary['project']} Progress")
            print("=" * 50)
            print(f"Total issues: {summary['total_issues']}")
            print(f"Complete: {summary['complete']} ({summary['completion_percentage']}%)")
            print(f"In progress: {summary['in_progress']}")
            print(f"Blocked: {summary['blocked']}")
            print(f"Pending: {summary['pending']}")
            print("\nBatches:")
            for batch_id, batch_data in summary['batches'].items():
                status_icon = "✅" if batch_data['status'] == 'complete' else "🔄"
                print(f"  {status_icon} {batch_data['name']}: {batch_data['complete']}/{batch_data['total']}")

        else:
            parser.print_help()

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
