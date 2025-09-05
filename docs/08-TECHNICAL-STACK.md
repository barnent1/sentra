# Detailed Technology Specifications and Implementation Requirements

**Claude Code Optimized Architecture for Sentient Codebase Ecosystem**

---

## Primary Purpose

Comprehensive technical specification for the Sentra ecosystem, defining the complete technology stack with implementation patterns, integration requirements, and deployment strategies. This stack is specifically optimized for Claude Code compatibility and evolutionary agent development.

## Core Technology Foundation

### A. Frontend Architecture

#### Next.js 15 with App Router
**Implementation Requirements:**
- **App Router:** Mandatory use of new app directory structure for improved performance
- **Server Components:** Default for all components unless client interactivity required
- **Server Actions:** Form handling and data mutations without separate API routes
- **Streaming:** Built-in support for progressive content loading
- **Middleware:** Edge runtime for authentication and request modification

```typescript
// App Router Structure Example
app/
├── layout.tsx          // Root layout with providers
├── page.tsx           // Dashboard home page
├── projects/
│   ├── [id]/
│   │   ├── page.tsx   // Project detail view
│   │   └── loading.tsx // Streaming loading UI
├── api/
│   └── trpc/
│       └── route.ts   // tRPC API route
└── globals.css        // Global styles
```

#### TypeScript Configuration
**Strict Standards (Sentra Project Requirements):**
- Strict TypeScript compilation with zero tolerance for errors
- Readonly interfaces wherever possible
- Branded types for all IDs and critical values
- Generic constraints for vector operations and AI memory
- No legacy patterns from pre-2023 TypeScript

```typescript
// Branded Types for Type Safety
type ProjectId = string & { readonly brand: unique symbol };
type AgentId = string & { readonly brand: unique symbol };

// Readonly Interfaces
interface ReadonlyAgentConfig {
  readonly id: AgentId;
  readonly type: AgentType;
  readonly capabilities: readonly string[];
  readonly memoryScope: readonly MemoryEntry[];
}

// Vector Generic Constraints
interface VectorOperation<T extends number[]> {
  readonly vectors: readonly T[];
  readonly dimensions: T['length'];
  readonly similarity: (a: T, b: T) => number;
}
```

#### Styling and UI Framework
**Tailwind CSS + shadcn/ui Integration:**
- **Tailwind CSS 4.0:** Latest version with improved performance
- **shadcn/ui Components:** Customizable, accessible component library
- **CSS Variables:** Dynamic theming support for dark mode
- **Responsive Design:** Mobile-first approach with PWA optimization
- **Animation System:** Framer Motion for sophisticated interactions

```typescript
// shadcn/ui Component Configuration
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### B. Backend Architecture

#### Node.js Runtime Environment
**Performance Requirements:**
- **Node.js 20+:** Latest LTS with improved performance and security
- **ES Modules:** Modern module system with tree shaking
- **TypeScript Compilation:** Strict compilation with build-time validation
- **Memory Management:** Optimized for long-running agent processes

#### tRPC for Type-Safe APIs
**End-to-End Type Safety:**
- **Shared Types:** Client and server share identical type definitions
- **Runtime Validation:** Zod schemas for request/response validation
- **Streaming Support:** Real-time data with subscriptions
- **Error Handling:** Type-safe error management across the stack

```typescript
// tRPC Router Example
const agentRouter = router({
  create: publicProcedure
    .input(z.object({
      type: z.enum(['frontend', 'backend', 'database']),
      config: AgentConfigSchema
    }))
    .output(z.object({
      agentId: z.string(),
      status: z.enum(['spawning', 'ready', 'error'])
    }))
    .mutation(async ({ input }) => {
      return await agentFactory.createAgent(input);
    }),
    
  subscribe: publicProcedure
    .subscription(() => {
      return observable<AgentEvent>((emit) => {
        // WebSocket event streaming
        return agentEventBus.subscribe(emit.next);
      });
    })
});
```

### C. Database and Storage Systems

#### Primary Database: PostgreSQL with pgvector
**Advanced Capabilities:**
- **PostgreSQL 16:** Latest version with improved performance
- **pgvector Extension:** Vector similarity search for AI memory
- **Connection Pooling:** Optimized connection management
- **Read Replicas:** Horizontal scaling for read operations
- **Backup Strategy:** Automated backups with point-in-time recovery

```sql
-- Vector Storage for Agent Memory
CREATE EXTENSION vector;

CREATE TABLE agent_memories (
  id UUID PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  content_embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX ON agent_memories 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);
```

#### ORM: Drizzle ORM (User Preference)
**Modern TypeScript ORM:**
- **Type Safety:** Full TypeScript integration with schema inference
- **Performance:** Lightweight with minimal runtime overhead  
- **SQL-like Syntax:** Intuitive query building with raw SQL when needed
- **Migration System:** Type-safe schema migrations
- **Multi-Database Support:** PostgreSQL, MySQL, SQLite compatibility

```typescript
// Drizzle Schema Definition
import { pgTable, uuid, varchar, vector, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const agentMemories = pgTable('agent_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  contentEmbedding: vector('content_embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

// Type-safe queries
const memories = await db
  .select()
  .from(agentMemories)
  .where(eq(agentMemories.agentId, 'agent-123'))
  .orderBy(desc(agentMemories.createdAt));
```

#### Vector Database: Qdrant
**Superior Performance for AI Memory:**
- **High-Performance:** 354 QPS at 99% recall rate
- **Scalability:** Distributed architecture with sharding
- **Filtering:** Advanced metadata filtering capabilities
- **API Integration:** RESTful and gRPC interfaces
- **Memory Management:** Efficient vector storage and retrieval

```typescript
// Qdrant Integration
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  host: process.env.QDRANT_HOST,
  port: 6333
});

// Store agent learning patterns
await client.upsert('agent_knowledge', {
  points: [{
    id: generateId(),
    vector: embedding,
    payload: {
      agentId: 'agent-123',
      projectType: 'nextjs',
      pattern: 'component optimization',
      success_rate: 0.95
    }
  }]
});
```

#### Caching and Session Management: Redis/Valkey
**High-Performance Data Structures:**
- **Redis 7.0+:** Latest version with improved memory efficiency
- **Valkey Alternative:** Open-source Redis fork for production use
- **Clustering:** High availability with master-replica setup
- **Persistence:** RDB and AOF for data durability
- **Pub/Sub:** Real-time agent communication

```typescript
// Agent state management
interface AgentState {
  id: string;
  status: 'idle' | 'working' | 'learning' | 'error';
  currentTask?: string;
  resources: string[];
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageTime: number;
  };
}

// Redis operations
await redis.hset(
  `agent:${agentId}:state`,
  'status', 'working',
  'currentTask', taskId,
  'lastUpdate', Date.now()
);
```

### D. Real-time Communication

#### WebSocket Architecture
**Bidirectional Communication:**
- **WebSocket Server:** Native Node.js WebSocket implementation
- **Connection Management:** Automatic reconnection and heartbeat
- **Message Routing:** Agent-specific channels and broadcasts
- **Authentication:** Secure WebSocket connections with JWT
- **Scaling:** Horizontal scaling with Redis pub/sub

```typescript
// WebSocket Manager Implementation
export class WebSocketManager {
  private clients = new Map<string, WebSocket>();
  private agentSubscriptions = new Map<string, Set<string>>();

  async broadcastToAgents(agentIds: string[], message: AgentEvent): Promise<void> {
    const serialized = JSON.stringify(message);
    agentIds.forEach(agentId => {
      const ws = this.clients.get(agentId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    });
  }

  async subscribeToAgent(clientId: string, agentId: string): Promise<void> {
    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }
    this.agentSubscriptions.get(agentId)!.add(clientId);
  }
}
```

#### Server-Sent Events (SSE)
**Streaming Dashboard Updates:**
- **Event Streams:** Real-time dashboard data streaming
- **Automatic Reconnection:** Built-in browser reconnection handling
- **Event Types:** Structured event types for different data streams
- **Compression:** Gzip compression for reduced bandwidth
- **Caching:** Edge caching for static event data

### E. AI and LLM Integration

#### Claude Code MCP Integration
**Model Context Protocol:**
- **Native Integration:** Direct Claude Code tool integration
- **Context Preservation:** Seamless context handoff between agents
- **Tool Execution:** File operations, code generation, and system commands
- **Security Sandboxing:** Isolated execution environments
- **Performance Monitoring:** Request tracking and optimization

#### LangGraph Orchestration
**Stateful Multi-Agent Workflows:**
- **Graph Representation:** Agents as nodes, communication as edges
- **Built-in Persistence:** Automatic state management and recovery
- **Human-in-the-Loop:** Manual intervention points for complex decisions
- **Token Streaming:** Real-time response streaming
- **Error Handling:** Automatic retry and fallback mechanisms

```typescript
// LangGraph Agent Workflow
import { StateGraph } from "@langchain/langgraph";

interface AgentState {
  messages: Array<BaseMessage>;
  currentTask: string;
  completedTasks: string[];
  nextAgent?: string;
}

const workflow = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => []
    }
  }
})
.addNode("orchestrator", orchestratorAgent)
.addNode("typescript_agent", typescriptAgent)
.addNode("database_agent", databaseAgent)
.addEdge("orchestrator", "typescript_agent")
.addConditionalEdges("typescript_agent", shouldContinue, {
  continue: "database_agent",
  end: END
});
```

### F. Development and Deployment Infrastructure

#### AWS Lightsail Server Configuration
**Production Infrastructure:**
- **Server Tier:** $44/month (4 cores, 8GB RAM, 320GB SSD)
- **Operating System:** Ubuntu 24.04 LTS
- **Docker Support:** Containerized application deployment
- **Load Balancer:** Automatic traffic distribution
- **Monitoring:** CloudWatch integration for system metrics

#### Sentra UP (SUP) Deployment System
**Meteor UP Inspired Deployment:**
- **Bundle Creation:** Automated application bundling and optimization
- **Zero-Downtime Deployment:** Rolling updates with health checks
- **Rollback System:** Instant rollback to previous versions
- **Environment Management:** Development, staging, production environments
- **Hook System:** Pre/post deployment scripts and validation

```javascript
// sup.json configuration
{
  "servers": {
    "production": {
      "host": "sentra.cx",
      "username": "root",
      "pem": "~/.ssh/sentra-key.pem"
    }
  },
  "app": {
    "name": "sentra",
    "path": ".",
    "servers": {
      "production": {}
    },
    "buildOptions": {
      "serverOnly": true
    },
    "env": {
      "ROOT_URL": "https://sentra.cx",
      "NODE_ENV": "production"
    },
    "docker": {
      "image": "zodern/meteor:latest"
    }
  },
  "hooks": {
    "pre-deploy": "./hooks/pre-deploy.sh"
  }
}
```

#### Domain and SSL Management
**Cloudflare Integration:**
- **Domain:** sentra.cx with Cloudflare DNS management
- **SSL:** Flexible/Full SSL with automatic certificate renewal
- **CDN:** Global content distribution network
- **Security:** DDoS protection and Web Application Firewall
- **Analytics:** Traffic and performance monitoring

### G. Monitoring and Observability

#### LangSmith Integration
**Production AI Observability:**
- **Native Tracing:** Full visibility into LLM interactions
- **Cost Monitoring:** Token usage and billing optimization
- **Performance Analytics:** Latency and throughput metrics
- **Quality Evaluation:** LLM-as-Judge automatic assessment
- **Dataset Management:** Production trace collection and analysis

#### Custom Dashboard System
**Real-time Monitoring:**
- **Agent Activity:** Live agent status and task execution
- **System Metrics:** Performance, resource utilization, error rates
- **Learning Progress:** Agent improvement and knowledge acquisition
- **Quality Assurance:** Code quality metrics and validation status

### H. Security and Compliance

#### Container Security
**Sandboxed Execution:**
- **Docker Isolation:** Each agent runs in isolated containers
- **Resource Limits:** CPU and memory constraints per agent
- **Network Segmentation:** Isolated agent communication channels
- **Security Scanning:** Automated vulnerability assessment

#### Authentication and Authorization
**Multi-layer Security:**
- **JWT Tokens:** Stateless authentication with refresh tokens
- **Role-based Access:** Fine-grained permission system
- **API Rate Limiting:** Protection against abuse and DoS attacks
- **Audit Logging:** Complete activity tracking and compliance

## Performance and Scalability Requirements

### A. Response Time Targets
- **Dashboard Updates:** Sub-second real-time updates
- **Agent Spawning:** Under 2 seconds for new agent creation
- **Context Handoff:** Zero information loss with minimal latency
- **Voice Response:** Under 2 seconds for ElevenLabs integration
- **Mobile PWA:** 3G network compatibility with offline support

### B. Concurrent Project Handling
- **Capacity:** 20+ concurrent projects without degradation
- **Resource Isolation:** Per-project resource allocation
- **Load Balancing:** Intelligent workload distribution
- **Scaling Strategy:** Horizontal scaling with multi-server deployment

### C. Quality Assurance Metrics
- **Zero Broken Code:** Absolute requirement for completion
- **Build Success Rate:** 100% successful compilation and deployment
- **Context Preservation:** 100% accuracy in agent handoffs
- **Learning Progression:** Measurable improvement over time

## Integration Requirements

### A. Claude Code MCP Compatibility
**Model Context Protocol Standards:**
- Full compatibility with Claude Code tools and interfaces
- Native file operation support through MCP
- Seamless context preservation across agent boundaries
- Tool execution security and sandboxing

### B. Third-party Service Integration
**External Dependencies:**
- **ElevenLabs API:** Voice synthesis for agent communication
- **GitHub API:** Repository management and code hosting
- **Cloudflare API:** DNS and SSL certificate management
- **AWS Services:** Infrastructure monitoring and scaling

---

**Related Documents:**
- **[01-ORCHESTRATOR-AGENT.md](01-ORCHESTRATOR-AGENT.md)** - Master coordination using these technologies
- **[03-OBSERVABILITY-DASHBOARD.md](03-OBSERVABILITY-DASHBOARD.md)** - Dashboard implementation with this stack
- **[05-AGENT-ROLES.md](05-AGENT-ROLES.md)** - Agent specializations for different technologies
- **[09-DEPLOYMENT-SYSTEM.md](09-DEPLOYMENT-SYSTEM.md)** - SUP deployment implementation

**Next Document:** **[09-DEPLOYMENT-SYSTEM.md](09-DEPLOYMENT-SYSTEM.md)** - Sentra UP (SUP) Deployment