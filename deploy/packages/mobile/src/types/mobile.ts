// SENTRA Project Standards: strict TypeScript with branded types and readonly interfaces

import type {
  Brand,
  AgentInstanceId,
  TaskId
} from '@sentra/types'

/**
 * Mobile-specific branded ID types
 */
export type ApprovalRequestId = Brand<string, 'ApprovalRequestId'>
export type NotificationId = Brand<string, 'NotificationId'>
export type SessionId = Brand<string, 'SessionId'>

/**
 * Approval request priority levels
 */
export const ApprovalPriority = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
} as const

export type ApprovalPriority = typeof ApprovalPriority[keyof typeof ApprovalPriority]

/**
 * Approval decision types
 */
export const ApprovalDecision = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DEFERRED: 'deferred',
  ESCALATED: 'escalated'
} as const

export type ApprovalDecision = typeof ApprovalDecision[keyof typeof ApprovalDecision]

/**
 * Agent decision types requiring approval
 */
export const DecisionType = {
  CODE_DEPLOYMENT: 'code_deployment',
  CRITICAL_SYSTEM_CHANGE: 'critical_system_change',
  DATA_MODIFICATION: 'data_modification',
  EXTERNAL_API_CALL: 'external_api_call',
  RESOURCE_ALLOCATION: 'resource_allocation',
  SECURITY_POLICY_CHANGE: 'security_policy_change',
  DATABASE_MIGRATION: 'database_migration',
  AGENT_SPAWN: 'agent_spawn',
  AGENT_TERMINATION: 'agent_termination'
} as const

export type DecisionType = typeof DecisionType[keyof typeof DecisionType]

/**
 * System alert severity levels
 */
export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error', 
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
} as const

export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity]

/**
 * Agent approval request interface
 */
export interface ApprovalRequest {
  readonly id: ApprovalRequestId
  readonly agentId: AgentInstanceId
  readonly taskId?: TaskId
  readonly decisionType: DecisionType
  readonly priority: ApprovalPriority
  readonly title: string
  readonly description: string
  readonly context: ApprovalContext
  readonly requestedAt: Date
  readonly expiresAt?: Date
  readonly requiredApprovers: number
  readonly currentApprovers: readonly string[]
  readonly decision?: ApprovalDecision
  readonly decidedAt?: Date
  readonly decidedBy?: string
  readonly rejectionReason?: string
  readonly metadata?: Record<string, unknown>
}

/**
 * Approval context providing decision details
 */
export interface ApprovalContext {
  readonly codeChanges?: CodeChange[]
  readonly systemImpact?: SystemImpact
  readonly resourceRequirements?: ResourceRequirements
  readonly riskAssessment?: RiskAssessment
  readonly rollbackPlan?: string
  readonly testResults?: TestResults
}

/**
 * Code change information
 */
export interface CodeChange {
  readonly filePath: string
  readonly changeType: 'create' | 'modify' | 'delete'
  readonly linesAdded: number
  readonly linesRemoved: number
  readonly diff?: string
  readonly impact: 'low' | 'medium' | 'high'
}

/**
 * System impact assessment
 */
export interface SystemImpact {
  readonly affectedServices: readonly string[]
  readonly downtime: boolean
  readonly estimatedDuration: number // minutes
  readonly rollbackTime: number // minutes
  readonly userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Resource requirements
 */
export interface ResourceRequirements {
  readonly cpu: number // percentage
  readonly memory: number // MB
  readonly storage: number // GB
  readonly network: number // Mbps
  readonly cost: number // USD per hour
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  readonly overallRisk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  readonly securityRisk: boolean
  readonly dataLossRisk: boolean
  readonly performanceRisk: boolean
  readonly availabilityRisk: boolean
  readonly mitigations: readonly string[]
}

/**
 * Test results
 */
export interface TestResults {
  readonly unitTests: TestSuite
  readonly integrationTests: TestSuite
  readonly performanceTests: TestSuite
  readonly securityTests: TestSuite
}

/**
 * Test suite results
 */
export interface TestSuite {
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly coverage: number // percentage
}

/**
 * System alert interface
 */
export interface SystemAlert {
  readonly id: NotificationId
  readonly severity: AlertSeverity
  readonly title: string
  readonly message: string
  readonly source: string
  readonly agentId?: AgentInstanceId
  readonly timestamp: Date
  readonly acknowledged: boolean
  readonly acknowledgedBy?: string
  readonly acknowledgedAt?: Date
  readonly resolved: boolean
  readonly resolvedAt?: Date
  readonly metadata?: Record<string, unknown>
}

/**
 * Mobile notification interface
 */
export interface MobileNotification {
  readonly id: NotificationId
  readonly type: 'approval_request' | 'system_alert' | 'agent_update' | 'task_completion'
  readonly title: string
  readonly body: string
  readonly data?: Record<string, unknown>
  readonly badge?: number
  readonly icon?: string
  readonly image?: string
  readonly timestamp: Date
  readonly read: boolean
  readonly actionable: boolean
  readonly actions?: readonly NotificationAction[]
}

/**
 * Notification action interface
 */
export interface NotificationAction {
  readonly action: string
  readonly title: string
  readonly icon?: string
}

/**
 * Agent status summary for mobile
 */
export interface MobileAgentStatus {
  readonly agentId: AgentInstanceId
  readonly name: string
  readonly status: 'active' | 'inactive' | 'error' | 'spawning' | 'terminating'
  readonly currentTask?: string
  readonly lastActivity: Date
  readonly performanceScore: number
  readonly alertCount: number
  readonly pendingApprovals: number
}

/**
 * Task status summary for mobile
 */
export interface MobileTaskStatus {
  readonly taskId: TaskId
  readonly title: string
  readonly status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'
  readonly progress: number // 0-100
  readonly assignedAgent?: string
  readonly estimatedCompletion?: Date
  readonly priority: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Emergency control action types
 */
export const EmergencyAction = {
  PAUSE_ALL_AGENTS: 'pause_all_agents',
  EMERGENCY_STOP: 'emergency_stop',
  ROLLBACK_DEPLOYMENT: 'rollback_deployment',
  ESCALATE_TO_HUMAN: 'escalate_to_human',
  ACTIVATE_FAILSAFE: 'activate_failsafe',
  FORCE_AGENT_RESTART: 'force_agent_restart'
} as const

export type EmergencyAction = typeof EmergencyAction[keyof typeof EmergencyAction]

/**
 * Emergency control interface
 */
export interface EmergencyControl {
  readonly action: EmergencyAction
  readonly description: string
  readonly confirmationRequired: boolean
  readonly irreversible: boolean
  readonly estimatedImpact: string
  readonly enabled: boolean
}

/**
 * Offline sync status
 */
export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  SYNCING: 'syncing',
  FAILED: 'failed',
  OFFLINE: 'offline'
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]

/**
 * Offline data interface
 */
export interface OfflineData {
  readonly approvalRequests: readonly ApprovalRequest[]
  readonly systemAlerts: readonly SystemAlert[]
  readonly agentStatuses: readonly MobileAgentStatus[]
  readonly taskStatuses: readonly MobileTaskStatus[]
  readonly lastSync: Date
  readonly syncStatus: SyncStatus
}

/**
 * Mobile app configuration
 */
export interface MobileConfig {
  readonly apiUrl: string
  readonly wsUrl: string
  readonly pushNotificationsEnabled: boolean
  readonly offlineMode: boolean
  readonly biometricAuth: boolean
  readonly theme: 'light' | 'dark' | 'auto'
  readonly refreshInterval: number // seconds
  readonly notificationSettings: NotificationSettings
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  readonly approvalRequests: boolean
  readonly systemAlerts: boolean
  readonly agentUpdates: boolean
  readonly taskCompletions: boolean
  readonly emergencyOnly: boolean
  readonly quietHours: QuietHours
}

/**
 * Quiet hours configuration
 */
export interface QuietHours {
  readonly enabled: boolean
  readonly startTime: string // HH:MM format
  readonly endTime: string // HH:MM format
  readonly timezone: string
}

/**
 * Touch gesture types for mobile interactions
 */
export const GestureType = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_UP: 'swipe_up',
  SWIPE_DOWN: 'swipe_down',
  PINCH: 'pinch',
  PAN: 'pan'
} as const

export type GestureType = typeof GestureType[keyof typeof GestureType]

/**
 * Mobile session interface
 */
export interface MobileSession {
  readonly id: SessionId
  readonly userId: string
  readonly deviceId: string
  readonly startTime: Date
  readonly lastActivity: Date
  readonly pushToken?: string
  readonly biometricEnabled: boolean
  readonly permissions: readonly string[]
  readonly config: MobileConfig
}