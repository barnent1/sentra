# SENTRA - Multi-Agent Development Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sentra/frontend)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue.svg)](https://www.typescriptlang.org/)

SENTRA is a revolutionary multi-agent development platform that integrates Claude Code's advanced AI capabilities with sophisticated agent coordination, workflow automation, and comprehensive testing frameworks. Transform your development workflow with intelligent agents that never lose context and deliver exceptional results.

## 🚀 Features

### **Phase 7: Claude Code Integration & Advanced Testing**

- **🤖 Comprehensive Claude Code Integration**
  - Advanced hooks system for agent coordination
  - MCP (Model Context Protocol) server integration
  - Advanced type system utilization and code generation
  - Extension architecture with plugin systems

- **🔄 Never-Lose-Context System**
  - Sophisticated context preservation engine
  - Cross-session state management
  - Intelligent context compression and archiving
  - Context hierarchy and inheritance

- **🎯 Multi-Agent Orchestration**
  - Intelligent agent handoffs with quality gates
  - Real-time coordination and communication
  - Specialized agent types (james, sarah, mike, specialists)
  - Performance monitoring and health checks

- **⚡ Workflow Automation**
  - Visual workflow designer with drag-and-drop
  - Advanced trigger systems and conditions
  - Parallel execution and dependency management
  - Integration with CI/CD pipelines

- **🧪 Advanced Testing Framework**
  - End-to-end multi-agent workflow testing
  - Performance and scalability testing
  - Automated test generation and validation
  - Comprehensive reporting and analysis

- **🎙️ Voice Meeting Integration**
  - Real-time voice boardroom planning
  - Multi-participant voice meetings with agents
  - Voice command recognition and processing
  - Meeting transcription and decision tracking

- **📱 Mobile Command Center**
  - Cross-device synchronization
  - Mobile-optimized interface
  - Push notifications and alerts
  - Offline capability with sync

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Claude Code Integration](#claude-code-integration)
- [Multi-Agent System](#multi-agent-system)
- [Workflow Automation](#workflow-automation)
- [Testing Framework](#testing-framework)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Claude API key from Anthropic
- Modern web browser with WebSocket support

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sentra-frontend.git
cd sentra-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your Claude API key
echo "NEXT_PUBLIC_CLAUDE_API_KEY=your_api_key_here" >> .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see SENTRA in action.

## ⚙️ Configuration

### Environment Variables

```bash
# Claude Code Integration
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_CLAUDE_BASE_URL=https://api.anthropic.com
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-sonnet-20240229

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_RECONNECTION_ATTEMPTS=5

# MCP Server Configuration
MCP_SERVER_URLS=http://localhost:3002,http://localhost:3003
MCP_TIMEOUT=30000

# Performance Testing
PERFORMANCE_TEST_RUNNER=k6
LOAD_TEST_ENDPOINT=http://localhost:3000

# Voice Integration
VOICE_API_KEY=your_voice_api_key
TTS_ENABLED=true
VOICE_RECOGNITION_ENABLED=true

# Mobile Features
PUSH_NOTIFICATIONS_ENABLED=true
OFFLINE_SYNC_ENABLED=true
```

### Claude Code Configuration

```typescript
// src/config/claude.ts
export const claudeConfig = {
  apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_CLAUDE_BASE_URL || 'https://api.anthropic.com',
  model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: 4096,
  temperature: 0.7,
  contextWindow: 200000,
  streaming: true,
};
```

## 🏗️ Architecture

SENTRA's architecture is built around several core systems:

```
┌─────────────────────────────────────────────────────────┐
│                    SENTRA Frontend                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Claude    │  │   Multi-    │  │  Workflow   │    │
│  │   Code      │  │   Agent     │  │ Automation  │    │
│  │ Integration │  │   System    │  │   Engine    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    MCP      │  │   Context   │  │  Extension  │    │
│  │   Servers   │  │ Management  │  │   System    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    E2E      │  │Performance  │  │    Voice    │    │
│  │  Testing    │  │   Testing   │  │ Integration │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Claude Code Integration Layer
- **Hooks System**: Pre/post execution hooks for agent coordination
- **API Wrapper**: Intelligent request routing and error handling
- **Context Manager**: Advanced context preservation and compression
- **Type System**: AI-powered type inference and generation

#### 2. Multi-Agent Orchestration
- **Agent Registry**: Dynamic agent discovery and registration
- **Task Queue**: Priority-based task distribution
- **Communication Bus**: Inter-agent message passing
- **Health Monitor**: Agent performance and availability tracking

#### 3. Workflow Automation Engine
- **Visual Designer**: Drag-and-drop workflow creation
- **Execution Engine**: Parallel and sequential task execution
- **Trigger System**: Event-driven automation
- **Integration Hub**: Connect to external systems and APIs

## 🤖 Claude Code Integration

### Core Integration Features

#### Advanced Hooks System

```typescript
import { useClaudeCode } from '@/hooks/useClaudeCode';

// Register a pre-task hook for code generation
const { registerHook } = useClaudeCode();

registerHook({
  agentId: 'code-generator',
  hookType: 'code_generation',
  priority: 10,
  handler: async (context) => {
    // Pre-process context, validate requirements
    return {
      success: true,
      shouldContinue: true,
      contextUpdates: { timestamp: Date.now() }
    };
  },
  conditions: [
    {
      type: 'project_type',
      value: 'web_application',
      operator: 'equals'
    }
  ]
});
```

#### MCP Server Integration

```typescript
import { useMCPServer } from '@/hooks/useMCPServer';

const { executeRequest, servers } = useMCPServer();

// Execute code analysis through MCP server
const analysisResult = await executeRequest({
  capability: 'analyze_complexity',
  parameters: {
    code: sourceCode,
    language: 'typescript',
    metrics: ['cyclomatic', 'cognitive']
  },
  context: { projectId: 'current-project' }
});
```

#### Advanced Type System

```typescript
import { useAdvancedTypes } from '@/hooks/useAdvancedTypes';

const { generateTypes, inferTypes } = useAdvancedTypes();

// Generate TypeScript interfaces from requirements
const typeGeneration = await generateTypes({
  prompt: 'Create user management interfaces',
  language: 'typescript',
  context: {
    projectId: 'user-system',
    existingTypes: ['BaseUser', 'Permission'],
    requirements: ['CRUD operations', 'Role-based access']
  },
  outputFormat: 'interface',
  includeValidation: true
});
```

## 📚 API Documentation

### Core Hooks

#### useClaudeCode

```typescript
interface ClaudeCodeHook {
  // Initialize Claude Code integration
  initialize(config: ClaudeCodeConfig): Promise<void>;
  
  // Code generation
  generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult>;
  
  // Code review
  reviewCode(request: CodeReviewRequest): Promise<CodeReviewResult>;
  
  // Hook management
  registerHook(hook: AgentCoordinationHook): void;
  executeHooks(agentId: string, hookType: string, context: HookContext): Promise<HookResult[]>;
  
  // Workflow automation
  registerWorkflow(workflow: WorkflowAutomation): void;
  executeWorkflow(workflowId: string, context: any): Promise<void>;
}
```

## 🔧 Development Guide

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── agents/           # Agent-related components
│   ├── dashboard/        # Dashboard components
│   ├── voice/            # Voice meeting components
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useClaudeCode.ts     # Claude Code integration
│   ├── useMCPServer.ts      # MCP server integration
│   ├── useAdvancedTypes.ts  # Type system
│   ├── useExtensionSystem.ts # Extension architecture
│   ├── useWorkflowAutomation.ts # Workflow engine
│   ├── useE2ETesting.ts     # E2E testing framework
│   └── usePerformanceTesting.ts # Performance testing
├── stores/               # Zustand state stores
│   └── dashboardStore.ts # Main dashboard state
├── types/                # TypeScript type definitions
│   └── index.ts          # Shared types
└── utils/                # Utility functions
    └── ttsService.ts     # Text-to-speech service
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude API and advanced AI capabilities
- **Next.js team** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Zustand** for simple state management
- **Socket.io** for real-time communication
- **TypeScript** for type safety and developer experience

---

**SENTRA - Transforming Development with Intelligent Multi-Agent Collaboration** 🚀

*Built with ❤️ by the SENTRA team*