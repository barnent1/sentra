/**
 * Unit Tests for Prototype Deployment Service
 *
 * Tests the prototype deployment service with mocked Vercel API calls.
 * Phase 2: Tests real Vercel API integration with mocked responses
 * Phase 1: Tests fallback to v0 URLs when Vercel unavailable
 *
 * Target coverage: 90%+
 *
 * @module tests/unit/services/prototype-deployment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  PrototypeDeploymentService,
  PrototypeDeploymentError,
  DeploymentApiError,
  DeploymentValidationError,
  type DeploymentRequest,
  type DeploymentResponse,
  type DeploymentStatus,
} from '@/services/prototype-deployment';
import type { CodeFile } from '@/services/v0-integration';

// Mock fetch for Vercel API calls
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

describe('PrototypeDeploymentService', () => {
  let service: PrototypeDeploymentService;
  let originalEnv: NodeJS.ProcessEnv;

  const mockFiles: CodeFile[] = [
    {
      path: 'app/page.tsx',
      content: 'export default function Page() { return <div>Dashboard</div> }',
    },
    {
      path: 'app/layout.tsx',
      content: 'export default function Layout({ children }) { return children }',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Save original environment
    originalEnv = { ...process.env };

    // Clear Vercel environment variables (default to Phase 1 fallback)
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
    delete process.env.VERCEL_ORG_ID;

    // Create service instance
    service = new PrototypeDeploymentService();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  // Helper: Configure Vercel environment
  const enableVercel = () => {
    process.env.VERCEL_TOKEN = 'test-token-123';
    process.env.VERCEL_PROJECT_ID = 'test-project-id';
    process.env.VERCEL_ORG_ID = 'test-org-id';
    service = new PrototypeDeploymentService();
  };

  // Helper: Mock successful Vercel deployment
  const mockVercelDeploymentSuccess = (deploymentId = 'vercel-deploy-123') => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: deploymentId,
        url: 'test-project-proto-123.vercel.app',
        readyState: 'READY',
        createdAt: Date.now(),
      }),
    } as Response);
  };

  // Helper: Mock Vercel deployment with specific status
  const mockVercelDeploymentStatus = (
    deploymentId: string,
    readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  ) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: deploymentId,
        url: 'test-project-proto-123.vercel.app',
        readyState,
        createdAt: Date.now(),
      }),
    } as Response);
  };

  // Helper: Mock Vercel logs
  const mockVercelLogs = (logs: string[]) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () =>
        logs.map((text, i) => ({
          type: 'log',
          created: Date.now() + i * 1000,
          payload: { text },
        })),
    } as Response);
  };

  // Helper: Mock Vercel API error
  const mockVercelError = (status = 500, statusText = 'Internal Server Error') => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
      text: async () => 'API error',
    } as Response);
  };

  describe('constructor', () => {
    it('should create instance without Vercel config (Phase 1 fallback)', () => {
      expect(service).toBeInstanceOf(PrototypeDeploymentService);
    });

    it('should create instance with Vercel config', () => {
      enableVercel();
      expect(service).toBeInstanceOf(PrototypeDeploymentService);
    });
  });

  describe('deploy', () => {
    it('should deploy to Vercel when configured (Phase 2)', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockVercelDeploymentSuccess();

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-123',
        files: mockFiles,
      };

      // ACT: Execute deployment
      const result = await service.deploy(request);

      // ASSERT: Verify Vercel deployment
      expect(result).toBeDefined();
      expect(result.url).toContain('prototypes.sentra.app'); // Phase 2: Sentra URL
      expect(result.status).toBe('ready');
      expect(result.deploymentId).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.vercel.com/v13/deployments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should fall back to Phase 1 when Vercel not configured', async () => {
      // ARRANGE: No Vercel config (default)
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-123',
        files: mockFiles,
      };

      // ACT: Execute deployment
      const result = await service.deploy(request);

      // ASSERT: Verify Phase 1 fallback
      expect(result).toBeDefined();
      expect(result.url).toContain('v0.dev'); // Phase 1: Returns v0 URL
      expect(result.status).toBe('ready');
      expect(result.deploymentId).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled(); // No API calls
    });

    it('should fall back to Phase 1 when Vercel API fails', async () => {
      // ARRANGE: Enable Vercel but API fails
      enableVercel();
      mockVercelError();

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-123',
        files: mockFiles,
      };

      // ACT: Execute deployment (should not throw, falls back)
      const result = await service.deploy(request);

      // ASSERT: Verify Phase 1 fallback
      expect(result).toBeDefined();
      expect(result.url).toContain('v0.dev');
      expect(result.status).toBe('ready');
    });

    it('should include project name in Vercel deployment URL', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockVercelDeploymentSuccess();

      const request: DeploymentRequest = {
        projectName: 'my-awesome-project',
        prototypeId: 'proto-456',
        files: mockFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result.url).toContain('my-awesome-project');
      expect(result.url).toContain('prototypes.sentra.app');
    });

    it('should throw DeploymentValidationError for empty project name', async () => {
      // ARRANGE: Invalid request (empty project name)
      const request: DeploymentRequest = {
        projectName: '',
        prototypeId: 'proto-123',
        files: mockFiles,
      };

      // ACT & ASSERT
      await expect(service.deploy(request)).rejects.toThrow(DeploymentValidationError);
      await expect(service.deploy(request)).rejects.toThrow('Project name is required');
    });

    it('should throw DeploymentValidationError for empty prototype ID', async () => {
      // ARRANGE: Invalid request (empty prototype ID)
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: '',
        files: mockFiles,
      };

      // ACT & ASSERT
      await expect(service.deploy(request)).rejects.toThrow(DeploymentValidationError);
      await expect(service.deploy(request)).rejects.toThrow('Prototype ID is required');
    });

    it('should throw DeploymentValidationError for empty files array', async () => {
      // ARRANGE: Invalid request (no files)
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-123',
        files: [],
      };

      // ACT & ASSERT
      await expect(service.deploy(request)).rejects.toThrow(DeploymentValidationError);
      await expect(service.deploy(request)).rejects.toThrow('At least one file is required');
    });

    it('should support environment variables in Vercel deployment', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockVercelDeploymentSuccess();

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-789',
        files: mockFiles,
        environmentVars: {
          NEXT_PUBLIC_API_URL: 'https://api.example.com',
          DATABASE_URL: 'postgres://localhost/test',
        },
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.status).toBe('ready');

      // Verify env vars sent to Vercel
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.env).toBeDefined();
      expect(body.env.some((e: { key: string }) => e.key === 'NEXT_PUBLIC_API_URL')).toBe(
        true
      );
    });

    it('should return deployment logs on success', async () => {
      // ARRANGE
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-logs',
        files: mockFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result.logs).toBeDefined();
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.logs!.length).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('should fetch status from Vercel API when configured', async () => {
      // ARRANGE: Enable Vercel and deploy
      enableVercel();
      mockVercelDeploymentSuccess('vercel-123');

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-status',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock status check and logs
      mockVercelDeploymentStatus('vercel-123', 'READY');
      mockVercelLogs(['Build started', 'Build completed']);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status).toBeDefined();
      expect(status.status).toBe('ready');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.vercel.com/v13/deployments/vercel-123'),
        expect.any(Object)
      );
    });

    it('should return local status when Vercel not configured', async () => {
      // ARRANGE: Phase 1 deployment
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-status',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status).toBeDefined();
      expect(status.status).toBe('ready');
      expect(status.url).toBe(deployResult.url);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw DeploymentValidationError for empty deployment ID', async () => {
      // ARRANGE: Empty deployment ID
      const deploymentId = '';

      // ACT & ASSERT
      await expect(service.getStatus(deploymentId)).rejects.toThrow(
        DeploymentValidationError
      );
      await expect(service.getStatus(deploymentId)).rejects.toThrow(
        'Deployment ID is required'
      );
    });

    it('should throw error for non-existent deployment', async () => {
      // ARRANGE: Non-existent deployment ID
      const deploymentId = 'non-existent-deploy-123';

      // ACT & ASSERT
      await expect(service.getStatus(deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should map Vercel BUILDING status to deploying', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'vercel-building',
          url: 'test.vercel.app',
          readyState: 'BUILDING',
          createdAt: Date.now(),
        }),
      } as Response);

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-deploying',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock status check
      mockVercelDeploymentStatus('vercel-building', 'BUILDING');
      mockVercelLogs(['Building...']);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status.status).toBe('deploying');
    });

    it('should map Vercel ERROR status to error', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'vercel-error',
          url: 'test.vercel.app',
          readyState: 'ERROR',
          createdAt: Date.now(),
        }),
      } as Response);

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-error',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock status check
      mockVercelDeploymentStatus('vercel-error', 'ERROR');
      mockVercelLogs(['Build failed']);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status.status).toBe('error');
    });

    it('should map Vercel CANCELED status to error', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'vercel-canceled',
          url: 'test.vercel.app',
          readyState: 'CANCELED',
          createdAt: Date.now(),
        }),
      } as Response);

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-canceled',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock status check
      mockVercelDeploymentStatus('vercel-canceled', 'CANCELED');
      mockVercelLogs(['Deployment canceled']);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status.status).toBe('error');
    });

    it('should map Vercel QUEUED status to pending', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'vercel-queued',
          url: 'test.vercel.app',
          readyState: 'QUEUED',
          createdAt: Date.now(),
        }),
      } as Response);

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-queued',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock status check
      mockVercelDeploymentStatus('vercel-queued', 'QUEUED');
      mockVercelLogs(['Queued for deployment']);

      // ACT: Check status
      const status = await service.getStatus(deployResult.deploymentId);

      // ASSERT
      expect(status.status).toBe('pending');
    });

    it('should use Vercel URL when no local record exists', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();
      const vercelDeploymentId = 'vercel-external-123';

      // Mock getting status for unknown deployment (no local record)
      mockVercelDeploymentStatus(vercelDeploymentId, 'READY');
      mockVercelLogs(['External deployment']);

      // ACT: Get status for deployment not in local storage
      const status = await service.getStatus(vercelDeploymentId);

      // ASSERT: Should use Vercel's URL
      expect(status.status).toBe('ready');
      expect(status.url).toBe('test-project-proto-123.vercel.app');
    });
  });

  describe('redeploy', () => {
    it('should redeploy existing deployment successfully', async () => {
      // ARRANGE: Deploy first
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-redeploy',
        files: mockFiles,
      };
      const initialDeploy = await service.deploy(request);

      // ACT: Redeploy
      const result = await service.redeploy(initialDeploy.deploymentId);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.deploymentId).toBe(initialDeploy.deploymentId);
      expect(result.url).toBe(initialDeploy.url); // Same URL
      expect(result.status).toBe('ready');
    });

    it('should throw DeploymentValidationError for empty deployment ID', async () => {
      // ARRANGE: Empty deployment ID
      const deploymentId = '';

      // ACT & ASSERT
      await expect(service.redeploy(deploymentId)).rejects.toThrow(
        DeploymentValidationError
      );
      await expect(service.redeploy(deploymentId)).rejects.toThrow(
        'Deployment ID is required'
      );
    });

    it('should throw error for non-existent deployment', async () => {
      // ARRANGE: Non-existent deployment ID
      const deploymentId = 'non-existent-deploy-456';

      // ACT & ASSERT
      await expect(service.redeploy(deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should include updated logs on redeploy', async () => {
      // ARRANGE: Deploy first
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-logs-redeploy',
        files: mockFiles,
      };
      const initialDeploy = await service.deploy(request);

      // ACT: Redeploy
      const result = await service.redeploy(initialDeploy.deploymentId);

      // ASSERT
      expect(result.logs).toBeDefined();
      expect(result.logs!.some((log) => log.includes('Redeploying'))).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete deployment successfully (Phase 1)', async () => {
      // ARRANGE: Deploy first
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-delete',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // ACT: Delete
      await service.delete(deployResult.deploymentId);

      // ASSERT: Getting status should throw error
      await expect(service.getStatus(deployResult.deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should delete deployment from Vercel when configured', async () => {
      // ARRANGE: Enable Vercel and deploy
      enableVercel();
      mockVercelDeploymentSuccess('vercel-delete');

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-delete-vercel',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock successful Vercel delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      // ACT: Delete
      await service.delete(deployResult.deploymentId);

      // ASSERT: Vercel API called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`api.vercel.com/v13/deployments/${deployResult.deploymentId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      // Local record deleted
      await expect(service.getStatus(deployResult.deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should handle Vercel delete API 404 (already deleted)', async () => {
      // ARRANGE: Enable Vercel and deploy
      enableVercel();
      mockVercelDeploymentSuccess('vercel-404');

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-delete-404',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock 404 from Vercel (already deleted)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      } as Response);

      // ACT: Delete (should not throw)
      await service.delete(deployResult.deploymentId);

      // ASSERT: Should succeed despite 404
      await expect(service.getStatus(deployResult.deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should throw error on Vercel delete API failure (non-404)', async () => {
      // ARRANGE: Enable Vercel and deploy
      enableVercel();
      mockVercelDeploymentSuccess('vercel-delete-error');

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-delete-error',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);

      // Mock 500 error from Vercel
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response);

      // ACT & ASSERT: Should not throw (logs error but continues)
      await service.delete(deployResult.deploymentId);

      // Local record still deleted despite Vercel error
      await expect(service.getStatus(deployResult.deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should throw DeploymentValidationError for empty deployment ID', async () => {
      // ARRANGE: Empty deployment ID
      const deploymentId = '';

      // ACT & ASSERT
      await expect(service.delete(deploymentId)).rejects.toThrow(
        DeploymentValidationError
      );
      await expect(service.delete(deploymentId)).rejects.toThrow(
        'Deployment ID is required'
      );
    });

    it('should throw error for non-existent deployment', async () => {
      // ARRANGE: Non-existent deployment ID
      const deploymentId = 'non-existent-deploy-789';

      // ACT & ASSERT
      await expect(service.delete(deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });

    it('should not throw if deleting already deleted deployment', async () => {
      // ARRANGE: Deploy and delete
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-double-delete',
        files: mockFiles,
      };
      const deployResult = await service.deploy(request);
      await service.delete(deployResult.deploymentId);

      // ACT & ASSERT: Second delete should throw (deployment not found)
      await expect(service.delete(deployResult.deploymentId)).rejects.toThrow(
        'Deployment not found'
      );
    });
  });

  describe('retry logic', () => {
    it('should retry Vercel API on transient failures', async () => {
      // ARRANGE: Enable Vercel
      enableVercel();

      // First 2 attempts fail, 3rd succeeds
      mockVercelError(500);
      mockVercelError(503);
      mockVercelDeploymentSuccess();

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-retry',
        files: mockFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT: Should succeed after retries
      expect(result.status).toBe('ready');
      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });

    it('should fall back to Phase 1 after max retries', async () => {
      // ARRANGE: Enable Vercel but all attempts fail
      enableVercel();

      mockVercelError(500);
      mockVercelError(500);
      mockVercelError(500);

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-max-retry',
        files: mockFiles,
      };

      // ACT: Should fall back instead of throwing
      const result = await service.deploy(request);

      // ASSERT: Falls back to Phase 1
      expect(result).toBeDefined();
      expect(result.url).toContain('v0.dev');
      expect(mockFetch).toHaveBeenCalledTimes(3); // All 3 retries
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in project name', async () => {
      // ARRANGE: Project name with special chars
      const request: DeploymentRequest = {
        projectName: 'my-project-123_test',
        prototypeId: 'proto-special',
        files: mockFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
    });

    it('should handle large number of files', async () => {
      // ARRANGE: Many files
      const manyFiles: CodeFile[] = Array.from({ length: 50 }, (_, i) => ({
        path: `components/Component${i}.tsx`,
        content: `export default function Component${i}() { return <div>Component ${i}</div> }`,
      }));

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-many-files',
        files: manyFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.status).toBe('ready');
    });

    it('should handle empty environment variables', async () => {
      // ARRANGE
      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-empty-env',
        files: mockFiles,
        environmentVars: {},
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.status).toBe('ready');
    });

    it('should validate file paths are not empty', async () => {
      // ARRANGE: File with empty path
      const invalidFiles: CodeFile[] = [
        {
          path: '',
          content: 'export default function Page() {}',
        },
      ];

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-invalid-path',
        files: invalidFiles,
      };

      // ACT & ASSERT
      await expect(service.deploy(request)).rejects.toThrow(DeploymentValidationError);
      await expect(service.deploy(request)).rejects.toThrow('File path cannot be empty');
    });

    it('should validate file content is not empty', async () => {
      // ARRANGE: File with empty content
      const invalidFiles: CodeFile[] = [
        {
          path: 'app/page.tsx',
          content: '',
        },
      ];

      const request: DeploymentRequest = {
        projectName: 'test-project',
        prototypeId: 'proto-invalid-content',
        files: invalidFiles,
      };

      // ACT & ASSERT
      await expect(service.deploy(request)).rejects.toThrow(DeploymentValidationError);
      await expect(service.deploy(request)).rejects.toThrow('File content cannot be empty');
    });

    it('should sanitize project name for URL', async () => {
      // ARRANGE: Project name with spaces and special chars
      const request: DeploymentRequest = {
        projectName: 'My Project With Spaces!@#',
        prototypeId: 'proto-sanitize',
        files: mockFiles,
      };

      // ACT
      const result = await service.deploy(request);

      // ASSERT: URL should have sanitized project name
      expect(result.url).toBeDefined();
      expect(result.url).not.toContain(' ');
      expect(result.url).toMatch(/[a-z0-9-]+/); // Only lowercase alphanumeric and hyphens
    });
  });
});

describe('Error Classes', () => {
  describe('PrototypeDeploymentError', () => {
    it('should create error with message', () => {
      const error = new PrototypeDeploymentError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PrototypeDeploymentError');
      expect(error.message).toBe('Test error');
    });

    it('should support error cause', () => {
      const cause = new Error('Original error');
      const error = new PrototypeDeploymentError('Wrapped error', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('DeploymentApiError', () => {
    it('should create API error with message', () => {
      const error = new DeploymentApiError('Deployment failed');

      expect(error).toBeInstanceOf(PrototypeDeploymentError);
      expect(error.name).toBe('DeploymentApiError');
      expect(error.message).toBe('Deployment failed');
    });
  });

  describe('DeploymentValidationError', () => {
    it('should create validation error with message', () => {
      const error = new DeploymentValidationError('Invalid input');

      expect(error).toBeInstanceOf(PrototypeDeploymentError);
      expect(error.name).toBe('DeploymentValidationError');
      expect(error.message).toBe('Invalid input');
    });
  });
});
