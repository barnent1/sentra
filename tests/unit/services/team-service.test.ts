/**
 * Team Service Tests
 *
 * Tests for team operations within organizations.
 * Follows TDD approach - tests written FIRST before implementation.
 *
 * Coverage:
 * - Create team within organization
 * - Get team by ID
 * - List organization's teams
 * - Update team details
 * - Delete team
 * - Add/remove team members
 * - Get team members
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '@/db/schema';

// Import service (doesn't exist yet - tests should FAIL)
import { TeamService } from '@/services/team-service';
import { OrganizationService } from '@/services/organization-service';
import type {
  Team,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  UpdateTeamMemberRoleInput,
} from '@/services/team-service';
import type { Organization } from '@/services/organization-service';

describe('TeamService', () => {
  let teamService: TeamService;
  let orgService: OrganizationService;
  let testOrg: Organization;
  let testUserId: string;
  let db: ReturnType<typeof drizzle>;
  let sql: ReturnType<typeof postgres>;

  beforeEach(async () => {
    // Setup test database connection
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/quetrex_test';
    sql = postgres(databaseUrl, { max: 1 });
    db = drizzle(sql);

    teamService = TeamService.getInstance();
    orgService = OrganizationService.getInstance();

    // Create test user in database
    testUserId = createId();
    await db.insert(users).values({
      id: testUserId,
      email: `test-${testUserId}@example.com`,
      password: 'hashed_password',
      name: 'Test User',
    });

    // Create test organization with unique slug per test
    testOrg = await orgService.createOrganization({
      name: `Test Org ${testUserId}`,
      type: 'company',
      slug: `test-org-${testUserId}`,
      ownerId: testUserId,
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await sql.end();
  });

  /**
   * Helper function to create a test user in the database
   * If addToOrg is true, also adds user as organization member
   */
  async function createTestUser(email?: string, addToOrg = false): Promise<string> {
    const userId = createId();
    await db.insert(users).values({
      id: userId,
      email: email || `test-${userId}@example.com`,
      password: 'hashed_password',
      name: 'Test User',
    });

    if (addToOrg) {
      await orgService.addOrganizationMember({
        orgId: testOrg.id,
        userId,
        role: 'member',
      });
    }

    return userId;
  }

  // ==========================================================================
  // Create Team
  // ==========================================================================

  describe('createTeam', () => {
    describe('Happy Path', () => {
      it('should create team with name and description', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Engineering',
          description: 'Engineering team responsible for product development',
        };

        // ACT
        const team = await teamService.createTeam(input);

        // ASSERT
        expect(team).toBeDefined();
        expect(team.id).toBeDefined();
        expect(team.orgId).toBe(testOrg.id);
        expect(team.name).toBe('Engineering');
        expect(team.description).toBe('Engineering team responsible for product development');
        expect(team.createdAt).toBeInstanceOf(Date);
        expect(team.updatedAt).toBeInstanceOf(Date);
      });

      it('should create team without description', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Marketing',
        };

        // ACT
        const team = await teamService.createTeam(input);

        // ASSERT
        expect(team.name).toBe('Marketing');
        expect(team.description).toBeNull();
      });

      it('should create multiple teams in same organization', async () => {
        // ARRANGE
        const team1Input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Team 1',
        };
        const team2Input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Team 2',
        };

        // ACT
        const team1 = await teamService.createTeam(team1Input);
        const team2 = await teamService.createTeam(team2Input);

        // ASSERT
        expect(team1.orgId).toBe(team2.orgId);
        expect(team1.id).not.toBe(team2.id);
      });

      it('should allow same team name in different organizations', async () => {
        // ARRANGE
        const userId2 = await createTestUser();
        const org2 = await orgService.createOrganization({
          name: `Another Org ${userId2}`,
          type: 'company',
          slug: `another-org-${userId2}`,
          ownerId: userId2,
        });

        const team1Input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Engineering',
        };
        const team2Input: CreateTeamInput = {
          orgId: org2.id,
          name: 'Engineering', // Same name, different org
        };

        // ACT
        const team1 = await teamService.createTeam(team1Input);
        const team2 = await teamService.createTeam(team2Input);

        // ASSERT
        expect(team1.name).toBe(team2.name);
        expect(team1.orgId).not.toBe(team2.orgId);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null description', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Sales',
          description: null,
        };

        // ACT
        const team = await teamService.createTeam(input);

        // ASSERT
        expect(team.description).toBeNull();
      });

      it('should trim whitespace from team name', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: '  Spaces Team  ',
        };

        // ACT
        const team = await teamService.createTeam(input);

        // ASSERT
        expect(team.name).toBe('Spaces Team');
      });

      it('should handle very long description', async () => {
        // ARRANGE
        const longDescription = 'A'.repeat(1000);
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Long Desc Team',
          description: longDescription,
        };

        // ACT
        const team = await teamService.createTeam(input);

        // ASSERT
        expect(team.description).toBe(longDescription);
      });
    });

    describe('Error Conditions', () => {
      it('should throw error if organization does not exist', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: 'nonexistent-org-id',
          name: 'Invalid Team',
        };

        // ACT & ASSERT
        await expect(teamService.createTeam(input)).rejects.toThrow('Organization not found');
      });

      it('should throw error if name is empty', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: '',
        };

        // ACT & ASSERT
        await expect(teamService.createTeam(input)).rejects.toThrow('Team name is required');
      });

      it('should throw error if name is only whitespace', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: '   ',
        };

        // ACT & ASSERT
        await expect(teamService.createTeam(input)).rejects.toThrow('Team name is required');
      });

      it('should prevent duplicate team name in same organization', async () => {
        // ARRANGE
        const name = 'Duplicate Team';
        const input1: CreateTeamInput = {
          orgId: testOrg.id,
          name,
        };
        const input2: CreateTeamInput = {
          orgId: testOrg.id,
          name, // Same name
        };

        // ACT
        await teamService.createTeam(input1);

        // ASSERT
        await expect(teamService.createTeam(input2)).rejects.toThrow(
          'Team with this name already exists in organization'
        );
      });
    });
  });

  // ==========================================================================
  // Get Team
  // ==========================================================================

  describe('getTeamById', () => {
    describe('Happy Path', () => {
      it('should retrieve team by ID', async () => {
        // ARRANGE
        const input: CreateTeamInput = {
          orgId: testOrg.id,
          name: 'Test Team',
          description: 'Test description',
        };
        const created = await teamService.createTeam(input);

        // ACT
        const team = await teamService.getTeamById(created.id);

        // ASSERT
        expect(team).toBeDefined();
        expect(team?.id).toBe(created.id);
        expect(team?.name).toBe('Test Team');
        expect(team?.description).toBe('Test description');
      });
    });

    describe('Error Conditions', () => {
      it('should return null for nonexistent team', async () => {
        // ARRANGE
        const fakeId = createId();

        // ACT
        const team = await teamService.getTeamById(fakeId);

        // ASSERT
        expect(team).toBeNull();
      });

      it('should throw error for invalid ID format', async () => {
        // ARRANGE
        const invalidId = 'not-a-valid-cuid';

        // ACT & ASSERT
        await expect(teamService.getTeamById(invalidId)).rejects.toThrow('Invalid team ID');
      });
    });
  });

  // ==========================================================================
  // List Organization Teams
  // ==========================================================================

  describe('listOrganizationTeams', () => {
    describe('Happy Path', () => {
      it('should return all teams in organization', async () => {
        // ARRANGE
        await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Team 1',
        });
        await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Team 2',
        });
        await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Team 3',
        });

        // ACT
        const teams = await teamService.listOrganizationTeams(testOrg.id);

        // ASSERT
        expect(teams).toHaveLength(3);
        expect(teams.map((t) => t.name)).toContain('Team 1');
        expect(teams.map((t) => t.name)).toContain('Team 2');
        expect(teams.map((t) => t.name)).toContain('Team 3');
      });

      it('should return teams sorted by creation date (newest first)', async () => {
        // ARRANGE
        const team1 = await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Old Team',
        });
        const team2 = await teamService.createTeam({
          orgId: testOrg.id,
          name: 'New Team',
        });

        // ACT
        const teams = await teamService.listOrganizationTeams(testOrg.id);

        // ASSERT
        expect(teams[0].id).toBe(team2.id); // Newest first
        expect(teams[1].id).toBe(team1.id);
      });

      it('should return empty array for organization with no teams', async () => {
        // ACT
        const teams = await teamService.listOrganizationTeams(testOrg.id);

        // ASSERT
        expect(teams).toHaveLength(0);
      });

      it('should not include teams from other organizations', async () => {
        // ARRANGE
        const userId2 = await createTestUser();
        const org2 = await orgService.createOrganization({
          name: `Org 2 ${userId2}`,
          type: 'company',
          slug: `org-2-${userId2}`,
          ownerId: userId2,
        });

        await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Org 1 Team',
        });
        await teamService.createTeam({
          orgId: org2.id,
          name: 'Org 2 Team',
        });

        // ACT
        const teams = await teamService.listOrganizationTeams(testOrg.id);

        // ASSERT
        expect(teams).toHaveLength(1);
        expect(teams[0].name).toBe('Org 1 Team');
      });
    });

    describe('Error Conditions', () => {
      it('should return empty array for nonexistent organization', async () => {
        // ARRANGE
        const fakeOrgId = createId();

        // ACT
        const teams = await teamService.listOrganizationTeams(fakeOrgId);

        // ASSERT
        expect(teams).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Update Team
  // ==========================================================================

  describe('updateTeam', () => {
    let testTeam: Team;

    beforeEach(async () => {
      testTeam = await teamService.createTeam({
        orgId: testOrg.id,
        name: 'Original Name',
        description: 'Original description',
      });
    });

    describe('Happy Path', () => {
      it('should update team name', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          name: 'Updated Name',
        };

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.name).toBe('Updated Name');
        expect(team.description).toBe('Original description'); // Unchanged
        expect(team.updatedAt.getTime()).toBeGreaterThan(team.createdAt.getTime());
      });

      it('should update team description', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          description: 'Updated description',
        };

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.name).toBe('Original Name'); // Unchanged
        expect(team.description).toBe('Updated description');
      });

      it('should update both name and description', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          name: 'New Name',
          description: 'New description',
        };

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.name).toBe('New Name');
        expect(team.description).toBe('New description');
      });

      it('should allow setting description to null', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          description: null,
        };

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.description).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty update object', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {};

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.name).toBe('Original Name'); // No change
        expect(team.description).toBe('Original description'); // No change
      });

      it('should trim whitespace from name', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          name: '  Trimmed  ',
        };

        // ACT
        const team = await teamService.updateTeam(testTeam.id, update);

        // ASSERT
        expect(team.name).toBe('Trimmed');
      });
    });

    describe('Error Conditions', () => {
      it('should throw error for nonexistent team', async () => {
        // ARRANGE
        const fakeId = createId();
        const update: UpdateTeamInput = {
          name: 'Updated',
        };

        // ACT & ASSERT
        await expect(teamService.updateTeam(fakeId, update)).rejects.toThrow('Team not found');
      });

      it('should throw error if name is empty', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          name: '',
        };

        // ACT & ASSERT
        await expect(teamService.updateTeam(testTeam.id, update)).rejects.toThrow(
          'Team name cannot be empty'
        );
      });

      it('should throw error if name is only whitespace', async () => {
        // ARRANGE
        const update: UpdateTeamInput = {
          name: '   ',
        };

        // ACT & ASSERT
        await expect(teamService.updateTeam(testTeam.id, update)).rejects.toThrow(
          'Team name cannot be empty'
        );
      });

      it('should prevent duplicate name within organization', async () => {
        // ARRANGE
        const existingName = 'Existing Team';
        await teamService.createTeam({
          orgId: testOrg.id,
          name: existingName,
        });

        const update: UpdateTeamInput = {
          name: existingName, // Duplicate
        };

        // ACT & ASSERT
        await expect(teamService.updateTeam(testTeam.id, update)).rejects.toThrow(
          'Team with this name already exists in organization'
        );
      });
    });
  });

  // ==========================================================================
  // Delete Team
  // ==========================================================================

  describe('deleteTeam', () => {
    describe('Happy Path', () => {
      it('should delete team by ID', async () => {
        // ARRANGE
        const team = await teamService.createTeam({
          orgId: testOrg.id,
          name: 'To Delete',
        });

        // ACT
        const result = await teamService.deleteTeam(team.id);

        // ASSERT
        expect(result).toBe(true);

        // Verify deletion
        const deleted = await teamService.getTeamById(team.id);
        expect(deleted).toBeNull();
      });

      it('should cascade delete team members', async () => {
        // ARRANGE
        const team = await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Cascade Test',
        });

        // Add member
        const memberId = await createTestUser(undefined, true);
        await teamService.addTeamMember({
          teamId: team.id,
          userId: memberId,
          role: 'member',
        });

        // ACT
        await teamService.deleteTeam(team.id);

        // ASSERT
        const members = await teamService.getTeamMembers(team.id);
        expect(members).toHaveLength(0);
      });
    });

    describe('Error Conditions', () => {
      it('should return false for nonexistent team', async () => {
        // ARRANGE
        const fakeId = createId();

        // ACT
        const result = await teamService.deleteTeam(fakeId);

        // ASSERT
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Add Team Member
  // ==========================================================================

  describe('addTeamMember', () => {
    let testTeam: Team;

    beforeEach(async () => {
      testTeam = await teamService.createTeam({
        orgId: testOrg.id,
        name: 'Test Team',
      });
    });

    describe('Happy Path', () => {
      it('should add member with lead role', async () => {
        // ARRANGE
        const userId = await createTestUser(undefined, true); // Add to org
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId,
          role: 'lead',
        };

        // ACT
        const member = await teamService.addTeamMember(input);

        // ASSERT
        expect(member).toBeDefined();
        expect(member.teamId).toBe(testTeam.id);
        expect(member.userId).toBe(userId);
        expect(member.role).toBe('lead');
        expect(member.joinedAt).toBeInstanceOf(Date);
      });

      it('should add member with member role', async () => {
        // ARRANGE
        const userId = await createTestUser(undefined, true); // Add to org
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId,
          role: 'member',
        };

        // ACT
        const member = await teamService.addTeamMember(input);

        // ASSERT
        expect(member.role).toBe('member');
      });

      it('should allow multiple members in same team', async () => {
        // ARRANGE
        const user1Id = await createTestUser(undefined, true);
        const user2Id = await createTestUser(undefined, true);

        // ACT
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user1Id,
          role: 'lead',
        });
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user2Id,
          role: 'member',
        });

        // ASSERT
        const members = await teamService.getTeamMembers(testTeam.id);
        expect(members).toHaveLength(2);
      });

      it('should allow user to be in multiple teams', async () => {
        // ARRANGE
        const userId = await createTestUser(undefined, true);
        const team2 = await teamService.createTeam({
          orgId: testOrg.id,
          name: 'Team 2',
        });

        // ACT
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId,
          role: 'member',
        });
        await teamService.addTeamMember({
          teamId: team2.id,
          userId,
          role: 'lead',
        });

        // ASSERT
        const team1Members = await teamService.getTeamMembers(testTeam.id);
        const team2Members = await teamService.getTeamMembers(team2.id);
        expect(team1Members.find((m) => m.userId === userId)).toBeDefined();
        expect(team2Members.find((m) => m.userId === userId)).toBeDefined();
      });
    });

    describe('Error Conditions', () => {
      it('should throw error if team does not exist', async () => {
        // ARRANGE
        const input: AddTeamMemberInput = {
          teamId: 'nonexistent-team-id',
          userId: createId(),
          role: 'member',
        };

        // ACT & ASSERT
        await expect(teamService.addTeamMember(input)).rejects.toThrow('Team not found');
      });

      it('should throw error if user does not exist', async () => {
        // ARRANGE
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId: 'nonexistent-user-id',
          role: 'member',
        };

        // ACT & ASSERT
        await expect(teamService.addTeamMember(input)).rejects.toThrow('User not found');
      });

      it('should throw error if user is already a team member', async () => {
        // ARRANGE
        const userId = await createTestUser(undefined, true); // Create user and add to org
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId,
          role: 'member',
        };

        await teamService.addTeamMember(input);

        // ACT & ASSERT
        await expect(teamService.addTeamMember(input)).rejects.toThrow(
          'User is already a member of this team'
        );
      });

      it('should throw error for invalid role', async () => {
        // ARRANGE
        const userId = await createTestUser(undefined, true);
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId,
          role: 'admin' as any, // Invalid for team
        };

        // ACT & ASSERT
        await expect(teamService.addTeamMember(input)).rejects.toThrow('Invalid team role');
      });

      it('should require user to be organization member first', async () => {
        // ARRANGE
        const outsideUserId = await createTestUser(); // Create user but DON'T add to org
        const input: AddTeamMemberInput = {
          teamId: testTeam.id,
          userId: outsideUserId,
          role: 'member',
        };

        // ACT & ASSERT
        await expect(teamService.addTeamMember(input)).rejects.toThrow(
          'User must be an organization member before joining a team'
        );
      });
    });
  });

  // ==========================================================================
  // Remove Team Member
  // ==========================================================================

  describe('removeTeamMember', () => {
    let testTeam: Team;
    let memberUserId: string;

    beforeEach(async () => {
      testTeam = await teamService.createTeam({
        orgId: testOrg.id,
        name: 'Test Team',
      });

      // Add a member
      memberUserId = await createTestUser(undefined, true);
      await teamService.addTeamMember({
        teamId: testTeam.id,
        userId: memberUserId,
        role: 'member',
      });
    });

    describe('Happy Path', () => {
      it('should remove member from team', async () => {
        // ACT
        const result = await teamService.removeTeamMember(testTeam.id, memberUserId);

        // ASSERT
        expect(result).toBe(true);

        // Verify removal
        const members = await teamService.getTeamMembers(testTeam.id);
        expect(members.find((m) => m.userId === memberUserId)).toBeUndefined();
      });

      it('should allow removing the last lead', async () => {
        // ARRANGE
        await teamService.updateTeamMemberRole(testTeam.id, memberUserId, { role: 'lead' });

        // ACT
        const result = await teamService.removeTeamMember(testTeam.id, memberUserId);

        // ASSERT
        expect(result).toBe(true);
      });
    });

    describe('Error Conditions', () => {
      it('should return false for nonexistent member', async () => {
        // ARRANGE
        const fakeUserId = createId();

        // ACT
        const result = await teamService.removeTeamMember(testTeam.id, fakeUserId);

        // ASSERT
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Get Team Members
  // ==========================================================================

  describe('getTeamMembers', () => {
    let testTeam: Team;

    beforeEach(async () => {
      testTeam = await teamService.createTeam({
        orgId: testOrg.id,
        name: 'Test Team',
      });
    });

    describe('Happy Path', () => {
      it('should return all team members', async () => {
        // ARRANGE
        const user1Id = await createTestUser(undefined, true);
        const user2Id = await createTestUser(undefined, true);
        const user3Id = await createTestUser(undefined, true);

        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user1Id,
          role: 'lead',
        });
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user2Id,
          role: 'member',
        });
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user3Id,
          role: 'member',
        });

        // ACT
        const members = await teamService.getTeamMembers(testTeam.id);

        // ASSERT
        expect(members).toHaveLength(3);
        expect(members.map((m) => m.userId)).toContain(user1Id);
        expect(members.map((m) => m.userId)).toContain(user2Id);
        expect(members.map((m) => m.userId)).toContain(user3Id);
      });

      it('should return members sorted by joined date (newest first)', async () => {
        // ARRANGE
        const user1Id = await createTestUser(undefined, true);
        const user2Id = await createTestUser(undefined, true);

        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user1Id,
          role: 'member',
        });
        await teamService.addTeamMember({
          teamId: testTeam.id,
          userId: user2Id,
          role: 'member',
        });

        // ACT
        const members = await teamService.getTeamMembers(testTeam.id);

        // ASSERT
        expect(members[0].userId).toBe(user2Id); // Most recent
      });

      it('should return empty array for team with no members', async () => {
        // ACT
        const members = await teamService.getTeamMembers(testTeam.id);

        // ASSERT
        expect(members).toHaveLength(0);
      });
    });

    describe('Error Conditions', () => {
      it('should return empty array for nonexistent team', async () => {
        // ARRANGE
        const fakeTeamId = createId();

        // ACT
        const members = await teamService.getTeamMembers(fakeTeamId);

        // ASSERT
        expect(members).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Update Team Member Role
  // ==========================================================================

  describe('updateTeamMemberRole', () => {
    let testTeam: Team;
    let memberUserId: string;

    beforeEach(async () => {
      testTeam = await teamService.createTeam({
        orgId: testOrg.id,
        name: 'Test Team',
      });

      memberUserId = await createTestUser(undefined, true);
      await teamService.addTeamMember({
        teamId: testTeam.id,
        userId: memberUserId,
        role: 'member',
      });
    });

    describe('Happy Path', () => {
      it('should promote member to lead', async () => {
        // ARRANGE
        const input: UpdateTeamMemberRoleInput = {
          role: 'lead',
        };

        // ACT
        const member = await teamService.updateTeamMemberRole(testTeam.id, memberUserId, input);

        // ASSERT
        expect(member.role).toBe('lead');
      });

      it('should demote lead to member', async () => {
        // ARRANGE
        await teamService.updateTeamMemberRole(testTeam.id, memberUserId, { role: 'lead' });

        // ACT
        const member = await teamService.updateTeamMemberRole(testTeam.id, memberUserId, {
          role: 'member',
        });

        // ASSERT
        expect(member.role).toBe('member');
      });
    });

    describe('Error Conditions', () => {
      it('should throw error for nonexistent member', async () => {
        // ARRANGE
        const fakeUserId = createId();

        // ACT & ASSERT
        await expect(
          teamService.updateTeamMemberRole(testTeam.id, fakeUserId, { role: 'lead' })
        ).rejects.toThrow('Team member not found');
      });

      it('should throw error for invalid role', async () => {
        // ARRANGE
        const input: UpdateTeamMemberRoleInput = {
          role: 'owner' as any, // Invalid for team
        };

        // ACT & ASSERT
        await expect(
          teamService.updateTeamMemberRole(testTeam.id, memberUserId, input)
        ).rejects.toThrow('Invalid team role');
      });
    });
  });
});
