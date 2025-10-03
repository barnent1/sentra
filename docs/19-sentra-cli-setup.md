# Sentra CLI Setup

## Overview

The Sentra CLI is the primary interface for connecting projects (greenfield or brownfield) to Sentra's agentic development system. It handles stack detection, user confirmation, project configuration, and MCP server connection.

## Installation

Install globally via npm or bun:

```bash
npm install -g @sentra/cli
```

or

```bash
bun install -g @sentra/cli
```

Verify installation:

```bash
sentra --version
```

## The `sentra setup` Command

The core command for onboarding a project to Sentra.

### Basic Usage

```bash
cd /path/to/your/project
sentra setup
```

## Interactive Setup Flow

### Phase 1: Stack Discovery

Sentra analyzes your project to detect the stack:

```
🔍 Analyzing project...

Scanning package.json...
Checking for TypeScript configuration...
Detecting database clients...
Analyzing styling solutions...
Discovering state management patterns...

✅ Analysis complete!
```

### Phase 2: Stack Presentation

Sentra presents what it detected:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Detected Stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Framework:       Next.js 15.0.0
  Language:        TypeScript 5.3.0
  Database:        PostgreSQL (via Drizzle ORM)
  Styling:         Tailwind CSS, ShadCN
  State Mgmt:      React Context
  Test Framework:  Jest
  Package Mgr:     npm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Is this correct?

  1. ✅ Accept stack as-is
  2. ➕ Accept and add more
  3. ❌ Reject and specify manually

Your choice (1-3):
```

### Phase 3: User Options

#### Option 1: Accept as-is ✅

```
Your choice (1-3): 1

✅ Stack confirmed!

Proceeding with detected stack...
```

**What happens:**
- Stack profile saved as-is
- Moves to MCP setup phase

#### Option 2: Accept and add more ➕

```
Your choice (1-3): 2

✅ Stack confirmed!

What additional libraries/tools are in your stack?
(Enter comma-separated or natural language description)

> Framer Motion, Zod, React Hook Form

🤖 Understanding your additions...

Adding to stack:
  ✓ Framer Motion (animation library)
  ✓ Zod (schema validation)
  ✓ React Hook Form (form management)

Confirm these additions? (y/n): y

✅ Stack updated!
```

**Claude's role:**
- Parses natural language input
- Identifies libraries/frameworks
- Validates they're real/correct
- Categorizes them (animation, validation, forms, etc.)
- Handles typos/variations ("framer motion", "framer-motion", "Framer Motion")

**Examples of natural language:**
```
User input: "We also use Framer Motion for animations and Zod for validation"

Parsed:
- Framer Motion → animation library
- Zod → schema validation

User input: "zustand, react query, axios"

Parsed:
- Zustand → state management
- React Query → data fetching
- Axios → HTTP client
```

#### Option 3: Reject and specify manually ❌

```
Your choice (1-3): 3

Let's start fresh. Describe your stack:
(Enter comma-separated or natural language description)

> React 18, JavaScript, MongoDB, Styled Components, Redux

🤖 Understanding your stack...

Detected from your input:
  Framework:       React 18.x
  Language:        JavaScript
  Database:        MongoDB
  Styling:         Styled Components
  State Mgmt:      Redux

Does this look correct? (y/n): y

✅ Stack configured!
```

**Claude's role:**
- Interprets free-form text
- Extracts framework, language, database, styling, etc.
- Handles ambiguity:
  - "Mongo" → "MongoDB"
  - "Postgres" → "PostgreSQL"
  - "React" without version → prompts for version or detects from package.json
- Asks clarifying questions if needed:
  ```
  🤔 I found "React" in your description.

  Did you mean:
    1. React (library)
    2. React Native (mobile framework)

  Your choice (1-2):
  ```

### Phase 4: Convention Discovery (Brownfield Projects)

For existing projects, Sentra analyzes code to learn conventions:

```
🔍 Analyzing codebase conventions...

Discovered patterns:
  ✓ Component naming: PascalCase
  ✓ File extension: .tsx
  ✓ Import style: Absolute paths (via @/ alias)
  ✓ File organization: Feature-based folders
  ✓ Prop types: TypeScript interfaces

These conventions will be followed by Sentra agents.
```

**What Sentra analyzes:**
- Component file naming patterns
- Import path styles
- Folder organization
- Code style from existing files
- Linter configuration
- Formatter configuration

### Phase 5: Validation Command Detection

```
🔍 Detecting validation commands...

Found validation scripts:
  ✓ Type checking:  npm run type-check
  ✓ Linting:        npm run lint
  ✓ Testing:        npm run test
  ✓ Build:          npm run build

Sentra agents will run these before completing tasks.
```

### Phase 6: MCP Server Connection

```
🔌 Connecting to Sentra MCP Server...

MCP Server URL: https://mcp.sentra.dev (default)

Use custom MCP server? (y/n): n

Authenticating...

✅ Connected to Sentra MCP Server!

Project ID: proj_abc123xyz
Project Token: sen_***************
```

**Options:**
- **Default**: Use Sentra's hosted MCP server
- **Self-hosted**: Enter custom MCP server URL
- **Local dev**: `http://localhost:3000` for development

### Phase 7: Documentation Sync

```
📚 Syncing documentation for your stack...

Fetching documentation:
  ✓ Next.js 15.0.0 docs
  ✓ TypeScript 5.3.0 docs
  ✓ React 18.x docs
  ✓ Drizzle ORM docs
  ✓ Tailwind CSS docs
  ✓ ShadCN component docs

Documentation cached for fast agent lookup.

✅ Documentation sync complete!
```

**What happens:**
- Sentra backend fetches official documentation for detected stack
- Chunks documentation into searchable segments
- Stores in PostgreSQL with vector embeddings
- Agents can query via `lookup_documentation` MCP tool

### Phase 8: Project Configuration File

```
📝 Creating project configuration...

Writing .sentra/config.json...

✅ Configuration saved!
```

**Generated `.sentra/config.json`:**

```json
{
  "projectId": "proj_abc123xyz",
  "projectName": "my-awesome-app",
  "createdAt": "2025-10-03T14:30:00Z",

  "stack": {
    "framework": "nextjs",
    "frameworkVersion": "15.0.0",
    "language": "typescript",
    "languageVersion": "5.3.0",
    "database": "postgresql",
    "orm": "drizzle",
    "styling": ["tailwind", "shadcn"],
    "stateManagement": "context",
    "testFramework": "jest",
    "packageManager": "npm",
    "additionalLibraries": [
      { "name": "framer-motion", "category": "animation" },
      { "name": "zod", "category": "validation" },
      { "name": "react-hook-form", "category": "forms" }
    ]
  },

  "conventions": {
    "componentNaming": "PascalCase",
    "fileExtension": ".tsx",
    "importStyle": "absolute",
    "pathAlias": "@",
    "fileOrganization": "feature-based",
    "noSrcDirectory": true,
    "propTypes": "typescript-interfaces"
  },

  "validation": {
    "typeCheck": "npm run type-check",
    "lint": "npm run lint",
    "test": "npm run test",
    "build": "npm run build"
  },

  "mcp": {
    "serverUrl": "https://mcp.sentra.dev",
    "projectToken": "sen_encrypted_token_here"
  },

  "worktree": {
    "enabled": true,
    "path": ".sentra/worktrees"
  }
}
```

**Important notes:**
- `.sentra/` should be added to `.gitignore` (Sentra prompts for this)
- `projectToken` is encrypted and project-specific
- Configuration can be updated via `sentra update`

### Phase 9: Completion

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your project is now connected to Sentra!

Next steps:
  1. Visit the Sentra dashboard: https://app.sentra.dev
  2. Create your first task
  3. Let Sentra build it for you!

Project ID: proj_abc123xyz

Run 'sentra status' to view project info.
```

## Stack Detection Algorithm

### How Detection Works

```typescript
async function detectStack(projectPath: string): Promise<StackProfile> {
  const packageJson = await readPackageJson(projectPath);

  // Detect framework
  const framework = detectFramework(packageJson);

  // Detect language
  const language = detectLanguage(projectPath);

  // Detect database
  const database = detectDatabase(packageJson);

  // Detect styling
  const styling = detectStyling(packageJson);

  // Detect state management
  const stateManagement = detectStateManagement(projectPath, packageJson);

  // Detect test framework
  const testFramework = detectTestFramework(packageJson);

  return {
    framework,
    language,
    database,
    styling,
    stateManagement,
    testFramework,
    // ... more
  };
}
```

### Framework Detection

**Checks:**
1. `dependencies` and `devDependencies` in `package.json`
2. Framework-specific config files

**Detection logic:**

```typescript
function detectFramework(packageJson: PackageJson): Framework {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if ('next' in deps) {
    return { name: 'nextjs', version: deps.next };
  }

  if ('vite' in devDeps && 'react' in deps) {
    return { name: 'vite-react', version: deps.vite };
  }

  if ('react' in deps && !('next' in deps)) {
    return { name: 'react', version: deps.react };
  }

  if ('vue' in deps) {
    return { name: 'vue', version: deps.vue };
  }

  if ('express' in deps) {
    return { name: 'express', version: deps.express };
  }

  // ... more frameworks
}
```

### Language Detection

**Checks:**
1. `tsconfig.json` exists → TypeScript
2. `.ts` or `.tsx` files exist → TypeScript
3. `jsconfig.json` exists → JavaScript (with type checking)
4. Only `.js` or `.jsx` files → JavaScript

```typescript
function detectLanguage(projectPath: string): Language {
  if (fileExists(`${projectPath}/tsconfig.json`)) {
    return {
      name: 'typescript',
      version: getTypeScriptVersion(projectPath)
    };
  }

  if (hasFilesWithExtension(projectPath, ['.ts', '.tsx'])) {
    return { name: 'typescript' };
  }

  return { name: 'javascript' };
}
```

### Database Detection

**Checks dependencies for:**
- `pg` → PostgreSQL
- `mongodb` → MongoDB
- `mysql2` → MySQL
- `better-sqlite3` → SQLite
- `firebase` → Firebase
- etc.

**Also checks for ORMs:**
- `drizzle-orm` → Drizzle
- `prisma` → Prisma
- `typeorm` → TypeORM
- `sequelize` → Sequelize
- `mongoose` → Mongoose (MongoDB)

### Styling Detection

**Checks for:**
- `tailwindcss` → Tailwind CSS
- `styled-components` → Styled Components
- `@emotion/react` → Emotion
- `sass` → SASS/SCSS
- CSS Modules (presence of `.module.css` files)

### State Management Detection

**Checks for:**
- `zustand` → Zustand
- `redux` / `@reduxjs/toolkit` → Redux
- `jotai` → Jotai
- `recoil` → Recoil
- `mobx` → MobX

**Or analyzes code:**
- React Context usage → Context API
- No state library → None (local state)

## Natural Language Processing with Claude

When users provide natural language input, Claude interprets it:

### Example 1: Comma-separated list

**Input:** `React 18, TypeScript, MongoDB, Tailwind`

**Claude interprets:**
```json
{
  "framework": "react",
  "frameworkVersion": "18",
  "language": "typescript",
  "database": "mongodb",
  "styling": "tailwind"
}
```

### Example 2: Natural language description

**Input:** `We're building a Vue 3 app with JavaScript and Firebase for the backend. We use CSS modules for styling.`

**Claude interprets:**
```json
{
  "framework": "vue",
  "frameworkVersion": "3",
  "language": "javascript",
  "database": "firebase",
  "styling": "css-modules"
}
```

### Example 3: Ambiguous input

**Input:** `React, Postgres, CSS`

**Claude asks:**
```
🤔 A few questions to clarify:

1. React version? (default: latest stable)
   > [user enters: 18]

2. "CSS" could mean:
   a) Plain CSS
   b) CSS Modules
   c) SCSS/SASS
   Which one? (a-c)
   > [user enters: b]

3. PostgreSQL client library:
   a) node-postgres (pg)
   b) Prisma
   c) Drizzle ORM
   Which one? (a-c)
   > [user enters: c]
```

**Final result:**
```json
{
  "framework": "react",
  "frameworkVersion": "18",
  "language": "javascript",  // inferred (no TS mentioned)
  "database": "postgresql",
  "orm": "drizzle",
  "styling": "css-modules"
}
```

## Convention Discovery (Brownfield)

For existing projects, Sentra learns conventions:

### Component Naming

```typescript
// Analyzes existing components
async function analyzeComponentNaming(projectPath: string): Promise<string> {
  const componentFiles = await findFiles(projectPath, ['**/*.[jt]sx']);

  // Check if components are PascalCase
  const pascalCase = componentFiles.filter(f => /^[A-Z]/.test(basename(f)));

  // Check if components are camelCase
  const camelCase = componentFiles.filter(f => /^[a-z]/.test(basename(f)));

  if (pascalCase.length > camelCase.length) {
    return 'PascalCase';
  }

  return 'camelCase';
}
```

### Import Style

```typescript
// Analyzes import statements
async function analyzeImportStyle(projectPath: string): Promise<string> {
  const sourceFiles = await findFiles(projectPath, ['**/*.[jt]sx?']);

  let relativeImports = 0;
  let absoluteImports = 0;

  for (const file of sourceFiles) {
    const content = await readFile(file);
    const imports = extractImports(content);

    for (const imp of imports) {
      if (imp.startsWith('.') || imp.startsWith('../')) {
        relativeImports++;
      } else if (imp.startsWith('@/')) {
        absoluteImports++;
      }
    }
  }

  return absoluteImports > relativeImports ? 'absolute' : 'relative';
}
```

### File Organization

```typescript
// Analyzes folder structure
async function analyzeFileOrganization(projectPath: string): Promise<string> {
  // Feature-based: components grouped by feature
  // Type-based: components/, utils/, hooks/ separation
  // Colocation: everything near where it's used

  // ... analysis logic ...
}
```

## Greenfield vs Brownfield

### Brownfield (Existing Project)

**Characteristics:**
- Has existing code
- Dependencies already installed
- Conventions already established

**Sentra approach:**
1. Detect stack from `package.json`
2. Analyze code to learn conventions
3. **Follow existing patterns** (even if not "best practice")
4. Maintain consistency with current codebase

**Example output:**
```
🔍 Analyzing existing codebase...

Detected conventions:
  ✓ Component files: PascalCase with .tsx extension
  ✓ Imports: Absolute paths using @ alias
  ✓ Styling: CSS Modules (*.module.css)
  ✓ State: Redux Toolkit

⚠️  Note: Some inconsistencies found
    - 3 components use .jsx instead of .tsx
    - 5 components use relative imports

Sentra will follow the majority pattern (.tsx, absolute imports).
```

### Greenfield (New Project)

**Characteristics:**
- Empty project or minimal scaffolding
- No (or few) dependencies
- No established conventions

**Sentra approach:**
1. Detect minimal stack (if any)
2. Prompt user for stack specification
3. Apply **best practices** for chosen stack
4. Generate initial scaffolding if requested

**Example output:**
```
🔍 Analyzing project...

This appears to be a new project!

Detected:
  ✓ package.json exists (minimal dependencies)
  ✓ No source code yet

Would you like Sentra to:
  1. Generate initial project structure
  2. Connect to existing code (you'll add code later)

Your choice (1-2):
```

## Multi-Stack Projects (Monorepos)

For monorepos with multiple workspaces:

```
my-monorepo/
├── apps/
│   ├── web/         (Next.js)
│   └── mobile/      (React Native)
├── packages/
│   ├── ui/          (React component library)
│   └── api/         (Express backend)
└── package.json     (root)
```

**Setup flow:**

```bash
cd my-monorepo
sentra setup

🔍 Detected monorepo structure!

Found workspaces:
  1. apps/web (Next.js)
  2. apps/mobile (React Native)
  3. packages/ui (React library)
  4. packages/api (Express)

Setup each workspace separately? (y/n): y

Setting up apps/web...
[... individual setup flow ...]

Setting up apps/mobile...
[... individual setup flow ...]

# ... etc
```

**Result:**
```
my-monorepo/
├── .sentra/
│   └── config.json (root config with workspace references)
├── apps/
│   ├── web/
│   │   └── .sentra/config.json
│   └── mobile/
│       └── .sentra/config.json
└── packages/
    ├── ui/
    │   └── .sentra/config.json
    └── api/
        └── .sentra/config.json
```

Each workspace has its own stack profile, but shares MCP connection.

## Other CLI Commands

### `sentra status`

View project information:

```bash
sentra status
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project: my-awesome-app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Project ID:      proj_abc123xyz
  Stack:           Next.js 15.0.0 + TypeScript
  Database:        PostgreSQL (Drizzle ORM)
  MCP Connected:   ✅ Yes
  Active Tasks:    3
  Completed Tasks: 12

  Dashboard: https://app.sentra.dev/projects/proj_abc123xyz
```

### `sentra sync`

Sync documentation updates:

```bash
sentra sync
```

**Output:**
```
📚 Syncing documentation...

Checking for updates:
  ✓ Next.js 15.0.0 → 15.1.0 available
  ✓ TypeScript 5.3.0 (no update)
  ✓ Drizzle ORM (no update)

Update Next.js documentation? (y/n): y

Fetching Next.js 15.1.0 docs...

✅ Documentation updated!
```

### `sentra validate`

Run validation checks manually:

```bash
sentra validate
```

**Output:**
```
🔍 Running validation checks...

Type checking...     ✅ Passed (0 errors)
Linting...           ✅ Passed (0 warnings)
Tests...             ✅ Passed (45/45)
Build...             ✅ Succeeded

✅ All checks passed!
```

### `sentra worktree clean`

Clean up old worktrees:

```bash
sentra worktree clean
```

**Output:**
```
🧹 Cleaning up worktrees...

Found 5 worktrees:
  1. task-abc123 (merged 7 days ago)
  2. task-def456 (merged 3 days ago)
  3. task-ghi789 (active)
  4. task-jkl012 (merged 14 days ago)
  5. task-mno345 (active)

Remove merged worktrees older than 7 days? (y/n): y

Removing:
  ✓ task-abc123
  ✓ task-jkl012

✅ Cleanup complete! (2 worktrees removed)
```

### `sentra update`

Update project stack profile:

```bash
sentra update
```

**Output:**
```
Current stack:
  Framework: Next.js 15.0.0
  Language:  TypeScript 5.3.0
  Database:  PostgreSQL (Drizzle ORM)

What would you like to update?
  1. Add new library/tool
  2. Update version
  3. Change configuration
  4. Re-run stack detection

Your choice (1-4):
```

## Integration with Task Dashboard

After running `sentra setup`, the project appears in the Sentra Task Dashboard:

**Dashboard view:**
```
Projects
├─ my-awesome-app (Next.js + TS + PostgreSQL)
│  └─ 3 active tasks, 12 completed
├─ another-project (React + JS + MongoDB)
│  └─ 1 active task, 5 completed
└─ legacy-app (Express + JS)
   └─ 0 active tasks, 8 completed
```

**When creating a task:**
1. Select project from dropdown
2. Task inherits project's stack profile
3. Agents automatically receive stack context
4. All code respects project conventions

## Summary

The Sentra CLI setup process:

1. **Analyzes** the project to detect stack
2. **Presents** detected stack to user
3. **Confirms** via 3 options (accept / add / reject)
4. **Discovers** conventions (brownfield)
5. **Connects** to MCP server
6. **Syncs** documentation for the stack
7. **Creates** `.sentra/config.json`
8. **Registers** project in Sentra dashboard

This approach gives users full control while leveraging AI for smart detection and natural language understanding. The result: Sentra knows your stack and will always generate perfect, convention-following, validation-passing code.
