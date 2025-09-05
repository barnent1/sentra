"use strict";
// Sentra Evolutionary Agent System - API Client
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.ApiClient = void 0;
const types_1 = require("./types");
/**
 * Default API configuration
 */
const defaultConfig = {
    baseUrl: process.env['SENTRA_API_URL'] || 'http://localhost:8000/api/v1',
    timeout: 30000,
    ...(process.env['SENTRA_API_KEY'] ? { apiKey: process.env['SENTRA_API_KEY'] } : {}),
};
/**
 * API Client for Sentra backend communication
 */
class ApiClient {
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    /**
     * Create a new project
     */
    createProject = async (name, options = {}) => {
        try {
            const response = await this.request('/projects', {
                method: 'POST',
                body: {
                    name,
                    template: options.template || 'default',
                    directory: options.directory,
                },
            });
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Get project by ID
     */
    getProject = async (projectId) => {
        try {
            const response = await this.request(`/projects/${projectId}`);
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * List all projects
     */
    listProjects = async () => {
        try {
            const response = await this.request('/projects');
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Delete a project
     */
    deleteProject = async (projectId) => {
        try {
            const response = await this.request(`/projects/${projectId}`, {
                method: 'DELETE',
            });
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Start a deployment
     */
    startDeployment = async (projectId, options = {}) => {
        try {
            const response = await this.request('/deployments', {
                method: 'POST',
                body: {
                    projectId,
                    environment: options.environment || 'development',
                    force: options.force || false,
                    dryRun: options.dryRun || false,
                },
            });
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Get deployment by ID
     */
    getDeployment = async (deploymentId) => {
        try {
            const response = await this.request(`/deployments/${deploymentId}`);
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * List deployments for a project
     */
    listDeployments = async (projectId) => {
        try {
            const url = projectId ? `/deployments?projectId=${projectId}` : '/deployments';
            const response = await this.request(url);
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Get system health status
     */
    getSystemStatus = async () => {
        try {
            const response = await this.request('/health');
            return response;
        }
        catch (error) {
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Make HTTP request to API
     */
    request = async (endpoint, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            const url = `${this.config.baseUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            };
            if (this.config.apiKey) {
                headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            }
            const fetchOptions = {
                method: options.method || 'GET',
                headers,
                signal: controller.signal,
            };
            if (options.body && options.method !== 'GET') {
                fetchOptions.body = JSON.stringify(options.body);
            }
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.API_ERROR,
                        message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                        details: errorData,
                    },
                };
            }
            // Handle empty responses
            if (response.status === 204 || options.method === 'DELETE') {
                return {
                    success: true,
                    data: undefined,
                };
            }
            const data = await response.json();
            if (data.success) {
                return {
                    success: true,
                    data: data.data,
                };
            }
            else {
                return {
                    success: false,
                    error: {
                        code: data.error?.code || types_1.CliErrorType.API_ERROR,
                        message: data.error?.message || 'API request failed',
                        details: data.error?.details,
                    },
                };
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.NETWORK_ERROR,
                        message: 'Request timeout',
                        details: error,
                    },
                };
            }
            return {
                success: false,
                error: this.handleError(error),
            };
        }
    };
    /**
     * Handle and format errors
     */
    handleError = (error) => {
        if (error instanceof Error) {
            // Network errors
            if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
                return {
                    code: types_1.CliErrorType.NETWORK_ERROR,
                    message: 'Unable to connect to Sentra API',
                    details: error.message,
                    suggestions: [
                        'Check if the Sentra API server is running',
                        'Verify the API URL in configuration',
                        'Check network connectivity',
                    ],
                };
            }
            return {
                code: types_1.CliErrorType.API_ERROR,
                message: error.message,
                details: error,
            };
        }
        return {
            code: types_1.CliErrorType.UNKNOWN_ERROR,
            message: 'An unknown error occurred',
            details: error,
        };
    };
}
exports.ApiClient = ApiClient;
/**
 * Default API client instance
 */
exports.apiClient = new ApiClient();
