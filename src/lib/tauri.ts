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
  progress: number;
  currentTask: string;
  muted: boolean;
  prNumber?: number;
  repoOwner?: string;
  repoName?: string;
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
  language: string;
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
        status: 'active' as const,
        progress: 65,
        currentTask: 'Implementing user profile page',
        muted: false,
      },
      {
        name: 'workcell',
        path: '~/projects/workcell',
        activeAgents: 1,
        totalIssues: 23,
        completedIssues: 8,
        monthlyCost: 28.60,
        status: 'active' as const,
        progress: 45,
        currentTask: 'Building checkout flow',
        muted: true,
      },
      {
        name: 'claude-code-base',
        path: '~/Projects/claude-code-base',
        activeAgents: 0,
        totalIssues: 15,
        completedIssues: 15,
        monthlyCost: 12.40,
        status: 'idle' as const,
        progress: 0,
        currentTask: '',
        muted: false,
      },
      {
        name: 'sentra',
        path: '~/Projects/claude-code-base/sentra',
        activeAgents: 0,
        totalIssues: 0,
        completedIssues: 0,
        monthlyCost: 0,
        status: 'idle' as const,
        progress: 0,
        currentTask: '',
        muted: false,
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
 * Get active agents from GitHub Actions workflows
 * Returns real data by querying GitHub Actions API via gh CLI
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
      language: 'en',
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
      language: 'en',
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

/**
 * Set mute state for a project
 */
export async function setProjectMuted(projectName: string, muted: boolean): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Setting ${projectName} muted to ${muted}`);
    return;
  }

  if (!tauriInvoke) {
    console.warn('Tauri not initialized yet');
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('set_project_muted', { projectName, muted });
  } catch (error) {
    console.error('Failed to set project muted state:', error);
    throw error;
  }
}

// ============================================================================
// Git Integration
// ============================================================================

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface GitStatus {
  currentBranch: string;
  ahead: number;
  behind: number;
  modifiedFiles: string[];
  stagedFiles: string[];
  untrackedFiles: string[];
}

export interface GitDiffFile {
  path: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'unknown';
}

export interface GitDiff {
  commitHash?: string;
  files: GitDiffFile[];
  totalAdditions: number;
  totalDeletions: number;
  patch: string;
}

/**
 * Get the last N commits from a git repository
 */
export async function getGitLog(projectPath: string, limit: number): Promise<GitCommit[]> {
  if (MOCK_MODE) {
    // Return mock data for browser development
    return [
      {
        hash: 'abc123def456',
        shortHash: 'abc123d',
        author: 'John Doe',
        email: 'john@example.com',
        date: '2025-11-13 15:30:00',
        message: 'feat: Add new feature\n\nThis is a detailed commit message.',
      },
      {
        hash: '789ghi012jkl',
        shortHash: '789ghi0',
        author: 'Jane Smith',
        email: 'jane@example.com',
        date: '2025-11-12 10:15:00',
        message: 'fix: Fix critical bug',
      },
    ];
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_git_log', { projectPath, limit });
  } catch (error) {
    console.error('Failed to get git log:', error);
    throw error;
  }
}

/**
 * Get git diff for a specific commit or unstaged changes
 */
export async function getGitDiff(projectPath: string, commitHash?: string): Promise<GitDiff> {
  if (MOCK_MODE) {
    // Return mock data for browser development
    return {
      commitHash: commitHash || undefined,
      files: [
        {
          path: 'src/components/Example.tsx',
          additions: 15,
          deletions: 3,
          status: 'modified',
        },
        {
          path: 'src/lib/new-feature.ts',
          additions: 42,
          deletions: 0,
          status: 'added',
        },
      ],
      totalAdditions: 57,
      totalDeletions: 3,
      patch: '--- a/src/components/Example.tsx\n+++ b/src/components/Example.tsx\n@@ -10,3 +10,15 @@\n...',
    };
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_git_diff', { projectPath, commitHash });
  } catch (error) {
    console.error('Failed to get git diff:', error);
    throw error;
  }
}

/**
 * Get current git status
 */
export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  if (MOCK_MODE) {
    // Return mock data for browser development
    return {
      currentBranch: 'main',
      ahead: 2,
      behind: 0,
      modifiedFiles: ['src/components/Example.tsx', 'README.md'],
      stagedFiles: ['src/lib/new-feature.ts'],
      untrackedFiles: ['temp.txt'],
    };
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_git_status', { projectPath });
  } catch (error) {
    console.error('Failed to get git status:', error);
    throw error;
  }
}

// ============================================================================
// Pull Request Management
// ============================================================================

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: string; // "open", "closed", "merged"
  author: string;
  createdAt: string;
  updatedAt: string;
  headBranch: string;
  baseBranch: string;
  mergeable: boolean;
  url: string;
  checksStatus: string; // "pending", "success", "failure"
}

export interface ReviewComment {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  path?: string;
  line?: number;
}

export interface PullRequestData {
  pr: PullRequest;
  comments: ReviewComment[];
}

/**
 * Get pull request data using gh CLI
 */
export async function getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestData> {
  if (MOCK_MODE) {
    return {
      pr: {
        number: prNumber,
        title: 'feat: Add in-app PR review functionality',
        body: 'This PR adds the ability to review and merge PRs without opening GitHub in browser.\n\n## Changes\n- Added PR review panel\n- Integrated with gh CLI\n- Dark theme UI',
        state: 'open',
        author: 'claude-agent',
        createdAt: '2025-11-13T15:00:00Z',
        updatedAt: '2025-11-13T16:30:00Z',
        headBranch: 'feature/pr-review',
        baseBranch: 'main',
        mergeable: true,
        url: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
        checksStatus: 'success',
      },
      comments: [
        {
          id: 1,
          author: 'code-reviewer',
          body: 'LGTM! Great work on the dark theme.',
          createdAt: '2025-11-13T16:00:00Z',
        },
      ],
    };
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_pull_request', { owner, repo, prNumber });
  } catch (error) {
    console.error('Failed to get pull request:', error);
    throw error;
  }
}

/**
 * Get PR diff using gh CLI
 */
export async function getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
  if (MOCK_MODE) {
    return `diff --git a/src/components/PRReviewPanel.tsx b/src/components/PRReviewPanel.tsx
new file mode 100644
index 0000000..abcdef1
--- /dev/null
+++ b/src/components/PRReviewPanel.tsx
@@ -0,0 +1,50 @@
+import { useState } from 'react';
+
+export function PRReviewPanel() {
+  const [isApproving, setIsApproving] = useState(false);
+
+  return (
+    <div className="bg-[#18181B] p-6">
+      <h2 className="text-xl text-[#FAFAFA]">PR Review</h2>
+    </div>
+  );
+}`;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_pr_diff', { owner, repo, prNumber });
  } catch (error) {
    console.error('Failed to get PR diff:', error);
    throw error;
  }
}

/**
 * Approve a pull request using gh CLI
 */
export async function approvePullRequest(owner: string, repo: string, prNumber: number, comment?: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Approving PR #${prNumber}${comment ? ` with comment: ${comment}` : ''}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('approve_pull_request', { owner, repo, prNumber, comment });
  } catch (error) {
    console.error('Failed to approve pull request:', error);
    throw error;
  }
}

/**
 * Request changes on a pull request using gh CLI
 */
export async function requestChangesPullRequest(owner: string, repo: string, prNumber: number, comment: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Requesting changes on PR #${prNumber} with comment: ${comment}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('request_changes_pull_request', { owner, repo, prNumber, comment });
  } catch (error) {
    console.error('Failed to request changes on pull request:', error);
    throw error;
  }
}

/**
 * Merge a pull request using gh CLI
 */
export async function mergePullRequest(owner: string, repo: string, prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase'): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Merging PR #${prNumber} using ${mergeMethod}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('merge_pull_request', { owner, repo, prNumber, mergeMethod });
  } catch (error) {
    console.error('Failed to merge pull request:', error);
    throw error;
  }
}

// ============================================================================
// Project Management
// ============================================================================

export interface CreateProjectParams {
  name: string;
  path: string;
  template: string;
}

export interface CreatedProject {
  name: string;
  path: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  files: TemplateFile[];
  directories: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
}

/**
 * Get all available templates
 */
export async function getTemplates(): Promise<Template[]> {
  if (MOCK_MODE) {
    return [
      {
        id: 'nextjs',
        name: 'Next.js',
        description: 'React framework with App Router, TypeScript, and Tailwind CSS',
        files: [],
        directories: [],
      },
      {
        id: 'python',
        name: 'Python (FastAPI)',
        description: 'Modern Python API with FastAPI, async support, and type hints',
        files: [],
        directories: [],
      },
      {
        id: 'react',
        name: 'React (Vite)',
        description: 'Fast React development with Vite, TypeScript, and Tailwind CSS',
        files: [],
        directories: [],
      },
    ];
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_templates_command');
  } catch (error) {
    console.error('Failed to get templates:', error);
    throw error;
  }
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(id: string): Promise<Template | null> {
  if (MOCK_MODE) {
    const templates = await getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_template_command', { id });
  } catch (error) {
    console.error('Failed to get template:', error);
    throw error;
  }
}

/**
 * Create a new project with Sentra configuration
 */
export async function createProject(params: CreateProjectParams): Promise<CreatedProject> {
  if (MOCK_MODE) {
    console.log(`[Mock] Creating project: ${params.name} at ${params.path}`);
    return {
      name: params.name,
      path: params.path,
    };
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('create_project', params);
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
}

/**
 * Open a directory picker dialog
 * Note: In production, this should use @tauri-apps/plugin-dialog
 * For now, using a mock implementation
 */
export async function selectDirectory(): Promise<string | null> {
  if (MOCK_MODE) {
    console.log('[Mock] Opening directory picker');
    return '/Users/test/projects';
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  // TODO: Install and use @tauri-apps/plugin-dialog
  // import { open } from '@tauri-apps/plugin-dialog';
  // const result = await open({ directory: true, multiple: false });
  // return result as string | null;

  // For now, return null to simulate cancelled dialog
  console.warn('Directory picker not yet implemented - install @tauri-apps/plugin-dialog');
  return null;
}

// ============================================================================
// Activity Feed
// ============================================================================

export type ActivityEventType = 'commit' | 'agent_start' | 'agent_complete' | 'build' | 'error';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  project: string;
  type: ActivityEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get recent activity events
 * Returns events from all projects or filtered by specific project
 */
export async function getActivityEvents(limit: number = 50, project?: string): Promise<ActivityEvent[]> {
  if (MOCK_MODE) {
    // Return mock activity events
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        project: 'sentra',
        type: 'commit',
        message: 'feat: add voice queue state',
        metadata: {
          author: 'Claude',
          hash: 'abc123d',
        },
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        project: 'sentra',
        type: 'agent_start',
        message: 'Agent started working on issue #42',
        metadata: {
          issue: 42,
          title: 'Implement voice queue',
        },
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        project: 'workcell',
        type: 'build',
        message: 'Build completed successfully',
        metadata: {
          duration: 45,
          status: 'success',
        },
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        project: 'sentra',
        type: 'error',
        message: 'Tests failing in checkout.test.ts',
        metadata: {
          severity: 'high',
          file: 'checkout.test.ts',
        },
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 10000).toISOString(),
        project: 'sentra',
        type: 'agent_complete',
        message: 'Agent completed issue #42',
        metadata: {
          issue: 42,
          duration: 28,
        },
      },
    ];
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('get_activity_events', { limit, project });
  } catch (error) {
    console.error('Failed to get activity events:', error);
    throw error;
  }
}

/**
 * Add a new activity event
 */
export async function addActivityEvent(
  project: string,
  eventType: ActivityEventType,
  message: string,
  metadata?: Record<string, unknown>
): Promise<ActivityEvent> {
  if (MOCK_MODE) {
    console.log(`[Mock] Adding activity event for ${project}: ${message}`);
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      project,
      type: eventType,
      message,
      metadata,
    };
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    return await tauriInvoke('add_activity_event', {
      project,
      eventType,
      message,
      metadata,
    });
  } catch (error) {
    console.error('Failed to add activity event:', error);
    throw error;
  }
}

// ============================================================================
// Agent Stream - Real-time agent output streaming
// ============================================================================

export interface AgentStreamLine {
  lineNumber: number;
  timestamp: string;
  content: string;
  agentId: string;
}

export interface GitHubLogLine {
  timestamp: string;
  message: string;
  level: string;
}

/**
 * Start streaming logs for a local agent (file watching)
 */
export async function startAgentStream(agentId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Starting agent stream for ${agentId}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('start_agent_stream', { agentId });
  } catch (error) {
    console.error('Failed to start agent stream:', error);
    throw error;
  }
}

/**
 * Stop streaming logs for an agent
 */
export async function stopAgentStream(agentId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Stopping agent stream for ${agentId}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('stop_agent_stream', { agentId });
  } catch (error) {
    console.error('Failed to stop agent stream:', error);
    throw error;
  }
}

/**
 * Stream logs from a GitHub Actions workflow (for remote agents)
 */
export async function streamGitHubWorkflowLogs(
  runId: number,
  agentId: string
): Promise<void> {
  if (MOCK_MODE) {
    console.log(`[Mock] Starting GitHub workflow log stream for ${agentId}`);
    return;
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    await tauriInvoke('stream_github_workflow_logs', { runId, agentId });
  } catch (error) {
    console.error('Failed to stream GitHub workflow logs:', error);
    throw error;
  }
}

/**
 * Get current log content for an agent
 */
export async function getAgentLogs(
  agentId: string,
  maxLines: number = 500
): Promise<AgentStreamLine[]> {
  if (MOCK_MODE) {
    console.log(`[Mock] Getting agent logs for ${agentId}`);
    return [
      {
        lineNumber: 1,
        timestamp: '14:32:15',
        content: 'Starting task: Implement feature',
        agentId,
      },
      {
        lineNumber: 2,
        timestamp: '14:32:18',
        content: 'Creating files...',
        agentId,
      },
    ];
  }

  if (!tauriInvoke) {
    throw new Error('Tauri not initialized');
  }

  try {
    const logs = await tauriInvoke('get_agent_logs', { agentId, maxLines });
    return logs as AgentStreamLine[];
  } catch (error) {
    console.error('Failed to get agent logs:', error);
    throw error;
  }
}
