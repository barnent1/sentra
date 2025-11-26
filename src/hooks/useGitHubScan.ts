'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/services/api'

// Type definitions for GitHub repository scanning
export interface ScannedRepository {
  id: number
  name: string
  fullName: string
  owner: string
  private: boolean
  htmlUrl: string
  description: string | null
  language: string | null
  defaultBranch: string
  pushedAt: string | null
  createdAt: string
  updatedAt: string
  archived: boolean
  fork: boolean
  stargazersCount: number
  openIssuesCount: number
  sentraEnabled?: boolean
  imported: boolean
}

export interface ScanResult {
  repositories: ScannedRepository[]
  totalCount: number
  sentraEnabledCount: number
  scannedAt: string
  fromCache: boolean
}

export interface ScanOptions {
  excludeArchived?: boolean
  excludeForks?: boolean
  language?: string
  limit?: number
  sentraEnabledOnly?: boolean
  forceRefresh?: boolean
}

export interface ImportResult {
  imported: Array<{
    id: string
    name: string
    path: string
    githubRepoId: number
  }>
  errors?: Array<{
    repo: string
    error: string
  }>
  skipped: number
  message?: string
}

/**
 * Fetch scanned GitHub repositories
 */
async function fetchScannedRepos(options: ScanOptions = {}): Promise<ScanResult> {
  const params = new URLSearchParams()

  if (options.excludeArchived !== undefined) {
    params.set('excludeArchived', String(options.excludeArchived))
  }
  if (options.excludeForks !== undefined) {
    params.set('excludeForks', String(options.excludeForks))
  }
  if (options.language) {
    params.set('language', options.language)
  }
  if (options.limit) {
    params.set('limit', String(options.limit))
  }
  if (options.sentraEnabledOnly) {
    params.set('sentraEnabledOnly', 'true')
  }
  if (options.forceRefresh) {
    params.set('forceRefresh', 'true')
  }

  const queryString = params.toString()
  const url = `/api/github/scan${queryString ? `?${queryString}` : ''}`

  const response = await fetchWithAuth(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to scan repositories')
  }
  return response.json()
}

/**
 * Import repositories as Sentra projects
 */
async function importRepositories(
  repositoryIds?: number[],
  all?: boolean
): Promise<ImportResult> {
  const response = await fetchWithAuth('/api/github/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repositoryIds, all }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to import repositories')
  }
  return response.json()
}

/**
 * Hook for scanning and importing GitHub repositories
 *
 * Provides functionality to:
 * - Scan user's GitHub repositories
 * - Check which repos are already imported
 * - Import selected repositories as projects
 */
export function useGitHubScan(options: ScanOptions = {}) {
  const queryClient = useQueryClient()

  // Query for scanned repositories
  const {
    data: scanResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['github-scan', options],
    queryFn: () => fetchScannedRepos(options),
    // Don't auto-fetch - let user trigger scan
    enabled: false,
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes (matches server cache)
  })

  // Mutation for importing repositories
  const importMutation = useMutation({
    mutationFn: ({
      repositoryIds,
      all,
    }: {
      repositoryIds?: number[]
      all?: boolean
    }) => importRepositories(repositoryIds, all),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['github-scan'] })
    },
  })

  // Scan repositories
  const scan = async (forceRefresh = false) => {
    if (forceRefresh) {
      // Re-fetch with forceRefresh option
      return fetchScannedRepos({ ...options, forceRefresh: true })
    }
    return refetch()
  }

  // Import specific repositories by ID
  const importRepos = async (repositoryIds: number[]) => {
    return importMutation.mutateAsync({ repositoryIds })
  }

  // Import all available repositories
  const importAllRepos = async () => {
    return importMutation.mutateAsync({ all: true })
  }

  return {
    // Scan results
    repositories: scanResult?.repositories ?? [],
    totalCount: scanResult?.totalCount ?? 0,
    sentraEnabledCount: scanResult?.sentraEnabledCount ?? 0,
    scannedAt: scanResult?.scannedAt,
    fromCache: scanResult?.fromCache ?? false,

    // Loading states
    isScanning: isLoading,
    isImporting: importMutation.isPending,
    scanError: error?.message ?? null,
    importError: importMutation.error?.message ?? null,

    // Import results
    importResult: importMutation.data,

    // Actions
    scan,
    importRepos,
    importAllRepos,
    refetch,
  }
}
