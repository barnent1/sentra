/**
 * Session Service
 *
 * Manages architect sessions with confidence scoring.
 * Implements confidence scoring algorithm from docs/architecture/CONFIDENCE-SCORING.md
 *
 * Features:
 * - Create and manage architect sessions
 * - Calculate confidence scores per category
 * - Resume sessions with full context
 * - Track blockers and gaps
 */

import { eq, and, desc } from 'drizzle-orm';
import { drizzleDb } from './database-drizzle';
import { loadSessionContext } from './vector-store';
import {
  architectSessions,
  type ArchitectSession,
} from '../db/schema';

// ============================================================================
// Types
// ============================================================================

export interface CreateSessionInput {
  projectId: string;
  userId: string;
}

export interface UpdateSessionStateInput {
  categoryProgress?: Record<string, number>;
  blockers?: string[];
  gaps?: string[];
  status?: 'active' | 'paused' | 'completed';
}

export interface ResumeSessionResult {
  session: ArchitectSession;
  recentConversations: any[];
  readinessScore: number;
  blockers: string[];
  gaps: string[];
  incompleteCategories: string[];
}

export interface ConfidenceScoreResult {
  confidence: number;
  completeness: number;
  specificity: number;
  consistency: number;
  coverage: number;
  status: 'incomplete' | 'partial' | 'complete';
  missingItems: string[];
}

// Category weights for overall progress calculation
const CATEGORY_WEIGHTS: Record<string, number> = {
  business_requirements: 0.15,
  database_architecture: 0.15,
  api_design: 0.15,
  ui_ux_screens: 0.15,
  security_model: 0.15,
  third_party_integrations: 0.05,
  performance_requirements: 0.05,
  deployment_strategy: 0.05,
  testing_strategy: 0.10,
};

// Required questions per category (from coverage-checklist.yml)
const REQUIRED_QUESTIONS: Record<string, number> = {
  business_requirements: 5,
  database_architecture: 8,
  api_design: 6,
  ui_ux_screens: 7,
  security_model: 8,
  third_party_integrations: 4,
  performance_requirements: 5,
  deployment_strategy: 6,
  testing_strategy: 5,
};

// Required subtopics per category
const REQUIRED_SUBTOPICS: Record<string, number> = {
  business_requirements: 5,
  database_architecture: 5,
  api_design: 4,
  ui_ux_screens: 6,
  security_model: 6,
  third_party_integrations: 3,
  performance_requirements: 4,
  deployment_strategy: 5,
  testing_strategy: 4,
};

// ============================================================================
// Create Session
// ============================================================================

/**
 * Create new architect session
 *
 * @param input - Session creation data
 * @returns Created session
 */
export async function createSession(
  input: CreateSessionInput
): Promise<ArchitectSession> {
  // Initialize category progress with all 0%
  const initialProgress: Record<string, number> = {};
  for (const category of Object.keys(CATEGORY_WEIGHTS)) {
    initialProgress[category] = 0;
  }

  const result = await drizzleDb.transaction(async (tx) => {
    const [session] = await tx
      .insert(architectSessions)
      .values({
        projectId: input.projectId,
        userId: input.userId,
        status: 'active',
        overallProgress: 0,
        categoryProgress: JSON.stringify(initialProgress),
        blockers: null,
        gaps: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
      })
      .returning();

    return session;
  });

  return deserializeSession(result);
}

// ============================================================================
// Update Session State
// ============================================================================

/**
 * Update session state with category progress
 *
 * @param sessionId - Session ID
 * @param update - Update data
 * @returns Updated session
 */
export async function updateSessionState(
  sessionId: string,
  update: UpdateSessionStateInput
): Promise<ArchitectSession> {
  const updateData: any = {
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  };

  // Update category progress
  if (update.categoryProgress) {
    updateData.categoryProgress = JSON.stringify(update.categoryProgress);

    // Calculate overall progress as weighted average
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, score] of Object.entries(update.categoryProgress)) {
      const weight = CATEGORY_WEIGHTS[category] || 0.1;
      totalScore += score * weight;
      totalWeight += weight;
    }

    updateData.overallProgress = Math.round(totalScore / totalWeight);
  }

  // Update blockers
  if (update.blockers !== undefined) {
    updateData.blockers = JSON.stringify(update.blockers);
  }

  // Update gaps
  if (update.gaps !== undefined) {
    updateData.gaps = JSON.stringify(update.gaps);
  }

  // Update status
  if (update.status) {
    updateData.status = update.status;
  }

  const result = await drizzleDb.transaction(async (tx) => {
    const [updated] = await tx
      .update(architectSessions)
      .set(updateData)
      .where(eq(architectSessions.id, sessionId))
      .returning();

    return updated;
  });

  return deserializeSession(result);
}

// ============================================================================
// Resume Session
// ============================================================================

/**
 * Resume paused session with full context
 *
 * @param sessionId - Session ID
 * @returns Session with context, readiness score, blockers, gaps
 */
export async function resumeSession(
  sessionId: string
): Promise<ResumeSessionResult> {
  // Load session
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Load recent conversations (last 20 turns)
  const recentConversations = await loadSessionContext(sessionId, { limit: 20 });

  // Calculate readiness score from category progress
  const categoryProgress = session.categoryProgress
    ? JSON.parse(session.categoryProgress)
    : {};

  let totalScore = 0;
  let totalWeight = 0;

  for (const [category, score] of Object.entries(categoryProgress)) {
    const weight = CATEGORY_WEIGHTS[category] || 0.1;
    totalScore += (score as number) * weight;
    totalWeight += weight;
  }

  const readinessScore = totalWeight > 0
    ? Math.round(totalScore / totalWeight)
    : 0;

  // Identify incomplete categories (< 70% confidence)
  const incompleteCategories: string[] = [];
  for (const [category, score] of Object.entries(categoryProgress)) {
    if ((score as number) < 70) {
      incompleteCategories.push(category);
    }
  }

  // Parse blockers and gaps
  const blockers = session.blockers ? JSON.parse(session.blockers) : [];
  const gaps = session.gaps ? JSON.parse(session.gaps) : [];

  // Update session status to active
  await drizzleDb.transaction(async (tx) => {
    await tx
      .update(architectSessions)
      .set({
        status: 'active',
        lastActiveAt: new Date(),
      })
      .where(eq(architectSessions.id, sessionId));
  });

  return {
    session: { ...session, status: 'active' },
    recentConversations,
    readinessScore,
    blockers,
    gaps,
    incompleteCategories,
  };
}

// ============================================================================
// Get Session by ID
// ============================================================================

/**
 * Get session by ID
 *
 * @param sessionId - Session ID
 * @returns Session or null if not found
 */
export async function getSessionById(
  sessionId: string
): Promise<ArchitectSession | null> {
  const result = await drizzleDb.transaction(async (tx) => {
    const sessions = await tx
      .select()
      .from(architectSessions)
      .where(eq(architectSessions.id, sessionId))
      .limit(1);

    return sessions[0] || null;
  });

  return result ? deserializeSession(result) : null;
}

// ============================================================================
// Calculate Category Confidence
// ============================================================================

/**
 * Calculate confidence score for a category
 *
 * Implements algorithm from docs/architecture/CONFIDENCE-SCORING.md:
 * confidence = (completeness * 0.4) + (specificity * 0.2) + (consistency * 0.2) + (coverage * 0.2)
 *
 * @param sessionId - Session ID
 * @param category - Category name
 * @param userId - User ID
 * @returns Confidence score breakdown
 */
export async function calculateCategoryConfidence(
  sessionId: string,
  category: string,
  userId: string
): Promise<ConfidenceScoreResult> {
  // Load all conversations for this category
  const conversations = await loadSessionContext(sessionId, { category });

  // Filter user responses (not assistant questions)
  const userResponses = conversations.filter(c => c.role === 'user');

  // 1. Completeness: Questions answered / total required
  const requiredQuestions = REQUIRED_QUESTIONS[category] || 5;
  const questionsAnswered = Math.min(userResponses.length, requiredQuestions);
  const completeness = Math.round((questionsAnswered / requiredQuestions) * 100);

  // 2. Specificity: Average answer length / target (200 chars)
  const targetLength = 200;
  let totalLength = 0;
  for (const response of userResponses) {
    totalLength += response.content.length;
  }
  const avgLength = userResponses.length > 0 ? totalLength / userResponses.length : 0;
  const specificity = Math.min(100, Math.round((avgLength / targetLength) * 100));

  // 3. Consistency: 1 - (contradictions / statements)
  // For now, assume no contradictions (would need Claude API call in full implementation)
  const consistency = 100;

  // 4. Coverage: Covered subtopics / required subtopics
  const requiredSubtopics = REQUIRED_SUBTOPICS[category] || 5;
  // For now, estimate coverage based on conversation depth
  const estimatedCoveredSubtopics = Math.min(
    Math.floor(userResponses.length * 0.8),
    requiredSubtopics
  );
  const coverage = Math.round((estimatedCoveredSubtopics / requiredSubtopics) * 100);

  // Calculate final confidence score
  const confidence = Math.round(
    completeness * 0.4 +
    specificity * 0.2 +
    consistency * 0.2 +
    coverage * 0.2
  );

  // Determine status
  let status: 'incomplete' | 'partial' | 'complete';
  if (confidence >= 90) {
    status = 'complete';
  } else if (confidence >= 70) {
    status = 'partial';
  } else {
    status = 'incomplete';
  }

  // Generate missing items
  const missingItems: string[] = [];
  if (questionsAnswered < requiredQuestions) {
    missingItems.push(`${requiredQuestions - questionsAnswered} questions unanswered`);
  }
  if (avgLength < targetLength) {
    missingItems.push('Answers need more detail');
  }
  if (estimatedCoveredSubtopics < requiredSubtopics) {
    missingItems.push(`${requiredSubtopics - estimatedCoveredSubtopics} subtopics not covered`);
  }

  return {
    confidence,
    completeness,
    specificity,
    consistency,
    coverage,
    status,
    missingItems,
  };
}

// ============================================================================
// Deserialization Helper
// ============================================================================

/**
 * Deserialize session (parse JSON fields)
 */
function deserializeSession(session: any): ArchitectSession {
  return {
    ...session,
    categoryProgress: session.categoryProgress,
    blockers: session.blockers,
    gaps: session.gaps,
  } as ArchitectSession;
}
