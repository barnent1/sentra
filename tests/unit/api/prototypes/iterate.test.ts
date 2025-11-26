/**
 * Unit tests for POST /api/prototypes/[id]/iterate
 *
 * Tests prototype iteration endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/prototypes/[id]/iterate/route';
import { drizzleDb } from '@/services/database-drizzle';
import { V0IntegrationService } from '@/services/v0-integration';
import { PrototypeDeploymentService } from '@/services/prototype-deployment';

// Mock dependencies
vi.mock('@/services/database-drizzle');
vi.mock('@/services/v0-integration');
vi.mock('@/services/prototype-deployment');
vi.mock('@/lib/auth-helpers');

// Mock auth helper
import * as authHelpers from '@/lib/auth-helpers';
const mockRequireAuthUser = vi.mocked(authHelpers.requireAuthUser);

describe('POST /api/prototypes/[id]/iterate', () => {
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

  const mockPrototype = {
    id: 'prototype-123',
    projectId: 'project-123',
    v0ChatId: 'chat-123',
    v0DemoUrl: 'https://v0.dev/demo-123',
    deploymentUrl: 'https://prototypes.sentra.app/test-project',
    deploymentStatus: 'ready' as const,
    title: 'Dashboard',
    description: 'Main dashboard screen',
    specPath: '/path/to/spec.yml',
    files: [
      { path: 'app/page.tsx', content: 'export default function Page() {}' },
    ],
    version: 1,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockV0Response = {
    chatId: 'chat-123',
    files: [
      { path: 'app/page.tsx', content: 'export default function UpdatedPage() {}' },
    ],
    demoUrl: 'https://v0.dev/demo-123',
  };

  const mockDeployment = {
    deploymentId: 'deploy-456',
    url: 'https://v0.dev/chat/test-project-prototype-123',
    status: 'ready' as const,
    logs: [
      '[2025-01-01T00:00:00.000Z] Starting deployment',
      '[2025-01-01T00:00:01.000Z] Deployment successful',
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set environment variable for V0 API key
    process.env.V0_API_KEY = 'test-v0-api-key';

    // Mock auth
    mockRequireAuthUser.mockReturnValue(mockUser);

    // Mock v0 service
    vi.mocked(V0IntegrationService).mockImplementation(
      function (this: any) {
        return {
          iterate: vi.fn().mockResolvedValue(mockV0Response),
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
  });

  it('should iterate on prototype successfully', async () => {
    // Mock database calls
    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(mockPrototype);
    vi.mocked(drizzleDb).getProjectById = vi.fn().mockResolvedValue(mockProject);

    const updatePrototypeSpy = vi.fn().mockResolvedValue({
      ...mockPrototype,
      version: 2,
      files: mockV0Response.files,
    });
    (drizzleDb as any).updatePrototype = updatePrototypeSpy;

    const createIterationSpy = vi.fn().mockResolvedValue({
      id: 'iteration-1',
      prototypeId: 'prototype-123',
      feedback: 'Move sidebar to left',
      changesApplied: 'Sidebar moved to left side',
      createdAt: new Date(),
    });
    (drizzleDb as any).createPrototypeIteration = createIterationSpy;

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        feedback: 'Move sidebar to left',
      }),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      prototypeId: 'prototype-123',
      version: 2,
      deploymentUrl: mockDeployment.url,
      deploymentId: 'deploy-456',
      status: 'ready',
    });

    // Verify prototype was updated
    expect(updatePrototypeSpy).toHaveBeenCalled();

    // Verify iteration was created
    expect(createIterationSpy).toHaveBeenCalled();
  });

  it('should return 401 if user not authenticated', async () => {
    mockRequireAuthUser.mockImplementation(() => {
      throw new Error('User not authenticated');
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        feedback: 'Move sidebar to left',
      }),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if feedback is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('feedback is required');
  });

  it('should return 404 if prototype not found', async () => {
    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        feedback: 'Move sidebar to left',
      }),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Prototype not found');
  });

  it('should return 403 if user does not own project', async () => {
    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(mockPrototype);
    vi.mocked(drizzleDb).getProjectById = vi.fn().mockResolvedValue({
      ...mockProject,
      userId: 'other-user',
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        feedback: 'Move sidebar to left',
      }),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should handle v0 API errors gracefully', async () => {
    // Set V0_API_KEY for this test
    process.env.V0_API_KEY = 'test-v0-api-key';

    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(mockPrototype);
    vi.mocked(drizzleDb).getProjectById = vi.fn().mockResolvedValue(mockProject);

    vi.mocked(V0IntegrationService).mockImplementation(
      function (this: any) {
        return {
          iterate: vi.fn().mockRejectedValue(new Error('v0 API error')),
        };
      } as any
    );

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/iterate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({
        feedback: 'Move sidebar to left',
      }),
    });

    const response = await POST(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to iterate on prototype');
  });
});
