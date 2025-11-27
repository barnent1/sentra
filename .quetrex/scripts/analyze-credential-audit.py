#!/usr/bin/env python3
"""
Credential Audit Log Analyzer

Analyzes credential proxy audit logs to identify:
- All credential requests by service
- Suspicious patterns (repeated failures, rate limiting, unusual operations)
- Request distribution over time
- Security incidents

Usage:
    python3 .quetrex/scripts/analyze-credential-audit.py /tmp/credential-audit.log

Created by Glen Barnhardt with help from Claude Code
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter
from typing import List, Dict, Any


class AuditLogAnalyzer:
    """Analyze credential proxy audit logs."""

    def __init__(self, log_file: Path):
        self.log_file = log_file
        self.entries: List[Dict[str, Any]] = []

    def load_logs(self) -> None:
        """Load and parse audit log file."""
        if not self.log_file.exists():
            print(f"Error: Log file not found: {self.log_file}", file=sys.stderr)
            sys.exit(1)

        with open(self.log_file, "r") as f:
            for line in f:
                # Skip non-JSON lines
                if "Credential request:" not in line:
                    continue

                # Extract JSON part
                json_part = line.split("Credential request:")[1].strip()
                try:
                    entry = json.loads(json_part)
                    self.entries.append(entry)
                except json.JSONDecodeError as e:
                    print(f"Warning: Failed to parse line: {e}", file=sys.stderr)
                    continue

        print(f"Loaded {len(self.entries)} credential requests\n")

    def analyze_by_service(self) -> None:
        """Analyze requests grouped by service."""
        print("=" * 80)
        print("CREDENTIAL REQUESTS BY SERVICE")
        print("=" * 80)

        service_stats = defaultdict(lambda: {
            "total": 0,
            "granted": 0,
            "rejected": 0,
            "failed": 0,
            "operations": Counter()
        })

        for entry in self.entries:
            service = entry.get("service", "unknown")
            status = entry.get("status", "unknown")
            operation = entry.get("operation", "unknown")

            service_stats[service]["total"] += 1
            service_stats[service]["operations"][operation] += 1

            if status == "GRANTED":
                service_stats[service]["granted"] += 1
            elif status == "REJECTED":
                service_stats[service]["rejected"] += 1
            elif status == "FAILED_TO_RETRIEVE":
                service_stats[service]["failed"] += 1

        for service, stats in service_stats.items():
            print(f"\n{service.upper()}:")
            print(f"  Total Requests: {stats['total']}")
            print(f"  Granted: {stats['granted']} ({stats['granted']/stats['total']*100:.1f}%)")
            print(f"  Rejected: {stats['rejected']} ({stats['rejected']/stats['total']*100:.1f}%)")
            print(f"  Failed: {stats['failed']} ({stats['failed']/stats['total']*100:.1f}%)")
            print(f"  Operations:")
            for op, count in stats['operations'].most_common():
                print(f"    - {op}: {count}")

    def analyze_timeline(self) -> None:
        """Analyze request timeline."""
        print("\n" + "=" * 80)
        print("REQUEST TIMELINE")
        print("=" * 80)

        if not self.entries:
            print("No entries to analyze")
            return

        # Parse timestamps
        timestamps = []
        for entry in self.entries:
            try:
                ts = datetime.fromisoformat(entry["timestamp"])
                timestamps.append(ts)
            except (ValueError, KeyError):
                continue

        if not timestamps:
            print("No valid timestamps found")
            return

        timestamps.sort()
        first = timestamps[0]
        last = timestamps[-1]
        duration = (last - first).total_seconds()

        print(f"\nFirst Request: {first.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Last Request:  {last.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Duration:      {duration:.1f} seconds ({duration/60:.1f} minutes)")
        print(f"Request Rate:  {len(timestamps)/max(duration, 1):.2f} requests/second")

    def find_suspicious_patterns(self) -> None:
        """Identify suspicious patterns in requests."""
        print("\n" + "=" * 80)
        print("SUSPICIOUS PATTERNS")
        print("=" * 80)

        suspicious = []

        # Pattern 1: Many rejections
        rejections = [e for e in self.entries if e.get("status") == "REJECTED"]
        if len(rejections) > 5:
            suspicious.append(f"⚠️  High rejection rate: {len(rejections)} rejected requests")
            # Show rejection reasons
            reasons = Counter(e.get("error", "unknown") for e in rejections)
            for reason, count in reasons.most_common(3):
                suspicious.append(f"   - {reason}: {count} times")

        # Pattern 2: Failed credential retrievals
        failures = [e for e in self.entries if e.get("status") == "FAILED_TO_RETRIEVE"]
        if len(failures) > 0:
            suspicious.append(f"⚠️  Credential retrieval failures: {len(failures)}")

        # Pattern 3: Unusual operations
        operations = Counter(e.get("operation") for e in self.entries)
        for op, count in operations.items():
            if op not in ["clone", "push", "pull", "create_pr", "comment", "read", "api_call"]:
                suspicious.append(f"⚠️  Unusual operation: {op} ({count} times)")

        # Pattern 4: Same PID making many requests (potential loop)
        pid_counts = Counter(e.get("requester_pid") for e in self.entries)
        for pid, count in pid_counts.items():
            if count > 50:  # More than 50 requests from one process
                suspicious.append(f"⚠️  High request count from PID {pid}: {count} requests")

        if suspicious:
            print("\nSuspicious patterns found:")
            for pattern in suspicious:
                print(f"  {pattern}")
        else:
            print("\n✅ No suspicious patterns detected")

    def generate_summary(self) -> None:
        """Generate summary report."""
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)

        if not self.entries:
            print("\nNo credential requests logged")
            return

        total = len(self.entries)
        granted = len([e for e in self.entries if e.get("status") == "GRANTED"])
        rejected = len([e for e in self.entries if e.get("status") == "REJECTED"])
        failed = len([e for e in self.entries if e.get("status") == "FAILED_TO_RETRIEVE"])

        print(f"\nTotal Requests:    {total}")
        print(f"Granted:           {granted} ({granted/total*100:.1f}%)")
        print(f"Rejected:          {rejected} ({rejected/total*100:.1f}%)")
        print(f"Failed:            {failed} ({failed/total*100:.1f}%)")

        # Security verdict
        print("\n" + "-" * 80)
        if rejected == 0 and failed == 0:
            print("✅ SECURITY STATUS: All requests processed successfully")
        elif rejected > total * 0.5:
            print("⚠️  SECURITY STATUS: High rejection rate - possible attack")
        elif failed > 0:
            print("⚠️  SECURITY STATUS: Credential retrieval issues detected")
        else:
            print("✅ SECURITY STATUS: Normal operation with some rejections")

    def run(self) -> None:
        """Run full analysis."""
        self.load_logs()
        self.analyze_by_service()
        self.analyze_timeline()
        self.find_suspicious_patterns()
        self.generate_summary()


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: analyze-credential-audit.py <log_file>", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print("  python3 .quetrex/scripts/analyze-credential-audit.py /tmp/credential-audit.log", file=sys.stderr)
        sys.exit(1)

    log_file = Path(sys.argv[1])
    analyzer = AuditLogAnalyzer(log_file)
    analyzer.run()


if __name__ == "__main__":
    main()
