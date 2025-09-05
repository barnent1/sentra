"use strict";
// Sentra Evolutionary Agent System - Deploy Command
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployCommand = void 0;
const chalk_1 = require("chalk");
const ora_1 = require("ora");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const types_1 = require("../types");
const api_client_1 = require("../api-client");
/**
 * Deploy evolutionary system improvements
 */
const deployCommand = async (options) => {
    const spinner = (0, ora_1.default)('Initializing deployment...').start();
    try {
        // Determine project to deploy
        const projectResult = await determineProject(options.projectId);
        if (!projectResult.success) {
            spinner.fail(chalk_1.default.red('Deployment failed'));
            return {
                success: false,
                error: projectResult.error,
            };
        }
        const projectId = projectResult.data;
        if (!projectId) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.PROJECT_NOT_FOUND,
                    message: 'Project ID not found',
                },
            };
        }
        // Validate deployment prerequisites
        spinner.text = 'Validating deployment prerequisites...';
        const validationResult = await validateDeployment(projectId, options);
        if (!validationResult.success) {
            spinner.fail(chalk_1.default.red('Deployment validation failed'));
            return {
                success: false,
                error: validationResult.error,
            };
        }
        // Show dry run if requested
        if (options.dryRun) {
            return await showDryRun(projectId, options, spinner);
        }
        // Start deployment
        spinner.text = 'Starting deployment...';
        const deploymentResult = await api_client_1.apiClient.startDeployment(projectId, {
            environment: options.environment || 'development',
            force: options.force || false,
            dryRun: false,
        });
        if (!deploymentResult.success) {
            spinner.fail(chalk_1.default.red('Failed to start deployment'));
            return deploymentResult;
        }
        const deployment = deploymentResult.data;
        if (!deployment) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.API_ERROR,
                    message: 'Failed to get deployment data',
                },
            };
        }
        // Monitor deployment progress
        const monitorResult = await monitorDeployment(deployment, spinner);
        if (!monitorResult.success) {
            return monitorResult;
        }
        const finalDeployment = monitorResult.data;
        if (finalDeployment.status === types_1.DeploymentStatus.COMPLETED) {
            spinner.succeed(chalk_1.default.green('🚀 Deployment completed successfully!'));
            showDeploymentSuccess(finalDeployment);
        }
        else {
            spinner.fail(chalk_1.default.red('❌ Deployment failed'));
            showDeploymentFailure(finalDeployment);
        }
        return {
            success: finalDeployment.status === types_1.DeploymentStatus.COMPLETED,
            data: finalDeployment,
        };
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Deployment failed'));
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Deployment failed unexpectedly',
                details: error,
            },
        };
    }
};
exports.deployCommand = deployCommand;
/**
 * Determine which project to deploy
 */
const determineProject = async (projectId) => {
    try {
        // If project ID is provided, validate it exists
        if (projectId) {
            const projectResult = await api_client_1.apiClient.getProject(projectId);
            if (!projectResult.success) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.PROJECT_NOT_FOUND,
                        message: `Project with ID '${projectId}' not found`,
                        suggestions: ['Check project ID with "sentra status"'],
                    },
                };
            }
            return {
                success: true,
                data: projectId,
            };
        }
        // Try to detect project from current directory
        const currentProject = await detectCurrentProject();
        if (currentProject.success && currentProject.data) {
            return {
                success: true,
                data: currentProject.data,
            };
        }
        // Get list of projects and let user choose
        const projectsResult = await api_client_1.apiClient.listProjects();
        if (!projectsResult.success || !projectsResult.data || projectsResult.data.length === 0) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.PROJECT_NOT_FOUND,
                    message: 'No projects found',
                    suggestions: ['Create a project first: sentra create my-project'],
                },
            };
        }
        const projects = projectsResult.data;
        // If only one project, use it
        if (projects.length === 1) {
            const firstProject = projects[0];
            if (firstProject) {
                return {
                    success: true,
                    data: firstProject.id,
                };
            }
        }
        // Multiple projects - need user selection
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.INVALID_ARGUMENTS,
                message: 'Multiple projects found. Please specify which project to deploy.',
                suggestions: [
                    'Use: sentra deploy --project <project-id>',
                    'Or run from within a project directory',
                    'Check available projects: sentra status',
                ],
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Failed to determine project',
                details: error,
            },
        };
    }
};
/**
 * Detect current project from directory context
 */
const detectCurrentProject = async () => {
    try {
        const cwd = process.cwd();
        // Look for package.json with sentra configuration
        try {
            const packageJsonPath = (0, path_1.resolve)(cwd, 'package.json');
            const packageJsonContent = await (0, promises_1.readFile)(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            if (packageJson.sentra && packageJson.sentra.projectId) {
                return {
                    success: true,
                    data: packageJson.sentra.projectId,
                };
            }
        }
        catch {
            // No package.json or no sentra config
        }
        // Try to match by directory name and path
        const projectsResult = await api_client_1.apiClient.listProjects();
        if (projectsResult.success && projectsResult.data) {
            const currentProject = projectsResult.data.find(p => p.path === cwd);
            if (currentProject) {
                return {
                    success: true,
                    data: currentProject.id,
                };
            }
        }
        return {
            success: true,
            data: undefined,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Failed to detect current project',
                details: error,
            },
        };
    }
};
/**
 * Validate deployment prerequisites
 */
const validateDeployment = async (projectId, options) => {
    try {
        // Get project details
        const projectResult = await api_client_1.apiClient.getProject(projectId);
        if (!projectResult.success) {
            return {
                success: false,
                error: projectResult.error,
            };
        }
        const project = projectResult.data;
        // Check if project is in a deployable state
        if (project.status === 'creating' || project.status === 'deploying') {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.INVALID_ARGUMENTS,
                    message: `Project is currently ${project.status}. Cannot deploy at this time.`,
                    suggestions: ['Wait for the current operation to complete'],
                },
            };
        }
        // Environment-specific validations
        if (options.environment === 'production') {
            // Add production deployment validations
            console.log(chalk_1.default.yellow('⚠️  Deploying to production environment'));
            if (!options.force) {
                // In a real implementation, you might want to add confirmation prompts
                console.log(chalk_1.default.dim('Use --force to skip confirmations'));
            }
        }
        return {
            success: true,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Deployment validation failed',
                details: error,
            },
        };
    }
};
/**
 * Show dry run results
 */
const showDryRun = async (projectId, options, spinner) => {
    spinner.text = 'Analyzing deployment plan...';
    // Simulate dry run call
    const dryRunResult = await api_client_1.apiClient.startDeployment(projectId, {
        environment: options.environment || 'development',
        force: options.force || false,
        dryRun: true,
    });
    if (!dryRunResult.success) {
        spinner.fail(chalk_1.default.red('Dry run failed'));
        return dryRunResult;
    }
    const deployment = dryRunResult.data;
    spinner.succeed(chalk_1.default.green('📋 Deployment plan ready'));
    // Display deployment plan
    console.log('\n' + chalk_1.default.bold.cyan('🎯 Deployment Plan'));
    console.log(`   Project: ${chalk_1.default.white(projectId)}`);
    console.log(`   Environment: ${chalk_1.default.yellow(options.environment || 'development')}`);
    console.log(`   Version: ${chalk_1.default.blue(deployment.version)}`);
    console.log('');
    console.log(chalk_1.default.bold('📦 Changes to deploy:'));
    deployment.logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${chalk_1.default.dim(log)}`);
    });
    console.log('');
    console.log(chalk_1.default.green('✅ Dry run completed successfully'));
    console.log(chalk_1.default.dim('💡 Run without --dry-run to execute the deployment'));
    return {
        success: true,
        data: deployment,
    };
};
/**
 * Monitor deployment progress
 */
const monitorDeployment = async (deployment, spinner) => {
    let currentDeployment = deployment;
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    while (currentDeployment.status === types_1.DeploymentStatus.PENDING ||
        currentDeployment.status === types_1.DeploymentStatus.IN_PROGRESS) {
        // Check for timeout
        if (Date.now() - startTime > maxWaitTime) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.UNKNOWN_ERROR,
                    message: 'Deployment timeout',
                    suggestions: ['Check deployment status manually or try again'],
                },
            };
        }
        // Update spinner text based on logs
        if (currentDeployment.logs.length > 0) {
            const lastLog = currentDeployment.logs[currentDeployment.logs.length - 1];
            if (lastLog) {
                spinner.text = lastLog.substring(0, 50) + (lastLog.length > 50 ? '...' : '');
            }
        }
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Get updated deployment status
        const deploymentResult = await api_client_1.apiClient.getDeployment(currentDeployment.id);
        if (deploymentResult.success && deploymentResult.data) {
            currentDeployment = deploymentResult.data;
        }
    }
    return {
        success: true,
        data: currentDeployment,
    };
};
/**
 * Show deployment success information
 */
const showDeploymentSuccess = (deployment) => {
    console.log('\n' + chalk_1.default.green.bold('🎉 Deployment Successful!'));
    console.log(`   Deployment ID: ${chalk_1.default.dim(deployment.id)}`);
    console.log(`   Version: ${chalk_1.default.blue(deployment.version)}`);
    console.log(`   Environment: ${chalk_1.default.yellow('development')}`);
    if (deployment.completedAt) {
        const duration = deployment.completedAt.getTime() - deployment.startedAt.getTime();
        console.log(`   Duration: ${chalk_1.default.dim(formatDuration(duration))}`);
    }
    console.log('\n' + chalk_1.default.bold('📝 Deployment Summary:'));
    deployment.logs.slice(-5).forEach((log) => {
        console.log(`   ${chalk_1.default.green('✅')} ${chalk_1.default.dim(log)}`);
    });
    console.log('\n' + chalk_1.default.cyan('🚀 Your evolutionary system improvements are now live!'));
    console.log(chalk_1.default.dim('💡 Use "sentra status" to monitor system health'));
};
/**
 * Show deployment failure information
 */
const showDeploymentFailure = (deployment) => {
    console.log('\n' + chalk_1.default.red.bold('❌ Deployment Failed'));
    console.log(`   Deployment ID: ${chalk_1.default.dim(deployment.id)}`);
    console.log(`   Status: ${chalk_1.default.red(deployment.status)}`);
    console.log('\n' + chalk_1.default.bold('📝 Deployment Logs:'));
    deployment.logs.slice(-10).forEach((log) => {
        const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
        const icon = isError ? chalk_1.default.red('❌') : chalk_1.default.dim('ℹ️');
        const color = isError ? chalk_1.default.red : chalk_1.default.dim;
        console.log(`   ${icon} ${color(log)}`);
    });
    console.log('\n' + chalk_1.default.yellow('🔧 Troubleshooting Tips:'));
    console.log('   • Check deployment logs for specific error messages');
    console.log('   • Verify all prerequisites are met');
    console.log('   • Try deploying with --dry-run first');
    console.log('   • Contact support if the issue persists');
};
/**
 * Format duration in human-readable format
 */
const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
};
