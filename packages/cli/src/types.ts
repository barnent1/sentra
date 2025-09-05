// Sentra Evolutionary Agent System - CLI Types
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

import type { Brand } from '@sentra/types';

/**
 * CLI-specific branded types for type safety
 */
export type ProjectId = Brand<string, 'ProjectId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type CommandType = Brand<string, 'CommandType'>;
export type TmuxSessionName = Brand<string, 'TmuxSessionName'>;
export type DeploymentId = Brand<string, 'DeploymentId'>;

/**
 * Command types enumeration - use regular const for runtime access
 */
export const Command = {
  CREATE: 'create',
  STATUS: 'status', 
  DEPLOY: 'deploy',
} as const;

export type CommandName = typeof Command[keyof typeof Command];

/**
 * Project status enumeration
 */
export const ProjectStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CREATING: 'creating',
  DEPLOYING: 'deploying',
  ERROR: 'error',
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

/**
 * Deployment status enumeration
 */
export const DeploymentStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type DeploymentStatusType = typeof DeploymentStatus[keyof typeof DeploymentStatus];

/**
 * TMUX session status enumeration
 */
export const TmuxStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  NOT_FOUND: 'not_found',
} as const;

export type TmuxStatusType = typeof TmuxStatus[keyof typeof TmuxStatus];

/**
 * Error types for CLI operations - use regular const for runtime access
 */
export const CliErrorType = {
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
} as const;

export type CliErrorCode = typeof CliErrorType[keyof typeof CliErrorType];

/**
 * CLI Error interface with strict typing
 */
export interface CliError {
  readonly code: CliErrorCode;
  readonly message: string;
  readonly details?: unknown | undefined;
  readonly suggestions?: readonly string[] | undefined;
}

/**
 * CLI Result type for operations
 */
export interface CliResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T | undefined;
  readonly error?: CliError | undefined;
}

/**
 * Project configuration interface
 */
export interface ProjectConfig {
  readonly id: ProjectId;
  readonly name: string;
  readonly path: string;
  readonly status: ProjectStatusType;
  readonly tmuxSession?: TmuxSessionName | undefined;
  readonly createdAt: Date;
  readonly lastActiveAt?: Date | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

/**
 * TMUX session information
 */
export interface TmuxSession {
  readonly id: SessionId;
  readonly name: TmuxSessionName;
  readonly status: TmuxStatusType;
  readonly windows: readonly TmuxWindow[];
  readonly createdAt: Date;
  readonly lastActivity?: Date | undefined;
}

/**
 * TMUX window information
 */
export interface TmuxWindow {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly panes: readonly TmuxPane[];
}

/**
 * TMUX pane information
 */
export interface TmuxPane {
  readonly id: string;
  readonly active: boolean;
  readonly currentPath: string;
  readonly command?: string | undefined;
}

/**
 * Deployment information interface
 */
export interface Deployment {
  readonly id: DeploymentId;
  readonly projectId: ProjectId;
  readonly status: DeploymentStatusType;
  readonly version: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly logs: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * CLI command arguments interface
 */
export interface CommandArgs {
  readonly command: CommandName;
  readonly args: readonly string[];
  readonly options: Record<string, string | boolean>;
}

/**
 * Create command options
 */
export interface CreateOptions {
  readonly projectName: string;
  readonly template?: string | undefined;
  readonly directory?: string | undefined;
  readonly openSession?: boolean | undefined;
}

/**
 * Status command result
 */
export interface StatusResult {
  readonly projects: readonly ProjectConfig[];
  readonly tmuxSessions: readonly TmuxSession[];
  readonly systemStatus: {
    readonly healthy: boolean;
    readonly version: string;
    readonly uptime: number;
  };
}

/**
 * Deploy command options
 */
export interface DeployOptions {
  readonly projectId?: ProjectId | undefined;
  readonly environment?: 'development' | 'staging' | 'production' | undefined;
  readonly force?: boolean | undefined;
  readonly dryRun?: boolean | undefined;
}

/**
 * CLI configuration interface
 */
export interface CliConfig {
  readonly apiEndpoint: string;
  readonly defaultTemplate: string;
  readonly tmuxEnabled: boolean;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly timeout: number;
}

/**
 * API client configuration interface
 */
export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly apiKey?: string | undefined;
}