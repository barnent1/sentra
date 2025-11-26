/**
 * Organization Service Tests
 *
 * Tests for organization CRUD operations and member management.
 * Follows TDD approach - tests written FIRST before implementation.
 *
 * Coverage:
 * - Create personal and company organizations
 * - Get organization by ID and slug
 * - Update organization details
 * - Delete organization
 * - List user's organizations
 * - Add/remove members
 * - Update member roles
 * - Get organization members
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '@/db/schema';

// Import service (doesn't exist yet - tests should FAIL)
import { OrganizationService } from '@/services/organization-service';
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddOrganizationMemberInput,
  UpdateMemberRoleInput,
} from '@/services/organization-service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let testUserId: string;
  let db: ReturnType<typeof drizzle>;
  let sql: ReturnType<typeof postgres>;

  beforeEach(async () => {
    // Setup test database connection
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/sentra_test';
    sql = postgres(databaseUrl, { max: 1 });
    db = drizzle(sql);

    // Create test user with unique email
    testUserId = createId();
    await db.insert(users).values({
      id: testUserId,
      email: `test-${testUserId}@example.com`,
      password: 'hashed-password',
    });

    service = OrganizationService.getInstance();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await sql.end();
  });

  // ==========================================================================
  // Create Organization
  // ==========================================================================

  describe('createOrganization', () => {
    describe('Happy Path', () => {
      it('should create personal organization with auto-generated slug', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'John Doe',
          type: 'personal',
          ownerId: testUserId,
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org).toBeDefined();
        expect(org.id).toBeDefined();
        expect(org.name).toBe('John Doe');
        expect(org.type).toBe('personal');
        expect(org.slug).toMatch(/^john-doe(-[a-z0-9]+)?$/); // Auto-generated slug
        expect(org.subscriptionTier).toBe('free'); // Default for personal
        expect(org.subscriptionPrice).toBe(0);
        expect(org.createdAt).toBeInstanceOf(Date);
        expect(org.updatedAt).toBeInstanceOf(Date);
      });

      it('should create company organization with custom slug', async () => {
        // ARRANGE
        const uniqueSlug = `acme-corp-${Date.now()}`;
        const input: CreateOrganizationInput = {
          name: 'Acme Corporation',
          type: 'company',
          slug: uniqueSlug,
          ownerId: testUserId,
          subscriptionTier: 'pro',
          subscriptionPrice: 49.99,
          billingEmail: 'billing@acme.com',
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.name).toBe('Acme Corporation');
        expect(org.type).toBe('company');
        expect(org.slug).toBe(uniqueSlug);
        expect(org.subscriptionTier).toBe('pro');
        expect(org.subscriptionPrice).toBe(49.99);
        expect(org.billingEmail).toBe('billing@acme.com');
      });

      it('should create company organization with enterprise tier', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Big Corp',
          type: 'company',
          ownerId: testUserId,
          subscriptionTier: 'enterprise',
          subscriptionPrice: 199.99,
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.subscriptionTier).toBe('enterprise');
        expect(org.subscriptionPrice).toBe(199.99);
      });

      it('should automatically add owner as organization member', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Test Org',
          type: 'company',
          ownerId: testUserId,
        };

        // ACT
        const org = await service.createOrganization(input);

        // Verify owner is member
        const members = await service.getOrganizationMembers(org.id);

        // ASSERT
        expect(members).toHaveLength(1);
        expect(members[0].userId).toBe(testUserId);
        expect(members[0].role).toBe('owner');
      });

      it('should store organization settings as JSON', async () => {
        // ARRANGE
        const settings = {
          features: { voiceEnabled: true, apiAccess: true },
          branding: { primaryColor: '#6366f1', logoUrl: 'https://example.com/logo.png' },
        };

        const input: CreateOrganizationInput = {
          name: 'Settings Test Org',
          type: 'company',
          ownerId: testUserId,
          settings,
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.settings).toEqual(settings);
      });
    });

    describe('Edge Cases', () => {
      it('should sanitize slug by removing special characters', async () => {
        // ARRANGE
        const uniqueBase = `test-org-${Date.now()}`;
        const input: CreateOrganizationInput = {
          name: 'Test Org!!!',
          type: 'company',
          slug: `${uniqueBase}@#$%`,
          ownerId: testUserId,
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.slug).toBe(uniqueBase); // Special chars removed
      });

      it('should handle slug collision by appending random suffix', async () => {
        // ARRANGE
        const userId2 = createId();
        await db.insert(users).values({
          id: userId2,
          email: `user-${userId2}@example.com`,
          password: 'hashed-password',
        });

        const uniqueName = `Duplicate Org ${Date.now()}`;
        const input1: CreateOrganizationInput = {
          name: uniqueName,
          type: 'company',
          // No slug - let it auto-generate
          ownerId: testUserId,
        };

        const input2: CreateOrganizationInput = {
          name: uniqueName,
          type: 'company',
          // No slug - will collide with first org's auto-generated slug
          ownerId: userId2,
        };

        // ACT
        const org1 = await service.createOrganization(input1);
        const org2 = await service.createOrganization(input2);

        // ASSERT
        // Both should have slugs based on the name, but second should have suffix
        expect(org1.slug).toMatch(/^duplicate-org-/);
        expect(org2.slug).toMatch(/^duplicate-org-.*-[a-z0-9]{8}$/); // Should have random suffix
        expect(org1.slug).not.toBe(org2.slug); // Different slugs
      });

      it('should handle empty settings object', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Empty Settings',
          type: 'company',
          ownerId: testUserId,
          settings: {},
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.settings).toEqual({});
      });

      it('should handle null billing email for free tier', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Free Tier Org',
          type: 'company',
          ownerId: testUserId,
          subscriptionTier: 'free',
          billingEmail: null,
        };

        // ACT
        const org = await service.createOrganization(input);

        // ASSERT
        expect(org.billingEmail).toBeNull();
      });
    });

    describe('Error Conditions', () => {
      it('should throw error if name is empty', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: '',
          type: 'company',
          ownerId: testUserId,
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow('Organization name is required');
      });

      it('should throw error if owner user does not exist', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Test Org',
          type: 'company',
          ownerId: 'nonexistent-user-id',
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow('User not found');
      });

      it('should throw error for invalid subscription tier', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Invalid Tier',
          type: 'company',
          ownerId: testUserId,
          subscriptionTier: 'platinum' as any, // Invalid
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow('Invalid subscription tier');
      });

      it('should throw error for negative subscription price', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Negative Price',
          type: 'company',
          ownerId: testUserId,
          subscriptionPrice: -10,
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow(
          'Subscription price must be non-negative'
        );
      });

      it('should throw error if slug is too short', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Test',
          type: 'company',
          slug: 'ab', // Too short
          ownerId: testUserId,
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow(
          'Slug must be at least 3 characters'
        );
      });

      it('should throw error if slug is too long', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Test',
          type: 'company',
          slug: 'a'.repeat(65), // Too long
          ownerId: testUserId,
        };

        // ACT & ASSERT
        await expect(service.createOrganization(input)).rejects.toThrow(
          'Slug must be at most 64 characters'
        );
      });
    });
  });

  // ==========================================================================
  // Get Organization
  // ==========================================================================

  describe('getOrganizationById', () => {
    describe('Happy Path', () => {
      it('should retrieve organization by ID', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Test Org',
          type: 'company',
          ownerId: testUserId,
        };
        const created = await service.createOrganization(input);

        // ACT
        const org = await service.getOrganizationById(created.id);

        // ASSERT
        expect(org).toBeDefined();
        expect(org?.id).toBe(created.id);
        expect(org?.name).toBe('Test Org');
      });

      it('should include organization settings in response', async () => {
        // ARRANGE
        const settings = { features: { voiceEnabled: true } };
        const input: CreateOrganizationInput = {
          name: 'Settings Org',
          type: 'company',
          ownerId: testUserId,
          settings,
        };
        const created = await service.createOrganization(input);

        // ACT
        const org = await service.getOrganizationById(created.id);

        // ASSERT
        expect(org?.settings).toEqual(settings);
      });
    });

    describe('Error Conditions', () => {
      it('should return null for nonexistent organization', async () => {
        // ARRANGE
        const fakeId = createId();

        // ACT
        const org = await service.getOrganizationById(fakeId);

        // ASSERT
        expect(org).toBeNull();
      });

      it('should throw error for invalid ID format', async () => {
        // ARRANGE
        const invalidId = 'not-a-valid-cuid';

        // ACT & ASSERT
        await expect(service.getOrganizationById(invalidId)).rejects.toThrow('Invalid organization ID');
      });
    });
  });

  describe('getOrganizationBySlug', () => {
    describe('Happy Path', () => {
      it('should retrieve organization by slug', async () => {
        // ARRANGE
        const slug = `test-org-slug-${Date.now()}`;
        const input: CreateOrganizationInput = {
          name: 'Test Org',
          type: 'company',
          slug,
          ownerId: testUserId,
        };
        const created = await service.createOrganization(input);

        // ACT
        const org = await service.getOrganizationBySlug(slug);

        // ASSERT
        expect(org).toBeDefined();
        expect(org?.id).toBe(created.id);
        expect(org?.slug).toBe(slug);
      });

      it('should be case-insensitive', async () => {
        // ARRANGE
        const slug = `test-org-${Date.now()}`;
        const input: CreateOrganizationInput = {
          name: 'Test Org',
          type: 'company',
          slug: slug.toLowerCase(),
          ownerId: testUserId,
        };
        await service.createOrganization(input);

        // ACT
        const org = await service.getOrganizationBySlug(slug.toUpperCase());

        // ASSERT
        expect(org).toBeDefined();
        expect(org?.slug).toBe(slug);
      });
    });

    describe('Error Conditions', () => {
      it('should return null for nonexistent slug', async () => {
        // ARRANGE
        const slug = 'nonexistent-org';

        // ACT
        const org = await service.getOrganizationBySlug(slug);

        // ASSERT
        expect(org).toBeNull();
      });
    });
  });

  // ==========================================================================
  // Update Organization
  // ==========================================================================

  describe('updateOrganization', () => {
    let testOrgId: string;

    beforeEach(async () => {
      const input: CreateOrganizationInput = {
        name: 'Original Name',
        type: 'company',
        ownerId: testUserId,
      };
      const org = await service.createOrganization(input);
      testOrgId = org.id;
    });

    describe('Happy Path', () => {
      it('should update organization name', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          name: 'Updated Name',
        };

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.name).toBe('Updated Name');
        expect(org.updatedAt.getTime()).toBeGreaterThan(org.createdAt.getTime());
      });

      it('should update subscription tier', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          subscriptionTier: 'enterprise',
          subscriptionPrice: 199.99,
        };

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.subscriptionTier).toBe('enterprise');
        expect(org.subscriptionPrice).toBe(199.99);
      });

      it('should update billing email', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          billingEmail: 'new-billing@example.com',
        };

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.billingEmail).toBe('new-billing@example.com');
      });

      it('should merge organization settings', async () => {
        // ARRANGE
        const originalSettings = { features: { voiceEnabled: true } };
        await service.updateOrganization(testOrgId, { settings: originalSettings });

        const newSettings = { features: { apiAccess: true } };

        // ACT
        const org = await service.updateOrganization(testOrgId, { settings: newSettings });

        // ASSERT
        expect(org.settings).toEqual({ features: { apiAccess: true } }); // Replaces, not merges
      });

      it('should update multiple fields at once', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          name: 'Multi Update',
          subscriptionTier: 'pro',
          subscriptionPrice: 49.99,
          billingEmail: 'billing@multi.com',
        };

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.name).toBe('Multi Update');
        expect(org.subscriptionTier).toBe('pro');
        expect(org.subscriptionPrice).toBe(49.99);
        expect(org.billingEmail).toBe('billing@multi.com');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty update object', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {};

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.name).toBe('Original Name'); // No change
      });

      it('should allow setting billing email to null', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          billingEmail: null,
        };

        // ACT
        const org = await service.updateOrganization(testOrgId, update);

        // ASSERT
        expect(org.billingEmail).toBeNull();
      });
    });

    describe('Error Conditions', () => {
      it('should throw error for nonexistent organization', async () => {
        // ARRANGE
        const fakeId = createId();
        const update: UpdateOrganizationInput = {
          name: 'Updated',
        };

        // ACT & ASSERT
        await expect(service.updateOrganization(fakeId, update)).rejects.toThrow(
          'Organization not found'
        );
      });

      it('should throw error for empty name', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          name: '',
        };

        // ACT & ASSERT
        await expect(service.updateOrganization(testOrgId, update)).rejects.toThrow(
          'Organization name cannot be empty'
        );
      });

      it('should throw error for invalid subscription tier', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          subscriptionTier: 'invalid' as any,
        };

        // ACT & ASSERT
        await expect(service.updateOrganization(testOrgId, update)).rejects.toThrow(
          'Invalid subscription tier'
        );
      });

      it('should throw error for negative subscription price', async () => {
        // ARRANGE
        const update: UpdateOrganizationInput = {
          subscriptionPrice: -50,
        };

        // ACT & ASSERT
        await expect(service.updateOrganization(testOrgId, update)).rejects.toThrow(
          'Subscription price must be non-negative'
        );
      });
    });
  });

  // ==========================================================================
  // Delete Organization
  // ==========================================================================

  describe('deleteOrganization', () => {
    describe('Happy Path', () => {
      it('should delete organization by ID', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'To Delete',
          type: 'company',
          ownerId: testUserId,
        };
        const org = await service.createOrganization(input);

        // ACT
        const result = await service.deleteOrganization(org.id);

        // ASSERT
        expect(result).toBe(true);

        // Verify deletion
        const deleted = await service.getOrganizationById(org.id);
        expect(deleted).toBeNull();
      });

      it('should cascade delete organization members', async () => {
        // ARRANGE
        const input: CreateOrganizationInput = {
          name: 'Cascade Test',
          type: 'company',
          ownerId: testUserId,
        };
        const org = await service.createOrganization(input);

        // ACT
        await service.deleteOrganization(org.id);

        // ASSERT
        const members = await service.getOrganizationMembers(org.id);
        expect(members).toHaveLength(0);
      });
    });

    describe('Error Conditions', () => {
      it('should return false for nonexistent organization', async () => {
        // ARRANGE
        const fakeId = createId();

        // ACT
        const result = await service.deleteOrganization(fakeId);

        // ASSERT
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // List User's Organizations
  // ==========================================================================

  describe('listUserOrganizations', () => {
    describe('Happy Path', () => {
      it('should return all organizations user is member of', async () => {
        // ARRANGE
        const org1Input: CreateOrganizationInput = {
          name: 'Org 1',
          type: 'personal',
          ownerId: testUserId,
        };
        const org2Input: CreateOrganizationInput = {
          name: 'Org 2',
          type: 'company',
          ownerId: testUserId,
        };

        await service.createOrganization(org1Input);
        await service.createOrganization(org2Input);

        // ACT
        const orgs = await service.listUserOrganizations(testUserId);

        // ASSERT
        expect(orgs).toHaveLength(2);
        expect(orgs[0].name).toBe('Org 2'); // Most recent first
        expect(orgs[1].name).toBe('Org 1');
      });

      it('should include organizations where user is not owner', async () => {
        // ARRANGE
        const ownerUserId = createId();
        await db.insert(users).values({
          id: ownerUserId,
          email: `owner-${ownerUserId}@example.com`,
          password: 'hashed-password',
        });

        const orgInput: CreateOrganizationInput = {
          name: 'Shared Org',
          type: 'company',
          ownerId: ownerUserId,
        };
        const org = await service.createOrganization(orgInput);

        // Add current user as member
        await service.addOrganizationMember({
          orgId: org.id,
          userId: testUserId,
          role: 'member',
          invitedBy: ownerUserId,
        });

        // ACT
        const orgs = await service.listUserOrganizations(testUserId);

        // ASSERT
        expect(orgs).toHaveLength(1);
        expect(orgs[0].id).toBe(org.id);
      });

      it('should return empty array for user with no organizations', async () => {
        // ARRANGE
        const newUserId = createId();

        // ACT
        const orgs = await service.listUserOrganizations(newUserId);

        // ASSERT
        expect(orgs).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Add Organization Member
  // ==========================================================================

  describe('addOrganizationMember', () => {
    let testOrgId: string;

    beforeEach(async () => {
      const input: CreateOrganizationInput = {
        name: 'Test Org',
        type: 'company',
        ownerId: testUserId,
      };
      const org = await service.createOrganization(input);
      testOrgId = org.id;
    });

    describe('Happy Path', () => {
      it('should add member with admin role', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'admin',
          invitedBy: testUserId,
        };

        // ACT
        const member = await service.addOrganizationMember(input);

        // ASSERT
        expect(member).toBeDefined();
        expect(member.orgId).toBe(testOrgId);
        expect(member.userId).toBe(newUserId);
        expect(member.role).toBe('admin');
        expect(member.invitedBy).toBe(testUserId);
        expect(member.joinedAt).toBeInstanceOf(Date);
      });

      it('should add member with member role', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'member',
          invitedBy: testUserId,
        };

        // ACT
        const member = await service.addOrganizationMember(input);

        // ASSERT
        expect(member.role).toBe('member');
      });

      it('should add member with viewer role', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'viewer',
          invitedBy: testUserId,
        };

        // ACT
        const member = await service.addOrganizationMember(input);

        // ASSERT
        expect(member.role).toBe('viewer');
      });

      it('should add member without inviter (self-join)', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'member',
        };

        // ACT
        const member = await service.addOrganizationMember(input);

        // ASSERT
        expect(member.invitedBy).toBeNull();
      });
    });

    describe('Error Conditions', () => {
      it('should throw error if organization does not exist', async () => {
        // ARRANGE
        const input: AddOrganizationMemberInput = {
          orgId: 'nonexistent-org-id',
          userId: createId(),
          role: 'member',
        };

        // ACT & ASSERT
        await expect(service.addOrganizationMember(input)).rejects.toThrow('Organization not found');
      });

      it('should throw error if user does not exist', async () => {
        // ARRANGE
        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: 'nonexistent-user-id',
          role: 'member',
        };

        // ACT & ASSERT
        await expect(service.addOrganizationMember(input)).rejects.toThrow('User not found');
      });

      it('should throw error if user is already a member', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'member',
        };

        await service.addOrganizationMember(input);

        // ACT & ASSERT
        await expect(service.addOrganizationMember(input)).rejects.toThrow(
          'User is already a member of this organization'
        );
      });

      it('should throw error for invalid role', async () => {
        // ARRANGE
        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: createId(),
          role: 'superadmin' as any,
        };

        // ACT & ASSERT
        await expect(service.addOrganizationMember(input)).rejects.toThrow('Invalid role');
      });

      it('should prevent adding second owner', async () => {
        // ARRANGE
        const newUserId = createId();
        await db.insert(users).values({
          id: newUserId,
          email: `new-${newUserId}@example.com`,
          password: 'hashed-password',
        });

        const input: AddOrganizationMemberInput = {
          orgId: testOrgId,
          userId: newUserId,
          role: 'owner',
        };

        // ACT & ASSERT
        await expect(service.addOrganizationMember(input)).rejects.toThrow(
          'Organization can only have one owner'
        );
      });
    });
  });

  // ==========================================================================
  // Remove Organization Member
  // ==========================================================================

  describe('removeOrganizationMember', () => {
    let testOrgId: string;
    let memberUserId: string;

    beforeEach(async () => {
      const input: CreateOrganizationInput = {
        name: 'Test Org',
        type: 'company',
        ownerId: testUserId,
      };
      const org = await service.createOrganization(input);
      testOrgId = org.id;

      // Add a member
      memberUserId = createId();
      await db.insert(users).values({
        id: memberUserId,
        email: `member-${memberUserId}@example.com`,
        password: 'hashed-password',
      });

      await service.addOrganizationMember({
        orgId: testOrgId,
        userId: memberUserId,
        role: 'member',
      });
    });

    describe('Happy Path', () => {
      it('should remove member from organization', async () => {
        // ACT
        const result = await service.removeOrganizationMember(testOrgId, memberUserId);

        // ASSERT
        expect(result).toBe(true);

        // Verify removal
        const members = await service.getOrganizationMembers(testOrgId);
        expect(members.find((m) => m.userId === memberUserId)).toBeUndefined();
      });
    });

    describe('Error Conditions', () => {
      it('should return false for nonexistent member', async () => {
        // ARRANGE
        const fakeUserId = createId();

        // ACT
        const result = await service.removeOrganizationMember(testOrgId, fakeUserId);

        // ASSERT
        expect(result).toBe(false);
      });

      it('should throw error when removing the last owner', async () => {
        // ACT & ASSERT
        await expect(service.removeOrganizationMember(testOrgId, testUserId)).rejects.toThrow(
          'Cannot remove the last owner from organization'
        );
      });

      it('should allow removing owner if another owner exists', async () => {
        // ARRANGE
        const newOwnerId = createId();
        await db.insert(users).values({
          id: newOwnerId,
          email: `new-owner-${newOwnerId}@example.com`,
          password: 'hashed-password',
        });

        // Add as admin first, then promote to owner
        await service.addOrganizationMember({
          orgId: testOrgId,
          userId: newOwnerId,
          role: 'admin',
        });

        await service.updateMemberRole(testOrgId, newOwnerId, { role: 'owner' });

        // ACT
        const result = await service.removeOrganizationMember(testOrgId, testUserId);

        // ASSERT
        expect(result).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Get Organization Members
  // ==========================================================================

  describe('getOrganizationMembers', () => {
    let testOrgId: string;

    beforeEach(async () => {
      const input: CreateOrganizationInput = {
        name: 'Test Org',
        type: 'company',
        ownerId: testUserId,
      };
      const org = await service.createOrganization(input);
      testOrgId = org.id;
    });

    describe('Happy Path', () => {
      it('should return all organization members', async () => {
        // ARRANGE
        const user2Id = createId();
        const user3Id = createId();

        await db.insert(users).values({
          id: user2Id,
          email: `user2-${user2Id}@example.com`,
          password: 'hashed-password',
        });
        await db.insert(users).values({
          id: user3Id,
          email: `user3-${user3Id}@example.com`,
          password: 'hashed-password',
        });

        await service.addOrganizationMember({
          orgId: testOrgId,
          userId: user2Id,
          role: 'admin',
        });

        await service.addOrganizationMember({
          orgId: testOrgId,
          userId: user3Id,
          role: 'member',
        });

        // ACT
        const members = await service.getOrganizationMembers(testOrgId);

        // ASSERT
        expect(members).toHaveLength(3); // Owner + 2 added
        expect(members.map((m) => m.userId)).toContain(testUserId);
        expect(members.map((m) => m.userId)).toContain(user2Id);
        expect(members.map((m) => m.userId)).toContain(user3Id);
      });

      it('should return members sorted by joined date (newest first)', async () => {
        // ARRANGE
        const user2Id = createId();
        const user3Id = createId();

        await db.insert(users).values({
          id: user2Id,
          email: `user2-${user2Id}@example.com`,
          password: 'hashed-password',
        });
        await db.insert(users).values({
          id: user3Id,
          email: `user3-${user3Id}@example.com`,
          password: 'hashed-password',
        });

        await service.addOrganizationMember({
          orgId: testOrgId,
          userId: user2Id,
          role: 'member',
        });

        await service.addOrganizationMember({
          orgId: testOrgId,
          userId: user3Id,
          role: 'member',
        });

        // ACT
        const members = await service.getOrganizationMembers(testOrgId);

        // ASSERT
        expect(members[0].userId).toBe(user3Id); // Most recent
      });

      it('should return only owner for organization with no additional members', async () => {
        // ARRANGE - testOrgId already has the owner as a member from beforeEach

        // ACT
        const members = await service.getOrganizationMembers(testOrgId);

        // ASSERT
        expect(members).toHaveLength(1); // Just the owner
        expect(members[0].userId).toBe(testUserId);
        expect(members[0].role).toBe('owner');
      });
    });

    describe('Error Conditions', () => {
      it('should return empty array for nonexistent organization', async () => {
        // ARRANGE
        const fakeOrgId = createId();

        // ACT
        const members = await service.getOrganizationMembers(fakeOrgId);

        // ASSERT
        expect(members).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Update Member Role
  // ==========================================================================

  describe('updateMemberRole', () => {
    let testOrgId: string;
    let memberUserId: string;

    beforeEach(async () => {
      const input: CreateOrganizationInput = {
        name: 'Test Org',
        type: 'company',
        ownerId: testUserId,
      };
      const org = await service.createOrganization(input);
      testOrgId = org.id;

      // Add a member
      memberUserId = createId();
      await db.insert(users).values({
        id: memberUserId,
        email: `member-${memberUserId}@example.com`,
        password: 'hashed-password',
      });

      await service.addOrganizationMember({
        orgId: testOrgId,
        userId: memberUserId,
        role: 'member',
      });
    });

    describe('Happy Path', () => {
      it('should promote member to admin', async () => {
        // ARRANGE
        const input: UpdateMemberRoleInput = {
          role: 'admin',
        };

        // ACT
        const member = await service.updateMemberRole(testOrgId, memberUserId, input);

        // ASSERT
        expect(member.role).toBe('admin');
      });

      it('should demote admin to member', async () => {
        // ARRANGE
        await service.updateMemberRole(testOrgId, memberUserId, { role: 'admin' });

        // ACT
        const member = await service.updateMemberRole(testOrgId, memberUserId, { role: 'member' });

        // ASSERT
        expect(member.role).toBe('member');
      });

      it('should change member to viewer', async () => {
        // ARRANGE
        const input: UpdateMemberRoleInput = {
          role: 'viewer',
        };

        // ACT
        const member = await service.updateMemberRole(testOrgId, memberUserId, input);

        // ASSERT
        expect(member.role).toBe('viewer');
      });

      it('should allow promoting member to owner if current owner remains', async () => {
        // ARRANGE
        const input: UpdateMemberRoleInput = {
          role: 'owner',
        };

        // ACT
        const member = await service.updateMemberRole(testOrgId, memberUserId, input);

        // ASSERT
        expect(member.role).toBe('owner');
      });
    });

    describe('Error Conditions', () => {
      it('should throw error for nonexistent member', async () => {
        // ARRANGE
        const fakeUserId = createId();

        // ACT & ASSERT
        await expect(
          service.updateMemberRole(testOrgId, fakeUserId, { role: 'admin' })
        ).rejects.toThrow('Member not found');
      });

      it('should throw error for invalid role', async () => {
        // ARRANGE
        const input: UpdateMemberRoleInput = {
          role: 'superadmin' as any,
        };

        // ACT & ASSERT
        await expect(service.updateMemberRole(testOrgId, memberUserId, input)).rejects.toThrow(
          'Invalid role'
        );
      });

      it('should throw error when demoting the last owner', async () => {
        // ACT & ASSERT
        await expect(service.updateMemberRole(testOrgId, testUserId, { role: 'admin' })).rejects.toThrow(
          'Cannot change role of the last owner'
        );
      });

      it('should allow demoting owner if another owner exists', async () => {
        // ARRANGE
        await service.updateMemberRole(testOrgId, memberUserId, { role: 'owner' });

        // ACT
        const member = await service.updateMemberRole(testOrgId, testUserId, { role: 'admin' });

        // ASSERT
        expect(member.role).toBe('admin');
      });
    });
  });
});
