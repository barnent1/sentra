/**
 * Unit tests for GET /api/prototypes/[id]/code
 *
 * Tests prototype code export endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/prototypes/[id]/code/route';
import { drizzleDb } from '@/services/database-drizzle';

// Mock dependencies
jest.mock('@/services/database-drizzle');
jest.mock('@/lib/auth-helpers');

const mockDb = drizzleDb as jest.Mocked<typeof drizzleDb>;

// Mock auth helper
import * as authHelpers from '@/lib/auth-helpers';
const mockRequireAuthUser = authHelpers.requireAuthUser as jest.MockedFunction<typeof authHelpers.requireAuthUser>;

describe('GET /api/prototypes/[id]/code', () => {
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

  const mockFiles = [
    { path: 'app/page.tsx', content: 'export default function Page() { return <div>Hello</div> }' },
    { path: 'app/layout.tsx', content: 'export default function Layout({ children }) { return children }' },
    { path: 'components/Card.tsx', content: 'export function Card() { return <div>Card</div> }' },
  ];

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
    files: mockFiles,
    version: 1,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth
    mockRequireAuthUser.mockReturnValue(mockUser);
  });

  it('should return prototype code successfully', async () => {
    // Mock database calls
    (mockDb as any).getPrototypeById = jest.fn().mockResolvedValue(mockPrototype);
    mockDb.getProjectById = jest.fn().mockResolvedValue(mockProject);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/code', {
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
      files: mockFiles,
    });
  });

  it('should return 401 if user not authenticated', async () => {
    mockRequireAuthUser.mockImplementation(() => {
      throw new Error('User not authenticated');
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/code', {
      method: 'GET',
    });

    const response = await GET(request, { params: { id: 'prototype-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if prototype not found', async () => {
    (mockDb as any).getPrototypeById = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/code', {
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
    (mockDb as any).getPrototypeById = jest.fn().mockResolvedValue(mockPrototype);
    mockDb.getProjectById = jest.fn().mockResolvedValue({
      ...mockProject,
      userId: 'other-user',
    });

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/code', {
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

  it('should return empty array if no files available', async () => {
    (mockDb as any).getPrototypeById = jest.fn().mockResolvedValue({
      ...mockPrototype,
      files: null,
    });
    mockDb.getProjectById = jest.fn().mockResolvedValue(mockProject);

    const request = new NextRequest('http://localhost:3000/api/prototypes/prototype-123/code', {
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
      files: [],
    });
  });
});
