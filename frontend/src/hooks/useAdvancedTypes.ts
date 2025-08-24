import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useClaudeCode } from './useClaudeCode';
import { useMCPServer } from './useMCPServer';

// Advanced Type System Types
export interface TypeDefinition {
  id: string;
  name: string;
  kind: 'interface' | 'type' | 'class' | 'enum' | 'union' | 'generic';
  language: 'typescript' | 'python' | 'java' | 'csharp' | 'rust' | 'go';
  definition: string;
  properties: TypeProperty[];
  methods?: TypeMethod[];
  generics?: GenericParameter[];
  extends?: string[];
  implements?: string[];
  documentation: string;
  examples: TypeExample[];
  metadata: TypeMetadata;
}

export interface TypeProperty {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  description: string;
  defaultValue?: any;
  validators?: PropertyValidator[];
}

export interface TypeMethod {
  name: string;
  parameters: MethodParameter[];
  returnType: string;
  description: string;
  async: boolean;
  static: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
  description: string;
}

export interface GenericParameter {
  name: string;
  constraints?: string[];
  defaultType?: string;
  description: string;
}

export interface PropertyValidator {
  type: 'required' | 'length' | 'range' | 'pattern' | 'custom';
  config: Record<string, any>;
  message: string;
}

export interface TypeExample {
  name: string;
  code: string;
  description: string;
  valid: boolean;
}

export interface TypeMetadata {
  projectId: string;
  agentId: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  complexity: number;
  dependencies: string[];
  tags: string[];
}

export interface CodeInference {
  id: string;
  sourceCode: string;
  language: string;
  inferredTypes: InferredType[];
  confidence: number;
  suggestions: TypeSuggestion[];
  errors: TypeError[];
  metadata: InferenceMetadata;
}

export interface InferredType {
  name: string;
  type: string;
  location: CodeLocation;
  confidence: number;
  reasoning: string;
  alternatives: TypeAlternative[];
}

export interface TypeAlternative {
  type: string;
  confidence: number;
  reasoning: string;
}

export interface TypeSuggestion {
  type: 'add_type_annotation' | 'create_interface' | 'use_generic' | 'simplify_type' | 'union_to_enum';
  location: CodeLocation;
  current: string;
  suggested: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TypeError {
  type: 'type_mismatch' | 'missing_property' | 'invalid_generic' | 'circular_dependency';
  location: CodeLocation;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface InferenceMetadata {
  analysisTime: number;
  linesAnalyzed: number;
  typesInferred: number;
  confidenceDistribution: Record<string, number>;
  languageFeatures: string[];
}

export interface TypeGeneration {
  id: string;
  request: TypeGenerationRequest;
  result: TypeGenerationResult;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
}

export interface TypeGenerationRequest {
  prompt: string;
  language: string;
  context: TypeContext;
  constraints: TypeConstraint[];
  outputFormat: 'interface' | 'class' | 'type' | 'enum' | 'mixed';
  includeValidation: boolean;
  includeExamples: boolean;
  includeDocumentation: boolean;
}

export interface TypeContext {
  projectId: string;
  existingTypes: string[];
  codebase: CodebaseContext;
  requirements: string[];
  conventions: CodingConvention[];
}

export interface CodebaseContext {
  framework: string;
  version: string;
  dependencies: Record<string, string>;
  patterns: string[];
  architecture: 'mvc' | 'mvvm' | 'clean' | 'hexagonal' | 'microservices';
}

export interface CodingConvention {
  type: 'naming' | 'structure' | 'documentation' | 'validation';
  rules: Record<string, any>;
  priority: number;
}

export interface TypeConstraint {
  type: 'extends' | 'implements' | 'generic' | 'property' | 'method';
  value: any;
  required: boolean;
}

export interface TypeGenerationResult {
  types: GeneratedType[];
  documentation: string;
  examples: string[];
  validationRules: ValidationRule[];
  tests: string[];
  metadata: GenerationMetadata;
}

export interface GeneratedType {
  name: string;
  definition: string;
  kind: TypeDefinition['kind'];
  dependencies: string[];
  usage: string[];
}

export interface ValidationRule {
  field: string;
  rules: string[];
  message: string;
}

export interface GenerationMetadata {
  tokensUsed: number;
  generationTime: number;
  qualityScore: number;
  complexityScore: number;
  maintainabilityIndex: number;
}

export interface TypeRegistry {
  types: Map<string, TypeDefinition>;
  dependencies: Map<string, string[]>;
  usageGraph: Map<string, string[]>;
  searchIndex: Map<string, string[]>;
}

export const useAdvancedTypes = () => {
  const [typeRegistry, setTypeRegistry] = useState<TypeRegistry>({
    types: new Map(),
    dependencies: new Map(),
    usageGraph: new Map(),
    searchIndex: new Map(),
  });
  const [activeInferences, setActiveInferences] = useState<Map<string, CodeInference>>(new Map());
  const [activeGenerations, setActiveGenerations] = useState<Map<string, TypeGeneration>>(new Map());
  const [typeCache, setTypeCache] = useState<Map<string, any>>(new Map());
  
  const { generateCode, reviewCode, isInitialized: claudeInitialized } = useClaudeCode();
  const { executeRequest, isInitialized: mcpInitialized } = useMCPServer();
  const { addNotification, projects, agents } = useDashboardStore();

  // Initialize type registry with project types
  const initializeTypeRegistry = useCallback(async (projectId: string) => {
    try {
      // Load existing type definitions from project
      const response = await fetch(`/api/projects/${projectId}/types`);
      const existingTypes = response.ok ? await response.json() : [];

      const newRegistry: TypeRegistry = {
        types: new Map(),
        dependencies: new Map(),
        usageGraph: new Map(),
        searchIndex: new Map(),
      };

      // Process existing types
      for (const typeData of existingTypes) {
        const typeDef = parseTypeDefinition(typeData);
        newRegistry.types.set(typeDef.id, typeDef);
        updateTypeIndices(newRegistry, typeDef);
      }

      // Add built-in types for common frameworks
      const builtInTypes = await loadBuiltInTypes('typescript');
      for (const typeDef of builtInTypes) {
        newRegistry.types.set(typeDef.id, typeDef);
        updateTypeIndices(newRegistry, typeDef);
      }

      setTypeRegistry(newRegistry);

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Type Registry Initialized',
        message: `Loaded ${newRegistry.types.size} type definitions`,
        timestamp: new Date().toISOString(),
        priority: 'low',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error('Failed to initialize type registry:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Type Registry Error',
        message: 'Failed to initialize type registry',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });
    }
  }, [addNotification]);

  // Infer types from code
  const inferTypes = useCallback(async (
    code: string,
    language: string,
    projectId: string
  ): Promise<CodeInference> => {
    if (!claudeInitialized && !mcpInitialized) {
      throw new Error('Type inference services not available');
    }

    const inferenceId = `inference_${Date.now()}`;
    const startTime = Date.now();

    try {
      setActiveInferences(prev => new Map(prev.set(inferenceId, {
        id: inferenceId,
        sourceCode: code,
        language,
        inferredTypes: [],
        confidence: 0,
        suggestions: [],
        errors: [],
        metadata: {
          analysisTime: 0,
          linesAnalyzed: code.split('\n').length,
          typesInferred: 0,
          confidenceDistribution: {},
          languageFeatures: [],
        },
      } as CodeInference)));

      let inferredTypes: InferredType[] = [];
      let suggestions: TypeSuggestion[] = [];
      let errors: TypeError[] = [];

      // Try MCP server first for type analysis
      if (mcpInitialized) {
        try {
          const mcpResult = await executeRequest({
            capability: 'analyze_types',
            parameters: {
              code,
              language,
              project_context: projects.find(p => p.id === projectId),
            },
            context: { projectId },
          });

          if (mcpResult.success && mcpResult.data) {
            inferredTypes = mcpResult.data.types || [];
            suggestions = mcpResult.data.suggestions || [];
            errors = mcpResult.data.errors || [];
          }
        } catch (mcpError) {
          console.warn('MCP type analysis failed, falling back to Claude:', mcpError);
        }
      }

      // Fallback to Claude Code for type inference
      if (inferredTypes.length === 0 && claudeInitialized) {
        const project = projects.find(p => p.id === projectId);
        const agent = agents.find(a => a.type === 'code-analyzer') || agents[0];

        if (project && agent) {
          const codeResult = await generateCode({
            prompt: `Analyze the following ${language} code and infer all types. Provide detailed type annotations, suggestions for improvements, and identify any type-related issues.`,
            language,
            projectContext: project,
            agentContext: agent,
            previousCode: code,
            requirements: [
              'Infer all variable and function types',
              'Identify missing type annotations',
              'Suggest interface definitions for complex objects',
              'Flag potential type safety issues',
              'Recommend generic type usage where appropriate',
            ],
          });

          const analysis = parseTypeAnalysis(codeResult.code, codeResult.explanation);
          inferredTypes = analysis.types;
          suggestions = analysis.suggestions;
          errors = analysis.errors;
        }
      }

      const inference: CodeInference = {
        id: inferenceId,
        sourceCode: code,
        language,
        inferredTypes,
        confidence: calculateConfidence(inferredTypes),
        suggestions,
        errors,
        metadata: {
          analysisTime: Date.now() - startTime,
          linesAnalyzed: code.split('\n').length,
          typesInferred: inferredTypes.length,
          confidenceDistribution: buildConfidenceDistribution(inferredTypes),
          languageFeatures: detectLanguageFeatures(code, language),
        },
      };

      setActiveInferences(prev => new Map(prev.set(inferenceId, inference)));
      return inference;

    } finally {
      // Clean up after delay
      setTimeout(() => {
        setActiveInferences(prev => {
          const newMap = new Map(prev);
          newMap.delete(inferenceId);
          return newMap;
        });
      }, 60000); // Keep for 1 minute
    }
  }, [claudeInitialized, mcpInitialized, executeRequest, generateCode, projects, agents]);

  // Generate types from requirements
  const generateTypes = useCallback(async (request: TypeGenerationRequest): Promise<TypeGeneration> => {
    if (!claudeInitialized) {
      throw new Error('Type generation service not available');
    }

    const generationId = `generation_${Date.now()}`;
    const startTime = Date.now();

    const generation: TypeGeneration = {
      id: generationId,
      request,
      result: {} as TypeGenerationResult,
      status: 'processing',
      progress: 0,
      startedAt: new Date().toISOString(),
    };

    setActiveGenerations(prev => new Map(prev.set(generationId, generation)));

    try {
      const project = projects.find(p => p.id === request.context.projectId);
      const agent = agents.find(a => a.type === 'code-analyzer') || agents[0];

      if (!project || !agent) {
        throw new Error('Project or agent not found for type generation');
      }

      // Update progress
      generation.progress = 25;
      setActiveGenerations(prev => new Map(prev.set(generationId, { ...generation })));

      // Build comprehensive prompt for type generation
      const typePrompt = buildTypeGenerationPrompt(request);

      const codeResult = await generateCode({
        prompt: typePrompt,
        language: request.language,
        projectContext: project,
        agentContext: agent,
        requirements: request.constraints.map(c => `${c.type}: ${JSON.stringify(c.value)}`),
      });

      // Update progress
      generation.progress = 75;
      setActiveGenerations(prev => new Map(prev.set(generationId, { ...generation })));

      // Parse generated types
      const generatedTypes = parseGeneratedTypes(codeResult.code, request.language);
      const validationRules = extractValidationRules(codeResult.explanation);
      const examples = extractExamples(codeResult.explanation);
      const tests = codeResult.tests ? [codeResult.tests] : [];

      const result: TypeGenerationResult = {
        types: generatedTypes,
        documentation: codeResult.explanation,
        examples,
        validationRules,
        tests,
        metadata: {
          tokensUsed: estimateTokensUsed(codeResult.code + codeResult.explanation),
          generationTime: Date.now() - startTime,
          qualityScore: calculateQualityScore(generatedTypes),
          complexityScore: calculateComplexityScore(generatedTypes),
          maintainabilityIndex: calculateMaintainabilityIndex(generatedTypes),
        },
      };

      // Update type registry
      for (const generatedType of generatedTypes) {
        const typeDef: TypeDefinition = {
          id: `${request.context.projectId}_${generatedType.name}`,
          name: generatedType.name,
          kind: generatedType.kind,
          language: request.language as TypeDefinition['language'],
          definition: generatedType.definition,
          properties: extractProperties(generatedType.definition),
          methods: extractMethods(generatedType.definition),
          documentation: result.documentation,
          examples: examples.map(ex => ({ name: 'Generated', code: ex, description: 'Auto-generated example', valid: true })),
          metadata: {
            projectId: request.context.projectId,
            agentId: agent.id,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            complexity: result.metadata.complexityScore,
            dependencies: generatedType.dependencies,
            tags: ['generated', 'ai-created'],
          },
        };

        typeRegistry.types.set(typeDef.id, typeDef);
        updateTypeIndices(typeRegistry, typeDef);
      }

      setTypeRegistry({ ...typeRegistry });

      // Complete generation
      generation.status = 'completed';
      generation.progress = 100;
      generation.result = result;
      generation.completedAt = new Date().toISOString();

      setActiveGenerations(prev => new Map(prev.set(generationId, { ...generation })));

      addNotification({
        id: generationId,
        type: 'success',
        title: 'Types Generated',
        message: `Generated ${generatedTypes.length} type definitions`,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

      return generation;

    } catch (error) {
      console.error('Type generation failed:', error);
      generation.status = 'failed';
      setActiveGenerations(prev => new Map(prev.set(generationId, { ...generation })));
      
      addNotification({
        id: generationId,
        type: 'error',
        title: 'Type Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });

      throw error;
    }
  }, [claudeInitialized, generateCode, projects, agents, typeRegistry, addNotification]);

  // Search types in registry
  const searchTypes = useCallback((query: string, filters?: {
    language?: string;
    kind?: TypeDefinition['kind'];
    projectId?: string;
    tags?: string[];
  }): TypeDefinition[] => {
    const results: TypeDefinition[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    for (const typeDef of typeRegistry.types.values()) {
      // Apply filters
      if (filters?.language && typeDef.language !== filters.language) continue;
      if (filters?.kind && typeDef.kind !== filters.kind) continue;
      if (filters?.projectId && typeDef.metadata.projectId !== filters.projectId) continue;
      if (filters?.tags && !filters.tags.some(tag => typeDef.metadata.tags.includes(tag))) continue;

      // Search in name, documentation, and properties
      const searchableText = [
        typeDef.name,
        typeDef.documentation,
        ...typeDef.properties.map(p => `${p.name} ${p.description}`),
        ...typeDef.metadata.tags,
      ].join(' ').toLowerCase();

      const matches = searchTerms.every(term => searchableText.includes(term));
      if (matches) {
        results.push(typeDef);
      }
    }

    return results.sort((a, b) => {
      // Sort by relevance (usage count, then name)
      if (a.metadata.usageCount !== b.metadata.usageCount) {
        return b.metadata.usageCount - a.metadata.usageCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [typeRegistry.types]);

  // Get type suggestions for code completion
  const getTypeSuggestions = useCallback((
    context: string,
    language: string,
    position: CodeLocation
  ): TypeSuggestion[] => {
    // Implement intelligent type suggestions based on context
    // This would integrate with the type registry and inference results
    return [];
  }, []);

  // Helper functions
  const updateTypeIndices = (registry: TypeRegistry, typeDef: TypeDefinition) => {
    // Update search index
    const searchTerms = [
      typeDef.name,
      ...typeDef.metadata.tags,
      ...typeDef.properties.map(p => p.name),
    ];
    
    for (const term of searchTerms) {
      const existing = registry.searchIndex.get(term.toLowerCase()) || [];
      existing.push(typeDef.id);
      registry.searchIndex.set(term.toLowerCase(), existing);
    }

    // Update dependencies
    registry.dependencies.set(typeDef.id, typeDef.metadata.dependencies);
  };

  const parseTypeDefinition = (data: any): TypeDefinition => {
    // Parse type definition from various formats (JSON, TypeScript, etc.)
    return data; // Simplified implementation
  };

  const loadBuiltInTypes = async (language: string): Promise<TypeDefinition[]> => {
    // Load built-in types for the specified language
    return []; // Simplified implementation
  };

  const parseTypeAnalysis = (code: string, explanation: string): {
    types: InferredType[];
    suggestions: TypeSuggestion[];
    errors: TypeError[];
  } => {
    // Parse Claude's type analysis response
    return { types: [], suggestions: [], errors: [] }; // Simplified implementation
  };

  // More helper functions would be implemented here...

  return {
    // Type registry
    typeRegistry: typeRegistry.types,
    searchTypes,
    
    // Type inference
    inferTypes,
    activeInferences: Array.from(activeInferences.values()),
    
    // Type generation
    generateTypes,
    activeGenerations: Array.from(activeGenerations.values()),
    
    // Utilities
    getTypeSuggestions,
    initializeTypeRegistry,
    
    // Status
    isInitialized: claudeInitialized || mcpInitialized,
  };
};

// Additional helper functions for type analysis and generation
function calculateConfidence(types: InferredType[]): number {
  if (types.length === 0) return 0;
  return types.reduce((sum, type) => sum + type.confidence, 0) / types.length;
}

function buildConfidenceDistribution(types: InferredType[]): Record<string, number> {
  const distribution: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const type of types) {
    if (type.confidence >= 0.8) distribution.high++;
    else if (type.confidence >= 0.5) distribution.medium++;
    else distribution.low++;
  }

  return distribution;
}

function detectLanguageFeatures(code: string, language: string): string[] {
  const features: string[] = [];
  
  if (language === 'typescript') {
    if (code.includes('interface')) features.push('interfaces');
    if (code.includes('type ')) features.push('type_aliases');
    if (code.includes('<T>') || code.includes('<T,')) features.push('generics');
    if (code.includes('enum')) features.push('enums');
    if (code.includes('|')) features.push('union_types');
    if (code.includes('&')) features.push('intersection_types');
  }
  
  return features;
}

function buildTypeGenerationPrompt(request: TypeGenerationRequest): string {
  return `Generate ${request.language} type definitions based on the following requirements:

${request.prompt}

Context:
- Project: ${request.context.projectId}
- Framework: ${request.context.codebase.framework}
- Architecture: ${request.context.codebase.architecture}
- Existing Types: ${request.context.existingTypes.join(', ')}

Constraints:
${request.constraints.map(c => `- ${c.type}: ${JSON.stringify(c.value)}`).join('\n')}

Requirements:
${request.context.requirements.map(r => `- ${r}`).join('\n')}

Please provide:
${request.includeDocumentation ? '- Comprehensive documentation' : ''}
${request.includeValidation ? '- Validation rules' : ''}
${request.includeExamples ? '- Usage examples' : ''}
- Clean, production-ready type definitions
- Proper naming conventions
- Type safety considerations`;
}

function parseGeneratedTypes(code: string, language: string): GeneratedType[] {
  // Parse generated types from code
  return []; // Simplified implementation
}

function extractValidationRules(explanation: string): ValidationRule[] {
  // Extract validation rules from explanation
  return []; // Simplified implementation
}

function extractExamples(explanation: string): string[] {
  // Extract examples from explanation
  return []; // Simplified implementation
}

function calculateQualityScore(types: GeneratedType[]): number {
  // Calculate quality score based on various metrics
  return 85; // Simplified implementation
}

function calculateComplexityScore(types: GeneratedType[]): number {
  // Calculate complexity score
  return 4; // Simplified implementation
}

function calculateMaintainabilityIndex(types: GeneratedType[]): number {
  // Calculate maintainability index
  return 78; // Simplified implementation
}

function estimateTokensUsed(text: string): number {
  // Rough estimation of tokens used
  return Math.ceil(text.length / 4);
}

function extractProperties(definition: string): TypeProperty[] {
  // Extract properties from type definition
  return []; // Simplified implementation
}

function extractMethods(definition: string): TypeMethod[] {
  // Extract methods from type definition
  return []; // Simplified implementation
}