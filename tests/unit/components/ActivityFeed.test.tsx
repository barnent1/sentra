import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityFeed } from '@/components/ActivityFeed'

// Mock the tauri module
vi.mock('@/services/quetrex-api', () => ({
  getActivityEvents: vi.fn(),
}))

import { getActivityEvents } from '@/services/quetrex-api'

describe('ActivityFeed', () => {
  const mockEvents = [
    {
      id: '1',
      timestamp: '2025-11-13T14:32:15Z',
      project: 'quetrex',
      type: 'commit' as const,
      message: 'feat: add voice queue state',
      metadata: {
        author: 'Claude',
        hash: 'abc123d',
      },
    },
    {
      id: '2',
      timestamp: '2025-11-13T14:33:42Z',
      project: 'quetrex',
      type: 'agent_start' as const,
      message: 'Agent started working on issue #42',
      metadata: {
        issue: 42,
        title: 'Implement voice queue',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render activity feed container', async () => {
    // ARRANGE
    vi.mocked(getActivityEvents).mockResolvedValue([])

    // ACT
    render(<ActivityFeed />)

    // ASSERT
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument()
  })

  it('should render activity feed title', async () => {
    // ARRANGE
    vi.mocked(getActivityEvents).mockResolvedValue([])

    // ACT
    render(<ActivityFeed />)

    // ASSERT
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
  })

  it('should render empty state when no events', async () => {
    // ARRANGE
    vi.mocked(getActivityEvents).mockResolvedValue([])

    // ACT
    render(<ActivityFeed />)

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText(/No recent activity/i)).toBeInTheDocument()
    })
  })
})
