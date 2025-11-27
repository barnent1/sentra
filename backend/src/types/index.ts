// Type definitions for Quetrex Backend API

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface CreateProjectRequest {
  name: string
  path: string
  settings?: Record<string, unknown>
}

export interface ProjectResponse {
  id: string
  name: string
  path: string
  userId: string
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface CreateCostRequest {
  projectId: string
  amount: number
  model: string
  provider: string
  inputTokens?: number
  outputTokens?: number
}

export interface CostResponse {
  id: string
  projectId: string
  amount: number
  model: string
  provider: string
  inputTokens: number | null
  outputTokens: number | null
  timestamp: string
}

export interface CreateActivityRequest {
  projectId: string
  type: string
  message: string
  metadata?: Record<string, unknown>
}

export interface ActivityResponse {
  id: string
  projectId: string
  type: string
  message: string
  metadata: Record<string, unknown> | null
  timestamp: string
}

export interface JWTPayload {
  userId: string
  email: string
}

export interface ErrorResponse {
  error: string
  details?: unknown
}

export interface SettingsResponse {
  id?: string
  userId?: string
  openaiApiKey?: string
  anthropicApiKey?: string
  githubToken?: string
  githubRepoOwner?: string | null
  githubRepoName?: string | null
  voiceSettings?: Record<string, unknown> | null
  notificationSettings?: Record<string, unknown> | null
  language?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpdateSettingsRequest {
  openaiApiKey?: string | null
  anthropicApiKey?: string | null
  githubToken?: string | null
  githubRepoOwner?: string | null
  githubRepoName?: string | null
  voiceSettings?: Record<string, unknown>
  notificationSettings?: Record<string, unknown>
  language?: string
}

export interface ValidateKeysRequest {
  openaiApiKey?: string
  anthropicApiKey?: string
}

export interface ValidateKeysResponse {
  openai?: boolean
  anthropic?: boolean
}
