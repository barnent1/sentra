/**
 * TMUX CLI Integration
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class provides CLI integration hooks for TMUX session management,
 * enabling command-line operations and scripting support.
 */
import { EventEmitter } from 'events';
/**
 * CLI integration manager
 */
export class CLIIntegration extends EventEmitter {
    sessionManager;
    // private readonly scalingManager: SessionScalingManager;
    persistenceManager;
    commandDefinitions = new Map();
    outputFormatters = new Map();
    interactiveSessions = new Map();
    commandHistory = new Map();
    constructor(sessionManager, _scalingManager, persistenceManager) {
        super();
        this.sessionManager = sessionManager;
        // this.scalingManager = scalingManager;
        this.persistenceManager = persistenceManager;
        this.initializeCommands();
        this.initializeFormatters();
    }
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    initializeCommands() {
        // Session management commands
        this.registerCommand({
            name: 'create-session',
            description: 'Create a new TMUX session with 4-project grid layout',
            usage: 'tmux-sentra create-session [options]',
            category: 'session',
            requiresSession: false,
            requiresPanel: false,
            options: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Session name',
                    type: 'string',
                    required: false,
                },
                {
                    name: 'projects',
                    alias: 'p',
                    description: 'Comma-separated list of 4 project IDs',
                    type: 'array',
                    required: true,
                },
                {
                    name: 'agents',
                    alias: 'a',
                    description: 'Comma-separated list of 4 agent IDs',
                    type: 'array',
                    required: true,
                },
                {
                    name: 'layout',
                    alias: 'l',
                    description: 'Layout style',
                    type: 'string',
                    required: false,
                    choices: ['tiled', 'even-horizontal', 'even-vertical', 'main-horizontal'],
                    defaultValue: 'tiled',
                },
            ],
            examples: [
                'tmux-sentra create-session -p proj1,proj2,proj3,proj4 -a agent1,agent2,agent3,agent4',
                'tmux-sentra create-session -n my-session -p proj1,proj2,proj3,proj4 -a agent1,agent2,agent3,agent4 -l tiled',
            ],
        });
        this.registerCommand({
            name: 'list-sessions',
            description: 'List all active TMUX sessions',
            usage: 'tmux-sentra list-sessions [options]',
            category: 'session',
            requiresSession: false,
            requiresPanel: false,
            options: [
                {
                    name: 'format',
                    alias: 'f',
                    description: 'Output format',
                    type: 'string',
                    required: false,
                    choices: ['json', 'table', 'plain'],
                    defaultValue: 'table',
                },
                {
                    name: 'show-metrics',
                    description: 'Include session metrics',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
            ],
            examples: [
                'tmux-sentra list-sessions',
                'tmux-sentra list-sessions -f json --show-metrics',
            ],
        });
        this.registerCommand({
            name: 'attach-session',
            description: 'Attach to an existing TMUX session',
            usage: 'tmux-sentra attach-session <session-id> [options]',
            category: 'session',
            requiresSession: true,
            requiresPanel: false,
            options: [
                {
                    name: 'read-only',
                    description: 'Attach in read-only mode',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
            ],
            examples: [
                'tmux-sentra attach-session sess-123',
                'tmux-sentra attach-session sess-123 --read-only',
            ],
        });
        this.registerCommand({
            name: 'kill-session',
            description: 'Terminate a TMUX session',
            usage: 'tmux-sentra kill-session <session-id> [options]',
            category: 'session',
            requiresSession: true,
            requiresPanel: false,
            options: [
                {
                    name: 'force',
                    alias: 'f',
                    description: 'Force termination without confirmation',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
                {
                    name: 'save-state',
                    description: 'Save session state before termination',
                    type: 'boolean',
                    required: false,
                    defaultValue: true,
                },
            ],
            examples: [
                'tmux-sentra kill-session sess-123',
                'tmux-sentra kill-session sess-123 --force --no-save-state',
            ],
        });
        // Panel management commands
        this.registerCommand({
            name: 'send-keys',
            description: 'Send keystrokes to a panel',
            usage: 'tmux-sentra send-keys <session-id> <panel-id> <keys> [options]',
            category: 'panel',
            requiresSession: true,
            requiresPanel: true,
            options: [
                {
                    name: 'enter',
                    description: 'Send Enter key after the command',
                    type: 'boolean',
                    required: false,
                    defaultValue: true,
                },
                {
                    name: 'literal',
                    description: 'Send keys literally without interpretation',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
            ],
            examples: [
                'tmux-sentra send-keys sess-123 panel-456 "npm start"',
                'tmux-sentra send-keys sess-123 panel-456 "git status" --no-enter',
            ],
        });
        this.registerCommand({
            name: 'capture-pane',
            description: 'Capture content from a panel',
            usage: 'tmux-sentra capture-pane <session-id> <panel-id> [options]',
            category: 'panel',
            requiresSession: true,
            requiresPanel: true,
            options: [
                {
                    name: 'output',
                    alias: 'o',
                    description: 'Output file path',
                    type: 'string',
                    required: false,
                },
                {
                    name: 'lines',
                    alias: 'l',
                    description: 'Number of lines to capture',
                    type: 'number',
                    required: false,
                    defaultValue: 100,
                },
            ],
            examples: [
                'tmux-sentra capture-pane sess-123 panel-456',
                'tmux-sentra capture-pane sess-123 panel-456 -o output.txt -l 50',
            ],
        });
        // Monitoring commands
        this.registerCommand({
            name: 'session-metrics',
            description: 'Display session performance metrics',
            usage: 'tmux-sentra session-metrics <session-id> [options]',
            category: 'monitoring',
            requiresSession: true,
            requiresPanel: false,
            options: [
                {
                    name: 'watch',
                    alias: 'w',
                    description: 'Watch mode - continuously update metrics',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
                {
                    name: 'interval',
                    alias: 'i',
                    description: 'Update interval in seconds for watch mode',
                    type: 'number',
                    required: false,
                    defaultValue: 5,
                },
            ],
            examples: [
                'tmux-sentra session-metrics sess-123',
                'tmux-sentra session-metrics sess-123 --watch -i 2',
            ],
        });
        // Scaling commands
        this.registerCommand({
            name: 'scale-sessions',
            description: 'Scale sessions based on project count',
            usage: 'tmux-sentra scale-sessions <project-count> [options]',
            category: 'scaling',
            requiresSession: false,
            requiresPanel: false,
            options: [
                {
                    name: 'force',
                    description: 'Force scaling even if auto-scaling is disabled',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
            ],
            examples: [
                'tmux-sentra scale-sessions 12',
                'tmux-sentra scale-sessions 8 --force',
            ],
        });
        // Persistence commands
        this.registerCommand({
            name: 'save-session',
            description: 'Save session state to persistent storage',
            usage: 'tmux-sentra save-session <session-id> [options]',
            category: 'persistence',
            requiresSession: true,
            requiresPanel: false,
            options: [
                {
                    name: 'backup',
                    description: 'Create backup along with saving state',
                    type: 'boolean',
                    required: false,
                    defaultValue: false,
                },
            ],
            examples: [
                'tmux-sentra save-session sess-123',
                'tmux-sentra save-session sess-123 --backup',
            ],
        });
        this.registerCommand({
            name: 'restore-session',
            description: 'Restore session from persistent storage',
            usage: 'tmux-sentra restore-session <session-id> [options]',
            category: 'persistence',
            requiresSession: true,
            requiresPanel: false,
            options: [
                {
                    name: 'strategy',
                    description: 'Recovery strategy',
                    type: 'string',
                    required: false,
                    choices: ['full_restore', 'partial_restore', 'manual_restore', 'rebuild_from_scratch'],
                    defaultValue: 'full_restore',
                },
            ],
            examples: [
                'tmux-sentra restore-session sess-123',
                'tmux-sentra restore-session sess-123 --strategy partial_restore',
            ],
        });
    }
    initializeFormatters() {
        // JSON formatter
        this.registerFormatter('json', {
            format: 'json',
            formatSuccess: (data) => JSON.stringify(data, null, 2),
            formatError: (error) => JSON.stringify({ error }, null, 2),
            formatTable: (headers, rows) => JSON.stringify({ headers, rows }, null, 2),
            formatList: (items) => JSON.stringify(items, null, 2),
        });
        // Table formatter
        this.registerFormatter('table', {
            format: 'table',
            formatSuccess: (data) => this.formatAsTable(data),
            formatError: (error) => `Error: ${error.message}`,
            formatTable: (headers, rows) => this.createTable(headers, rows),
            formatList: (items) => items.map((item, index) => `${index + 1}. ${item}`).join('\n'),
        });
        // Plain text formatter
        this.registerFormatter('plain', {
            format: 'plain',
            formatSuccess: (data) => String(data),
            formatError: (error) => `Error: ${error.message}`,
            formatTable: (headers, rows) => this.formatTableAsPlain(headers, rows),
            formatList: (items) => items.join('\n'),
        });
    }
    // ============================================================================
    // COMMAND EXECUTION
    // ============================================================================
    /**
     * Execute CLI command
     */
    async executeCommand(context) {
        const startTime = Date.now();
        try {
            // Validate command
            const commandDef = this.commandDefinitions.get(context.command);
            if (!commandDef) {
                return this.createErrorResult(`Unknown command: ${context.command}`, startTime);
            }
            // Validate requirements
            const validationError = this.validateCommandRequirements(commandDef, context);
            if (validationError) {
                return this.createErrorResult(validationError, startTime);
            }
            // Execute command
            const result = await this.executeSpecificCommand(commandDef, context);
            // Format output
            const formatter = this.outputFormatters.get(context.outputFormat) || this.outputFormatters.get('plain');
            const formattedOutput = result.success
                ? formatter.formatSuccess(result.data)
                : formatter.formatError(result.error);
            return {
                ...result,
                data: formattedOutput,
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : String(error), startTime);
        }
    }
    /**
     * Execute specific command based on type
     */
    async executeSpecificCommand(_commandDef, context) {
        const { command, options } = context;
        switch (command) {
            case 'create-session':
                return this.executeCreateSession(options);
            case 'list-sessions':
                return this.executeListSessions(options);
            case 'attach-session':
                return this.executeAttachSession(context.sessionId, options);
            case 'kill-session':
                return this.executeKillSession(context.sessionId, options);
            case 'send-keys':
                return this.executeSendKeys(context.sessionId, context.panelId, options);
            case 'capture-pane':
                return this.executeCapturePane(context.sessionId, context.panelId, options);
            case 'session-metrics':
                return this.executeSessionMetrics(context.sessionId, options);
            case 'scale-sessions':
                return this.executeScaleSessions(options);
            case 'save-session':
                return this.executeSaveSession(context.sessionId, options);
            case 'restore-session':
                return this.executeRestoreSession(context.sessionId, options);
            default:
                throw new Error(`Command implementation not found: ${command}`);
        }
    }
    // ============================================================================
    // COMMAND IMPLEMENTATIONS
    // ============================================================================
    async executeCreateSession(options) {
        const projects = options['projects'];
        const agents = options['agents'];
        const sessionName = options['name'];
        const layout = options['layout'] || 'tiled';
        if (!projects || !agents) {
            throw new Error('Projects and agents must be specified');
        }
        if (projects.length !== 4 || agents.length !== 4) {
            throw new Error('Exactly 4 projects and 4 agents must be specified');
        }
        const sessionParams = {
            ...(sessionName && { sessionName }),
            projectIds: projects,
            agentIds: agents,
            layoutConfig: {
                layout: layout,
                panelSpacing: 1,
                borderStyle: 'single',
                statusLineEnabled: true,
                mouseEnabled: true,
                prefixKey: 'C-b',
            },
            persistenceEnabled: true,
        };
        const session = await this.sessionManager.createSession(sessionParams);
        return {
            success: true,
            data: {
                sessionId: session.id,
                sessionName: session.name,
                status: session.status,
                projectRange: session.projectRange,
                panels: session.window.panels.length,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeListSessions(options) {
        const showMetrics = options['showMetrics'] || false;
        const sessions = this.sessionManager.listSessions();
        const sessionData = await Promise.all(sessions.map(async (session) => {
            const baseData = {
                sessionId: session.id,
                name: session.name,
                status: session.status,
                projectRange: session.projectRange,
                panels: session.window.panels.length,
                createdAt: session.createdAt,
                lastActivityAt: session.lastActivityAt,
            };
            if (showMetrics) {
                const metrics = await this.sessionManager.getSessionMetrics(session.id);
                return { ...baseData, metrics };
            }
            return baseData;
        }));
        return {
            success: true,
            data: sessionData,
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeAttachSession(sessionId, options) {
        const readOnly = options['readOnly'] || false;
        // In a real implementation, this would open a new terminal attached to the session
        // For now, just validate that the session exists
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        // Simulate attachment
        await this.sessionManager.attachToSession(sessionId);
        return {
            success: true,
            data: {
                message: `Attached to session ${sessionId}${readOnly ? ' (read-only)' : ''}`,
                sessionId,
                sessionName: session.name,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeKillSession(sessionId, options) {
        // const _force = (options['force'] as boolean) || false;
        const saveState = options['saveState'] !== false; // Default true
        if (saveState) {
            await this.persistenceManager.saveSession(this.sessionManager.getSession(sessionId));
        }
        await this.sessionManager.destroySession(sessionId);
        return {
            success: true,
            data: {
                message: `Session ${sessionId} terminated${saveState ? ' (state saved)' : ''}`,
                sessionId,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeSendKeys(sessionId, panelId, options) {
        const keys = options['keys'];
        const sendEnter = options['enter'] !== false; // Default true
        const literal = options['literal'] || false;
        if (!keys) {
            throw new Error('Keys parameter is required');
        }
        const actualKeys = sendEnter && !literal ? `${keys}\n` : keys;
        await this.sessionManager.sendKeysToPanel(sessionId, panelId, actualKeys);
        return {
            success: true,
            data: {
                message: `Keys sent to panel ${panelId}`,
                keys: actualKeys,
                sessionId,
                panelId,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeCapturePane(sessionId, panelId, options) {
        const outputFile = options['output'];
        const lines = options['lines'] || 100;
        const content = await this.sessionManager.capturePanelContent(sessionId, panelId);
        const safeLines = Math.max(1, lines); // Ensure positive number
        const truncatedContent = content.split('\n').slice(-safeLines).join('\n');
        if (outputFile) {
            const fs = require('fs').promises;
            await fs.writeFile(outputFile, truncatedContent, 'utf8');
        }
        return {
            success: true,
            data: {
                content: outputFile ? `Content saved to ${outputFile}` : truncatedContent,
                lines: truncatedContent.split('\n').length,
                sessionId,
                panelId,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeSessionMetrics(sessionId, options) {
        const watch = options['watch'] || false;
        const interval = options['interval'] || 5;
        const metrics = await this.sessionManager.getSessionMetrics(sessionId);
        if (watch) {
            // In a real implementation, would start a watch mode
            console.log(`Starting watch mode for session ${sessionId} (interval: ${interval}s)`);
            console.log('Press Ctrl+C to exit');
        }
        return {
            success: true,
            data: metrics,
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeScaleSessions(options) {
        const projectCount = options['projectCount'];
        // const _force = (options['force'] as boolean) || false;
        if (typeof projectCount !== 'number') {
            throw new Error('Project count must be specified as a number');
        }
        const scaledSessions = await this.sessionManager.scaleSessionsForProjects(projectCount);
        return {
            success: true,
            data: {
                message: `Scaled to accommodate ${projectCount} projects`,
                scaledSessions: scaledSessions.length,
                sessionIds: scaledSessions,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeSaveSession(sessionId, options) {
        const createBackup = options['backup'] || false;
        const session = this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        await this.persistenceManager.saveSession(session);
        if (createBackup) {
            await this.persistenceManager.createBackup(sessionId);
        }
        return {
            success: true,
            data: {
                message: `Session ${sessionId} saved${createBackup ? ' (backup created)' : ''}`,
                sessionId,
            },
            executionTime: 0,
            timestamp: new Date(),
        };
    }
    async executeRestoreSession(sessionId, options) {
        const strategy = options['strategy'] || 'full_restore';
        const recoveryResult = await this.persistenceManager.recoverSession(sessionId, {
            strategy: strategy,
            priority: 'high',
            autoRetry: true,
            maxRetryAttempts: 3,
            retryDelay: 1000,
            verifyIntegrity: true,
            backupFallback: true,
        });
        const result = {
            success: recoveryResult.success,
            data: recoveryResult,
            executionTime: 0,
            timestamp: new Date(),
        };
        if (!recoveryResult.success) {
            result.error = {
                code: 'RECOVERY_FAILED',
                message: recoveryResult.errors.join(', '),
                details: recoveryResult,
            };
        }
        return result;
    }
    // ============================================================================
    // VALIDATION AND HELPERS
    // ============================================================================
    validateCommandRequirements(commandDef, context) {
        if (commandDef.requiresSession && !context.sessionId) {
            return `Command ${commandDef.name} requires a session ID`;
        }
        if (commandDef.requiresPanel && !context.panelId) {
            return `Command ${commandDef.name} requires a panel ID`;
        }
        // Validate required options
        for (const option of commandDef.options) {
            if (option.required && !(option.name in context.options)) {
                return `Required option --${option.name} is missing`;
            }
        }
        return null;
    }
    createErrorResult(message, startTime) {
        return {
            success: false,
            error: {
                code: 'CLI_ERROR',
                message,
            },
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
        };
    }
    // ============================================================================
    // OUTPUT FORMATTING
    // ============================================================================
    formatAsTable(data) {
        if (Array.isArray(data)) {
            if (data.length === 0)
                return 'No data';
            const firstItem = data[0];
            if (!firstItem)
                return 'No data';
            const headers = Object.keys(firstItem);
            const rows = data.map(item => headers.map(header => item[header]));
            return this.createTable(headers, rows);
        }
        if (typeof data === 'object' && data !== null) {
            const headers = ['Property', 'Value'];
            const rows = Object.entries(data).map(([key, value]) => [key, String(value)]);
            return this.createTable(headers, rows);
        }
        return String(data);
    }
    createTable(headers, rows) {
        // Simple table formatting - in a real implementation, would use a proper table library
        const maxWidths = headers.map((header, index) => {
            const columnValues = [header, ...rows.map(row => String(row[index] ?? ''))];
            return Math.max(...columnValues.map(val => val.length));
        });
        const headerRow = headers.map((header, index) => header.padEnd(maxWidths[index] ?? 0)).join(' | ');
        const separator = maxWidths.map(width => '-'.repeat(width)).join('-|-');
        const dataRows = rows.map(row => row.map((cell, index) => String(cell ?? '').padEnd(maxWidths[index] ?? 0)).join(' | '));
        return [headerRow, separator, ...dataRows].join('\n');
    }
    formatTableAsPlain(headers, rows) {
        return rows.map(row => headers.map((header, index) => `${header}: ${row[index] ?? ''}`).join(', ')).join('\n');
    }
    // ============================================================================
    // REGISTRATION METHODS
    // ============================================================================
    /**
     * Register a new CLI command
     */
    registerCommand(definition) {
        this.commandDefinitions.set(definition.name, definition);
        this.emit('command-registered', definition);
    }
    /**
     * Register an output formatter
     */
    registerFormatter(name, formatter) {
        this.outputFormatters.set(name, formatter);
        this.emit('formatter-registered', { name, format: formatter.format });
    }
    // ============================================================================
    // INTERACTIVE SESSIONS
    // ============================================================================
    /**
     * Start interactive CLI session
     */
    startInteractiveSession(context) {
        const sessionId = `interactive-${Date.now()}`;
        const session = {
            sessionId,
            startTime: new Date(),
            currentContext: context,
            commandHistory: [],
            isActive: true,
        };
        this.interactiveSessions.set(sessionId, session);
        this.emit('interactive-session-started', session);
        return session;
    }
    /**
     * End interactive session
     */
    endInteractiveSession(sessionId) {
        const session = this.interactiveSessions.get(sessionId);
        if (session) {
            this.interactiveSessions.delete(sessionId);
            this.emit('interactive-session-ended', session);
        }
    }
    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================
    /**
     * Get available commands
     */
    getAvailableCommands() {
        return Array.from(this.commandDefinitions.values());
    }
    /**
     * Get command help
     */
    getCommandHelp(commandName) {
        return this.commandDefinitions.get(commandName) || null;
    }
    /**
     * Get command usage
     */
    getCommandUsage(commandName) {
        const command = this.commandDefinitions.get(commandName);
        if (!command) {
            return `Unknown command: ${commandName}`;
        }
        let usage = `${command.usage}\n\n${command.description}\n\nOptions:\n`;
        for (const option of command.options) {
            const alias = option.alias ? ` (-${option.alias})` : '';
            const required = option.required ? ' [required]' : '';
            const defaultVal = option.defaultValue !== undefined ? ` (default: ${option.defaultValue})` : '';
            usage += `  --${option.name}${alias}${required}\n    ${option.description}${defaultVal}\n`;
        }
        if (command.examples.length > 0) {
            usage += '\nExamples:\n';
            for (const example of command.examples) {
                usage += `  ${example}\n`;
            }
        }
        return usage;
    }
    /**
     * Parse command line arguments into execution context
     */
    parseCommandLine(args) {
        const command = args[0];
        const restArgs = args.slice(1);
        const options = {};
        const positionalArgs = [];
        let i = 0;
        while (i < restArgs.length) {
            const arg = restArgs[i];
            if (!arg) {
                i += 1;
                continue;
            }
            if (arg.startsWith('--')) {
                const optionName = arg.substring(2);
                const nextArg = restArgs[i + 1];
                if (nextArg && !nextArg.startsWith('-')) {
                    options[optionName] = nextArg;
                    i += 2;
                }
                else {
                    options[optionName] = true;
                    i += 1;
                }
            }
            else if (arg.startsWith('-') && arg.length > 1) {
                const optionName = arg.substring(1);
                const nextArg = restArgs[i + 1];
                if (nextArg && !nextArg.startsWith('-')) {
                    options[optionName] = nextArg;
                    i += 2;
                }
                else {
                    options[optionName] = true;
                    i += 1;
                }
            }
            else {
                positionalArgs.push(arg);
                i += 1;
            }
        }
        // Extract session and panel IDs from positional args
        const sessionId = positionalArgs[0];
        const panelId = positionalArgs[1];
        const result = {
            command: command ?? 'help',
            args: positionalArgs,
            options,
            currentDirectory: process.cwd() ?? '/',
            environment: process.env,
            interactive: process.stdout.isTTY,
            outputFormat: options['format'] || 'table',
        };
        if (sessionId) {
            result.sessionId = sessionId;
        }
        if (panelId) {
            result.panelId = panelId;
        }
        return result;
    }
    /**
     * Get command history
     */
    getCommandHistory() {
        return Array.from(this.commandHistory.values());
    }
}
//# sourceMappingURL=CLIIntegration.js.map