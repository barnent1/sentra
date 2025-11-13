# Testing Patterns & Examples

**Real-world test examples for Sentra AI Agent Control Center**

This document provides copy-paste test patterns and examples specific to our tech stack:
- Next.js 15.x (App Router)
- React 18
- TypeScript
- Tauri
- React Query
- Zustand

---

## Table of Contents

1. [Unit Testing Patterns](#unit-testing-patterns)
2. [Integration Testing Patterns](#integration-testing-patterns)
3. [E2E Testing Patterns](#e2e-testing-patterns)
4. [Component Testing Patterns](#component-testing-patterns)
5. [Hook Testing Patterns](#hook-testing-patterns)
6. [API Route Testing](#api-route-testing)
7. [Tauri Integration Testing](#tauri-integration-testing)
8. [State Management Testing](#state-management-testing)
9. [Common Test Utilities](#common-test-utilities)

---

## Unit Testing Patterns

### Testing Pure Functions

```typescript
// src/lib/utils/formatters.test.ts
import { formatAgentStatus, calculateUptime } from './formatters'

describe('formatters', () => {
  describe('formatAgentStatus', () => {
    it('returns "Active" for running agents', () => {
      expect(formatAgentStatus('running')).toBe('Active')
    })

    it('returns "Idle" for stopped agents', () => {
      expect(formatAgentStatus('stopped')).toBe('Idle')
    })

    it('returns "Error" for failed agents', () => {
      expect(formatAgentStatus('error')).toBe('Error')
    })

    it('throws error for invalid status', () => {
      expect(() => formatAgentStatus('invalid')).toThrow()
    })
  })

  describe('calculateUptime', () => {
    it('calculates uptime correctly for hours', () => {
      const startTime = new Date('2024-01-01T00:00:00Z')
      const currentTime = new Date('2024-01-01T02:30:00Z')

      expect(calculateUptime(startTime, currentTime)).toBe('2h 30m')
    })

    it('returns "0m" for same time', () => {
      const time = new Date()
      expect(calculateUptime(time, time)).toBe('0m')
    })
  })
})
```

### Testing Business Logic

```typescript
// src/lib/agent/scheduler.test.ts
import { AgentScheduler } from './scheduler'
import { Agent } from '@/types'

describe('AgentScheduler', () => {
  let scheduler: AgentScheduler

  beforeEach(() => {
    scheduler = new AgentScheduler()
  })

  describe('canScheduleAgent', () => {
    it('allows scheduling when under max agents', () => {
      const agents: Agent[] = [
        { id: '1', name: 'Agent 1', status: 'running' },
        { id: '2', name: 'Agent 2', status: 'running' },
      ]

      expect(scheduler.canScheduleAgent(agents, 5)).toBe(true)
    })

    it('prevents scheduling when at max capacity', () => {
      const agents: Agent[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        name: `Agent ${i}`,
        status: 'running',
      }))

      expect(scheduler.canScheduleAgent(agents, 5)).toBe(false)
    })
  })

  describe('prioritizeAgents', () => {
    it('sorts agents by priority correctly', () => {
      const agents: Agent[] = [
        { id: '1', name: 'Low', priority: 1 },
        { id: '2', name: 'High', priority: 10 },
        { id: '3', name: 'Medium', priority: 5 },
      ]

      const sorted = scheduler.prioritizeAgents(agents)

      expect(sorted[0].name).toBe('High')
      expect(sorted[1].name).toBe('Medium')
      expect(sorted[2].name).toBe('Low')
    })
  })
})
```

### Testing Error Handling

```typescript
// src/lib/api/client.test.ts
import { ApiClient } from './client'
import { ApiError } from './errors'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient({ baseUrl: 'http://localhost:3000' })
  })

  it('throws ApiError on network failure', async () => {
    // Mock fetch to fail
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    await expect(client.getAgent('123')).rejects.toThrow(ApiError)
    await expect(client.getAgent('123')).rejects.toThrow('Network error')
  })

  it('retries failed requests', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Agent' }),
      })

    global.fetch = mockFetch

    const result = await client.getAgent('123')

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(result.name).toBe('Agent')
  })
})
```

---

## Integration Testing Patterns

### Testing Component with Data Fetching

```typescript
// src/components/AgentList/AgentList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AgentList } from './AgentList'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'

// Mock Service Worker handlers
const handlers = [
  rest.get('/api/agents', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Agent 1', status: 'running' },
        { id: '2', name: 'Agent 2', status: 'idle' },
      ])
    )
  }),
]

describe('AgentList Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('loads and displays agents', async () => {
    server.use(...handlers)
    renderWithProviders(<AgentList />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Agent 1')).toBeInTheDocument()
      expect(screen.getByText('Agent 2')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    server.use(
      rest.get('/api/agents', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }))
      })
    )

    renderWithProviders(<AgentList />)

    await waitFor(() => {
      expect(screen.getByText(/error loading agents/i)).toBeInTheDocument()
    })
  })

  it('allows filtering agents', async () => {
    const user = userEvent.setup()
    server.use(...handlers)
    renderWithProviders(<AgentList />)

    await waitFor(() => {
      expect(screen.getByText('Agent 1')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('textbox', { name: /search/i })
    await user.type(searchInput, 'Agent 1')

    expect(screen.getByText('Agent 1')).toBeInTheDocument()
    expect(screen.queryByText('Agent 2')).not.toBeInTheDocument()
  })
})
```

### Testing User Flows

```typescript
// src/app/dashboard/__tests__/create-agent-flow.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from '../page'
import { AppProviders } from '@/components/AppProviders'

describe('Create Agent Flow', () => {
  it('allows user to create a new agent', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <Dashboard />
      </AppProviders>
    )

    // Click create button
    const createButton = screen.getByRole('button', { name: /create agent/i })
    await user.click(createButton)

    // Fill form
    const nameInput = screen.getByRole('textbox', { name: /agent name/i })
    await user.type(nameInput, 'Test Agent')

    const typeSelect = screen.getByRole('combobox', { name: /agent type/i })
    await user.selectOptions(typeSelect, 'coder')

    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/agent created successfully/i)).toBeInTheDocument()
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })
  })

  it('validates form inputs', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <Dashboard />
      </AppProviders>
    )

    const createButton = screen.getByRole('button', { name: /create agent/i })
    await user.click(createButton)

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    // Verify validation errors
    expect(screen.getByText(/agent name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/agent type is required/i)).toBeInTheDocument()
  })
})
```

---

## E2E Testing Patterns

### Basic E2E Test

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('shows agent list', async ({ page }) => {
    await expect(page.getByRole('list', { name: /agents/i })).toBeVisible()
  })
})
```

### E2E with Authentication

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('user can log in', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
```

### E2E with Page Object Model

```typescript
// e2e/pages/AgentDashboard.page.ts
import { Page, Locator } from '@playwright/test'

export class AgentDashboardPage {
  readonly page: Page
  readonly agentList: Locator
  readonly createButton: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.agentList = page.getByRole('list', { name: /agents/i })
    this.createButton = page.getByRole('button', { name: /create agent/i })
    this.searchInput = page.getByRole('textbox', { name: /search/i })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async createAgent(name: string, type: string) {
    await this.createButton.click()
    await this.page.getByLabel(/agent name/i).fill(name)
    await this.page.getByLabel(/agent type/i).selectOption(type)
    await this.page.getByRole('button', { name: /create/i }).click()
  }

  async searchAgents(query: string) {
    await this.searchInput.fill(query)
  }

  async getAgentByName(name: string): Promise<Locator> {
    return this.agentList.getByText(name)
  }

  async startAgent(name: string) {
    const agent = await this.getAgentByName(name)
    await agent.getByRole('button', { name: /start/i }).click()
  }
}
```

```typescript
// e2e/agent-management.spec.ts
import { test, expect } from '@playwright/test'
import { AgentDashboardPage } from './pages/AgentDashboard.page'

test.describe('Agent Management', () => {
  let dashboard: AgentDashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new AgentDashboardPage(page)
    await dashboard.goto()
  })

  test('user can create and start an agent', async ({ page }) => {
    await dashboard.createAgent('E2E Test Agent', 'coder')

    const agent = await dashboard.getAgentByName('E2E Test Agent')
    await expect(agent).toBeVisible()

    await dashboard.startAgent('E2E Test Agent')
    await expect(page.getByText(/agent started/i)).toBeVisible()
  })

  test('user can search for agents', async ({ page }) => {
    await dashboard.searchAgents('Test')

    // Only agents matching search should be visible
    await expect(page.getByText(/test agent/i)).toBeVisible()
  })
})
```

---

## Component Testing Patterns

### Testing Button Component

```typescript
// src/components/ui/Button/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    expect(container.firstChild).toHaveClass('bg-destructive')
  })
})
```

### Testing Form Component

```typescript
// src/components/AgentForm/AgentForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentForm } from './AgentForm'

describe('AgentForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  }

  it('renders all form fields', () => {
    render(<AgentForm {...defaultProps} />)

    expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/agent type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<AgentForm {...defaultProps} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/agent name/i), 'Test Agent')
    await user.selectOptions(screen.getByLabelText(/agent type/i), 'coder')
    await user.type(screen.getByLabelText(/description/i), 'A test agent')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Agent',
        type: 'coder',
        description: 'A test agent',
      })
    })
  })

  it('shows validation errors', async () => {
    const user = userEvent.setup()
    render(<AgentForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/agent name is required/i)).toBeInTheDocument()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    render(<AgentForm {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Modal Component

```typescript
// src/components/Modal/Modal.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders when open is true', () => {
    render(
      <Modal open={true} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <Modal open={false} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )

    const overlay = container.querySelector('[data-testid="modal-overlay"]')
    await user.click(overlay!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('traps focus within modal', async () => {
    const user = userEvent.setup()
    render(
      <Modal open={true} onClose={jest.fn()}>
        <button>First</button>
        <button>Second</button>
      </Modal>
    )

    const firstButton = screen.getByRole('button', { name: /first/i })
    const secondButton = screen.getByRole('button', { name: /second/i })

    await user.tab()
    expect(firstButton).toHaveFocus()

    await user.tab()
    expect(secondButton).toHaveFocus()

    await user.tab()
    expect(firstButton).toHaveFocus() // Focus wraps
  })
})
```

---

## Hook Testing Patterns

### Testing Custom Hook

```typescript
// src/hooks/useAgents.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAgents } from './useAgents'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'

describe('useAgents', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  it('fetches agents successfully', async () => {
    server.use(
      rest.get('/api/agents', (req, res, ctx) => {
        return res(
          ctx.json([
            { id: '1', name: 'Agent 1' },
            { id: '2', name: 'Agent 2' },
          ])
        )
      })
    )

    const { result } = renderHook(() => useAgents(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].name).toBe('Agent 1')
  })

  it('handles error state', async () => {
    server.use(
      rest.get('/api/agents', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    const { result } = renderHook(() => useAgents(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})
```

### Testing Hook with State

```typescript
// src/hooks/useAgentForm.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAgentForm } from './useAgentForm'

describe('useAgentForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useAgentForm())

    expect(result.current.values).toEqual({
      name: '',
      type: '',
      description: '',
    })
    expect(result.current.errors).toEqual({})
  })

  it('updates field values', () => {
    const { result } = renderHook(() => useAgentForm())

    act(() => {
      result.current.setFieldValue('name', 'Test Agent')
    })

    expect(result.current.values.name).toBe('Test Agent')
  })

  it('validates form on submit', () => {
    const { result } = renderHook(() => useAgentForm())

    act(() => {
      result.current.handleSubmit()
    })

    expect(result.current.errors.name).toBe('Agent name is required')
  })

  it('calls onSubmit with valid data', () => {
    const onSubmit = jest.fn()
    const { result } = renderHook(() => useAgentForm({ onSubmit }))

    act(() => {
      result.current.setFieldValue('name', 'Test Agent')
      result.current.setFieldValue('type', 'coder')
      result.current.handleSubmit()
    })

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Agent',
      type: 'coder',
      description: '',
    })
  })
})
```

---

## API Route Testing

### Testing Next.js API Route

```typescript
// src/app/api/agents/route.test.ts
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('/api/agents', () => {
  describe('GET', () => {
    it('returns list of agents', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('filters agents by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agents?status=running'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      data.forEach((agent: any) => {
        expect(agent.status).toBe('running')
      })
    })
  })

  describe('POST', () => {
    it('creates a new agent', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Agent',
          type: 'coder',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Agent')
      expect(data.id).toBeDefined()
    })

    it('validates request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
```

---

## Tauri Integration Testing

### Testing Tauri Commands

```typescript
// src/lib/tauri/__tests__/commands.test.ts
import { invoke } from '@tauri-apps/api'
import { startAgent, stopAgent, getAgentLogs } from '../commands'

jest.mock('@tauri-apps/api')

describe('Tauri Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('startAgent', () => {
    it('invokes start_agent command', async () => {
      const mockInvoke = invoke as jest.Mock
      mockInvoke.mockResolvedValue({ success: true })

      const result = await startAgent('agent-123')

      expect(mockInvoke).toHaveBeenCalledWith('start_agent', {
        agentId: 'agent-123',
      })
      expect(result.success).toBe(true)
    })

    it('handles errors', async () => {
      const mockInvoke = invoke as jest.Mock
      mockInvoke.mockRejectedValue(new Error('Agent not found'))

      await expect(startAgent('invalid-id')).rejects.toThrow('Agent not found')
    })
  })

  describe('getAgentLogs', () => {
    it('retrieves agent logs', async () => {
      const mockInvoke = invoke as jest.Mock
      const mockLogs = [
        { timestamp: '2024-01-01T00:00:00Z', message: 'Agent started' },
        { timestamp: '2024-01-01T00:01:00Z', message: 'Task completed' },
      ]
      mockInvoke.mockResolvedValue(mockLogs)

      const logs = await getAgentLogs('agent-123')

      expect(mockInvoke).toHaveBeenCalledWith('get_agent_logs', {
        agentId: 'agent-123',
      })
      expect(logs).toHaveLength(2)
    })
  })
})
```

---

## State Management Testing

### Testing Zustand Store

```typescript
// src/store/agentStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from './agentStore'

describe('agentStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAgentStore.setState({
      agents: [],
      selectedAgent: null,
    })
  })

  it('adds an agent', () => {
    const { result } = renderHook(() => useAgentStore())

    act(() => {
      result.current.addAgent({
        id: '1',
        name: 'Test Agent',
        status: 'idle',
      })
    })

    expect(result.current.agents).toHaveLength(1)
    expect(result.current.agents[0].name).toBe('Test Agent')
  })

  it('selects an agent', () => {
    const { result } = renderHook(() => useAgentStore())
    const agent = {
      id: '1',
      name: 'Test Agent',
      status: 'idle' as const,
    }

    act(() => {
      result.current.addAgent(agent)
      result.current.selectAgent('1')
    })

    expect(result.current.selectedAgent).toEqual(agent)
  })

  it('updates agent status', () => {
    const { result } = renderHook(() => useAgentStore())

    act(() => {
      result.current.addAgent({
        id: '1',
        name: 'Test Agent',
        status: 'idle',
      })
      result.current.updateAgentStatus('1', 'running')
    })

    expect(result.current.agents[0].status).toBe('running')
  })

  it('removes an agent', () => {
    const { result } = renderHook(() => useAgentStore())

    act(() => {
      result.current.addAgent({
        id: '1',
        name: 'Test Agent',
        status: 'idle',
      })
      result.current.removeAgent('1')
    })

    expect(result.current.agents).toHaveLength(0)
  })
})
```

---

## Common Test Utilities

### Test Providers Wrapper

```typescript
// src/test/utils/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })
}

export function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Custom Render Function

```typescript
// src/test/utils/render.tsx
import { render, RenderOptions } from '@testing-library/react'
import { TestProviders } from './providers'

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProviders, ...options })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
```

### Mock Data Factories

```typescript
// src/test/factories/agent.factory.ts
import { Agent } from '@/types'

let agentIdCounter = 1

export function createMockAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: `agent-${agentIdCounter++}`,
    name: `Test Agent ${agentIdCounter}`,
    type: 'coder',
    status: 'idle',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockAgents(count: number, overrides?: Partial<Agent>): Agent[] {
  return Array.from({ length: count }, () => createMockAgent(overrides))
}
```

### MSW Setup

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
```

```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/agents', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Agent 1', status: 'running' },
        { id: '2', name: 'Agent 2', status: 'idle' },
      ])
    )
  }),

  rest.post('/api/agents', async (req, res, ctx) => {
    const body = await req.json()
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-id',
        ...body,
        createdAt: new Date().toISOString(),
      })
    )
  }),
]
```

---

## Test Organization

```
src/
├── components/
│   └── AgentCard/
│       ├── AgentCard.tsx
│       ├── AgentCard.test.tsx          # Unit tests
│       └── AgentCard.integration.test.tsx  # Integration tests
├── hooks/
│   └── useAgents/
│       ├── useAgents.ts
│       └── useAgents.test.ts
├── lib/
│   └── utils/
│       ├── formatters.ts
│       └── formatters.test.ts
└── test/
    ├── factories/        # Test data factories
    ├── mocks/           # MSW handlers
    └── utils/           # Test utilities

e2e/
├── pages/               # Page Object Models
│   └── AgentDashboard.page.ts
└── *.spec.ts           # E2E test specs
```

---

## Coverage Goals by File Type

| File Type | Coverage Target | Why |
|-----------|----------------|-----|
| `lib/utils/*.ts` | 95%+ | Pure functions, easy to test |
| `lib/api/*.ts` | 90%+ | Business logic, critical |
| `hooks/*.ts` | 80%+ | Reusable logic |
| `components/**/*.tsx` | 70%+ | UI components, balance effort |
| `app/*/page.tsx` | 60%+ | Tested via E2E primarily |
| `app/api/*/route.ts` | 85%+ | API contracts |

---

## Testing Checklist

For every new feature:

- [ ] Unit tests for business logic
- [ ] Component tests for UI components
- [ ] Integration tests for user flows
- [ ] E2E test for critical path (if applicable)
- [ ] Mock external dependencies (Tauri, APIs)
- [ ] Test error states
- [ ] Test loading states
- [ ] Test edge cases
- [ ] Verify accessibility (use getByRole)
- [ ] Coverage meets threshold

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- AgentCard.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests for specific file
npx playwright test dashboard.spec.ts
```

---

**You now have comprehensive test patterns for the entire application!**
