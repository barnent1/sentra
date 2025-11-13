use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub files: Vec<TemplateFile>,
    pub directories: Vec<String>,
    pub dependencies: Option<HashMap<String, String>>,
    pub dev_dependencies: Option<HashMap<String, String>>,
    pub scripts: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateFile {
    pub path: String,
    pub content: String,
}

/// Get all available templates
pub fn get_templates() -> Vec<Template> {
    vec![
        create_nextjs_template(),
        create_python_template(),
        create_react_template(),
    ]
}

/// Get a specific template by ID
pub fn get_template(id: &str) -> Option<Template> {
    get_templates().into_iter().find(|t| t.id == id)
}

/// Apply a template to a directory
pub fn apply_template(template: &Template, project_path: &Path) -> Result<(), String> {
    // Create directories
    for dir in &template.directories {
        let dir_path = project_path.join(dir);
        fs::create_dir_all(&dir_path)
            .map_err(|e| format!("Failed to create directory {}: {}", dir, e))?;
    }

    // Create files
    for file in &template.files {
        let file_path = project_path.join(&file.path);

        // Ensure parent directory exists
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory for {}: {}", file.path, e))?;
        }

        fs::write(&file_path, &file.content)
            .map_err(|e| format!("Failed to write file {}: {}", file.path, e))?;
    }

    Ok(())
}

/// Create Next.js template
fn create_nextjs_template() -> Template {
    Template {
        id: "nextjs".to_string(),
        name: "Next.js".to_string(),
        description: "React framework with App Router, TypeScript, and Tailwind CSS".to_string(),
        directories: vec![
            "src".to_string(),
            "src/app".to_string(),
            "src/components".to_string(),
            "public".to_string(),
        ],
        files: vec![
            TemplateFile {
                path: "README.md".to_string(),
                content: r#"# Next.js Project

This project was created with Sentra.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
"#.to_string(),
            },
            TemplateFile {
                path: ".gitignore".to_string(),
                content: r#"# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
"#.to_string(),
            },
            TemplateFile {
                path: "CLAUDE.md".to_string(),
                content: r#"# Project Context

This is a Next.js project with TypeScript and Tailwind CSS.

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS

## Development Standards

- Write tests FIRST (TDD approach)
- TypeScript strict mode is mandatory
- No `any` or `@ts-ignore`
- Follow AAA pattern for tests (Arrange, Act, Assert)

## Common Commands

```bash
npm run dev        # Start dev server
npm test           # Run tests
npm run build      # Production build
npm run type-check # TypeScript compilation check
```
"#.to_string(),
            },
            TemplateFile {
                path: "package.json".to_string(),
                content: r#"{
  "name": "nextjs-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10.0.1"
  }
}
"#.to_string(),
            },
            TemplateFile {
                path: "tsconfig.json".to_string(),
                content: r#"{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"#.to_string(),
            },
        ],
        dependencies: None,
        dev_dependencies: None,
        scripts: None,
    }
}

/// Create Python (FastAPI) template
fn create_python_template() -> Template {
    Template {
        id: "python".to_string(),
        name: "Python (FastAPI)".to_string(),
        description: "Modern Python API with FastAPI, async support, and type hints".to_string(),
        directories: vec![
            "app".to_string(),
            "app/api".to_string(),
            "app/models".to_string(),
            "app/services".to_string(),
            "tests".to_string(),
            "tests/unit".to_string(),
            "tests/integration".to_string(),
        ],
        files: vec![
            TemplateFile {
                path: "README.md".to_string(),
                content: r#"# Python FastAPI Project

This project was created with Sentra.

## Getting Started

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload
```

API will be available at [http://localhost:8000](http://localhost:8000)

API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Testing

```bash
pytest
pytest --cov=app  # With coverage
```
"#.to_string(),
            },
            TemplateFile {
                path: ".gitignore".to_string(),
                content: r#"# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
ENV/
env/

# Testing
.pytest_cache/
.coverage
htmlcov/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Environment variables
.env
.env.local
"#.to_string(),
            },
            TemplateFile {
                path: "CLAUDE.md".to_string(),
                content: r#"# Project Context

This is a Python FastAPI project.

## Tech Stack

- Python 3.11+
- FastAPI (async web framework)
- Pydantic (data validation)
- pytest (testing)
- uvicorn (ASGI server)

## Development Standards

- Write tests FIRST (TDD approach)
- Use type hints everywhere
- Follow PEP 8 style guide
- Minimum 90% test coverage for business logic
- Use async/await for I/O operations

## Common Commands

```bash
uvicorn app.main:app --reload  # Start dev server
pytest                          # Run tests
pytest --cov=app               # Run with coverage
mypy app                       # Type checking
black .                        # Format code
ruff check .                   # Lint code
```
"#.to_string(),
            },
            TemplateFile {
                path: "requirements.txt".to_string(),
                content: r#"fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-dotenv==1.0.0
"#.to_string(),
            },
            TemplateFile {
                path: "requirements-dev.txt".to_string(),
                content: r#"-r requirements.txt
pytest==7.4.0
pytest-cov==4.1.0
pytest-asyncio==0.21.0
httpx==0.26.0
black==23.12.0
ruff==0.1.0
mypy==1.8.0
"#.to_string(),
            },
            TemplateFile {
                path: "app/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "app/main.py".to_string(),
                content: r#"from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API",
    description="FastAPI project created with Sentra",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "API is running"}

@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "version": "0.1.0",
    }
"#.to_string(),
            },
            TemplateFile {
                path: "app/api/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "app/models/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "app/services/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "tests/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "tests/unit/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "tests/integration/__init__.py".to_string(),
                content: "".to_string(),
            },
            TemplateFile {
                path: "tests/test_main.py".to_string(),
                content: r#"import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint returns 200 OK."""
    # ARRANGE & ACT
    response = client.get("/")

    # ASSERT
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_health_endpoint():
    """Test health endpoint returns healthy status."""
    # ARRANGE & ACT
    response = client.get("/health")

    # ASSERT
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
"#.to_string(),
            },
            TemplateFile {
                path: "pytest.ini".to_string(),
                content: r#"[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --strict-markers
"#.to_string(),
            },
        ],
        dependencies: None,
        dev_dependencies: None,
        scripts: None,
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Get all available templates (Tauri command)
#[tauri::command]
pub fn get_templates_command() -> Result<Vec<Template>, String> {
    Ok(get_templates())
}

/// Get a specific template by ID (Tauri command)
#[tauri::command]
pub fn get_template_command(id: String) -> Result<Option<Template>, String> {
    Ok(get_template(&id))
}

// ============================================================================
// Template Definitions
// ============================================================================

/// Create React (Vite) template
fn create_react_template() -> Template {
    Template {
        id: "react".to_string(),
        name: "React (Vite)".to_string(),
        description: "Fast React development with Vite, TypeScript, and Tailwind CSS".to_string(),
        directories: vec![
            "src".to_string(),
            "src/components".to_string(),
            "src/hooks".to_string(),
            "src/utils".to_string(),
            "public".to_string(),
        ],
        files: vec![
            TemplateFile {
                path: "README.md".to_string(),
                content: r#"# React + Vite Project

This project was created with Sentra.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Testing

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage
```
"#.to_string(),
            },
            TemplateFile {
                path: ".gitignore".to_string(),
                content: r#"# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
"#.to_string(),
            },
            TemplateFile {
                path: "CLAUDE.md".to_string(),
                content: r#"# Project Context

This is a React + Vite project with TypeScript and Tailwind CSS.

## Tech Stack

- React 18
- Vite (build tool)
- TypeScript (strict mode)
- Tailwind CSS
- Vitest (testing)

## Development Standards

- Write tests FIRST (TDD approach)
- TypeScript strict mode is mandatory
- No `any` or `@ts-ignore`
- Follow AAA pattern for tests (Arrange, Act, Assert)
- Component names should be PascalCase
- Custom hooks should start with `use`

## Common Commands

```bash
npm run dev            # Start dev server
npm test               # Run tests in watch mode
npm run build          # Production build
npm run type-check     # TypeScript compilation check
npm run lint           # ESLint
```
"#.to_string(),
            },
            TemplateFile {
                path: "package.json".to_string(),
                content: r#"{
  "name": "react-vite-project",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "jsdom": "^23.0.1"
  }
}
"#.to_string(),
            },
            TemplateFile {
                path: "tsconfig.json".to_string(),
                content: r#"{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"#.to_string(),
            },
            TemplateFile {
                path: "tsconfig.node.json".to_string(),
                content: r#"{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
"#.to_string(),
            },
            TemplateFile {
                path: "vite.config.ts".to_string(),
                content: r#"import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
"#.to_string(),
            },
            TemplateFile {
                path: "index.html".to_string(),
                content: r#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"#.to_string(),
            },
            TemplateFile {
                path: "src/main.tsx".to_string(),
                content: r#"import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"#.to_string(),
            },
            TemplateFile {
                path: "src/App.tsx".to_string(),
                content: r#"import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          React + Vite
        </h1>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
        >
          Count is {count}
        </button>
        <p className="text-slate-400 mt-8">
          Edit <code className="text-violet-400">src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App
"#.to_string(),
            },
            TemplateFile {
                path: "src/index.css".to_string(),
                content: r#"@tailwind base;
@tailwind components;
@tailwind utilities;
"#.to_string(),
            },
            TemplateFile {
                path: "src/test/setup.ts".to_string(),
                content: r#"import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
"#.to_string(),
            },
            TemplateFile {
                path: "tailwind.config.js".to_string(),
                content: r#"/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"#.to_string(),
            },
            TemplateFile {
                path: "postcss.config.js".to_string(),
                content: r#"export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"#.to_string(),
            },
        ],
        dependencies: None,
        dev_dependencies: None,
        scripts: None,
    }
}
