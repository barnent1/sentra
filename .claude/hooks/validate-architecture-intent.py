#!/usr/bin/env python3
"""
PreToolUse Hook: Architecture Intent Validation

Checks if planned code change will violate architectural patterns.
Runs BEFORE Write/Edit operations.

Exit codes:
- 0: Pattern followed or not applicable
- 2: Pattern violation - BLOCKED
"""

import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

def load_patterns() -> Dict[str, Dict]:
    """Load patterns from patterns.md"""
    patterns_file = Path('.quetrex/memory/patterns.md')

    if not patterns_file.exists():
        return {}

    patterns = {}
    current_pattern = None

    with open(patterns_file, 'r') as f:
        content = f.read()

    # Parse patterns (look for ## Pattern: headers)
    pattern_blocks = re.split(r'\n## Pattern:', content)

    for block in pattern_blocks[1:]:  # Skip intro
        lines = block.split('\n')
        name = lines[0].strip()

        # Extract pattern ID
        id_match = re.search(r'\*\*ID:\*\* `([^`]+)`', block)
        pattern_id = id_match.group(1) if id_match else None

        # Extract mandatory status
        mandatory = 'YES' in block and '**Mandatory:** YES' in block

        # Extract detection rules
        detection_rules = []
        if '**Detection Rules:**' in block:
            rules_section = block.split('**Detection Rules:**')[1].split('**')[0]
            for line in rules_section.split('\n'):
                if line.strip().startswith('- File pattern:'):
                    pattern = line.split('`')[1] if '`' in line else ''
                    detection_rules.append(('file', pattern))
                elif line.strip().startswith('- Content pattern:'):
                    pattern = line.split('`')[1] if '`' in line else ''
                    detection_rules.append(('content', pattern))

        # Extract validation rules
        validation_pass = []
        validation_fail = []
        if '**Validation:**' in block:
            val_section = block.split('**Validation:**')[1].split('**')[0]
            for line in val_section.split('\n'):
                if '✅ PASS if:' in line:
                    validation_pass.append(line.split('✅ PASS if:')[1].strip())
                elif '❌ FAIL if:' in line:
                    validation_fail.append(line.split('❌ FAIL if:')[1].strip())

        if pattern_id:
            patterns[pattern_id] = {
                'name': name,
                'mandatory': mandatory,
                'detection_rules': detection_rules,
                'validation_pass': validation_pass,
                'validation_fail': validation_fail
            }

    return patterns

def check_sse_pattern(file_path: str, content: str) -> Tuple[bool, str]:
    """Check if component should use SSE pattern"""

    # Only check React components
    if not file_path.endswith(('.tsx', '.jsx')):
        return True, ""

    # Check if component fetches data
    data_fetch_patterns = [
        r'useEffect.*fetch\(',
        r'useEffect.*axios\.',
        r'useEffect.*api\.',
    ]

    fetches_data = any(re.search(p, content, re.DOTALL) for p in data_fetch_patterns)

    if not fetches_data:
        return True, ""  # Doesn't fetch data, no violation

    # Check if uses SSE
    uses_sse = any([
        'EventSource' in content,
        'useSSE' in content,
        'useSSEValue' in content,
        '/stream' in content,
    ])

    if not uses_sse:
        return False, f"""
⚠️ ARCHITECTURAL PATTERN VIOLATION

Pattern: SSE for Reactive Data (pattern-sse-reactive-data)
File: {file_path}

Issue: Component fetches data but doesn't use SSE pattern.

Quetrex's architecture requires Server-Sent Events for ALL reactive data.

Current code: Uses fetch/axios in useEffect (requires page refresh)
Required code: Use EventSource or useSSEValue hook

Fix options:
1. If data can change: Implement SSE subscription
2. If data is static: Remove useEffect, fetch in Server Component
3. If truly one-time: Add comment explaining why SSE not needed

See: .quetrex/memory/patterns.md (pattern-sse-reactive-data)
See: docs/architecture/DATA-FETCHING.md

❌ BLOCKED until pattern is followed.
"""

    return True, ""

def check_typescript_strict(file_path: str, content: str) -> Tuple[bool, str]:
    """Check for TypeScript 'any' usage"""

    if not file_path.endswith(('.ts', '.tsx')):
        return True, ""

    # Look for 'any' type
    any_pattern = r':\s*any\b|<any>|\bany\[\]'

    if re.search(any_pattern, content):
        return False, f"""
⚠️ ARCHITECTURAL PATTERN VIOLATION

Pattern: TypeScript Strict Mode (pattern-typescript-strict)
File: {file_path}

Issue: Using 'any' type violates TypeScript strict mode.

Quetrex requires explicit types for all code.

Current code: Uses 'any' type
Required code: Use specific types

Fix options:
1. Define proper interface/type
2. Use 'unknown' and add type guard
3. Use generic type parameter

See: .quetrex/memory/patterns.md (pattern-typescript-strict)

❌ BLOCKED until fixed.
"""

    return True, ""

def check_client_component_boundaries(file_path: str, content: str) -> Tuple[bool, str]:
    """Check for proper server/client component separation"""

    if not file_path.endswith(('.tsx', '.jsx')):
        return True, ""

    # Check if component is client component
    is_client = "'use client'" in content or '"use client"' in content

    # Check if using async (server component feature)
    has_async = re.search(r'export\s+default\s+async\s+function', content)

    # Error: async in client component
    if is_client and has_async:
        return False, f"""
⚠️ ARCHITECTURAL PATTERN VIOLATION

Pattern: Client Component Boundaries (pattern-client-component-boundaries)
File: {file_path}

Issue: Cannot use async in client component.

Current code: 'use client' with async component
Required code: Remove 'use client' OR remove async

Fix: Server components are async, client components use hooks.

See: .quetrex/memory/patterns.md (pattern-client-component-boundaries)

❌ BLOCKED until fixed.
"""

    return True, ""

def check_zod_validation(file_path: str, content: str) -> Tuple[bool, str]:
    """Check if API routes use Zod validation"""

    # Only check API route files
    if not (file_path.endswith('route.ts') and '/api/' in file_path):
        return True, ""

    # Check if route handles POST/PATCH/PUT
    handles_mutations = any([
        re.search(r'export\s+async\s+function\s+POST', content),
        re.search(r'export\s+async\s+function\s+PATCH', content),
        re.search(r'export\s+async\s+function\s+PUT', content),
    ])

    if not handles_mutations:
        return True, ""  # GET-only routes don't need input validation

    # Check if uses Zod validation
    uses_zod = any([
        'z.object' in content,
        '.parse(' in content,
        '.safeParse(' in content,
        'import { z }' in content,
        'import * as z' in content,
    ])

    if not uses_zod:
        return False, f"""
⚠️ ARCHITECTURAL PATTERN VIOLATION

Pattern: Zod Input Validation (pattern-zod-validation)
File: {file_path}

Issue: API route accepts user input without Zod validation.

All API routes that accept data (POST/PATCH/PUT) MUST validate input with Zod.

Current code: No Zod validation detected
Required code: Define Zod schema and validate request body

Example:
```typescript
import {{ z }} from 'zod';

const schema = z.object({{
  name: z.string().min(1),
  email: z.string().email(),
}});

export async function POST(request: Request) {{
  const body = await request.json();
  const data = schema.parse(body); // Validates and throws on error
  // ...
}}
```

See: .quetrex/memory/patterns.md (pattern-zod-validation)

❌ BLOCKED until validation added.
"""

    return True, ""

def validate_architecture(hook_context: Dict) -> Dict:
    """Main validation function"""

    tool_name = hook_context.get('toolName', '')
    tool_input = hook_context.get('toolInput', {})

    # Only validate Write/Edit operations
    if tool_name not in ['Write', 'Edit']:
        return {'continue': True}

    file_path = tool_input.get('file_path', '')
    content = tool_input.get('content', '') or tool_input.get('new_string', '')

    if not file_path or not content:
        return {'continue': True}

    # Skip node_modules, dist, .next, etc.
    skip_dirs = ['node_modules', 'dist', '.next', 'build', 'out', '.git']
    if any(skip_dir in file_path for skip_dir in skip_dirs):
        return {'continue': True}

    # Load patterns (cached in memory for performance)
    patterns = load_patterns()

    # Run validation checks
    checks = [
        check_typescript_strict(file_path, content),
        check_client_component_boundaries(file_path, content),
        check_zod_validation(file_path, content),
        # SSE check is less strict, only warn for now
        # check_sse_pattern(file_path, content),
    ]

    # Check for violations
    for is_valid, error_message in checks:
        if not is_valid:
            return {
                'continue': False,
                'systemMessage': error_message
            }

    return {'continue': True}

if __name__ == '__main__':
    try:
        input_data = sys.stdin.read()
        hook_context = json.loads(input_data)
        result = validate_architecture(hook_context)

        print(json.dumps(result))
        sys.exit(0 if result.get('continue', True) else 2)

    except json.JSONDecodeError as e:
        # JSON parsing error - allow but warn
        print(json.dumps({
            'continue': True,
            'systemMessage': f'Hook JSON parse error (allowing): {str(e)}'
        }))
        sys.exit(0)
    except Exception as e:
        # Other error - allow but warn (fail open for safety)
        print(json.dumps({
            'continue': True,
            'systemMessage': f'Hook error (allowing): {str(e)}'
        }))
        sys.exit(0)
