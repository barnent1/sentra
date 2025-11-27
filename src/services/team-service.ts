/**
 * Team Service
 *
 * Handles team operations within organizations.
 * Teams are used to group members for project collaboration.
 *
 * Features:
 * - Create/read/update/delete teams
 * - Manage team members and roles
 * - List teams within an organization
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
  teams,
  teamMembers,
  organizations,
  organizationMembers,
  users,
  type Team,
  type TeamMember,
  type NewTeam,
  type NewTeamMember,
} from '@/db/schema';

// ============================================================================
// Types
// ============================================================================

export type { Team, TeamMember };

export interface CreateTeamInput {
  orgId: string;
  name: string;
  description?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
}

export interface AddTeamMemberInput {
  teamId: string;
  userId: string;
  role: 'lead' | 'member';
}

export interface UpdateTeamMemberRoleInput {
  role: 'lead' | 'member';
}

// ============================================================================
// Team Service (Singleton)
// ============================================================================

export class TeamService {
  private static instance: TeamService;
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof postgres>;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/quetrex_test';
    this.sql = postgres(databaseUrl, { max: 10 });
    this.db = drizzle(this.sql);
  }

  static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  // ==========================================================================
  // Create Team
  // ==========================================================================

  async createTeam(input: CreateTeamInput): Promise<Team> {
    // Validate name
    const trimmedName = input.name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Team name is required');
    }

    if (trimmedName.length > 100) {
      throw new Error('Team name must be 100 characters or less');
    }

    // Verify organization exists
    const [org] = await this.db.select().from(organizations).where(eq(organizations.id, input.orgId));
    if (!org) {
      throw new Error('Organization not found');
    }

    // Check for duplicate team name in organization
    const [existingTeam] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.orgId, input.orgId), eq(teams.name, trimmedName)));

    if (existingTeam) {
      throw new Error('Team with this name already exists in organization');
    }

    // Create team
    const teamData: NewTeam = {
      id: createId(),
      orgId: input.orgId,
      name: trimmedName,
      description: input.description !== undefined ? input.description : null,
      updatedAt: new Date(),
    };

    const [team] = await this.db.insert(teams).values(teamData).returning();
    return team;
  }

  // ==========================================================================
  // Get Team
  // ==========================================================================

  async getTeamById(id: string): Promise<Team | null> {
    // Validate ID format (basic CUID check)
    if (!this.isValidCuid(id)) {
      throw new Error('Invalid team ID');
    }

    const [team] = await this.db.select().from(teams).where(eq(teams.id, id));
    return team || null;
  }

  // ==========================================================================
  // List Organization Teams
  // ==========================================================================

  async listOrganizationTeams(orgId: string): Promise<Team[]> {
    return this.db
      .select()
      .from(teams)
      .where(eq(teams.orgId, orgId))
      .orderBy(desc(teams.createdAt));
  }

  // ==========================================================================
  // Update Team
  // ==========================================================================

  async updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
    // Validate name if provided
    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Team name cannot be empty');
      }

      if (trimmedName.length > 100) {
        throw new Error('Team name must be 100 characters or less');
      }

      // Get team to check organization
      const [existingTeam] = await this.db.select().from(teams).where(eq(teams.id, id));
      if (!existingTeam) {
        throw new Error('Team not found');
      }

      // Check for duplicate name in organization (excluding current team)
      const [duplicateTeam] = await this.db
        .select()
        .from(teams)
        .where(and(eq(teams.orgId, existingTeam.orgId), eq(teams.name, trimmedName)));

      if (duplicateTeam && duplicateTeam.id !== id) {
        throw new Error('Team with this name already exists in organization');
      }
    }

    // Prepare update data
    const updateData: Partial<Team> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update team
    const [team] = await this.db.update(teams).set(updateData).where(eq(teams.id, id)).returning();

    if (!team) {
      throw new Error('Team not found');
    }

    return team;
  }

  // ==========================================================================
  // Delete Team
  // ==========================================================================

  async deleteTeam(id: string): Promise<boolean> {
    const result = await this.db.delete(teams).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  // ==========================================================================
  // Team Members
  // ==========================================================================

  async addTeamMember(input: AddTeamMemberInput): Promise<TeamMember> {
    // Validate role
    if (!['lead', 'member'].includes(input.role)) {
      throw new Error('Invalid team role');
    }

    // Check if team exists and get organization ID
    const [team] = await this.db.select().from(teams).where(eq(teams.id, input.teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user exists
    const [user] = await this.db.select().from(users).where(eq(users.id, input.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is an organization member
    const [orgMember] = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, team.orgId),
          eq(organizationMembers.userId, input.userId)
        )
      );

    if (!orgMember) {
      throw new Error('User must be an organization member before joining a team');
    }

    // Check if user is already a team member
    const [existing] = await this.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId)));

    if (existing) {
      throw new Error('User is already a member of this team');
    }

    // Add team member
    const memberData: NewTeamMember = {
      id: createId(),
      teamId: input.teamId,
      userId: input.userId,
      role: input.role,
    };

    const [member] = await this.db.insert(teamMembers).values(memberData).returning();
    return member;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    input: UpdateTeamMemberRoleInput
  ): Promise<TeamMember> {
    // Validate role
    if (!['lead', 'member'].includes(input.role)) {
      throw new Error('Invalid team role');
    }

    // Check if member exists
    const [existingMember] = await this.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));

    if (!existingMember) {
      throw new Error('Team member not found');
    }

    // Update role
    const [member] = await this.db
      .update(teamMembers)
      .set({ role: input.role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();

    return member!;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(desc(teamMembers.joinedAt));
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private isValidCuid(id: string): boolean {
    // Basic CUID2 validation: reasonable length and alphanumeric
    // CUID2s are lowercase alphanumeric, typically 24-26 characters
    return typeof id === 'string' && id.length >= 20 && id.length <= 30 && /^[a-z0-9]+$/.test(id);
  }
}
