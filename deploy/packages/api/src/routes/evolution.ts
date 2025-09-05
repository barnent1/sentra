/**
 * Evolution API routes for pattern evolution and agent management
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { Router, Response } from 'express';
import type {
  EvolutionDna,
  EvolutionDnaId,
  AgentInstance,
  // AgentInstanceId, // TODO: Will be used when agent management is implemented
  LearningOutcome,
  // EvolutionEvent, // TODO: Will be used when event tracking is implemented
  ApiResponse,
  ProjectContext,
  // TaskId, // TODO: Will be used when task management is implemented  
  // LearningOutcomeId, // TODO: Will be used when learning outcome tracking is implemented
  // EvolutionEventId, // TODO: Will be used when event tracking is implemented
  Brand,
  ProjectContextId,
} from '@sentra/types';

import {
  TestDNAEngine,
} from '@sentra/core';

// TODO: Import from core when available
interface VectorDatabaseService {
  // Placeholder interface for vector database operations
  [key: string]: any;
}

import {
  EvolvePatternRequestSchema,
  CreatePatternRequestSchema,
  UpdatePatternRequestSchema,
  SpawnAgentRequestSchema,
  RecordLearningRequestSchema,
  PatternListQuerySchema,
  AgentListQuerySchema,
  // EventListQuerySchema, // TODO: Will be used when event listing is implemented
  // MetricsQuerySchema, // TODO: Will be used when metrics querying is implemented
  type EvolvePatternRequest,
  type CreatePatternRequest,
  type UpdatePatternRequest,
  type SpawnAgentRequest,
  type RecordLearningRequest,
  type PatternListQuery,
  type AgentListQuery,
  // type EventListQuery, // TODO: Will be used when event listing is implemented
  // type MetricsQuery, // TODO: Will be used when metrics querying is implemented
} from '../schemas/validation';

import { authenticate, authorize, Permissions, type AuthenticatedRequest, AuthService } from '../middleware/auth';
import { 
  validateRequest, 
  // asyncHandler, // Using asyncAuthHandler instead
  asyncAuthHandler, 
  throwNotFound,
  // throwBusinessLogic, // TODO: Will be used when business logic validation is needed
  // throwDatabaseError, // TODO: Will be used when database operations are added
} from '../middleware/error-handler';

/**
 * Service dependencies interface
 */
export interface EvolutionServiceDependencies {
  readonly dnaEngine: TestDNAEngine;
  readonly vectorStore: VectorDatabaseService;
  readonly database: any; // Database connection - to be typed when database is fully integrated
  readonly logger: any;   // Logger instance - to be typed when logger is configured
  readonly authService: AuthService;
}

/**
 * Helper function to create properly branded IDs
 */
function createBrandedId<T extends string>(value: string, _brand: T): string & Brand<string, T> {
  return value as string & Brand<string, T>;
}

function createProjectContextId(value: string): ProjectContextId {
  return value as ProjectContextId;
}

/**
 * Helper function to convert API ProjectContext to Core ProjectContext
 */
function convertToFullProjectContext(context: Partial<ProjectContext>): import('@sentra/core/src/types/evolution').ProjectContext {
  return {
    id: createBrandedId('default_project', 'ProjectContextId'),
    projectType: (context.projectType === 'ai-ml' || context.projectType === 'blockchain' || context.projectType === 'embedded') ? 'web-app' : (context.projectType || 'web-app'),
    techStack: context.techStack || [],
    complexity: (context.complexity === 'research') ? 'enterprise' : (context.complexity || 'medium'),
    teamSize: context.teamSize || 1,
    timeline: context.timeline || '1 month',
    requirements: context.requirements || [],
    // Default values for extended properties
    industryDomain: 'general',
    regulatoryCompliance: [],
    performanceRequirements: {
      maxResponseTime: 5000,
      minThroughput: 100,
      availabilityTarget: 0.99,
      errorRateThreshold: 0.01,
    },
    scalabilityNeeds: {
      expectedGrowthRate: 1.5,
      peakLoadCapacity: 1000,
      dataVolumeGrowth: '1GB/month',
      horizontalScaling: true,
    },
    securityRequirements: {
      authenticationMethod: 'jwt',
      encryptionRequirements: ['TLS'],
      auditingNeeds: 'basic',
      dataPrivacyLevel: 'internal',
    },
    developmentStage: 'mvp',
    testingStrategy: 'unit',
    deploymentStrategy: 'ci-cd',
    monitoringNeeds: 'basic',
  } as import('@sentra/core/src/types/evolution').ProjectContext;
}

/**
 * Helper function to convert Core CodeDNA to API EvolutionDna
 */
function convertCodeDnaToEvolutionDna(codeDna: import('@sentra/core/src/types/evolution').CodeDNA): EvolutionDna {
  return {
    id: codeDna.id,
    patternType: codeDna.patternType,
    genetics: {
      complexity: codeDna.genetics.complexity,
      adaptability: codeDna.genetics.adaptability,
      successRate: codeDna.genetics.successRate,
      transferability: codeDna.genetics.transferability,
      stability: codeDna.genetics.stability,
      novelty: codeDna.genetics.novelty,
    },
    performance: {
      successRate: codeDna.performance.successRate,
      averageTaskCompletionTime: codeDna.performance.averageTaskCompletionTime,
      codeQualityScore: codeDna.performance.codeQualityScore,
      userSatisfactionRating: codeDna.performance.userSatisfactionRating,
      adaptationSpeed: codeDna.performance.adaptationSpeed,
      errorRecoveryRate: codeDna.performance.errorRecoveryRate,
    },
    projectContext: {
      id: createProjectContextId(`project_${Date.now()}`),
      projectType: (codeDna.context.projectType === 'ai-ml' || codeDna.context.projectType === 'blockchain' || codeDna.context.projectType === 'embedded') ? 'web-app' : codeDna.context.projectType,
      techStack: codeDna.context.techStack,
      complexity: (codeDna.context.complexity === 'research') ? 'enterprise' : codeDna.context.complexity,
      teamSize: codeDna.context.teamSize,
      timeline: codeDna.context.timeline,
      requirements: codeDna.context.requirements,
    },
    generation: codeDna.generation,
    ...(codeDna.parentId && { parentId: codeDna.parentId }),
    embedding: codeDna.embedding,
    createdAt: codeDna.timestamp,
    updatedAt: codeDna.timestamp,
  };
}

/**
 * Create evolution router with injected dependencies
 */
export const createEvolutionRouter = (deps: EvolutionServiceDependencies): Router => {
  const router = Router();

  /**
   * POST /api/evolution/patterns/evolve
   * Evolve an existing DNA pattern based on feedback
   */
  router.post(
    '/patterns/evolve',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_EVOLVE),
    validateRequest({ body: EvolvePatternRequestSchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { patternId, context: _context, feedback, evolutionTrigger = 'manual' } = req.body as EvolvePatternRequest;
      
      // Cast patternId to proper branded type
      const typedPatternId = createBrandedId(String(patternId), 'EvolutionDnaId');
      
      deps.logger?.info('Evolution request received', {
        patternId,
        userId: req.user.userId,
        trigger: evolutionTrigger,
      });

      // Retrieve existing pattern
      const existingPattern = await getPatternById(deps, typedPatternId);
      if (!existingPattern) {
        throwNotFound('Evolution Pattern', patternId);
        return; // TypeScript doesn't know throwNotFound never returns
      }

      // Validate evolution eligibility - check if pattern exists
      // TODO: Add isArchived field to EvolutionDna interface when database is integrated

      // Perform evolution using DNA engine
      // TODO: Use evolution result for confidence scoring
      await deps.dnaEngine.testEvolution(existingPattern as any);
      
      // Create evolved pattern
      const evolvedPattern: EvolutionDna = {
        ...existingPattern,
        id: createBrandedId(`evolved_${Date.now()}`, 'EvolutionDnaId'),
        generation: existingPattern.generation + 1,
        parentId: existingPattern.id,
        genetics: {
          ...existingPattern.genetics,
          // Apply evolution improvements based on feedback
          adaptability: Math.min(1.0,
            existingPattern.genetics.adaptability + (feedback.performanceImprovement * 0.1)
          ),
          successRate: Math.min(1.0,
            existingPattern.genetics.successRate + (feedback.performanceImprovement * 0.05)
          ),
        },
        performance: {
          ...existingPattern.performance,
          successRate: Math.min(1.0,
            existingPattern.performance.successRate + (feedback.performanceImprovement * 0.1)
          ),
        },
        updatedAt: new Date(),
      };

      // Store evolved pattern in database
      // TODO: Implement database storage when schema is ready
      deps.logger?.info('Pattern evolved successfully', {
        originalId: patternId,
        evolvedId: evolvedPattern.id,
        generation: evolvedPattern.generation,
      });

      // TODO: Store evolution event when event tracking is implemented
      /*
      const _evolutionEvent: EvolutionEvent = {
        id: createBrandedId(`event_${Date.now()}`, 'EvolutionEventId'),
        parentDnaId: existingPattern.id,
        childDnaId: evolvedPattern.id,
        agentInstanceId: createBrandedId(String(req.user.userId), 'AgentInstanceId'), // TODO: Map user to agent properly
        evolutionTrigger,
        geneticChanges: {
          adaptability: {
            from: existingPattern.genetics.adaptability,
            to: evolvedPattern.genetics.adaptability,
          },
          successRate: {
            from: existingPattern.genetics.successRate,
            to: evolvedPattern.genetics.successRate,
          },
        },
        performanceDelta: {
          successRate: evolvedPattern.performance.successRate - existingPattern.performance.successRate,
          averageTaskCompletionTime: 0, // TODO: Calculate from actual metrics
          codeQualityScore: 0,
          userSatisfactionRating: 0,
          adaptationSpeed: 0,
          errorRecoveryRate: 0,
        },
        confidenceScore: evolutionResult.success ? 0.8 : 0.4,
        createdAt: new Date(),
      };
      */

      // Store evolution event
      // TODO: Implement database storage

      const response: ApiResponse<EvolutionDna> = {
        success: true,
        data: evolvedPattern,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * GET /api/evolution/patterns
   * List DNA patterns with filtering and pagination
   */
  router.get(
    '/patterns',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_READ),
    validateRequest({ query: PatternListQuerySchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const query = req.query as unknown as PatternListQuery;
      
      deps.logger?.info('Pattern list request', {
        userId: req.user.userId,
        filters: query,
      });

      // TODO: Implement database query with filters
      const mockContext = convertToFullProjectContext({
        projectType: 'web-app',
        techStack: ['typescript', 'react'],
        complexity: 'medium',
        teamSize: 5,
        timeline: '3 months',
        requirements: ['responsive design', 'authentication'],
      });
      
      const mockCodeDna = await deps.dnaEngine.generateTestPattern(mockContext);
      const mockPatterns: EvolutionDna[] = [
        convertCodeDnaToEvolutionDna(mockCodeDna),
      ];

      const response = {
        success: true,
        data: {
          items: mockPatterns.slice((query.page - 1) * query.limit, query.page * query.limit),
          pagination: {
            page: query.page,
            limit: query.limit,
            total: mockPatterns.length,
            pages: Math.ceil(mockPatterns.length / query.limit),
          },
        },
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * GET /api/evolution/patterns/:id
   * Get specific DNA pattern details
   */
  router.get(
    '/patterns/:id',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_READ),
    validateRequest({ params: EvolvePatternRequestSchema.pick({ patternId: true }) }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      
      // Cast id to proper branded type
      const typedId = createBrandedId(id || '', 'EvolutionDnaId');
      const pattern = await getPatternById(deps, typedId);
      if (!pattern) {
        throwNotFound('Evolution Pattern', id);
        return;
      }

      const response: ApiResponse<EvolutionDna> = {
        success: true,
        data: pattern,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * POST /api/evolution/patterns
   * Create new DNA pattern
   */
  router.post(
    '/patterns',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_CREATE),
    validateRequest({ body: CreatePatternRequestSchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const createRequest = req.body as CreatePatternRequest;
      
      deps.logger?.info('Create pattern request', {
        userId: req.user.userId,
        patternType: createRequest.patternType,
      });

      // Generate new pattern using DNA engine
      const contextWithId = {
        ...createRequest.projectContext,
        id: createRequest.projectContext.id ? createProjectContextId(createRequest.projectContext.id) : createProjectContextId(`project_${Date.now()}`),
      };
      const fullContext = convertToFullProjectContext(contextWithId);
      const newCodeDna = await deps.dnaEngine.generateTestPattern(fullContext);
      const newPattern = convertCodeDnaToEvolutionDna(newCodeDna);

      // Override with provided data
      const customPattern: EvolutionDna = {
        ...newPattern,
        id: createBrandedId(`pattern_${Date.now()}`, 'EvolutionDnaId'),
        patternType: createRequest.patternType,
        genetics: createRequest.genetics,
        performance: createRequest.initialPerformance || newPattern.performance,
        projectContext: {
          ...createRequest.projectContext,
          id: createRequest.projectContext.id ? createProjectContextId(createRequest.projectContext.id) : createProjectContextId(`project_${Date.now()}`),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Store in database

      const response: ApiResponse<EvolutionDna> = {
        success: true,
        data: customPattern,
        timestamp: new Date(),
      };

      res.status(201).json(response);
    })
  );

  /**
   * PUT /api/evolution/patterns/:id
   * Update existing DNA pattern
   */
  router.put(
    '/patterns/:id',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_UPDATE),
    validateRequest({ 
      params: EvolvePatternRequestSchema.pick({ patternId: true }),
      body: UpdatePatternRequestSchema,
    }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const updateRequest = req.body as UpdatePatternRequest;
      
      // Cast id to proper branded type
      const typedId = createBrandedId(id || '', 'EvolutionDnaId');
      const existingPattern = await getPatternById(deps, typedId);
      if (!existingPattern) {
        throwNotFound('Evolution Pattern', id);
        return;
      }

      const updatedPattern: EvolutionDna = {
        ...existingPattern,
        genetics: {
          complexity: updateRequest.genetics?.complexity ?? existingPattern.genetics.complexity,
          adaptability: updateRequest.genetics?.adaptability ?? existingPattern.genetics.adaptability,
          successRate: updateRequest.genetics?.successRate ?? existingPattern.genetics.successRate,
          transferability: updateRequest.genetics?.transferability ?? existingPattern.genetics.transferability,
          stability: updateRequest.genetics?.stability ?? existingPattern.genetics.stability,
          novelty: updateRequest.genetics?.novelty ?? existingPattern.genetics.novelty,
        },
        performance: {
          successRate: updateRequest.performance?.successRate ?? existingPattern.performance.successRate,
          averageTaskCompletionTime: updateRequest.performance?.averageTaskCompletionTime ?? existingPattern.performance.averageTaskCompletionTime,
          codeQualityScore: updateRequest.performance?.codeQualityScore ?? existingPattern.performance.codeQualityScore,
          userSatisfactionRating: updateRequest.performance?.userSatisfactionRating ?? existingPattern.performance.userSatisfactionRating,
          adaptationSpeed: updateRequest.performance?.adaptationSpeed ?? existingPattern.performance.adaptationSpeed,
          errorRecoveryRate: updateRequest.performance?.errorRecoveryRate ?? existingPattern.performance.errorRecoveryRate,
        },
        projectContext: {
          id: existingPattern.projectContext.id,
          projectType: updateRequest.projectContext?.projectType ?? existingPattern.projectContext.projectType,
          techStack: updateRequest.projectContext?.techStack ?? existingPattern.projectContext.techStack,
          complexity: updateRequest.projectContext?.complexity ?? existingPattern.projectContext.complexity,
          teamSize: updateRequest.projectContext?.teamSize ?? existingPattern.projectContext.teamSize,
          timeline: updateRequest.projectContext?.timeline ?? existingPattern.projectContext.timeline,
          requirements: updateRequest.projectContext?.requirements ?? existingPattern.projectContext.requirements,
        },
        updatedAt: new Date(),
      };

      // TODO: Store in database

      const response: ApiResponse<EvolutionDna> = {
        success: true,
        data: updatedPattern,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * DELETE /api/evolution/patterns/:id
   * Archive DNA pattern (soft delete)
   */
  router.delete(
    '/patterns/:id',
    authenticate(deps.authService),
    authorize(Permissions.PATTERN_DELETE),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      
      // Cast id to proper branded type
      const typedId = createBrandedId(id || '', 'EvolutionDnaId');
      const existingPattern = await getPatternById(deps, typedId);
      if (!existingPattern) {
        throwNotFound('Evolution Pattern', id);
        return;
      }

      // TODO: Implement soft delete in database

      const response: ApiResponse<{ archived: true }> = {
        success: true,
        data: { archived: true },
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * POST /api/evolution/agents/spawn
   * Create new agent instance
   */
  router.post(
    '/agents/spawn',
    authenticate(deps.authService),
    authorize(Permissions.AGENT_SPAWN),
    validateRequest({ body: SpawnAgentRequestSchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const spawnRequest = req.body as SpawnAgentRequest;
      
      deps.logger?.info('Agent spawn request', {
        userId: req.user.userId,
        dnaId: spawnRequest.evolutionDnaId,
        agentName: spawnRequest.name,
      });

      // Verify DNA pattern exists - cast to proper branded type
      const typedDnaId = createBrandedId(String(spawnRequest.evolutionDnaId), 'EvolutionDnaId');
      const dnaPattern = await getPatternById(deps, typedDnaId);
      if (!dnaPattern) {
        throwNotFound('Evolution DNA', String(spawnRequest.evolutionDnaId));
      }

      // Create new agent instance
      const newAgent: AgentInstance = {
        id: createBrandedId(`agent_${Date.now()}`, 'AgentInstanceId'),
        evolutionDnaId: typedDnaId,
        name: spawnRequest.name,
        role: spawnRequest.role,
        status: 'active',
        spawnedAt: new Date(),
        lastActiveAt: new Date(),
        performanceHistory: [],
        metadata: spawnRequest.metadata || {},
      };

      // TODO: Store in database

      const response: ApiResponse<AgentInstance> = {
        success: true,
        data: newAgent,
        timestamp: new Date(),
      };

      res.status(201).json(response);
    })
  );

  /**
   * GET /api/evolution/agents
   * List agent instances
   */
  router.get(
    '/agents',
    authenticate(deps.authService),
    authorize(Permissions.AGENT_READ),
    validateRequest({ query: AgentListQuerySchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      // TODO: Implement proper query validation
      const query = req.query as unknown as AgentListQuery;
      
      // TODO: Implement database query
      const mockAgents: AgentInstance[] = [];

      const response = {
        success: true,
        data: {
          items: mockAgents.slice((query.page - 1) * query.limit, query.page * query.limit),
          pagination: {
            page: query.page,
            limit: query.limit,
            total: mockAgents.length,
            pages: Math.ceil(mockAgents.length / query.limit),
          },
        },
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  /**
   * PUT /api/evolution/agents/:id/learn
   * Record learning outcome for agent
   */
  router.put(
    '/agents/:id/learn',
    authenticate(deps.authService),
    authorize(Permissions.AGENT_LEARN),
    validateRequest({ body: RecordLearningRequestSchema }),
    asyncAuthHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const learningRequest = req.body as RecordLearningRequest;
      
      // Cast id to proper branded type
      const typedId = createBrandedId(id || '', 'AgentInstanceId');
      
      // TODO: Verify agent exists
      
      const learningOutcome: LearningOutcome = {
        id: createBrandedId(`learning_${Date.now()}`, 'LearningOutcomeId'),
        agentInstanceId: typedId,
        evolutionDnaId: createBrandedId(String(learningRequest.agentId), 'EvolutionDnaId'), // TODO: Get from agent record
        taskId: createBrandedId(String(learningRequest.taskId), 'TaskId'),
        outcomeType: learningRequest.outcomeType,
        performanceImprovement: learningRequest.performanceImprovement,
        lessonLearned: learningRequest.lessonLearned,
        contextFactors: learningRequest.contextFactors,
        applicabilityScore: learningRequest.applicabilityScore,
        createdAt: new Date(),
      };

      // TODO: Store in database

      const response: ApiResponse<LearningOutcome> = {
        success: true,
        data: learningOutcome,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    })
  );

  return router;
};

/**
 * Helper function to retrieve pattern by ID
 * TODO: Replace with actual database query
 */
async function getPatternById(
  deps: EvolutionServiceDependencies,
  id: EvolutionDnaId
): Promise<EvolutionDna | null> {
  try {
    // Mock implementation - replace with actual database query
    const mockContext = convertToFullProjectContext({
      projectType: 'web-app',
      techStack: ['typescript', 'react'],
      complexity: 'medium',
      teamSize: 5,
      timeline: '3 months',
      requirements: ['authentication', 'responsive'],
    });
    
    const testCodeDna = await deps.dnaEngine.generateTestPattern(mockContext);
    const testPattern = convertCodeDnaToEvolutionDna(testCodeDna);
    
    return {
      ...testPattern,
      id,
    };
  } catch (error) {
    deps.logger?.error('Error retrieving pattern', { patternId: id, error });
    return null;
  }
}

export default createEvolutionRouter;