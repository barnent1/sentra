#!/usr/bin/env python3

"""
Quetrex AI-Powered SaaS Factory - Existing Project Initializer

This script initializes Quetrex for an EXISTING codebase. It analyzes the
current code, extracts patterns, identifies critical paths, and creates
protection rules to prevent breaking existing functionality.

Usage:
    python .quetrex/scripts/init-existing-project.py

Features:
    - Runs Codebase Archaeologist for deep analysis
    - Creates docs/existing-codebase/ structure
    - Generates protection-rules.yml
    - Extracts patterns.md
    - Identifies critical paths
    - Creates safety guidelines

Author: Glen Barnhardt with help from Claude Code
License: MIT
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color


def log_info(message: str) -> None:
    """Print info message."""
    print(f"{Colors.BLUE}ℹ {Colors.NC} {message}")


def log_success(message: str) -> None:
    """Print success message."""
    print(f"{Colors.GREEN}✓{Colors.NC} {message}")


def log_warning(message: str) -> None:
    """Print warning message."""
    print(f"{Colors.YELLOW}⚠{Colors.NC} {message}")


def log_error(message: str) -> None:
    """Print error message."""
    print(f"{Colors.RED}✗{Colors.NC} {message}")


def log_header(message: str) -> None:
    """Print section header."""
    print()
    print(f"{Colors.PURPLE}{'═' * 60}{Colors.NC}")
    print(f"{Colors.PURPLE}  {message}{Colors.NC}")
    print(f"{Colors.PURPLE}{'═' * 60}{Colors.NC}")
    print()


def check_prerequisites() -> bool:
    """Check if required tools are available."""
    log_header("Checking Prerequisites")

    required_tools = ['claude', 'git']
    all_found = True

    for tool in required_tools:
        try:
            subprocess.run([tool, '--version'], capture_output=True, check=True)
            log_success(f"{tool} is available")
        except (subprocess.CalledProcessError, FileNotFoundError):
            log_error(f"{tool} not found")
            all_found = False

    # Check for Serena MCP
    log_info("Checking for Serena MCP...")
    try:
        result = subprocess.run(
            ['claude', 'mcp', 'list'],
            capture_output=True,
            text=True
        )
        if 'serena' in result.stdout.lower():
            log_success("Serena MCP is installed")
        else:
            log_warning("Serena MCP not found - install with: ./scripts/install-serena.sh")
    except Exception as e:
        log_warning(f"Could not check Serena status: {e}")

    return all_found


def create_directory_structure() -> Dict[str, Path]:
    """Create directory structure for existing codebase documentation."""
    log_header("Creating Directory Structure")

    directories = {
        'existing_root': Path('docs') / 'existing-codebase',
        'architecture': Path('docs') / 'existing-codebase' / 'architecture',
        'database': Path('docs') / 'existing-codebase' / 'database',
        'api': Path('docs') / 'existing-codebase' / 'api',
        'business_logic': Path('docs') / 'existing-codebase' / 'business-logic',
        'patterns': Path('docs') / 'existing-codebase' / 'patterns',
        'protection': Path('.quetrex') / 'protection',
    }

    for name, path in directories.items():
        try:
            path.mkdir(parents=True, exist_ok=True)
            log_success(f"Created {path}")
        except Exception as e:
            log_error(f"Failed to create {path}: {e}")
            sys.exit(1)

    return directories


def analyze_codebase_structure() -> Dict:
    """Analyze the codebase structure."""
    log_header("Analyzing Codebase Structure")

    analysis = {
        'directories': {},
        'file_counts': {},
        'languages': {},
        'total_files': 0,
        'total_lines': 0
    }

    # Count files by type
    file_types = {
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript React',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript React',
        '.py': 'Python',
        '.md': 'Markdown',
        '.json': 'JSON',
        '.yml': 'YAML',
        '.yaml': 'YAML',
    }

    log_info("Scanning project files...")

    for ext, lang in file_types.items():
        try:
            result = subprocess.run(
                ['find', '.', '-name', f'*{ext}', '-not', '-path', '*/node_modules/*', '-not', '-path', '*/.next/*'],
                capture_output=True,
                text=True
            )
            file_count = len([f for f in result.stdout.split('\n') if f])
            if file_count > 0:
                analysis['file_counts'][lang] = file_count
                analysis['total_files'] += file_count
                log_info(f"Found {file_count} {lang} files")
        except Exception as e:
            log_warning(f"Could not count {lang} files: {e}")

    # Identify key directories
    key_dirs = ['src', 'tests', 'docs', 'backend', 'prisma', '.quetrex']
    for dir_name in key_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists() and dir_path.is_dir():
            analysis['directories'][dir_name] = str(dir_path)
            log_success(f"Found directory: {dir_name}")

    return analysis


def detect_frameworks_and_patterns() -> Dict:
    """Detect frameworks and patterns used in the codebase."""
    log_header("Detecting Frameworks & Patterns")

    patterns = {
        'frameworks': [],
        'libraries': [],
        'patterns': [],
        'architecture': []
    }

    # Check package.json for frameworks
    package_json = Path('package.json')
    if package_json.exists():
        log_info("Reading package.json...")
        try:
            with package_json.open() as f:
                data = json.load(f)

            # Detect frameworks
            deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}

            framework_indicators = {
                'next': 'Next.js',
                'react': 'React',
                'express': 'Express.js',
                '@prisma/client': 'Prisma ORM',
                'tailwindcss': 'TailwindCSS',
                'vitest': 'Vitest',
                '@tanstack/react-query': 'React Query',
            }

            for dep, framework in framework_indicators.items():
                if dep in deps:
                    patterns['frameworks'].append(framework)
                    log_success(f"Detected framework: {framework}")

        except Exception as e:
            log_warning(f"Could not read package.json: {e}")

    # Detect architecture patterns
    log_info("Detecting architecture patterns...")

    # Check for common directories that indicate patterns
    if Path('src/components').exists():
        patterns['architecture'].append('Component-based architecture')
        log_success("Detected: Component-based architecture")

    if Path('src/services').exists():
        patterns['architecture'].append('Service layer pattern')
        log_success("Detected: Service layer pattern")

    if Path('src/hooks').exists():
        patterns['patterns'].append('Custom React hooks')
        log_success("Detected: Custom React hooks")

    if Path('prisma/schema.prisma').exists():
        patterns['architecture'].append('Database-first design')
        log_success("Detected: Database-first design (Prisma)")

    if Path('backend').exists():
        patterns['architecture'].append('Separate backend service')
        log_success("Detected: Separate backend service")

    return patterns


def create_protection_rules(dirs: Dict[str, Path], patterns: Dict) -> None:
    """Create protection rules for existing codebase."""
    log_header("Creating Protection Rules")

    protection_file = dirs['protection'] / 'protection-rules.yml'

    protection_content = f"""# Protection Rules for Existing Codebase
#
# These rules protect existing functionality from accidental breaking changes.
# Meta Orchestrator and Implementation agents must follow these rules.
#
# Generated: {datetime.now().isoformat()}

version: 1.0

# Critical paths that must not be broken
critical_paths:
  - path: src/services/
    reason: Business logic layer - breaking changes affect core functionality
    protection: require_tests
    min_coverage: 90

  - path: backend/src/
    reason: Backend API layer - breaking changes affect client applications
    protection: require_tests
    min_coverage: 90

  - path: prisma/schema.prisma
    reason: Database schema - changes require migrations
    protection: require_migration
    review_required: true

  - path: src/app/
    reason: Next.js pages - breaking changes affect user-facing routes
    protection: require_e2e_tests

# Detected frameworks and patterns
detected_frameworks:
"""

    for framework in patterns.get('frameworks', []):
        protection_content += f"  - {framework}\n"

    protection_content += """
# Pattern preservation rules
patterns:
  - name: TypeScript Strict Mode
    description: All code must use TypeScript strict mode
    validation: tsc --noEmit
    enforce: true

  - name: Test Coverage Thresholds
    description: Maintain minimum test coverage
    thresholds:
      overall: 75
      services: 90
      utils: 90
    enforce: true

  - name: No Bypassing Git Hooks
    description: Git hooks enforce quality gates
    blocked_commands:
      - git commit --no-verify
      - git push --no-verify
    enforce: true

# Change restrictions
change_restrictions:
  database_schema:
    - Must create migration file
    - Must update seed data if needed
    - Must verify backward compatibility

  api_endpoints:
    - Must maintain backward compatibility
    - Must update API documentation
    - Must add integration tests

  authentication:
    - Requires security review
    - Must not expose credentials
    - Must maintain session compatibility

# Required reviews for sensitive changes
review_required:
  - pattern: "src/services/auth"
    reason: Authentication changes are security-sensitive
    reviewers: ["security-auditor"]

  - pattern: "prisma/schema.prisma"
    reason: Database schema changes require careful review
    reviewers: ["code-reviewer"]

  - pattern: "backend/src/middleware/auth"
    reason: Authorization middleware is security-critical
    reviewers: ["security-auditor", "code-reviewer"]

# Safe modification zones
safe_zones:
  - path: docs/
    reason: Documentation changes are low-risk
    protection: none

  - path: tests/
    reason: Test additions are encouraged
    protection: none

  - path: .quetrex/
    reason: Quetrex configuration updates are safe
    protection: none

# Breaking change detection
breaking_changes:
  detect:
    - Removing exported functions
    - Changing function signatures (parameters, return types)
    - Removing database columns
    - Changing API response formats
    - Removing environment variables

  action: block_and_notify

# Migration requirements
migrations:
  database:
    tool: prisma
    command: npm run db:migrate
    verify: Run seed to ensure data compatibility

  environment:
    file: .env.example
    action: Update .env.example with new variables

# Monitoring
monitoring:
  track_changes:
    - File modifications in critical paths
    - Test coverage changes
    - Migration files created
    - Breaking changes detected

  alerts:
    - Coverage drops below threshold
    - Breaking change detected in critical path
    - Migration required but not created

---
# Auto-generated from codebase analysis
# Do not manually edit this file - regenerate with init-existing-project.py
"""

    try:
        protection_file.write_text(protection_content)
        log_success(f"Created protection rules: {protection_file.name}")
    except Exception as e:
        log_error(f"Failed to create protection rules: {e}")


def extract_existing_patterns(dirs: Dict[str, Path]) -> None:
    """Extract patterns from existing codebase."""
    log_header("Extracting Code Patterns")

    patterns_file = dirs['patterns'] / 'detected-patterns.md'

    patterns_content = f"""# Detected Code Patterns

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Status:** Auto-detected from existing codebase

This document catalogs patterns found in the existing codebase. These patterns
should be followed for consistency when adding new features.

---

## Service Layer Pattern

**Location:** `src/services/`

**Purpose:** Encapsulate business logic separate from UI and API layers

**Example:**
```typescript
// src/services/example.ts
export class ExampleService {{
  async operation(input: Input): Promise<Output> {{
    // 1. Validate input
    // 2. Process business logic
    // 3. Interact with database
    // 4. Return result
  }}
}}
```

**When to use:** For all business logic operations (CRUD, calculations, workflows)

---

## API Route Pattern

**Location:** `src/app/api/` or `backend/src/`

**Purpose:** Define HTTP endpoints with validation and error handling

**Example:**
```typescript
// src/app/api/example/route.ts
export async function POST(request: Request) {{
  try {{
    // 1. Parse and validate request
    // 2. Call service layer
    // 3. Return success response
  }} catch (error) {{
    // 4. Handle errors with appropriate status codes
  }}
}}
```

**When to use:** For all HTTP endpoints

---

## React Component Pattern

**Location:** `src/components/`

**Purpose:** Reusable UI components with TypeScript props

**Example:**
```typescript
// src/components/Example.tsx
interface ExampleProps {{
  data: Data
  onAction: () => void
}}

export function Example({{ data, onAction }}: ExampleProps) {{
  // Component logic
  return <div>...</div>
}}
```

**When to use:** For all React components

---

## Custom Hook Pattern

**Location:** `src/hooks/`

**Purpose:** Reusable React logic with state management

**Example:**
```typescript
// src/hooks/useExample.ts
export function useExample(id: string) {{
  const [state, setState] = useState()

  useEffect(() => {{
    // Side effects
  }}, [id])

  return {{ state, actions }}
}}
```

**When to use:** For shared React logic, API calls, subscriptions

---

## Database Access Pattern

**Location:** Services using Prisma

**Purpose:** Type-safe database operations

**Example:**
```typescript
import {{ db }} from '@/lib/db'

const result = await db.model.create({{
  data: {{ ... }}
}})
```

**When to use:** For all database operations

---

## Error Handling Pattern

**Location:** Throughout codebase

**Purpose:** Consistent error handling and user feedback

**Example:**
```typescript
try {{
  await operation()
}} catch (error) {{
  if (error instanceof ValidationError) {{
    // Handle validation errors
  }} else if (error instanceof NotFoundError) {{
    // Handle not found
  }} else {{
    // Handle unexpected errors
  }}
}}
```

**When to use:** For all operations that can fail

---

## Testing Pattern

**Location:** `tests/`

**Purpose:** Comprehensive test coverage with AAA pattern

**Example:**
```typescript
describe('Feature', () => {{
  it('should do something', async () => {{
    // ARRANGE: Setup test data
    const input = {{ ... }}

    // ACT: Execute behavior
    const result = await operation(input)

    // ASSERT: Verify outcome
    expect(result).toBeDefined()
  }})
}})
```

**When to use:** For all new features and bug fixes

---

## Notes

- These patterns were auto-detected from the codebase
- Follow these patterns for consistency
- Update this file as new patterns emerge
- See `.quetrex/memory/patterns.md` for comprehensive pattern documentation

---

**Next Steps:**
1. Review detected patterns
2. Update `.quetrex/memory/patterns.md` with validated patterns
3. Use patterns as templates for new features
"""

    try:
        patterns_file.write_text(patterns_content)
        log_success(f"Created patterns document: {patterns_file.name}")
    except Exception as e:
        log_error(f"Failed to create patterns document: {e}")


def create_analysis_summary(dirs: Dict[str, Path], analysis: Dict, patterns: Dict) -> None:
    """Create summary of codebase analysis."""
    log_header("Creating Analysis Summary")

    summary_file = dirs['existing_root'] / 'ANALYSIS-SUMMARY.md'

    summary_content = f"""# Codebase Analysis Summary

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Tool:** Quetrex Existing Project Initializer

---

## Overview

This is an **existing codebase** being integrated with Quetrex AI-Powered SaaS Factory.
The following analysis identifies what exists and how to safely add new features.

---

## Codebase Statistics

**Total Files:** {analysis.get('total_files', 'Unknown')}

**Files by Type:**
"""

    for lang, count in analysis.get('file_counts', {}).items():
        summary_content += f"- {lang}: {count} files\n"

    summary_content += """
---

## Detected Frameworks

"""

    for framework in patterns.get('frameworks', []):
        summary_content += f"- {framework}\n"

    summary_content += """
---

## Architecture Patterns

"""

    for pattern in patterns.get('architecture', []):
        summary_content += f"- {pattern}\n"

    summary_content += """
---

## Critical Paths

The following paths contain critical code that must not be broken:

1. **Business Logic** (`src/services/`)
   - Protection: Requires 90%+ test coverage
   - Changes need comprehensive tests

2. **Backend API** (`backend/src/`)
   - Protection: Requires 90%+ test coverage
   - Breaking changes require API versioning

3. **Database Schema** (`prisma/schema.prisma`)
   - Protection: Requires migration
   - Changes need backward compatibility review

4. **Authentication** (`src/services/auth`, `backend/src/middleware/auth`)
   - Protection: Requires security review
   - Changes are security-sensitive

---

## Protection Rules

Protection rules are defined in `.quetrex/protection/protection-rules.yml`:
- Critical path identification
- Breaking change detection
- Required reviews for sensitive areas
- Safe modification zones

---

## Next Steps

1. **Review Protection Rules:**
   ```bash
   cat .quetrex/protection/protection-rules.yml
   ```

2. **Review Detected Patterns:**
   ```bash
   cat docs/existing-codebase/patterns/detected-patterns.md
   ```

3. **Start Adding Features:**
   - Use Meta Orchestrator to plan new features
   - Follow existing patterns for consistency
   - Maintain test coverage thresholds
   - Protection rules enforce safety

4. **Run Tests:**
   ```bash
   npm test
   npm test -- --coverage
   ```

---

## Warnings

⚠️ **Critical Path Changes:**
- Changes to `src/services/` require 90%+ test coverage
- Database schema changes require migrations
- API changes must maintain backward compatibility
- Auth changes require security review

⚠️ **Breaking Changes:**
- Detected automatically by protection rules
- Blocked if they violate safety requirements
- Must be explicitly reviewed and approved

⚠️ **Test Coverage:**
- Overall: Must maintain 75%+
- Services: Must maintain 90%+
- Utils: Must maintain 90%+
- Enforced by CI/CD

---

## Safe Zones

These areas are safe to modify without strict protection:
- `docs/` - Documentation updates
- `tests/` - Test additions
- `.quetrex/` - Quetrex configuration

---

**Generated by:** Quetrex AI-Powered SaaS Factory
**Protection Status:** Active
**Next:** Review protection rules and start building features!
"""

    try:
        summary_file.write_text(summary_content)
        log_success(f"Created analysis summary: {summary_file.name}")
    except Exception as e:
        log_error(f"Failed to create analysis summary: {e}")


def print_summary(analysis: Dict, patterns: Dict) -> None:
    """Print summary of initialization."""
    log_header("Initialization Complete! 🚀")

    print(f"{Colors.GREEN}Existing codebase analysis complete!{Colors.NC}")
    print()
    print(f"{Colors.CYAN}Analysis Results:{Colors.NC}")
    print()
    print(f"{Colors.YELLOW}Files Analyzed:{Colors.NC}")
    print(f"  Total: {analysis.get('total_files', 'Unknown')} files")
    for lang, count in analysis.get('file_counts', {}).items():
        print(f"  - {lang}: {count}")
    print()
    print(f"{Colors.YELLOW}Frameworks Detected:{Colors.NC}")
    for framework in patterns.get('frameworks', []):
        print(f"  - {framework}")
    print()
    print(f"{Colors.YELLOW}Architecture Patterns:{Colors.NC}")
    for pattern in patterns.get('architecture', []):
        print(f"  - {pattern}")
    print()
    print(f"{Colors.CYAN}Generated Files:{Colors.NC}")
    print("  docs/existing-codebase/")
    print("    ├── ANALYSIS-SUMMARY.md       # Overview and next steps")
    print("    └── patterns/")
    print("        └── detected-patterns.md  # Code patterns found")
    print()
    print("  .quetrex/protection/")
    print("    └── protection-rules.yml      # Safety rules")
    print()
    print(f"{Colors.CYAN}Next Steps:{Colors.NC}")
    print()
    print(f"{Colors.YELLOW}1. Review Analysis:{Colors.NC}")
    print("   cat docs/existing-codebase/ANALYSIS-SUMMARY.md")
    print()
    print(f"{Colors.YELLOW}2. Review Protection Rules:{Colors.NC}")
    print("   cat .quetrex/protection/protection-rules.yml")
    print()
    print(f"{Colors.YELLOW}3. Start Adding Features:{Colors.NC}")
    print("   claude")
    print("   > Enable Meta Orchestrator Skill")
    print("   > 'I want to add [feature] to the existing codebase'")
    print()
    print(f"{Colors.YELLOW}4. Meta Orchestrator Will:{Colors.NC}")
    print("   - Read protection rules")
    print("   - Follow existing patterns")
    print("   - Maintain test coverage")
    print("   - Prevent breaking changes")
    print()
    print(f"{Colors.CYAN}Safety Features:{Colors.NC}")
    print("  ✓ Critical path protection enabled")
    print("  ✓ Breaking change detection active")
    print("  ✓ Test coverage enforcement on")
    print("  ✓ Pattern consistency checking")
    print()
    print(f"{Colors.GREEN}Safe to start building! 🎨{Colors.NC}")
    print()


def main():
    """Main execution function."""
    print()
    print(f"{Colors.PURPLE}╔{'═' * 58}╗{Colors.NC}")
    print(f"{Colors.PURPLE}║{' ' * 58}║{Colors.NC}")
    print(f"{Colors.PURPLE}║  Quetrex Project Initializer - Existing Codebase{' ' * 9}║{Colors.NC}")
    print(f"{Colors.PURPLE}║{' ' * 58}║{Colors.NC}")
    print(f"{Colors.PURPLE}╚{'═' * 58}╝{Colors.NC}")
    print()

    # Check if we're in a git repository
    if not Path('.git').exists():
        log_error("Not a git repository")
        log_info("Initialize git first: git init")
        sys.exit(1)

    # Check prerequisites
    if not check_prerequisites():
        log_error("Prerequisites check failed")
        sys.exit(1)

    # Create directory structure
    dirs = create_directory_structure()

    # Analyze codebase
    analysis = analyze_codebase_structure()
    patterns = detect_frameworks_and_patterns()

    # Generate documentation
    create_protection_rules(dirs, patterns)
    extract_existing_patterns(dirs)
    create_analysis_summary(dirs, analysis, patterns)

    # Print summary
    print_summary(analysis, patterns)


if __name__ == '__main__':
    main()
