/**
 * HTTP API Client for Sentra FastAPI Backend
 *
 * Provides a robust HTTP client with automatic retries, error handling,
 * and strict TypeScript interfaces for all FastAPI endpoints.
 *
 * @module APIClient
 */
// ============================================================================
// HTTP CLIENT CLASS
// ============================================================================
export class SentraAPIClient {
    config;
    metrics;
    abortController;
    constructor(config = {}) {
        this.config = {
            baseUrl: 'http://localhost:8000',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            websocket: {
                enabled: true,
                reconnectAttempts: 5,
                reconnectDelay: 2000,
            },
            logging: {
                enabled: true,
                level: 'info',
            },
            ...config,
        };
        this.metrics = {
            requests_total: 0,
            requests_successful: 0,
            requests_failed: 0,
            average_response_time: 0,
            websocket_connections: 0,
            websocket_messages_sent: 0,
            websocket_messages_received: 0,
        };
        this.abortController = new AbortController();
    }
    // ============================================================================
    // CORE HTTP METHODS
    // ============================================================================
    async makeRequest(method, endpoint, options = {}) {
        const startTime = performance.now();
        this.metrics.requests_total++;
        try {
            const url = this.buildUrl(endpoint, options.params);
            const headers = this.buildHeaders(options.headers);
            const fetchOptions = {
                method,
                headers,
                signal: this.abortController.signal,
            };
            if (options.body) {
                fetchOptions.body = JSON.stringify(options.body);
            }
            const response = await this.fetchWithRetry(url, fetchOptions);
            const responseTime = performance.now() - startTime;
            this.updateMetrics(responseTime, true);
            const data = await this.parseResponse(response);
            if (this.config.logging?.enabled) {
                this.log('info', `${method} ${endpoint} - ${response.status} (${responseTime.toFixed(2)}ms)`);
            }
            return {
                success: true,
                data,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.updateMetrics(responseTime, false);
            if (this.config.logging?.enabled) {
                this.log('error', `${method} ${endpoint} failed:`, error);
            }
            return {
                success: false,
                error: this.transformError(error),
                timestamp: new Date().toISOString(),
            };
        }
    }
    async fetchWithRetry(url, options, attempt = 1) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(this.config.timeout),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        }
        catch (error) {
            if (attempt < this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempt);
                return this.fetchWithRetry(url, options, attempt + 1);
            }
            throw error;
        }
    }
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return await response.json();
        }
        else {
            return await response.text();
        }
    }
    buildUrl(endpoint, params) {
        const url = new URL(endpoint, this.config.baseUrl);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return url.toString();
    }
    buildHeaders(additionalHeaders) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (this.config.authentication) {
            if (this.config.authentication.type === 'token') {
                headers['Authorization'] = `Bearer ${this.config.authentication.value}`;
            }
            else if (this.config.authentication.type === 'api_key') {
                headers['X-API-Key'] = this.config.authentication.value;
            }
        }
        return { ...headers, ...additionalHeaders };
    }
    transformError(error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    status_code: 408,
                    message: 'Request timeout',
                    timestamp: new Date().toISOString(),
                };
            }
            if (error.message.startsWith('HTTP ')) {
                const statusMatch = error.message.match(/HTTP (\d+):/);
                const statusCode = statusMatch && statusMatch[1] ? parseInt(statusMatch[1], 10) : 500;
                return {
                    status_code: statusCode,
                    message: error.message,
                    timestamp: new Date().toISOString(),
                };
            }
            return {
                status_code: 500,
                message: error.message,
                timestamp: new Date().toISOString(),
            };
        }
        return {
            status_code: 500,
            message: 'Unknown error occurred',
            timestamp: new Date().toISOString(),
        };
    }
    updateMetrics(responseTime, success) {
        if (success) {
            this.metrics.requests_successful++;
        }
        else {
            this.metrics.requests_failed++;
        }
        // Update rolling average response time
        const totalRequests = this.metrics.requests_successful + this.metrics.requests_failed;
        this.metrics.average_response_time =
            (this.metrics.average_response_time * (totalRequests - 1) + responseTime) / totalRequests;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    log(level, message, ...args) {
        if (this.config.logging?.enabled &&
            ['debug', 'info', 'warn', 'error'].indexOf(level) >=
                ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
            const logMethod = console[level];
            if (typeof logMethod === 'function') {
                logMethod(message, ...args);
            }
        }
    }
    // ============================================================================
    // HEALTH AND STATUS ENDPOINTS
    // ============================================================================
    async healthCheck() {
        return this.makeRequest('GET', '/health');
    }
    async getSystemHealth() {
        return this.makeRequest('GET', '/api/monitoring/health');
    }
    // ============================================================================
    // AGENT MANAGEMENT ENDPOINTS
    // ============================================================================
    async listAgents(activeOnly = true) {
        return this.makeRequest('GET', '/api/agents', {
            params: { active_only: activeOnly },
        });
    }
    async createAgent(request) {
        return this.makeRequest('POST', '/api/agents', {
            body: request,
        });
    }
    async seedDefaultAgents() {
        return this.makeRequest('POST', '/api/agents/seed');
    }
    async spawnSubAgent(request) {
        return this.makeRequest('POST', '/api/agents/spawn', {
            body: request,
        });
    }
    async listSubAgents(machineId, status) {
        return this.makeRequest('GET', '/api/agents/subagents', {
            params: {
                machine_id: machineId,
                status,
            },
        });
    }
    async updateSubAgentHeartbeat(subAgentId) {
        return this.makeRequest('PUT', `/api/agents/subagents/${subAgentId}/heartbeat`);
    }
    // ============================================================================
    // TASK MANAGEMENT ENDPOINTS
    // ============================================================================
    async createTask(request) {
        return this.makeRequest('POST', '/api/tasks', {
            body: request,
        });
    }
    async listTasks(projectName, status, limit = 50) {
        return this.makeRequest('GET', '/api/tasks', {
            params: {
                project_name: projectName,
                status,
                limit,
            },
        });
    }
    // ============================================================================
    // PROJECT MANAGEMENT ENDPOINTS
    // ============================================================================
    async createProject(request) {
        return this.makeRequest('POST', '/projects/create', {
            body: request,
        });
    }
    async getProjectStatus(projectId) {
        return this.makeRequest('GET', '/projects/status', {
            params: { project_id: projectId },
        });
    }
    // ============================================================================
    // EVENT MANAGEMENT ENDPOINTS
    // ============================================================================
    async listEvents(params) {
        return this.makeRequest('GET', '/api/events', {
            params: params,
        });
    }
    // ============================================================================
    // MEMORY MANAGEMENT ENDPOINTS
    // ============================================================================
    async createMemory(request) {
        return this.makeRequest('POST', '/api/memory', {
            body: request,
        });
    }
    async searchMemory(params) {
        return this.makeRequest('GET', '/api/memory/search', {
            params: params,
        });
    }
    // ============================================================================
    // APPROVAL MANAGEMENT ENDPOINTS
    // ============================================================================
    async createApproval(request) {
        return this.makeRequest('POST', '/api/approvals', {
            body: request,
        });
    }
    async listApprovals(status) {
        return this.makeRequest('GET', '/api/approvals', {
            params: { status },
        });
    }
    async approveRequest(approvalId) {
        return this.makeRequest('PUT', `/api/approvals/${approvalId}/approve`);
    }
    async rejectRequest(approvalId, reason) {
        return this.makeRequest('PUT', `/api/approvals/${approvalId}/reject`, {
            body: { reason },
        });
    }
    // ============================================================================
    // DEPLOYMENT ENDPOINTS
    // ============================================================================
    async deploy(request) {
        return this.makeRequest('POST', '/deploy', {
            body: request,
        });
    }
    // ============================================================================
    // AUTHENTICATION ENDPOINTS
    // ============================================================================
    async authenticate(request) {
        return this.makeRequest('POST', '/auth/authenticate', {
            body: request,
        });
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    getMetrics() {
        return { ...this.metrics };
    }
    getConfig() {
        return { ...this.config };
    }
    abort() {
        this.abortController.abort();
        this.abortController = new AbortController();
    }
    // ============================================================================
    // TYPE VALIDATION HELPERS
    // ============================================================================
    validateAgentResponse(data) {
        return (typeof data === 'object' &&
            data !== null &&
            'id' in data &&
            'name' in data &&
            'role' in data &&
            'active' in data &&
            typeof data.active === 'boolean');
    }
    validateTaskResponse(data) {
        return (typeof data === 'object' &&
            data !== null &&
            'id' in data &&
            'title' in data &&
            'status' in data &&
            'priority' in data &&
            typeof data.priority === 'number');
    }
    validateAPIError(data) {
        return (typeof data === 'object' &&
            data !== null &&
            'status_code' in data &&
            'message' in data &&
            'timestamp' in data &&
            typeof data.status_code === 'number');
    }
    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================
    async createMultipleTasks(requests) {
        const results = await Promise.allSettled(requests.map(request => this.createTask(request)));
        const successful = [];
        const errors = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    successful.push(result.value.data);
                }
                else {
                    errors.push(result.value.error);
                }
            }
            else if (result.status === 'rejected') {
                errors.push({
                    status_code: 500,
                    message: `Failed to create task ${index}: ${result.reason}`,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        if (errors.length > 0) {
            return {
                success: false,
                error: {
                    status_code: 207, // Multi-status
                    message: `${errors.length} of ${requests.length} tasks failed to create`,
                    details: { errors, successful },
                    timestamp: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };
        }
        return {
            success: true,
            data: successful,
            timestamp: new Date().toISOString(),
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export const createAPIClient = (config) => {
    return new SentraAPIClient(config);
};
// ============================================================================
// SINGLETON INSTANCE (OPTIONAL)
// ============================================================================
let defaultClient = null;
export const getDefaultAPIClient = (config) => {
    if (!defaultClient) {
        defaultClient = createAPIClient(config);
    }
    return defaultClient;
};
export const resetDefaultAPIClient = () => {
    defaultClient = null;
};
//# sourceMappingURL=client.js.map