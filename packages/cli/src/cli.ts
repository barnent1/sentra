#!/usr/bin/env node

// Sentra Evolutionary Agent System - CLI Tool
// Following SENTRA project standards: strict TypeScript with branded types

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import type {
  CreateOptions,
  DeployOptions,
  CliResult,
  ProjectId,
} from './types';
import { CliErrorType } from './types';
import { createCommand } from './commands/create';
import { statusCommand } from './commands/status';
import { deployCommand } from './commands/deploy';

/**
 * CLI Application class with strict TypeScript patterns
 */
export class SentraCli {
  private readonly program: Command;
  private readonly version = '1.0.0';

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  /**
   * Setup commander program configuration
   */
  private readonly setupProgram = (): void => {
    this.program
      .name('sentra')
      .description('Sentra Evolutionary Agent System - CLI for managing evolutionary AI agents')
      .version(this.version)
      .configureHelp({
        sortSubcommands: true,
        subcommandTerm: (cmd: Command) => cmd.name() + ' ' + cmd.usage(),
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
  private readonly setupCommands = (): void => {
    // Create command
    this.program
      .command('create <project-name>')
      .description('Create a new Sentra evolutionary agent project')
      .option('-t, --template <template>', 'project template (default, web-app, api, cli)', 'default')
      .option('-d, --directory <directory>', 'target directory', process.cwd())
      .option('--no-session', 'skip creating TMUX session')
      .action(async (projectName: string, options: {
        template?: string;
        directory?: string;
        session?: boolean;
      }) => {
        await this.handleCommand(async () => {
          const createOptions: CreateOptions = {
            projectName,
            template: options.template || undefined,
            directory: options.directory || undefined,
            openSession: options.session ?? true,
          };
          
          return await createCommand(createOptions);
        });
      });

    // Status command
    this.program
      .command('status')
      .description('Show status of projects, TMUX sessions, and system health')
      .action(async () => {
        await this.handleCommand(async () => {
          return await statusCommand();
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
      .action(async (options: {
        project?: string;
        environment?: 'development' | 'staging' | 'production';
        force?: boolean;
        dryRun?: boolean;
      }) => {
        await this.handleCommand(async () => {
          const deployOptions: DeployOptions = {
            projectId: options.project as ProjectId | undefined,
            environment: options.environment || undefined,
            force: options.force || undefined,
            dryRun: options.dryRun || undefined,
          };
          
          return await deployCommand(deployOptions);
        });
      });

    // Help command enhancement
    this.program
      .command('help [command]')
      .description('display help for command')
      .action((command?: string) => {
        if (command) {
          this.program.commands.find(cmd => cmd.name() === command)?.help();
        } else {
          this.showWelcome();
          this.program.help();
        }
      });
  };

  /**
   * Handle command execution with error handling
   */
  private readonly handleCommand = async (
    commandFn: () => Promise<CliResult<unknown>>
  ): Promise<void> => {
    try {
      const result = await commandFn();
      
      if (!result.success) {
        this.handleError(result.error);
        process.exit(1);
      }
    } catch (error) {
      this.handleError({
        code: CliErrorType.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error,
      });
      process.exit(1);
    }
  };

  /**
   * Handle and display errors
   */
  private readonly handleError = (error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown | undefined;
    readonly suggestions?: readonly string[] | undefined;
  }): void => {
    if (!error) {
      console.error(chalk.red('❌ An unknown error occurred'));
      return;
    }

    console.error(chalk.red(`❌ Error: ${error.message}`));
    
    if (error.code !== CliErrorType.UNKNOWN_ERROR) {
      console.error(chalk.dim(`   Code: ${error.code}`));
    }

    if (error.suggestions && error.suggestions.length > 0) {
      console.error('\n' + chalk.yellow('💡 Suggestions:'));
      error.suggestions.forEach(suggestion => {
        console.error(`   • ${chalk.dim(suggestion)}`);
      });
    }

    // Show debug info in verbose mode
    const globalOptions = this.program.opts();
    if (globalOptions['verbose'] && error.details) {
      console.error('\n' + chalk.dim('Debug information:'));
      console.error(chalk.dim(JSON.stringify(error.details, null, 2)));
    }
    
    console.error(''); // Empty line
  };

  /**
   * Show welcome message
   */
  private readonly showWelcome = (): void => {
    const welcome = boxen([
      chalk.bold.cyan('🧬 Sentra Evolutionary Agent System'),
      '',
      'CLI for managing evolutionary AI agents that adapt and improve over time.',
      '',
      chalk.dim('Quick start:'),
      chalk.dim('• sentra create my-project    - Create a new project'),
      chalk.dim('• sentra status               - View system status'),
      chalk.dim('• sentra deploy               - Deploy improvements'),
      '',
      chalk.blue('Visit sentra.cx for documentation and examples'),
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
  public readonly run = async (argv?: readonly string[]): Promise<void> => {
    try {
      // Show welcome message if no arguments provided
      const args = argv || process.argv;
      if (args.length <= 2) {
        this.showWelcome();
        this.program.help();
      }

      await this.program.parseAsync(args);
    } catch (error) {
      this.handleError({
        code: CliErrorType.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Failed to parse command',
        details: error,
      });
      process.exit(1);
    }
  };
}

/**
 * Main CLI entry point
 */
export const main = async (): Promise<void> => {
  const cli = new SentraCli();
  await cli.run();
};

// Execute if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ CLI execution failed:'), error);
    process.exit(1);
  });
}