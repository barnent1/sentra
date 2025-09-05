/**
 * TMUX CLI Integration
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class provides CLI integration hooks for TMUX session management,
 * enabling command-line operations and scripting support.
 */
import { EventEmitter } from 'events';
import type { SessionId, PanelId, CLIOperationResult, CommandExecutionResult } from './types';
import type { TMUXSessionManager } from './TMUXSessionManager';
import type { SessionScalingManager } from './SessionScalingManager';
import type { SessionPersistenceManager } from './SessionPersistenceManager';
/**
 * CLI command definition
 */
export interface CLICommandDefinition {
    readonly name: string;
    readonly description: string;
    readonly usage: string;
    readonly options: readonly CLIOption[];
    readonly examples: readonly string[];
    readonly category: 'session' | 'panel' | 'monitoring' | 'persistence' | 'scaling';
    readonly requiresSession: boolean;
    readonly requiresPanel: boolean;
}
/**
 * CLI option definition
 */
export interface CLIOption {
    readonly name: string;
    readonly alias?: string;
    readonly description: string;
    readonly type: 'string' | 'number' | 'boolean' | 'array';
    readonly required: boolean;
    readonly defaultValue?: unknown;
    readonly choices?: readonly string[];
}
/**
 * CLI execution context
 */
export interface CLIExecutionContext {
    readonly command: string;
    readonly args: readonly string[];
    readonly options: Record<string, unknown>;
    readonly currentDirectory: string;
    readonly environment: Record<string, string>;
    readonly sessionId?: SessionId;
    readonly panelId?: PanelId;
    readonly interactive: boolean;
    readonly outputFormat: 'json' | 'table' | 'plain' | 'yaml';
}
/**
 * CLI output formatter
 */
export interface CLIOutputFormatter {
    readonly format: CLIExecutionContext['outputFormat'];
    formatSuccess(data: unknown): string;
    formatError(error: {
        code: string;
        message: string;
        details?: unknown;
    }): string;
    formatTable(headers: readonly string[], rows: readonly (readonly unknown[])[]): string;
    formatList(items: readonly unknown[]): string;
}
/**
 * Interactive CLI session
 */
export interface InteractiveSession {
    readonly sessionId: string;
    readonly startTime: Date;
    readonly currentContext: CLIExecutionContext;
    readonly commandHistory: readonly string[];
    readonly isActive: boolean;
}
/**
 * CLI integration manager
 */
export declare class CLIIntegration extends EventEmitter {
    private readonly sessionManager;
    private readonly persistenceManager;
    private readonly commandDefinitions;
    private readonly outputFormatters;
    private readonly interactiveSessions;
    private readonly commandHistory;
    constructor(sessionManager: TMUXSessionManager, _scalingManager: SessionScalingManager, persistenceManager: SessionPersistenceManager);
    private initializeCommands;
    private initializeFormatters;
    /**
     * Execute CLI command
     */
    executeCommand(context: CLIExecutionContext): Promise<CLIOperationResult>;
    /**
     * Execute specific command based on type
     */
    private executeSpecificCommand;
    private executeCreateSession;
    private executeListSessions;
    private executeAttachSession;
    private executeKillSession;
    private executeSendKeys;
    private executeCapturePane;
    private executeSessionMetrics;
    private executeScaleSessions;
    private executeSaveSession;
    private executeRestoreSession;
    private validateCommandRequirements;
    private createErrorResult;
    private formatAsTable;
    private createTable;
    private formatTableAsPlain;
    /**
     * Register a new CLI command
     */
    registerCommand(definition: CLICommandDefinition): void;
    /**
     * Register an output formatter
     */
    registerFormatter(name: string, formatter: CLIOutputFormatter): void;
    /**
     * Start interactive CLI session
     */
    startInteractiveSession(context: CLIExecutionContext): InteractiveSession;
    /**
     * End interactive session
     */
    endInteractiveSession(sessionId: string): void;
    /**
     * Get available commands
     */
    getAvailableCommands(): readonly CLICommandDefinition[];
    /**
     * Get command help
     */
    getCommandHelp(commandName: string): CLICommandDefinition | null;
    /**
     * Get command usage
     */
    getCommandUsage(commandName: string): string;
    /**
     * Parse command line arguments into execution context
     */
    parseCommandLine(args: readonly string[]): CLIExecutionContext;
    /**
     * Get command history
     */
    getCommandHistory(): readonly CommandExecutionResult[];
}
//# sourceMappingURL=CLIIntegration.d.ts.map