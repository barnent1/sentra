#!/usr/bin/env node
"use strict";
// Sentra Evolutionary Agent System - CLI Tool
// Following SENTRA project standards: strict TypeScript with branded types
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.SentraCli = void 0;
const commander_1 = require("commander");
const chalk_1 = require("chalk");
const boxen_1 = require("boxen");
const types_1 = require("./types");
const create_1 = require("./commands/create");
const status_1 = require("./commands/status");
const deploy_1 = require("./commands/deploy");
/**
 * CLI Application class with strict TypeScript patterns
 */
class SentraCli {
    program;
    version = '1.0.0';
    constructor() {
        this.program = new commander_1.Command();
        this.setupProgram();
    }
    /**
     * Setup commander program configuration
     */
    setupProgram = () => {
        this.program
            .name('sentra')
            .description('Sentra Evolutionary Agent System - CLI for managing evolutionary AI agents')
            .version(this.version)
            .configureHelp({
            sortSubcommands: true,
            subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
        });
        // Add global options
        this.program
            .option('-v, --verbose', 'verbose output')
            .option('--api-url <url>', 'API endpoint URL', process.env['SENTRA_API_URL'] || 'http://localhost:8000/api/v1')
            .option('--no-color', 'disable colored output');
        this.setupCommands();
    };
    /**
     * Setup all CLI commands
     */
    setupCommands = () => {
        // Create command
        this.program
            .command('create <project-name>')
            .description('Create a new Sentra evolutionary agent project')
            .option('-t, --template <template>', 'project template (default, web-app, api, cli)', 'default')
            .option('-d, --directory <directory>', 'target directory', process.cwd())
            .option('--no-session', 'skip creating TMUX session')
            .action(async (projectName, options) => {
            await this.handleCommand(async () => {
                const createOptions = {
                    projectName,
                    template: options.template || undefined,
                    directory: options.directory || undefined,
                    openSession: options.session ?? true,
                };
                return await (0, create_1.createCommand)(createOptions);
            });
        });
        // Status command
        this.program
            .command('status')
            .description('Show status of projects, TMUX sessions, and system health')
            .action(async () => {
            await this.handleCommand(async () => {
                return await (0, status_1.statusCommand)();
            });
        });
        // Deploy command
        this.program
            .command('deploy')
            .description('Deploy evolutionary system improvements to sentra.cx')
            .option('-p, --project <project-id>', 'specific project ID to deploy')
            .option('-e, --environment <env>', 'deployment environment (development, staging, production)', 'development')
            .option('-f, --force', 'force deployment without confirmations')
            .option('--dry-run', 'preview deployment without executing')
            .action(async (options) => {
            await this.handleCommand(async () => {
                const deployOptions = {
                    projectId: options.project,
                    environment: options.environment || undefined,
                    force: options.force || undefined,
                    dryRun: options.dryRun || undefined,
                };
                return await (0, deploy_1.deployCommand)(deployOptions);
            });
        });
        // Help command enhancement
        this.program
            .command('help [command]')
            .description('display help for command')
            .action((command) => {
            if (command) {
                this.program.commands.find(cmd => cmd.name() === command)?.help();
            }
            else {
                this.showWelcome();
                this.program.help();
            }
        });
    };
    /**
     * Handle command execution with error handling
     */
    handleCommand = async (commandFn) => {
        try {
            const result = await commandFn();
            if (!result.success) {
                this.handleError(result.error);
                process.exit(1);
            }
        }
        catch (error) {
            this.handleError({
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
                details: error,
            });
            process.exit(1);
        }
    };
    /**
     * Handle and display errors
     */
    handleError = (error) => {
        if (!error) {
            console.error(chalk_1.default.red('❌ An unknown error occurred'));
            return;
        }
        console.error(chalk_1.default.red(`❌ Error: ${error.message}`));
        if (error.code !== types_1.CliErrorType.UNKNOWN_ERROR) {
            console.error(chalk_1.default.dim(`   Code: ${error.code}`));
        }
        if (error.suggestions && error.suggestions.length > 0) {
            console.error('\n' + chalk_1.default.yellow('💡 Suggestions:'));
            error.suggestions.forEach(suggestion => {
                console.error(`   • ${chalk_1.default.dim(suggestion)}`);
            });
        }
        // Show debug info in verbose mode
        const globalOptions = this.program.opts();
        if (globalOptions['verbose'] && error.details) {
            console.error('\n' + chalk_1.default.dim('Debug information:'));
            console.error(chalk_1.default.dim(JSON.stringify(error.details, null, 2)));
        }
        console.error(''); // Empty line
    };
    /**
     * Show welcome message
     */
    showWelcome = () => {
        const welcome = (0, boxen_1.default)([
            chalk_1.default.bold.cyan('🧬 Sentra Evolutionary Agent System'),
            '',
            'CLI for managing evolutionary AI agents that adapt and improve over time.',
            '',
            chalk_1.default.dim('Quick start:'),
            chalk_1.default.dim('• sentra create my-project    - Create a new project'),
            chalk_1.default.dim('• sentra status               - View system status'),
            chalk_1.default.dim('• sentra deploy               - Deploy improvements'),
            '',
            chalk_1.default.blue('Visit sentra.cx for documentation and examples'),
        ].join('\n'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
        });
        console.log(welcome);
    };
    /**
     * Parse and execute CLI arguments
     */
    run = async (argv) => {
        try {
            // Show welcome message if no arguments provided
            const args = argv || process.argv;
            if (args.length <= 2) {
                this.showWelcome();
                this.program.help();
            }
            await this.program.parseAsync(args);
        }
        catch (error) {
            this.handleError({
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Failed to parse command',
                details: error,
            });
            process.exit(1);
        }
    };
}
exports.SentraCli = SentraCli;
/**
 * Main CLI entry point
 */
const main = async () => {
    const cli = new SentraCli();
    await cli.run();
};
exports.main = main;
// Execute if called directly
if (require.main === module) {
    (0, exports.main)().catch(error => {
        console.error(chalk_1.default.red('❌ CLI execution failed:'), error);
        process.exit(1);
    });
}
