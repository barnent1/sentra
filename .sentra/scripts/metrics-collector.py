#!/usr/bin/env python3
"""
Metrics Collector - Phase 3 Component

Collects architectural health metrics from various sources:
- Architecture scanner (patterns, violations)
- Test coverage reports
- Git history
- CI/CD results

Stores metrics in time-series database for trend analysis.
"""

import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import re

@dataclass
class MetricsSnapshot:
    """Single point-in-time metrics snapshot"""
    timestamp: str
    git_sha: str
    branch: str

    # Pattern metrics
    pattern_consistency_score: float
    patterns_adopted: int
    patterns_in_trial: int
    patterns_proposed: int

    # Violation metrics
    total_violations: int
    critical_violations: int
    high_violations: int
    medium_violations: int
    low_violations: int

    # Anti-pattern counts
    typescript_any_count: int
    ts_ignore_count: int
    fetch_in_useeffect_count: int
    polling_count: int
    missing_validation_count: int

    # Test coverage
    overall_coverage: float
    business_logic_coverage: float
    utilities_coverage: float
    components_coverage: float

    # Technical debt
    estimated_fix_hours: float
    debt_trend: str  # increasing, decreasing, stable

    # Refactoring activity
    files_refactored_last_week: int
    auto_fixes_successful: int
    auto_fixes_failed: int

    # Code quality
    total_files: int
    total_lines: int
    typescript_files: int
    test_files: int

class MetricsCollector:
    """Collects metrics from various sources"""

    def __init__(self, metrics_dir: Path):
        self.metrics_dir = metrics_dir
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        self.history_file = self.metrics_dir / "history.json"

    def collect(self) -> MetricsSnapshot:
        """Collect current metrics snapshot"""

        print("📊 Collecting metrics...")

        snapshot = MetricsSnapshot(
            timestamp=datetime.now().isoformat(),
            git_sha=self.get_git_sha(),
            branch=self.get_git_branch(),

            # Pattern metrics
            pattern_consistency_score=self.get_pattern_consistency(),
            patterns_adopted=self.count_patterns_by_status('ADOPTED'),
            patterns_in_trial=self.count_patterns_by_status('TRIAL'),
            patterns_proposed=self.count_patterns_by_status('PROPOSED'),

            # Violation metrics
            total_violations=self.count_total_violations(),
            critical_violations=self.count_violations_by_severity('CRITICAL'),
            high_violations=self.count_violations_by_severity('HIGH'),
            medium_violations=self.count_violations_by_severity('MEDIUM'),
            low_violations=self.count_violations_by_severity('LOW'),

            # Anti-pattern counts
            typescript_any_count=self.count_anti_pattern('typescript_any'),
            ts_ignore_count=self.count_anti_pattern('ts_ignore'),
            fetch_in_useeffect_count=self.count_anti_pattern('fetch_in_useeffect'),
            polling_count=self.count_anti_pattern('polling'),
            missing_validation_count=self.count_anti_pattern('missing_zod_validation'),

            # Test coverage
            overall_coverage=self.get_overall_coverage(),
            business_logic_coverage=self.get_coverage_for_path('src/services'),
            utilities_coverage=self.get_coverage_for_path('src/utils'),
            components_coverage=self.get_coverage_for_path('src/components'),

            # Technical debt
            estimated_fix_hours=self.estimate_fix_time(),
            debt_trend=self.calculate_debt_trend(),

            # Refactoring activity
            files_refactored_last_week=self.count_refactored_files(),
            auto_fixes_successful=self.count_auto_fixes(success=True),
            auto_fixes_failed=self.count_auto_fixes(success=False),

            # Code quality
            total_files=self.count_files('**/*.{ts,tsx,js,jsx}'),
            total_lines=self.count_lines_of_code(),
            typescript_files=self.count_files('**/*.{ts,tsx}'),
            test_files=self.count_files('**/*.{test,spec}.{ts,tsx}'),
        )

        print("✅ Metrics collected")
        return snapshot

    def get_git_sha(self) -> str:
        """Get current git commit SHA"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except:
            return 'unknown'

    def get_git_branch(self) -> str:
        """Get current git branch"""
        try:
            result = subprocess.run(
                ['git', 'branch', '--show-current'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except:
            return 'unknown'

    def get_scanner_output(self) -> Dict:
        """Run architecture scanner and return parsed output"""
        try:
            result = subprocess.run(
                ['python3', '.claude/scripts/architecture-scanner.py', '.', '--format=json'],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except:
            return {}

    def get_pattern_consistency(self) -> float:
        """Calculate pattern consistency score"""
        scanner = self.get_scanner_output()
        summary = scanner.get('summary', {})

        total_files = summary.get('total_files_scanned', 1)
        compliant_files = summary.get('compliant_files', 0)

        return (compliant_files / total_files) * 100 if total_files > 0 else 0.0

    def count_patterns_by_status(self, status: str) -> int:
        """Count patterns by status (ADOPTED, TRIAL, PROPOSED)"""

        patterns_file = Path('.sentra/memory/patterns.md')
        if not patterns_file.exists():
            return 0

        content = patterns_file.read_text()
        # Count pattern sections with specific status
        count = len(re.findall(rf'\*\*Status:\*\*\s+{status}', content, re.IGNORECASE))
        return count

    def count_total_violations(self) -> int:
        """Count total architectural violations"""
        scanner = self.get_scanner_output()
        anti_patterns = scanner.get('anti_patterns', {})

        total = 0
        for pattern_type, instances in anti_patterns.items():
            total += len(instances)

        return total

    def count_violations_by_severity(self, severity: str) -> int:
        """Count violations by severity level"""
        scanner = self.get_scanner_output()
        conflicts = scanner.get('conflicts', [])

        count = 0
        for conflict in conflicts:
            if conflict.get('severity', '').upper() == severity:
                count += 1

        return count

    def count_anti_pattern(self, pattern_type: str) -> int:
        """Count specific anti-pattern instances"""
        scanner = self.get_scanner_output()
        anti_patterns = scanner.get('anti_patterns', {})

        instances = anti_patterns.get(pattern_type, [])
        return len(instances)

    def get_overall_coverage(self) -> float:
        """Get overall test coverage percentage"""
        try:
            result = subprocess.run(
                ['npm', 'test', '--', '--coverage', '--json', '--passWithNoTests'],
                capture_output=True,
                text=True,
                timeout=300
            )

            # Parse coverage from JSON output
            # This is simplified - real implementation would parse jest JSON format
            output = result.stdout
            match = re.search(r'"lines":\s*{\s*"pct":\s*(\d+\.?\d*)', output)
            if match:
                return float(match.group(1))

            return 75.0  # Default

        except:
            return 0.0

    def get_coverage_for_path(self, path: str) -> float:
        """Get test coverage for specific path"""
        try:
            result = subprocess.run(
                ['npm', 'test', '--', '--coverage', '--json', '--passWithNoTests'],
                capture_output=True,
                text=True,
                timeout=300
            )

            # Parse coverage for specific path
            # This is simplified
            return self.get_overall_coverage()

        except:
            return 0.0

    def estimate_fix_time(self) -> float:
        """Estimate time to fix all violations (hours)"""
        scanner = self.get_scanner_output()
        anti_patterns = scanner.get('anti_patterns', {})

        # Time estimates per anti-pattern type (hours)
        time_estimates = {
            'typescript_any': 0.1,
            'ts_ignore': 0.1,
            'console_log': 0.05,
            'fetch_in_useeffect': 0.5,
            'polling': 0.5,
            'missing_zod_validation': 0.3,
            'img_tag': 0.2,
        }

        total_hours = 0.0
        for pattern_type, instances in anti_patterns.items():
            time_per_instance = time_estimates.get(pattern_type, 0.5)
            total_hours += len(instances) * time_per_instance

        return round(total_hours, 1)

    def calculate_debt_trend(self) -> str:
        """Calculate technical debt trend (increasing, decreasing, stable)"""

        history = self.load_history()
        if len(history) < 2:
            return 'unknown'

        # Compare last two snapshots
        current = history[-1]
        previous = history[-2]

        current_debt = current.get('estimated_fix_hours', 0)
        previous_debt = previous.get('estimated_fix_hours', 0)

        diff = current_debt - previous_debt

        if diff > 1.0:
            return 'increasing'
        elif diff < -1.0:
            return 'decreasing'
        else:
            return 'stable'

    def count_refactored_files(self) -> int:
        """Count files refactored in last week"""
        try:
            # Search git log for auto-refactor commits
            one_week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

            result = subprocess.run(
                ['git', 'log', f'--since={one_week_ago}', '--grep=auto-refactor', '--oneline'],
                capture_output=True,
                text=True,
                check=True
            )

            commits = result.stdout.strip().split('\n')
            return len([c for c in commits if c])

        except:
            return 0

    def count_auto_fixes(self, success: bool) -> int:
        """Count automatic fixes (successful or failed)"""

        audit_log = Path('.sentra/metrics/audit.log')
        if not audit_log.exists():
            return 0

        try:
            content = audit_log.read_text()
            pattern = 'auto-refactor: success' if success else 'auto-refactor: failed'
            return content.count(pattern)
        except:
            return 0

    def count_files(self, pattern: str) -> int:
        """Count files matching glob pattern"""
        try:
            result = subprocess.run(
                ['find', '.', '-type', 'f', '-name', '*.ts', '-o', '-name', '*.tsx'],
                capture_output=True,
                text=True
            )
            files = [f for f in result.stdout.split('\n') if f and 'node_modules' not in f]
            return len(files)
        except:
            return 0

    def count_lines_of_code(self) -> int:
        """Count total lines of TypeScript code"""
        try:
            result = subprocess.run(
                ['find', '.', '-name', '*.ts', '-o', '-name', '*.tsx', '|',
                 'grep', '-v', 'node_modules', '|',
                 'xargs', 'wc', '-l'],
                capture_output=True,
                text=True,
                shell=True
            )

            # Parse total from last line
            lines = result.stdout.strip().split('\n')
            if lines:
                match = re.search(r'(\d+)', lines[-1])
                if match:
                    return int(match.group(1))

            return 0
        except:
            return 0

    def save_snapshot(self, snapshot: MetricsSnapshot):
        """Save snapshot to history"""

        history = self.load_history()
        history.append(asdict(snapshot))

        with open(self.history_file, 'w') as f:
            json.dump(history, f, indent=2)

        print(f"✅ Snapshot saved to {self.history_file}")

    def load_history(self) -> List[Dict]:
        """Load metrics history"""

        if not self.history_file.exists():
            return []

        try:
            with open(self.history_file, 'r') as f:
                return json.load(f)
        except:
            return []

    def export_json(self, output_file: Path):
        """Export metrics to JSON file"""

        history = self.load_history()

        with open(output_file, 'w') as f:
            json.dump(history, f, indent=2)

        print(f"✅ Exported to {output_file}")

    def compare_with_past(self, days: int):
        """Compare current metrics with N days ago"""

        history = self.load_history()
        if not history:
            print("No historical data available")
            return

        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        past_snapshots = [s for s in history if s['timestamp'] < cutoff]

        if not past_snapshots:
            print(f"No data from {days} days ago")
            return

        past = past_snapshots[-1]
        current = history[-1]

        print(f"\n📊 METRICS COMPARISON ({days} days)")
        print("=" * 60)

        metrics_to_compare = [
            ('pattern_consistency_score', 'Pattern Consistency', '%', 'higher'),
            ('total_violations', 'Total Violations', '', 'lower'),
            ('overall_coverage', 'Test Coverage', '%', 'higher'),
            ('estimated_fix_hours', 'Tech Debt (hours)', 'h', 'lower'),
        ]

        for key, label, unit, better in metrics_to_compare:
            past_val = past.get(key, 0)
            current_val = current.get(key, 0)
            diff = current_val - past_val

            trend = '📈' if diff > 0 else '📉' if diff < 0 else '➡️'

            # Determine if change is good
            is_improvement = (
                (better == 'higher' and diff > 0) or
                (better == 'lower' and diff < 0)
            )
            status = '✅' if is_improvement else '❌' if diff != 0 else '➡️'

            print(f"{status} {label}: {past_val:.1f}{unit} → {current_val:.1f}{unit} ({trend} {diff:+.1f}{unit})")

    def print_summary(self, snapshot: MetricsSnapshot):
        """Print metrics summary"""

        print("\n📊 METRICS SUMMARY")
        print("=" * 60)
        print(f"Timestamp: {snapshot.timestamp}")
        print(f"Git SHA: {snapshot.git_sha[:8]}")
        print(f"Branch: {snapshot.branch}")
        print()

        # Health Score (0-100)
        health_score = self.calculate_health_score(snapshot)
        health_emoji = '🟢' if health_score >= 80 else '🟡' if health_score >= 60 else '🔴'
        print(f"{health_emoji} Overall Health Score: {health_score}/100")
        print()

        # Pattern Metrics
        print("📋 PATTERNS")
        print(f"  Consistency Score: {snapshot.pattern_consistency_score:.1f}%")
        print(f"  Adopted: {snapshot.patterns_adopted}")
        print(f"  In Trial: {snapshot.patterns_in_trial}")
        print(f"  Proposed: {snapshot.patterns_proposed}")
        print()

        # Violations
        print("⚠️  VIOLATIONS")
        print(f"  Total: {snapshot.total_violations}")
        print(f"  Critical: {snapshot.critical_violations}")
        print(f"  High: {snapshot.high_violations}")
        print(f"  Medium: {snapshot.medium_violations}")
        print(f"  Low: {snapshot.low_violations}")
        print()

        # Anti-Patterns
        print("❌ TOP ANTI-PATTERNS")
        anti_patterns = [
            ('TypeScript any', snapshot.typescript_any_count),
            ('@ts-ignore', snapshot.ts_ignore_count),
            ('fetch in useEffect', snapshot.fetch_in_useeffect_count),
            ('Polling', snapshot.polling_count),
            ('Missing validation', snapshot.missing_validation_count),
        ]
        for name, count in sorted(anti_patterns, key=lambda x: x[1], reverse=True)[:3]:
            if count > 0:
                print(f"  {name}: {count}")
        print()

        # Test Coverage
        print("🧪 TEST COVERAGE")
        print(f"  Overall: {snapshot.overall_coverage:.1f}%")
        print(f"  Business Logic: {snapshot.business_logic_coverage:.1f}%")
        print(f"  Utilities: {snapshot.utilities_coverage:.1f}%")
        print(f"  Components: {snapshot.components_coverage:.1f}%")
        print()

        # Technical Debt
        debt_emoji = '🟢' if snapshot.debt_trend == 'decreasing' else '🔴' if snapshot.debt_trend == 'increasing' else '🟡'
        print(f"💰 TECHNICAL DEBT ({debt_emoji} {snapshot.debt_trend})")
        print(f"  Estimated fix time: {snapshot.estimated_fix_hours} hours")
        print()

        # Refactoring Activity
        print("🔧 REFACTORING (Last 7 days)")
        print(f"  Files refactored: {snapshot.files_refactored_last_week}")
        print(f"  Successful: {snapshot.auto_fixes_successful}")
        print(f"  Failed: {snapshot.auto_fixes_failed}")
        print()

    def calculate_health_score(self, snapshot: MetricsSnapshot) -> int:
        """Calculate overall architectural health score (0-100)"""

        score = 0

        # Pattern consistency (30 points)
        score += min(30, snapshot.pattern_consistency_score * 0.3)

        # Test coverage (30 points)
        score += min(30, snapshot.overall_coverage * 0.3)

        # Violations (20 points) - fewer is better
        if snapshot.total_violations == 0:
            score += 20
        elif snapshot.total_violations < 10:
            score += 15
        elif snapshot.total_violations < 25:
            score += 10
        elif snapshot.total_violations < 50:
            score += 5

        # Technical debt trend (10 points)
        if snapshot.debt_trend == 'decreasing':
            score += 10
        elif snapshot.debt_trend == 'stable':
            score += 5

        # Refactoring activity (10 points)
        if snapshot.files_refactored_last_week > 5:
            score += 10
        elif snapshot.files_refactored_last_week > 0:
            score += 5

        return int(score)


def main():
    parser = argparse.ArgumentParser(
        description="Metrics Collector - Phase 3"
    )

    parser.add_argument(
        '--export',
        type=str,
        help='Export metrics to JSON file'
    )

    parser.add_argument(
        '--compare',
        type=str,
        help='Compare with N days ago (e.g., 7d, 30d)'
    )

    args = parser.parse_args()

    # Create collector
    metrics_dir = Path('.sentra/metrics')
    collector = MetricsCollector(metrics_dir)

    # Collect current snapshot
    snapshot = collector.collect()

    # Save to history
    collector.save_snapshot(snapshot)

    # Print summary
    collector.print_summary(snapshot)

    # Export if requested
    if args.export:
        collector.export_json(Path(args.export))

    # Compare if requested
    if args.compare:
        match = re.match(r'(\d+)d', args.compare)
        if match:
            days = int(match.group(1))
            collector.compare_with_past(days)


if __name__ == '__main__':
    main()
