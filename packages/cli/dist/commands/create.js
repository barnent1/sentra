"use strict";
// Sentra Evolutionary Agent System - Create Command
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = void 0;
const chalk_1 = require("chalk");
const ora_1 = require("ora");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const types_1 = require("../types");
const api_client_1 = require("../api-client");
const tmux_1 = require("../tmux");
/**
 * Create a new Sentra project
 */
const createCommand = async (options) => {
    const spinner = (0, ora_1.default)('Creating Sentra project...').start();
    try {
        // Validate project name
        const validationResult = validateProjectName(options.projectName);
        if (!validationResult.success) {
            spinner.fail(chalk_1.default.red('Project creation failed'));
            return {
                success: false,
                error: validationResult.error,
            };
        }
        // Check if directory already exists
        const projectPath = (0, path_1.resolve)(options.directory || process.cwd(), options.projectName);
        const directoryCheck = await checkDirectory(projectPath);
        if (!directoryCheck.success) {
            spinner.fail(chalk_1.default.red('Project creation failed'));
            return {
                success: false,
                error: directoryCheck.error,
            };
        }
        spinner.text = 'Communicating with Sentra API...';
        // Create project via API
        const createApiOptions = {
            directory: projectPath,
        };
        if (options.template) {
            createApiOptions.template = options.template;
        }
        const projectResult = await api_client_1.apiClient.createProject(options.projectName, createApiOptions);
        if (!projectResult.success) {
            spinner.fail(chalk_1.default.red('Failed to create project via API'));
            return projectResult;
        }
        const project = projectResult.data;
        spinner.text = 'Setting up project structure...';
        // Create project directory and basic structure
        const setupResult = await setupProjectStructure(projectPath, options.template);
        if (!setupResult.success) {
            spinner.fail(chalk_1.default.red('Failed to setup project structure'));
            return {
                success: false,
                error: setupResult.error,
            };
        }
        // Create TMUX session if enabled
        let tmuxSession;
        if (options.openSession !== false && tmux_1.tmuxService.isTmuxAvailable()) {
            spinner.text = 'Creating TMUX session...';
            const sessionName = `sentra-${options.projectName}`;
            const tmuxResult = await tmux_1.tmuxService.createSession(sessionName, 'echo "Welcome to Sentra Evolutionary Agent System!"', projectPath);
            if (tmuxResult.success) {
                tmuxSession = sessionName;
                // Send initial setup commands
                await tmux_1.tmuxService.sendCommand(sessionName, 'clear');
                await tmux_1.tmuxService.sendCommand(sessionName, `cd ${projectPath}`);
                await tmux_1.tmuxService.sendCommand(sessionName, 'ls -la');
            }
            else {
                spinner.warn(chalk_1.default.yellow('TMUX session creation failed, continuing without it'));
            }
        }
        const finalProject = {
            ...project,
            tmuxSession: tmuxSession || undefined,
        };
        spinner.succeed(chalk_1.default.green(`✅ Project '${options.projectName}' created successfully!`));
        // Show next steps
        console.log('\n' + chalk_1.default.cyan('📋 Next steps:'));
        console.log(`   cd ${projectPath}`);
        if (tmuxSession) {
            console.log(`   tmux attach-session -t ${tmuxSession}`);
            console.log('   or run: sentra status');
        }
        console.log('   sentra deploy --dry-run');
        console.log('\n' + chalk_1.default.dim('💡 Use "sentra status" to view all active projects'));
        return {
            success: true,
            data: finalProject,
        };
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Project creation failed'));
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error,
            },
        };
    }
};
exports.createCommand = createCommand;
/**
 * Validate project name
 */
const validateProjectName = (name) => {
    // Check if name is provided
    if (!name || name.trim().length === 0) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.INVALID_ARGUMENTS,
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
                code: types_1.CliErrorType.INVALID_ARGUMENTS,
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
                code: types_1.CliErrorType.INVALID_ARGUMENTS,
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
const checkDirectory = async (projectPath) => {
    try {
        // Check if directory already exists
        try {
            const contents = await (0, promises_1.readdir)(projectPath);
            if (contents.length > 0) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.PROJECT_ALREADY_EXISTS,
                        message: `Directory ${projectPath} already exists and is not empty`,
                        suggestions: [
                            'Choose a different project name',
                            'Remove the existing directory',
                            'Use --force to overwrite (if available)',
                        ],
                    },
                };
            }
        }
        catch {
            // Directory doesn't exist, which is good
        }
        return {
            success: true,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.PERMISSION_ERROR,
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
const setupProjectStructure = async (projectPath, template) => {
    try {
        // Create main directory
        await (0, promises_1.mkdir)(projectPath, { recursive: true });
        // Create basic structure based on template
        if (template === 'web-app') {
            await createWebAppStructure(projectPath);
        }
        else if (template === 'api') {
            await createApiStructure(projectPath);
        }
        else if (template === 'cli') {
            await createCliStructure(projectPath);
        }
        else {
            await createDefaultStructure(projectPath);
        }
        return {
            success: true,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.PERMISSION_ERROR,
                message: 'Failed to create project structure',
                details: error,
            },
        };
    }
};
/**
 * Create default project structure
 */
const createDefaultStructure = async (projectPath) => {
    // Create directories
    await (0, promises_1.mkdir)(`${projectPath}/src`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/tests`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/docs`, { recursive: true });
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
    await (0, promises_1.writeFile)(`${projectPath}/README.md`, readmeContent);
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
    await (0, promises_1.writeFile)(`${projectPath}/package.json`, JSON.stringify(packageJson, null, 2));
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
    await (0, promises_1.writeFile)(`${projectPath}/src/index.js`, indexContent);
};
/**
 * Create web app structure
 */
const createWebAppStructure = async (projectPath) => {
    await (0, promises_1.mkdir)(`${projectPath}/src/components`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/src/pages`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/src/styles`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/public`, { recursive: true });
    await createDefaultStructure(projectPath);
};
/**
 * Create API structure
 */
const createApiStructure = async (projectPath) => {
    await (0, promises_1.mkdir)(`${projectPath}/src/routes`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/src/middleware`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/src/models`, { recursive: true });
    await createDefaultStructure(projectPath);
};
/**
 * Create CLI structure
 */
const createCliStructure = async (projectPath) => {
    await (0, promises_1.mkdir)(`${projectPath}/src/commands`, { recursive: true });
    await (0, promises_1.mkdir)(`${projectPath}/bin`, { recursive: true });
    await createDefaultStructure(projectPath);
};
