#!/usr/bin/env python3
"""
Codebase Architecture Scanner

Analyzes a codebase to identify architectural patterns and conflicts.
Detects usage of defined patterns and identifies inconsistencies.

Usage:
    python3 architecture-scanner.py [path] [--format=json|markdown]
    python3 architecture-scanner.py .
    python3 architecture-scanner.py /path/to/project --format=markdown
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class PatternUsage:
    """Represents a detected usage of an architectural pattern"""
    pattern_id: str
    pattern_name: str
    category: str
    file_path: str
    line_numbers: List[int]
    confidence: str  # HIGH, MEDIUM, LOW
    code_snippet: Optional[str] = None


@dataclass
class ArchitectureConflict:
    """Represents a conflict where multiple patterns exist for the same problem"""
    category: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    patterns_found: Dict[str, int]  # pattern_name: count
    affected_files: List[str]
    recommendation: str


@dataclass
class ArchitectureReport:
    """Complete architecture analysis report"""
    patterns_found: Dict[str, List[PatternUsage]]
    conflicts: List[ArchitectureConflict]
    consistent_areas: List[str]
    recommendations: List[str]
    summary: Dict


class ArchitectureScanner:
    """Scans codebase for architectural patterns and conflicts"""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path).resolve()
        self.exclude_dirs = {
            'node_modules', '.next', 'dist', 'build', '.git',
            '__pycache__', '.pytest_cache', 'coverage',
            'out', 'target', '.tauri'
        }
        self.source_extensions = {'.ts', '.tsx', '.js', '.jsx', '.py', '.rs'}

    def scan_codebase(self) -> ArchitectureReport:
        """Main scanning function"""
        print(f"🔍 Scanning codebase at: {self.root_path}")

        patterns_found = self.detect_patterns()
        conflicts = self.find_conflicts(patterns_found)
        consistent_areas = self.find_consistent_areas(patterns_found)
        recommendations = self.generate_recommendations(patterns_found, conflicts)
        summary = self.generate_summary(patterns_found, conflicts)

        return ArchitectureReport(
            patterns_found=patterns_found,
            conflicts=conflicts,
            consistent_areas=consistent_areas,
            recommendations=recommendations,
            summary=summary
        )

    def get_source_files(self) -> List[Path]:
        """Get all source files to scan"""
        files = []
        for file_path in self.root_path.rglob('*'):
            # Skip excluded directories
            if any(exc in file_path.parts for exc in self.exclude_dirs):
                continue

            # Only include source files
            if file_path.is_file() and file_path.suffix in self.source_extensions:
                files.append(file_path)

        print(f"📁 Found {len(files)} source files to analyze")
        return files

    def detect_patterns(self) -> Dict[str, List[PatternUsage]]:
        """Detect all patterns in codebase"""
        found = {
            'data_fetching': [],
            'state_management': [],
            'authentication': [],
            'api_design': [],
            'component_architecture': [],
            'code_quality': [],
            'security': [],
            'performance': [],
            'testing': [],
        }

        files = self.get_source_files()

        # Data fetching patterns
        print("🔎 Detecting data fetching patterns...")
        found['data_fetching'].extend(self.detect_data_fetching_patterns(files))

        # State management patterns
        print("🔎 Detecting state management patterns...")
        found['state_management'].extend(self.detect_state_patterns(files))

        # API design patterns
        print("🔎 Detecting API design patterns...")
        found['api_design'].extend(self.detect_api_patterns(files))

        # Component architecture patterns
        print("🔎 Detecting component patterns...")
        found['component_architecture'].extend(self.detect_component_patterns(files))

        # Code quality patterns
        print("🔎 Detecting code quality patterns...")
        found['code_quality'].extend(self.detect_code_quality_patterns(files))

        # Security patterns
        print("🔎 Detecting security patterns...")
        found['security'].extend(self.detect_security_patterns(files))

        # Performance patterns
        print("🔎 Detecting performance patterns...")
        found['performance'].extend(self.detect_performance_patterns(files))

        # Testing patterns
        print("🔎 Detecting testing patterns...")
        found['testing'].extend(self.detect_testing_patterns(files))

        return found

    def detect_data_fetching_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect data fetching patterns"""
        patterns = []

        # SSE Pattern
        sse_pattern = re.compile(r'(EventSource|text/event-stream|ReadableStream)', re.IGNORECASE)
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-sse-reactive-data',
                'Server-Sent Events',
                'data_fetching',
                sse_pattern
            )
        )

        # Tauri Events Pattern
        tauri_pattern = re.compile(r'(listen<|emit|emit_all|@tauri-apps/api/event)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-tauri-events-reactive',
                'Tauri Events',
                'data_fetching',
                tauri_pattern
            )
        )

        # React Server Components Pattern
        rsc_pattern = re.compile(r'(export\s+default\s+async\s+function\s+\w+Page|await\s+fetch\(|await\s+db\.)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-rsc-data-fetching',
                'React Server Components',
                'data_fetching',
                rsc_pattern,
                exclude_pattern=re.compile(r"'use client'")  # Exclude client components
            )
        )

        # Fetch in useEffect (anti-pattern to detect)
        fetch_effect_pattern = re.compile(r'useEffect.*fetch\(')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-fetch-in-useeffect',
                'Fetch in useEffect (Anti-pattern)',
                'data_fetching',
                fetch_effect_pattern,
                confidence='MEDIUM'
            )
        )

        # Polling (potential anti-pattern)
        polling_pattern = re.compile(r'setInterval.*(?:fetch|axios)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-polling',
                'Polling with setInterval',
                'data_fetching',
                polling_pattern,
                confidence='MEDIUM'
            )
        )

        return patterns

    def detect_state_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect state management patterns"""
        patterns = []

        # React Query
        react_query_pattern = re.compile(r'(useQuery|useMutation|QueryClientProvider|@tanstack/react-query)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-react-query-state',
                'React Query',
                'state_management',
                react_query_pattern
            )
        )

        # useState
        usestate_pattern = re.compile(r'useState<[^>]*>\(|useState\(')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-usestate-local-ui',
                'useState',
                'state_management',
                usestate_pattern
            )
        )

        # Context API
        context_pattern = re.compile(r'(createContext|useContext|\.Provider)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-context-shared-ui',
                'React Context',
                'state_management',
                context_pattern
            )
        )

        # Zustand (if used)
        zustand_pattern = re.compile(r'(create\(.*\)|useStore)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-zustand-state',
                'Zustand',
                'state_management',
                zustand_pattern
            )
        )

        return patterns

    def detect_api_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect API design patterns"""
        patterns = []

        # Zod validation
        zod_pattern = re.compile(r'(z\.object|z\.string|z\.number|\.parse\(|\.safeParse\(|from [\'"]zod[\'"])')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-zod-validation',
                'Zod Validation',
                'api_design',
                zod_pattern
            )
        )

        # REST API routes
        rest_pattern = re.compile(r'export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-rest-api-standard',
                'REST API',
                'api_design',
                rest_pattern
            )
        )

        return patterns

    def detect_component_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect component architecture patterns"""
        patterns = []

        # Client components
        client_pattern = re.compile(r"'use client'")
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-client-component-boundaries',
                'Client Components',
                'component_architecture',
                client_pattern
            )
        )

        return patterns

    def detect_code_quality_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect code quality patterns"""
        patterns = []

        # Check tsconfig.json for strict mode
        tsconfig_path = self.root_path / 'tsconfig.json'
        if tsconfig_path.exists():
            try:
                with open(tsconfig_path, 'r') as f:
                    content = f.read()
                    if '"strict": true' in content:
                        patterns.append(PatternUsage(
                            pattern_id='pattern-typescript-strict',
                            pattern_name='TypeScript Strict Mode',
                            category='code_quality',
                            file_path=str(tsconfig_path.relative_to(self.root_path)),
                            line_numbers=[],
                            confidence='HIGH'
                        ))
            except Exception as e:
                print(f"⚠️ Warning: Could not read tsconfig.json: {e}")

        # Detect any types (anti-pattern)
        any_pattern = re.compile(r':\s*any\b')
        any_usages = self.search_pattern(
            files,
            'pattern-any-type',
            'TypeScript any (Anti-pattern)',
            'code_quality',
            any_pattern,
            confidence='MEDIUM'
        )
        patterns.extend(any_usages)

        # Detect ts-ignore (anti-pattern)
        ignore_pattern = re.compile(r'@ts-ignore|@ts-expect-error')
        ignore_usages = self.search_pattern(
            files,
            'pattern-ts-ignore',
            'TypeScript @ts-ignore (Anti-pattern)',
            'code_quality',
            ignore_pattern,
            confidence='MEDIUM'
        )
        patterns.extend(ignore_usages)

        return patterns

    def detect_security_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect security patterns"""
        patterns = []

        # Environment validation
        env_validation_pattern = re.compile(r'(envSchema|z\.object.*API_KEY|validateEnv)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-env-validation',
                'Environment Variable Validation',
                'security',
                env_validation_pattern
            )
        )

        # Detect raw SQL (potential SQL injection risk)
        raw_sql_pattern = re.compile(r'(\$queryRaw|\$executeRaw|\$queryRawUnsafe)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-raw-sql',
                'Raw SQL Queries (Review for SQL Injection)',
                'security',
                raw_sql_pattern,
                confidence='MEDIUM'
            )
        )

        # Detect dangerouslySetInnerHTML (XSS risk)
        dangerous_html_pattern = re.compile(r'dangerouslySetInnerHTML')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-dangerous-html',
                'dangerouslySetInnerHTML (XSS Risk)',
                'security',
                dangerous_html_pattern,
                confidence='MEDIUM'
            )
        )

        return patterns

    def detect_performance_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect performance patterns"""
        patterns = []

        # Next.js Image component
        image_pattern = re.compile(r"from ['\"]next/image['\"]|<Image")
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-nextjs-image-optimization',
                'Next.js Image Component',
                'performance',
                image_pattern
            )
        )

        # Regular img tags (anti-pattern)
        img_pattern = re.compile(r'<img\s+')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-img-tag',
                'Regular img tag (Anti-pattern)',
                'performance',
                img_pattern,
                confidence='MEDIUM'
            )
        )

        return patterns

    def detect_testing_patterns(self, files: List[Path]) -> List[PatternUsage]:
        """Detect testing patterns"""
        patterns = []

        # AAA test structure
        aaa_pattern = re.compile(r'(// ARRANGE|// ACT|// ASSERT)')
        patterns.extend(
            self.search_pattern(
                files,
                'pattern-aaa-test-structure',
                'AAA Test Structure',
                'testing',
                aaa_pattern
            )
        )

        return patterns

    def search_pattern(
        self,
        files: List[Path],
        pattern_id: str,
        pattern_name: str,
        category: str,
        regex: re.Pattern,
        confidence: str = 'HIGH',
        exclude_pattern: Optional[re.Pattern] = None
    ) -> List[PatternUsage]:
        """Search for a specific pattern in all files"""
        usages = []

        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                    # Skip if exclude pattern matches
                    if exclude_pattern and exclude_pattern.search(content):
                        continue

                    matches = []
                    for i, line in enumerate(content.split('\n'), start=1):
                        if regex.search(line):
                            matches.append(i)

                    if matches:
                        relative_path = file_path.relative_to(self.root_path)
                        usages.append(PatternUsage(
                            pattern_id=pattern_id,
                            pattern_name=pattern_name,
                            category=category,
                            file_path=str(relative_path),
                            line_numbers=matches[:5],  # Limit to first 5 matches
                            confidence=confidence
                        ))
            except Exception as e:
                print(f"⚠️ Warning: Could not read {file_path}: {e}")

        return usages

    def find_conflicts(self, patterns_found: Dict) -> List[ArchitectureConflict]:
        """Identify conflicts where multiple patterns exist for the same problem"""
        conflicts = []

        # Define which patterns in each category are mutually exclusive
        conflict_groups = {
            'data_fetching': {
                'patterns': ['Server-Sent Events', 'Polling with setInterval', 'Fetch in useEffect'],
                'severity': 'HIGH',
                'description': 'Multiple data fetching strategies detected',
                'recommendation': 'Standardize on Server-Sent Events for reactive data'
            },
            'state_management': {
                'patterns': ['React Query', 'useState', 'React Context', 'Zustand'],
                'severity': 'MEDIUM',
                'description': 'Multiple state management approaches detected',
                'recommendation': 'Use React Query for server state, useState for local UI, Context for shared UI'
            },
            'performance': {
                'patterns': ['Next.js Image Component', 'Regular img tag'],
                'severity': 'MEDIUM',
                'description': 'Inconsistent image handling detected',
                'recommendation': 'Standardize on Next.js Image component for all images'
            }
        }

        for category, usages in patterns_found.items():
            if category not in conflict_groups:
                continue

            group = conflict_groups[category]
            pattern_counts = defaultdict(int)
            affected_files = []

            for usage in usages:
                if usage.pattern_name in group['patterns']:
                    pattern_counts[usage.pattern_name] += 1
                    affected_files.append(usage.file_path)

            # Conflict exists if multiple patterns found
            if len(pattern_counts) > 1:
                conflicts.append(ArchitectureConflict(
                    category=category,
                    severity=group['severity'],
                    description=group['description'],
                    patterns_found=dict(pattern_counts),
                    affected_files=list(set(affected_files)),
                    recommendation=group['recommendation']
                ))

        return conflicts

    def find_consistent_areas(self, patterns_found: Dict) -> List[str]:
        """Identify areas where patterns are consistently applied"""
        consistent = []

        # Check each category
        for category, usages in patterns_found.items():
            if not usages:
                continue

            # Count unique patterns in category
            pattern_names = set(u.pattern_name for u in usages)

            # If only 1 pattern used extensively (5+ files), it's consistent
            if len(pattern_names) == 1:
                pattern_name = list(pattern_names)[0]
                file_count = len(set(u.file_path for u in usages))

                if file_count >= 5:
                    consistent.append(
                        f"{category.replace('_', ' ').title()}: {pattern_name} "
                        f"(used consistently in {file_count} files)"
                    )

        return consistent

    def generate_recommendations(
        self,
        patterns_found: Dict,
        conflicts: List[ArchitectureConflict]
    ) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []

        # Recommendations for conflicts
        for conflict in conflicts:
            recommendations.append(
                f"⚠️ {conflict.category.replace('_', ' ').title()}: {conflict.recommendation}"
            )

        # Recommendations for anti-patterns
        for category, usages in patterns_found.items():
            for usage in usages:
                if 'Anti-pattern' in usage.pattern_name:
                    file_count = len([u for u in usages if u.pattern_name == usage.pattern_name])
                    recommendations.append(
                        f"❌ Remove {usage.pattern_name} (found in {file_count} files)"
                    )

        # Recommendations for missing critical patterns
        critical_patterns = {
            'pattern-zod-validation': 'Add Zod validation to all API routes',
            'pattern-typescript-strict': 'Enable TypeScript strict mode in tsconfig.json',
        }

        for pattern_id, rec in critical_patterns.items():
            found = False
            for usages in patterns_found.values():
                if any(u.pattern_id == pattern_id for u in usages):
                    found = True
                    break

            if not found:
                recommendations.append(f"➕ {rec}")

        return recommendations

    def generate_summary(
        self,
        patterns_found: Dict,
        conflicts: List[ArchitectureConflict]
    ) -> Dict:
        """Generate summary statistics"""
        total_patterns = sum(len(usages) for usages in patterns_found.values())
        total_files = len(set(
            usage.file_path
            for usages in patterns_found.values()
            for usage in usages
        ))

        categories_with_patterns = sum(1 for usages in patterns_found.values() if usages)

        return {
            'total_patterns_detected': total_patterns,
            'total_files_analyzed': total_files,
            'categories_with_patterns': categories_with_patterns,
            'total_categories': len(patterns_found),
            'conflicts_found': len(conflicts),
            'high_severity_conflicts': sum(1 for c in conflicts if c.severity == 'HIGH'),
        }


def generate_report_markdown(report: ArchitectureReport) -> str:
    """Generate markdown report"""
    lines = []

    lines.append("# Architecture Analysis Report")
    lines.append("")
    lines.append(f"**Generated:** {__import__('datetime').datetime.now().isoformat()}")
    lines.append("")

    # Summary
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Total Patterns Detected:** {report.summary['total_patterns_detected']}")
    lines.append(f"- **Files Analyzed:** {report.summary['total_files_analyzed']}")
    lines.append(f"- **Categories with Patterns:** {report.summary['categories_with_patterns']}/{report.summary['total_categories']}")
    lines.append(f"- **Conflicts Found:** {report.summary['conflicts_found']}")
    lines.append(f"- **High Severity Conflicts:** {report.summary['high_severity_conflicts']}")
    lines.append("")

    # Conflicts
    if report.conflicts:
        lines.append("## ⚠️ Conflicts Detected")
        lines.append("")
        for conflict in report.conflicts:
            lines.append(f"### {conflict.category.replace('_', ' ').title()} ({conflict.severity} Priority)")
            lines.append("")
            lines.append(f"**Description:** {conflict.description}")
            lines.append("")
            lines.append("**Patterns Found:**")
            for pattern, count in conflict.patterns_found.items():
                lines.append(f"- {pattern}: {count} usages")
            lines.append("")
            lines.append(f"**Affected Files:** {len(conflict.affected_files)}")
            lines.append("")
            lines.append(f"**Recommendation:** {conflict.recommendation}")
            lines.append("")

    # Consistent Areas
    if report.consistent_areas:
        lines.append("## ✅ Consistent Patterns")
        lines.append("")
        for area in report.consistent_areas:
            lines.append(f"- {area}")
        lines.append("")

    # Recommendations
    if report.recommendations:
        lines.append("## 💡 Recommendations")
        lines.append("")
        for rec in report.recommendations:
            lines.append(f"- {rec}")
        lines.append("")

    # Pattern Details
    lines.append("## 📊 Pattern Usage Details")
    lines.append("")

    for category, usages in report.patterns_found.items():
        if not usages:
            continue

        lines.append(f"### {category.replace('_', ' ').title()}")
        lines.append("")

        # Group by pattern name
        by_pattern = defaultdict(list)
        for usage in usages:
            by_pattern[usage.pattern_name].append(usage)

        for pattern_name, pattern_usages in by_pattern.items():
            file_count = len(pattern_usages)
            lines.append(f"**{pattern_name}** - {file_count} files")
            lines.append("")
            lines.append("<details>")
            lines.append(f"<summary>Show files</summary>")
            lines.append("")
            for usage in pattern_usages[:10]:  # Limit to first 10
                line_info = f" (lines: {', '.join(map(str, usage.line_numbers))})" if usage.line_numbers else ""
                lines.append(f"- `{usage.file_path}`{line_info}")
            if len(pattern_usages) > 10:
                lines.append(f"- ... and {len(pattern_usages) - 10} more files")
            lines.append("")
            lines.append("</details>")
            lines.append("")

    return '\n'.join(lines)


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Scan codebase for architectural patterns')
    parser.add_argument('path', nargs='?', default='.', help='Path to codebase (default: current directory)')
    parser.add_argument('--format', choices=['json', 'markdown'], default='json', help='Output format')
    parser.add_argument('--output', '-o', help='Output file (default: stdout)')

    args = parser.parse_args()

    # Run scanner
    scanner = ArchitectureScanner(args.path)
    report = scanner.scan_codebase()

    # Generate output
    if args.format == 'json':
        output = json.dumps(asdict(report), indent=2)
    else:
        output = generate_report_markdown(report)

    # Write output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"\n✅ Report written to: {args.output}")
    else:
        print("\n" + output)

    # Print summary to stderr
    print(f"\n✅ Analysis complete!", file=sys.stderr)
    print(f"📊 {report.summary['total_patterns_detected']} patterns detected in {report.summary['total_files_analyzed']} files", file=sys.stderr)
    if report.conflicts:
        print(f"⚠️ {len(report.conflicts)} conflicts found", file=sys.stderr)


if __name__ == '__main__':
    main()
