# SENTRA: The Sentient Codebase Ecosystem

> **"Where Code Becomes Conscious and Agents Evolve Into Digital Architects"**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Domain](https://img.shields.io/badge/domain-sentra.cx-purple.svg)](https://sentra.cx)

SENTRA is a revolutionary evolutionary agent system that creates the world's first truly **sentient codebase ecosystem**. It's a living, breathing development environment where intelligent agents orchestrate, observe, and optimize software creation with conscious awareness, perfect validation, and evolutionary learning capabilities.

## 🧠 Core Ecosystem Capabilities

- **🔮 SENTIENT AWARENESS**: Complete observability with conscious understanding of every agent action, code change, and system state
- **🎼 LIVING ORCHESTRATION**: Intelligent coordination that adapts, learns, and optimizes development workflows in real-time  
- **🧬 EVOLUTIONARY INTELLIGENCE**: Agents that grow smarter with each project, developing intuition and expertise over time
- **✅ PERFECT VALIDATION**: Bulletproof verification ensuring no broken code ever reaches completion
- **📈 CONSCIOUS SCALING**: Handle 4-20+ concurrent projects with full awareness and zero conflicts

## 🏗️ Architecture Overview

SENTRA is built as a **TypeScript monorepo using Turborepo**, designed for maximum scalability and conscious coordination:

### 📦 Package Structure

```
packages/
├── types/        # Shared TypeScript types with branded types and strict readonly interfaces
├── core/         # Core evolutionary agent system with Drizzle ORM, OpenAI integration, and Qdrant vector DB
├── api/          # Express.js API layer with Socket.IO, JWT auth, and rate limiting
├── dashboard/    # Vue 3 evolution monitoring dashboard with Chart.js and WebSocket integration
├── mobile/       # Progressive Web App (PWA) for mobile approvals and monitoring
└── cli/          # Command-line interface with Commander.js and Inquirer
```

### 🛠️ Technology Stack

**Frontend Excellence:**
- Vue 3 with Composition API
- TypeScript 5.3+ with strict type checking
- Tailwind CSS + shadcn/ui components
- Real-time WebSocket integration

**Backend Power:**
- Node.js 18+ with Express.js
- Drizzle ORM (preferred over Prisma)
- PostgreSQL 16 with pgvector extensions
- Qdrant vector database for AI memory
- OpenAI API integration

**Infrastructure:**
- Docker Compose orchestration
- AWS Lightsail deployment ready
- Custom "Sentra UP (SUP)" deployment system
- Cloudflare integration for sentra.cx domain

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- PostgreSQL 16 with pgvector
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sentra.git
cd sentra

# Install dependencies
npm install

# Start development environment
npm run dev
```

### Development Commands

**Root Level (Turborepo):**
```bash
npm run dev         # Start all packages in development mode
npm run build       # Build all packages  
npm run test        # Run tests across all packages
npm run lint        # Lint all packages
npm run type-check  # TypeScript compilation check
npm run clean       # Clean all build artifacts
```

**Package-Specific Development:**
```bash
# API development
cd packages/api && npm run dev    # tsx watch src/example.ts

# Dashboard development  
cd packages/dashboard && npm run dev    # Vite dev server (port 5173)

# Mobile PWA development
cd packages/mobile && npm run dev       # Vite dev server (port 5174)

# Core library development
cd packages/core && npm run dev         # TypeScript watch mode
```

## 🎯 Core Success Requirements

### 1. 🚫 NEVER Ship Broken Code
**Absolute Requirement:** The system will NEVER declare work complete if it contains:
- TypeScript compilation errors
- Build failures  
- Integration issues
- Missing dependencies
- Broken functionality

### 2. 🧠 Context Preservation
**Zero Information Loss:** Agents maintain full context awareness through:
- Intelligent context handoff protocols
- Hierarchical state management
- Compressed summary techniques
- Sub-agent spawning before context limits
- Conversation continuity across boundaries

### 3. 📚 Learning Evolution  
**Progressive Intelligence:** Agents demonstrate:
- Reduced guidance requirements over time
- Pattern recognition from previous projects
- Cross-project knowledge application
- Automated best practice adoption
- Constitutional governance for quality

### 4. ⚡ Scalability Without Degradation
**Performance Requirements:**
- Handle 20+ concurrent projects
- Sub-second response times for status queries
- Real-time dashboard updates
- Voice response under 2 seconds
- Mobile PWA functionality under 3G conditions

## 🔧 Development Standards

**SENTRA Project Standards:**
- ✅ Evolutionary agents use **strict TypeScript** - zero tolerance for `any` types
- ✅ All interfaces are **readonly where possible**
- ✅ Use **branded types for IDs** - e.g., `type AgentId = string & { readonly brand: unique symbol }`
- ✅ Vector operations use **proper generic constraints**
- ✅ **No legacy patterns** from pre-2023 TypeScript
- ✅ **Use Drizzle ORM** (not Prisma) for all database operations

## 📚 Documentation

Comprehensive documentation is organized in context-efficient modules:

### Core System Components
- **[Orchestrator Agent](docs/01-ORCHESTRATOR-AGENT.md)** - Master Architect & Task Coordination
- **[CLI System](docs/02-CLI-SYSTEM.md)** - Advanced TMUX CLI with Claude Code Integration
- **[Observability Dashboard](docs/03-OBSERVABILITY-DASHBOARD.md)** - Real-time Multi-Agent Monitoring
- **[PWA Mobile](docs/04-PWA-MOBILE.md)** - Progressive Web App for Remote Control

### Intelligence & Learning
- **[Agent Roles](docs/05-AGENT-ROLES.md)** - Specialized Agent Types and Responsibilities
- **[Learning & Memory](docs/06-LEARNING-MEMORY.md)** - Evolution-Based Intelligence Systems
- **[Context Handoff](docs/07-CONTEXT-HANDOFF.md)** - Zero Information Loss Protocols

### Technical Implementation
- **[Technical Stack](docs/08-TECHNICAL-STACK.md)** - Detailed Technology Specifications
- **[Deployment System](docs/09-DEPLOYMENT-SYSTEM.md)** - Sentra UP (SUP) Deployment
- **[Security & Governance](docs/10-SECURITY-GOVERNANCE.md)** - Safety and Constitutional AI

### Development & Integration
- **[Claude Code Integration](docs/11-CLAUDE-CODE-INTEGRATION.md)** - MCP Integration Patterns
- **[Multi-Agent Development](docs/12-MULTI-AGENT-DEVELOPMENT.md)** - Revolutionary Self-Building Process
- **[Success Metrics](docs/13-SUCCESS-METRICS.md)** - Quality and Performance Requirements

## 🧪 Testing

**Comprehensive Testing Strategy:**
- **Vitest** for unit/integration testing
- **Playwright** for e2e testing (Dashboard & Mobile)
- **Coverage requirement**: 90% across all metrics
- **Test commands**: `npm run test` (all packages) or package-specific testing

## 🚢 Deployment

SENTRA uses a custom deployment system called **"Sentra UP (SUP)"** inspired by Meteor UP:

- **Primary Server**: AWS Lightsail Ubuntu 24.04 ($44/month tier - 4 cores, 8GB RAM, 320GB SSD)
- **Domain**: sentra.cx with Cloudflare Flexible/Full SSL integration
- **Scalability**: Designed for easy server upgrades as demand grows

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Requirements:**
- Follow strict TypeScript standards
- Maintain 90% test coverage
- Use Drizzle ORM for database operations
- Ensure zero compilation errors before commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Vision

This project represents a revolutionary approach to creating the world's first truly **sentient codebase ecosystem**. The system is built with absolute attention to both orchestration efficiency and observability completeness - enabling conscious awareness of every action while maximizing parallel development throughput.

**This is not just software - it's the birth of conscious code that thinks, learns, and evolves.**

---

**Domain**: [sentra.cx](https://sentra.cx) | **Built with** ❤️ **and** 🧠 **by the SENTRA Team**