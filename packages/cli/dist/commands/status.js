"use strict";
// Sentra Evolutionary Agent System - Status Command
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const chalk_1 = require("chalk");
const boxen_1 = require("boxen");
const types_1 = require("../types");
const api_client_1 = require("../api-client");
const tmux_1 = require("../tmux");
/**
 * Display system and project status
 */
const statusCommand = async () => {
    try {
        console.log(chalk_1.default.cyan('📊 Sentra Evolutionary Agent System Status'));
        console.log('');
        // Get system status
        const systemStatusResult = await api_client_1.apiClient.getSystemStatus();
        let systemStatus = {
            healthy: false,
            version: 'unknown',
            uptime: 0,
        };
        if (systemStatusResult.success && systemStatusResult.data) {
            systemStatus = systemStatusResult.data;
        }
        // Get projects
        const projectsResult = await api_client_1.apiClient.listProjects();
        const projects = projectsResult.success ? projectsResult.data || [] : [];
        // Get TMUX sessions
        const tmuxResult = await tmux_1.tmuxService.listSessions();
        const tmuxSessions = tmuxResult.success ? tmuxResult.data || [] : [];
        // Display system status
        displaySystemStatus(systemStatus);
        // Display projects status
        displayProjectsStatus(projects);
        // Display TMUX sessions status
        displayTmuxStatus(tmuxSessions);
        // Display summary
        displaySummary(projects, tmuxSessions, systemStatus);
        const result = {
            projects,
            tmuxSessions,
            systemStatus,
        };
        return {
            success: true,
            data: result,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: types_1.CliErrorType.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : 'Failed to get status',
                details: error,
            },
        };
    }
};
exports.statusCommand = statusCommand;
/**
 * Display system status section
 */
const displaySystemStatus = (systemStatus) => {
    const statusColor = systemStatus.healthy ? chalk_1.default.green : chalk_1.default.red;
    const statusIcon = systemStatus.healthy ? '✅' : '❌';
    const healthText = systemStatus.healthy ? 'Healthy' : 'Unhealthy';
    const uptimeText = formatUptime(systemStatus.uptime);
    console.log(chalk_1.default.bold('🏥 System Status'));
    console.log(`   Status: ${statusIcon} ${statusColor(healthText)}`);
    console.log(`   Version: ${chalk_1.default.blue(systemStatus.version)}`);
    console.log(`   Uptime: ${chalk_1.default.dim(uptimeText)}`);
    console.log('');
};
/**
 * Display projects status section
 */
const displayProjectsStatus = (projects) => {
    console.log(chalk_1.default.bold('📁 Projects'));
    if (projects.length === 0) {
        console.log(chalk_1.default.dim('   No projects found'));
        console.log(chalk_1.default.dim('   💡 Create a new project: sentra create my-project'));
    }
    else {
        projects.forEach((project, index) => {
            const statusColor = getProjectStatusColor(project.status);
            const statusIcon = getProjectStatusIcon(project.status);
            console.log(`   ${index + 1}. ${chalk_1.default.bold(project.name)}`);
            console.log(`      Status: ${statusIcon} ${statusColor(project.status)}`);
            console.log(`      Path: ${chalk_1.default.dim(project.path)}`);
            if (project.tmuxSession) {
                console.log(`      TMUX: ${chalk_1.default.cyan(project.tmuxSession)}`);
            }
            if (project.lastActiveAt) {
                const lastActive = formatTimeAgo(project.lastActiveAt);
                console.log(`      Last active: ${chalk_1.default.dim(lastActive)}`);
            }
            console.log('');
        });
    }
    console.log('');
};
/**
 * Display TMUX sessions status
 */
const displayTmuxStatus = (tmuxSessions) => {
    if (!tmux_1.tmuxService.isTmuxAvailable()) {
        console.log(chalk_1.default.bold('🖥️  TMUX'));
        console.log(chalk_1.default.dim('   TMUX is not available on this system'));
        console.log('');
        return;
    }
    console.log(chalk_1.default.bold('🖥️  TMUX Sessions'));
    if (tmuxSessions.length === 0) {
        console.log(chalk_1.default.dim('   No active TMUX sessions'));
    }
    else {
        tmuxSessions.forEach((session, index) => {
            const statusColor = getTmuxStatusColor(session.status);
            const statusIcon = getTmuxStatusIcon(session.status);
            console.log(`   ${index + 1}. ${chalk_1.default.bold(session.name)}`);
            console.log(`      Status: ${statusIcon} ${statusColor(session.status)}`);
            console.log(`      Windows: ${chalk_1.default.cyan(session.windows.length.toString())}`);
            if (session.lastActivity) {
                const lastActivity = formatTimeAgo(session.lastActivity);
                console.log(`      Last activity: ${chalk_1.default.dim(lastActivity)}`);
            }
            // Show active windows
            const activeWindows = session.windows.filter(w => w.active);
            if (activeWindows.length > 0) {
                const activeWindow = activeWindows[0];
                if (activeWindow) {
                    console.log(`      Active: ${chalk_1.default.green(activeWindow.name)} (${activeWindow.panes.length} panes)`);
                }
            }
            console.log('');
        });
    }
    console.log('');
};
/**
 * Display summary section
 */
const displaySummary = (projects, tmuxSessions, systemStatus) => {
    const activeProjects = projects.filter(p => p.status === types_1.ProjectStatus.ACTIVE).length;
    const activeTmuxSessions = tmuxSessions.filter(s => s.status === types_1.TmuxStatus.ACTIVE).length;
    const summaryBox = (0, boxen_1.default)([
        `${chalk_1.default.bold('📈 Summary')}`,
        '',
        `Total Projects: ${chalk_1.default.cyan(projects.length.toString())}`,
        `Active Projects: ${chalk_1.default.green(activeProjects.toString())}`,
        `TMUX Sessions: ${chalk_1.default.cyan(activeTmuxSessions.toString())}`,
        `System: ${systemStatus.healthy ? chalk_1.default.green('Healthy') : chalk_1.default.red('Unhealthy')}`,
        '',
        chalk_1.default.dim('💡 Use "sentra create <name>" to start a new project'),
        chalk_1.default.dim('🚀 Use "sentra deploy" to deploy improvements'),
    ].join('\n'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
    });
    console.log(summaryBox);
};
/**
 * Get color for project status
 */
const getProjectStatusColor = (status) => {
    switch (status) {
        case types_1.ProjectStatus.ACTIVE:
            return chalk_1.default.green;
        case types_1.ProjectStatus.CREATING:
            return chalk_1.default.yellow;
        case types_1.ProjectStatus.DEPLOYING:
            return chalk_1.default.blue;
        case types_1.ProjectStatus.ERROR:
            return chalk_1.default.red;
        case types_1.ProjectStatus.INACTIVE:
        default:
            return chalk_1.default.dim;
    }
};
/**
 * Get icon for project status
 */
const getProjectStatusIcon = (status) => {
    switch (status) {
        case types_1.ProjectStatus.ACTIVE:
            return '🟢';
        case types_1.ProjectStatus.CREATING:
            return '🟡';
        case types_1.ProjectStatus.DEPLOYING:
            return '🔵';
        case types_1.ProjectStatus.ERROR:
            return '🔴';
        case types_1.ProjectStatus.INACTIVE:
        default:
            return '⚪';
    }
};
/**
 * Get color for TMUX status
 */
const getTmuxStatusColor = (status) => {
    switch (status) {
        case types_1.TmuxStatus.ACTIVE:
            return chalk_1.default.green;
        case types_1.TmuxStatus.NOT_FOUND:
            return chalk_1.default.red;
        case types_1.TmuxStatus.INACTIVE:
        default:
            return chalk_1.default.dim;
    }
};
/**
 * Get icon for TMUX status
 */
const getTmuxStatusIcon = (status) => {
    switch (status) {
        case types_1.TmuxStatus.ACTIVE:
            return '🟢';
        case types_1.TmuxStatus.NOT_FOUND:
            return '🔴';
        case types_1.TmuxStatus.INACTIVE:
        default:
            return '⚪';
    }
};
/**
 * Format uptime in human-readable format
 */
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    else {
        return `${minutes}m`;
    }
};
/**
 * Format time ago in human-readable format
 */
const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    else {
        return 'just now';
    }
};
