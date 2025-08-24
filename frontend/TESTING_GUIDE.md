# SENTRA Testing Guide

Comprehensive guide for testing SENTRA's multi-agent development platform with advanced Claude Code integration.

## Table of Contents

- [Overview](#overview)
- [Testing Architecture](#testing-architecture)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Multi-Agent Workflow Testing](#multi-agent-workflow-testing)
- [Claude Code Integration Testing](#claude-code-integration-testing)
- [Test Automation](#test-automation)
- [Continuous Testing](#continuous-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

SENTRA's testing framework is designed to validate:

- **Multi-agent coordination** and communication
- **Claude Code integration** and AI capabilities
- **Never-lose-context system** functionality
- **Workflow automation** execution
- **Performance and scalability** under load
- **Voice integration** and real-time features
- **Mobile compatibility** across devices

## Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Testing Framework                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Unit     │  │Integration  │  │    E2E      │    │
│  │   Tests     │  │   Tests     │  │   Tests     │    │
│  │   (Jest)    │  │(Playwright) │ │(Playwright) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │Performance  │  │Multi-Agent  │  │   Claude    │    │
│  │   Tests     │  │  Workflow   │  │    Code     │    │
│  │    (K6)     │  │   Tests     │  │   Tests     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Unit Testing

### Setup

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Create Jest configuration
touch jest.config.js jest.setup.js
```

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
}));

// Mock Claude API
global.fetch = jest.fn();

// Setup test utilities
global.testUtils = {
  mockProject: {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    progress: 45,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    agents: [],
    timeline: [],
    metrics: {
      tasksTotal: 10,
      tasksCompleted: 4,
      tasksInProgress: 3,
      tasksFailed: 0,
      codeQuality: 85,
      testCoverage: 78,
    },
  },
  mockAgent: {
    id: 'test-agent-1',
    name: 'Test Agent',
    type: 'james',
    status: 'online',
    currentTask: null,
    lastActivity: '2023-01-01T12:00:00Z',
    health: {
      status: 'healthy',
      uptime: 3600,
      memoryUsage: 45,
      cpuUsage: 25,
      errors: 0,
      lastHealthCheck: '2023-01-01T12:00:00Z',
    },
    capabilities: ['development', 'testing'],
    performance: {
      tasksCompleted: 5,
      averageTaskTime: 120,
      successRate: 0.95,
      efficiency: 0.88,
    },
  },
};
```

### Hook Testing

```typescript
// src/hooks/__tests__/useClaudeCode.test.ts
import { renderHook, act } from '@testing-library/react';
import { useClaudeCode } from '../useClaudeCode';

// Mock fetch
global.fetch = jest.fn();

describe('useClaudeCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize successfully', async () => {
    const { result } = renderHook(() => useClaudeCode());
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    await act(async () => {
      await result.current.initialize({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        timeout: 30000,
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          retryableErrors: ['429', '500'],
        },
      });
    });
    
    expect(result.current.isInitialized).toBe(true);
  });

  test('should generate code successfully', async () => {
    const { result } = renderHook(() => useClaudeCode());
    
    // Initialize first
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    await act(async () => {
      await result.current.initialize({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        timeout: 30000,
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          retryableErrors: ['429', '500'],
        },
      });
    });

    // Mock code generation response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{
          text: 'function validateInput(input: string): boolean { return input.length > 0; }'
        }],
        usage: { output_tokens: 25 }
      }),
    });

    let codeResult: any;
    await act(async () => {
      codeResult = await result.current.generateCode({
        prompt: 'Create a TypeScript function for input validation',
        language: 'typescript',
        projectContext: global.testUtils.mockProject,
        agentContext: global.testUtils.mockAgent,
        requirements: ['Type safety', 'Error handling'],
      });
    });
    
    expect(codeResult.code).toBeTruthy();
    expect(codeResult.code).toContain('function validateInput');
    expect(codeResult.explanation).toBeTruthy();
  });

  test('should handle API errors gracefully', async () => {
    const { result } = renderHook(() => useClaudeCode());
    
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    await act(async () => {
      await expect(result.current.initialize({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        timeout: 30000,
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          retryableErrors: ['429', '500'],
        },
      })).rejects.toThrow('Network error');
    });
    
    expect(result.current.isInitialized).toBe(false);
  });

  test('should register and execute hooks', async () => {
    const { result } = renderHook(() => useClaudeCode());
    
    const mockHandler = jest.fn().mockResolvedValue({
      success: true,
      shouldContinue: true,
      contextUpdates: { timestamp: Date.now() },
    });

    await act(async () => {
      result.current.registerHook({
        agentId: 'test-agent',
        hookType: 'pre_task',
        priority: 10,
        handler: mockHandler,
        conditions: [],
      });
    });

    const mockContext = {
      agent: global.testUtils.mockAgent,
      task: { id: 'test-task' } as any,
      project: global.testUtils.mockProject,
      metadata: {},
      timestamp: new Date().toISOString(),
    };

    let hookResults: any;
    await act(async () => {
      hookResults = await result.current.executeHooks(
        'test-agent',
        'pre_task',
        mockContext
      );
    });

    expect(mockHandler).toHaveBeenCalledWith(mockContext);
    expect(hookResults).toHaveLength(1);
    expect(hookResults[0].success).toBe(true);
  });
});
```

### Component Testing

```typescript
// src/components/__tests__/AgentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '../agents/AgentCard';

const mockAgent = {
  id: 'agent-1',
  name: 'James',
  type: 'james' as const,
  status: 'online' as const,
  currentTask: 'Implementing authentication',
  lastActivity: '2023-01-01T12:00:00Z',
  health: {
    status: 'healthy' as const,
    uptime: 3600,
    memoryUsage: 45,
    cpuUsage: 25,
    errors: 0,
    lastHealthCheck: '2023-01-01T12:00:00Z',
  },
  capabilities: ['development', 'testing'],
  performance: {
    tasksCompleted: 15,
    averageTaskTime: 120,
    successRate: 0.95,
    efficiency: 0.88,
  },
};

describe('AgentCard', () => {
  test('renders agent information correctly', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText('Implementing authentication')).toBeInTheDocument();
    expect(screen.getByText('15 tasks')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  test('displays correct status color', () => {
    const { rerender } = render(<AgentCard agent={mockAgent} />);
    
    const statusDot = screen.getByTestId('agent-status-dot');
    expect(statusDot).toHaveClass('bg-green-500'); // Online status
    
    // Test different statuses
    rerender(<AgentCard agent={{...mockAgent, status: 'busy'}} />);
    expect(statusDot).toHaveClass('bg-yellow-500');
    
    rerender(<AgentCard agent={{...mockAgent, status: 'offline'}} />);
    expect(statusDot).toHaveClass('bg-red-500');
  });

  test('handles agent interaction clicks', () => {
    const onInteract = jest.fn();
    render(<AgentCard agent={mockAgent} onInteract={onInteract} />);
    
    fireEvent.click(screen.getByText('Interact'));
    expect(onInteract).toHaveBeenCalledWith(mockAgent.id);
  });
});
```

### Store Testing

```typescript
// src/stores/__tests__/dashboardStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useDashboardStore } from '../dashboardStore';

describe('dashboardStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useDashboardStore.setState({
        projects: [],
        agents: [],
        tasks: [],
        notifications: [],
        selectedProject: null,
        activePanel: 'dashboard',
      });
    });
  });

  test('should add project correctly', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    act(() => {
      result.current.addProject(global.testUtils.mockProject);
    });
    
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toEqual(global.testUtils.mockProject);
  });

  test('should update project correctly', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    // Add initial project
    act(() => {
      result.current.addProject(global.testUtils.mockProject);
    });
    
    // Update project
    const updates = { name: 'Updated Project', progress: 75 };
    act(() => {
      result.current.updateProject(global.testUtils.mockProject.id, updates);
    });
    
    const updatedProject = result.current.projects[0];
    expect(updatedProject.name).toBe('Updated Project');
    expect(updatedProject.progress).toBe(75);
  });

  test('should select project correctly', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    act(() => {
      result.current.addProject(global.testUtils.mockProject);
      result.current.setSelectedProject(global.testUtils.mockProject.id);
    });
    
    expect(result.current.selectedProject).toBe(global.testUtils.mockProject.id);
  });

  test('should add notification correctly', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    const notification = {
      id: 'notif-1',
      type: 'success' as const,
      title: 'Test Notification',
      message: 'This is a test notification',
      timestamp: new Date().toISOString(),
      priority: 'medium' as const,
      ttsEnabled: false,
      crossDeviceSync: true,
    };
    
    act(() => {
      result.current.addNotification(notification);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual(notification);
  });
});
```

## Integration Testing

### API Integration Testing

```typescript
// tests/integration/claude-api.test.ts
import { test, expect } from '@playwright/test';

test.describe('Claude API Integration', () => {
  test('should generate code through API', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // Mock Claude API response
    await page.route('**/api/claude/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'function validate(input: string) { return input.length > 0; }',
          explanation: 'This function validates input by checking length',
          tokenCount: 25
        })
      });
    });
    
    // Trigger code generation
    await page.click('[data-testid="generate-code-button"]');
    await page.fill('[data-testid="code-prompt"]', 'Create a validation function');
    await page.click('[data-testid="generate-submit"]');
    
    // Verify generated code appears
    await expect(page.locator('[data-testid="generated-code"]')).toContainText('function validate');
    await expect(page.locator('[data-testid="code-explanation"]')).toContainText('validates input');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock API error
    await page.route('**/api/claude/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });
    
    // Trigger code generation
    await page.click('[data-testid="generate-code-button"]');
    await page.fill('[data-testid="code-prompt"]', 'Create a validation function');
    await page.click('[data-testid="generate-submit"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to generate code');
  });
});
```

### WebSocket Integration Testing

```typescript
// tests/integration/websocket.test.ts
import { test, expect } from '@playwright/test';

test.describe('WebSocket Integration', () => {
  test('should receive real-time updates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for WebSocket connection
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Simulate WebSocket message
    await page.evaluate(() => {
      // Access the WebSocket connection and send a message
      const mockMessage = {
        type: 'agent_status',
        payload: {
          id: 'agent-1',
          name: 'James',
          status: 'busy',
          currentTask: 'New Task Assignment'
        },
        timestamp: new Date().toISOString()
      };
      
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: mockMessage
      }));
    });
    
    // Verify UI updates
    await expect(page.locator('[data-testid="agent-agent-1"]')).toContainText('busy');
    await expect(page.locator('[data-testid="agent-agent-1-task"]')).toContainText('New Task Assignment');
  });

  test('should handle connection loss and reconnection', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for initial connection
    await page.waitForSelector('[data-testid="ws-connected"]');
    
    // Simulate connection loss
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-disconnect'));
    });
    
    // Verify disconnection indicator
    await expect(page.locator('[data-testid="ws-disconnected"]')).toBeVisible();
    
    // Simulate reconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-reconnect'));
    });
    
    // Verify reconnection
    await expect(page.locator('[data-testid="ws-connected"]')).toBeVisible();
  });
});
```

## End-to-End Testing

### Multi-Agent Workflow Testing

```typescript
// tests/e2e/multi-agent-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Multi-Agent Workflow', () => {
  test('should coordinate agents for complex task', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create a complex task
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Build Authentication System');
    await page.selectOption('[data-testid="task-complexity"]', 'high');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    await page.click('[data-testid="task-submit"]');
    
    // Wait for task creation
    await page.waitForSelector('[data-testid="task-created"]');
    
    // Verify initial agent assignment (should be James for generalist work)
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('James');
    
    // Simulate complexity analysis triggering handoff
    await page.click('[data-testid="analyze-complexity"]');
    
    // Wait for handoff notification
    await page.waitForSelector('[data-testid="handoff-notification"]');
    
    // Verify handoff to specialist (Sarah)
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Sarah');
    
    // Verify context preservation
    const contextIndicator = page.locator('[data-testid="context-preserved"]');
    await expect(contextIndicator).toBeVisible();
    await expect(contextIndicator).toContainText('Context successfully transferred');
    
    // Simulate task progress
    await page.click('[data-testid="update-progress"]');
    await page.fill('[data-testid="progress-percentage"]', '50');
    await page.click('[data-testid="progress-submit"]');
    
    // Verify progress update
    await expect(page.locator('[data-testid="task-progress"]')).toContainText('50%');
    
    // Simulate code review requirement
    await page.click('[data-testid="request-review"]');
    
    // Verify review assignment (should involve Mike)
    await page.waitForSelector('[data-testid="review-assigned"]');
    await expect(page.locator('[data-testid="reviewer"]')).toContainText('Mike');
  });

  test('should maintain context across agent handoffs', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Start a task with James
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title"]', 'API Development');
    await page.fill('[data-testid="task-description"]', 'Create REST API with authentication');
    await page.click('[data-testid="task-submit"]');
    
    // Add context through conversation
    await page.click('[data-testid="agent-chat"]');
    await page.fill('[data-testid="chat-input"]', 'Use JWT tokens with 24-hour expiry');
    await page.click('[data-testid="chat-send"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="chat-response"]');
    
    // Trigger handoff to Sarah (specialist)
    await page.click('[data-testid="handoff-to-specialist"]');
    
    // Verify context is maintained
    await page.click('[data-testid="view-context"]');
    await expect(page.locator('[data-testid="context-history"]')).toContainText('JWT tokens');
    await expect(page.locator('[data-testid="context-history"]')).toContainText('24-hour expiry');
    
    // Continue conversation with Sarah
    await page.fill('[data-testid="chat-input"]', 'Also implement refresh token mechanism');
    await page.click('[data-testid="chat-send"]');
    
    // Verify Sarah has full context
    await page.waitForSelector('[data-testid="chat-response"]');
    const response = await page.locator('[data-testid="chat-response"]').last().textContent();
    expect(response).toContain('JWT'); // Should reference previous context
  });
});
```

### Voice Integration Testing

```typescript
// tests/e2e/voice-integration.test.ts
import { test, expect } from '@playwright/test';

test.describe('Voice Integration', () => {
  test('should create and join voice meeting', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to voice section
    await page.click('[data-testid="voice-tab"]');
    
    // Create new meeting
    await page.click('[data-testid="new-meeting"]');
    await page.fill('[data-testid="meeting-title"]', 'Sprint Planning');
    
    // Select AI participants
    await page.check('[data-testid="participant-james"]');
    await page.check('[data-testid="participant-sarah"]');
    
    // Configure meeting settings
    await page.selectOption('[data-testid="meeting-duration"]', '60');
    await page.check('[data-testid="enable-transcription"]');
    
    // Start meeting
    await page.click('[data-testid="start-meeting"]');
    
    // Verify meeting started
    await page.waitForSelector('[data-testid="meeting-active"]');
    await expect(page.locator('[data-testid="meeting-status"]')).toContainText('Active');
    
    // Verify participants joined
    await expect(page.locator('[data-testid="participant-james-status"]')).toContainText('Joined');
    await expect(page.locator('[data-testid="participant-sarah-status"]')).toContainText('Joined');
    
    // Simulate voice input (in real test, this would be audio)
    await page.click('[data-testid="simulate-voice-input"]');
    await page.fill('[data-testid="voice-input-text"]', 'Let\'s discuss the authentication feature');
    await page.click('[data-testid="voice-submit"]');
    
    // Verify transcription appears
    await page.waitForSelector('[data-testid="transcription-entry"]');
    await expect(page.locator('[data-testid="transcription-entry"]')).toContainText('authentication feature');
    
    // Verify AI responses
    await page.waitForSelector('[data-testid="ai-response-james"]');
    await expect(page.locator('[data-testid="ai-response-james"]')).toBeVisible();
    
    // End meeting
    await page.click('[data-testid="end-meeting"]');
    
    // Verify meeting summary
    await page.waitForSelector('[data-testid="meeting-summary"]');
    await expect(page.locator('[data-testid="meeting-summary"]')).toContainText('Sprint Planning');
  });
});
```

## Performance Testing

### K6 Load Testing

```javascript
// tests/performance/claude-api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 },    // Ramp up to 10 users
    { duration: '5m', target: 50 },    // Ramp up to 50 users
    { duration: '10m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 200 },   // Ramp up to 200 users
    { duration: '10m', target: 200 },  // Stay at 200 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% of requests under 10s
    errors: ['rate<0.05'],              // Error rate under 5%
    response_time: ['p(90)<5000'],      // 90% under 5s
  },
};

// Test data
const testPrompts = [
  'Create a TypeScript interface for user management',
  'Generate a React component for file upload',
  'Write a Python function for data validation',
  'Create a database schema for e-commerce',
  'Generate unit tests for authentication service',
];

export default function () {
  const prompt = testPrompts[Math.floor(Math.random() * testPrompts.length)];
  
  const payload = JSON.stringify({
    prompt: prompt,
    language: 'typescript',
    context: {
      projectId: 'load-test-project',
      agentId: 'load-test-agent'
    },
    requirements: ['Type safety', 'Error handling', 'Documentation']
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.CLAUDE_API_KEY}`,
    },
  };

  const startTime = Date.now();
  const response = http.post('http://localhost:3000/api/claude/generate', payload, params);
  const responseTime = Date.now() - startTime;
  
  // Record custom metrics
  responseTimeTrend.add(responseTime);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 15s': (r) => responseTime < 15000,
    'response contains code': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.code && json.code.length > 0;
      } catch {
        return false;
      }
    },
    'response has explanation': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.explanation && json.explanation.length > 0;
      } catch {
        return false;
      }
    }
  });

  errorRate.add(!success);
  
  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Average response time: ${responseTimeTrend.avg}ms`);
  console.log(`95th percentile: ${responseTimeTrend.p95}ms`);
  console.log(`Error rate: ${errorRate.rate * 100}%`);
}
```

### Memory Leak Testing

```javascript
// tests/performance/memory-leak.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1, // Single user for memory testing
  duration: '30m', // Long-running test
};

let iterationCount = 0;

export default function () {
  iterationCount++;
  
  // Simulate various operations
  const operations = [
    () => createContext(),
    () => generateCode(),
    () => executeWorkflow(),
    () => processNotifications(),
  ];
  
  // Execute random operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
  
  // Log memory usage periodically
  if (iterationCount % 100 === 0) {
    console.log(`Iteration ${iterationCount}: Memory check needed`);
    // In a real implementation, we'd check memory usage here
  }
  
  sleep(1);
}

function createContext() {
  const response = http.post('http://localhost:3000/api/contexts', JSON.stringify({
    type: 'task',
    projectId: 'test-project',
    agentId: 'test-agent'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(response, { 'context created': (r) => r.status === 201 });
}

function generateCode() {
  const response = http.post('http://localhost:3000/api/claude/generate', JSON.stringify({
    prompt: 'Create a simple function',
    language: 'typescript'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(response, { 'code generated': (r) => r.status === 200 });
}

function executeWorkflow() {
  const response = http.post('http://localhost:3000/api/workflows/test-workflow/execute', '{}', {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(response, { 'workflow executed': (r) => r.status === 200 });
}

function processNotifications() {
  const response = http.get('http://localhost:3000/api/notifications');
  
  check(response, { 'notifications fetched': (r) => r.status === 200 });
}
```

## Multi-Agent Workflow Testing

### Playwright Test Suite

```typescript
// tests/e2e/workflows/agent-coordination.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Coordination Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/dashboard');
    
    // Mock WebSocket for real-time updates
    await page.addInitScript(() => {
      window.mockWebSocket = {
        send: (data) => console.log('Mock WS send:', data),
        close: () => console.log('Mock WS close'),
        readyState: 1, // OPEN
      };
    });
  });

  test('Complex Task Workflow: Design -> Implement -> Test -> Deploy', async ({ page }) => {
    // Step 1: Create complex task
    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-title"]', 'E-commerce Checkout System');
    await page.selectOption('[data-testid="task-complexity"]', 'high');
    await page.selectOption('[data-testid="task-type"]', 'feature-development');
    await page.click('[data-testid="task-create"]');

    // Verify task creation
    await expect(page.locator('[data-testid="task-created"]')).toBeVisible();
    
    // Step 2: Initial assignment to architect (Sarah)
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Sarah');
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Design Phase');
    
    // Step 3: Architecture completion triggers handoff
    await page.click('[data-testid="complete-phase"]');
    
    // Verify handoff to developer (James)
    await page.waitForSelector('[data-testid="agent-handoff-notification"]');
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('James');
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Implementation Phase');
    
    // Step 4: Implementation completion triggers testing
    await page.click('[data-testid="complete-phase"]');
    
    // Verify handoff to tester (Mike)
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Mike');
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Testing Phase');
    
    // Step 5: Testing completion triggers deployment
    await page.click('[data-testid="complete-phase"]');
    
    // Verify handoff to deployment manager
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Deployment Manager');
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Deployment Phase');
    
    // Step 6: Verify context preservation throughout workflow
    await page.click('[data-testid="view-task-history"]');
    const history = page.locator('[data-testid="task-history"]');
    
    await expect(history).toContainText('Sarah: Architecture designed');
    await expect(history).toContainText('James: Implementation completed');
    await expect(history).toContainText('Mike: Tests passed');
    
    // Verify all context is accessible
    await expect(history).toContainText('Design decisions');
    await expect(history).toContainText('Implementation notes');
    await expect(history).toContainText('Test results');
  });

  test('Quality Gate Enforcement', async ({ page }) => {
    // Create task with quality requirements
    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-title"]', 'Payment Processing');
    await page.selectOption('[data-testid="quality-level"]', 'critical');
    await page.check('[data-testid="require-security-scan"]');
    await page.check('[data-testid="require-performance-test"]');
    await page.click('[data-testid="task-create"]');
    
    // Simulate code completion
    await page.click('[data-testid="mark-code-complete"]');
    
    // Verify quality gate triggered
    await page.waitForSelector('[data-testid="quality-gate-active"]');
    await expect(page.locator('[data-testid="quality-gate-status"]')).toContainText('Running Security Scan');
    
    // Simulate security scan completion
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quality-gate-result', {
        detail: {
          gate: 'security-scan',
          status: 'passed',
          score: 95
        }
      }));
    });
    
    // Verify next quality gate
    await expect(page.locator('[data-testid="quality-gate-status"]')).toContainText('Running Performance Test');
    
    // Simulate performance test failure
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quality-gate-result', {
        detail: {
          gate: 'performance-test',
          status: 'failed',
          score: 65,
          threshold: 80
        }
      }));
    });
    
    // Verify task returned for optimization
    await expect(page.locator('[data-testid="task-status"]')).toContainText('Performance Optimization Required');
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Performance Optimizer');
  });

  test('Agent Collaboration on Complex Problem', async ({ page }) => {
    // Create task requiring multiple agents
    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-title"]', 'Distributed System Design');
    await page.selectOption('[data-testid="collaboration-mode"]', 'multi-agent');
    await page.click('[data-testid="task-create"]');
    
    // Verify multiple agents assigned
    await expect(page.locator('[data-testid="collaborating-agents"]')).toContainText('Sarah, James, Performance Optimizer');
    
    // Simulate parallel work
    await page.click('[data-testid="start-collaboration"]');
    
    // Verify agent status updates
    await expect(page.locator('[data-testid="agent-sarah-status"]')).toContainText('Working on Architecture');
    await expect(page.locator('[data-testid="agent-james-status"]')).toContainText('Working on Implementation');
    await expect(page.locator('[data-testid="agent-performance-status"]')).toContainText('Working on Optimization');
    
    // Simulate coordination checkpoint
    await page.click('[data-testid="coordination-checkpoint"]');
    
    // Verify agents synchronize
    await page.waitForSelector('[data-testid="coordination-meeting"]');
    await expect(page.locator('[data-testid="meeting-participants"]')).toContainText('3 agents');
    
    // Simulate decision made
    await page.fill('[data-testid="meeting-decision"]', 'Use microservices architecture with event sourcing');
    await page.click('[data-testid="record-decision"]');
    
    // Verify all agents receive decision
    await expect(page.locator('[data-testid="agent-sarah-context"]')).toContainText('microservices architecture');
    await expect(page.locator('[data-testid="agent-james-context"]')).toContainText('event sourcing');
    await expect(page.locator('[data-testid="agent-performance-context"]')).toContainText('microservices architecture');
  });
});
```

## Claude Code Integration Testing

```typescript
// tests/integration/claude-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Claude Code Integration', () => {
  test('Hook System Execution', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Register test hook
    await page.evaluate(() => {
      window.testHook = {
        id: 'test-hook',
        agentId: 'james',
        hookType: 'pre_task',
        priority: 100,
        executed: false,
        handler: async (context) => {
          window.testHook.executed = true;
          window.testHook.context = context;
          return { success: true, shouldContinue: true };
        }
      };
    });
    
    // Create task to trigger hook
    await page.click('[data-testid="create-task"]');
    await page.fill('[data-testid="task-title"]', 'Test Hook Execution');
    await page.selectOption('[data-testid="assigned-agent"]', 'james');
    await page.click('[data-testid="task-create"]');
    
    // Verify hook was executed
    const hookExecuted = await page.evaluate(() => window.testHook.executed);
    expect(hookExecuted).toBe(true);
    
    // Verify hook received correct context
    const hookContext = await page.evaluate(() => window.testHook.context);
    expect(hookContext.agent.id).toBe('james');
    expect(hookContext.task.title).toBe('Test Hook Execution');
  });

  test('MCP Server Tool Execution', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock MCP server response
    await page.route('**/api/mcp/analyze_complexity', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cyclomaticComplexity: 5,
            cognitiveComplexity: 3,
            maintainabilityIndex: 72,
            recommendations: [
              'Consider extracting method for improved readability',
              'Reduce nesting depth to improve maintainability'
            ]
          },
          metadata: {
            executionTime: 250,
            serverId: 'code-analysis-server'
          }
        })
      });
    });
    
    // Trigger MCP tool
    await page.click('[data-testid="analyze-code-complexity"]');
    await page.fill('[data-testid="code-input"]', `
      function processOrder(order) {
        if (order.status === 'pending') {
          if (order.paymentMethod === 'credit_card') {
            if (validateCreditCard(order.payment)) {
              return processPayment(order);
            } else {
              throw new Error('Invalid credit card');
            }
          }
        }
        return null;
      }
    `);
    await page.click('[data-testid="analyze-submit"]');
    
    // Verify analysis results
    await page.waitForSelector('[data-testid="complexity-results"]');
    await expect(page.locator('[data-testid="cyclomatic-complexity"]')).toContainText('5');
    await expect(page.locator('[data-testid="cognitive-complexity"]')).toContainText('3');
    await expect(page.locator('[data-testid="maintainability-index"]')).toContainText('72');
    
    // Verify recommendations
    await expect(page.locator('[data-testid="recommendations"]')).toContainText('extracting method');
    await expect(page.locator('[data-testid="recommendations"]')).toContainText('nesting depth');
  });

  test('Context Compression and Preservation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create large context
    await page.click('[data-testid="start-conversation"]');
    
    // Add many messages to trigger compression
    for (let i = 0; i < 50; i++) {
      await page.fill('[data-testid="message-input"]', `Message ${i}: This is a test message with some context about the project requirements and implementation details.`);
      await page.click('[data-testid="send-message"]');
      await page.waitForTimeout(100); // Small delay to simulate real conversation
    }
    
    // Check for compression trigger
    await page.waitForSelector('[data-testid="context-compression-triggered"]');
    
    // Verify important messages preserved
    await page.click('[data-testid="view-context-history"]');
    
    // Key messages should still be accessible
    await expect(page.locator('[data-testid="context-history"]')).toContainText('Message 0'); // First message
    await expect(page.locator('[data-testid="context-history"]')).toContainText('Message 49'); // Last message
    
    // Verify compression metadata
    const compressionInfo = await page.locator('[data-testid="compression-info"]');
    await expect(compressionInfo).toContainText('Compressed');
    await expect(compressionInfo).toContainText('reduction');
  });

  test('Extension System Integration', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Load test extension
    await page.evaluate(() => {
      window.testExtension = {
        id: 'test-extension',
        name: 'Test Extension',
        activate: async (context) => {
          window.extensionActivated = true;
          window.extensionContext = context;
        },
        commands: [
          {
            id: 'test.command',
            title: 'Test Command',
            handler: async (args) => {
              return { success: true, result: 'Test command executed' };
            }
          }
        ]
      };
    });
    
    // Activate extension
    await page.click('[data-testid="manage-extensions"]');
    await page.click('[data-testid="load-test-extension"]');
    
    // Verify extension activated
    const activated = await page.evaluate(() => window.extensionActivated);
    expect(activated).toBe(true);
    
    // Execute extension command
    await page.click('[data-testid="execute-test-command"]');
    
    // Verify command execution
    await page.waitForSelector('[data-testid="command-result"]');
    await expect(page.locator('[data-testid="command-result"]')).toContainText('Test command executed');
  });
});
```

## Test Automation

### GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 10
    
    - name: Run integration tests
      run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 15
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 15
    
    - name: Run performance tests
      run: npm run test:performance
      env:
        CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

### Test Configuration

```json
// package.json scripts update
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "playwright test tests/integration",
    "test:e2e": "playwright test tests/e2e",
    "test:performance": "k6 run tests/performance/*.js",
    "test:all": "npm run test:coverage && npm run test:integration && npm run test:e2e"
  }
}
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Best Practices

### 1. Test Organization

```
tests/
├── unit/                   # Unit tests
│   ├── hooks/             # Hook tests
│   ├── components/        # Component tests
│   └── utils/             # Utility tests
├── integration/           # Integration tests
│   ├── api/               # API integration
│   ├── websocket/         # WebSocket integration
│   └── claude/            # Claude Code integration
├── e2e/                   # End-to-end tests
│   ├── workflows/         # Multi-agent workflows
│   ├── voice/             # Voice integration
│   └── mobile/            # Mobile compatibility
├── performance/           # Performance tests
│   ├── load/              # Load testing
│   ├── stress/            # Stress testing
│   └── memory/            # Memory leak testing
└── fixtures/              # Test data and mocks
    ├── projects.json
    ├── agents.json
    └── workflows.json
```

### 2. Test Data Management

```typescript
// tests/fixtures/testData.ts
export const testProjects = [
  {
    id: 'project-1',
    name: 'E-commerce Platform',
    description: 'Online shopping platform with advanced features',
    status: 'active',
    complexity: 'high',
    agents: ['james', 'sarah', 'mike'],
    requirements: [
      'User authentication',
      'Product catalog',
      'Payment processing',
      'Order management'
    ]
  },
  // More test projects...
];

export const testAgents = [
  {
    id: 'james',
    name: 'James',
    type: 'generalist',
    capabilities: ['frontend', 'backend', 'testing'],
    availability: 'available'
  },
  // More test agents...
];

// Test data factory
export class TestDataFactory {
  static createProject(overrides = {}) {
    return {
      id: `project-${Date.now()}`,
      name: 'Test Project',
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static createAgent(overrides = {}) {
    return {
      id: `agent-${Date.now()}`,
      name: 'Test Agent',
      type: 'james',
      status: 'online',
      ...overrides
    };
  }
}
```

### 3. Mock Management

```typescript
// tests/mocks/claudeApi.ts
export class MockClaudeAPI {
  private responses: Map<string, any> = new Map();
  private callHistory: any[] = [];

  setResponse(prompt: string, response: any) {
    this.responses.set(prompt, response);
  }

  getCallHistory() {
    return this.callHistory;
  }

  async generateCode(request: any) {
    this.callHistory.push({ type: 'generateCode', request });
    
    const response = this.responses.get(request.prompt) || {
      code: 'function defaultFunction() { return "mock response"; }',
      explanation: 'This is a mock response for testing purposes.',
      tokenCount: 25
    };

    return response;
  }

  async reviewCode(request: any) {
    this.callHistory.push({ type: 'reviewCode', request });
    
    return {
      issues: [],
      suggestions: [],
      overallScore: 85,
      summary: 'Code looks good overall.'
    };
  }

  reset() {
    this.responses.clear();
    this.callHistory = [];
  }
}
```

### 4. Test Utilities

```typescript
// tests/utils/testHelpers.ts
export class TestHelpers {
  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static mockWebSocketMessage(type: string, payload: any) {
    return {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
  }

  static createMockContext(overrides = {}) {
    return {
      agent: TestDataFactory.createAgent(),
      task: { id: 'test-task', title: 'Test Task' },
      project: TestDataFactory.createProject(),
      metadata: {},
      timestamp: new Date().toISOString(),
      ...overrides
    };
  }

  static async simulateUserInteraction(page: any, steps: any[]) {
    for (const step of steps) {
      switch (step.action) {
        case 'click':
          await page.click(step.selector);
          break;
        case 'fill':
          await page.fill(step.selector, step.value);
          break;
        case 'select':
          await page.selectOption(step.selector, step.value);
          break;
        case 'wait':
          await page.waitForTimeout(step.duration);
          break;
      }
    }
  }
}
```

## Troubleshooting

### Common Test Issues

#### 1. Flaky Tests

```typescript
// Fix flaky tests with proper waits
// Bad - timing dependent
test('flaky test', async ({ page }) => {
  await page.click('[data-testid="button"]');
  await page.waitForTimeout(1000); // Arbitrary wait
  expect(page.locator('[data-testid="result"]')).toBeVisible();
});

// Good - condition-based wait
test('stable test', async ({ page }) => {
  await page.click('[data-testid="button"]');
  await page.waitForSelector('[data-testid="result"]');
  expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

#### 2. Memory Leaks in Tests

```typescript
// Memory leak detection
afterEach(() => {
  // Clean up subscriptions, timers, etc.
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  // Check for memory leaks
  if (global.gc) {
    global.gc();
  }
});
```

#### 3. WebSocket Test Issues

```typescript
// Proper WebSocket mocking
beforeEach(() => {
  global.WebSocket = jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1, // OPEN
  }));
});
```

This comprehensive testing guide provides the foundation for ensuring SENTRA's multi-agent development platform works correctly across all scenarios, from individual components to complex multi-agent workflows with Claude Code integration.