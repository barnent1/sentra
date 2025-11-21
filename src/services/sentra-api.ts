/**
 * Sentra API Client
 * Typed wrappers for all backend API endpoints
 */

import { fetchWithAuth } from '@/services/api'

// Storage key prefix for localStorage (for client-only data)
const STORAGE_PREFIX = 'sentra_'

export interface SpecInfo {
  id: string
  title: string
  project: string
  filePath: string
  version: number
  created: string
  isLatest: boolean
  isApproved: boolean
  githubIssueUrl?: string
}

export interface SpecVersion {
  version: number
  file: string
  created: string
  size: number
}

export interface Project {
  name: string
  path: string
  activeAgents: number
  totalIssues: number
  completedIssues: number
  monthlyCost: number
  status: 'active' | 'idle' | 'error'
  pendingSpec?: string
  specs?: SpecInfo[]
  progress: number
  currentTask: string
  muted: boolean
  prNumber?: number
  repoOwner?: string
  repoName?: string
}

export interface Agent {
  id: string
  project: string
  issue: number
  title: string
  description: string
  phase: string
  elapsedMinutes: number
  cost: number
  status: 'running' | 'completed' | 'failed'
}

export interface DashboardStats {
  activeAgents: number
  totalProjects: number
  todayCost: number
  monthlyBudget: number
  successRate: number
}

export interface Settings {
  userName: string
  voice: string
  openaiApiKey: string
  anthropicApiKey: string
  githubToken: string
  githubRepoOwner: string
  githubRepoName: string
  notificationsEnabled: boolean
  notifyOnCompletion: boolean
  notifyOnFailure: boolean
  notifyOnStart: boolean
  language: string
}

// Helper to get from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

/**
 * Get all tracked projects
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetchWithAuth('/api/projects')

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform backend response to frontend Project format
    return data.projects.map((project: any) => ({
      name: project.name,
      path: project.path,
      activeAgents: 0, // Will be populated from agents API
      totalIssues: 0, // TODO: Add issues tracking
      completedIssues: 0, // TODO: Add issues tracking
      monthlyCost: project.totalCost || 0,
      status: 'idle' as const, // TODO: Determine from agents status
      progress: project.progress || 0,
      currentTask: '', // TODO: Get from current agent
      muted: false, // TODO: Add to backend
    }))
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

/**
 * Get active agents from GitHub Actions workflows
 */
export async function getActiveAgents(): Promise<Agent[]> {
  try {
    const response = await fetchWithAuth('/api/agents?status=running')

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform backend response to frontend Agent format
    return data.agents.map((agent: any) => ({
      id: agent.id,
      project: agent.projectId,
      issue: 0, // TODO: Add issue tracking
      title: '', // TODO: Add to backend
      description: '', // TODO: Add to backend
      phase: '', // TODO: Add to backend
      elapsedMinutes: 0, // Calculate from startTime
      cost: 0, // TODO: Calculate from costs
      status: agent.status,
    }))
  } catch (error) {
    console.error('Error fetching agents:', error)
    throw error
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetchWithAuth('/api/dashboard')

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      activeAgents: data.summary.activeAgents,
      totalProjects: data.summary.totalProjects,
      todayCost: data.summary.totalCosts, // TODO: Add daily filter
      monthlyBudget: 100.00, // TODO: Add to backend settings
      successRate: 94, // TODO: Calculate from agent success/failure ratio
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * Read telemetry logs
 */
export async function getTelemetryLogs(project: string, lines: number = 50): Promise<string[]> {
  // TODO: Implement backend endpoint for logs
  return [
    `[2025-11-20 14:23:15] [${project}] [ai-agent] [INFO] Starting work on issue #42`,
    `[2025-11-20 14:23:18] [${project}] [ai-agent] [INFO] Phase 1: Analyzing issue`,
    `[2025-11-20 14:25:42] [${project}] [ai-agent] [INFO] Phase 2: Implementation`,
    `[2025-11-20 14:28:15] [${project}] [ai-agent] [INFO] API call #12`,
  ]
}

/**
 * Stop an agent
 */
export async function stopAgent(agentId: string): Promise<void> {
  console.log(`[Web] Stopping agent: ${agentId}`)
  // TODO: Implement backend endpoint to stop agent
}

/**
 * Get project learnings/memory
 */
export async function getProjectMemory(project: string): Promise<{
  gotchas: string
  patterns: string
  decisions: string
}> {
  // TODO: Implement backend endpoint for project memory
  return {
    gotchas: '# Gotchas\n\n## Database Join Keys\nUse user_id for joins, not uuid.',
    patterns: '# Patterns\n\n## Database Access\nAlways use Prisma ORM.',
    decisions: '# Decisions\n\n## API Layer\nUsing tRPC for type-safe APIs.',
  }
}

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  try {
    const response = await fetchWithAuth('/api/settings')

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform backend response to frontend Settings format
    return {
      userName: data.userName || 'User',
      voice: data.voiceSettings?.voice || 'alloy',
      openaiApiKey: data.openaiApiKey || '',
      anthropicApiKey: data.anthropicApiKey || '',
      githubToken: data.githubToken || '',
      githubRepoOwner: data.githubRepoOwner || '',
      githubRepoName: data.githubRepoName || '',
      notificationsEnabled: data.notificationSettings?.enabled ?? true,
      notifyOnCompletion: data.notificationSettings?.onCompletion ?? true,
      notifyOnFailure: data.notificationSettings?.onFailure ?? true,
      notifyOnStart: data.notificationSettings?.onStart ?? false,
      language: data.language || 'en',
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Fallback to localStorage for settings
    return getFromStorage<Settings>('settings', {
      userName: 'Glen',
      voice: 'alloy',
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
    })
  }
}

/**
 * Save user settings
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    const response = await fetchWithAuth('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        openaiApiKey: settings.openaiApiKey || null,
        anthropicApiKey: settings.anthropicApiKey || null,
        githubToken: settings.githubToken || null,
        githubRepoOwner: settings.githubRepoOwner || null,
        githubRepoName: settings.githubRepoName || null,
        voiceSettings: {
          voice: settings.voice,
        },
        notificationSettings: {
          enabled: settings.notificationsEnabled,
          onCompletion: settings.notifyOnCompletion,
          onFailure: settings.notifyOnFailure,
          onStart: settings.notifyOnStart,
        },
        language: settings.language,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`)
    }

    console.log('[Web] Settings saved successfully')
  } catch (error) {
    console.error('Error saving settings:', error)
    // Fallback to localStorage
    saveToStorage('settings', settings)
    console.log('[Web] Settings saved to localStorage (API unavailable)')
  }
}

/**
 * Speak a notification using TTS
 */
export async function speakNotification(message: string, voice: string, apiKey: string): Promise<void> {
  console.log(`[Web] Speaking: "${message}" with voice "${voice}"`)
  // TODO: Implement TTS using OpenAI API
}

export interface ConversationMessage {
  role: string
  content: string
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
  console.log(`[Web] Chatting with architect about ${projectName}: "${message}"`)

  if (!anthropicApiKey) {
    throw new Error('Anthropic API key is required')
  }

  try {
    // Build messages array from conversation history
    const messages = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    // System prompt for the architect
    const systemPrompt = `You are Sentra, an AI architect assistant for the project "${projectName}".
You help developers plan and design features, review code, and provide technical guidance.
Be concise, technical, and practical. Focus on actionable advice.`

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 401) {
        throw new Error('Invalid Anthropic API key')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(
          errorData.error?.message || `API error: ${response.status} ${response.statusText}`
        )
      }
    }

    const data = await response.json()

    // Extract text content from response
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('Invalid response format from Anthropic API')
    }

    const textContent = data.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    if (!textContent) {
      throw new Error('No text content in response')
    }

    return textContent
  } catch (error) {
    console.error('Error calling Anthropic API:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Failed to communicate with Anthropic API')
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(audioData: Uint8Array, openaiApiKey: string): Promise<string> {
  console.log('[Web] Transcribing audio...')
  // TODO: Implement OpenAI Whisper API integration
  return 'This is a transcription of the audio.'
}

/**
 * Get project context for AI conversations
 */
export async function getProjectContext(projectPath: string): Promise<string> {
  // TODO: Implement backend endpoint to read project files
  return `# Project Context for ${projectPath}

## Project Structure
- src/
- tests/
- README.md
- package.json

## README
A sample project for testing.`
}

/**
 * Save a pending spec for a project
 */
export async function savePendingSpec(projectName: string, projectPath: string, spec: string): Promise<void> {
  console.log(`[Web] Saving pending spec for ${projectName}`)
  // TODO: Implement backend endpoint for specs
}

/**
 * Approve a spec
 */
export async function approveSpec(projectName: string, projectPath: string): Promise<void> {
  console.log(`[Web] Approving spec for ${projectName}`)
  // TODO: Implement backend endpoint for specs
}

/**
 * Reject a spec
 */
export async function rejectSpec(projectName: string, projectPath: string): Promise<void> {
  console.log(`[Web] Rejecting spec for ${projectName}`)
  // TODO: Implement backend endpoint for specs
}

/**
 * Create a GitHub issue from a spec using gh CLI
 */
export async function createGithubIssue(
  specTitle: string,
  specBody: string,
  labels: string[] = ['ai-feature']
): Promise<string> {
  console.log(`[Web] Creating GitHub issue: ${specTitle}`)
  // TODO: Implement backend endpoint to create GitHub issues
  return 'https://github.com/example/repo/issues/123'
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
  console.log(`[Web] Saving spec for ${projectName}:`, specTitle)
  // TODO: Implement backend endpoint for specs
  return {
    id: 'mock-spec',
    title: specTitle || 'Mock Spec',
    project: projectName,
    filePath: `${projectPath}/.sentra/specs/mock-spec.spec.20251113.md`,
    version: 1,
    created: new Date().toISOString(),
    isLatest: true,
    isApproved: false,
  }
}

/**
 * List all specs for a project
 */
export async function listSpecs(projectName: string, projectPath: string): Promise<SpecInfo[]> {
  console.log(`[Web] Listing specs for ${projectName}`)
  // TODO: Implement backend endpoint for specs
  return []
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
  console.log(`[Web] Getting spec ${specId} for ${projectName}`)
  // TODO: Implement backend endpoint for specs
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
  console.log(`[Web] Getting versions for spec ${specId}`)
  // TODO: Implement backend endpoint for specs
  return [
    {
      version: 1,
      file: 'mock-spec.spec.20251113.md',
      created: new Date().toISOString(),
      size: 1024,
    },
  ]
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
  console.log(`[Web] Approving spec ${specId} version ${versionFile}`)
  // TODO: Implement backend endpoint for specs
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
  console.log(`[Web] Deleting spec ${specId}${versionFile ? ` version ${versionFile}` : ''}`)
  // TODO: Implement backend endpoint for specs
}

/**
 * Migrate old pending-spec.md to new versioned structure
 */
export async function migratePendingSpec(
  projectName: string,
  projectPath: string
): Promise<SpecInfo | null> {
  console.log(`[Web] Migrating pending spec for ${projectName}`)
  // TODO: Implement backend endpoint for specs
  return null
}

/**
 * Set mute state for a project
 */
export async function setProjectMuted(projectName: string, muted: boolean): Promise<void> {
  console.log(`[Web] Setting ${projectName} muted to ${muted}`)
  // TODO: Implement backend endpoint for project settings
}

// ============================================================================
// Git Integration
// ============================================================================

export interface GitCommit {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
}

export interface GitStatus {
  currentBranch: string
  ahead: number
  behind: number
  modifiedFiles: string[]
  stagedFiles: string[]
  untrackedFiles: string[]
}

export interface GitDiffFile {
  path: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'unknown'
}

export interface GitDiff {
  commitHash?: string
  files: GitDiffFile[]
  totalAdditions: number
  totalDeletions: number
  patch: string
}

/**
 * Get the last N commits from a git repository
 */
export async function getGitLog(projectPath: string, limit: number): Promise<GitCommit[]> {
  // TODO: Implement backend endpoint for git log
  return [
    {
      hash: 'abc123def456',
      shortHash: 'abc123d',
      author: 'John Doe',
      email: 'john@example.com',
      date: '2025-11-20 15:30:00',
      message: 'feat: Add new feature\n\nThis is a detailed commit message.',
    },
    {
      hash: '789ghi012jkl',
      shortHash: '789ghi0',
      author: 'Jane Smith',
      email: 'jane@example.com',
      date: '2025-11-19 10:15:00',
      message: 'fix: Fix critical bug',
    },
  ]
}

/**
 * Get git diff for a specific commit or unstaged changes
 */
export async function getGitDiff(projectPath: string, commitHash?: string): Promise<GitDiff> {
  // TODO: Implement backend endpoint for git diff
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
  }
}

/**
 * Get current git status
 */
export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  // TODO: Implement backend endpoint for git status
  return {
    currentBranch: 'main',
    ahead: 2,
    behind: 0,
    modifiedFiles: ['src/components/Example.tsx', 'README.md'],
    stagedFiles: ['src/lib/new-feature.ts'],
    untrackedFiles: ['temp.txt'],
  }
}

// ============================================================================
// Pull Request Management
// ============================================================================

export interface PullRequest {
  number: number
  title: string
  body: string
  state: string
  author: string
  createdAt: string
  updatedAt: string
  headBranch: string
  baseBranch: string
  mergeable: boolean
  url: string
  checksStatus: string
}

export interface ReviewComment {
  id: number
  author: string
  body: string
  createdAt: string
  path?: string
  line?: number
}

export interface PullRequestData {
  pr: PullRequest
  comments: ReviewComment[]
}

/**
 * Get pull request data from GitHub API via backend
 */
export async function getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestData> {
  try {
    const response = await fetchWithAuth(`/api/github/pr/${owner}/${repo}/${prNumber}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to fetch PR: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching PR:', error)
    throw error
  }
}

/**
 * Get PR diff from GitHub API via backend
 */
export async function getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
  try {
    const response = await fetchWithAuth(`/api/github/pr/${owner}/${repo}/${prNumber}/diff`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to fetch PR diff: ${response.statusText}`)
    }

    const data = await response.json()
    return data.diff
  } catch (error) {
    console.error('Error fetching PR diff:', error)
    throw error
  }
}

/**
 * Approve a pull request via GitHub API
 */
export async function approvePullRequest(owner: string, repo: string, prNumber: number, comment?: string): Promise<void> {
  try {
    const response = await fetchWithAuth(`/api/github/pr/${owner}/${repo}/${prNumber}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to approve PR: ${response.statusText}`)
    }

    console.log(`[Web] Approved PR #${prNumber}`)
  } catch (error) {
    console.error('Error approving PR:', error)
    throw error
  }
}

/**
 * Request changes on a pull request via GitHub API
 */
export async function requestChangesPullRequest(owner: string, repo: string, prNumber: number, comment: string): Promise<void> {
  try {
    const response = await fetchWithAuth(`/api/github/pr/${owner}/${repo}/${prNumber}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to request changes: ${response.statusText}`)
    }

    console.log(`[Web] Requested changes on PR #${prNumber}`)
  } catch (error) {
    console.error('Error requesting changes:', error)
    throw error
  }
}

/**
 * Merge a pull request via GitHub API
 */
export async function mergePullRequest(owner: string, repo: string, prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase'): Promise<void> {
  try {
    const response = await fetchWithAuth(`/api/github/pr/${owner}/${repo}/${prNumber}/merge`, {
      method: 'POST',
      body: JSON.stringify({ mergeMethod }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to merge PR: ${response.statusText}`)
    }

    console.log(`[Web] Merged PR #${prNumber} using ${mergeMethod}`)
  } catch (error) {
    console.error('Error merging PR:', error)
    throw error
  }
}

// ============================================================================
// Project Management
// ============================================================================

export interface CreateProjectParams {
  name: string
  path: string
  template: string
}

export interface CreatedProject {
  name: string
  path: string
}

export interface Template {
  id: string
  name: string
  description: string
  files: TemplateFile[]
  directories: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

export interface TemplateFile {
  path: string
  content: string
}

/**
 * Get all available templates
 */
export async function getTemplates(): Promise<Template[]> {
  // TODO: Implement backend endpoint for templates
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
  ]
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(id: string): Promise<Template | null> {
  const templates = await getTemplates()
  return templates.find(t => t.id === id) || null
}

export interface GitHubRepository {
  name: string
  fullName: string
  url: string
  cloneUrl: string
  sshUrl: string
  owner: string
  private: boolean
  description: string | null
}

export interface CreateGitHubRepoParams {
  name: string
  owner?: string
  description?: string
  private?: boolean
}

/**
 * Create a new GitHub repository from Sentra template
 * Uses the Barnhardt-Enterprises-Inc/sentra-template-nextjs template
 */
export async function createGitHubRepo(params: CreateGitHubRepoParams): Promise<GitHubRepository> {
  try {
    const response = await fetchWithAuth('/api/github/repos', {
      method: 'POST',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create GitHub repository: ${response.statusText}`)
    }

    const data = await response.json()
    return data.repository
  } catch (error) {
    console.error('Error creating GitHub repository:', error)
    throw error
  }
}

/**
 * Create a new project with Sentra configuration
 */
export async function createProject(params: CreateProjectParams): Promise<CreatedProject> {
  try {
    const response = await fetchWithAuth('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        path: params.path,
        settings: {
          template: params.template,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      name: data.project.name,
      path: data.project.path,
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

/**
 * Open a directory picker dialog
 */
export async function selectDirectory(): Promise<string | null> {
  console.log('[Web] Opening directory picker')
  // TODO: Implement directory picker (browser limitation - may need file system API)
  return '/Users/test/projects'
}

// ============================================================================
// Activity Feed
// ============================================================================

export type ActivityEventType = 'commit' | 'agent_start' | 'agent_complete' | 'build' | 'error'

export interface ActivityEvent {
  id: string
  timestamp: string
  project: string
  type: ActivityEventType
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Get recent activity events
 */
export async function getActivityEvents(limit: number = 50, project?: string): Promise<ActivityEvent[]> {
  try {
    const queryParams = new URLSearchParams()
    if (limit) queryParams.append('limit', limit.toString())
    if (project) queryParams.append('project', project)

    const response = await fetchWithAuth(`/api/activity?${queryParams.toString()}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform backend response to frontend ActivityEvent format
    return data.activities.map((activity: any) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      project: activity.projectId,
      type: activity.type,
      message: activity.message,
      metadata: activity.metadata || undefined,
    }))
  } catch (error) {
    console.error('Error fetching activities:', error)
    throw error
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
  try {
    const response = await fetchWithAuth('/api/activity', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project,
        type: eventType,
        message,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add activity: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      id: data.activity.id,
      timestamp: data.activity.timestamp,
      project: data.activity.projectId,
      type: data.activity.type,
      message: data.activity.message,
      metadata: data.activity.metadata || undefined,
    }
  } catch (error) {
    console.error('Error adding activity:', error)
    throw error
  }
}

// ============================================================================
// Agent Stream - Real-time agent output streaming
// ============================================================================

export interface AgentStreamLine {
  lineNumber: number
  timestamp: string
  content: string
  agentId: string
}

export interface GitHubLogLine {
  timestamp: string
  message: string
  level: string
}

/**
 * Start streaming logs for a local agent (file watching)
 */
export async function startAgentStream(agentId: string): Promise<void> {
  console.log(`[Web] Starting agent stream for ${agentId}`)
  // TODO: Implement WebSocket or SSE for real-time log streaming
}

/**
 * Stop streaming logs for an agent
 */
export async function stopAgentStream(agentId: string): Promise<void> {
  console.log(`[Web] Stopping agent stream for ${agentId}`)
  // TODO: Implement WebSocket or SSE cleanup
}

/**
 * Stream logs from a GitHub Actions workflow (for remote agents)
 */
export async function streamGitHubWorkflowLogs(
  runId: number,
  agentId: string
): Promise<void> {
  console.log(`[Web] Starting GitHub workflow log stream for ${agentId}`)
  // TODO: Implement GitHub Actions API integration
}

/**
 * Get current log content for an agent
 */
export async function getAgentLogs(
  agentId: string,
  maxLines: number = 500
): Promise<AgentStreamLine[]> {
  console.log(`[Web] Getting agent logs for ${agentId}`)
  // TODO: Implement backend endpoint for agent logs
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
  ]
}
