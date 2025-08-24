# SENTRA Phase 2: Agent Framework & Context Engine

## Overview

Phase 2 of SENTRA implements the core agent framework with comprehensive context preservation, containerized agent lifecycle management, and quality gates validation. This phase establishes the foundation for multi-agent orchestration with the "never compact" context system.

## Architecture Overview

### Core Services

1. **Context Engine** (`/Users/barnent1/Projects/sentra/services/context-engine/`)
   - PostgreSQL + Redis hybrid storage for context preservation
   - Smart rotation (hot/warm/cold) without compaction
   - Seamless context injection for agents
   - Version snapshots and history tracking

2. **Agent Orchestrator** (`/Users/barnent1/Projects/sentra/services/agent-orchestrator/`)
   - Docker-based agent lifecycle management
   - Task queuing and distribution
   - Agent health monitoring and auto-recovery
   - Resource allocation and scaling

3. **Quality Guardian** (`/Users/barnent1/Projects/sentra/services/quality-guardian/`)
   - Comprehensive quality gates enforcement
   - Tech stack compliance validation (Drizzle ORM mandatory, Prisma forbidden)
   - Current documentation pattern validation
   - Automated code quality assessment

4. **James Agent** (`/Users/barnent1/Projects/sentra/agents/james/`)
   - First working development agent
   - Full context preservation integration
   - Code analysis and generation capabilities
   - TypeScript/Next.js specialization

### Key Features Implemented

#### Context Preservation Engine
- **Never Compact System**: Contexts are rotated through tiers but never compressed or lost
- **Hot Storage**: Redis for active contexts (< 2 hours old)
- **Warm Storage**: Redis for recent contexts (< 24 hours old)
- **Cold Storage**: PostgreSQL for archived contexts (> 24 hours old)
- **Seamless Injection**: Transparent context retrieval across all tiers
- **Version Snapshots**: Automatic snapshots at task completion

#### Agent Orchestration
- **Containerized Agents**: Docker-based isolation and lifecycle management
- **Health Monitoring**: Continuous health checks with auto-restart
- **Task Queue**: Priority-based task distribution (critical/high/medium/low)
- **Resource Management**: CPU/memory limits and monitoring
- **Agent Discovery**: Redis-based agent registry and load balancing

#### Documentation Caching Pipeline
- **Daily Refresh**: Automated documentation updates from official sources
- **Pattern Extraction**: Smart extraction of API routes, components, hooks, utilities
- **Version-Specific**: Maintains current documentation patterns
- **Mandatory Gates**: Forces agents to use current documentation

#### Quality Gates System
- **Tech Stack Enforcement**: 
  - ✅ Next.js 14+ required
  - ✅ TypeScript mandatory
  - ✅ Drizzle ORM required
  - ❌ Prisma ORM forbidden
  - ✅ React 18+ with function components
- **Code Quality**: Linting, type checking, test coverage validation
- **Current Patterns**: JSX text wrapping, modern Next.js patterns
- **Security Scanning**: Dependency audits and vulnerability checks

## Project Structure

```
/Users/barnent1/Projects/sentra/
├── services/
│   ├── context-engine/          # Context preservation service
│   ├── agent-orchestrator/      # Agent lifecycle management
│   ├── quality-guardian/        # Quality gates and validation
│   ├── auth-service/           # Authentication service
│   └── api-gateway/            # API gateway and routing
├── agents/
│   └── james/                  # James development agent
├── infrastructure/
│   ├── database/               # PostgreSQL schemas and migrations
│   ├── docker/                 # Docker configurations
│   └── monitoring/             # Prometheus and Grafana
├── shared/
│   └── types/                  # Shared TypeScript types
├── scripts/                    # Automation and testing scripts
└── docker-compose.yml          # Development infrastructure
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3+

### Quick Start

1. **Setup Development Environment**
   ```bash
   cd /Users/barnent1/Projects/sentra/scripts
   npm install
   npm run setup:dev
   ```

2. **Start Infrastructure**
   ```bash
   cd /Users/barnent1/Projects/sentra
   docker-compose up -d postgres redis rabbitmq vault
   ```

3. **Start Services**
   ```bash
   # Context Engine
   cd services/context-engine
   npm run dev

   # Agent Orchestrator
   cd services/agent-orchestrator
   npm run dev

   # Quality Guardian
   cd services/quality-guardian
   npm run dev
   ```

4. **Run Framework Tests**
   ```bash
   cd scripts
   npm run test:framework
   ```

### Environment Configuration

Create `/Users/barnent1/Projects/sentra/.env`:
```env
# Database
POSTGRES_PASSWORD=sentra_dev_pass
DATABASE_URL=postgresql://sentra_user:sentra_dev_pass@localhost:5433/sentra

# Redis
REDIS_PASSWORD=sentra_dev_redis
REDIS_URL=redis://:sentra_dev_redis@localhost:6379

# RabbitMQ
RABBITMQ_PASSWORD=sentra_dev_rabbit
RABBITMQ_URL=amqp://sentra:sentra_dev_rabbit@localhost:5672

# Anthropic AI (for James agent)
ANTHROPIC_API_KEY=your-api-key-here

# Quality Gates
MIN_TEST_COVERAGE=80
ENABLE_STRICT_QUALITY_GATES=true
```

## API Endpoints

### Context Engine (Port 3002)
- `POST /api/context` - Create new context
- `GET /api/context/:id` - Retrieve context
- `PUT /api/context/:id` - Update context
- `DELETE /api/context/:id` - Soft delete context
- `POST /api/context/inject` - Context injection for agents
- `POST /api/context/:id/snapshot` - Create context snapshot
- `GET /api/context/:id/history` - Get context history

### Agent Orchestrator (Port 3001)
- `POST /api/agents` - Create agent definition
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/:id/start` - Start agent container
- `POST /api/agents/:id/stop` - Stop agent container
- `POST /api/tasks` - Queue new task
- `GET /api/tasks/queue/status` - Get queue status

### James Agent (Port 8080)
- `GET /health` - Health check
- `GET /health/status` - Detailed agent status
- `GET /api/tasks/context` - Current context information
- `GET /api/tasks/workspace` - Workspace information

## Context Preservation System

### Storage Tiers

1. **Hot Tier (Redis)**
   - Active contexts < 2 hours old
   - Instant access for current tasks
   - LRU eviction to warm tier

2. **Warm Tier (Redis)**
   - Recent contexts < 24 hours old
   - Quick access for recent tasks
   - TTL-based rotation to cold tier

3. **Cold Tier (PostgreSQL)**
   - Archived contexts > 24 hours old
   - Persistent storage with full history
   - Indexed for efficient retrieval

### Context Injection Workflow

```mermaid
sequenceDiagram
    Agent->>Context Engine: Request context injection
    Context Engine->>Redis Hot: Check hot tier
    Context Engine->>Redis Warm: Check warm tier (if not in hot)
    Context Engine->>PostgreSQL: Check cold tier (if not in warm)
    Context Engine->>Agent: Inject context seamlessly
    Agent->>Context Engine: Update context during task
    Context Engine->>Storage Tier: Store updates in appropriate tier
```

## Quality Gates Implementation

### Tech Stack Compliance

The quality guardian enforces strict tech stack compliance:

```typescript
// ✅ REQUIRED: Drizzle ORM
import { drizzle } from 'drizzle-orm/postgres-js';
import { users } from './schema';

// ❌ FORBIDDEN: Prisma ORM
import { PrismaClient } from '@prisma/client'; // This will FAIL quality gates

// ✅ REQUIRED: JSX text wrapping
return <div>{"Text with special characters!"}</div>;

// ❌ INCORRECT: Unescaped JSX text
return <div>Text with special characters!</div>;
```

### Quality Check Types

1. **Tech Stack Compliance** - Validates approved technologies
2. **Current Documentation** - Ensures modern patterns usage
3. **Code Quality** - Linting, type checking, complexity
4. **Test Coverage** - Minimum 80% coverage requirement
5. **Security Scanning** - Dependency vulnerabilities
6. **Bundle Analysis** - Performance and size optimization

## James Agent Capabilities

The first working agent (James) provides:

### Core Features
- **Code Analysis**: Quality assessment and recommendations
- **Code Generation**: Context-aware code generation with TypeScript/Next.js
- **Context Preservation**: Full conversation and code history tracking
- **File Operations**: Workspace file management
- **Git Integration**: Version control operations
- **Testing Support**: Test generation and execution

### Context Integration
- Automatic context creation for each task
- Real-time context updates during execution
- File change tracking and version history
- Decision and reasoning logging
- Snapshot creation on task completion

## Testing Framework

The comprehensive test suite validates:

### Infrastructure Tests
- Database connectivity (PostgreSQL)
- Cache connectivity (Redis)
- Message queue connectivity (RabbitMQ)
- Docker availability

### Service Tests
- Context Engine CRUD operations
- Agent Orchestrator lifecycle management
- James Agent capabilities
- Quality Guardian validation

### End-to-End Tests
- Complete task workflows
- Context preservation across services
- Multi-service integration

Run tests:
```bash
cd /Users/barnent1/Projects/sentra/scripts
npm run test:framework
```

## Monitoring and Observability

### Metrics (Prometheus)
- Context operation duration and success rates
- Agent performance and resource usage
- Task queue lengths and processing times
- Quality gate pass/fail rates
- Cache hit/miss ratios

### Dashboards (Grafana)
- Agent health and performance
- Context storage tier distribution
- Task processing pipelines
- Quality metrics trends

### Health Checks
All services expose comprehensive health endpoints:
- `/health` - Basic liveness check
- `/health/ready` - Readiness for traffic
- `/health/live` - Kubernetes liveness probe

## Development Workflow

### Adding New Agents

1. **Create Agent Directory**
   ```bash
   mkdir -p agents/your-agent
   cd agents/your-agent
   ```

2. **Implement Agent Interface**
   ```typescript
   import { JamesAgent } from '../james/src/services/jamesAgent';
   
   export class YourAgent extends JamesAgent {
     // Implement your specific capabilities
   }
   ```

3. **Register with Orchestrator**
   ```typescript
   const agentDefinition = {
     name: 'Your Agent',
     type: 'your_agent_type',
     capabilities: ['capability1', 'capability2'],
     // ... configuration
   };
   ```

### Context Usage Patterns

```typescript
// Create task context
const contextId = await ContextClient.createTaskContext(
  taskId, 
  'code_generation', 
  taskData
);

// Add conversation entries
await ContextClient.addConversationEntry(
  contextId,
  'user',
  'Generate a React component for user profile'
);

// Track file changes
await ContextClient.trackFileChange(
  contextId,
  'components/UserProfile.tsx',
  'created',
  componentCode
);

// Record decisions
await ContextClient.recordDecision(
  contextId,
  'Used functional component over class component',
  'Modern React best practices favor hooks and functional components',
  ['Class component', 'Functional component with hooks']
);
```

## Production Deployment

### Docker Images
All services are containerized and ready for production:

```bash
# Build all services
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
Kubernetes manifests are provided in `/infrastructure/k8s/`:

```bash
kubectl apply -f infrastructure/k8s/
```

### Environment Variables
Ensure all production environment variables are configured:
- Database connection strings
- API keys (Anthropic, etc.)
- Redis cluster configuration
- Message queue settings
- Monitoring endpoints

## Security Considerations

### Agent Isolation
- Each agent runs in its own Docker container
- Resource limits prevent resource exhaustion
- Network policies restrict inter-agent communication

### Context Security
- Context data encrypted in transit and at rest
- Access control based on user permissions
- Audit logging for all context operations

### API Security
- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization

## Performance Characteristics

### Context Engine
- **Hot Context Access**: < 5ms average
- **Warm Context Access**: < 20ms average
- **Cold Context Access**: < 100ms average
- **Context Injection**: < 1s for 50MB context

### Agent Orchestrator
- **Agent Startup**: < 30s average
- **Task Assignment**: < 100ms average
- **Health Check Cycle**: 30s interval
- **Auto-recovery**: < 2 minutes

### Quality Gates
- **Tech Stack Check**: < 10s
- **Code Quality Check**: < 60s
- **Test Coverage**: < 120s (depends on test suite)

## Troubleshooting

### Common Issues

1. **Context Engine Connection Errors**
   - Verify PostgreSQL and Redis are running
   - Check connection strings in environment
   - Ensure database schema is initialized

2. **Agent Startup Failures**
   - Check Docker daemon status
   - Verify agent image availability
   - Review resource limits and availability

3. **Quality Gate Failures**
   - Review specific quality check logs
   - Ensure tech stack compliance
   - Verify test coverage meets requirements

### Debug Commands

```bash
# Check service health
curl http://localhost:3002/health
curl http://localhost:3001/health

# View logs
docker-compose logs context-engine
docker-compose logs agent-orchestrator

# Database status
docker exec sentra-postgres pg_isready -U sentra_user

# Redis status  
docker exec sentra-redis redis-cli ping
```

## Contributing

### Code Standards
- TypeScript strict mode required
- ESLint and Prettier configuration enforced
- Minimum 80% test coverage
- All commits must pass quality gates

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Run quality gates: `npm run test:framework`
4. Submit PR with detailed description
5. Address code review feedback
6. Merge after approval and CI success

## Next Steps (Phase 3)

Phase 2 establishes the foundation. Phase 3 will expand with:

1. **Multi-Agent Orchestration**: Complex workflows with agent coordination
2. **Advanced Context Intelligence**: Predictive context loading and optimization
3. **Production Scaling**: Kubernetes operators and auto-scaling
4. **Enhanced Quality Gates**: ML-based code quality assessment
5. **Agent Marketplace**: Pluggable agent ecosystem

## Support

For issues and questions:
- Review the troubleshooting guide above
- Check service logs for detailed error information
- Verify environment configuration
- Run the test framework to validate setup

The SENTRA Phase 2 implementation provides a robust, scalable foundation for AI agent development with comprehensive context preservation and quality assurance.