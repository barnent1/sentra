# Detected Code Patterns

**Generated:** 2025-11-17 14:11:38
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
export class ExampleService {
  async operation(input: Input): Promise<Output> {
    // 1. Validate input
    // 2. Process business logic
    // 3. Interact with database
    // 4. Return result
  }
}
```

**When to use:** For all business logic operations (CRUD, calculations, workflows)

---

## API Route Pattern

**Location:** `src/app/api/` or `backend/src/`

**Purpose:** Define HTTP endpoints with validation and error handling

**Example:**
```typescript
// src/app/api/example/route.ts
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    // 2. Call service layer
    // 3. Return success response
  } catch (error) {
    // 4. Handle errors with appropriate status codes
  }
}
```

**When to use:** For all HTTP endpoints

---

## React Component Pattern

**Location:** `src/components/`

**Purpose:** Reusable UI components with TypeScript props

**Example:**
```typescript
// src/components/Example.tsx
interface ExampleProps {
  data: Data
  onAction: () => void
}

export function Example({ data, onAction }: ExampleProps) {
  // Component logic
  return <div>...</div>
}
```

**When to use:** For all React components

---

## Custom Hook Pattern

**Location:** `src/hooks/`

**Purpose:** Reusable React logic with state management

**Example:**
```typescript
// src/hooks/useExample.ts
export function useExample(id: string) {
  const [state, setState] = useState()

  useEffect(() => {
    // Side effects
  }, [id])

  return { state, actions }
}
```

**When to use:** For shared React logic, API calls, subscriptions

---

## Database Access Pattern

**Location:** Services using Prisma

**Purpose:** Type-safe database operations

**Example:**
```typescript
import { db } from '@/lib/db'

const result = await db.model.create({
  data: { ... }
})
```

**When to use:** For all database operations

---

## Error Handling Pattern

**Location:** Throughout codebase

**Purpose:** Consistent error handling and user feedback

**Example:**
```typescript
try {
  await operation()
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof NotFoundError) {
    // Handle not found
  } else {
    // Handle unexpected errors
  }
}
```

**When to use:** For all operations that can fail

---

## Testing Pattern

**Location:** `tests/`

**Purpose:** Comprehensive test coverage with AAA pattern

**Example:**
```typescript
describe('Feature', () => {
  it('should do something', async () => {
    // ARRANGE: Setup test data
    const input = { ... }

    // ACT: Execute behavior
    const result = await operation(input)

    // ASSERT: Verify outcome
    expect(result).toBeDefined()
  })
})
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
