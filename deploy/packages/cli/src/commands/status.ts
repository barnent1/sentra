// Sentra Evolutionary Agent System - Status Command
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

import chalk from 'chalk';
import boxen from 'boxen';
import type {
  StatusResult,
  CliResult,
  ProjectConfig,
  TmuxSession,
} from '../types';
import { ProjectStatus, TmuxStatus, CliErrorType } from '../types';
import { apiClient } from '../api-client';
import { tmuxService } from '../tmux';

/**
 * Display system and project status
 */
export const statusCommand = async (): Promise<CliResult<StatusResult>> => {
  try {
    console.log(chalk.cyan('📊 Sentra Evolutionary Agent System Status'));
    console.log('');

    // Get system status
    const systemStatusResult = await apiClient.getSystemStatus();
    let systemStatus = {
      healthy: false,
      version: 'unknown',
      uptime: 0,
    };

    if (systemStatusResult.success && systemStatusResult.data) {
      systemStatus = systemStatusResult.data;
    }

    // Get projects
    const projectsResult = await apiClient.listProjects();
    const projects: readonly ProjectConfig[] = projectsResult.success ? projectsResult.data || [] : [];

    // Get TMUX sessions
    const tmuxResult = await tmuxService.listSessions();
    const tmuxSessions: readonly TmuxSession[] = tmuxResult.success ? tmuxResult.data || [] : [];

    // Display system status
    displaySystemStatus(systemStatus);

    // Display projects status
    displayProjectsStatus(projects);

    // Display TMUX sessions status
    displayTmuxStatus(tmuxSessions);

    // Display summary
    displaySummary(projects, tmuxSessions, systemStatus);

    const result: StatusResult = {
      projects,
      tmuxSessions,
      systemStatus,
    };

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: CliErrorType.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Failed to get status',
        details: error,
      },
    };
  }
};

/**
 * Display system status section
 */
const displaySystemStatus = (systemStatus: {
  readonly healthy: boolean;
  readonly version: string;
  readonly uptime: number;
}): void => {
  const statusColor = systemStatus.healthy ? chalk.green : chalk.red;
  const statusIcon = systemStatus.healthy ? '✅' : '❌';
  const healthText = systemStatus.healthy ? 'Healthy' : 'Unhealthy';

  const uptimeText = formatUptime(systemStatus.uptime);

  console.log(chalk.bold('🏥 System Status'));
  console.log(`   Status: ${statusIcon} ${statusColor(healthText)}`);
  console.log(`   Version: ${chalk.blue(systemStatus.version)}`);
  console.log(`   Uptime: ${chalk.dim(uptimeText)}`);
  console.log('');
};

/**
 * Display projects status section
 */
const displayProjectsStatus = (projects: readonly ProjectConfig[]): void => {
  console.log(chalk.bold('📁 Projects'));
  
  if (projects.length === 0) {
    console.log(chalk.dim('   No projects found'));
    console.log(chalk.dim('   💡 Create a new project: sentra create my-project'));
  } else {
    projects.forEach((project, index) => {
      const statusColor = getProjectStatusColor(project.status);
      const statusIcon = getProjectStatusIcon(project.status);
      
      console.log(`   ${index + 1}. ${chalk.bold(project.name)}`);
      console.log(`      Status: ${statusIcon} ${statusColor(project.status)}`);
      console.log(`      Path: ${chalk.dim(project.path)}`);
      
      if (project.tmuxSession) {
        console.log(`      TMUX: ${chalk.cyan(project.tmuxSession)}`);
      }
      
      if (project.lastActiveAt) {
        const lastActive = formatTimeAgo(project.lastActiveAt);
        console.log(`      Last active: ${chalk.dim(lastActive)}`);
      }
      
      console.log('');
    });
  }
  
  console.log('');
};

/**
 * Display TMUX sessions status
 */
const displayTmuxStatus = (tmuxSessions: readonly TmuxSession[]): void => {
  if (!tmuxService.isTmuxAvailable()) {
    console.log(chalk.bold('🖥️  TMUX'));
    console.log(chalk.dim('   TMUX is not available on this system'));
    console.log('');
    return;
  }

  console.log(chalk.bold('🖥️  TMUX Sessions'));
  
  if (tmuxSessions.length === 0) {
    console.log(chalk.dim('   No active TMUX sessions'));
  } else {
    tmuxSessions.forEach((session, index) => {
      const statusColor = getTmuxStatusColor(session.status);
      const statusIcon = getTmuxStatusIcon(session.status);
      
      console.log(`   ${index + 1}. ${chalk.bold(session.name)}`);
      console.log(`      Status: ${statusIcon} ${statusColor(session.status)}`);
      console.log(`      Windows: ${chalk.cyan(session.windows.length.toString())}`);
      
      if (session.lastActivity) {
        const lastActivity = formatTimeAgo(session.lastActivity);
        console.log(`      Last activity: ${chalk.dim(lastActivity)}`);
      }
      
      // Show active windows
      const activeWindows = session.windows.filter(w => w.active);
      if (activeWindows.length > 0) {
        const activeWindow = activeWindows[0];
        if (activeWindow) {
          console.log(`      Active: ${chalk.green(activeWindow.name)} (${activeWindow.panes.length} panes)`);
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
const displaySummary = (
  projects: readonly ProjectConfig[],
  tmuxSessions: readonly TmuxSession[],
  systemStatus: { readonly healthy: boolean }
): void => {
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
  const activeTmuxSessions = tmuxSessions.filter(s => s.status === TmuxStatus.ACTIVE).length;
  
  const summaryBox = boxen([
    `${chalk.bold('📈 Summary')}`,
    '',
    `Total Projects: ${chalk.cyan(projects.length.toString())}`,
    `Active Projects: ${chalk.green(activeProjects.toString())}`,
    `TMUX Sessions: ${chalk.cyan(activeTmuxSessions.toString())}`,
    `System: ${systemStatus.healthy ? chalk.green('Healthy') : chalk.red('Unhealthy')}`,
    '',
    chalk.dim('💡 Use "sentra create <name>" to start a new project'),
    chalk.dim('🚀 Use "sentra deploy" to deploy improvements'),
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
const getProjectStatusColor = (status: string): (text: string) => string => {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return chalk.green;
    case ProjectStatus.CREATING:
      return chalk.yellow;
    case ProjectStatus.DEPLOYING:
      return chalk.blue;
    case ProjectStatus.ERROR:
      return chalk.red;
    case ProjectStatus.INACTIVE:
    default:
      return chalk.dim;
  }
};

/**
 * Get icon for project status
 */
const getProjectStatusIcon = (status: string): string => {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return '🟢';
    case ProjectStatus.CREATING:
      return '🟡';
    case ProjectStatus.DEPLOYING:
      return '🔵';
    case ProjectStatus.ERROR:
      return '🔴';
    case ProjectStatus.INACTIVE:
    default:
      return '⚪';
  }
};

/**
 * Get color for TMUX status
 */
const getTmuxStatusColor = (status: string): (text: string) => string => {
  switch (status) {
    case TmuxStatus.ACTIVE:
      return chalk.green;
    case TmuxStatus.NOT_FOUND:
      return chalk.red;
    case TmuxStatus.INACTIVE:
    default:
      return chalk.dim;
  }
};

/**
 * Get icon for TMUX status
 */
const getTmuxStatusIcon = (status: string): string => {
  switch (status) {
    case TmuxStatus.ACTIVE:
      return '🟢';
    case TmuxStatus.NOT_FOUND:
      return '🔴';
    case TmuxStatus.INACTIVE:
    default:
      return '⚪';
  }
};

/**
 * Format uptime in human-readable format
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Format time ago in human-readable format
 */
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
};