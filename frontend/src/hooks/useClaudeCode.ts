import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Agent, Task, Project, CodeDiff, ConversationMessage } from '@/types';

// Claude Code Integration Types
export interface ClaudeCodeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  contextWindow: number;
  streaming: boolean;
}

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  framework?: string;
  projectContext: Project;
  agentContext: Agent;
  previousCode?: string;
  requirements: string[];
  testRequirements?: string[];
}

export interface CodeReviewRequest {
  code: string;
  language: string;
  projectId: string;
  agentId: string;
  reviewType: 'security' | 'performance' | 'quality' | 'standards' | 'comprehensive';
  contextFiles: string[];
}

export interface AgentCoordinationHook {
  agentId: string;
  hookType: 'pre_task' | 'post_task' | 'code_generation' | 'code_review' | 'error_handling' | 'task_handoff';
  priority: number;
  handler: (context: HookContext) => Promise<HookResult>;
  conditions: HookCondition[];
}

export interface HookContext {
  agent: Agent;
  task: Task;
  project: Project;
  previousResults?: any[];
  metadata: Record<string, any>;
  timestamp: string;
}

export interface HookResult {
  success: boolean;
  data?: any;
  modifications?: Record<string, any>;
  nextActions?: string[];
  errors?: string[];
  shouldContinue: boolean;
  contextUpdates?: Record<string, any>;
}

export interface HookCondition {
  type: 'project_type' | 'agent_type' | 'task_type' | 'code_language' | 'custom';
  value: string | string[];
  operator: 'equals' | 'includes' | 'regex' | 'custom';
  customCheck?: (context: HookContext) => boolean;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  enabled: boolean;
  priority: number;
}

export interface WorkflowTrigger {
  type: 'agent_status_change' | 'task_completion' | 'code_change' | 'error_detected' | 'manual' | 'scheduled';
  config: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'code_generation' | 'code_review' | 'test_generation' | 'deployment' | 'notification' | 'agent_communication';
  config: Record<string, any>;
  retryConfig?: RetryConfig;
  timeout: number;
}

export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
}

export const useClaudeCode = () => {
  const [config, setConfig] = useState<ClaudeCodeConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hooks, setHooks] = useState<Map<string, AgentCoordinationHook[]>>(new Map());
  const [workflows, setWorkflows] = useState<Map<string, WorkflowAutomation>>(new Map());
  const [activeTasks, setActiveTasks] = useState<Map<string, any>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  
  const {
    projects,
    agents,
    tasks,
    addNotification,
    updateTask,
    updateAgent,
    addCodeDiff,
    addConversation,
  } = useDashboardStore();

  // Initialize Claude Code integration
  const initialize = useCallback(async (claudeConfig: ClaudeCodeConfig) => {
    try {
      setConfig(claudeConfig);
      
      // Validate API connection
      const response = await fetch(`${claudeConfig.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${claudeConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Claude Code API connection failed: ${response.statusText}`);
      }
      
      setIsInitialized(true);
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Claude Code Initialized',
        message: 'Advanced AI capabilities are now available',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });
      
    } catch (error) {
      console.error('Failed to initialize Claude Code:', error);
      throw error;
    }
  }, [addNotification]);

  // Register coordination hooks
  const registerHook = useCallback((hook: AgentCoordinationHook) => {
    const agentHooks = hooks.get(hook.agentId) || [];
    const updatedHooks = [...agentHooks, hook].sort((a, b) => b.priority - a.priority);
    hooks.set(hook.agentId, updatedHooks);
    setHooks(new Map(hooks));
  }, [hooks]);

  // Execute hooks for a specific agent and type
  const executeHooks = useCallback(async (
    agentId: string, 
    hookType: AgentCoordinationHook['hookType'], 
    context: HookContext
  ): Promise<HookResult[]> => {
    const agentHooks = hooks.get(agentId) || [];
    const relevantHooks = agentHooks.filter(hook => 
      hook.hookType === hookType && 
      evaluateConditions(hook.conditions, context)
    );

    const results: HookResult[] = [];
    let shouldContinue = true;

    for (const hook of relevantHooks) {
      if (!shouldContinue) break;
      
      try {
        const result = await hook.handler(context);
        results.push(result);
        
        if (!result.shouldContinue) {
          shouldContinue = false;
        }
        
        // Apply context updates
        if (result.contextUpdates) {
          Object.assign(context.metadata, result.contextUpdates);
        }
        
      } catch (error) {
        console.error(`Hook execution failed for agent ${agentId}:`, error);
        results.push({
          success: false,
          errors: [error instanceof Error ? error.message : String(error)],
          shouldContinue: false,
        });
        shouldContinue = false;
      }
    }

    return results;
  }, [hooks]);

  // Evaluate hook conditions
  const evaluateConditions = (conditions: HookCondition[], context: HookContext): boolean => {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'project_type':
          return evaluateValue(context.project.name, condition.value, condition.operator);
        case 'agent_type':
          return evaluateValue(context.agent.type, condition.value, condition.operator);
        case 'task_type':
          return evaluateValue(context.task.title, condition.value, condition.operator);
        case 'custom':
          return condition.customCheck ? condition.customCheck(context) : true;
        default:
          return true;
      }
    });
  };

  const evaluateValue = (actual: string, expected: string | string[], operator: string): boolean => {
    switch (operator) {
      case 'equals':
        return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
      case 'includes':
        return Array.isArray(expected) ? expected.some(v => actual.includes(v)) : actual.includes(expected as string);
      case 'regex':
        const pattern = Array.isArray(expected) ? expected[0] : expected;
        return new RegExp(pattern as string).test(actual);
      default:
        return true;
    }
  };

  // Generate code with Claude
  const generateCode = useCallback(async (request: CodeGenerationRequest): Promise<{
    code: string;
    explanation: string;
    tests?: string;
    documentation?: string;
    metadata: Record<string, any>;
  }> => {
    if (!config || !isInitialized) {
      throw new Error('Claude Code not initialized');
    }

    const taskId = `code_gen_${Date.now()}`;
    const controller = new AbortController();
    abortControllers.current.set(taskId, controller);

    try {
      setActiveTasks(prev => new Map(prev.set(taskId, { type: 'code_generation', startTime: Date.now() })));

      // Execute pre-generation hooks
      const hookContext: HookContext = {
        agent: request.agentContext,
        task: { id: taskId } as Task,
        project: request.projectContext,
        metadata: { language: request.language, framework: request.framework },
        timestamp: new Date().toISOString(),
      };

      const preHookResults = await executeHooks(request.agentContext.id, 'code_generation', hookContext);
      
      if (preHookResults.some(r => !r.shouldContinue)) {
        throw new Error('Code generation cancelled by pre-hooks');
      }

      // Build context-aware prompt
      const contextPrompt = buildContextPrompt(request);

      const response = await fetch(`${config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: config.streaming,
          messages: [
            {
              role: 'user',
              content: contextPrompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const result = await response.json();
      const generatedCode = extractCodeFromResponse(result.content[0].text);

      // Execute post-generation hooks
      const postHookResults = await executeHooks(
        request.agentContext.id, 
        'post_task', 
        { ...hookContext, previousResults: [generatedCode] }
      );

      // Create code diff
      const codeDiff: CodeDiff = {
        id: taskId,
        projectId: request.projectContext.id,
        agentId: request.agentContext.id,
        filepath: `generated_${Date.now()}.${getFileExtension(request.language)}`,
        oldContent: request.previousCode || '',
        newContent: generatedCode.code,
        timestamp: new Date().toISOString(),
        summary: `Generated ${request.language} code`,
        linesAdded: generatedCode.code.split('\n').length,
        linesRemoved: request.previousCode ? request.previousCode.split('\n').length : 0,
        language: request.language,
      };

      addCodeDiff(codeDiff);

      return {
        ...generatedCode,
        metadata: {
          taskId,
          generationTime: Date.now() - activeTasks.get(taskId)?.startTime,
          preHookResults,
          postHookResults,
        },
      };

    } finally {
      abortControllers.current.delete(taskId);
      setActiveTasks(prev => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
    }
  }, [config, isInitialized, executeHooks, addCodeDiff]);

  // Review code with Claude
  const reviewCode = useCallback(async (request: CodeReviewRequest): Promise<{
    issues: CodeIssue[];
    suggestions: CodeSuggestion[];
    overallScore: number;
    summary: string;
    metadata: Record<string, any>;
  }> => {
    if (!config || !isInitialized) {
      throw new Error('Claude Code not initialized');
    }

    const taskId = `code_review_${Date.now()}`;
    const controller = new AbortController();
    abortControllers.current.set(taskId, controller);

    try {
      const reviewPrompt = buildReviewPrompt(request);

      const response = await fetch(`${config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: 0.1, // Lower temperature for more consistent reviews
          messages: [
            {
              role: 'user',
              content: reviewPrompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const result = await response.json();
      return parseReviewResponse(result.content[0].text);

    } finally {
      abortControllers.current.delete(taskId);
    }
  }, [config, isInitialized]);

  // Register workflow automation
  const registerWorkflow = useCallback((workflow: WorkflowAutomation) => {
    workflows.set(workflow.id, workflow);
    setWorkflows(new Map(workflows));
  }, [workflows]);

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string, triggerContext: any): Promise<void> => {
    const workflow = workflows.get(workflowId);
    if (!workflow || !workflow.enabled) {
      return;
    }

    const taskId = `workflow_${workflowId}_${Date.now()}`;
    
    try {
      setActiveTasks(prev => new Map(prev.set(taskId, { type: 'workflow', workflowId, startTime: Date.now() })));

      for (const step of workflow.steps) {
        await executeWorkflowStep(step, triggerContext);
      }

    } catch (error) {
      console.error(`Workflow ${workflowId} execution failed:`, error);
      
      addNotification({
        id: taskId,
        type: 'error',
        title: 'Workflow Failed',
        message: `Workflow "${workflow.name}" encountered an error`,
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });
      
    } finally {
      setActiveTasks(prev => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
    }
  }, [workflows, addNotification]);

  const executeWorkflowStep = async (step: WorkflowStep, context: any): Promise<void> => {
    // Implementation for different workflow step types
    switch (step.type) {
      case 'code_generation':
        // Trigger code generation
        break;
      case 'code_review':
        // Trigger code review
        break;
      case 'test_generation':
        // Generate tests
        break;
      case 'notification':
        addNotification({
          id: `workflow_${Date.now()}`,
          type: 'info',
          title: step.config.title || 'Workflow Step',
          message: step.config.message || 'Workflow step executed',
          timestamp: new Date().toISOString(),
          priority: step.config.priority || 'medium',
          ttsEnabled: step.config.ttsEnabled || false,
          crossDeviceSync: true,
        });
        break;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
    };
  }, []);

  return {
    // Core methods
    initialize,
    isInitialized,
    config,
    
    // Hook management
    registerHook,
    executeHooks,
    
    // Code generation and review
    generateCode,
    reviewCode,
    
    // Workflow automation
    registerWorkflow,
    executeWorkflow,
    workflows: Array.from(workflows.values()),
    
    // Status
    activeTasks: Array.from(activeTasks.entries()),
    hooks: Array.from(hooks.entries()),
  };
};

// Helper functions
function buildContextPrompt(request: CodeGenerationRequest): string {
  return `
You are an expert ${request.language} developer working on the project "${request.projectContext.name}".

Project Context:
- Description: ${request.projectContext.description}
- Current Status: ${request.projectContext.status}
- Framework: ${request.framework || 'Not specified'}

Agent Context:
- Agent: ${request.agentContext.name} (${request.agentContext.type})
- Capabilities: ${request.agentContext.capabilities.join(', ')}

Task: ${request.prompt}

Requirements:
${request.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

${request.testRequirements ? `
Test Requirements:
${request.testRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}
` : ''}

${request.previousCode ? `
Previous Code:
\`\`\`${request.language}
${request.previousCode}
\`\`\`
` : ''}

Please provide:
1. Clean, production-ready code
2. Clear explanation of the implementation
3. Any necessary tests (if test requirements provided)
4. Brief documentation/comments

Format your response with clear sections and use proper code blocks.
`;
}

function buildReviewPrompt(request: CodeReviewRequest): string {
  return `
Please review the following ${request.language} code for ${request.reviewType} issues:

\`\`\`${request.language}
${request.code}
\`\`\`

Focus on:
- ${request.reviewType === 'security' ? 'Security vulnerabilities, input validation, authentication issues' : ''}
- ${request.reviewType === 'performance' ? 'Performance bottlenecks, memory usage, algorithmic efficiency' : ''}
- ${request.reviewType === 'quality' ? 'Code quality, maintainability, readability, best practices' : ''}
- ${request.reviewType === 'standards' ? 'Coding standards, style guidelines, consistency' : ''}
- ${request.reviewType === 'comprehensive' ? 'All aspects: security, performance, quality, and standards' : ''}

Provide your response in JSON format:
{
  "issues": [{"severity": "high/medium/low", "line": number, "description": "issue description", "category": "category"}],
  "suggestions": [{"line": number, "current": "current code", "suggested": "improved code", "reason": "why this is better"}],
  "overallScore": number_out_of_100,
  "summary": "overall assessment and key recommendations"
}
`;
}

function extractCodeFromResponse(response: string): { code: string; explanation: string; tests?: string; documentation?: string } {
  // Parse the response and extract different sections
  const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
  const code = codeBlocks.length > 0 ? codeBlocks[0]?.replace(/```\w*\n?/, '').replace(/\n?```$/, '') || '' : '';
  
  return {
    code,
    explanation: response.split('```')[0] || response,
    tests: codeBlocks.length > 1 ? codeBlocks[1]?.replace(/```\w*\n?/, '').replace(/\n?```$/, '') || undefined : undefined,
    documentation: response.includes('## Documentation') ? 
      response.split('## Documentation')[1]?.split('##')[0]?.trim() : undefined,
  };
}

function parseReviewResponse(response: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // Fallback to text parsing
    return {
      issues: [],
      suggestions: [],
      overallScore: 75,
      summary: response,
      metadata: { parsedFromText: true },
    };
  }
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    cpp: 'cpp',
    rust: 'rs',
    go: 'go',
  };
  return extensions[language.toLowerCase()] || 'txt';
}

interface CodeIssue {
  severity: 'high' | 'medium' | 'low';
  line: number;
  description: string;
  category: string;
}

interface CodeSuggestion {
  line: number;
  current: string;
  suggested: string;
  reason: string;
}