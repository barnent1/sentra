# SENTRA API Specifications & Service Architecture
## Strategic Engineering Neural Technology for Rapid Automation

**Version**: 1.0  
**Date**: 2024-08-24  
**Document Type**: API Specifications & Service Architecture  
**Architect**: System Architect Agent

---

## Executive Summary

This document defines the complete API specifications and service architecture for SENTRA's AI Code Engineering Platform. The architecture implements RESTful APIs with real-time WebSocket capabilities, supporting multi-agent orchestration, context preservation, quality enforcement, timeline intelligence, and professional project management.

**API Architecture Principles:**
- RESTful design with resource-based URLs
- JSON API specification compliance
- Real-time capabilities via WebSocket connections
- GraphQL endpoint for complex queries
- OpenAPI 3.0 specification for all endpoints
- OAuth 2.0 + JWT authentication
- Rate limiting and security enforcement
- Comprehensive error handling and validation

---

## Service Architecture Overview

### 1. Microservices Architecture

```
SENTRA Service Architecture
├── API Gateway Service (Port 3000)
│   ├── Authentication & Authorization
│   ├── Rate Limiting & Throttling
│   ├── Request Routing & Load Balancing
│   ├── API Documentation & Swagger UI
│   └── Centralized Logging & Monitoring
├── User Management Service (Port 3001)
│   ├── User Registration & Authentication
│   ├── Profile Management & Preferences
│   ├── Session & Token Management
│   └── Two-Factor Authentication
├── Project Management Service (Port 3002)
│   ├── Project CRUD Operations
│   ├── Team & Member Management
│   ├── Project Settings & Configuration
│   └── Project Analytics & Reporting
├── Agent Orchestration Service (Port 3003)
│   ├── Agent Lifecycle Management
│   ├── Task Distribution & Assignment
│   ├── Agent Communication & Coordination
│   └── Resource Lock Management
├── Context Preservation Service (Port 3004)
│   ├── Context Storage & Retrieval
│   ├── Context Rotation & Archival
│   ├── Semantic Search & Indexing
│   └── Context Analytics & Optimization
├── Quality Guardian Service (Port 3005)
│   ├── Code Review & Quality Gates
│   ├── Standards Enforcement
│   ├── Quality Metrics & Analytics
│   └── Issue Tracking & Resolution
├── Timeline Intelligence Service (Port 3006)
│   ├── Estimation & Prediction
│   ├── Learning & Pattern Recognition
│   ├── Timeline Analytics & Reporting
│   └── Risk Assessment & Mitigation
├── Communication Service (Port 3007)
│   ├── Client Communication Management
│   ├── Notification System
│   ├── TTS Integration
│   └── Email & SMS Services
├── Integration Service (Port 3008)
│   ├── Claude Code Integration
│   ├── GitHub API Integration
│   ├── Vercel Deployment Integration
│   └── External Service Connectors
└── Analytics & Monitoring Service (Port 3009)
    ├── Performance Monitoring
    ├── Usage Analytics
    ├── Business Intelligence
    └── Health Check Aggregation
```

### 2. API Gateway Configuration

```yaml
# API Gateway Routes and Middleware Configuration
api_gateway:
  version: "1.0"
  base_url: "https://api.sentra.dev"
  
  middleware:
    - cors:
        origins: ["https://sentra.dev", "https://app.sentra.dev"]
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
        headers: ["Authorization", "Content-Type", "X-Request-ID"]
    
    - authentication:
        jwt_secret: "${JWT_SECRET}"
        token_expiry: "12h"
        refresh_expiry: "7d"
        
    - rate_limiting:
        default: "1000/hour"
        authenticated: "5000/hour" 
        premium: "10000/hour"
        
    - request_validation:
        enable_swagger: true
        validate_responses: true
        
    - logging:
        level: "info"
        include_request_body: false
        include_response_body: false

  routes:
    # User Management
    - path: "/api/v1/auth/*"
      service: "user-management"
      timeout: "30s"
      retry_attempts: 3
      
    - path: "/api/v1/users/*" 
      service: "user-management"
      auth_required: true
      
    # Project Management
    - path: "/api/v1/projects/*"
      service: "project-management"
      auth_required: true
      permissions: ["read:projects"]
      
    # Agent Operations
    - path: "/api/v1/agents/*"
      service: "agent-orchestration"
      auth_required: true
      permissions: ["read:agents"]
      
    # Real-time WebSocket
    - path: "/ws/*"
      service: "websocket-gateway"
      upgrade: true
      auth_required: true
```

---

## Authentication & Authorization API

### 1. Authentication Endpoints

```typescript
// Authentication API Interface
interface AuthAPI {
  // User registration
  POST /api/v1/auth/register: {
    request: RegisterRequest;
    response: RegisterResponse;
    errors: AuthError[];
  };
  
  // User login
  POST /api/v1/auth/login: {
    request: LoginRequest;
    response: LoginResponse;
    errors: AuthError[];
  };
  
  // Two-factor authentication
  POST /api/v1/auth/2fa/verify: {
    request: TwoFactorRequest;
    response: TwoFactorResponse;
    errors: AuthError[];
  };
  
  // Token refresh
  POST /api/v1/auth/refresh: {
    request: RefreshRequest;
    response: TokenResponse;
    errors: AuthError[];
  };
  
  // Logout
  POST /api/v1/auth/logout: {
    request: LogoutRequest;
    response: SuccessResponse;
    errors: AuthError[];
  };
}

// Request/Response Types
interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isVerified: boolean;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  twoFactorRequired: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    deviceType: 'web' | 'mobile' | 'desktop';
    deviceName?: string;
    userAgent?: string;
  };
}

interface LoginResponse {
  user: UserProfile;
  tokens: TokenPair;
  session: SessionInfo;
  twoFactorRequired?: boolean;
  twoFactorQRCode?: string;
}

interface TwoFactorRequest {
  token: string;
  sessionId: string;
  remember?: boolean;
}

// Authentication Implementation
class AuthController {
  async register(req: RegisterRequest): Promise<RegisterResponse> {
    // Validate input
    await this.validateRegistrationInput(req);
    
    // Check if user exists
    const existingUser = await this.userService.findByEmail(req.email);
    if (existingUser) {
      throw new AuthError('USER_EXISTS', 'User already exists');
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(req.password, saltRounds);
    
    // Create user
    const user = await this.userService.create({
      ...req,
      passwordHash,
      isVerified: false
    });
    
    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(user.id);
    
    // Send verification email
    await this.emailService.sendVerificationEmail(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
      twoFactorRequired: false
    };
  }
  
  async login(req: LoginRequest): Promise<LoginResponse> {
    // Find user
    const user = await this.userService.findByEmail(req.email);
    if (!user || !user.isActive) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(req.password, user.passwordHash);
    if (!isValidPassword) {
      await this.handleFailedLogin(user.id);
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid credentials');
    }
    
    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      const sessionId = await this.createPendingSession(user.id, req.deviceInfo);
      return {
        user: null,
        tokens: null,
        session: null,
        twoFactorRequired: true,
        sessionId
      };
    }
    
    // Create session
    const session = await this.sessionService.create(user.id, req.deviceInfo);
    const tokens = await this.tokenService.generateTokenPair(user.id, session.id);
    
    // Update last login
    await this.userService.updateLastLogin(user.id);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
      session: {
        id: session.id,
        deviceType: session.deviceType,
        expiresAt: session.expiresAt
      }
    };
  }
  
  async verifyTwoFactor(req: TwoFactorRequest): Promise<LoginResponse> {
    // Verify pending session
    const pendingSession = await this.sessionService.findPending(req.sessionId);
    if (!pendingSession) {
      throw new AuthError('INVALID_SESSION', 'Invalid or expired session');
    }
    
    // Verify TOTP token
    const user = await this.userService.findById(pendingSession.userId);
    const isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: req.token,
      window: 2
    });
    
    if (!isValidToken) {
      throw new AuthError('INVALID_2FA_TOKEN', 'Invalid 2FA token');
    }
    
    // Create authenticated session
    const session = await this.sessionService.createFromPending(
      req.sessionId,
      req.remember
    );
    const tokens = await this.tokenService.generateTokenPair(user.id, session.id);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
      session: {
        id: session.id,
        deviceType: session.deviceType,
        expiresAt: session.expiresAt
      }
    };
  }
}
```

### 2. Authorization & Permissions

```typescript
// Permission-based Access Control
interface PermissionSystem {
  roles: {
    admin: Permission[];
    project_owner: Permission[];
    project_member: Permission[];
    viewer: Permission[];
  };
  
  scopes: {
    'read:projects': 'View project information';
    'write:projects': 'Create and modify projects';
    'delete:projects': 'Delete projects';
    'read:agents': 'View agent status and performance';
    'write:agents': 'Control agent operations';
    'admin:system': 'System administration';
    'admin:users': 'User management';
  };
}

// Middleware for permission checking
class AuthorizationMiddleware {
  static requirePermissions(permissions: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userPermissions = req.user.permissions || [];
        const hasPermissions = permissions.every(
          permission => userPermissions.includes(permission)
        );
        
        if (!hasPermissions) {
          throw new ForbiddenError('Insufficient permissions');
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  static requireProjectAccess(projectId?: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const targetProjectId = projectId || req.params.projectId;
        const hasAccess = await this.projectService.hasUserAccess(
          req.user.id,
          targetProjectId
        );
        
        if (!hasAccess) {
          throw new ForbiddenError('Project access denied');
        }
        
        req.project = await this.projectService.findById(targetProjectId);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// Usage in routes
app.get('/api/v1/projects/:projectId/agents',
  AuthorizationMiddleware.requirePermissions(['read:agents']),
  AuthorizationMiddleware.requireProjectAccess(),
  AgentController.listProjectAgents
);
```

---

## Project Management API

### 1. Project CRUD Operations

```typescript
// Project Management API Interface
interface ProjectAPI {
  // List user projects
  GET /api/v1/projects: {
    query: ProjectListQuery;
    response: ProjectListResponse;
    errors: APIError[];
  };
  
  // Create new project
  POST /api/v1/projects: {
    request: CreateProjectRequest;
    response: ProjectResponse;
    errors: ValidationError[] | APIError[];
  };
  
  // Get project details
  GET /api/v1/projects/:id: {
    response: ProjectDetailResponse;
    errors: NotFoundError | APIError[];
  };
  
  // Update project
  PUT /api/v1/projects/:id: {
    request: UpdateProjectRequest;
    response: ProjectResponse;
    errors: ValidationError[] | NotFoundError | APIError[];
  };
  
  // Delete project
  DELETE /api/v1/projects/:id: {
    response: SuccessResponse;
    errors: NotFoundError | ForbiddenError | APIError[];
  };
}

// Project Data Types
interface Project {
  id: string;
  name: string;
  description?: string;
  slug: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: 1 | 2 | 3 | 4 | 5;
  
  // Technical configuration
  techStack: {
    framework: string;
    version: string;
    database: string;
    deployment: string;
    [key: string]: any;
  };
  
  // Timeline and estimates
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  totalEstimatedHours?: number;
  totalActualHours?: number;
  
  // Client and business
  clientName?: string;
  clientContactEmail?: string;
  projectValue?: number;
  hourlyRate?: number;
  
  // Repository and deployment
  repositoryUrl?: string;
  repositoryBranch: string;
  deploymentUrl?: string;
  stagingUrl?: string;
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
  techStack: Record<string, any>;
  clientName?: string;
  clientContactEmail?: string;
  repositoryUrl?: string;
  tags?: string[];
}

// Project Controller Implementation
class ProjectController {
  async createProject(req: CreateProjectRequest): Promise<ProjectResponse> {
    // Validate input
    await this.validateCreateProjectInput(req);
    
    // Generate unique slug
    const slug = await this.generateUniqueSlug(req.name);
    
    // Create project with defaults
    const projectData = {
      ...req,
      slug,
      status: 'active',
      priority: 3,
      repositoryBranch: 'main',
      tags: req.tags || [],
      customFields: {}
    };
    
    const project = await this.projectService.create(projectData);
    
    // Initialize project settings
    await this.projectSettingsService.createDefaults(project.id);
    
    // Set up initial agents if specified
    if (req.techStack.framework) {
      await this.agentService.recommendAgentsForProject(project.id, req.techStack);
    }
    
    // Create initial project structure
    await this.initializeProjectStructure(project);
    
    return {
      project: this.formatProject(project),
      message: 'Project created successfully'
    };
  }
  
  async listProjects(query: ProjectListQuery): Promise<ProjectListResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      clientName,
      tags,
      sortBy = 'lastActivityAt',
      sortOrder = 'desc'
    } = query;
    
    // Build filter criteria
    const filters = {
      userId: req.user.id,
      ...(status && { status }),
      ...(clientName && { clientName: { contains: clientName } }),
      ...(tags && { tags: { hasAny: tags } })
    };
    
    // Get paginated results
    const result = await this.projectService.list({
      filters,
      pagination: { page, limit },
      sorting: { [sortBy]: sortOrder }
    });
    
    // Include project statistics
    const projectsWithStats = await Promise.all(
      result.projects.map(async (project) => ({
        ...this.formatProject(project),
        stats: await this.getProjectStats(project.id)
      }))
    );
    
    return {
      projects: projectsWithStats,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }
  
  async getProjectDetails(projectId: string): Promise<ProjectDetailResponse> {
    const project = await this.projectService.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    // Get comprehensive project data
    const [
      stats,
      agents,
      recentTasks,
      timelineData,
      qualityMetrics,
      teamMembers
    ] = await Promise.all([
      this.getProjectStats(project.id),
      this.agentService.getProjectAgents(project.id),
      this.taskService.getRecentTasks(project.id, 10),
      this.timelineService.getProjectTimeline(project.id),
      this.qualityService.getProjectMetrics(project.id),
      this.projectMemberService.getTeamMembers(project.id)
    ]);
    
    return {
      project: this.formatProject(project),
      stats,
      agents: agents.map(agent => this.formatAgent(agent)),
      recentTasks: recentTasks.map(task => this.formatTask(task)),
      timeline: timelineData,
      qualityMetrics,
      teamMembers: teamMembers.map(member => this.formatTeamMember(member))
    };
  }
  
  private async getProjectStats(projectId: string) {
    return {
      totalTasks: await this.taskService.countTasks(projectId),
      completedTasks: await this.taskService.countTasksByStatus(projectId, 'completed'),
      inProgressTasks: await this.taskService.countTasksByStatus(projectId, 'in_progress'),
      blockedTasks: await this.taskService.countTasksByStatus(projectId, 'blocked'),
      activeAgents: await this.agentService.countActiveAgents(projectId),
      hoursLogged: await this.timeLogService.getTotalHours(projectId),
      codeQualityScore: await this.qualityService.getAverageScore(projectId),
      deploymentCount: await this.deploymentService.countDeployments(projectId)
    };
  }
}
```

### 2. Project Settings & Configuration

```typescript
// Project Settings API
interface ProjectSettingsAPI {
  GET /api/v1/projects/:id/settings: ProjectSettingsResponse;
  PUT /api/v1/projects/:id/settings: {
    request: UpdateSettingsRequest;
    response: ProjectSettingsResponse;
  };
  
  // Agent configuration
  GET /api/v1/projects/:id/settings/agents: AgentConfigResponse;
  PUT /api/v1/projects/:id/settings/agents: {
    request: UpdateAgentConfigRequest;
    response: AgentConfigResponse;
  };
  
  // Quality standards
  GET /api/v1/projects/:id/settings/quality: QualityStandardsResponse;
  PUT /api/v1/projects/:id/settings/quality: {
    request: UpdateQualityStandardsRequest;
    response: QualityStandardsResponse;
  };
}

interface ProjectSettings {
  // Agent configuration
  maxConcurrentAgents: number;
  agentPreferences: {
    developmentAgent: string;
    qaAgent: string;
    pmAgent: string;
    preferredWorkingStyle: 'collaborative' | 'independent' | 'balanced';
  };
  
  // Context management
  contextRetentionDays: number;
  contextRotationThreshold: number;
  enableSemanticSearch: boolean;
  
  // Quality settings
  qualityGateStrictness: 1 | 2 | 3 | 4 | 5;
  codeReviewRequired: boolean;
  automatedTestingRequired: boolean;
  minimumTestCoverage: number;
  
  // Notification settings
  emailNotifications: boolean;
  ttsNotifications: boolean;
  mobileNotifications: boolean;
  notificationPreferences: {
    taskCompleted: boolean;
    qualityGateResult: boolean;
    timelineChange: boolean;
    clientMessage: boolean;
    systemAlert: boolean;
  };
  
  // Integration settings
  githubIntegration: {
    enabled: boolean;
    repository: string;
    defaultBranch: string;
    autoCreateBranches: boolean;
    autoPullRequests: boolean;
  };
  
  vercelIntegration: {
    enabled: boolean;
    projectId: string;
    autoDeployments: boolean;
    environments: string[];
  };
  
  claudeCodeSettings: {
    enabled: boolean;
    maxContextSize: number;
    preferredModel: string;
    customInstructions: string;
  };
  
  // Backup and security
  backupEnabled: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly';
  encryptionEnabled: boolean;
  accessControlLevel: 'open' | 'restricted' | 'locked';
}

class ProjectSettingsController {
  async getSettings(projectId: string): Promise<ProjectSettingsResponse> {
    const settings = await this.projectSettingsService.findByProjectId(projectId);
    
    if (!settings) {
      // Create default settings
      const defaultSettings = await this.projectSettingsService.createDefaults(projectId);
      return { settings: this.formatSettings(defaultSettings) };
    }
    
    return { settings: this.formatSettings(settings) };
  }
  
  async updateSettings(
    projectId: string,
    updates: UpdateSettingsRequest
  ): Promise<ProjectSettingsResponse> {
    // Validate settings
    await this.validateSettings(updates);
    
    // Update settings
    const settings = await this.projectSettingsService.update(projectId, updates);
    
    // Apply settings to active agents
    if (updates.agentPreferences || updates.maxConcurrentAgents) {
      await this.applyAgentSettings(projectId, settings);
    }
    
    // Update quality standards
    if (updates.qualityGateStrictness || updates.minimumTestCoverage) {
      await this.updateQualityStandards(projectId, settings);
    }
    
    // Configure integrations
    if (updates.githubIntegration) {
      await this.configureGitHubIntegration(projectId, updates.githubIntegration);
    }
    
    if (updates.vercelIntegration) {
      await this.configureVercelIntegration(projectId, updates.vercelIntegration);
    }
    
    return { settings: this.formatSettings(settings) };
  }
  
  private async applyAgentSettings(projectId: string, settings: ProjectSettings) {
    const activeAgents = await this.agentService.getActiveAgents(projectId);
    
    // Update agent configurations
    for (const agent of activeAgents) {
      await this.agentService.updateConfiguration(agent.id, {
        maxConcurrentTasks: Math.floor(settings.maxConcurrentAgents / activeAgents.length),
        workingStyle: settings.agentPreferences.preferredWorkingStyle,
        contextRetention: settings.contextRetentionDays
      });
    }
    
    // Redistribute tasks if necessary
    if (activeAgents.length > settings.maxConcurrentAgents) {
      await this.agentService.redistributeTasks(projectId, settings.maxConcurrentAgents);
    }
  }
}
```

---

## Agent Orchestration API

### 1. Agent Management

```typescript
// Agent Orchestration API Interface
interface AgentAPI {
  // List available agents
  GET /api/v1/agents: {
    query: AgentListQuery;
    response: AgentListResponse;
  };
  
  // Get agent details
  GET /api/v1/agents/:id: {
    response: AgentDetailResponse;
  };
  
  // Create agent instance
  POST /api/v1/projects/:projectId/agents: {
    request: CreateAgentInstanceRequest;
    response: AgentInstanceResponse;
  };
  
  // Update agent configuration
  PUT /api/v1/agents/:id/config: {
    request: UpdateAgentConfigRequest;
    response: AgentConfigResponse;
  };
  
  // Get agent performance
  GET /api/v1/agents/:id/performance: {
    query: PerformanceQuery;
    response: AgentPerformanceResponse;
  };
  
  // Agent communication
  POST /api/v1/agents/:id/communicate: {
    request: AgentCommunicationRequest;
    response: CommunicationResponse;
  };
}

// Agent Data Types
interface Agent {
  id: string;
  name: string;
  type: 'development' | 'qa' | 'pm' | 'analyst' | 'ux' | 'devops' | 'security';
  personaDescription: string;
  
  capabilities: string[];
  specializations: string[];
  techStackPreferences: Record<string, any>;
  
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  performanceScore: number;
  totalTasksCompleted: number;
  averageTaskDuration: number;
  successRate: number;
  
  configuration: {
    maxConcurrentTasks: number;
    qualityThreshold: number;
    contextWindowSize: number;
    responseStyle: 'professional' | 'casual' | 'technical';
  };
  
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

interface AgentInstance {
  id: string;
  agentId: string;
  projectId: string;
  
  // Container information
  containerId: string;
  containerName: string;
  dockerImage: string;
  
  // Resource allocation
  cpuLimit: number;
  memoryLimit: number;
  diskLimit: number;
  
  // Status and health
  status: 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  
  // Performance metrics
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  
  // Task assignment
  currentTaskId?: string;
  tasksCompleted: number;
  
  // Lifecycle
  startedAt?: string;
  stoppedAt?: string;
  lastHeartbeatAt?: string;
  restartCount: number;
}

// Agent Controller Implementation
class AgentController {
  async listAgents(query: AgentListQuery): Promise<AgentListResponse> {
    const {
      type,
      capabilities,
      status = 'available',
      sortBy = 'performanceScore',
      sortOrder = 'desc'
    } = query;
    
    const filters = {
      isActive: true,
      ...(type && { type }),
      ...(status && { status }),
      ...(capabilities && { 
        capabilities: { hasAll: capabilities } 
      })
    };
    
    const agents = await this.agentService.list({
      filters,
      sorting: { [sortBy]: sortOrder }
    });
    
    // Include current assignments and performance
    const enrichedAgents = await Promise.all(
      agents.map(async (agent) => ({
        ...this.formatAgent(agent),
        currentAssignments: await this.getAgentAssignments(agent.id),
        recentPerformance: await this.getRecentPerformance(agent.id)
      }))
    );
    
    return {
      agents: enrichedAgents,
      total: agents.length
    };
  }
  
  async createAgentInstance(
    projectId: string,
    request: CreateAgentInstanceRequest
  ): Promise<AgentInstanceResponse> {
    const { agentId, configuration } = request;
    
    // Validate agent availability
    const agent = await this.agentService.findById(agentId);
    if (!agent || agent.status !== 'available') {
      throw new BadRequestError('Agent not available');
    }
    
    // Check project agent limits
    const projectSettings = await this.projectSettingsService.findByProjectId(projectId);
    const activeInstances = await this.agentInstanceService.countActiveInstances(projectId);
    
    if (activeInstances >= projectSettings.maxConcurrentAgents) {
      throw new BadRequestError('Maximum concurrent agents reached');
    }
    
    // Create container configuration
    const containerConfig = {
      image: `sentra/agent-${agent.type}:latest`,
      environment: {
        AGENT_ID: agentId,
        PROJECT_ID: projectId,
        AGENT_TYPE: agent.type,
        ...configuration.environmentVariables
      },
      resources: {
        cpuLimit: configuration.cpuLimit || 1.0,
        memoryLimit: configuration.memoryLimit || 512,
        diskLimit: configuration.diskLimit || 1024
      }
    };
    
    // Start container
    const container = await this.containerService.createAndStart(containerConfig);
    
    // Create agent instance record
    const instance = await this.agentInstanceService.create({
      agentId,
      projectId,
      containerId: container.id,
      containerName: container.name,
      dockerImage: containerConfig.image,
      ...containerConfig.resources,
      status: 'starting',
      environmentVariables: containerConfig.environment
    });
    
    // Initialize agent context
    await this.contextService.initializeAgentContext(instance.id, projectId);
    
    // Wait for health check
    await this.waitForHealthCheck(instance.id);
    
    return {
      instance: this.formatAgentInstance(instance),
      message: 'Agent instance created successfully'
    };
  }
  
  async communicateWithAgent(
    agentId: string,
    request: AgentCommunicationRequest
  ): Promise<CommunicationResponse> {
    const { message, context, priority = 'normal' } = request;
    
    // Find active agent instance
    const instance = await this.agentInstanceService.findActiveByAgentId(agentId);
    if (!instance) {
      throw new BadRequestError('No active agent instance found');
    }
    
    // Prepare communication payload
    const communicationPayload = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      from: 'orchestrator',
      to: agentId,
      message,
      context,
      priority,
      expectResponse: true,
      timeout: 30000 // 30 seconds
    };
    
    // Send via message queue
    await this.messageQueue.publish(
      `agent.${agentId}.messages`,
      communicationPayload
    );
    
    // Wait for response
    const response = await this.waitForAgentResponse(
      communicationPayload.id,
      communicationPayload.timeout
    );
    
    // Log communication
    await this.logAgentCommunication(agentId, communicationPayload, response);
    
    return {
      messageId: communicationPayload.id,
      response: response.data,
      responseTime: response.responseTime,
      status: 'completed'
    };
  }
  
  private async waitForHealthCheck(instanceId: string): Promise<void> {
    const maxAttempts = 30;
    const interval = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const instance = await this.agentInstanceService.findById(instanceId);
      
      if (instance.healthStatus === 'healthy') {
        await this.agentInstanceService.updateStatus(instanceId, 'running');
        return;
      }
      
      if (instance.status === 'error') {
        throw new Error('Agent instance failed to start');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Agent instance health check timeout');
  }
}
```

### 2. Task Distribution & Assignment

```typescript
// Task Distribution API
interface TaskDistributionAPI {
  // Assign task to agent
  POST /api/v1/tasks/:id/assign: {
    request: AssignTaskRequest;
    response: TaskAssignmentResponse;
  };
  
  // Get task assignments
  GET /api/v1/projects/:projectId/assignments: {
    query: AssignmentQuery;
    response: AssignmentListResponse;
  };
  
  // Update assignment status
  PUT /api/v1/assignments/:id/status: {
    request: UpdateAssignmentStatusRequest;
    response: AssignmentStatusResponse;
  };
  
  // Redistribute tasks
  POST /api/v1/projects/:projectId/redistribute: {
    request: RedistributeTasksRequest;
    response: RedistributionResponse;
  };
}

// Task Assignment Types
interface TaskAssignment {
  id: string;
  taskId: string;
  agentId: string;
  projectId: string;
  
  assignmentType: 'task' | 'review' | 'support';
  priority: 1 | 2 | 3 | 4 | 5;
  status: 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  
  estimatedHours: number;
  actualHours?: number;
  progressPercentage: number;
  qualityScore?: number;
  
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  
  assignmentContext: Record<string, any>;
  specialInstructions?: string;
  dependencies: string[];
  
  assignedBy: string;
  notes?: string;
}

// Task Distribution Service
class TaskDistributionService {
  async assignTask(taskId: string, request: AssignTaskRequest): Promise<TaskAssignmentResponse> {
    const { agentId, priority, dueDate, specialInstructions } = request;
    
    // Validate task and agent
    const [task, agent] = await Promise.all([
      this.taskService.findById(taskId),
      this.agentService.findById(agentId)
    ]);
    
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    
    if (!agent || agent.status !== 'available') {
      throw new BadRequestError('Agent not available');
    }
    
    // Check agent capacity
    const activeAssignments = await this.assignmentService.countActiveAssignments(agentId);
    if (activeAssignments >= agent.configuration.maxConcurrentTasks) {
      throw new BadRequestError('Agent at capacity');
    }
    
    // Check dependencies
    const blockedByDependencies = await this.checkTaskDependencies(taskId);
    if (blockedByDependencies.length > 0) {
      throw new BadRequestError(
        `Task blocked by dependencies: ${blockedByDependencies.join(', ')}`
      );
    }
    
    // Create assignment
    const assignment = await this.assignmentService.create({
      taskId,
      agentId,
      projectId: task.projectId,
      assignmentType: 'task',
      priority: priority || task.priority,
      status: 'assigned',
      estimatedHours: task.estimatedHours,
      dueDate,
      assignmentContext: {
        taskType: task.type,
        complexity: task.complexityScore,
        techStack: task.techStackRequirements
      },
      specialInstructions,
      dependencies: task.dependencies,
      assignedBy: request.assignedBy
    });
    
    // Update task status
    await this.taskService.updateStatus(taskId, 'assigned', agentId);
    
    // Notify agent
    await this.notifyAgentAssignment(agentId, assignment);
    
    // Update agent status
    await this.agentService.updateStatus(agentId, 'busy');
    
    return {
      assignment: this.formatAssignment(assignment),
      message: 'Task assigned successfully'
    };
  }
  
  async getOptimalAgentAssignment(taskId: string): Promise<AgentRecommendation[]> {
    const task = await this.taskService.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    
    // Get available agents with required capabilities
    const availableAgents = await this.agentService.findAvailableAgents({
      capabilities: task.requiredCapabilities,
      techStack: task.techStackRequirements,
      projectId: task.projectId
    });
    
    // Calculate suitability scores
    const recommendations = await Promise.all(
      availableAgents.map(async (agent) => {
        const score = await this.calculateAgentSuitability(agent, task);
        const estimatedDuration = await this.estimateTaskDuration(agent, task);
        
        return {
          agentId: agent.id,
          agent: this.formatAgent(agent),
          suitabilityScore: score.overall,
          scoreBreakdown: score.breakdown,
          estimatedDuration,
          currentWorkload: await this.getAgentWorkload(agent.id),
          availability: await this.getAgentAvailability(agent.id)
        };
      })
    );
    
    // Sort by suitability score
    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }
  
  async redistributeTasks(
    projectId: string,
    request: RedistributeTasksRequest
  ): Promise<RedistributionResponse> {
    const { reason, targetAgentCount, preserveAssignments = [] } = request;
    
    // Get current assignments
    const currentAssignments = await this.assignmentService.findByProject(
      projectId,
      { status: ['assigned', 'in_progress'] }
    );
    
    // Filter assignments to redistribute
    const toRedistribute = currentAssignments.filter(
      assignment => !preserveAssignments.includes(assignment.id)
    );
    
    // Get available agents
    const availableAgents = await this.agentService.findAvailableAgents({
      projectId,
      limit: targetAgentCount
    });
    
    if (availableAgents.length < targetAgentCount) {
      throw new BadRequestError(
        `Only ${availableAgents.length} agents available, requested ${targetAgentCount}`
      );
    }
    
    // Calculate optimal redistribution
    const redistribution = await this.calculateOptimalDistribution(
      toRedistribute,
      availableAgents.slice(0, targetAgentCount)
    );
    
    // Execute redistribution
    const redistributionResults = await Promise.all(
      redistribution.map(async (item) => {
        try {
          // Unassign from current agent
          if (item.currentAssignment) {
            await this.unassignTask(item.currentAssignment.id, 'redistribution');
          }
          
          // Assign to new agent
          const newAssignment = await this.assignTask(item.taskId, {
            agentId: item.newAgentId,
            priority: item.priority,
            specialInstructions: `Redistributed: ${reason}`
          });
          
          return {
            taskId: item.taskId,
            previousAgent: item.currentAssignment?.agentId,
            newAgent: item.newAgentId,
            status: 'success',
            assignment: newAssignment.assignment
          };
        } catch (error) {
          return {
            taskId: item.taskId,
            status: 'failed',
            error: error.message
          };
        }
      })
    );
    
    return {
      redistributionId: uuid(),
      totalTasks: toRedistribute.length,
      successCount: redistributionResults.filter(r => r.status === 'success').length,
      failedCount: redistributionResults.filter(r => r.status === 'failed').length,
      results: redistributionResults
    };
  }
  
  private async calculateAgentSuitability(agent: Agent, task: Task): Promise<SuitabilityScore> {
    const scores = {
      capabilityMatch: this.calculateCapabilityMatch(agent.capabilities, task.requiredCapabilities),
      experienceLevel: this.calculateExperienceScore(agent, task),
      workloadBalance: await this.calculateWorkloadScore(agent.id),
      performanceHistory: agent.performanceScore,
      techStackFamiliarity: this.calculateTechStackMatch(
        agent.techStackPreferences,
        task.techStackRequirements
      )
    };
    
    // Weighted calculation
    const weights = {
      capabilityMatch: 0.3,
      experienceLevel: 0.2,
      workloadBalance: 0.2,
      performanceHistory: 0.2,
      techStackFamiliarity: 0.1
    };
    
    const overall = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + (score * weights[key]),
      0
    );
    
    return {
      overall: Math.round(overall * 100) / 100,
      breakdown: scores
    };
  }
}
```

---

## Context Preservation API

### 1. Context Management

```typescript
// Context Preservation API Interface
interface ContextAPI {
  // Store context
  POST /api/v1/contexts: {
    request: StoreContextRequest;
    response: ContextResponse;
  };
  
  // Retrieve context
  GET /api/v1/contexts/:id: {
    response: ContextDetailResponse;
  };
  
  // Search contexts
  GET /api/v1/contexts/search: {
    query: ContextSearchQuery;
    response: ContextSearchResponse;
  };
  
  // Agent context operations
  GET /api/v1/agents/:agentId/context: {
    query: AgentContextQuery;
    response: AgentContextResponse;
  };
  
  POST /api/v1/agents/:agentId/context/rotate: {
    request: ContextRotationRequest;
    response: ContextRotationResponse;
  };
  
  // Project context
  GET /api/v1/projects/:projectId/contexts: {
    query: ProjectContextQuery;
    response: ProjectContextResponse;
  };
}

// Context Data Types
interface Context {
  id: string;
  projectId: string;
  agentId?: string;
  taskId?: string;
  
  contextType: 'hot' | 'warm' | 'cold';
  contextCategory: 'general' | 'technical' | 'business' | 'decision' | 'error' | 'learning';
  
  content: Record<string, any>;
  rawContent: string;
  processedContent: string;
  
  tokenCount: number;
  importanceScore: number;
  relevanceKeywords: string[];
  semanticTags: string[];
  
  parentContextId?: string;
  relatedContexts: string[];
  conversationId?: string;
  sequenceNumber: number;
  
  accessFrequency: number;
  lastAccessedAt: string;
  expiresAt?: string;
  retentionPriority: number;
  
  checksum: string;
  isCompressed: boolean;
  validationStatus: 'pending' | 'valid' | 'corrupted';
  
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  
  metadata: Record<string, any>;
}

// Context Service Implementation
class ContextService {
  async storeContext(request: StoreContextRequest): Promise<ContextResponse> {
    const {
      projectId,
      agentId,
      taskId,
      contextType,
      contextCategory,
      content,
      conversationId,
      importanceScore = 0.5
    } = request;
    
    // Process and analyze content
    const processedContent = await this.processContent(content);
    const tokenCount = this.calculateTokenCount(processedContent);
    const keywords = await this.extractKeywords(processedContent);
    const semanticTags = await this.generateSemanticTags(processedContent);
    
    // Generate checksum for integrity
    const checksum = this.generateChecksum(processedContent);
    
    // Compress if large
    const shouldCompress = tokenCount > 10000;
    const finalContent = shouldCompress 
      ? await this.compressContent(processedContent)
      : processedContent;
    
    // Determine sequence number
    const sequenceNumber = conversationId 
      ? await this.getNextSequenceNumber(conversationId)
      : 1;
    
    // Calculate expiration
    const expiresAt = this.calculateExpiration(contextType, importanceScore);
    
    // Create context record
    const context = await this.contextRepository.create({
      projectId,
      agentId,
      taskId,
      contextType,
      contextCategory,
      content: finalContent,
      rawContent: typeof content === 'string' ? content : JSON.stringify(content),
      processedContent: processedContent,
      tokenCount,
      importanceScore,
      relevanceKeywords: keywords,
      semanticTags,
      conversationId,
      sequenceNumber,
      expiresAt,
      retentionPriority: this.calculateRetentionPriority(contextType, importanceScore),
      checksum,
      isCompressed: shouldCompress,
      validationStatus: 'valid'
    });
    
    // Update search index
    await this.updateSearchIndex(context);
    
    // Generate embeddings for semantic search
    if (this.embeddingService.isEnabled()) {
      await this.generateEmbeddings(context.id, processedContent);
    }
    
    // Update context analytics
    await this.updateContextAnalytics(context);
    
    return {
      context: this.formatContext(context),
      message: 'Context stored successfully'
    };
  }
  
  async searchContexts(query: ContextSearchQuery): Promise<ContextSearchResponse> {
    const {
      q,
      projectId,
      agentId,
      contextType,
      contextCategory,
      minImportanceScore,
      limit = 20,
      semanticSearch = false
    } = query;
    
    let results;
    
    if (semanticSearch && this.embeddingService.isEnabled()) {
      // Semantic search using embeddings
      results = await this.performSemanticSearch(q, {
        projectId,
        agentId,
        contextType,
        contextCategory,
        minImportanceScore,
        limit
      });
    } else {
      // Traditional text search
      results = await this.performTextSearch(q, {
        projectId,
        agentId,
        contextType,
        contextCategory,
        minImportanceScore,
        limit
      });
    }
    
    // Enhance results with relevance scoring
    const enhancedResults = await Promise.all(
      results.map(async (result) => ({
        ...result,
        relevanceScore: await this.calculateRelevanceScore(result, q),
        snippet: this.extractSnippet(result.processedContent, q),
        relatedContexts: await this.findRelatedContexts(result.id, 3)
      }))
    );
    
    // Sort by relevance
    const sortedResults = enhancedResults.sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );
    
    // Update access analytics
    await this.recordSearchAccess(query, sortedResults);
    
    return {
      results: sortedResults,
      total: results.length,
      query: q,
      searchType: semanticSearch ? 'semantic' : 'text'
    };
  }
  
  async rotateAgentContext(
    agentId: string,
    request: ContextRotationRequest
  ): Promise<ContextRotationResponse> {
    const { reason = 'capacity', preserveImportant = true } = request;
    
    // Get current agent contexts
    const currentContexts = await this.contextRepository.findByAgent(agentId, {
      contextType: ['hot', 'warm'],
      orderBy: 'lastAccessedAt',
      order: 'desc'
    });
    
    // Analyze context usage and importance
    const contextAnalysis = await Promise.all(
      currentContexts.map(async (context) => ({
        context,
        usageScore: await this.calculateContextUsageScore(context),
        importanceScore: context.importanceScore,
        lastAccessed: new Date(context.lastAccessedAt).getTime(),
        tokenCount: context.tokenCount
      }))
    );
    
    // Determine what to preserve, archive, or delete
    let toPreserve = [];
    let toArchive = [];
    let toDelete = [];
    
    if (preserveImportant) {
      // Keep high-importance and recently accessed contexts
      toPreserve = contextAnalysis.filter(
        item => item.importanceScore > 0.7 || item.usageScore > 0.8
      );
    }
    
    // Archive medium importance contexts
    toArchive = contextAnalysis.filter(
      item => !toPreserve.includes(item) && 
              (item.importanceScore > 0.3 || item.usageScore > 0.4)
    );
    
    // Delete low importance contexts
    toDelete = contextAnalysis.filter(
      item => !toPreserve.includes(item) && !toArchive.includes(item)
    );
    
    // Execute rotation
    const rotationResults = {
      preserved: toPreserve.length,
      archived: 0,
      deleted: 0,
      errors: []
    };
    
    try {
      // Archive contexts
      for (const item of toArchive) {
        await this.archiveContext(item.context.id);
        rotationResults.archived++;
      }
      
      // Delete contexts
      for (const item of toDelete) {
        await this.deleteContext(item.context.id);
        rotationResults.deleted++;
      }
      
      // Update preserved contexts to optimize for new session
      for (const item of toPreserve) {
        await this.optimizeContextForNewSession(item.context.id);
      }
      
    } catch (error) {
      rotationResults.errors.push(error.message);
    }
    
    // Log rotation event
    await this.logContextRotation(agentId, {
      reason,
      preserveImportant,
      results: rotationResults,
      timestamp: new Date().toISOString()
    });
    
    // Calculate space freed
    const tokensSaved = toArchive.concat(toDelete).reduce(
      (sum, item) => sum + item.tokenCount,
      0
    );
    
    return {
      rotationId: uuid(),
      agentId,
      reason,
      contextsSaved: rotationResults.preserved,
      contextsArchived: rotationResults.archived,
      contextsDeleted: rotationResults.deleted,
      tokensSaved,
      errors: rotationResults.errors,
      timestamp: new Date().toISOString()
    };
  }
  
  private async performSemanticSearch(
    query: string,
    filters: ContextSearchFilters
  ): Promise<Context[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    
    // Perform vector similarity search
    const similarContexts = await this.contextRepository.findSimilar(
      queryEmbedding,
      {
        threshold: 0.7,
        limit: filters.limit,
        filters: {
          projectId: filters.projectId,
          agentId: filters.agentId,
          contextType: filters.contextType,
          contextCategory: filters.contextCategory,
          importanceScore: { gte: filters.minImportanceScore }
        }
      }
    );
    
    return similarContexts;
  }
  
  private async generateEmbeddings(contextId: string, content: string): Promise<void> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      await this.contextRepository.updateEmbedding(contextId, embedding);
    } catch (error) {
      console.error(`Failed to generate embeddings for context ${contextId}:`, error);
      // Non-critical error, continue without embeddings
    }
  }
  
  private calculateExpiration(contextType: string, importanceScore: number): Date {
    const baseExpiry = {
      hot: 24 * 60 * 60 * 1000,    // 24 hours
      warm: 7 * 24 * 60 * 60 * 1000,  // 7 days
      cold: 30 * 24 * 60 * 60 * 1000  // 30 days
    };
    
    // Extend based on importance
    const importanceMultiplier = 1 + (importanceScore * 2);
    const expiryTime = baseExpiry[contextType] * importanceMultiplier;
    
    return new Date(Date.now() + expiryTime);
  }
}
```

---

## Quality Management API

### 1. Quality Reviews & Standards

```typescript
// Quality Management API Interface
interface QualityAPI {
  // Quality reviews
  POST /api/v1/tasks/:taskId/reviews: {
    request: CreateQualityReviewRequest;
    response: QualityReviewResponse;
  };
  
  GET /api/v1/reviews/:id: {
    response: QualityReviewDetailResponse;
  };
  
  PUT /api/v1/reviews/:id/decision: {
    request: ReviewDecisionRequest;
    response: ReviewDecisionResponse;
  };
  
  // Quality standards
  GET /api/v1/projects/:projectId/standards: {
    response: QualityStandardsResponse;
  };
  
  PUT /api/v1/projects/:projectId/standards: {
    request: UpdateQualityStandardsRequest;
    response: QualityStandardsResponse;
  };
  
  // Quality metrics
  GET /api/v1/projects/:projectId/quality/metrics: {
    query: QualityMetricsQuery;
    response: QualityMetricsResponse;
  };
  
  // Issue management
  GET /api/v1/projects/:projectId/issues: {
    query: QualityIssuesQuery;
    response: QualityIssuesResponse;
  };
  
  PUT /api/v1/issues/:id/resolve: {
    request: ResolveIssueRequest;
    response: IssueResolutionResponse;
  };
}

// Quality Review Types
interface QualityReview {
  id: string;
  taskId: string;
  projectId: string;
  reviewerAgentId: string;
  
  reviewType: 'code_review' | 'security_audit' | 'performance_review' | 'standards_compliance' | 'architecture_review';
  reviewRound: number;
  
  codeDiff?: string;
  filesReviewed: string[];
  reviewChecklist: Record<string, boolean>;
  
  overallScore: number;
  qualityMetrics: {
    codeQuality: number;
    security: number;
    performance: number;
    maintainability: number;
    testCoverage: number;
  };
  
  status: 'in_progress' | 'completed' | 'approved' | 'rejected' | 'needs_changes';
  decision?: 'approve' | 'reject' | 'approve_with_changes' | 'needs_revision';
  
  summary: string;
  detailedFeedback: string;
  recommendations: string;
  
  startedAt: string;
  completedAt?: string;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  
  reviewConfiguration: Record<string, any>;
  automatedChecks: Record<string, any>;
}

interface QualityIssue {
  id: string;
  qualityReviewId: string;
  
  issueType: 'syntax_error' | 'type_violation' | 'security_vulnerability' | 'performance_issue' | 
            'standards_violation' | 'logic_error' | 'test_coverage' | 'documentation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  
  title: string;
  description: string;
  recommendation: string;
  
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  functionName?: string;
  codeSnippet?: string;
  
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  
  businessImpact: 'critical' | 'high' | 'medium' | 'low' | 'none';
  technicalDebtScore: number;
  effortToFix: number;
  
  relatedIssues: string[];
  externalReferences: Record<string, any>;
  
  automatedDetection: boolean;
  detectionTool?: string;
  confidenceScore: number;
}

// Quality Controller Implementation
class QualityController {
  async createQualityReview(
    taskId: string,
    request: CreateQualityReviewRequest
  ): Promise<QualityReviewResponse> {
    const { reviewType, reviewerAgentId, codeDiff, filesReviewed } = request;
    
    // Validate task and reviewer
    const [task, reviewer] = await Promise.all([
      this.taskService.findById(taskId),
      this.agentService.findById(reviewerAgentId)
    ]);
    
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    
    if (!reviewer || !reviewer.capabilities.includes('code_review')) {
      throw new BadRequestError('Invalid reviewer agent');
    }
    
    // Get project quality standards
    const standards = await this.qualityStandardsService.findByProject(task.projectId);
    
    // Create review configuration
    const reviewConfiguration = this.buildReviewConfiguration(reviewType, standards);
    
    // Create quality review
    const review = await this.qualityReviewService.create({
      taskId,
      projectId: task.projectId,
      reviewerAgentId,
      reviewType,
      reviewRound: await this.getNextReviewRound(taskId),
      codeDiff,
      filesReviewed,
      status: 'in_progress',
      reviewConfiguration,
      estimatedDurationMinutes: this.estimateReviewDuration(reviewType, filesReviewed.length)
    });
    
    // Start automated checks
    const automatedResults = await this.runAutomatedChecks(
      task.projectId,
      codeDiff,
      filesReviewed,
      reviewConfiguration
    );
    
    // Update review with automated results
    await this.qualityReviewService.updateAutomatedChecks(
      review.id,
      automatedResults
    );
    
    // Notify reviewer agent
    await this.notifyReviewerAgent(reviewerAgentId, review, automatedResults);
    
    return {
      review: this.formatQualityReview(review),
      automatedChecks: automatedResults,
      message: 'Quality review created successfully'
    };
  }
  
  async submitReviewDecision(
    reviewId: string,
    request: ReviewDecisionRequest
  ): Promise<ReviewDecisionResponse> {
    const {
      decision,
      overallScore,
      qualityMetrics,
      summary,
      detailedFeedback,
      recommendations,
      issues
    } = request;
    
    // Validate review
    const review = await this.qualityReviewService.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    
    if (review.status !== 'in_progress') {
      throw new BadRequestError('Review is not in progress');
    }
    
    // Validate decision and scores
    await this.validateReviewDecision(decision, overallScore, qualityMetrics);
    
    // Update review
    const updatedReview = await this.qualityReviewService.update(reviewId, {
      decision,
      overallScore,
      qualityMetrics,
      summary,
      detailedFeedback,
      recommendations,
      status: this.getReviewStatus(decision),
      completedAt: new Date().toISOString(),
      actualDurationMinutes: this.calculateReviewDuration(review.startedAt)
    });
    
    // Create quality issues
    const createdIssues = await Promise.all(
      issues.map(issue => this.qualityIssueService.create({
        ...issue,
        qualityReviewId: reviewId
      }))
    );
    
    // Update task based on decision
    await this.updateTaskFromReview(review.taskId, decision, overallScore);
    
    // Update quality metrics
    await this.updateQualityMetrics(review.projectId, qualityMetrics);
    
    // Notify stakeholders
    await this.notifyReviewCompletion(updatedReview, createdIssues);
    
    return {
      review: this.formatQualityReview(updatedReview),
      issues: createdIssues.map(issue => this.formatQualityIssue(issue)),
      nextSteps: this.determineNextSteps(decision, createdIssues),
      message: 'Review decision submitted successfully'
    };
  }
  
  async getQualityMetrics(
    projectId: string,
    query: QualityMetricsQuery
  ): Promise<QualityMetricsResponse> {
    const { 
      startDate,
      endDate,
      aggregation = 'daily',
      metrics = ['overall', 'security', 'performance', 'maintainability']
    } = query;
    
    // Get quality metrics for the time period
    const rawMetrics = await this.qualityMetricsService.findByProject(projectId, {
      startDate,
      endDate,
      aggregation
    });
    
    // Calculate aggregated metrics
    const aggregatedMetrics = this.aggregateQualityMetrics(rawMetrics, aggregation);
    
    // Get quality trends
    const trends = await this.calculateQualityTrends(projectId, startDate, endDate);
    
    // Get top issues
    const topIssues = await this.qualityIssueService.findTopIssues(projectId, {
      startDate,
      endDate,
      limit: 10
    });
    
    // Calculate quality score distribution
    const scoreDistribution = this.calculateScoreDistribution(rawMetrics);
    
    // Get agent performance comparison
    const agentPerformance = await this.getAgentQualityComparison(projectId, {
      startDate,
      endDate
    });
    
    return {
      projectId,
      period: { startDate, endDate },
      metrics: aggregatedMetrics,
      trends,
      topIssues: topIssues.map(issue => this.formatQualityIssue(issue)),
      scoreDistribution,
      agentPerformance,
      summary: {
        totalReviews: rawMetrics.length,
        averageScore: this.calculateAverageScore(rawMetrics),
        passRate: this.calculatePassRate(rawMetrics),
        issueCount: await this.qualityIssueService.countByProject(projectId, { 
          startDate, 
          endDate 
        })
      }
    };
  }
  
  private async runAutomatedChecks(
    projectId: string,
    codeDiff: string,
    filesReviewed: string[],
    configuration: any
  ): Promise<Record<string, any>> {
    const checks = {};
    
    // TypeScript compilation check
    if (configuration.checkTypeScript) {
      checks.typescript = await this.typeScriptChecker.check(filesReviewed);
    }
    
    // ESLint/TSLint checks
    if (configuration.checkLinting) {
      checks.linting = await this.lintChecker.check(filesReviewed);
    }
    
    // Security vulnerability scan
    if (configuration.checkSecurity) {
      checks.security = await this.securityChecker.scan(codeDiff, filesReviewed);
    }
    
    // Performance analysis
    if (configuration.checkPerformance) {
      checks.performance = await this.performanceChecker.analyze(filesReviewed);
    }
    
    // Test coverage analysis
    if (configuration.checkTestCoverage) {
      checks.testCoverage = await this.testCoverageChecker.analyze(
        projectId,
        filesReviewed
      );
    }
    
    // Code complexity analysis
    if (configuration.checkComplexity) {
      checks.complexity = await this.complexityChecker.analyze(filesReviewed);
    }
    
    return checks;
  }
  
  private buildReviewConfiguration(reviewType: string, standards: any): any {
    const baseConfig = {
      checkTypeScript: true,
      checkLinting: true,
      checkSecurity: true,
      checkPerformance: false,
      checkTestCoverage: true,
      checkComplexity: true
    };
    
    // Customize based on review type
    switch (reviewType) {
      case 'security_audit':
        return {
          ...baseConfig,
          checkSecurity: true,
          securityLevel: 'strict',
          vulnerabilityThreshold: 'medium'
        };
        
      case 'performance_review':
        return {
          ...baseConfig,
          checkPerformance: true,
          performanceThresholds: standards.performanceThresholds
        };
        
      case 'standards_compliance':
        return {
          ...baseConfig,
          strictMode: true,
          enforceAllRules: true,
          codeStyleRules: standards.codeStyleRules
        };
        
      default:
        return baseConfig;
    }
  }
}
```

---

## Real-time Communication API

### 1. WebSocket API

```typescript
// WebSocket Event Types and Handlers
interface WebSocketAPI {
  // Connection events
  'connection': (socket: WebSocket, request: IncomingMessage) => void;
  'disconnect': (socket: WebSocket, reason: string) => void;
  'error': (socket: WebSocket, error: Error) => void;
  
  // Authentication events
  'authenticate': (token: string) => AuthResult;
  'subscribe': (channels: string[]) => SubscriptionResult;
  'unsubscribe': (channels: string[]) => void;
  
  // Project events
  'project:join': (projectId: string) => void;
  'project:leave': (projectId: string) => void;
  'project:update': (projectId: string, update: ProjectUpdate) => void;
  
  // Agent events
  'agent:status': (agentId: string, status: AgentStatus) => void;
  'agent:message': (agentId: string, message: AgentMessage) => void;
  'agent:request': (agentId: string, request: AgentRequest) => void;
  
  // Task events
  'task:update': (taskId: string, update: TaskUpdate) => void;
  'task:assigned': (assignment: TaskAssignment) => void;
  'task:completed': (taskId: string, result: TaskResult) => void;
  
  // Quality events
  'quality:review': (reviewId: string, review: QualityReview) => void;
  'quality:issue': (issueId: string, issue: QualityIssue) => void;
  
  // Timeline events
  'timeline:update': (projectId: string, timeline: TimelineUpdate) => void;
  'timeline:milestone': (projectId: string, milestone: Milestone) => void;
  
  // Notification events
  'notification': (notification: Notification) => void;
  'tts:speak': (message: TTSMessage) => void;
}

// WebSocket Message Types
interface WebSocketMessage {
  id: string;
  type: string;
  channel?: string;
  data: any;
  timestamp: string;
  userId?: string;
  agentId?: string;
}

interface ProjectUpdate {
  projectId: string;
  updateType: 'status' | 'progress' | 'timeline' | 'settings';
  data: any;
  timestamp: string;
  updatedBy: string;
}

interface AgentStatus {
  agentId: string;
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  currentTask?: string;
  projectId?: string;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    tasksActive: number;
  };
  timestamp: string;
}

// WebSocket Service Implementation
class WebSocketService {
  private io: SocketIO.Server;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();
  private channelSubscriptions: Map<string, Set<string>> = new Map(); // channel -> socket IDs
  
  constructor(server: http.Server) {
    this.io = new SocketIO.Server(server, {
      cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`WebSocket connection established: ${socket.id}`);
      
      // Authentication required for all operations
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const authResult = await this.authenticateSocket(socket, data.token);
          
          if (authResult.success) {
            this.authenticatedSockets.set(socket.id, {
              socket,
              userId: authResult.userId,
              projects: authResult.projects,
              permissions: authResult.permissions,
              connectedAt: new Date()
            });
            
            socket.emit('authenticated', {
              success: true,
              user: authResult.user,
              projects: authResult.projects
            });
            
            // Auto-subscribe to user's project channels
            await this.autoSubscribeUserChannels(socket, authResult.projects);
          } else {
            socket.emit('authentication_failed', {
              error: authResult.error
            });
            socket.disconnect();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_failed', {
            error: 'Authentication failed'
          });
          socket.disconnect();
        }
      });
      
      // Channel subscription management
      socket.on('subscribe', async (data: { channels: string[] }) => {
        const authSocket = this.authenticatedSockets.get(socket.id);
        if (!authSocket) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        const allowedChannels = await this.filterAllowedChannels(
          data.channels,
          authSocket.userId,
          authSocket.permissions
        );
        
        for (const channel of allowedChannels) {
          socket.join(channel);
          this.addChannelSubscription(channel, socket.id);
        }
        
        socket.emit('subscribed', { channels: allowedChannels });
      });
      
      socket.on('unsubscribe', (data: { channels: string[] }) => {
        for (const channel of data.channels) {
          socket.leave(channel);
          this.removeChannelSubscription(channel, socket.id);
        }
        
        socket.emit('unsubscribed', { channels: data.channels });
      });
      
      // Project-specific events
      socket.on('project:join', async (data: { projectId: string }) => {
        const authSocket = this.authenticatedSockets.get(socket.id);
        if (!authSocket) return;
        
        const hasAccess = await this.projectService.hasUserAccess(
          authSocket.userId,
          data.projectId
        );
        
        if (hasAccess) {
          const projectChannel = `project:${data.projectId}`;
          socket.join(projectChannel);
          this.addChannelSubscription(projectChannel, socket.id);
          
          // Send current project status
          const projectStatus = await this.getProjectStatus(data.projectId);
          socket.emit('project:status', projectStatus);
        }
      });
      
      // Agent communication
      socket.on('agent:command', async (data: {
        agentId: string;
        command: string;
        parameters?: any;
      }) => {
        const authSocket = this.authenticatedSockets.get(socket.id);
        if (!authSocket) return;
        
        // Validate agent access
        const hasAccess = await this.agentService.hasUserAccess(
          authSocket.userId,
          data.agentId
        );
        
        if (hasAccess) {
          const result = await this.sendAgentCommand(data.agentId, {
            command: data.command,
            parameters: data.parameters,
            requestedBy: authSocket.userId
          });
          
          socket.emit('agent:command_result', {
            agentId: data.agentId,
            command: data.command,
            result
          });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
        this.handleDisconnection(socket.id);
      });
    });
  }
  
  // Broadcast events to specific channels
  async broadcastToChannel(channel: string, event: string, data: any): Promise<void> {
    this.io.to(channel).emit(event, {
      id: uuid(),
      timestamp: new Date().toISOString(),
      ...data
    });
  }
  
  // Project-specific broadcasts
  async broadcastProjectUpdate(projectId: string, update: ProjectUpdate): Promise<void> {
    await this.broadcastToChannel(
      `project:${projectId}`,
      'project:update',
      update
    );
  }
  
  async broadcastAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    // Find projects where this agent is active
    const projects = await this.agentService.getAgentProjects(agentId);
    
    for (const project of projects) {
      await this.broadcastToChannel(
        `project:${project.id}`,
        'agent:status',
        status
      );
    }
  }
  
  async broadcastTaskUpdate(taskId: string, update: TaskUpdate): Promise<void> {
    const task = await this.taskService.findById(taskId);
    if (task) {
      await this.broadcastToChannel(
        `project:${task.projectId}`,
        'task:update',
        {
          taskId,
          ...update
        }
      );
    }
  }
  
  async broadcastQualityReview(reviewId: string, review: QualityReview): Promise<void> {
    await this.broadcastToChannel(
      `project:${review.projectId}`,
      'quality:review',
      {
        reviewId,
        review
      }
    );
  }
  
  async broadcastNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    const userSockets = Array.from(this.authenticatedSockets.values())
      .filter(authSocket => authSocket.userId === userId);
    
    for (const authSocket of userSockets) {
      authSocket.socket.emit('notification', notification);
    }
  }
  
  // TTS Message Broadcasting
  async broadcastTTSMessage(
    userId: string,
    message: TTSMessage,
    deviceTypes?: string[]
  ): Promise<void> {
    const userSockets = Array.from(this.authenticatedSockets.values())
      .filter(authSocket => 
        authSocket.userId === userId &&
        (!deviceTypes || deviceTypes.includes(authSocket.deviceType))
      );
    
    for (const authSocket of userSockets) {
      authSocket.socket.emit('tts:speak', {
        id: uuid(),
        message: message.text,
        voice: message.voice || 'professional',
        priority: message.priority || 'normal',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  private async authenticateSocket(socket: Socket, token: string): Promise<AuthResult> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      // Get user and permissions
      const user = await this.userService.findById(decoded.userId);
      if (!user || !user.isActive) {
        return { success: false, error: 'Invalid user' };
      }
      
      // Get user's projects
      const projects = await this.projectService.findUserProjects(user.id);
      
      return {
        success: true,
        userId: user.id,
        user: this.formatUser(user),
        projects: projects.map(p => ({ id: p.id, name: p.name })),
        permissions: user.permissions || []
      };
    } catch (error) {
      return { success: false, error: 'Token verification failed' };
    }
  }
  
  private async autoSubscribeUserChannels(socket: Socket, projects: any[]): Promise<void> {
    const channels = [
      `user:${this.authenticatedSockets.get(socket.id)?.userId}`,
      ...projects.map(p => `project:${p.id}`)
    ];
    
    for (const channel of channels) {
      socket.join(channel);
      this.addChannelSubscription(channel, socket.id);
    }
  }
  
  private addChannelSubscription(channel: string, socketId: string): void {
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)!.add(socketId);
  }
  
  private removeChannelSubscription(channel: string, socketId: string): void {
    const subscribers = this.channelSubscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }
  }
  
  private handleDisconnection(socketId: string): void {
    // Remove from authenticated sockets
    this.authenticatedSockets.delete(socketId);
    
    // Remove from all channel subscriptions
    for (const [channel, subscribers] of this.channelSubscriptions.entries()) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }
  }
}
```

---

## GraphQL API (Optional Advanced Queries)

### 1. GraphQL Schema

```graphql
# GraphQL Schema for SENTRA API
type Query {
  # User and authentication
  me: User!
  
  # Projects
  projects(
    filter: ProjectFilter
    sort: ProjectSort
    pagination: PaginationInput
  ): ProjectConnection!
  
  project(id: ID!): Project
  
  # Agents
  agents(
    filter: AgentFilter
    sort: AgentSort
  ): [Agent!]!
  
  agent(id: ID!): Agent
  
  # Tasks
  tasks(
    projectId: ID
    filter: TaskFilter
    sort: TaskSort
    pagination: PaginationInput
  ): TaskConnection!
  
  task(id: ID!): Task
  
  # Contexts
  searchContexts(
    query: String!
    projectId: ID
    filter: ContextFilter
    limit: Int = 20
  ): ContextSearchResult!
  
  # Quality
  qualityMetrics(
    projectId: ID!
    timeRange: TimeRangeInput!
    metrics: [QualityMetricType!]
  ): QualityMetrics!
  
  # Timeline
  timelinePrediction(
    taskId: ID
    projectId: ID
  ): TimelinePrediction
}

type Mutation {
  # Project mutations
  createProject(input: CreateProjectInput!): ProjectPayload!
  updateProject(id: ID!, input: UpdateProjectInput!): ProjectPayload!
  deleteProject(id: ID!): DeletePayload!
  
  # Agent mutations
  assignAgent(input: AssignAgentInput!): AgentAssignmentPayload!
  updateAgentConfig(id: ID!, input: AgentConfigInput!): AgentPayload!
  
  # Task mutations
  createTask(input: CreateTaskInput!): TaskPayload!
  updateTask(id: ID!, input: UpdateTaskInput!): TaskPayload!
  assignTask(id: ID!, agentId: ID!): TaskAssignmentPayload!
  
  # Quality mutations
  submitQualityReview(input: QualityReviewInput!): QualityReviewPayload!
  resolveQualityIssue(id: ID!, resolution: String!): QualityIssuePayload!
  
  # Context mutations
  storeContext(input: StoreContextInput!): ContextPayload!
  rotateAgentContext(agentId: ID!, options: ContextRotationInput): ContextRotationPayload!
}

type Subscription {
  # Project updates
  projectUpdated(projectId: ID!): ProjectUpdate!
  
  # Agent status
  agentStatusChanged(agentId: ID): AgentStatusUpdate!
  
  # Task updates
  taskUpdated(projectId: ID): TaskUpdate!
  
  # Quality updates
  qualityReviewCompleted(projectId: ID): QualityReviewUpdate!
  
  # Notifications
  notificationReceived: Notification!
}

# Core Types
type User {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  avatar: String
  timezone: String
  preferences: UserPreferences!
  projects: [Project!]!
  createdAt: DateTime!
}

type Project {
  id: ID!
  name: String!
  description: String
  slug: String!
  status: ProjectStatus!
  priority: Int!
  
  # Configuration
  techStack: JSON!
  settings: ProjectSettings!
  
  # Timeline
  estimatedCompletionDate: DateTime
  actualCompletionDate: DateTime
  totalEstimatedHours: Float
  totalActualHours: Float
  
  # Client info
  clientName: String
  clientContactEmail: String
  projectValue: Float
  hourlyRate: Float
  
  # Repository
  repositoryUrl: String
  repositoryBranch: String!
  deploymentUrl: String
  stagingUrl: String
  
  # Relations
  tasks(filter: TaskFilter, sort: TaskSort): [Task!]!
  agents: [AgentInstance!]!
  qualityMetrics: QualityMetrics!
  timeline: TimelineData!
  
  # Metadata
  tags: [String!]!
  customFields: JSON
  
  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActivityAt: DateTime!
}

type Agent {
  id: ID!
  name: String!
  type: AgentType!
  personaDescription: String!
  
  capabilities: [String!]!
  specializations: [String!]!
  techStackPreferences: JSON!
  
  status: AgentStatus!
  performanceScore: Float!
  totalTasksCompleted: Int!
  averageTaskDuration: Float
  successRate: Float!
  
  configuration: AgentConfiguration!
  instances: [AgentInstance!]!
  assignments: [TaskAssignment!]!
  
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActiveAt: DateTime
}

type Task {
  id: ID!
  project: Project!
  taskNumber: Int!
  title: String!
  description: String
  
  type: TaskType!
  category: String
  epic: Task
  
  priority: Int!
  storyPoints: Int
  complexityScore: Int
  
  status: TaskStatus!
  
  # Assignment
  assignedAgent: Agent
  reviewerAgent: Agent
  
  # Timeline
  estimatedHours: Float
  actualHours: Float
  estimatedStartDate: DateTime
  estimatedEndDate: DateTime
  actualStartDate: DateTime
  actualEndDate: DateTime
  
  # Dependencies
  dependencies: [Task!]!
  blocks: [Task!]!
  relatedTasks: [Task!]!
  
  # Technical
  technicalRequirements: String
  acceptanceCriteria: String
  definitionOfDone: String
  gitBranch: String
  gitCommits: [String!]!
  pullRequestUrl: String
  
  # Business
  businessValue: Int
  clientPriority: Int
  userFacing: Boolean!
  
  # Relations
  comments: [TaskComment!]!
  timeLogs: [TaskTimeLog!]!
  attachments: [TaskAttachment!]!
  qualityReviews: [QualityReview!]!
  
  # Metadata
  tags: [String!]!
  labels: JSON
  customFields: JSON
  
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
}

# Input types and enums would be defined here...
enum AgentType {
  DEVELOPMENT
  QA
  PM
  ANALYST
  UX
  DEVOPS
  SECURITY
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  TESTING
  BLOCKED
  DONE
  CANCELLED
}

enum ProjectStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

# ... additional types and inputs
```

---

## API Error Handling & Response Format

### 1. Standardized Error Responses

```typescript
// Error Response Types
interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
  path: string;
}

interface ValidationError extends APIError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
    value?: any;
  }[];
}

interface BusinessError extends APIError {
  code: 'BUSINESS_ERROR';
  businessCode: string;
  details: {
    reason: string;
    context?: any;
  };
}

// Standard response wrapper
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  pagination?: PaginationInfo;
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
    processingTime: number;
  };
}

// Global error handler
class APIErrorHandler {
  static handle(error: Error, req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || uuid();
    const timestamp = new Date().toISOString();
    
    let apiError: APIError;
    
    if (error instanceof ValidationError) {
      apiError = {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: error.details,
        timestamp,
        requestId,
        path: req.path
      };
      res.status(400);
    } else if (error instanceof NotFoundError) {
      apiError = {
        code: 'RESOURCE_NOT_FOUND',
        message: error.message,
        timestamp,
        requestId,
        path: req.path
      };
      res.status(404);
    } else if (error instanceof ForbiddenError) {
      apiError = {
        code: 'ACCESS_FORBIDDEN',
        message: error.message,
        timestamp,
        requestId,
        path: req.path
      };
      res.status(403);
    } else if (error instanceof AuthError) {
      apiError = {
        code: 'AUTHENTICATION_FAILED',
        message: error.message,
        timestamp,
        requestId,
        path: req.path
      };
      res.status(401);
    } else {
      // Internal server error
      console.error('Internal server error:', error);
      
      apiError = {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        timestamp,
        requestId,
        path: req.path
      };
      res.status(500);
    }
    
    res.json({
      success: false,
      error: apiError,
      metadata: {
        requestId,
        timestamp,
        version: process.env.API_VERSION || '1.0',
        processingTime: Date.now() - req.startTime
      }
    });
  }
}
```

---

## Conclusion

This comprehensive API specification provides the complete technical foundation for SENTRA's service architecture. The design emphasizes:

1. **RESTful Design**: Clean, resource-based URLs with standard HTTP methods
2. **Real-time Capabilities**: WebSocket integration for live updates and agent communication
3. **Security First**: OAuth 2.0 + JWT authentication with comprehensive authorization
4. **Scalable Architecture**: Microservices design with clear separation of concerns
5. **Developer Experience**: Comprehensive error handling, validation, and documentation
6. **GraphQL Support**: Advanced query capabilities for complex data requirements
7. **Type Safety**: Full TypeScript integration with comprehensive type definitions

The API supports all core SENTRA features including:
- Multi-agent orchestration and communication
- Context preservation and intelligent search
- Quality enforcement with automated review systems
- Timeline intelligence with machine learning
- Professional project management and client communication
- Real-time collaboration and notifications

**Next Steps**: Implement the multi-agent coordination infrastructure and protocols to enable seamless agent communication and task distribution.

---

*This API specification serves as the definitive guide for SENTRA platform development and integration.*