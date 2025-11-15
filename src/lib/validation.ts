/**
 * Input validation schemas using Zod
 * All user input MUST be validated through these schemas
 */

import { z } from 'zod'

// ============================================================================
// Settings Validation
// ============================================================================

// Voice compatibility by API:
// TTS API (/v1/audio/speech): alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
// Realtime API (/v1/realtime): alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
// All voices (union of both APIs):
export const AllVoices = ['alloy', 'ash', 'ballad', 'cedar', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse'] as const;
export const TTSVoices = ['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'] as const;
export const RealtimeVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'] as const;

export const SettingsSchema = z.object({
  userName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  voice: z.enum(AllVoices),  // Allow all voices in settings, validation happens at usage time
  openaiApiKey: z.string().regex(/^sk-[a-zA-Z0-9-_]+$/, 'Invalid OpenAI API key format').or(z.literal('')),
  anthropicApiKey: z.string().regex(/^sk-ant-api[a-zA-Z0-9-_]+$/, 'Invalid Anthropic API key format').or(z.literal('')),
  githubToken: z.string().regex(/^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]+)$/, 'Invalid GitHub token format').or(z.literal('')),
  githubRepoOwner: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/, 'Invalid GitHub username').or(z.literal('')),
  githubRepoName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid repository name').or(z.literal('')),
  notificationsEnabled: z.boolean(),
  notifyOnCompletion: z.boolean(),
  notifyOnFailure: z.boolean(),
  notifyOnStart: z.boolean(),
  language: z.enum(['en', 'es']),
})

export type ValidatedSettings = z.infer<typeof SettingsSchema>

// ============================================================================
// Project Validation
// ============================================================================

export const CreateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project name can only contain letters, numbers, hyphens, and underscores'),
  path: z.string()
    .min(1, 'Project path is required')
    .refine((path) => !path.includes('..'), 'Path traversal not allowed')
    .refine((path) => path.startsWith('/') || path.startsWith('~'), 'Must be absolute path'),
  template: z.enum(['nextjs', 'python', 'react', 'blank']),
})

export type ValidatedCreateProject = z.infer<typeof CreateProjectSchema>

// ============================================================================
// GitHub Issue Validation
// ============================================================================

export const GitHubIssueSchema = z.object({
  specTitle: z.string().min(1, 'Title is required').max(256, 'Title too long'),
  specBody: z.string().min(1, 'Body is required').max(65536, 'Body too long'),
  labels: z.array(z.string().max(50)).max(20, 'Too many labels'),
})

export type ValidatedGitHubIssue = z.infer<typeof GitHubIssueSchema>

// ============================================================================
// File Path Validation (prevent path traversal attacks)
// ============================================================================

export const FilePathSchema = z.string()
  .min(1, 'File path is required')
  .refine((path) => !path.includes('..'), 'Path traversal not allowed')
  .refine((path) => !path.includes('\0'), 'Null bytes not allowed')
  .refine(
    (path) => {
      // Allow absolute paths and home directory paths
      return path.startsWith('/') || path.startsWith('~/')
    },
    'Must be absolute path or home directory path'
  )

export const ProjectPathSchema = FilePathSchema

// ============================================================================
// PR Review Validation
// ============================================================================

export const PRNumberSchema = z.number().int().positive().max(999999)

export const ReviewCommentSchema = z.string()
  .min(1, 'Comment is required')
  .max(65536, 'Comment too long')

export const MergeMethodSchema = z.enum(['merge', 'squash', 'rebase'])

// ============================================================================
// Architect Chat Validation
// ============================================================================

export const ChatMessageSchema = z.object({
  projectName: z.string().min(1).max(100),
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).max(50, 'Conversation history too long'),
})

export type ValidatedChatMessage = z.infer<typeof ChatMessageSchema>

// ============================================================================
// Spec Validation
// ============================================================================

export const SpecContentSchema = z.string()
  .min(1, 'Spec content is required')
  .max(100000, 'Spec content too long')

export const SpecTitleSchema = z.string()
  .min(1, 'Spec title is required')
  .max(256, 'Spec title too long')
  .regex(/^[a-zA-Z0-9\s-_()]+$/, 'Invalid characters in spec title')

// ============================================================================
// Audio Transcription Validation
// ============================================================================

export const AudioDataSchema = z.instanceof(Uint8Array)
  .refine((data) => data.length > 0, 'Audio data is empty')
  .refine((data) => data.length < 25 * 1024 * 1024, 'Audio file too large (max 25MB)')

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate input and throw error if invalid
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validated data
 * @throws Error if validation fails
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }
  return result.data
}

/**
 * Validate input and return result
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validation result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data)
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Use this for user-generated content that will be rendered as HTML
 */
export function sanitizeHTML(html: string): string {
  // Simple sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  // Remove any path traversal attempts
  return path.replace(/\.\./g, '').replace(/\0/g, '')
}
