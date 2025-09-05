"use strict";
// Sentra Evolutionary Agent System - TMUX Integration
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmuxService = exports.TmuxService = void 0;
const child_process_1 = require("child_process");
const types_1 = require("./types");
/**
 * TMUX Service for session management
 */
class TmuxService {
    tmuxCommand = 'tmux';
    /**
     * Check if TMUX is available on the system
     */
    isTmuxAvailable = () => {
        try {
            (0, child_process_1.execSync)('which tmux', { stdio: 'pipe' });
            return true;
        }
        catch {
            return false;
        }
    };
    /**
     * Create a new TMUX session
     */
    createSession = async (sessionName, initialCommand, workingDirectory) => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.TMUX_ERROR,
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
                        code: types_1.CliErrorType.TMUX_ERROR,
                        message: `TMUX session '${sessionName}' already exists`,
                        suggestions: ['Use a different session name or kill the existing session'],
                    },
                };
            }
            // Build create session command
            const commands = ['new-session', '-d', '-s', sessionName];
            if (workingDirectory) {
                commands.push('-c', workingDirectory);
            }
            if (initialCommand) {
                commands.push(initialCommand);
            }
            // Create the session
            (0, child_process_1.execSync)(`${this.tmuxCommand} ${commands.join(' ')}`, { stdio: 'pipe' });
            // Get session details
            const session = await this.getSession(sessionName);
            return session;
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to create TMUX session',
                    details: error,
                },
            };
        }
    };
    /**
     * Get information about a TMUX session
     */
    getSession = async (sessionName) => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.TMUX_ERROR,
                        message: 'TMUX is not available on this system',
                    },
                };
            }
            // Check if session exists
            try {
                (0, child_process_1.execSync)(`${this.tmuxCommand} has-session -t '${sessionName}'`, { stdio: 'pipe' });
            }
            catch {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.PROJECT_NOT_FOUND,
                        message: `TMUX session '${sessionName}' not found`,
                    },
                };
            }
            // Get session info
            const sessionInfo = (0, child_process_1.execSync)(`${this.tmuxCommand} display-message -t '${sessionName}' -p '#{session_name}:#{session_created}:#{session_activity}'`, { encoding: 'utf8', stdio: 'pipe' }).trim();
            const [, created, activity] = sessionInfo.split(':');
            // Get windows
            const windows = await this.getSessionWindows(sessionName);
            const session = {
                id: sessionName,
                name: sessionName,
                status: types_1.TmuxStatus.ACTIVE,
                windows: windows.success ? windows.data || [] : [],
                createdAt: new Date(parseInt(created || '0') * 1000),
                lastActivity: activity ? new Date(parseInt(activity) * 1000) : undefined,
            };
            return {
                success: true,
                data: session,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to get TMUX session info',
                    details: error,
                },
            };
        }
    };
    /**
     * List all TMUX sessions
     */
    listSessions = async () => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: true,
                    data: [],
                };
            }
            // Get list of sessions
            try {
                const sessionsOutput = (0, child_process_1.execSync)(`${this.tmuxCommand} list-sessions -F '#{session_name}'`, { encoding: 'utf8', stdio: 'pipe' });
                const sessionNames = sessionsOutput.trim().split('\n').filter(name => name);
                const sessions = [];
                for (const sessionName of sessionNames) {
                    const sessionResult = await this.getSession(sessionName);
                    if (sessionResult.success && sessionResult.data) {
                        sessions.push(sessionResult.data);
                    }
                }
                return {
                    success: true,
                    data: sessions,
                };
            }
            catch {
                // No sessions found
                return {
                    success: true,
                    data: [],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to list TMUX sessions',
                    details: error,
                },
            };
        }
    };
    /**
     * Kill a TMUX session
     */
    killSession = async (sessionName) => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.TMUX_ERROR,
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
            (0, child_process_1.execSync)(`${this.tmuxCommand} kill-session -t '${sessionName}'`, { stdio: 'pipe' });
            return {
                success: true,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to kill TMUX session',
                    details: error,
                },
            };
        }
    };
    /**
     * Attach to a TMUX session (opens in current terminal)
     */
    attachSession = async (sessionName) => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.TMUX_ERROR,
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
            const attachProcess = (0, child_process_1.spawn)(this.tmuxCommand, ['attach-session', '-t', sessionName], {
                stdio: 'inherit',
            });
            return {
                success: true,
                data: attachProcess,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to attach to TMUX session',
                    details: error,
                },
            };
        }
    };
    /**
     * Send a command to a TMUX session
     */
    sendCommand = async (sessionName, command, windowName) => {
        try {
            if (!this.isTmuxAvailable()) {
                return {
                    success: false,
                    error: {
                        code: types_1.CliErrorType.TMUX_ERROR,
                        message: 'TMUX is not available on this system',
                    },
                };
            }
            // Build target
            const target = windowName ? `${sessionName}:${windowName}` : sessionName;
            // Send the command
            (0, child_process_1.execSync)(`${this.tmuxCommand} send-keys -t '${target}' '${command}' Enter`, { stdio: 'pipe' });
            return {
                success: true,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to send command to TMUX session',
                    details: error,
                },
            };
        }
    };
    /**
     * Get windows for a session
     */
    getSessionWindows = async (sessionName) => {
        try {
            const windowsOutput = (0, child_process_1.execSync)(`${this.tmuxCommand} list-windows -t '${sessionName}' -F '#{window_id}:#{window_name}:#{window_active}'`, { encoding: 'utf8', stdio: 'pipe' });
            const windows = [];
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to get session windows',
                    details: error,
                },
            };
        }
    };
    /**
     * Get panes for a window
     */
    getWindowPanes = async (sessionName, windowId) => {
        try {
            const panesOutput = (0, child_process_1.execSync)(`${this.tmuxCommand} list-panes -t '${sessionName}:${windowId}' -F '#{pane_id}:#{pane_active}:#{pane_current_path}:#{pane_current_command}'`, { encoding: 'utf8', stdio: 'pipe' });
            const panes = [];
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: types_1.CliErrorType.TMUX_ERROR,
                    message: error instanceof Error ? error.message : 'Failed to get window panes',
                    details: error,
                },
            };
        }
    };
}
exports.TmuxService = TmuxService;
/**
 * Singleton TMUX service instance
 */
exports.tmuxService = new TmuxService();
