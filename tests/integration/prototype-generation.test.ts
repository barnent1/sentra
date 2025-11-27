/**
 * Prototype Generation Workflow Integration Test
 *
 * Tests the complete prototype generation workflow from specification
 * to deployment, including:
 * - End-to-end: Spec → v0 generation → deployment → database
 * - Iteration workflow: Feedback → v0 iterate → redeploy
 * - Error handling: v0 API failure, deployment failure
 * - Database operations: Create, update, query prototypes
 *
 * Part of Design Generation Feature (Phase 3.3)
 * Coverage target: 90%+
 *
 * @module tests/integration/prototype-generation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/db/schema';
import { prototypes, prototypeIterations, projects, users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import {
  V0IntegrationService,
  type V0GenerationRequest,
  type V0GenerationResponse,
  V0ApiError,
  V0ValidationError,
} from '../../src/services/v0-integration';
import {
  buildV0Prompt,
  validateSpec,
  extractDesignTokens,
  type ArchitectSpec,
} from '../../src/services/spec-to-prompt';
import type { CodeFile } from '../../src/db/schema';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock v0-sdk
vi.mock('v0-sdk', () => ({
  createClient: vi.fn(() => ({
    chats: {
      create: vi.fn(),
    },
    files: {
      export: vi.fn(),
    },
  })),
}));

// Mock Vercel deployment (not yet implemented, but needed for integration tests)
interface DeploymentResponse {
  url: string;
  status: 'deploying' | 'ready' | 'error';
}

class MockDeploymentService {
  async deploy(files: CodeFile[], prototypeId: string): Promise<DeploymentResponse> {
    // Mock successful deployment
    return {
      url: `https://prototypes.quetrex.app/${prototypeId}`,
      status: 'ready',
    };
  }

  async redeploy(deploymentUrl: string): Promise<DeploymentResponse> {
    // Mock successful redeployment
    return {
      url: deploymentUrl,
      status: 'ready',
    };
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Prototype Generation Workflow Integration', () => {
  // Test data
  let testUserId: string;
  let testProjectId: string;
  let mockV0Service: V0IntegrationService;
  let mockDeploymentService: MockDeploymentService;
  let db: ReturnType<typeof drizzle>;

  // Mock v0 client
  const mockV0Client = {
    chats: {
      create: vi.fn(),
    },
    files: {
      export: vi.fn(),
    },
  };

  beforeAll(async () => {
    // Initialize test database connection
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quetrex_test';
    const sql = postgres(databaseUrl);
    db = drizzle(sql, { schema });

    // ARRANGE: Create test user and project
    const [user] = await db
      .insert(users)
      .values({
        email: 'test-prototype@quetrex.app',
        password: 'hashed_password',
        name: 'Prototype Test User',
      })
      .returning();

    testUserId = user.id;

    const [project] = await db
      .insert(projects)
      .values({
        name: 'Test Prototype Project',
        path: '/test/prototype/project',
        userId: testUserId,
      })
      .returning();

    testProjectId = project.id;

    // Initialize services
    mockDeploymentService = new MockDeploymentService();
  });

  afterAll(async () => {
    // CLEANUP: Remove test data
    await db.delete(prototypes).where(eq(prototypes.projectId, testProjectId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock v0 service with controlled responses
    mockV0Service = new V0IntegrationService('mock-api-key');

    // Override internal client with mock
    (mockV0Service as any).client = mockV0Client;
  });

  // ==========================================================================
  // End-to-End: Spec → v0 Generation → Deployment → Database
  // ==========================================================================

  describe('End-to-End Prototype Generation', () => {
    it('should generate prototype from architect spec and save to database', async () => {
      // ARRANGE: Valid architect spec
      const spec: ArchitectSpec = {
        screen: 'Dashboard',
        description: 'Mission control for AI projects',
        route: '/dashboard',
        layout: {
          type: 'grid',
          columns: 3,
          gap: '1rem',
        },
        components: [
          {
            name: 'StatCard',
            type: 'Card',
            props: {
              title: 'Total Projects',
              value: '12',
            },
          },
        ],
        behavior: {
          interactions: [
            {
              trigger: 'click',
              target: 'project-card',
              action: 'navigate',
              destination: '/project/details',
            },
          ],
          states: ['loading', 'success', 'error'],
        },
        design_tokens: {
          colors: {
            primary: '#6366f1',
            background: '#0a0a0a',
          },
        },
      };

      // Mock v0 API response
      const mockV0Response = {
        id: 'chat-123',
        files: [
          { path: 'page.tsx', content: 'export default function Dashboard() {}' },
          { path: 'styles.css', content: '.dashboard { color: #6366f1; }' },
        ],
        demoUrl: 'https://v0.dev/chat/chat-123',
      };

      mockV0Client.chats.create.mockResolvedValue(mockV0Response);

      // ACT: Generate prompt and create prototype
      const prompt = buildV0Prompt(spec);

      const v0Response = await mockV0Service.generate({
        prompt,
        framework: 'nextjs',
        styling: 'tailwind',
        designTokens: spec.design_tokens,
      });

      // Deploy prototype
      const deployment = await mockDeploymentService.deploy(v0Response.files, 'proto-123');

      // Save to database
      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: v0Response.chatId,
          v0DemoUrl: v0Response.demoUrl,
          deploymentUrl: deployment.url,
          deploymentStatus: deployment.status,
          title: spec.screen,
          description: spec.description,
          specPath: '/path/to/spec.yml',
          files: v0Response.files,
          version: 1,
        })
        .returning();

      // ASSERT: Prototype created successfully
      expect(prototype).toBeDefined();
      expect(prototype.v0ChatId).toBe('chat-123');
      expect(prototype.deploymentUrl).toContain('prototypes.quetrex.app');
      expect(prototype.deploymentStatus).toBe('ready');
      expect(prototype.title).toBe('Dashboard');
      expect(prototype.files).toHaveLength(2);
      expect(prototype.version).toBe(1);

      // Verify v0 API was called correctly
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(1);
      expect(mockV0Client.chats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Dashboard'),
        })
      );

      // Verify prompt includes all spec details
      expect(prompt).toContain('Dashboard');
      expect(prompt).toContain('Mission control for AI projects');
      expect(prompt).toContain('/dashboard');
      expect(prompt).toContain('grid');
      expect(prompt).toContain('#6366f1');
    });

    it('should handle complete workflow with multiple components', async () => {
      // ARRANGE: Complex spec with multiple components
      const spec: ArchitectSpec = {
        screen: 'Settings',
        description: 'User settings management',
        route: '/settings',
        layout: {
          type: 'stack',
          spacing: '2rem',
        },
        components: [
          {
            name: 'ThemeSelector',
            type: 'Select',
            props: { options: ['dark', 'light', 'system'] },
          },
          {
            name: 'NotificationToggle',
            type: 'Switch',
            props: { defaultChecked: true },
          },
          {
            name: 'ApiKeyInput',
            type: 'Input',
            props: { type: 'password', placeholder: 'Enter API key' },
          },
        ],
        behavior: {
          interactions: [
            {
              trigger: 'change',
              target: 'theme-selector',
              action: 'update-theme',
              visualFeedback: 'Theme applied immediately',
            },
          ],
          states: ['idle', 'saving', 'saved', 'error'],
        },
      };

      // Mock v0 response
      mockV0Client.chats.create.mockResolvedValue({
        id: 'chat-456',
        files: [
          { path: 'page.tsx', content: 'export default function Settings() {}' },
          { path: 'theme-selector.tsx', content: 'export function ThemeSelector() {}' },
          { path: 'notification-toggle.tsx', content: 'export function NotificationToggle() {}' },
        ],
        demoUrl: 'https://v0.dev/chat/chat-456',
      });

      // ACT: Full workflow
      const prompt = buildV0Prompt(spec);
      const v0Response = await mockV0Service.generate({
        prompt,
        framework: 'nextjs',
        styling: 'tailwind',
      });

      const deployment = await mockDeploymentService.deploy(v0Response.files, 'proto-456');

      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: v0Response.chatId,
          v0DemoUrl: v0Response.demoUrl,
          deploymentUrl: deployment.url,
          deploymentStatus: deployment.status,
          title: spec.screen,
          description: spec.description,
          files: v0Response.files,
          version: 1,
        })
        .returning();

      // ASSERT: All components generated
      expect(prototype.files).toHaveLength(3);
      expect(prototype.files.map((f) => f.path)).toContain('theme-selector.tsx');
      expect(prototype.files.map((f) => f.path)).toContain('notification-toggle.tsx');

      // Verify prompt includes all components
      expect(prompt).toContain('ThemeSelector');
      expect(prompt).toContain('NotificationToggle');
      expect(prompt).toContain('ApiKeyInput');
    });

    it('should validate spec before generation', async () => {
      // ARRANGE: Invalid spec (missing required fields)
      const invalidSpec = {
        screen: 'Invalid',
        // Missing description
        // Missing route
        layout: { type: 'flex' },
        components: [],
        behavior: { interactions: [], states: [] },
      } as ArchitectSpec;

      // ACT & ASSERT: Validation fails
      const validation = validateSpec(invalidSpec);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required field: description');
      expect(validation.errors).toContain('Missing required field: route');

      // buildV0Prompt should throw ValidationError
      expect(() => buildV0Prompt(invalidSpec)).toThrow('Spec validation failed');
    });
  });

  // ==========================================================================
  // Iteration Workflow: Feedback → v0 Iterate → Redeploy
  // ==========================================================================

  describe('Iteration Workflow', () => {
    it('should iterate on prototype based on user feedback', async () => {
      // ARRANGE: Existing prototype
      const [existingPrototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-789',
          v0DemoUrl: 'https://v0.dev/chat/chat-789',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-789',
          deploymentStatus: 'ready',
          title: 'Profile Page',
          description: 'User profile management',
          files: [{ path: 'page.tsx', content: 'export default function Profile() {}' }],
          version: 1,
        })
        .returning();

      // Mock v0 iteration response
      mockV0Client.chats.create.mockResolvedValue({
        id: 'chat-789',
        files: [
          { path: 'page.tsx', content: 'export default function Profile() { /* Updated */ }' },
        ],
        demoUrl: 'https://v0.dev/chat/chat-789',
      });

      // ACT: Iterate with feedback
      const feedback = 'Move the avatar to the left side of the page';

      const v0Response = await mockV0Service.iterate(existingPrototype.v0ChatId, feedback);

      // Redeploy with updated files
      const deployment = await mockDeploymentService.redeploy(existingPrototype.deploymentUrl);

      // Create new prototype version
      const [newVersion] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: v0Response.chatId,
          v0DemoUrl: v0Response.demoUrl,
          deploymentUrl: deployment.url,
          deploymentStatus: deployment.status,
          title: existingPrototype.title,
          description: existingPrototype.description,
          files: v0Response.files,
          version: 2,
          parentId: existingPrototype.id,
        })
        .returning();

      // Track iteration
      await db.insert(prototypeIterations).values({
        prototypeId: newVersion.id,
        feedback,
        changesApplied: 'Avatar moved to left side',
      });

      // ASSERT: New version created
      expect(newVersion.version).toBe(2);
      expect(newVersion.parentId).toBe(existingPrototype.id);
      expect(newVersion.files[0].content).toContain('Updated');

      // Verify v0 iterate was called with correct chatId
      expect(mockV0Client.chats.create).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: 'chat-789',
          message: feedback,
        })
      );

      // Verify iteration tracked
      const iterations = await db
        .select()
        .from(prototypeIterations)
        .where(eq(prototypeIterations.prototypeId, newVersion.id));

      expect(iterations).toHaveLength(1);
      expect(iterations[0].feedback).toBe(feedback);
    });

    it('should support multiple iterations on same prototype', async () => {
      // ARRANGE: Initial prototype
      const [initial] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-multi',
          v0DemoUrl: 'https://v0.dev/chat/chat-multi',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-multi',
          deploymentStatus: 'ready',
          title: 'Multi-Iteration Test',
          description: 'Testing multiple iterations',
          files: [{ path: 'page.tsx', content: 'v1' }],
          version: 1,
        })
        .returning();

      // ACT: Perform 3 iterations
      const iterations = [
        { feedback: 'Change color to blue', content: 'v2' },
        { feedback: 'Add padding', content: 'v3' },
        { feedback: 'Make it responsive', content: 'v4' },
      ];

      let currentVersion = initial;

      for (let i = 0; i < iterations.length; i++) {
        const { feedback, content } = iterations[i];

        // Mock v0 response
        mockV0Client.chats.create.mockResolvedValue({
          id: currentVersion.v0ChatId,
          files: [{ path: 'page.tsx', content }],
        });

        // Iterate
        const v0Response = await mockV0Service.iterate(currentVersion.v0ChatId, feedback);
        const deployment = await mockDeploymentService.redeploy(currentVersion.deploymentUrl);

        // Create new version
        const [newVersion] = await db
          .insert(prototypes)
          .values({
            projectId: testProjectId,
            v0ChatId: currentVersion.v0ChatId,
            v0DemoUrl: currentVersion.v0DemoUrl,
            deploymentUrl: deployment.url,
            deploymentStatus: deployment.status,
            title: currentVersion.title,
            description: currentVersion.description,
            files: v0Response.files,
            version: currentVersion.version + 1,
            parentId: currentVersion.id,
          })
          .returning();

        // Track iteration
        await db.insert(prototypeIterations).values({
          prototypeId: newVersion.id,
          feedback,
          changesApplied: `Iteration ${i + 1}`,
        });

        currentVersion = newVersion;
      }

      // ASSERT: Final version is v4
      expect(currentVersion.version).toBe(4);
      expect(currentVersion.files[0].content).toBe('v4');

      // Verify iteration chain
      const allIterations = await db
        .select()
        .from(prototypeIterations)
        .where(eq(prototypeIterations.prototypeId, currentVersion.id));

      expect(allIterations).toHaveLength(1);
      expect(allIterations[0].feedback).toBe('Make it responsive');
    });

    it('should preserve deployment URL across iterations', async () => {
      // ARRANGE: Prototype with specific URL
      const originalUrl = 'https://prototypes.quetrex.app/proto-preserve';

      const [original] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-preserve',
          deploymentUrl: originalUrl,
          deploymentStatus: 'ready',
          title: 'URL Preservation Test',
          description: 'Testing URL preservation',
          files: [{ path: 'page.tsx', content: 'v1' }],
          version: 1,
        })
        .returning();

      // Mock iteration
      mockV0Client.chats.create.mockResolvedValue({
        id: 'chat-preserve',
        files: [{ path: 'page.tsx', content: 'v2' }],
      });

      // ACT: Iterate
      const v0Response = await mockV0Service.iterate('chat-preserve', 'Update design');
      const deployment = await mockDeploymentService.redeploy(originalUrl);

      const [iteration] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-preserve',
          deploymentUrl: deployment.url,
          deploymentStatus: deployment.status,
          title: original.title,
          description: original.description,
          files: v0Response.files,
          version: 2,
          parentId: original.id,
        })
        .returning();

      // ASSERT: URL preserved
      expect(iteration.deploymentUrl).toBe(originalUrl);
      expect(iteration.version).toBe(2);
    });
  });

  // ==========================================================================
  // Error Handling: v0 API Failure, Deployment Failure
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle v0 API failure with retry', async () => {
      // ARRANGE: Mock v0 API to fail twice, then succeed
      let attemptCount = 0;

      mockV0Client.chats.create.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('v0 API temporarily unavailable');
        }
        return {
          id: 'chat-retry',
          files: [{ path: 'page.tsx', content: 'Success after retry' }],
        };
      });

      // ACT: Generate (should retry and succeed)
      const result = await mockV0Service.generate({
        prompt: 'Create a simple page',
        framework: 'nextjs',
        styling: 'tailwind',
      });

      // ASSERT: Succeeded after retries
      expect(result.chatId).toBe('chat-retry');
      expect(attemptCount).toBe(3);
      expect(result.files[0].content).toBe('Success after retry');
    });

    it('should throw V0ApiError after max retries exhausted', async () => {
      // ARRANGE: Mock v0 API to always fail
      mockV0Client.chats.create.mockRejectedValue(new Error('v0 API down'));

      // ACT & ASSERT: Throws after all retries
      await expect(
        mockV0Service.generate({
          prompt: 'Create a page',
          framework: 'nextjs',
          styling: 'tailwind',
        })
      ).rejects.toThrow(V0ApiError);

      // Should have tried 3 times (maxRetries)
      expect(mockV0Client.chats.create).toHaveBeenCalledTimes(3);
    });

    it('should save prototype with error status on deployment failure', async () => {
      // ARRANGE: Mock successful v0 generation but failed deployment
      mockV0Client.chats.create.mockResolvedValue({
        id: 'chat-deploy-fail',
        files: [{ path: 'page.tsx', content: 'export default function Page() {}' }],
      });

      const spec: ArchitectSpec = {
        screen: 'Deploy Fail Test',
        description: 'Test deployment failure',
        route: '/deploy-fail',
        layout: { type: 'flex' },
        components: [{ name: 'Test', type: 'div', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Generate successfully
      const v0Response = await mockV0Service.generate({
        prompt: buildV0Prompt(spec),
        framework: 'nextjs',
        styling: 'tailwind',
      });

      // Simulate deployment failure
      const deploymentError = 'Deployment failed: Vercel API error';

      // Save prototype with error status
      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: v0Response.chatId,
          deploymentUrl: 'pending',
          deploymentStatus: 'error',
          title: spec.screen,
          description: `${spec.description}\n\nError: ${deploymentError}`,
          files: v0Response.files,
          version: 1,
        })
        .returning();

      // ASSERT: Prototype saved with error status
      expect(prototype.deploymentStatus).toBe('error');
      expect(prototype.description).toContain('Deployment failed');
      expect(prototype.deploymentUrl).toBe('pending');
      expect(prototype.files).toHaveLength(1); // Code still available
    });

    it('should validate v0 API key before making requests', async () => {
      // ARRANGE & ACT & ASSERT: Empty API key
      expect(() => new V0IntegrationService('')).toThrow(V0ValidationError);
      expect(() => new V0IntegrationService('   ')).toThrow(V0ValidationError);
      expect(() => new V0IntegrationService('')).toThrow('v0 API key is required');
    });

    it('should validate generation request parameters', async () => {
      // ARRANGE: Invalid requests
      const invalidRequests: V0GenerationRequest[] = [
        {
          prompt: '', // Empty prompt
          framework: 'nextjs',
          styling: 'tailwind',
        },
        {
          prompt: '   ', // Whitespace-only prompt
          framework: 'nextjs',
          styling: 'tailwind',
        },
      ];

      // ACT & ASSERT: All invalid requests throw validation error
      for (const request of invalidRequests) {
        await expect(mockV0Service.generate(request)).rejects.toThrow(V0ValidationError);
      }
    });

    it('should validate iteration parameters', async () => {
      // ARRANGE & ACT & ASSERT: Invalid chatId
      await expect(mockV0Service.iterate('', 'Some feedback')).rejects.toThrow(V0ValidationError);

      // Invalid feedback
      await expect(mockV0Service.iterate('chat-123', '')).rejects.toThrow(V0ValidationError);

      // Both invalid
      await expect(mockV0Service.iterate('', '')).rejects.toThrow(V0ValidationError);
    });

    it('should handle malformed v0 API responses', async () => {
      // ARRANGE: Mock malformed response
      mockV0Client.chats.create.mockResolvedValue({
        // Missing id field
        files: [],
      });

      // ACT & ASSERT: Throws error for invalid response
      await expect(
        mockV0Service.generate({
          prompt: 'Create a page',
          framework: 'nextjs',
          styling: 'tailwind',
        })
      ).rejects.toThrow(V0ApiError);
    });
  });

  // ==========================================================================
  // Database Operations: Create, Update, Query Prototypes
  // ==========================================================================

  describe('Database Operations', () => {
    it('should create prototype with all fields', async () => {
      // ARRANGE: Complete prototype data
      const prototypeData = {
        projectId: testProjectId,
        v0ChatId: 'chat-complete',
        v0DemoUrl: 'https://v0.dev/chat/chat-complete',
        deploymentUrl: 'https://prototypes.quetrex.app/proto-complete',
        deploymentStatus: 'ready' as const,
        title: 'Complete Prototype',
        description: 'Prototype with all fields',
        specPath: '/architect-sessions/project/spec.yml',
        files: [
          { path: 'page.tsx', content: 'export default function Page() {}' },
          { path: 'layout.tsx', content: 'export default function Layout() {}' },
        ],
        version: 1,
      };

      // ACT: Insert prototype
      const [prototype] = await db.insert(prototypes).values(prototypeData).returning();

      // ASSERT: All fields saved correctly
      expect(prototype.id).toBeDefined();
      expect(prototype.projectId).toBe(testProjectId);
      expect(prototype.v0ChatId).toBe('chat-complete');
      expect(prototype.v0DemoUrl).toBe('https://v0.dev/chat/chat-complete');
      expect(prototype.deploymentUrl).toBe('https://prototypes.quetrex.app/proto-complete');
      expect(prototype.deploymentStatus).toBe('ready');
      expect(prototype.title).toBe('Complete Prototype');
      expect(prototype.description).toBe('Prototype with all fields');
      expect(prototype.specPath).toBe('/architect-sessions/project/spec.yml');
      expect(prototype.files).toHaveLength(2);
      expect(prototype.version).toBe(1);
      expect(prototype.createdAt).toBeInstanceOf(Date);
      expect(prototype.updatedAt).toBeInstanceOf(Date);
    });

    it('should query prototypes by project', async () => {
      // ARRANGE: Create multiple prototypes
      const prototypesToCreate = [
        {
          projectId: testProjectId,
          v0ChatId: 'chat-query-1',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-query-1',
          deploymentStatus: 'ready' as const,
          title: 'Query Test 1',
          description: 'First prototype',
          files: [{ path: 'page.tsx', content: 'v1' }],
          version: 1,
        },
        {
          projectId: testProjectId,
          v0ChatId: 'chat-query-2',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-query-2',
          deploymentStatus: 'ready' as const,
          title: 'Query Test 2',
          description: 'Second prototype',
          files: [{ path: 'page.tsx', content: 'v2' }],
          version: 1,
        },
      ];

      await db.insert(prototypes).values(prototypesToCreate);

      // ACT: Query all prototypes for project
      const projectPrototypes = await db
        .select()
        .from(prototypes)
        .where(eq(prototypes.projectId, testProjectId));

      // ASSERT: All prototypes returned
      expect(projectPrototypes.length).toBeGreaterThanOrEqual(2);

      const queryTestPrototypes = projectPrototypes.filter((p) =>
        p.title.startsWith('Query Test')
      );
      expect(queryTestPrototypes).toHaveLength(2);
    });

    it('should query prototype by v0ChatId', async () => {
      // ARRANGE: Create prototype with specific chatId
      const uniqueChatId = 'chat-unique-query';

      await db.insert(prototypes).values({
        projectId: testProjectId,
        v0ChatId: uniqueChatId,
        deploymentUrl: 'https://prototypes.quetrex.app/proto-unique',
        deploymentStatus: 'ready',
        title: 'Unique Chat ID Test',
        description: 'Testing unique chat ID query',
        files: [{ path: 'page.tsx', content: 'test' }],
        version: 1,
      });

      // ACT: Query by v0ChatId
      const [found] = await db
        .select()
        .from(prototypes)
        .where(eq(prototypes.v0ChatId, uniqueChatId));

      // ASSERT: Found correct prototype
      expect(found).toBeDefined();
      expect(found.v0ChatId).toBe(uniqueChatId);
      expect(found.title).toBe('Unique Chat ID Test');
    });

    it('should update prototype deployment status', async () => {
      // ARRANGE: Create prototype with pending status
      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-status-update',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-status',
          deploymentStatus: 'deploying',
          title: 'Status Update Test',
          description: 'Testing status updates',
          files: [{ path: 'page.tsx', content: 'test' }],
          version: 1,
        })
        .returning();

      // ACT: Update status to ready
      const [updated] = await db
        .update(prototypes)
        .set({
          deploymentStatus: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(prototypes.id, prototype.id))
        .returning();

      // ASSERT: Status updated
      expect(updated.deploymentStatus).toBe('ready');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(prototype.updatedAt.getTime());
    });

    it('should delete prototype and cascade iterations', async () => {
      // ARRANGE: Create prototype with iterations
      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-delete-test',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-delete',
          deploymentStatus: 'ready',
          title: 'Delete Test',
          description: 'Testing deletion',
          files: [{ path: 'page.tsx', content: 'test' }],
          version: 1,
        })
        .returning();

      // Add iteration
      await db.insert(prototypeIterations).values({
        prototypeId: prototype.id,
        feedback: 'Test feedback',
        changesApplied: 'Test changes',
      });

      // ACT: Delete prototype
      await db.delete(prototypes).where(eq(prototypes.id, prototype.id));

      // ASSERT: Prototype deleted
      const found = await db.select().from(prototypes).where(eq(prototypes.id, prototype.id));
      expect(found).toHaveLength(0);

      // Iterations also deleted (cascade)
      const foundIterations = await db
        .select()
        .from(prototypeIterations)
        .where(eq(prototypeIterations.prototypeId, prototype.id));
      expect(foundIterations).toHaveLength(0);
    });

    it('should query prototype with iterations', async () => {
      // ARRANGE: Create prototype with multiple iterations
      const [prototype] = await db
        .insert(prototypes)
        .values({
          projectId: testProjectId,
          v0ChatId: 'chat-with-iterations',
          deploymentUrl: 'https://prototypes.quetrex.app/proto-iterations',
          deploymentStatus: 'ready',
          title: 'Prototype with Iterations',
          description: 'Testing iteration queries',
          files: [{ path: 'page.tsx', content: 'v1' }],
          version: 1,
        })
        .returning();

      // Add iterations
      const iterationsData = [
        { feedback: 'Change color', changesApplied: 'Color changed' },
        { feedback: 'Add spacing', changesApplied: 'Spacing added' },
        { feedback: 'Fix layout', changesApplied: 'Layout fixed' },
      ];

      for (const iteration of iterationsData) {
        await db.insert(prototypeIterations).values({
          prototypeId: prototype.id,
          ...iteration,
        });
      }

      // ACT: Query iterations
      const iterations = await db
        .select()
        .from(prototypeIterations)
        .where(eq(prototypeIterations.prototypeId, prototype.id));

      // ASSERT: All iterations returned
      expect(iterations).toHaveLength(3);
      expect(iterations[0].feedback).toBe('Change color');
      expect(iterations[1].feedback).toBe('Add spacing');
      expect(iterations[2].feedback).toBe('Fix layout');
    });
  });

  // ==========================================================================
  // Design Tokens Integration
  // ==========================================================================

  describe('Design Tokens Integration', () => {
    it('should extract and apply design tokens to v0 prompt', async () => {
      // ARRANGE: Spec with comprehensive design tokens
      const spec: ArchitectSpec = {
        screen: 'Branded Dashboard',
        description: 'Dashboard with custom branding',
        route: '/branded',
        layout: { type: 'grid', columns: 2 },
        components: [{ name: 'Header', type: 'header', props: {} }],
        behavior: { interactions: [], states: [] },
        design_tokens: {
          colors: {
            primary: '#6366f1',
            secondary: '#8b5cf6',
            background: '#0a0a0a',
            text: '#ffffff',
          },
          spacing: {
            sm: '0.5rem',
            md: '1rem',
            lg: '2rem',
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
          },
        },
      };

      // ACT: Extract tokens
      const tokens = extractDesignTokens(spec);

      // Build prompt with tokens
      const prompt = buildV0Prompt(spec);

      // ASSERT: Tokens extracted correctly
      expect(tokens.colors).toEqual(spec.design_tokens.colors);
      expect(tokens.spacing).toEqual(spec.design_tokens.spacing);
      expect(tokens.typography).toEqual(spec.design_tokens.typography);

      // Prompt includes token information
      expect(prompt).toContain('#6366f1');
      expect(prompt).toContain('#8b5cf6');
      expect(prompt).toContain('0.5rem');
      expect(prompt).toContain('Inter, sans-serif');
    });

    it('should handle spec without design tokens', async () => {
      // ARRANGE: Spec without design_tokens field
      const spec: ArchitectSpec = {
        screen: 'No Tokens',
        description: 'Spec without design tokens',
        route: '/no-tokens',
        layout: { type: 'flex' },
        components: [{ name: 'Content', type: 'div', props: {} }],
        behavior: { interactions: [], states: [] },
      };

      // ACT: Extract tokens
      const tokens = extractDesignTokens(spec);

      // Build prompt
      const prompt = buildV0Prompt(spec);

      // ASSERT: Empty tokens object
      expect(tokens).toEqual({});

      // Prompt doesn't include design tokens section
      expect(prompt).not.toContain('Design Tokens');
    });
  });
});
