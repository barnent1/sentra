// Core system types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'planning';
  progress: number;
  createdAt: string;
  updatedAt: string;
  agents: Agent[];
  timeline: TimelineEvent[];
  metrics: ProjectMetrics;
}

export interface Agent {
  id: string;
  name: string;
  type: 'james' | 'sarah' | 'mike' | 'performance-optimizer' | 'security-scanner' | 'test-automator' | 'quality-enforcer' | 'deployment-manager' | 'code-reviewer' | 'code-analyzer' | 'documentation-generator';
  status: 'online' | 'offline' | 'busy' | 'idle' | 'error';
  currentTask: string | null;
  lastActivity: string;
  health: AgentHealth;
  capabilities: string[];
  performance: AgentPerformance;
}

export interface AgentHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  errors: number;
  lastHealthCheck: string;
}

export interface AgentPerformance {
  tasksCompleted: number;
  averageTaskTime: number;
  successRate: number;
  efficiency: number;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  agentId: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'milestone_reached' | 'agent_communication' | 'code_change' | 'deployment' | 'meeting' | 'decision';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProjectMetrics {
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  codeQuality: number;
  testCoverage: number;
  deploymentFrequency: number;
  leadTime: number;
  cycleTime: number;
  changeFailureRate: number;
  meanTimeToRecovery: number;
}

export interface Task {
  id: string;
  projectId: string;
  agentId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  actualTime?: number;
  createdAt: string;
  updatedAt: string;
  dependencies: string[];
  tags: string[];
}

// Voice and Communication types
export interface VoiceMeeting {
  id: string;
  title: string;
  description: string;
  participants: VoiceParticipant[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'paused';
  startTime: string;
  endTime?: string;
  decisions: Decision[];
  transcript: VoiceTranscript[];
  context: Record<string, any>;
}

export interface VoiceParticipant {
  id: string;
  name: string;
  type: 'human' | 'agent';
  persona: VoicePersona;
  status: 'joined' | 'speaking' | 'muted' | 'left';
}

export interface VoicePersona {
  name: string;
  voice: string;
  personality: 'professional' | 'conversational' | 'technical' | 'creative';
  expertise: string[];
  communicationStyle: 'direct' | 'collaborative' | 'analytical' | 'supportive';
}

export interface VoiceTranscript {
  id: string;
  participantId: string;
  content: string;
  timestamp: string;
  confidence: number;
  emotion?: 'neutral' | 'positive' | 'negative' | 'excited' | 'concerned';
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  decidedBy: string;
  timestamp: string;
  followupActions: FollowupAction[];
  status: 'pending' | 'approved' | 'implemented' | 'rejected';
}

export interface FollowupAction {
  id: string;
  decisionId: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// WebSocket types
export interface WebSocketMessage {
  type: 'project_update' | 'agent_status' | 'task_update' | 'timeline_event' | 'notification' | 'voice_event';
  payload: any;
  timestamp: string;
}

export interface NotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  projectId?: string;
  agentId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttsEnabled: boolean;
  crossDeviceSync: boolean;
}

// UI State types
export interface DashboardState {
  selectedProject: string | null;
  activePanel: 'dashboard' | 'agents' | 'voice' | 'settings';
  sidebarCollapsed: boolean;
  notifications: NotificationMessage[];
  voiceMeetingActive: boolean;
  currentMeeting: VoiceMeeting | null;
}

export interface CodeDiff {
  id: string;
  projectId: string;
  agentId: string;
  filepath: string;
  oldContent: string;
  newContent: string;
  timestamp: string;
  summary: string;
  linesAdded: number;
  linesRemoved: number;
  language: string;
}

export interface AgentConversation {
  id: string;
  projectId: string;
  participants: string[];
  messages: ConversationMessage[];
  topic: string;
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'task_reference' | 'decision';
  timestamp: string;
  metadata?: Record<string, any>;
}

// TTS Configuration
export interface TTSConfig {
  enabled: boolean;
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  persona: VoicePersona;
  contextFiltering: {
    focusMode: boolean;
    meetingMode: boolean;
    travelMode: boolean;
    priority: 'all' | 'high' | 'critical';
  };
  deviceRouting: {
    desktop: boolean;
    mobile: boolean;
    tablet: boolean;
    preferredDevice: 'auto' | 'desktop' | 'mobile' | 'tablet';
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Voice Command types
export interface VoiceCommand {
  command: string;
  parameters: Record<string, any>;
  confidence: number;
  timestamp: string;
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
  persona: VoicePersona;
  timestamp: string;
}

// GitHub & Vercel Integration types
export interface GitHubIntegration {
  id: string;
  projectId: string;
  repoUrl: string;
  owner: string;
  repo: string;
  accessToken: string;
  webhookSecret: string;
  branchStrategy: BranchStrategy;
  qualityGates: QualityGate[];
  isActive: boolean;
}

export interface BranchStrategy {
  mainBranch: string;
  developBranch: string;
  featureBranchPrefix: string;
  epicBranchPrefix: string;
  storyBranchPrefix: string;
  agentBranchPrefix: string;
  autoMergePolicy: 'never' | 'quality_gates' | 'always';
  protectionRules: BranchProtectionRule[];
}

export interface BranchProtectionRule {
  branch: string;
  requirePullRequest: boolean;
  requiredReviews: number;
  dismissStaleReviews: boolean;
  requireCodeOwnerReviews: boolean;
  restrictPushes: boolean;
  requireStatusChecks: boolean;
  requiredStatusChecks: string[];
}

export interface QualityGate {
  id: string;
  name: string;
  type: 'test_coverage' | 'security_scan' | 'performance_test' | 'lint_check' | 'type_check' | 'build_success';
  threshold: number;
  required: boolean;
  timeout: number;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: GitHubLabel[];
  assignees: string[];
  milestone?: string;
  createdAt: string;
  updatedAt: string;
  linkedDecision?: string;
}

export interface GitHubLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  sourceBranch: string;
  targetBranch: string;
  author: string;
  reviewers: PRReviewer[];
  checks: PRCheck[];
  conflictsDetected: boolean;
  autoMergeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PRReviewer {
  id: string;
  username: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'commented';
  reviewedAt?: string;
}

export interface PRCheck {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'cancelled';
  conclusion?: string;
  detailsUrl?: string;
  startedAt: string;
  completedAt?: string;
}

export interface VercelIntegration {
  id: string;
  projectId: string;
  teamId?: string;
  vercelProjectId: string;
  accessToken: string;
  deploymentConfig: DeploymentConfig;
  environments: VercelEnvironment[];
  isActive: boolean;
}

export interface DeploymentConfig {
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  framework?: string;
  nodeVersion?: string;
  environmentVariables: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type: 'plain' | 'secret';
}

export interface VercelEnvironment {
  name: 'production' | 'preview' | 'development';
  url?: string;
  branch?: string;
  autoDeployEnabled: boolean;
  protectionBypass?: boolean;
}

export interface Deployment {
  id: string;
  projectId: string;
  url: string;
  environment: 'production' | 'preview' | 'development';
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  createdAt: string;
  buildingAt?: string;
  readyAt?: string;
  source: 'git' | 'cli' | 'import';
  target?: string;
  gitSource?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    repo: string;
    ref: string;
    sha: string;
  };
}

export interface ConflictResolution {
  id: string;
  pullRequestId: string;
  conflictFiles: ConflictFile[];
  resolutionStrategy: 'manual' | 'auto_accept_incoming' | 'auto_accept_current' | 'ai_assisted';
  status: 'detected' | 'resolving' | 'resolved' | 'failed';
  resolvedBy?: string;
  resolvedAt?: string;
  aiSuggestions?: ConflictSuggestion[];
}

export interface ConflictFile {
  path: string;
  conflictMarkers: ConflictMarker[];
  suggestedResolution?: string;
}

export interface ConflictMarker {
  startLine: number;
  endLine: number;
  currentContent: string;
  incomingContent: string;
  baseContent?: string;
}

export interface ConflictSuggestion {
  file: string;
  resolution: string;
  confidence: number;
  reasoning: string;
}

// Backup & Sync types
export interface BackupConfig {
  id: string;
  projectId: string;
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  retentionDays: number;
  encryptionEnabled: boolean;
  twoFactorRequired: boolean;
  syncDevices: BackupDevice[];
  includedPaths: string[];
  excludedPaths: string[];
  backupTargets: BackupTarget[];
}

export interface BackupDevice {
  id: string;
  name: string;
  type: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'server';
  lastSyncAt: string;
  syncStatus: 'connected' | 'syncing' | 'disconnected' | 'error';
  encryptionKey: string;
  isActive: boolean;
}

export interface BackupTarget {
  id: string;
  type: 'cloud' | 'local' | 'network';
  provider: 'aws_s3' | 'google_drive' | 'dropbox' | 'local_disk' | 'network_drive';
  config: Record<string, any>;
  isActive: boolean;
}

export interface BackupSnapshot {
  id: string;
  projectId: string;
  timestamp: string;
  size: number;
  fileCount: number;
  checksum: string;
  encrypted: boolean;
  restorable: boolean;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  gitCommit?: string;
  branchName?: string;
  environmentFiles: string[];
  ideConfigs: string[];
  dependencies: Record<string, string>;
  projectVersion?: string;
  nodeVersion?: string;
}

export interface RestoreOperation {
  id: string;
  snapshotId: string;
  targetDevice: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeRemaining: number;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

export interface TwoFactorAuth {
  id: string;
  userId: string;
  enabled: boolean;
  method: 'google_authenticator' | 'sms' | 'email' | 'hardware_key';
  secretKey?: string;
  backupCodes: string[];
  lastUsedAt?: string;
}

// Timeline Intelligence Enhancement types
export interface TimelineIntelligence {
  id: string;
  projectId: string;
  mlModel: MLModel;
  predictions: TimelinePrediction[];
  confidenceIntervals: ConfidenceInterval[];
  riskFactors: RiskFactor[];
  historicalPatterns: HistoricalPattern[];
  teamVelocity: TeamVelocityTrend;
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'complexity_analysis' | 'time_prediction' | 'risk_assessment' | 'velocity_forecasting';
  accuracy: number;
  lastTrainedAt: string;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface TimelinePrediction {
  id: string;
  taskId: string;
  predictedDuration: number;
  confidence: number;
  complexityScore: number;
  factors: PredictionFactor[];
  createdAt: string;
  actualDuration?: number;
  accuracy?: number;
}

export interface PredictionFactor {
  name: string;
  impact: number;
  weight: number;
  description: string;
}

export interface ConfidenceInterval {
  taskId: string;
  lowerBound: number;
  upperBound: number;
  median: number;
  confidence: number;
  methodology: 'monte_carlo' | 'bootstrap' | 'bayesian' | 'historical';
}

export interface RiskFactor {
  id: string;
  name: string;
  category: 'technical' | 'resource' | 'external' | 'complexity' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  mitigationStrategies: string[];
  triggers: string[];
}

export interface HistoricalPattern {
  id: string;
  patternType: 'seasonal' | 'cyclic' | 'trend' | 'anomaly';
  description: string;
  confidence: number;
  applicableContexts: string[];
  timeframe: string;
  impact: number;
  examples: PatternExample[];
}

export interface PatternExample {
  projectId: string;
  taskType: string;
  actualDuration: number;
  predictedDuration: number;
  context: Record<string, any>;
  timestamp: string;
}

export interface TeamVelocityTrend {
  teamId: string;
  currentVelocity: number;
  historicalVelocity: VelocityDataPoint[];
  seasonalFactors: SeasonalFactor[];
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  predictedVelocity: VelocityPrediction[];
}

export interface VelocityDataPoint {
  period: string;
  velocity: number;
  tasksCompleted: number;
  totalEffort: number;
  teamSize: number;
  context: Record<string, any>;
}

export interface SeasonalFactor {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  factor: number;
  confidence: number;
  description: string;
}

export interface VelocityPrediction {
  period: string;
  predictedVelocity: number;
  confidence: number;
  factors: string[];
}