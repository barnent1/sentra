/**
 * Database Type Exports
 *
 * TypeScript type definitions for all database models.
 * These types are inferred from the Drizzle schema.
 */

import {
  users,
  projects,
  agents,
  costs,
  activities,
  userSettings,
  architectSessions,
  architectConversations,
  architectDecisions,
  prototypes,
  prototypeIterations,
  organizations,
  organizationMembers,
  teams,
  teamMembers,
  organizationInvitations,
} from './schema';

// ============================================================================
// User Types
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================================================
// Project Types
// ============================================================================

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// ============================================================================
// Agent Types
// ============================================================================

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

// ============================================================================
// Cost Types
// ============================================================================

export type Cost = typeof costs.$inferSelect;
export type NewCost = typeof costs.$inferInsert;

// ============================================================================
// Activity Types
// ============================================================================

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

// ============================================================================
// User Settings Types
// ============================================================================

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

// ============================================================================
// Architect Session Types
// ============================================================================

export type ArchitectSession = typeof architectSessions.$inferSelect;
export type NewArchitectSession = typeof architectSessions.$inferInsert;

export type ArchitectConversation = typeof architectConversations.$inferSelect;
export type NewArchitectConversation = typeof architectConversations.$inferInsert;

export type ArchitectDecision = typeof architectDecisions.$inferSelect;
export type NewArchitectDecision = typeof architectDecisions.$inferInsert;

// ============================================================================
// Prototype Types
// ============================================================================

export type Prototype = typeof prototypes.$inferSelect;
export type NewPrototype = typeof prototypes.$inferInsert;

export type PrototypeIteration = typeof prototypeIterations.$inferSelect;
export type NewPrototypeIteration = typeof prototypeIterations.$inferInsert;

// ============================================================================
// Organization Types
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;

// ============================================================================
// Enums
// ============================================================================

export type OrganizationRole = 'owner' | 'admin' | 'member';
export type TeamRole = 'lead' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type ProjectVisibility = 'private' | 'team' | 'organization';
