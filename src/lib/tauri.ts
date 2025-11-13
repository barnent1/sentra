/**
 * Tauri IPC command wrappers
 * These functions call Rust backend commands via Tauri IPC
 */

// Dynamically import Tauri API only when available
let tauriInvoke: ((cmd: string, args?: any) => Promise<any>) | null = null;

// Initialize Tauri if available
if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  import('@tauri-apps/api/core').then(({ invoke }) => {
    tauriInvoke = invoke;
  }).catch(err => {
    console.error('Failed to load Tauri API:', err);
  });
}

// Set to false to use real Tauri commands, true for browser development
const MOCK_MODE = typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window);

// Log mode on initialization
if (typeof window !== 'undefined') {
  console.log(`[Tauri] Running in ${MOCK_MODE ? 'MOCK' : 'TAURI'} mode`);
  if (MOCK_MODE) {
    console.warn('[Tauri] Running in browser mode - settings will not persist. Please use the Tauri application window.');
  }
}

export interface SpecInfo {
  id: string;
  title: string;
  project: string;
  filePath: string;
  version: number;
  created: string;
  isLatest: boolean;
  isApproved: boolean;
  githubIssueUrl?: string;
}

export interface SpecVersion {
  version: number;
  file: string;
  created: string;
  size: number;
}

export interface Project {
  name: string;
  path: string;
  activeAgents: number;
  totalIssues: number;
  completedIssues: number;
  monthlyCost: number;
  status: 'active' | 'idle' | 'error';
  pendingSpec?: string;
  specs?: SpecInfo[];
}

export interface Agent {
  id: string;
  project: string;
  issue: number;
  title: string;
  description: string;
  phase: string;
  elapsedMinutes: number;
  cost: number;
  status: 'running' | 'completed' | 'failed';
}

export interface DashboardStats {
  activeAgents: number;
  totalProjects: number;
  todayCost: number;
  monthlyBudget: number;
  successRate: number;
}

export interface Settings {
  userName: string;
  voice: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
  notificationsEnabled: boolean;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  notifyOnStart: boolean;
}

/**
 * Get all tracked projects
 */
export async function getProjects(): Promise<Project[]> {
  if (MOCK_MODE) {
    return [
      {
        name: 'aidio',
        path: '~/projects/aidio',
        activeAgents: 1,
        totalIssues: 42,
        completedIssues: 12,
        monthlyCost: 45.20,
        status: 'active',
      },
      {
        name: 'workcell',
        path: '~/projects/workcell',
        activeAgents: 1,
        totalIssues: 23,
        completedIssues: 8,
        monthlyCost: 28.60,
        status: 'active',
      },
      {
        name: 'claude-code-base',
        path: '~/Projects/claude-code-base',
        activeAgents: 0,
        totalIssues: 15,
        completedIssues: 15,
        monthlyCost: 12.40,
        status: 'idle',
      },
      {
        name: 'sentra',
        path: '~/Projects/claude-code-base/sentra',
        activeAgents: 0,
        totalIssues: 0,
        completedIssues: 0,
        monthlyCost: 0,
        status: 'idle',
      },
    ];
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return [];
  }

  try {
    const result = await tauriInvoke('get_projects');
    return result;
  } catch (error) {
    console.error('Failed to get projects:', error);
    return [];
  }
}

/**
 * Get active agents
 */
export async function getActiveAgents(): Promise<Agent[]> {
  if (MOCK_MODE) {
    return [
      {
        id: 'aidio-42',
        project: 'aidio',
        issue: 42,
        title: 'Implementing user profile page',
        description: 'Add user profile page with edit functionality',
        phase: 'Phase 2: Implementation',
        elapsedMinutes: 12,
        cost: 2.40,
        status: 'running',
      },
      {
        id: 'workcell-23',
        project: 'workcell',
        issue: 23,
        title: 'Fix database migration bug',
        description: 'Database migration failing on fresh install',
        phase: 'Phase 3: Testing',
        elapsedMinutes: 5,
        cost: 1.20,
        status: 'running',
      },
    ];
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return [];
  }

  try {
    const result = await tauriInvoke('get_active_agents');
    return result;
  } catch (error) {
    console.error('Failed to get active agents:', error);
    return [];
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (MOCK_MODE) {
    return {
      activeAgents: 2,
      totalProjects: 4,
      todayCost: 12.40,
      monthlyBudget: 100.00,
      successRate: 94,
    };
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return {
      activeAgents: 0,
      totalProjects: 0,
      todayCost: 0,
      monthlyBudget: 100,
      successRate: 0,
    };
  }

  try {
    const result = await tauriInvoke('get_dashboard_stats');
    return result;
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return {
      activeAgents: 0,
      totalProjects: 0,
      todayCost: 0,
      monthlyBudget: 100,
      successRate: 0,
    };
  }
}

/**
 * Read telemetry logs
 */
export async function getTelemetryLogs(project: string, lines: number = 50): Promise<string[]> {
  if (MOCK_MODE) {
    return [
      `[2025-11-10 14:23:15] [${project}] [ai-agent] [INFO] Starting work on issue #42`,
      `[2025-11-10 14:23:18] [${project}] [ai-agent] [INFO] Phase 1: Analyzing issue`,
      `[2025-11-10 14:25:42] [${project}] [ai-agent] [INFO] Phase 2: Implementation`,
      `[2025-11-10 14:28:15] [${project}] [ai-agent] [INFO] API call #12`,
    ];
  }

  // TODO: Replace with actual Tauri command
  // const { invoke } = await import('@tauri-apps/api/tauri');
  // return await invoke<string[]>('get_telemetry_logs', { project, lines });

  return [];
}

/**
 * Stop an agent
 */
export async function stopAgent(agentId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Stopping agent: ${agentId}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return;
  }

  try {
    await tauriInvoke('stop_agent', { agentId });
  } catch (error) {
    console.error('Failed to stop agent:', error);
    throw error;
  }
}

/**
 * Get project learnings/memory
 */
export async function getProjectMemory(project: string): Promise<{
  gotchas: string;
  patterns: string;
  decisions: string;
}> {
  if (MOCK_MODE) {
    return {
      gotchas: '# Gotchas\n\n## Database Join Keys\nUse user_id for joins, not uuid.',
      patterns: '# Patterns\n\n## Database Access\nAlways use Prisma ORM.',
      decisions: '# Decisions\n\n## API Layer\nUsing tRPC for type-safe APIs.',
    };
  }

  // TODO: Replace with actual Tauri command
  // const { invoke } = await import('@tauri-apps/api/tauri');
  // return await invoke('get_project_memory', { project });

  return { gotchas: '', patterns: '', decisions: '' };
}

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  if (MOCK_MODE) {
    return {
      userName: 'Glen',
      voice: 'nova',
      openaiApiKey: '',
      anthropicApiKey: '',
      githubToken: '',
      githubRepoOwner: '',
      githubRepoName: '',
      notificationsEnabled: true,
      notifyOnCompletion: true,
      notifyOnFailure: true,
      notifyOnStart: false,
    };
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return {
      userName: '',
      voice: 'nova',
      openaiApiKey: '',
      anthropicApiKey: '',
      githubToken: '',
      githubRepoOwner: '',
      githubRepoName: '',
      notificationsEnabled: true,
      notifyOnCompletion: true,
      notifyOnFailure: true,
      notifyOnStart: false,
    };
  }

  try {
    const result = await tauriInvoke('get_settings');
    return result as Settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: Settings): Promise<void> {
  if (MOCK_MODE) {
    console.log('[Mock] Saving settings (not persisted - use Tauri app window):', settings);
    throw new Error('Settings cannot be saved in browser mode. Please use the Tauri application window.');
  }

  if (!tauriInvoke) {
    const error = 'Tauri not initialized yet';
    console.warn(error);
    throw new Error(error);
  }

  try {
    await tauriInvoke('save_settings', { settings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

/**
 * Speak a notification using TTS
 */
export async function speakNotification(message: string, voice: string, apiKey: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Speaking: "${message}" with voice "${voice}"`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return;
  }

  try {
    await tauriInvoke('speak_notification', { message, voice, apiKey });
  } catch (error) {
    console.error('Failed to speak notification:', error);
    throw error;
  }
}

export interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Chat with the Architect AI
 */
export async function chatWithArchitect(
  projectName: string,
  message: string,
  conversationHistory: ConversationMessage[],
  anthropicApiKey: string
): Promise<string> {
  if (MOCK_MODE) {
    console.log(`[Mock] Chatting with architect about ${projectName}: "${message}"`);
    return 'This is a mock response from the Architect AI. In production, this would use Claude API.';
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    const response = await tauriInvoke('chat_with_architect', {
      projectName,
      message,
      conversationHistory,
      anthropicApiKey,
    });
    return response as string;
  } catch (error) {
    console.error('Failed to chat with architect:', error);
    throw error;
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(audioData: Uint8Array, openaiApiKey: string): Promise<string> {
  if (MOCK_MODE) {
    console.log('[Mock] Transcribing audio...');
    return 'This is a mock transcription of the audio.';
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    const response = await tauriInvoke('transcribe_audio', {
      audioData: Array.from(audioData),
      openaiApiKey,
    });
    return response as string;
  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    throw error;
  }
}

/**
 * Get project context for AI conversations
 */
export async function getProjectContext(projectPath: string): Promise<string> {
  if (MOCK_MODE) {
    return `# Project Context for ${projectPath}

## Project Structure
- src/
- tests/
- README.md
- package.json

## README
A sample project for testing.`;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return '';
  }

  try {
    const context = await tauriInvoke('get_project_context', { projectPath });
    return context as string;
  } catch (error) {
    console.error('Failed to get project context:', error);
    return '';
  }
}

/**
 * Save a pending spec for a project
 */
export async function savePendingSpec(projectName: string, projectPath: string, spec: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Saving pending spec for ${projectName}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('save_pending_spec', { projectName, projectPath, spec });
  } catch (error) {
    console.error('Failed to save pending spec:', error);
    throw error;
  }
}

/**
 * Approve a spec
 */
export async function approveSpec(projectName: string, projectPath: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Approving spec for ${projectName}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('approve_spec', { projectName, projectPath });
  } catch (error) {
    console.error('Failed to approve spec:', error);
    throw error;
  }
}

/**
 * Reject a spec
 */
export async function rejectSpec(projectName: string, projectPath: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Rejecting spec for ${projectName}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('reject_spec', { projectName, projectPath });
  } catch (error) {
    console.error('Failed to reject spec:', error);
    throw error;
  }
}

/**
 * Create a GitHub issue from a spec using gh CLI
 */
export async function createGithubIssue(
  specTitle: string,
  specBody: string,
  labels: string[] = ['ai-feature']
): Promise<string> {
  if (MOCK_MODE) {
    console.log(`[Mock] Creating GitHub issue: ${specTitle}`);
    return 'https://github.com/example/repo/issues/123';
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    const issueUrl = await tauriInvoke('create_github_issue', {
      specTitle,
      specBody,
      labels,
    });
    return issueUrl as string;
  } catch (error) {
    console.error('Failed to create GitHub issue:', error);
    throw error;
  }
}

/**
 * Save a spec (creates new version or new spec)
 */
export async function saveSpec(
  projectName: string,
  projectPath: string,
  specContent: string,
  specTitle?: string
): Promise<SpecInfo> {
  if (MOCK_MODE) {
    console.log(`[Mock] Saving spec for ${projectName}:`, specTitle);
    return {
      id: 'mock-spec',
      title: specTitle || 'Mock Spec',
      project: projectName,
      filePath: `${projectPath}/.sentra/specs/mock-spec.spec.20251113.md`,
      version: 1,
      created: new Date().toISOString(),
      isLatest: true,
      isApproved: false,
    };
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    const specInfo = await tauriInvoke('save_spec', {
      projectName,
      projectPath,
      specContent,
      specTitle,
    });
    return specInfo as SpecInfo;
  } catch (error) {
    console.error('Failed to save spec:', error);
    throw error;
  }
}

/**
 * List all specs for a project
 */
export async function listSpecs(projectName: string, projectPath: string): Promise<SpecInfo[]> {
  if (MOCK_MODE) {
    console.log(`[Mock] Listing specs for ${projectName}`);
    return [];
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return [];
  }

  try {
    const specs = await tauriInvoke('list_specs', { projectName, projectPath });
    return specs as SpecInfo[];
  } catch (error) {
    console.error('Failed to list specs:', error);
    return [];
  }
}

/**
 * Get a specific spec (content + metadata)
 */
export async function getSpec(
  projectName: string,
  projectPath: string,
  specId: string,
  versionFile?: string
): Promise<{ content: string; info: SpecInfo }> {
  if (MOCK_MODE) {
    console.log(`[Mock] Getting spec ${specId} for ${projectName}`);
    return {
      content: '# Mock Spec\n\nThis is a mock specification.',
      info: {
        id: specId,
        title: 'Mock Spec',
        project: projectName,
        filePath: `${projectPath}/.sentra/specs/mock-spec.spec.20251113.md`,
        version: 1,
        created: new Date().toISOString(),
        isLatest: true,
        isApproved: false,
      },
    };
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    const [content, info] = await tauriInvoke('get_spec', {
      projectName,
      projectPath,
      specId,
      versionFile,
    });
    return { content: content as string, info: info as SpecInfo };
  } catch (error) {
    console.error('Failed to get spec:', error);
    throw error;
  }
}

/**
 * Get all versions for a specific spec
 */
export async function getSpecVersions(
  projectName: string,
  projectPath: string,
  specId: string
): Promise<SpecVersion[]> {
  if (MOCK_MODE) {
    console.log(`[Mock] Getting versions for spec ${specId}`);
    return [
      {
        version: 1,
        file: 'mock-spec.spec.20251113.md',
        created: new Date().toISOString(),
        size: 1024,
      },
    ];
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return [];
  }

  try {
    const versions = await tauriInvoke('get_spec_versions', {
      projectName,
      projectPath,
      specId,
    });
    return versions as SpecVersion[];
  } catch (error) {
    console.error('Failed to get spec versions:', error);
    return [];
  }
}

/**
 * Approve a specific version of a spec
 */
export async function approveSpecVersion(
  projectName: string,
  projectPath: string,
  specId: string,
  versionFile: string,
  githubIssueUrl?: string
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Approving spec ${specId} version ${versionFile}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('approve_spec_version', {
      projectName,
      projectPath,
      specId,
      versionFile,
      githubIssueUrl,
    });
  } catch (error) {
    console.error('Failed to approve spec version:', error);
    throw error;
  }
}

/**
 * Delete a spec or specific version
 */
export async function deleteSpec(
  projectName: string,
  projectPath: string,
  specId: string,
  versionFile?: string
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Deleting spec ${specId}${versionFile ? ` version ${versionFile}` : ''}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('delete_spec', {
      projectName,
      projectPath,
      specId,
      versionFile,
    });
  } catch (error) {
    console.error('Failed to delete spec:', error);
    throw error;
  }
}

/**
 * Migrate old pending-spec.md to new versioned structure
 */
export async function migratePendingSpec(
  projectName: string,
  projectPath: string
): Promise<SpecInfo | null> {
  if (MOCK_MODE) {
    console.log(`[Mock] Migrating pending spec for ${projectName}`);
    return null;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    return null;
  }

  try {
    const result = await tauriInvoke('migrate_pending_spec', {
      projectName,
      projectPath,
    });
    return result as SpecInfo | null;
  } catch (error) {
    console.error('Failed to migrate pending spec:', error);
    return null;
  }
}
