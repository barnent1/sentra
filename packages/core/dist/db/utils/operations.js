/**
 * Database operation utilities for Sentra Evolutionary Agent System
 * Provides high-level operations for evolutionary features
 */
import { eq, desc, and, sql } from 'drizzle-orm';
import { getDatabase } from './connection';
import { evolutionDna, agentInstances, learningOutcomes, projectEvolutionContexts } from '../schema';
/**
 * Create new evolution DNA
 */
export const createEvolutionDna = async (dnaData) => {
    const db = getDatabase();
    const [newDna] = await db
        .insert(evolutionDna)
        .values({
        patternType: dnaData.patternType,
        genetics: dnaData.genetics,
        performance: dnaData.performance,
        projectContext: dnaData.projectContext,
        generation: dnaData.generation || 1,
        parentId: dnaData.parentId || null,
        embedding: dnaData.embedding || null,
    })
        .returning();
    return newDna;
};
/**
 * Spawn new agent instance with DNA
 */
export const spawnAgentInstance = async (instanceData) => {
    const db = getDatabase();
    const [newAgent] = await db
        .insert(agentInstances)
        .values({
        evolutionDnaId: instanceData.evolutionDnaId,
        name: instanceData.name,
        role: instanceData.role,
        status: instanceData.status || 'active',
        metadata: instanceData.metadata || {},
        performanceHistory: [],
    })
        .returning();
    return newAgent;
};
/**
 * Record learning outcome from task execution
 */
export const recordLearningOutcome = async (outcomeData) => {
    const db = getDatabase();
    const [outcome] = await db
        .insert(learningOutcomes)
        .values({
        agentInstanceId: outcomeData.agentInstanceId,
        evolutionDnaId: outcomeData.evolutionDnaId,
        taskId: outcomeData.taskId, // Cast to UUID type
        outcomeType: outcomeData.outcomeType,
        performanceImprovement: outcomeData.performanceImprovement,
        lessonLearned: outcomeData.lessonLearned,
        contextFactors: outcomeData.contextFactors,
        applicabilityScore: outcomeData.applicabilityScore,
        embedding: outcomeData.embedding || null,
    })
        .returning();
    return outcome;
};
/**
 * Get agent instance with its DNA and recent learning outcomes
 */
export const getAgentInstanceWithContext = async (agentId) => {
    const db = getDatabase();
    // Get agent instance with its DNA
    const agentWithDna = await db
        .select({
        agent: agentInstances,
        dna: evolutionDna,
    })
        .from(agentInstances)
        .innerJoin(evolutionDna, eq(agentInstances.evolutionDnaId, evolutionDna.id))
        .where(eq(agentInstances.id, agentId));
    if (agentWithDna.length === 0) {
        return null;
    }
    // Get recent learning outcomes
    const recentOutcomes = await db
        .select()
        .from(learningOutcomes)
        .where(eq(learningOutcomes.agentInstanceId, agentId))
        .orderBy(desc(learningOutcomes.createdAt))
        .limit(10);
    return {
        ...agentWithDna[0],
        recentOutcomes,
    };
};
/**
 * Find best performing DNA patterns for a project context
 */
export const findBestDnaForProject = async (projectId, role, limit = 5) => {
    const db = getDatabase();
    const conditions = [
        sql `${projectEvolutionContexts.projectId} = ${projectId}`,
    ];
    if (role) {
        // This would require joining with agent instances, simplified for now
        conditions.push(sql `TRUE`);
    }
    const bestDna = await db
        .select({
        dna: evolutionDna,
        context: projectEvolutionContexts,
    })
        .from(projectEvolutionContexts)
        .innerJoin(evolutionDna, eq(projectEvolutionContexts.evolutionDnaId, evolutionDna.id))
        .where(and(...conditions))
        .orderBy(desc(projectEvolutionContexts.adaptationScore))
        .limit(limit);
    return bestDna;
};
/**
 * Update agent performance history
 */
export const updateAgentPerformance = async (agentId, newPerformance) => {
    const db = getDatabase();
    // Get current agent data
    const [currentAgent] = await db
        .select()
        .from(agentInstances)
        .where(eq(agentInstances.id, agentId));
    if (!currentAgent) {
        throw new Error(`Agent instance ${agentId} not found`);
    }
    // Add new performance to history (keep last 10 entries)
    const currentHistory = currentAgent.performanceHistory || [];
    const updatedHistory = [
        ...currentHistory.slice(-9), // Keep last 9 entries
        newPerformance, // Add new performance
    ];
    // Update the agent
    await db
        .update(agentInstances)
        .set({
        performanceHistory: updatedHistory,
        lastActiveAt: new Date(),
    })
        .where(eq(agentInstances.id, agentId));
};
/**
 * Get evolution lineage (parent-child DNA relationships)
 */
export const getEvolutionLineage = async (dnaId) => {
    const db = getDatabase();
    // Get ancestors (walking up the parent chain)
    const ancestors = await db.execute(sql `
    WITH RECURSIVE dna_ancestors AS (
      SELECT id, pattern_type, generation, parent_id, created_at
      FROM evolution_dna
      WHERE id = ${dnaId}
      
      UNION ALL
      
      SELECT e.id, e.pattern_type, e.generation, e.parent_id, e.created_at
      FROM evolution_dna e
      INNER JOIN dna_ancestors da ON e.id = da.parent_id
    )
    SELECT * FROM dna_ancestors
    ORDER BY generation ASC
  `);
    // Get descendants (walking down the child chain)  
    const descendants = await db.execute(sql `
    WITH RECURSIVE dna_descendants AS (
      SELECT id, pattern_type, generation, parent_id, created_at
      FROM evolution_dna
      WHERE id = ${dnaId}
      
      UNION ALL
      
      SELECT e.id, e.pattern_type, e.generation, e.parent_id, e.created_at
      FROM evolution_dna e
      INNER JOIN dna_descendants dd ON e.parent_id = dd.id
    )
    SELECT * FROM dna_descendants
    WHERE id != ${dnaId}
    ORDER BY generation ASC
  `);
    return {
        ancestors: ancestors, // Type casting for simplicity
        descendants: descendants,
    };
};
//# sourceMappingURL=operations.js.map