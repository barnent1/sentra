/**
 * Organization Service
 *
 * Handles organization CRUD operations and member management.
 * Supports multi-tenancy with personal and company organizations.
 *
 * Features:
 * - Create/read/update/delete organizations
 * - Manage organization members and roles
 * - Handle subscription tiers and billing
 * - Slug generation and collision handling
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
  organizations,
  organizationMembers,
  users,
  type Organization,
  type OrganizationMember,
  type NewOrganization,
  type NewOrganizationMember,
} from '@/db/schema';

// ============================================================================
// Types
// ============================================================================

export type { Organization, OrganizationMember };

export interface CreateOrganizationInput {
  name: string;
  type: 'personal' | 'company';
  slug?: string;
  description?: string;
  ownerId: string;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  subscriptionPrice?: number;
  billingEmail?: string | null;
  settings?: Record<string, any>;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  subscriptionPrice?: number;
  billingEmail?: string | null;
  settings?: Record<string, any>;
}

export interface AddOrganizationMemberInput {
  orgId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy?: string;
}

export interface UpdateMemberRoleInput {
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

// ============================================================================
// Organization Service (Singleton)
// ============================================================================

export class OrganizationService {
  private static instance: OrganizationService;
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof postgres>;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/quetrex_test';
    this.sql = postgres(databaseUrl, { max: 10 });
    this.db = drizzle(this.sql);
  }

  static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  // ==========================================================================
  // Create Organization
  // ==========================================================================

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    // Validation
    if (!input.name || input.name.trim() === '') {
      throw new Error('Organization name is required');
    }

    if (input.subscriptionTier && !['free', 'pro', 'enterprise'].includes(input.subscriptionTier)) {
      throw new Error('Invalid subscription tier');
    }

    if (input.subscriptionPrice !== undefined && input.subscriptionPrice < 0) {
      throw new Error('Subscription price must be non-negative');
    }

    // Verify owner user exists
    const [owner] = await this.db.select().from(users).where(eq(users.id, input.ownerId));
    if (!owner) {
      throw new Error('User not found');
    }

    // Generate and sanitize slug
    let slug = input.slug || this.generateSlug(input.name);
    slug = this.sanitizeSlug(slug);

    if (slug.length < 3) {
      throw new Error('Slug must be at least 3 characters');
    }

    if (slug.length > 64) {
      throw new Error('Slug must be at most 64 characters');
    }

    // Handle slug collision (only if slug wasn't explicitly provided)
    if (!input.slug) {
      slug = await this.ensureUniqueSlug(slug);
    }

    // Prepare organization data
    const orgData: NewOrganization = {
      id: createId(),
      name: input.name,
      type: input.type,
      slug,
      description: input.description !== undefined ? input.description : null,
      subscriptionTier: input.subscriptionTier || 'free',
      subscriptionPrice: input.subscriptionPrice !== undefined ? input.subscriptionPrice : 0,
      billingEmail: input.billingEmail !== undefined ? input.billingEmail : null,
      settings: input.settings !== undefined ? JSON.stringify(input.settings) : null,
    };

    // Create organization
    const [org] = await this.db.insert(organizations).values(orgData).returning();

    // Automatically add owner as organization member
    await this.addOrganizationMember({
      orgId: org.id,
      userId: input.ownerId,
      role: 'owner',
    });

    // Parse settings back to object
    return this.parseOrganization(org);
  }

  // ==========================================================================
  // Get Organization
  // ==========================================================================

  async getOrganizationById(id: string): Promise<Organization | null> {
    // Validate ID format (basic CUID check)
    if (!this.isValidCuid(id)) {
      throw new Error('Invalid organization ID');
    }

    const [org] = await this.db.select().from(organizations).where(eq(organizations.id, id));
    return org ? this.parseOrganization(org) : null;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    // Case-insensitive slug lookup
    const normalizedSlug = slug.toLowerCase();
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, normalizedSlug));
    return org ? this.parseOrganization(org) : null;
  }

  // ==========================================================================
  // Update Organization
  // ==========================================================================

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    // Validation
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Organization name cannot be empty');
    }

    if (input.subscriptionTier && !['free', 'pro', 'enterprise'].includes(input.subscriptionTier)) {
      throw new Error('Invalid subscription tier');
    }

    if (input.subscriptionPrice !== undefined && input.subscriptionPrice < 0) {
      throw new Error('Subscription price must be non-negative');
    }

    // Prepare update data
    const updateData: Partial<Organization> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.subscriptionTier !== undefined) updateData.subscriptionTier = input.subscriptionTier;
    if (input.subscriptionPrice !== undefined) updateData.subscriptionPrice = input.subscriptionPrice;
    if (input.billingEmail !== undefined) updateData.billingEmail = input.billingEmail;
    if (input.settings !== undefined) {
      updateData.settings = JSON.stringify(input.settings);
    }

    // Update organization
    const [org] = await this.db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    if (!org) {
      throw new Error('Organization not found');
    }

    return this.parseOrganization(org);
  }

  // ==========================================================================
  // Delete Organization
  // ==========================================================================

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await this.db.delete(organizations).where(eq(organizations.id, id)).returning();
    return result.length > 0;
  }

  // ==========================================================================
  // List User Organizations
  // ==========================================================================

  async listUserOrganizations(userId: string): Promise<Organization[]> {
    const result = await this.db
      .select({
        org: organizations,
        member: organizationMembers,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .orderBy(desc(organizationMembers.joinedAt));

    return result.map((row) => this.parseOrganization(row.org));
  }

  // ==========================================================================
  // Organization Members
  // ==========================================================================

  async addOrganizationMember(input: AddOrganizationMemberInput): Promise<OrganizationMember> {
    // Validate role
    if (!['owner', 'admin', 'member', 'viewer'].includes(input.role)) {
      throw new Error('Invalid role');
    }

    // Check if organization exists
    const [org] = await this.db.select().from(organizations).where(eq(organizations.id, input.orgId));
    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user exists
    const [user] = await this.db.select().from(users).where(eq(users.id, input.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const [existing] = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, input.orgId),
          eq(organizationMembers.userId, input.userId)
        )
      );

    if (existing) {
      throw new Error('User is already a member of this organization');
    }

    // Prevent adding a second owner (use updateMemberRole for ownership transfer)
    if (input.role === 'owner') {
      const [existingOwner] = await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, input.orgId),
            eq(organizationMembers.role, 'owner')
          )
        );

      if (existingOwner) {
        throw new Error('Organization can only have one owner');
      }
    }

    const memberData: NewOrganizationMember = {
      id: createId(),
      orgId: input.orgId,
      userId: input.userId,
      role: input.role,
      invitedBy: input.invitedBy || null,
    };

    const [member] = await this.db.insert(organizationMembers).values(memberData).returning();
    return member;
  }

  async removeOrganizationMember(orgId: string, userId: string): Promise<boolean> {
    // Check if member exists and get their role
    const [member] = await this.db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));

    if (!member) {
      return false;
    }

    // Prevent removing the last owner
    if (member.role === 'owner') {
      const ownerCount = await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, orgId),
            eq(organizationMembers.role, 'owner')
          )
        );

      if (ownerCount.length <= 1) {
        throw new Error('Cannot remove the last owner from organization');
      }
    }

    const result = await this.db
      .delete(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    input: UpdateMemberRoleInput
  ): Promise<OrganizationMember> {
    // Validate role
    if (!['owner', 'admin', 'member', 'viewer'].includes(input.role)) {
      throw new Error('Invalid role');
    }

    // Check if member exists and get their current role
    const [existingMember] = await this.db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));

    if (!existingMember) {
      throw new Error('Member not found');
    }

    // Prevent demoting the last owner
    if (existingMember.role === 'owner' && input.role !== 'owner') {
      const ownerCount = await this.db
        .select()
        .from(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, 'owner')));

      if (ownerCount.length <= 1) {
        throw new Error('Cannot change role of the last owner');
      }
    }

    const [member] = await this.db
      .update(organizationMembers)
      .set({ role: input.role })
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))
      .returning();

    return member!;
  }

  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.orgId, orgId))
      .orderBy(desc(organizationMembers.joinedAt));
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric except hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private async ensureUniqueSlug(slug: string): Promise<string> {
    const existing = await this.getOrganizationBySlug(slug);
    if (!existing) {
      return slug;
    }

    // Append random suffix
    const suffix = createId().substring(0, 8);
    return `${slug}-${suffix}`;
  }

  private parseOrganization(org: Organization): Organization {
    return {
      ...org,
      settings: org.settings ? JSON.parse(org.settings as string) : null,
    };
  }

  private isValidCuid(id: string): boolean {
    // Basic CUID2 validation: reasonable length and alphanumeric
    // CUID2s are lowercase alphanumeric, typically 24-26 characters
    return typeof id === 'string' && id.length >= 20 && id.length <= 30 && /^[a-z0-9]+$/.test(id);
  }
}
