"use strict";
// Sentra Evolutionary Agent System - CLI Types
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliErrorType = exports.TmuxStatus = exports.DeploymentStatus = exports.ProjectStatus = exports.Command = void 0;
/**
 * Command types enumeration - use regular const for runtime access
 */
exports.Command = {
    CREATE: 'create',
    STATUS: 'status',
    DEPLOY: 'deploy',
};
/**
 * Project status enumeration
 */
exports.ProjectStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    CREATING: 'creating',
    DEPLOYING: 'deploying',
    ERROR: 'error',
};
/**
 * Deployment status enumeration
 */
exports.DeploymentStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
};
/**
 * TMUX session status enumeration
 */
exports.TmuxStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    NOT_FOUND: 'not_found',
};
/**
 * Error types for CLI operations - use regular const for runtime access
 */
exports.CliErrorType = {
    COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',
    INVALID_ARGUMENTS: 'INVALID_ARGUMENTS',
    PROJECT_ALREADY_EXISTS: 'PROJECT_ALREADY_EXISTS',
    PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
    TMUX_ERROR: 'TMUX_ERROR',
    API_ERROR: 'API_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
