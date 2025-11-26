/**
 * Unit tests for GET /api/prototypes/[id]/status
 *
 * Tests deployment status endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/prototypes/[id]/status/route';
import { drizzleDb } from '@/services/database-drizzle';

// Mock dependencies
vi.mock('@/services/database-drizzle');
vi.mock('@/lib/auth-helpers');

// Mock auth helper
import * as authHelpers from '@/lib/auth-helpers';
const mockRequireAuthUser = vi.mocked(authHelpers.requireAuthUser);

describe('GET /api/prototypes/[id]/status', () => {
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
    deploymentUrl: 'https://v0.dev/chat/test-project-proto-123',
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth
    mockRequireAuthUser.mockReturnValue(mockUser);
  });

  it('should return deployment status successfully', async () => {
    // Mock database calls
    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(mockPrototype);
    vi.mocked(drizzleDb.getProjectById).mockResolvedValue(mockProject as any);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/status', {
      method: 'GET',
      headers: {
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      prototypeId: 'prototype-123',
      deploymentUrl: mockPrototype.deploymentUrl,
      status: 'ready',
      version: 1,
    });
  });

  it('should return 401 if user not authenticated', async () => {
    mockRequireAuthUser.mockImplementation(() => {
      throw new Error('User not authenticated');
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/status', {
      method: 'GET',
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if prototype not found', async () => {
    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/status', {
      method: 'GET',
      headers: {
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
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

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/status', {
      method: 'GET',
      headers: {
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should handle different deployment statuses', async () => {
    const deployingPrototype = {
      ...mockPrototype,
      deploymentStatus: 'deploying' as const,
    };

    (drizzleDb as any).getPrototypeById = vi.fn().mockResolvedValue(deployingPrototype);
    vi.mocked(drizzleDb).getProjectById = vi.fn().mockResolvedValue(mockProject);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/status', {
      method: 'GET',
      headers: {
        'x-user-id': 'user-123',
        'x-user-email': 'test@example.com',
      },
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('deploying');
  });
});
