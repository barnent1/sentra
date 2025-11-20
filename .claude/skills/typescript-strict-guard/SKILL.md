---
name: typescript-strict-guard
description: Use when writing or reviewing TypeScript code. Enforces strict mode standards, explicit typing, and best practices. Prevents 'any' types, @ts-ignore comments, and non-null assertions.
allowed-tools: Read, Grep
---

# TypeScript Strict Mode Guardian

## When to Use
- Writing new TypeScript code
- Reviewing code for type safety
- Fixing type errors
- Refactoring to strict mode

## Strict Mode Requirements
1. **No `any` type** - Use explicit types or `unknown`
2. **No `@ts-ignore`** - Fix the underlying issue
3. **No `!` non-null assertion** - Use proper type guards
4. **Explicit return types** - All functions must declare return type
5. **Explicit parameter types** - No implicit any

## Common Violations and Fixes

### Violation 1: Using `any` type

```typescript
// ❌ DON'T
function processData(data: any) {
  return data.value
}

// ✅ DO: Use explicit types
interface Data {
  value: string
}

function processData(data: Data): string {
  return data.value
}

// ✅ DO: Use unknown with type guards
function processData(data: unknown): string {
  if (isValidData(data)) {
    return data.value
  }
  throw new Error('Invalid data')
}

function isValidData(obj: unknown): obj is Data {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    typeof obj.value === 'string'
  )
}
```

### Violation 2: Using @ts-ignore

```typescript
// ❌ DON'T
// @ts-ignore
const value = getData().property

// ✅ DO: Fix the type error
const data = getData()
if ('property' in data) {
  const value = data.property
}

// ✅ DO: Use proper typing
type DataWithProperty = { property: string }
const value = (getData() as DataWithProperty).property

// ✅ BETTER: Use type guard
function hasProperty(obj: unknown): obj is DataWithProperty {
  return typeof obj === 'object' && obj !== null && 'property' in obj
}

const data = getData()
if (hasProperty(data)) {
  const value = data.property
}
```

### Violation 3: Non-null assertion (!)

```typescript
// ❌ DON'T
const user = users.find(u => u.id === id)!
const name = user.name

// ✅ DO: Handle null case
const user = users.find(u => u.id === id)
if (!user) {
  throw new Error(`User ${id} not found`)
}
const name = user.name

// ✅ DO: Use optional chaining
const name = users.find(u => u.id === id)?.name
if (!name) {
  throw new Error(`User ${id} not found`)
}

// ✅ DO: Provide default
const name = users.find(u => u.id === id)?.name ?? 'Unknown'
```

### Violation 4: Missing return type

```typescript
// ❌ DON'T: Implicit return type
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ DO: Explicit return type
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ DO: Explicit async return type
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}
```

### Violation 5: Implicit any parameters

```typescript
// ❌ DON'T
function formatDate(date) {
  return date.toLocaleDateString()
}

// ✅ DO
function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

// ✅ DO: Accept multiple types
function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString()
}
```

## Type Guard Patterns

### Basic type guards

```typescript
// String type guard
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// Number type guard
function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

// Object type guard
function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

// Array type guard
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}
```

### Complex type guards

```typescript
interface User {
  id: string
  email: string
  name?: string
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'email' in obj &&
    typeof obj.email === 'string' &&
    (!('name' in obj) || typeof obj.name === 'string')
  )
}

// Usage
const data: unknown = JSON.parse(response)
if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.email)
}
```

### Discriminated unions

```typescript
type Success = {
  status: 'success'
  data: string
}

type Error = {
  status: 'error'
  error: string
}

type Result = Success | Error

function handleResult(result: Result): string {
  // TypeScript narrows type based on discriminant
  if (result.status === 'success') {
    return result.data // TypeScript knows this is Success
  } else {
    return result.error // TypeScript knows this is Error
  }
}
```

## Generic Patterns

```typescript
// ✅ DO: Use generics for reusable code
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

const nums = [1, 2, 3]
const firstNum = first(nums) // Type: number | undefined

const strs = ['a', 'b', 'c']
const firstStr = first(strs) // Type: string | undefined

// ✅ DO: Constrained generics
interface HasId {
  id: string
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}

// ✅ DO: Generic type inference
function identity<T>(value: T): T {
  return value
}

const num = identity(42) // Type inferred as number
const str = identity('hello') // Type inferred as string
```

## Utility Types

```typescript
// Partial: Make all properties optional
type User = {
  id: string
  name: string
  email: string
}

type UserUpdate = Partial<User> // All properties optional
// { id?: string, name?: string, email?: string }

// Required: Make all properties required
type UserRequired = Required<UserUpdate>
// { id: string, name: string, email: string }

// Pick: Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>
// { id: string, name: string }

// Omit: Remove specific properties
type UserWithoutId = Omit<User, 'id'>
// { name: string, email: string }

// Record: Create object type with specific keys
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>
// { [key: string]: 'admin' | 'user' | 'guest' }
```

## React-Specific Patterns

```typescript
// ✅ DO: Explicit prop types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

function Button({ children, onClick, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {children}
    </button>
  )
}

// ✅ DO: Generic component props
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>
}

// ✅ DO: Event handlers
function Input() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
    </form>
  )
}
```

## Common Fixes Cheat Sheet

| Problem | Solution |
|---------|----------|
| `any` type | Use explicit types or `unknown` with type guards |
| `@ts-ignore` | Fix the underlying type error |
| `!` assertion | Use optional chaining or type guards |
| Missing return type | Add explicit return type annotation |
| Implicit any | Add type annotations to parameters |
| Union types | Use type guards or discriminated unions |
| Null/undefined | Use optional chaining `?.` or nullish coalescing `??` |

## tsconfig.json Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Review Checklist

When reviewing TypeScript code:
- [ ] No `any` types (use explicit types or `unknown`)
- [ ] No `@ts-ignore` comments
- [ ] No `!` non-null assertions
- [ ] All functions have explicit return types
- [ ] All parameters have explicit types
- [ ] Type guards used instead of type assertions
- [ ] Generics used for reusable code
- [ ] Utility types used where appropriate
- [ ] React event handlers properly typed
- [ ] Async functions return `Promise<T>`
