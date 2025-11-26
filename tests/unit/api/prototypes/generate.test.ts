/**
 * Unit tests for POST /api/prototypes/generate
 *
 * Tests prototype generation endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/prototypes/generate/route';
import { drizzleDb } from '@/services/database-drizzle';
import { V0IntegrationService } from '@/services/v0-integration';
import { PrototypeDeploymentService } from '@/services/prototype-deployment';
import { buildV0Prompt } from '@/services/spec-to-prompt';

// Mock dependencies
vi.mock('@/services/database-drizzle');
vi.mock('@/services/v0-integration');
vi.mock('@/services/prototype-deployment');
vi.mock('@/services/spec-to-prompt');
vi.mock('@/lib/auth-helpers');
vi.mock('fs/promises', () => {
  const readFileMock = vi.fn();
  return {
    readFile: readFileMock,
    default: {
      readFile: readFileMock,
    },
  };
});

// Mock auth helper
import * as authHelpers from '@/lib/auth-helpers';
const mockRequireAuthUser = vi.mocked(authHelpers.requireAuthUser);

// Mock fs/promises
import { readFile } from 'fs/promises';
const mockReadFile = vi.mocked(readFile);

describe('POST /api/prototypes/generate', () => {
  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    path: '/test',
    userId: 'user-123',
    settings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSpec = {
    screen: 'Dashboard',
    description: 'Main dashboard screen',
    route: '/dashboard',
    layout: { type: 'grid', columns: 3 },
    components: [{ name: 'Card', type: 'card', props: {} }],
    behavior: { interactions: [], states: ['loading', 'idle'] },
  };

  const mockV0Response = {
    chatId: 'chat-123',
    files: [
      { path: 'app/page.tsx', content: 'export default function Page() {}' },
    ],
    demoUrl: 'https://v0.dev/demo-123',
  };

  const mockDeployment = {
    deploymentId: 'deploy-123',
    url: 'https://v0.dev/chat/test-project-proto-123',
    status: 'ready' as const,
    logs: [
      '[2025-01-01T00:00:00.000Z] Starting deployment',
      '[2025-01-01T00:00:01.000Z] Deployment successful',
    ],
  };

  const mockPrototype = {
    id: 'prototype-123',
    projectId: 'project-123',
    v0ChatId: 'chat-123',
    v0DemoUrl: 'https://v0.dev/demo-123',
    deploymentUrl: mockDeployment.url,
    deploymentStatus: 'ready' as const,
    title: 'Dashboard',
    description: 'Main dashboard screen',
    specPath: '/path/to/spec.yml',
    files: mockV0Response.files,
    version: 1,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set environment variable for V0 API key
    process.env.V0_API_KEY = 'test-v0-api-key';

    // Mock auth
    mockRequireAuthUser.mockReturnValue(mockUser);

    // Mock file read
    mockReadFile.mockResolvedValue(JSON.stringify(mockSpec));

    // Mock v0 service
    vi.mocked(V0IntegrationService).mockImplementation(
      function (this: any) {
        return {
          generate: vi.fn().mockResolvedValue(mockV0Response),
        };
      } as any
    );

    // Mock deployment service
    vi.mocked(PrototypeDeploymentService).mockImplementation(
      function (this: any) {
        return {
          deploy: vi.fn().mockResolvedValue(mockDeployment),
        };
      } as any
    );

    // Mock spec to prompt
    vi.mocked(buildV0Prompt).mockReturnValue('Generated prompt');
  });

  it('should generate prototype successfully', async () => {
    // Mock database calls
    vi.mocked(drizzleDb.getProjectById).mockResolvedValue(mockProject as any);

    // Mock creating prototype
    const createPrototypeSpy = vi.fn().mockResolvedValue(mockPrototype);
    (drizzleDb as any).createPrototype = createPrototypeSpy;

    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        specPath: '/path/to/spec.yml',
        title: 'Dashboard',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      prototypeId: 'prototype-123',
      deploymentUrl: mockDeployment.url,
      deploymentId: 'deploy-123',
      status: 'ready',
    });

    // Verify prototype was created
    expect(createPrototypeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-123',
        v0ChatId: 'chat-123',
        title: 'Dashboard',
      })
    );
  });

  it('should return 401 if user not authenticated', async () => {
    mockRequireAuthUser.mockImplementation(() => {
      throw new Error('User not authenticated');
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        specPath: '/path/to/spec.yml',
        title: 'Dashboard',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        // Missing specPath and title
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return 404 if project not found', async () => {
    vi.mocked(drizzleDb.getProjectById).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        specPath: '/path/to/spec.yml',
        title: 'Dashboard',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Project not found');
  });

  it('should return 403 if user does not own project', async () => {
    vi.mocked(drizzleDb.getProjectById).mockResolvedValue({
      ...mockProject,
      userId: 'other-user',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        specPath: '/path/to/spec.yml',
        title: 'Dashboard',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should handle v0 API errors gracefully', async () => {
    // Set V0_API_KEY for this test
    process.env.V0_API_KEY = 'test-v0-api-key';

    vi.mocked(drizzleDb.getProjectById).mockResolvedValue(mockProject as any);

    vi.mocked(V0IntegrationService).mockImplementation(
      function (this: any) {
        return {
          generate: vi.fn().mockRejectedValue(new Error('v0 API error')),
        };
      } as any
    );

    const request = new NextRequest('http://localhost:3000/api/prototypes/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        projectId: 'project-123',
        specPath: '/path/to/spec.yml',
        title: 'Dashboard',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate prototype');
  });
});
