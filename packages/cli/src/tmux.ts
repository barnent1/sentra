// Sentra Evolutionary Agent System - TMUX Integration
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces

import { execSync, spawn, ChildProcess } from 'child_process';
import type {
  TmuxSession,
  TmuxSessionName,
  TmuxWindow,
  TmuxPane,
  SessionId,
  CliResult,
} from './types';
import { TmuxStatus, CliErrorType } from './types';

/**
 * TMUX Service for session management
 */
export class TmuxService {
  private readonly tmuxCommand = 'tmux';

  /**
   * Check if TMUX is available on the system
   */
  public readonly isTmuxAvailable = (): boolean => {
    try {
      execSync('which tmux', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Create a new TMUX session
   */
  public readonly createSession = async (
    sessionName: TmuxSessionName,
    initialCommand?: string,
    workingDirectory?: string
  ): Promise<CliResult<TmuxSession>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: 'TMUX is not available on this system',
            suggestions: ['Install tmux: brew install tmux (macOS) or apt-get install tmux (Ubuntu)'],
          },
        };
      }

      // Check if session already exists
      const existingSession = await this.getSession(sessionName);
      if (existingSession.success && existingSession.data) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: `TMUX session '${sessionName}' already exists`,
            suggestions: ['Use a different session name or kill the existing session'],
          },
        };
      }

      // Build create session command
      const commands: string[] = ['new-session', '-d', '-s', sessionName];
      
      if (workingDirectory) {
        commands.push('-c', workingDirectory);
      }

      if (initialCommand) {
        commands.push(initialCommand);
      }

      // Create the session
      execSync(`${this.tmuxCommand} ${commands.join(' ')}`, { stdio: 'pipe' });

      // Get session details
      const session = await this.getSession(sessionName);
      return session;

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to create TMUX session',
          details: error,
        },
      };
    }
  };

  /**
   * Get information about a TMUX session
   */
  public readonly getSession = async (sessionName: TmuxSessionName): Promise<CliResult<TmuxSession>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: 'TMUX is not available on this system',
          },
        };
      }

      // Check if session exists
      try {
        execSync(`${this.tmuxCommand} has-session -t '${sessionName}'`, { stdio: 'pipe' });
      } catch {
        return {
          success: false,
          error: {
            code: CliErrorType.PROJECT_NOT_FOUND,
            message: `TMUX session '${sessionName}' not found`,
          },
        };
      }

      // Get session info
      const sessionInfo = execSync(
        `${this.tmuxCommand} display-message -t '${sessionName}' -p '#{session_name}:#{session_created}:#{session_activity}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim();

      const [, created, activity] = sessionInfo.split(':');
      
      // Get windows
      const windows = await this.getSessionWindows(sessionName);

      const session: TmuxSession = {
        id: sessionName as any as SessionId,
        name: sessionName,
        status: TmuxStatus.ACTIVE,
        windows: windows.success ? windows.data || [] : [],
        createdAt: new Date(parseInt(created || '0') * 1000),
        lastActivity: activity ? new Date(parseInt(activity) * 1000) : undefined,
      };

      return {
        success: true,
        data: session,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get TMUX session info',
          details: error,
        },
      };
    }
  };

  /**
   * List all TMUX sessions
   */
  public readonly listSessions = async (): Promise<CliResult<readonly TmuxSession[]>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: true,
          data: [],
        };
      }

      // Get list of sessions
      try {
        const sessionsOutput = execSync(
          `${this.tmuxCommand} list-sessions -F '#{session_name}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );

        const sessionNames = sessionsOutput.trim().split('\n').filter(name => name);
        const sessions: TmuxSession[] = [];

        for (const sessionName of sessionNames) {
          const sessionResult = await this.getSession(sessionName as TmuxSessionName);
          if (sessionResult.success && sessionResult.data) {
            sessions.push(sessionResult.data);
          }
        }

        return {
          success: true,
          data: sessions,
        };
      } catch {
        // No sessions found
        return {
          success: true,
          data: [],
        };
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to list TMUX sessions',
          details: error,
        },
      };
    }
  };

  /**
   * Kill a TMUX session
   */
  public readonly killSession = async (sessionName: TmuxSessionName): Promise<CliResult<void>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: 'TMUX is not available on this system',
          },
        };
      }

      // Check if session exists
      const sessionResult = await this.getSession(sessionName);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error,
        };
      }

      // Kill the session
      execSync(`${this.tmuxCommand} kill-session -t '${sessionName}'`, { stdio: 'pipe' });

      return {
        success: true,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to kill TMUX session',
          details: error,
        },
      };
    }
  };

  /**
   * Attach to a TMUX session (opens in current terminal)
   */
  public readonly attachSession = async (sessionName: TmuxSessionName): Promise<CliResult<ChildProcess>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: 'TMUX is not available on this system',
          },
        };
      }

      // Check if session exists
      const sessionResult = await this.getSession(sessionName);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error,
        };
      }

      // Spawn attach process
      const attachProcess = spawn(this.tmuxCommand, ['attach-session', '-t', sessionName], {
        stdio: 'inherit',
      });

      return {
        success: true,
        data: attachProcess,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to attach to TMUX session',
          details: error,
        },
      };
    }
  };

  /**
   * Send a command to a TMUX session
   */
  public readonly sendCommand = async (
    sessionName: TmuxSessionName,
    command: string,
    windowName?: string
  ): Promise<CliResult<void>> => {
    try {
      if (!this.isTmuxAvailable()) {
        return {
          success: false,
          error: {
            code: CliErrorType.TMUX_ERROR,
            message: 'TMUX is not available on this system',
          },
        };
      }

      // Build target
      const target = windowName ? `${sessionName}:${windowName}` : sessionName;

      // Send the command
      execSync(`${this.tmuxCommand} send-keys -t '${target}' '${command}' Enter`, { stdio: 'pipe' });

      return {
        success: true,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to send command to TMUX session',
          details: error,
        },
      };
    }
  };

  /**
   * Get windows for a session
   */
  private readonly getSessionWindows = async (
    sessionName: TmuxSessionName
  ): Promise<CliResult<readonly TmuxWindow[]>> => {
    try {
      const windowsOutput = execSync(
        `${this.tmuxCommand} list-windows -t '${sessionName}' -F '#{window_id}:#{window_name}:#{window_active}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const windows: TmuxWindow[] = [];
      const windowLines = windowsOutput.trim().split('\n').filter(line => line);

      for (const line of windowLines) {
        const parts = line.split(':');
        const [id, name, active] = [parts[0] || '', parts[1] || '', parts[2] || ''];
        
        // Get panes for this window
        const panesResult = await this.getWindowPanes(sessionName, id);
        
        windows.push({
          id,
          name,
          active: active === '1',
          panes: panesResult.success ? panesResult.data || [] : [],
        });
      }

      return {
        success: true,
        data: windows,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get session windows',
          details: error,
        },
      };
    }
  };

  /**
   * Get panes for a window
   */
  private readonly getWindowPanes = async (
    sessionName: TmuxSessionName,
    windowId: string
  ): Promise<CliResult<readonly TmuxPane[]>> => {
    try {
      const panesOutput = execSync(
        `${this.tmuxCommand} list-panes -t '${sessionName}:${windowId}' -F '#{pane_id}:#{pane_active}:#{pane_current_path}:#{pane_current_command}'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const panes: TmuxPane[] = [];
      const paneLines = panesOutput.trim().split('\n').filter(line => line);

      for (const line of paneLines) {
        const parts = line.split(':');
        const [id, active, currentPath, command] = [parts[0] || '', parts[1] || '', parts[2] || '~', parts[3]];
        
        panes.push({
          id,
          active: active === '1',
          currentPath: currentPath || '~',
          command: command || undefined,
        });
      }

      return {
        success: true,
        data: panes,
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: CliErrorType.TMUX_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get window panes',
          details: error,
        },
      };
    }
  };
}

/**
 * Singleton TMUX service instance
 */
export const tmuxService = new TmuxService();