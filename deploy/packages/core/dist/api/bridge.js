/**
 * Project Management Bridge for CLI to Orchestrator Communication
 *
 * Provides a high-level interface connecting the TypeScript CLI to the Python
 * orchestrator through the FastAPI backend. Manages project lifecycle, task
 * orchestration, and real-time synchronization.
 *
 * @module ProjectBridge
 */
import { SentraAPIClient } from './client';
import { SentraWebSocketClient } from './websocket';
// ============================================================================
// BRIDGE EVENT TYPES
// ============================================================================
export const BridgeEventType = {
    PROJECT_CREATED: 'project_created',
    PROJECT_STATUS_UPDATED: 'project_status_updated',
    TASK_ASSIGNED: 'task_assigned',
    TASK_STARTED: 'task_started',
    TASK_COMPLETED: 'task_completed',
    TASK_FAILED: 'task_failed',
    AGENT_SPAWNED: 'agent_spawned',
    AGENT_STATUS_CHANGED: 'agent_status_changed',
    DEPLOYMENT_INITIATED: 'deployment_initiated',
    DEPLOYMENT_COMPLETED: 'deployment_completed',
    BRIDGE_ERROR: 'bridge_error'
};
// ============================================================================
// PROJECT MANAGEMENT BRIDGE CLASS
// ============================================================================
export class ProjectManagementBridge {
    config;
    apiClient;
    wsClient;
    projectStates = new Map();
    eventHandlers = new Map();
    healthCheckTimer = null;
    syncTimer = null;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.apiClient = new SentraAPIClient({
            baseUrl: config.api.baseUrl,
            timeout: config.api.timeout,
            retryAttempts: config.api.retryAttempts,
            ...(config.api.authentication && { authentication: config.api.authentication }),
            logging: config.logging,
        });
        this.wsClient = new SentraWebSocketClient(config.websocket);
        this.setupWebSocketHandlers();
    }
    // ============================================================================
    // INITIALIZATION AND LIFECYCLE
    // ============================================================================
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Test API connection
            const healthCheck = await this.apiClient.healthCheck();
            if (!healthCheck.success) {
                throw new Error('API health check failed');
            }
            // Establish WebSocket connection
            await this.wsClient.connect();
            // Start periodic tasks
            this.startHealthCheck();
            this.startTaskSync();
            this.isInitialized = true;
            this.log('info', 'Project Management Bridge initialized successfully');
        }
        catch (error) {
            this.log('error', 'Failed to initialize bridge:', error);
            throw error;
        }
    }
    async shutdown() {
        this.stopHealthCheck();
        this.stopTaskSync();
        await this.wsClient.disconnect();
        this.projectStates.clear();
        this.eventHandlers.clear();
        this.isInitialized = false;
        this.log('info', 'Project Management Bridge shut down');
    }
    // ============================================================================
    // PROJECT MANAGEMENT
    // ============================================================================
    async createProject(request) {
        this.ensureInitialized();
        const response = await this.apiClient.createProject(request);
        if (!response.success) {
            throw new Error(`Failed to create project: ${response.error.message}`);
        }
        const project = response.data;
        const projectState = {
            project,
            tasks: new Map(),
            agents: new Map(),
            subAgents: new Map(),
            lastUpdate: new Date(),
            isActive: true,
        };
        this.projectStates.set(project.id, projectState);
        // Subscribe to project updates
        this.wsClient.subscribeToProject(project.id);
        await this.emitEvent(BridgeEventType.PROJECT_CREATED, project.id, { project });
        this.log('info', `Created project: ${project.name} (${project.id})`);
        return project;
    }
    async getProjectStatus(projectId) {
        this.ensureInitialized();
        const response = await this.apiClient.getProjectStatus(projectId);
        if (!response.success) {
            throw new Error(`Failed to get project status: ${response.error.message}`);
        }
        const status = response.data;
        await this.emitEvent(BridgeEventType.PROJECT_STATUS_UPDATED, projectId, { status });
        return status;
    }
    getProjectState(projectId) {
        return this.projectStates.get(projectId);
    }
    getProjectMetrics(projectId) {
        const state = this.projectStates.get(projectId);
        if (!state) {
            return null;
        }
        const tasks = Array.from(state.tasks.values());
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
        const queuedTasks = tasks.filter(t => t.status === 'queued');
        return {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            inProgressTasks: inProgressTasks.length,
            queuedTasks: queuedTasks.length,
            activeAgents: state.agents.size,
            averageTaskCompletionTime: this.calculateAverageCompletionTime(completedTasks),
            successRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
        };
    }
    // ============================================================================
    // TASK ORCHESTRATION
    // ============================================================================
    async createTask(request) {
        this.ensureInitialized();
        const response = await this.apiClient.createTask(request);
        if (!response.success) {
            throw new Error(`Failed to create task: ${response.error.message}`);
        }
        const task = response.data;
        // Add to project state
        const projectState = this.projectStates.get(task.project_id);
        if (projectState) {
            const newTasks = new Map(projectState.tasks);
            newTasks.set(task.id, task);
            const updatedState = {
                ...projectState,
                tasks: newTasks,
                lastUpdate: new Date()
            };
            this.projectStates.set(task.project_id, updatedState);
        }
        // Subscribe to task updates
        this.wsClient.subscribeToTask(task.id);
        await this.emitEvent(BridgeEventType.TASK_ASSIGNED, task.project_id, { task });
        this.log('info', `Created task: ${task.title} (${task.id})`);
        return task;
    }
    async assignTaskToAgent(taskId, agentRole) {
        this.ensureInitialized();
        // Get available agents for role
        const agentsResponse = await this.apiClient.listAgents(true);
        if (!agentsResponse.success) {
            throw new Error(`Failed to list agents: ${agentsResponse.error.message}`);
        }
        const availableAgent = agentsResponse.data.find(agent => agent.role === agentRole);
        if (!availableAgent) {
            throw new Error(`No available agent found for role: ${agentRole}`);
        }
        // For now, we would need an API endpoint to assign task to agent
        // This would be implemented in the FastAPI backend
        this.log('info', `Would assign task ${taskId} to agent ${availableAgent.id}`);
    }
    async spawnSubAgent(request) {
        this.ensureInitialized();
        const response = await this.apiClient.spawnSubAgent(request);
        if (!response.success) {
            throw new Error(`Failed to spawn sub-agent: ${response.error.message}`);
        }
        const subAgent = response.data;
        // Add to project state
        const task = await this.findTaskInProjects(subAgent.task_id);
        if (task) {
            const projectState = this.projectStates.get(task.project_id);
            if (projectState) {
                const newSubAgents = new Map(projectState.subAgents);
                newSubAgents.set(subAgent.task_id, subAgent);
                const updatedState = {
                    ...projectState,
                    subAgents: newSubAgents,
                    lastUpdate: new Date()
                };
                this.projectStates.set(task.project_id, updatedState);
            }
        }
        await this.emitEvent(BridgeEventType.AGENT_SPAWNED, task?.project_id || '', { subAgent });
        this.log('info', `Spawned sub-agent: ${subAgent.id} for task ${subAgent.task_id}`);
        return subAgent;
    }
    // ============================================================================
    // DEPLOYMENT MANAGEMENT
    // ============================================================================
    async deployImprovements(request) {
        this.ensureInitialized();
        const response = await this.apiClient.deploy(request);
        if (!response.success) {
            throw new Error(`Failed to deploy improvements: ${response.error.message}`);
        }
        const deployment = response.data;
        // Emit deployment events for all active projects
        for (const [projectId] of this.projectStates) {
            await this.emitEvent(BridgeEventType.DEPLOYMENT_INITIATED, projectId, { deployment });
        }
        this.log('info', `Deployment initiated: ${deployment.deployment_id}`);
        return deployment;
    }
    // ============================================================================
    // EVENT MANAGEMENT
    // ============================================================================
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType).add(handler);
    }
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    async emitEvent(type, projectId, data) {
        const event = {
            type,
            projectId,
            timestamp: new Date(),
            data,
        };
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            const promises = Array.from(handlers).map(handler => {
                try {
                    return Promise.resolve(handler(event));
                }
                catch (error) {
                    this.log('error', `Event handler error for ${type}:`, error);
                    return Promise.resolve();
                }
            });
            await Promise.allSettled(promises);
        }
    }
    // ============================================================================
    // WEBSOCKET HANDLING
    // ============================================================================
    setupWebSocketHandlers() {
        this.wsClient.setMessageHandlers({
            onProjectUpdate: async (message) => {
                await this.handleProjectUpdate(message.data);
            },
            onTaskUpdate: async (message) => {
                await this.handleTaskUpdate(message.data);
            },
            onAgentUpdate: async (message) => {
                await this.handleAgentUpdate(message.data);
            },
        });
        this.wsClient.setConnectionEventHandlers({
            onConnect: async (connectionId) => {
                this.log('info', `WebSocket connected: ${connectionId}`);
                // Re-subscribe to all active projects
                for (const [projectId] of this.projectStates) {
                    this.wsClient.subscribeToProject(projectId);
                }
            },
            onDisconnect: async (code, reason) => {
                this.log('warn', `WebSocket disconnected: ${code} - ${reason}`);
            },
        });
    }
    async handleProjectUpdate(update) {
        const projectState = this.projectStates.get(update.project_id);
        if (projectState) {
            const updatedState = {
                ...projectState,
                lastUpdate: new Date()
            };
            this.projectStates.set(update.project_id, updatedState);
            await this.emitEvent(BridgeEventType.PROJECT_STATUS_UPDATED, update.project_id, update);
        }
    }
    async handleTaskUpdate(update) {
        const projectState = this.projectStates.get(update.project_id);
        if (projectState && projectState.tasks.has(update.task_id)) {
            const task = projectState.tasks.get(update.task_id);
            const updatedTask = {
                ...task,
                status: update.status,
                // Apply other updates as needed
            };
            const newTasks = new Map(projectState.tasks);
            newTasks.set(update.task_id, updatedTask);
            const updatedStateForTask = {
                ...projectState,
                tasks: newTasks,
                lastUpdate: new Date()
            };
            this.projectStates.set(update.project_id, updatedStateForTask);
            // Emit appropriate events based on status
            let eventType;
            switch (update.status) {
                case 'in_progress':
                    eventType = BridgeEventType.TASK_STARTED;
                    break;
                case 'completed':
                    eventType = BridgeEventType.TASK_COMPLETED;
                    break;
                case 'failed':
                    eventType = BridgeEventType.TASK_FAILED;
                    break;
                default:
                    return; // Don't emit event for other status changes
            }
            await this.emitEvent(eventType, update.project_id, { task: updatedTask, update });
        }
    }
    async handleAgentUpdate(update) {
        // Find the project this agent belongs to
        for (const [projectId, state] of this.projectStates) {
            if (state.agents.has(update.agent_id)) {
                const updatedState = {
                    ...state,
                    lastUpdate: new Date()
                };
                this.projectStates.set(projectId, updatedState);
                await this.emitEvent(BridgeEventType.AGENT_STATUS_CHANGED, projectId, update);
                break;
            }
        }
    }
    // ============================================================================
    // PERIODIC TASKS
    // ============================================================================
    startHealthCheck() {
        if (!this.config.orchestrator.enabled) {
            return;
        }
        this.healthCheckTimer = setInterval(async () => {
            try {
                const health = await this.apiClient.getSystemHealth();
                if (!health.success || health.data.status !== 'healthy') {
                    this.log('warn', 'System health check failed:', health);
                }
            }
            catch (error) {
                this.log('error', 'Health check error:', error);
            }
        }, this.config.orchestrator.healthCheckInterval);
    }
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }
    startTaskSync() {
        if (!this.config.orchestrator.enabled) {
            return;
        }
        this.syncTimer = setInterval(async () => {
            await this.syncProjectStates();
        }, this.config.orchestrator.taskSyncInterval);
    }
    stopTaskSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    async syncProjectStates() {
        for (const [projectId] of this.projectStates) {
            try {
                const status = await this.getProjectStatus(projectId);
                // Update local state based on remote status
                this.log('debug', `Synced project ${projectId}:`, status);
            }
            catch (error) {
                this.log('error', `Failed to sync project ${projectId}:`, error);
            }
        }
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Bridge not initialized. Call initialize() first.');
        }
    }
    async findTaskInProjects(taskId) {
        for (const state of this.projectStates.values()) {
            const task = state.tasks.get(taskId);
            if (task) {
                return task;
            }
        }
        return null;
    }
    calculateAverageCompletionTime(completedTasks) {
        if (completedTasks.length === 0) {
            return 0;
        }
        const totalTime = completedTasks.reduce((sum, task) => {
            const created = new Date(task.created_at);
            const updated = new Date(task.updated_at);
            return sum + (updated.getTime() - created.getTime());
        }, 0);
        return totalTime / completedTasks.length;
    }
    log(level, message, ...args) {
        if (this.config.logging.enabled &&
            ['debug', 'info', 'warn', 'error'].indexOf(level) >=
                ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
            console[level](`[Bridge] ${message}`, ...args);
        }
    }
    // ============================================================================
    // PUBLIC GETTERS
    // ============================================================================
    getApiClient() {
        return this.apiClient;
    }
    getWebSocketClient() {
        return this.wsClient;
    }
    getConfig() {
        return { ...this.config };
    }
    getActiveProjects() {
        return Array.from(this.projectStates.values())
            .filter(state => state.isActive)
            .map(state => state.project);
    }
    isConnected() {
        return this.wsClient.isConnected();
    }
    isHealthy() {
        return this.isInitialized && this.wsClient.isConnected();
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export const createProjectBridge = (config) => {
    return new ProjectManagementBridge(config);
};
export const createDefaultProjectBridge = (baseUrl = 'http://localhost:8000') => {
    return createProjectBridge({
        api: {
            baseUrl,
            timeout: 30000,
            retryAttempts: 3,
        },
        websocket: {
            url: baseUrl.replace('http', 'ws') + '/ws/projects',
            reconnectAttempts: 5,
            reconnectDelay: 2000,
            heartbeatInterval: 30000,
            messageTimeout: 10000,
            logging: {
                enabled: true,
                level: 'info',
            },
        },
        orchestrator: {
            enabled: true,
            healthCheckInterval: 60000,
            taskSyncInterval: 30000,
        },
        logging: {
            enabled: true,
            level: 'info',
        },
    });
};
//# sourceMappingURL=bridge.js.map