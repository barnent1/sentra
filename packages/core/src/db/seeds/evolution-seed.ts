/**
 * Evolution seed data for testing evolutionary features
 * Creates sample DNA patterns, agent instances, and learning outcomes
 */

import { getDatabase } from '../utils/connection';
import { evolutionDna, agentInstances, learningOutcomes } from '../schema';
import type { 
  EvolutionDnaId, 
  AgentInstanceId,
  ProjectContextId,
  GeneticMarkers, 
  PerformanceMetrics, 
  ProjectContext 
} from '@sentra/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sample genetic markers for different agent patterns
 */
const geneticPatterns: Record<string, GeneticMarkers> = {
  analytical: {
    complexity: 0.8,
    adaptability: 0.7,
    successRate: 0.85,
    transferability: 0.7,
    stability: 0.9,
    novelty: 0.3,
  },
  creative: {
    complexity: 0.6,
    adaptability: 0.9,
    successRate: 0.75,
    transferability: 0.8,
    stability: 0.6,
    novelty: 0.9,
  },
  balanced: {
    complexity: 0.7,
    adaptability: 0.8,
    successRate: 0.8,
    transferability: 0.75,
    stability: 0.8,
    novelty: 0.6,
  },
};

/**
 * Sample performance metrics
 */
const performancePatterns: Record<string, PerformanceMetrics> = {
  highPerformer: {
    successRate: 0.95,
    averageTaskCompletionTime: 25,
    codeQualityScore: 0.9,
    userSatisfactionRating: 4.8,
    adaptationSpeed: 0.85,
    errorRecoveryRate: 0.9,
  },
  developing: {
    successRate: 0.75,
    averageTaskCompletionTime: 35,
    codeQualityScore: 0.7,
    userSatisfactionRating: 4.2,
    adaptationSpeed: 0.6,
    errorRecoveryRate: 0.7,
  },
  specialist: {
    successRate: 0.9,
    averageTaskCompletionTime: 20,
    codeQualityScore: 0.95,
    userSatisfactionRating: 4.5,
    adaptationSpeed: 0.5,
    errorRecoveryRate: 0.8,
  },
};

/**
 * Sample project contexts
 */
const projectContexts: Record<string, ProjectContext> = {
  webApp: {
    id: uuidv4() as ProjectContextId,
    projectType: 'web-app',
    techStack: ['typescript', 'react', 'node', 'postgres'],
    complexity: 'medium',
    teamSize: 4,
    timeline: '3 months',
    requirements: ['responsive design', 'user authentication', 'real-time features'],
  },
  apiService: {
    id: uuidv4() as ProjectContextId,
    projectType: 'api',
    techStack: ['typescript', 'fastapi', 'postgres', 'redis'],
    complexity: 'high',
    teamSize: 6,
    timeline: '6 months',
    requirements: ['high availability', 'rate limiting', 'comprehensive documentation'],
  },
  cliTool: {
    id: uuidv4() as ProjectContextId,
    projectType: 'cli',
    techStack: ['typescript', 'node'],
    complexity: 'low',
    teamSize: 2,
    timeline: '1 month',
    requirements: ['cross-platform', 'easy installation', 'clear help system'],
  },
};

/**
 * Seed evolution DNA data
 */
export async function seedEvolutionDna() {
  const db = getDatabase();
  
  console.log('🧬 Seeding evolution DNA patterns...');
  
  const dnaSeeds = [];
  
  // Create foundation DNA patterns
  for (const [patternType, genetics] of Object.entries(geneticPatterns)) {
    for (const [perfType, performance] of Object.entries(performancePatterns)) {
      for (const [contextType, projectContext] of Object.entries(projectContexts)) {
        dnaSeeds.push({
          id: uuidv4() as EvolutionDnaId,
          patternType: `${patternType}_${perfType}_${contextType}`,
          genetics,
          performance,
          projectContext,
          generation: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }
  
  const insertedDna = await db.insert(evolutionDna).values(dnaSeeds).returning();
  console.log(`✅ Created ${insertedDna.length} DNA patterns`);
  
  return insertedDna;
}

/**
 * Seed agent instances
 */
export async function seedAgentInstances(dnaPatterns: Array<{ id: EvolutionDnaId; patternType: string }>) {
  const db = getDatabase();
  
  console.log('🤖 Seeding agent instances...');
  
  const agentSeeds = [];
  const roles = ['analyst', 'developer', 'qa', 'pm', 'uiux'];
  
  // Create agent instances for each DNA pattern
  for (let i = 0; i < Math.min(10, dnaPatterns.length); i++) {
    const dna = dnaPatterns[i];
    if (!dna) continue;
    
    const role = roles[i % roles.length];
    if (!role) continue;
    
    agentSeeds.push({
      id: uuidv4() as AgentInstanceId,
      evolutionDnaId: dna.id,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)}_${dna.patternType.split('_')[0]}_Gen1`,
      role,
      status: 'active' as const,
      spawnedAt: new Date(),
      lastActiveAt: new Date(),
      performanceHistory: [],
      metadata: {
        patternType: dna.patternType,
        generation: 1,
      },
    });
  }
  
  const insertedAgents = await db.insert(agentInstances).values(agentSeeds).returning();
  console.log(`✅ Created ${insertedAgents.length} agent instances`);
  
  return insertedAgents;
}

/**
 * Seed learning outcomes (sample data for testing)
 */
export async function seedLearningOutcomes(
  agents: Array<{ id: AgentInstanceId; evolutionDnaId: EvolutionDnaId }>
) {
  const db = getDatabase();
  
  console.log('📚 Seeding learning outcomes...');
  
  const outcomeSeeds = [];
  const outcomeTypes = ['success', 'failure', 'partial', 'blocked'] as const;
  const lessons = [
    'Breaking down complex tasks into smaller chunks improves success rate',
    'Early validation with stakeholders reduces rework',
    'Automated testing catches regression issues effectively',
    'Clear documentation reduces onboarding time',
    'Regular code reviews improve overall quality',
  ];
  
  // Create sample learning outcomes for each agent
  for (const agent of agents.slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      const outcomeType = outcomeTypes[i % outcomeTypes.length];
      const lesson = lessons[i % lessons.length];
      
      if (outcomeType && lesson) {
        outcomeSeeds.push({
          id: uuidv4() as any, // LearningOutcomeId
          agentInstanceId: agent.id,
          evolutionDnaId: agent.evolutionDnaId,
          taskId: uuidv4() as any, // TaskId - will need to be real task IDs in production
          outcomeType,
          performanceImprovement: (Math.random() - 0.5) * 0.4, // -0.2 to 0.2
          lessonLearned: lesson,
          contextFactors: ['team_size_small', 'tight_deadline', 'new_technology'],
          applicabilityScore: 0.7 + Math.random() * 0.3, // 0.7 to 1.0
          embedding: null, // Will be populated later with actual embeddings
          createdAt: new Date(),
        });
      }
    }
  }
  
  const insertedOutcomes = await db.insert(learningOutcomes).values(outcomeSeeds).returning();
  console.log(`✅ Created ${insertedOutcomes.length} learning outcomes`);
  
  return insertedOutcomes;
}

/**
 * Main seeding function
 */
export async function runEvolutionSeeds() {
  try {
    console.log('🌱 Starting evolution data seeding...');
    
    const dnaPatterns = await seedEvolutionDna();
    const agents = await seedAgentInstances(dnaPatterns);
    const outcomes = await seedLearningOutcomes(agents);
    
    console.log('✅ Evolution seeding completed successfully!');
    console.log(`   - ${dnaPatterns.length} DNA patterns`);
    console.log(`   - ${agents.length} agent instances`);
    console.log(`   - ${outcomes.length} learning outcomes`);
    
  } catch (error) {
    console.error('❌ Evolution seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEvolutionSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}