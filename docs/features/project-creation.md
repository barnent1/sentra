# Project Creation Feature

**Status:** 💬 Approved Design (Not Yet Implemented)

**Last Updated:** 2025-11-13

**Owner:** Glen Barnhardt

---

## Overview

Enable users to create new projects entirely within Quetrex, without touching the terminal. Select from pre-built templates, auto-initialize Git/GitHub, and immediately start working with AI agents.

**Vision:** Reduce project setup from 15+ terminal commands to one button click.

---

## User Problem

### Current Workflow (Terminal-Based)

**Time:** 10-15 minutes

**Steps:**
1. Open terminal
2. `mkdir my-new-project`
3. `cd my-new-project`
4. `npm init -y` or `poetry init`
5. `git init`
6. `git add .`
7. `git commit -m "Initial commit"`
8. `gh repo create`
9. `git push -u origin main`
10. Create `.quetrex/` directory
11. Create `.quetrex/config.yml`
12. Add project to Quetrex tracking
13. Install dependencies
14. Configure linting/formatting
15. Set up testing framework

**Pain Points:**
- Requires terminal knowledge
- Easy to forget steps
- Inconsistent project structures
- Manual configuration error-prone
- Can't start AI work until setup complete

### Planned Workflow (In-App)

**Time:** 30 seconds

**Steps:**
1. Click [+ New Project] in Quetrex dashboard
2. Enter project name and location
3. Select template (Next.js, Python, etc.)
4. Click [Create Project]
5. Project appears in dashboard, ready for AI agents

**Benefits:**
- No terminal needed
- Consistent, tested scaffolding
- One-click setup
- AI agents can start immediately
- Templates include best practices

---

## User Interface

### New Project Button

**Location:** Top-right of dashboard, next to project cards

```
┌────────────────────────────────────────────┐
│  Projects                                  │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────┐  ┌──────────┐    [+ New]   │
│  │ Project  │  │ Project  │              │
│  │ Card     │  │ Card     │              │
│  └──────────┘  └──────────┘              │
└────────────────────────────────────────────┘
```

**Design:**
- Violet background (#7C3AED)
- White text
- Plus icon
- Hover: Slightly lighter violet
- Click: Opens modal

### New Project Modal

```
┌─────────────────────────────────────────────────┐
│  Create New Project                        [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Project Name *                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ my-awesome-app                            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Location *                                     │
│  ┌───────────────────────────────────┐ ┌─────┐ │
│  │ ~/Projects/my-awesome-app         │ │Browse│ │
│  └───────────────────────────────────┘ └─────┘ │
│                                                 │
│  Template *                                     │
│  ┌─────────────┐ ┌─────────────┐               │
│  │ ✓ Next.js   │ │   Python    │               │
│  │   Full Stack│ │   FastAPI   │               │
│  │             │ │             │               │
│  │ TypeScript  │ │ REST API    │               │
│  │ Tailwind    │ │ SQLAlchemy  │               │
│  │ Prisma      │ │             │               │
│  └─────────────┘ └─────────────┘               │
│  ┌─────────────┐ ┌─────────────┐               │
│  │   React     │ │   Blank     │               │
│  │   Native    │ │   Project   │               │
│  │             │ │             │               │
│  │ Expo        │ │ Empty dir   │               │
│  │ Navigation  │ │ Git only    │               │
│  │             │ │             │               │
│  └─────────────┘ └─────────────┘               │
│                                                 │
│  Options                                        │
│  [✓] Initialize Git repository                 │
│  [✓] Create GitHub repository                  │
│  [✓] Add to Quetrex tracking                    │
│  [✓] Install dependencies                      │
│                                                 │
│           [Cancel]     [Create Project]        │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Field Details:**

1. **Project Name** (required)
   - Validates: a-z, 0-9, hyphens, underscores
   - Auto-slugifies (e.g., "My App" → "my-app")
   - Checks for existing project

2. **Location** (required)
   - Default: `~/Projects/{project-name}`
   - Browse button opens native file picker
   - Validates: writable directory

3. **Template** (required)
   - Radio selection (one template)
   - Visual cards with icons
   - Shows tech stack in each card

4. **Options** (checkboxes)
   - All checked by default
   - Can uncheck if not wanted

---

## Templates

### 1. Next.js Full Stack

**Description:** Modern full-stack web application with TypeScript

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- TailwindCSS
- Prisma ORM
- PostgreSQL
- NextAuth.js (authentication)

**Generated Structure:**
```
my-app/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── api/
│   ├── components/
│   ├── lib/
│   └── utils/
├── prisma/
│   └── schema.prisma
├── public/
├── .quetrex/
│   └── config.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .gitignore
├── .eslintrc.json
├── .prettierrc
└── README.md
```

**Commands Run:**
```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm install prisma @prisma/client next-auth
npx prisma init
# Configure ESLint, Prettier
# Initialize Git
# Create GitHub repo
```

### 2. Python FastAPI

**Description:** High-performance REST API with Python

**Tech Stack:**
- FastAPI
- Pydantic (validation)
- SQLAlchemy (ORM)
- PostgreSQL
- Alembic (migrations)
- JWT authentication
- Docker

**Generated Structure:**
```
my-api/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   └── deps.py
│   ├── models/
│   ├── schemas/
│   └── services/
├── tests/
├── alembic/
├── .quetrex/
│   └── config.yml
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

**Commands Run:**
```bash
mkdir my-api && cd my-api
poetry init --no-interaction
poetry add fastapi uvicorn sqlalchemy pydantic python-jose
poetry add --dev pytest black flake8
poetry install
# Initialize Git
# Create GitHub repo
```

### 3. React Native

**Description:** Cross-platform mobile app

**Tech Stack:**
- Expo
- React Native
- TypeScript
- React Navigation
- Zustand (state)
- Axios (API)

**Generated Structure:**
```
my-mobile-app/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── store/
│   └── api/
├── assets/
├── .quetrex/
│   └── config.yml
├── App.tsx
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

**Commands Run:**
```bash
npx create-expo-app my-mobile-app --template blank-typescript
cd my-mobile-app
npm install @react-navigation/native zustand axios
# Initialize Git
# Create GitHub repo
```

### 4. Blank Project

**Description:** Empty project with Git only

**Tech Stack:**
- None (user chooses)

**Generated Structure:**
```
my-project/
├── .quetrex/
│   └── config.yml
├── .gitignore
└── README.md
```

**Commands Run:**
```bash
mkdir my-project && cd my-project
git init
echo "# My Project" > README.md
# Create GitHub repo (if selected)
```

---

## Implementation

### Frontend Component

```typescript
// src/components/NewProjectModal.tsx
'use client'

import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Template {
  id: string
  name: string
  description: string
  techStack: string[]
  icon: string
}

const TEMPLATES: Template[] = [
  {
    id: 'nextjs',
    name: 'Next.js Full Stack',
    description: 'Modern web app with TypeScript',
    techStack: ['Next.js', 'TypeScript', 'Tailwind', 'Prisma'],
    icon: '⚛️'
  },
  {
    id: 'fastapi',
    name: 'Python FastAPI',
    description: 'High-performance REST API',
    techStack: ['FastAPI', 'SQLAlchemy', 'Pydantic'],
    icon: '🐍'
  },
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Cross-platform mobile app',
    techStack: ['Expo', 'React Native', 'TypeScript'],
    icon: '📱'
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Empty directory with Git',
    techStack: ['None'],
    icon: '📄'
  }
]

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [template, setTemplate] = useState('nextjs')
  const [options, setOptions] = useState({
    initGit: true,
    createGithub: true,
    addToQuetrex: true,
    installDeps: true
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setCreating(true)
    setError('')

    try {
      const project = await invoke<Project>('create_project', {
        name,
        location,
        template,
        initGit: options.initGit,
        createGithub: options.createGithub,
        installDeps: options.installDeps
      })

      console.log('Project created:', project)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          endAdornment={
            <Button onClick={handleBrowse}>Browse</Button>
          }
        />

        <TemplateSelector
          templates={TEMPLATES}
          selected={template}
          onSelect={setTemplate}
        />

        <OptionsCheckboxes
          options={options}
          onChange={setOptions}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          disabled={!name || !location || creating}
        >
          {creating ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

### Tauri Command

```rust
// src-tauri/src/commands.rs

use std::fs;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub template: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn create_project(
    name: String,
    location: String,
    template: String,
    init_git: bool,
    create_github: bool,
    install_deps: bool
) -> Result<Project, String> {
    // 1. Validate inputs
    if name.is_empty() {
        return Err("Project name required".to_string());
    }

    // 2. Create directory
    let project_path = format!("{}/{}", location, name);
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    // 3. Initialize from template
    match template.as_str() {
        "nextjs" => init_nextjs_template(&project_path, &name)?,
        "fastapi" => init_fastapi_template(&project_path, &name)?,
        "react-native" => init_react_native_template(&project_path, &name)?,
        "blank" => init_blank_template(&project_path, &name)?,
        _ => return Err(format!("Unknown template: {}", template))
    }

    // 4. Initialize Git (if requested)
    if init_git {
        run_command(&project_path, "git", &["init"])?;
        run_command(&project_path, "git", &["add", "."])?;
        run_command(&project_path, "git", &["commit", "-m", "Initial commit"])?;
    }

    // 5. Create GitHub repo (if requested)
    if create_github {
        create_github_repo(&name)?;
        run_command(&project_path, "git", &["remote", "add", "origin", &format!("https://github.com/user/{}.git", name)])?;
        run_command(&project_path, "git", &["push", "-u", "origin", "main"])?;
    }

    // 6. Add .quetrex/ directory
    init_quetrex_tracking(&project_path, &name)?;

    // 7. Install dependencies (if requested)
    if install_deps {
        install_dependencies(&project_path, &template)?;
    }

    // 8. Return project details
    Ok(Project {
        id: uuid::Uuid::new_v4().to_string(),
        name: name.clone(),
        path: project_path.clone(),
        template: template.clone(),
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn init_nextjs_template(path: &str, name: &str) -> Result<(), String> {
    run_command(
        path,
        "npx",
        &[
            "create-next-app@latest",
            ".",
            "--typescript",
            "--tailwind",
            "--app",
            "--yes"
        ]
    )?;

    // Install additional dependencies
    run_command(path, "npm", &["install", "prisma", "@prisma/client", "next-auth"])?;

    // Initialize Prisma
    run_command(path, "npx", &["prisma", "init"])?;

    // Create .prettierrc
    fs::write(
        format!("{}/.prettierrc", path),
        r#"{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5"
}
"#
    ).map_err(|e| e.to_string())?;

    Ok(())
}

fn init_fastapi_template(path: &str, name: &str) -> Result<(), String> {
    // Create directory structure
    fs::create_dir_all(format!("{}/app/api/routes", path)).map_err(|e| e.to_string())?;
    fs::create_dir_all(format!("{}/app/models", path)).map_err(|e| e.to_string())?;
    fs::create_dir_all(format!("{}/app/schemas", path)).map_err(|e| e.to_string())?;
    fs::create_dir_all(format!("{}/app/services", path)).map_err(|e| e.to_string())?;
    fs::create_dir_all(format!("{}/tests", path)).map_err(|e| e.to_string())?;

    // Initialize Poetry
    run_command(path, "poetry", &["init", "--no-interaction", "--name", name])?;

    // Add dependencies
    run_command(path, "poetry", &["add", "fastapi", "uvicorn", "sqlalchemy", "pydantic", "python-jose"])?;
    run_command(path, "poetry", &["add", "--dev", "pytest", "black", "flake8"])?;

    // Create main.py
    fs::write(
        format!("{}/app/main.py", path),
        r#"from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
"#
    ).map_err(|e| e.to_string())?;

    Ok(())
}

fn init_react_native_template(path: &str, name: &str) -> Result<(), String> {
    run_command(
        path,
        "npx",
        &["create-expo-app", ".", "--template", "blank-typescript"]
    )?;

    run_command(
        path,
        "npm",
        &["install", "@react-navigation/native", "zustand", "axios"]
    )?;

    Ok(())
}

fn init_blank_template(path: &str, _name: &str) -> Result<(), String> {
    // Just create README
    fs::write(
        format!("{}/README.md", path),
        "# My Project\n\nProject created with Quetrex.\n"
    ).map_err(|e| e.to_string())?;

    // Create .gitignore
    fs::write(
        format!("{}/.gitignore", path),
        "node_modules/\n.env\n.DS_Store\n"
    ).map_err(|e| e.to_string())?;

    Ok(())
}

fn init_quetrex_tracking(path: &str, name: &str) -> Result<(), String> {
    fs::create_dir_all(format!("{}/.quetrex", path)).map_err(|e| e.to_string())?;

    let config = format!(
        r#"project_name: {}
created_at: {}
quetrex_version: 1.0.0
"#,
        name,
        chrono::Utc::now().to_rfc3339()
    );

    fs::write(format!("{}/.quetrex/config.yml", path), config)
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn create_github_repo(name: &str) -> Result<(), String> {
    run_command(
        ".",
        "gh",
        &["repo", "create", name, "--private", "--confirm"]
    )
}

fn install_dependencies(path: &str, template: &str) -> Result<(), String> {
    match template {
        "nextjs" | "react-native" => run_command(path, "npm", &["install"]),
        "fastapi" => run_command(path, "poetry", &["install"]),
        _ => Ok(())
    }
}

fn run_command(cwd: &str, cmd: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(cmd)
        .current_dir(cwd)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run {}: {}", cmd, e))?;

    if !output.status.success() {
        return Err(format!(
            "{} failed: {}",
            cmd,
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}
```

### File Picker

```typescript
// src/utils/file-picker.ts
import { open } from '@tauri-apps/plugin-dialog'

export async function pickDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Project Location'
  })

  return selected as string | null
}
```

---

## User Flow

### Happy Path

1. User clicks [+ New Project]
2. Modal opens
3. User enters name: "my-blog"
4. User selects template: Next.js
5. User clicks [Create Project]
6. Spinner shows "Creating project..."
7. Tauri command runs:
   - Creates directory
   - Runs `create-next-app`
   - Installs dependencies
   - Initializes Git
   - Creates GitHub repo
   - Adds `.quetrex/` config
8. Modal closes
9. New project card appears in dashboard
10. User can immediately start voice conversation

**Time:** 30-60 seconds (depending on npm install)

### Error Paths

**Directory Already Exists:**
```
Error: Directory ~/Projects/my-blog already exists.
Choose a different name or location.
```

**GitHub CLI Not Installed:**
```
Error: GitHub CLI (gh) not found.
Install with: brew install gh

Or uncheck "Create GitHub repository" to continue.
```

**Permission Denied:**
```
Error: Cannot write to ~/Projects/
Check directory permissions.
```

**Network Error:**
```
Error: Failed to download template.
Check internet connection and try again.
```

---

## Testing

### Unit Tests

```typescript
// tests/unit/project-creation.test.ts
import { validateProjectName } from '@/utils/validation'

test('validates project name', () => {
  expect(validateProjectName('my-app')).toBe(true)
  expect(validateProjectName('my_app')).toBe(true)
  expect(validateProjectName('my-app-123')).toBe(true)

  expect(validateProjectName('My App')).toBe(false)  // spaces
  expect(validateProjectName('my.app')).toBe(false)  // dots
  expect(validateProjectName('')).toBe(false)        // empty
})

test('slugifies project name', () => {
  expect(slugify('My App')).toBe('my-app')
  expect(slugify('Hello World 123')).toBe('hello-world-123')
  expect(slugify('foo_bar')).toBe('foo-bar')
})
```

### Integration Tests

```typescript
// tests/integration/create-project.test.ts
import { invoke } from '@tauri-apps/api/core'

test('creates Next.js project', async () => {
  const project = await invoke('create_project', {
    name: 'test-nextjs-app',
    location: '/tmp',
    template: 'nextjs',
    initGit: true,
    createGithub: false,
    installDeps: false // skip for speed
  })

  expect(project.name).toBe('test-nextjs-app')
  expect(project.template).toBe('nextjs')

  // Verify files created
  expect(fs.existsSync('/tmp/test-nextjs-app/package.json')).toBe(true)
  expect(fs.existsSync('/tmp/test-nextjs-app/.quetrex/config.yml')).toBe(true)
  expect(fs.existsSync('/tmp/test-nextjs-app/.git')).toBe(true)
})
```

### E2E Tests

```typescript
// tests/e2e/project-creation.spec.ts
test('creates project from UI', async ({ page }) => {
  await page.goto('/')

  // Click new project button
  await page.click('[data-testid="new-project-button"]')

  // Fill form
  await page.fill('[data-testid="project-name"]', 'Test App')
  await page.click('[data-testid="template-nextjs"]')

  // Create
  await page.click('[data-testid="create-button"]')

  // Wait for creation
  await page.waitForSelector('[data-testid="project-card-test-app"]')

  // Verify card appears
  await expect(page.getByText('Test App')).toBeVisible()
  await expect(page.getByText('No active tasks')).toBeVisible()
})
```

---

## Performance

**Target Metrics:**
- Modal open: < 100ms
- Template selection: instant
- Project creation (with deps): < 60s
- Project creation (without deps): < 5s

**Optimization:**
- Show progress indicator during creation
- Stream output logs (user sees npm install progress)
- Cache templates locally (avoid re-downloading)
- Parallelize Git + GitHub operations

---

## Security

**Input Validation:**
```rust
fn validate_project_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Name required".to_string());
    }

    if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err("Name can only contain letters, numbers, hyphens, underscores".to_string());
    }

    if name.len() > 100 {
        return Err("Name too long (max 100 characters)".to_string());
    }

    Ok(())
}

fn validate_location(path: &str) -> Result<(), String> {
    let path = Path::new(path);

    if !path.is_absolute() {
        return Err("Must be absolute path".to_string());
    }

    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    Ok(())
}
```

**Command Injection Prevention:**
```rust
// Never use shell=true
// Always pass args as array
Command::new("npm")
    .args(&["install", package]) // Safe
    .output()

// NEVER do this:
Command::new("sh")
    .arg("-c")
    .arg(format!("npm install {}", package)) // UNSAFE
```

---

## Future Enhancements

### Custom Templates

Allow users to create their own templates:

```yaml
# .quetrex/templates/my-template.yml
name: My Custom Template
description: Company standard stack
commands:
  - npm create vite@latest . -- --template react-ts
  - npm install @company/design-system
  - npm install @company/api-client
files:
  - path: .env.example
    content: |
      API_URL=https://api.company.com
      API_KEY=
  - path: src/config.ts
    content: |
      export const config = {
        apiUrl: process.env.API_URL
      }
```

### Template Marketplace

Browse community templates:
```
[Browse Templates]
  → Official Templates (Next.js, Python, etc.)
  → Community Templates (starred/popular)
  → My Templates (custom)
```

### Project Import

Import existing projects into Quetrex:
```
[Import Existing Project]
  → Browse to directory
  → Detect framework
  → Add .quetrex/ tracking
```

---

## Related Documentation

- [/docs/roadmap/dashboard-redesign.md](../roadmap/dashboard-redesign.md) - Dashboard design
- [/docs/features/dashboard.md](./dashboard.md) - Dashboard overview
- [/docs/roadmap/unfinished-features.md](../roadmap/unfinished-features.md) - Implementation status

---

*Designed by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
