# TypeScript Strictness Enforcement

## Overview

Sentra enforces **zero-tolerance TypeScript strict mode** through **pattern-based learning** and **pre-emptive validation**. Agents learn from existing strictly-typed code to write type-perfect code from the start, minimizing errors and iterations.

**Goal:** Agents write code that passes `tsc --noEmit --strict` on first try by copying proven patterns.

## The Problem with Trial-and-Error Typing

### **Traditional Approach (BAD):**
```typescript
// Agent writes code without patterns
export async function POST(req: Request) {
  const data = await req.json();  // ❌ Type 'any'
  const user = await db.select()  // ❌ Type 'any[]'
    .from(users)
    .where(eq(users.id, data.id)); // ❌ Type error: data.id

  return Response.json(user);      // ❌ Type error: user[0]
}

// Result: 15+ type errors, 10+ iterations to fix
```

### **Sentra Approach (GOOD):**
```typescript
// 1. Agent reads app/api/users/route.ts (existing pattern)
// 2. Copies exact type pattern
// 3. Adapts for new feature

export async function POST(req: Request) {
  // Pattern: Always type request body
  const body = await req.json() as CreateUserInput;

  // Pattern: Use Zod for validation
  const validated = createUserSchema.parse(body);

  // Pattern: Drizzle inferSelect type
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, validated.id))
    .limit(1)
    .then(rows => rows[0]); // Pattern: Get first row

  // Pattern: Typed response
  return Response.json<UserResponse>(user);
}

// Result: 0 type errors, 1 iteration ✅
```

## TypeScript Strict Mode Configuration

### **tsconfig.json (Enforced)**

```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "strictNullChecks": true,          // Null safety
    "strictFunctionTypes": true,       // Function signature safety
    "strictPropertyInitialization": true, // Class property safety
    "noImplicitAny": true,             // No 'any' without explicit type
    "noImplicitThis": true,            // 'this' must be typed
    "noUnusedLocals": true,            // Catch unused variables
    "noUnusedParameters": true,        // Catch unused parameters
    "noFallthroughCasesInSwitch": true, // Prevent switch fallthrough
    "noImplicitReturns": true,         // All code paths must return
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2022",
    "lib": ["es2022", "dom", "dom.iterable"],
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Key Rules:**
- ❌ No `any` types (use `unknown` and narrow)
- ❌ No implicit returns
- ❌ No unused variables
- ✅ All nulls explicitly handled
- ✅ All functions fully typed

## Pattern-Based Type Learning

### **Step 1: Find Type Patterns**

**MCP Tool:** `find_type_patterns`

```typescript
{
  name: "find_type_patterns",
  description: "Find type patterns from existing code",
  inputSchema: {
    context: "string - What you're typing (e.g., 'API route', 'database query')",
    filePatterns: "string[] - Where to search"
  },
  handler: async (input) => {
    const files = await glob(input.filePatterns);
    const typePatterns = [];

    for (const file of files) {
      const ast = await parseTypeScript(file);

      typePatterns.push({
        file,
        patterns: {
          apiRoutes: extractAPIRouteTypes(ast),
          dbQueries: extractDatabaseTypes(ast),
          components: extractComponentTypes(ast),
          utilities: extractUtilityTypes(ast)
        },
        examples: extractCodeExamples(ast)
      });
    }

    return {
      foundPatterns: typePatterns,
      recommendations: [
        "Use 'typeof schema.$inferSelect' for DB types",
        "Use Zod schemas for API input validation",
        "Use generics for reusable components"
      ]
    };
  }
}
```

**Example Usage:**

```typescript
// Agent planning auth feature
const patterns = await find_type_patterns({
  context: "API route with database query",
  filePatterns: ["app/api/*/route.ts"]
});

// Returns:
{
  foundPatterns: [
    {
      file: "app/api/users/route.ts",
      patterns: {
        apiRoutes: {
          requestBodyType: "as CreateUserInput",
          validationSchema: "createUserSchema.parse(body)",
          dbQueryType: "typeof users.$inferSelect",
          responseType: "Response.json<UserResponse>(data)"
        }
      },
      examples: [
        "const body = await req.json() as CreateUserInput;",
        "const validated = createUserSchema.parse(body);",
        "const user: User = await db.select()..."
      ]
    }
  ],
  recommendations: [
    "Always type request body with 'as Type'",
    "Validate with Zod schema.parse()",
    "Use Drizzle infer types for DB results"
  ]
}

// Agent now knows EXACTLY how to type the new API route
```

### **Step 2: Validate Types Preemptively**

**Before writing any code**, validate the type structure:

**MCP Tool:** `validate_types_preemptive`

```typescript
{
  name: "validate_types_preemptive",
  description: "Validate type structure before coding",
  inputSchema: {
    feature: "string",
    expectedTypes: "object - Type definitions planned",
    referencePatterns: "object - Patterns to compare against"
  },
  handler: async (input) => {
    // Check if types follow patterns
    const validation = {
      followsPatterns: true,
      issues: [],
      suggestions: []
    };

    // Check for common mistakes
    if (input.expectedTypes.includes('any')) {
      validation.followsPatterns = false;
      validation.issues.push("'any' type detected - use 'unknown' and narrow");
    }

    if (!input.expectedTypes.includes('Zod')) {
      validation.suggestions.push("Consider Zod schema for runtime validation");
    }

    // Compare against reference patterns
    const patternMatch = compareWithPatterns(
      input.expectedTypes,
      input.referencePatterns
    );

    if (patternMatch.score < 80) {
      validation.followsPatterns = false;
      validation.issues.push(
        `Type structure differs from patterns (${patternMatch.score}% match)`
      );
    }

    return {
      valid: validation.followsPatterns,
      issues: validation.issues,
      suggestions: validation.suggestions,
      correctedTypes: validation.followsPatterns
        ? input.expectedTypes
        : generatePatternCompliantTypes(input, input.referencePatterns)
    };
  }
}
```

### **Step 3: Continuous Type Checking**

**Hook:** `post-tool-use.ts` checks types after every file write

```typescript
// In post-tool-use hook
if (tool_name === 'Write' || tool_name === 'Edit') {
  const filePath = tool_input.file_path;

  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    // Run typecheck immediately
    const result = await exec('tsc --noEmit --strict', {
      cwd: worktreePath
    });

    if (result.exitCode !== 0) {
      // Parse type errors
      const errors = parseTypeScriptErrors(result.stderr);

      // Log to database for agent
      await db.insert(hookEvents).values({
        sessionId: session_id,
        hookName: 'typecheck_failure',
        eventData: {
          file: filePath,
          errors,
          autoFixable: categorizeErrors(errors)
        }
      });

      // Suggest pattern-based fixes
      const patterns = await find_type_patterns({
        context: "fix type errors",
        filePatterns: [path.dirname(filePath) + '/**/*.ts']
      });

      console.log(`Type errors found. Check similar files: ${patterns.recommendations}`);
    }
  }
}
```

## Common TypeScript Patterns

### **1. API Route Pattern**

**Template to copy:**

```typescript
// app/api/users/route.ts (REFERENCE PATTERN)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 1. Define input schema (Zod)
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user'])
});

// 2. Infer type from schema
type CreateUserInput = z.infer<typeof createUserSchema>;

// 3. Define response type
interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// 4. API route handler (fully typed)
export async function POST(req: NextRequest): Promise<NextResponse<UserResponse | { error: string }>> {
  try {
    // Type request body
    const body = await req.json() as unknown;

    // Validate (throws if invalid)
    const validated = createUserSchema.parse(body);

    // Database query (typed by Drizzle)
    const newUser = await db
      .insert(users)
      .values(validated)
      .returning()
      .then(rows => rows[0]);

    // Typed response
    return NextResponse.json<UserResponse>(newUser);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**How Agent Uses This:**

```typescript
// Agent creating auth route copies this exact pattern:

// 1. Copy Zod schema pattern
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type LoginInput = z.infer<typeof loginSchema>;

// 2. Copy response type pattern
interface LoginResponse {
  user: { id: string; email: string };
  token: string;
}

// 3. Copy handler pattern
export async function POST(req: NextRequest): Promise<NextResponse<LoginResponse | { error: string }>> {
  try {
    const body = await req.json() as unknown;
    const validated = loginSchema.parse(body);

    // ... auth logic (also copied from pattern)

    return NextResponse.json<LoginResponse>(result);
  } catch (error) {
    // ... same error handling
  }
}

// Result: 0 type errors ✅
```

### **2. Database Query Pattern**

**Template to copy:**

```typescript
// lib/db/queries/users.ts (REFERENCE PATTERN)

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Infer types from schema
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

// Typed query function
export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null; // Handle empty array
}

// Typed create function
export async function createUser(data: NewUser): Promise<User> {
  const result = await db
    .insert(users)
    .values(data)
    .returning();

  return result[0]; // Always returns 1 row with returning()
}

// Typed update function
export async function updateUser(
  id: string,
  data: Partial<NewUser>
): Promise<User | null> {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  return result[0] ?? null;
}
```

**How Agent Uses This:**

```typescript
// Agent creating auth token queries copies this pattern:

import { db } from '@/lib/db';
import { authTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Copy type inference pattern
type AuthToken = typeof authTokens.$inferSelect;
type NewAuthToken = typeof authTokens.$inferInsert;

// Copy query pattern
export async function getTokenByValue(token: string): Promise<AuthToken | null> {
  const result = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.token, token))
    .limit(1);

  return result[0] ?? null; // Same null handling
}

// Copy create pattern
export async function createAuthToken(data: NewAuthToken): Promise<AuthToken> {
  const result = await db
    .insert(authTokens)
    .values(data)
    .returning();

  return result[0]; // Same return handling
}

// Result: Perfect Drizzle types ✅
```

### **3. React Component Pattern**

**Template to copy:**

```typescript
// app/components/ui/button.tsx (REFERENCE PATTERN)

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Extend HTML props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// forwardRef with types
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

const variants = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-input'
} as const;

const sizes = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-8'
} as const;
```

**How Agent Uses This:**

```typescript
// Agent creating Input component copies this pattern:

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Copy props pattern
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

// Copy forwardRef pattern
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Result: Perfect React + TypeScript ✅
```

## Pre-Commit Type Validation

### **Git Hook:** `pre-commit`

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running TypeScript type check..."

# Run strict typecheck
npx tsc --noEmit --strict

if [ $? -ne 0 ]; then
  echo "❌ Type check failed. Commit blocked."
  echo "Fix type errors before committing."
  exit 1
fi

echo "✅ Type check passed"
exit 0
```

### **CI/CD Validation**

```yaml
# .github/workflows/typecheck.yml

name: TypeScript Strict Check

on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run typecheck # tsc --noEmit --strict
      - name: Fail if errors
        if: failure()
        run: echo "❌ Type errors found. PR blocked."
```

## Common Type Errors & Fixes (Pattern-Based)

### **Error 1: Implicit 'any' type**

**Bad:**
```typescript
const data = await req.json(); // ❌ Type 'any'
```

**Pattern Fix (copy from existing code):**
```typescript
const data = await req.json() as unknown; // ✅ Type 'unknown'
const validated = schema.parse(data);      // ✅ Now typed
```

### **Error 2: Array possibly undefined**

**Bad:**
```typescript
const user = await db.select().from(users); // ❌ Type User[]
return user[0]; // ❌ Possibly undefined
```

**Pattern Fix (copy from existing code):**
```typescript
const result = await db.select().from(users).limit(1);
return result[0] ?? null; // ✅ Explicit null handling
```

### **Error 3: Untyped function parameters**

**Bad:**
```typescript
function updateUser(id, data) { // ❌ Implicit 'any'
```

**Pattern Fix (copy from existing code):**
```typescript
function updateUser(
  id: string,
  data: Partial<NewUser>
): Promise<User | null> { // ✅ Fully typed
```

## MCP Tools for Type Safety

### **1. run_typecheck**

```typescript
{
  name: "run_typecheck",
  description: "Run TypeScript type check",
  inputSchema: {
    scope: "'all' | 'changed-files' | 'file'",
    path: "string - Specific file (if scope=file)",
    strictMode: "boolean - Use --strict flag"
  },
  handler: async (input) => {
    let command = 'tsc --noEmit';
    if (input.strictMode) command += ' --strict';
    if (input.scope === 'file') command += ` ${input.path}`;

    const result = await exec(command);

    if (result.exitCode !== 0) {
      const errors = parseTypeScriptErrors(result.stderr);

      return {
        success: false,
        errors,
        autoFixable: errors.filter(e => e.fixable),
        recommendations: generateFixRecommendations(errors)
      };
    }

    return { success: true, errors: [] };
  }
}
```

### **2. suggest_type_fix**

```typescript
{
  name: "suggest_type_fix",
  description: "Suggest fix for type error using patterns",
  inputSchema: {
    error: "object - TypeScript error",
    fileContent: "string - Current file content"
  },
  handler: async (input) => {
    // Find similar code that doesn't have this error
    const workingPatterns = await find_type_patterns({
      context: input.error.context,
      filePatterns: ['**/*.ts']
    });

    // Suggest fix based on patterns
    const suggestion = {
      error: input.error.message,
      fix: generateFixFromPattern(input.error, workingPatterns),
      explanation: explainPattern(workingPatterns[0]),
      example: workingPatterns[0].examples[0]
    };

    return suggestion;
  }
}
```

## Agent Workflow with Type Safety

### **1. PLAN Phase**
```typescript
// Agent creates plan with type specifications
await create_plan({
  taskId,
  planData: {
    typeDefinitions: `
      // Copy from lib/db/schema.ts pattern
      interface AuthUser { ... }
    `,
    typePatterns: [
      "Copy API route types from app/api/users/route.ts",
      "Copy validation from existing Zod schemas"
    ]
  }
});
```

### **2. CODE Phase**
```typescript
// Agent implements using patterns
const patterns = await find_type_patterns({
  context: "API route",
  filePatterns: ["app/api/*/route.ts"]
});

// Copy exact pattern
// Write code...

// Immediate validation
const typecheck = await run_typecheck({
  scope: "changed-files",
  strictMode: true
});

if (!typecheck.success) {
  const fixes = await suggest_type_fix({
    error: typecheck.errors[0],
    fileContent: currentFile
  });

  // Apply pattern-based fix
}
```

### **3. TEST Phase**
```typescript
// Tester validates types as part of tests
const results = await run_tests({
  strictTypeCheck: true // Must pass
});

if (results.typeErrors) {
  // Push back to CODE with pattern guidance
  await update_task_phase({
    phase: 'CODE',
    reason: 'Type errors detected',
    patternGuidance: "Review app/api/users/route.ts for correct typing"
  });
}
```

## Summary

Sentra's TypeScript strictness enforcement:

1. ✅ **Pattern-based learning** - Copy proven type patterns
2. ✅ **Pre-emptive validation** - Check types before coding
3. ✅ **Continuous checking** - Validate after every file write
4. ✅ **Zero tolerance** - No 'any', no implicit types
5. ✅ **Git hooks** - Block commits with type errors
6. ✅ **CI/CD validation** - Block PRs with type errors
7. ✅ **Agent guidance** - Pattern-based error fixes

**Result:** Agents write type-perfect code on first try by learning from existing strictly-typed patterns. Errors drop from 20+ per feature to 0-2.
