// Core entity types
export interface User {
    id: string;
    email: string;
    username: string;
    fullName?: string;
    role: UserRole;
    avatarUrl?: string;
    preferences: UserPreferences;
    isActive: boolean;
    emailVerified: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    repositoryUrl?: string;
    status: ProjectStatus;
    settings: ProjectSettings;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    projectId: string;
    assignedTo?: string;
    createdBy: string;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    metadata: TaskMetadata;
    dueDate?: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    version: string;
    status: AgentStatus;
    configuration: AgentConfiguration;
    capabilities: string[];
    resourceRequirements: ResourceRequirements;
    lastHeartbeat?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Context {
    id: string;
    type: ContextType;
    name: string;
    description?: string;
    parentId?: string;
    projectId?: string;
    userId: string;
    data: ContextData;
    metadata: ContextMetadata;
    tags: string[];
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    userId?: string;
    agentId?: string;
    content: string;
    contentType: string;
    metadata: MessageMetadata;
    parentMessageId?: string;
    createdAt: Date;
}

// Enum types
export enum UserRole {
    ADMIN = 'admin',
    DEVELOPER = 'developer',
    REVIEWER = 'reviewer',
    GUEST = 'guest',
}

export enum ProjectStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    SUSPENDED = 'suspended',
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum AgentType {
    CODE_ANALYZER = 'code_analyzer',
    SECURITY_SCANNER = 'security_scanner',
    PERFORMANCE_OPTIMIZER = 'performance_optimizer',
    DOCUMENTATION_GENERATOR = 'documentation_generator',
    TEST_AUTOMATOR = 'test_automator',
    DEPLOYMENT_MANAGER = 'deployment_manager',
    CODE_REVIEWER = 'code_reviewer',
    QUALITY_ENFORCER = 'quality_enforcer',
}

export enum AgentStatus {
    IDLE = 'idle',
    ACTIVE = 'active',
    BUSY = 'busy',
    ERROR = 'error',
    MAINTENANCE = 'maintenance',
}

export enum ContextType {
    CONVERSATION = 'conversation',
    PROJECT = 'project',
    FILE = 'file',
    FUNCTION = 'function',
    CLASS = 'class',
    MODULE = 'module',
}

export enum NotificationType {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    SUCCESS = 'success',
}

export enum AuditAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    ACCESS_DENIED = 'access_denied',
}

// Configuration and metadata types
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    notifications?: {
        email: boolean;
        push: boolean;
        inApp: boolean;
    };
    editor?: {
        fontSize: number;
        tabSize: number;
        wordWrap: boolean;
        minimap: boolean;
    };
}

export interface ProjectSettings {
    enableAI: boolean;
    qualityThreshold: number;
    autoReview: boolean;
    testCoverage: number;
    codeStyle?: {
        formatter: string;
        rules: Record<string, any>;
    };
    deployment?: {
        environment: string;
        autoDeloy: boolean;
        approvalRequired: boolean;
    };
}

export interface TaskMetadata {
    complexity?: 'low' | 'medium' | 'high' | 'very_high';
    category?: string;
    milestone?: string;
    dependencies?: string[];
    blockers?: string[];
    files?: string[];
}

export interface AgentConfiguration {
    [key: string]: any;
}

export interface ResourceRequirements {
    minCpuCores: number;
    minRamMb: number;
    diskSpaceMb: number;
    networkRequired: boolean;
    gpuRequired?: boolean;
    specialRequirements?: string[];
}

export interface ContextData {
    [key: string]: any;
}

export interface ContextMetadata {
    [key: string]: any;
}

export interface MessageMetadata {
    timestamp?: string;
    importance?: 'low' | 'medium' | 'high';
    attachments?: {
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    }[];
    mentions?: string[];
    reactions?: {
        emoji: string;
        userId: string;
        createdAt: Date;
    }[];
}

// API Request/Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    timestamp: string;
}

export interface CreateUserRequest {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    role?: UserRole;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    repositoryUrl?: string;
    settings?: Partial<ProjectSettings>;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    priority?: TaskPriority;
    projectId: string;
    assignedTo?: string;
    estimatedHours?: number;
    tags?: string[];
    dueDate?: Date;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    dueDate?: Date;
}

// Agent orchestration types
export interface AgentTask {
    id: string;
    agentId: string;
    taskId: string;
    status: TaskStatus;
    inputData?: any;
    outputData?: any;
    errorDetails?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AgentTaskRequest {
    type: string;
    priority: TaskPriority;
    data: any;
    requirements?: ResourceRequirements;
    timeout?: number;
    callbacks?: {
        onProgress?: string;
        onComplete?: string;
        onError?: string;
    };
}

export interface ResourceLock {
    id: string;
    resourceType: string;
    resourceId: string;
    lockedBy: string;
    lockType: 'shared' | 'exclusive';
    expiresAt: Date;
    metadata?: any;
    createdAt: Date;
}

// WebSocket message types
export interface WebSocketMessage {
    type: string;
    channel?: string;
    data?: any;
    timestamp: string;
}

export interface AgentHeartbeat {
    agentId: string;
    status: AgentStatus;
    systemStats: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
    };
    activeTaskCount: number;
    lastTaskCompletedAt?: Date;
    timestamp: Date;
}

// Quality metrics types
export interface QualityMetric {
    id: string;
    projectId: string;
    metricType: string;
    value: number;
    threshold?: number;
    status?: 'good' | 'warning' | 'critical';
    metadata?: any;
    measuredAt: Date;
}

export interface QualityReport {
    projectId: string;
    overallScore: number;
    metrics: QualityMetric[];
    trends: {
        metricType: string;
        trend: 'improving' | 'stable' | 'declining';
        changePercent: number;
    }[];
    recommendations: string[];
    generatedAt: Date;
}

// Timeline and events
export interface TimelineEvent {
    id: string;
    projectId: string;
    eventType: string;
    title: string;
    description?: string;
    actorId?: string;
    data?: any;
    occurredAt: Date;
}

export interface TimelinePrediction {
    projectId: string;
    predictedEvents: {
        type: string;
        description: string;
        estimatedDate: Date;
        confidence: number;
    }[];
    riskFactors: {
        factor: string;
        impact: 'low' | 'medium' | 'high';
        mitigation: string;
    }[];
    recommendations: string[];
    generatedAt: Date;
}