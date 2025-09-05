// Sentra Evolutionary Agent System - Create Command
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

import chalk from 'chalk';
import ora from 'ora';
import { readdir, mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type {
  CreateOptions,
  CliResult,
  ProjectConfig,
  TmuxSessionName,
} from '../types';
import { CliErrorType } from '../types';
import { apiClient } from '../api-client';
import { tmuxService } from '../tmux';

/**
 * Create a new Sentra project
 */
export const createCommand = async (options: CreateOptions): Promise<CliResult<ProjectConfig>> => {
  const spinner = ora('Creating Sentra project...').start();

  try {
    // Validate project name
    const validationResult = validateProjectName(options.projectName);
    if (!validationResult.success) {
      spinner.fail(chalk.red('Project creation failed'));
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // Check if directory already exists
    const projectPath = resolve(options.directory || process.cwd(), options.projectName);
    const directoryCheck = await checkDirectory(projectPath);
    if (!directoryCheck.success) {
      spinner.fail(chalk.red('Project creation failed'));
      return {
        success: false,
        error: directoryCheck.error,
      };
    }

    spinner.text = 'Communicating with Sentra API...';

    // Create project via API
    const createApiOptions: { template?: string; directory?: string } = {
      directory: projectPath,
    };
    if (options.template) {
      createApiOptions.template = options.template;
    }
    
    const projectResult = await apiClient.createProject(options.projectName, createApiOptions);

    if (!projectResult.success) {
      spinner.fail(chalk.red('Failed to create project via API'));
      return projectResult;
    }

    const project = projectResult.data!;
    spinner.text = 'Setting up project structure...';

    // Create project directory and basic structure
    const setupResult = await setupProjectStructure(projectPath, options.template);
    if (!setupResult.success) {
      spinner.fail(chalk.red('Failed to setup project structure'));
      return {
        success: false,
        error: setupResult.error,
      };
    }

    // Create TMUX session if enabled
    let tmuxSession: TmuxSessionName | undefined;
    if (options.openSession !== false && tmuxService.isTmuxAvailable()) {
      spinner.text = 'Creating TMUX session...';
      
      const sessionName = `sentra-${options.projectName}` as TmuxSessionName;
      const tmuxResult = await tmuxService.createSession(
        sessionName,
        'echo "Welcome to Sentra Evolutionary Agent System!"',
        projectPath
      );

      if (tmuxResult.success) {
        tmuxSession = sessionName;
        // Send initial setup commands
        await tmuxService.sendCommand(sessionName, 'clear');
        await tmuxService.sendCommand(sessionName, `cd ${projectPath}`);
        await tmuxService.sendCommand(sessionName, 'ls -la');
      } else {
        spinner.warn(chalk.yellow('TMUX session creation failed, continuing without it'));
      }
    }

    const finalProject: ProjectConfig = {
      ...project,
      tmuxSession: tmuxSession || undefined,
    };

    spinner.succeed(chalk.green(`✅ Project '${options.projectName}' created successfully!`));

    // Show next steps
    console.log('\n' + chalk.cyan('📋 Next steps:'));
    console.log(`   cd ${projectPath}`);
    
    if (tmuxSession) {
      console.log(`   tmux attach-session -t ${tmuxSession}`);
      console.log('   or run: sentra status');
    }
    
    console.log('   sentra deploy --dry-run');
    console.log('\n' + chalk.dim('💡 Use "sentra status" to view all active projects'));

    return {
      success: true,
      data: finalProject,
    };

  } catch (error) {
    spinner.fail(chalk.red('Project creation failed'));
    
    return {
      success: false,
      error: {
        code: CliErrorType.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
    };
  }
};

/**
 * Validate project name
 */
const validateProjectName = (name: string): CliResult<void> => {
  // Check if name is provided
  if (!name || name.trim().length === 0) {
    return {
      success: false,
      error: {
        code: CliErrorType.INVALID_ARGUMENTS,
        message: 'Project name is required',
        suggestions: ['Provide a valid project name: sentra create my-project'],
      },
    };
  }

  // Check name format
  const validNameRegex = /^[a-z0-9-_]+$/i;
  if (!validNameRegex.test(name)) {
    return {
      success: false,
      error: {
        code: CliErrorType.INVALID_ARGUMENTS,
        message: 'Invalid project name format',
        suggestions: [
          'Use only letters, numbers, hyphens, and underscores',
          'Example: my-awesome-project',
        ],
      },
    };
  }

  // Check length
  if (name.length > 50) {
    return {
      success: false,
      error: {
        code: CliErrorType.INVALID_ARGUMENTS,
        message: 'Project name is too long (max 50 characters)',
        suggestions: ['Choose a shorter project name'],
      },
    };
  }

  return {
    success: true,
  };
};

/**
 * Check if directory is available
 */
const checkDirectory = async (projectPath: string): Promise<CliResult<void>> => {
  try {
    // Check if directory already exists
    try {
      const contents = await readdir(projectPath);
      if (contents.length > 0) {
        return {
          success: false,
          error: {
            code: CliErrorType.PROJECT_ALREADY_EXISTS,
            message: `Directory ${projectPath} already exists and is not empty`,
            suggestions: [
              'Choose a different project name',
              'Remove the existing directory',
              'Use --force to overwrite (if available)',
            ],
          },
        };
      }
    } catch {
      // Directory doesn't exist, which is good
    }

    return {
      success: true,
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: CliErrorType.PERMISSION_ERROR,
        message: 'Unable to access directory',
        details: error,
        suggestions: ['Check directory permissions'],
      },
    };
  }
};

/**
 * Setup basic project structure
 */
const setupProjectStructure = async (
  projectPath: string,
  template?: string
): Promise<CliResult<void>> => {
  try {
    // Create main directory
    await mkdir(projectPath, { recursive: true });

    // Create basic structure based on template
    if (template === 'web-app') {
      await createWebAppStructure(projectPath);
    } else if (template === 'api') {
      await createApiStructure(projectPath);
    } else if (template === 'cli') {
      await createCliStructure(projectPath);
    } else {
      await createDefaultStructure(projectPath);
    }

    return {
      success: true,
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: CliErrorType.PERMISSION_ERROR,
        message: 'Failed to create project structure',
        details: error,
      },
    };
  }
};

/**
 * Create default project structure
 */
const createDefaultStructure = async (projectPath: string): Promise<void> => {
  // Create directories
  await mkdir(`${projectPath}/src`, { recursive: true });
  await mkdir(`${projectPath}/tests`, { recursive: true });
  await mkdir(`${projectPath}/docs`, { recursive: true });

  // Create README
  const readmeContent = `# Sentra Evolutionary Agent Project

This project was created with the Sentra Evolutionary Agent System.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development: \`npm run dev\`
3. Run tests: \`npm test\`

## Sentra Commands

- \`sentra status\` - View project status
- \`sentra deploy\` - Deploy the project
- \`sentra deploy --dry-run\` - Preview deployment

## Learn More

Visit [sentra.cx](https://sentra.cx) for documentation and examples.
`;

  await writeFile(`${projectPath}/README.md`, readmeContent);

  // Create package.json
  const packageJson = {
    name: projectPath.split('/').pop(),
    version: '1.0.0',
    description: 'A Sentra Evolutionary Agent System project',
    main: 'src/index.js',
    scripts: {
      dev: 'echo "Development server - configure based on your project type"',
      build: 'echo "Build command - configure based on your project type"',
      test: 'echo "Test command - configure based on your project type"',
    },
    keywords: ['sentra', 'evolutionary', 'agents'],
    author: '',
    license: 'MIT',
  };

  await writeFile(`${projectPath}/package.json`, JSON.stringify(packageJson, null, 2));

  // Create basic source file
  const indexContent = `// Sentra Evolutionary Agent System Project
// Generated by Sentra CLI

console.log('Hello from Sentra! 🚀');

export default function main() {
  console.log('Your evolutionary agent system is ready to evolve!');
}

if (require.main === module) {
  main();
}
`;

  await writeFile(`${projectPath}/src/index.js`, indexContent);
};

/**
 * Create web app structure
 */
const createWebAppStructure = async (projectPath: string): Promise<void> => {
  await mkdir(`${projectPath}/src/components`, { recursive: true });
  await mkdir(`${projectPath}/src/pages`, { recursive: true });
  await mkdir(`${projectPath}/src/styles`, { recursive: true });
  await mkdir(`${projectPath}/public`, { recursive: true });
  await createDefaultStructure(projectPath);
};

/**
 * Create API structure  
 */
const createApiStructure = async (projectPath: string): Promise<void> => {
  await mkdir(`${projectPath}/src/routes`, { recursive: true });
  await mkdir(`${projectPath}/src/middleware`, { recursive: true });
  await mkdir(`${projectPath}/src/models`, { recursive: true });
  await createDefaultStructure(projectPath);
};

/**
 * Create CLI structure
 */
const createCliStructure = async (projectPath: string): Promise<void> => {
  await mkdir(`${projectPath}/src/commands`, { recursive: true });
  await mkdir(`${projectPath}/bin`, { recursive: true });
  await createDefaultStructure(projectPath);
};