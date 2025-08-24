import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useClaudeCode } from './useClaudeCode';
import { useMCPServer } from './useMCPServer';
import { Project, Agent, Task } from '@/types';

// Extension System Types
export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: ExtensionCategory;
  manifest: ExtensionManifest;
  status: ExtensionStatus;
  config: ExtensionConfig;
  permissions: ExtensionPermission[];
  dependencies: ExtensionDependency[];
  metadata: ExtensionMetadata;
}

export interface ExtensionManifest {
  entry: string;
  commands: ExtensionCommand[];
  hooks: ExtensionHook[];
  panels: ExtensionPanel[];
  tools: ExtensionTool[];
  apis: ExtensionAPI[];
  themes?: ExtensionTheme[];
  languages?: LanguageSupport[];
  contextMenus?: ContextMenuDefinition[];
  keybindings?: KeyBinding[];
}

export interface ExtensionCommand {
  id: string;
  title: string;
  description: string;
  category: string;
  handler: string;
  parameters?: CommandParameter[];
  when?: string; // Conditional expression
  icon?: string;
  shortcut?: string;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'directory' | 'selection';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  pattern?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export interface ExtensionHook {
  event: HookEvent;
  handler: string;
  priority: number;
  conditions?: HookCondition[];
}

export interface HookCondition {
  when: string; // Conditional expression
  context?: Record<string, any>;
}

export type HookEvent =
  | 'extension.activate'
  | 'extension.deactivate'
  | 'project.open'
  | 'project.close'
  | 'agent.start'
  | 'agent.stop'
  | 'task.create'
  | 'task.complete'
  | 'code.generate'
  | 'code.review'
  | 'voice.meeting.start'
  | 'voice.meeting.end'
  | 'notification.create'
  | 'workflow.trigger';

export interface ExtensionPanel {
  id: string;
  title: string;
  icon?: string;
  location: PanelLocation;
  component: string;
  when?: string;
  initialSize?: number;
  resizable: boolean;
}

export type PanelLocation = 'sidebar' | 'bottom' | 'right' | 'modal' | 'overlay';

export interface ExtensionTool {
  id: string;
  name: string;
  description: string;
  category: string;
  handler: string;
  parameters: ToolParameter[];
  returnType: string;
  async: boolean;
  caching: ToolCaching;
}

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  schema?: any;
}

export interface ToolCaching {
  enabled: boolean;
  ttl: number;
  keyGenerator?: string;
}

export interface ExtensionAPI {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  authentication?: 'none' | 'api_key' | 'jwt';
  rateLimit?: RateLimit;
  documentation: APIDocumentation;
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  key: string; // rate limit key strategy
}

export interface APIDocumentation {
  summary: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'body' | 'header';
  type: string;
  required: boolean;
  description: string;
}

export interface APIResponse {
  status: number;
  description: string;
  schema?: any;
}

export interface APIExample {
  name: string;
  request: any;
  response: any;
}

export interface ExtensionTheme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'contrast';
  colors: Record<string, string>;
  css?: string;
}

export interface LanguageSupport {
  id: string;
  name: string;
  extensions: string[];
  syntax: SyntaxDefinition;
  snippets?: CodeSnippet[];
  formatters?: FormatterConfig[];
  linters?: LinterConfig[];
}

export interface SyntaxDefinition {
  keywords: string[];
  operators: string[];
  comments: CommentStyle[];
  strings: StringStyle[];
  numbers: NumberStyle[];
}

export interface CommentStyle {
  type: 'line' | 'block';
  start: string;
  end?: string;
}

export interface StringStyle {
  delimiter: string;
  escape: string;
  multiline: boolean;
}

export interface NumberStyle {
  pattern: string;
  type: 'integer' | 'float' | 'hex' | 'binary' | 'octal';
}

export interface CodeSnippet {
  prefix: string;
  body: string[];
  description: string;
  scope?: string;
}

export interface FormatterConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  options?: Record<string, any>;
}

export interface LinterConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  patterns: LintPattern[];
}

export interface LintPattern {
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ContextMenuDefinition {
  id: string;
  label: string;
  command: string;
  when?: string;
  group?: string;
  order?: number;
}

export interface KeyBinding {
  key: string;
  command: string;
  when?: string;
  args?: any[];
}

export type ExtensionCategory = 
  | 'productivity'
  | 'code-analysis'
  | 'testing'
  | 'deployment'
  | 'ui-enhancement'
  | 'integration'
  | 'language-support'
  | 'theme'
  | 'utility';

export type ExtensionStatus = 
  | 'installed'
  | 'active'
  | 'inactive'
  | 'updating'
  | 'error'
  | 'incompatible';

export interface ExtensionConfig {
  enabled: boolean;
  settings: Record<string, any>;
  autoUpdate: boolean;
  updateChannel: 'stable' | 'beta' | 'alpha';
  permissions: GrantedPermission[];
}

export interface GrantedPermission {
  permission: ExtensionPermission['type'];
  granted: boolean;
  grantedAt: string;
}

export interface ExtensionPermission {
  type: PermissionType;
  description: string;
  required: boolean;
  dangerous: boolean;
}

export type PermissionType =
  | 'file.read'
  | 'file.write'
  | 'network.request'
  | 'system.execute'
  | 'agent.control'
  | 'project.modify'
  | 'voice.access'
  | 'notification.send'
  | 'clipboard.read'
  | 'clipboard.write';

export interface ExtensionDependency {
  id: string;
  version: string;
  optional: boolean;
  reason: string;
}

export interface ExtensionMetadata {
  downloadCount: number;
  rating: number;
  reviews: number;
  lastUpdated: string;
  size: number;
  license: string;
  homepage?: string;
  repository?: string;
  bugs?: string;
  tags: string[];
}

export interface PluginRegistry {
  extensions: Map<string, Extension>;
  activeExtensions: Set<string>;
  loadedModules: Map<string, any>;
  hooks: Map<HookEvent, ExtensionHook[]>;
  commands: Map<string, ExtensionCommand>;
  tools: Map<string, ExtensionTool>;
  apis: Map<string, ExtensionAPI>;
}

export interface ExtensionContext {
  extensionId: string;
  workspaceRoot: string;
  projects: Project[];
  agents: Agent[];
  currentProject?: Project;
  user: UserInfo;
  settings: GlobalSettings;
  apis: ExtensionAPIs;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  preferences: Record<string, any>;
}

export interface GlobalSettings {
  theme: string;
  language: string;
  notifications: NotificationSettings;
  performance: PerformanceSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
}

export interface PerformanceSettings {
  maxMemory: number;
  maxCpu: number;
  backgroundProcessing: boolean;
}

export interface ExtensionAPIs {
  claude: {
    generateCode: (request: any) => Promise<any>;
    reviewCode: (request: any) => Promise<any>;
  };
  mcp: {
    executeRequest: (request: any) => Promise<any>;
  };
  workspace: {
    openFile: (path: string) => Promise<void>;
    createFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    listFiles: (path: string) => Promise<string[]>;
  };
  ui: {
    showMessage: (message: string, type: 'info' | 'warning' | 'error') => void;
    showPanel: (panelId: string) => void;
    hidePanel: (panelId: string) => void;
    registerCommand: (command: ExtensionCommand) => void;
    createStatusBarItem: (text: string, priority?: number) => StatusBarItem;
  };
  agents: {
    getAll: () => Agent[];
    getById: (id: string) => Agent | undefined;
    sendMessage: (agentId: string, message: string) => Promise<void>;
    subscribeToUpdates: (callback: (agent: Agent) => void) => () => void;
  };
  projects: {
    getAll: () => Project[];
    getCurrent: () => Project | undefined;
    create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
    update: (id: string, updates: Partial<Project>) => Promise<Project>;
    delete: (id: string) => Promise<void>;
  };
}

export interface StatusBarItem {
  text: string;
  priority: number;
  command?: string;
  tooltip?: string;
  update: (text: string) => void;
  dispose: () => void;
}

export const useExtensionSystem = () => {
  const [registry, setRegistry] = useState<PluginRegistry>({
    extensions: new Map(),
    activeExtensions: new Set(),
    loadedModules: new Map(),
    hooks: new Map(),
    commands: new Map(),
    tools: new Map(),
    apis: new Map(),
  });
  
  const [context, setContext] = useState<ExtensionContext | null>(null);
  const moduleCache = useRef<Map<string, any>>(new Map());
  const sandboxes = useRef<Map<string, Worker>>(new Map());
  
  const { projects, agents, addNotification, updateAgent } = useDashboardStore();
  const { generateCode, reviewCode } = useClaudeCode();
  const { executeRequest } = useMCPServer();

  // Initialize extension system
  const initialize = useCallback(async () => {
    try {
      // Create extension context
      const extensionContext: ExtensionContext = {
        extensionId: '',
        workspaceRoot: '/workspace',
        projects,
        agents,
        currentProject: projects[0],
        user: {
          id: 'user1',
          name: 'Developer',
          email: 'dev@example.com',
          preferences: {},
        },
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            enabled: true,
            sound: true,
            desktop: true,
            email: false,
          },
          performance: {
            maxMemory: 512,
            maxCpu: 80,
            backgroundProcessing: true,
          },
        },
        apis: {
          claude: {
            generateCode,
            reviewCode,
          },
          mcp: {
            executeRequest,
          },
          workspace: createWorkspaceAPI(),
          ui: createUIAPI(),
          agents: createAgentsAPI(),
          projects: createProjectsAPI(),
        },
      };

      setContext(extensionContext);

      // Load built-in extensions
      await loadBuiltInExtensions();

      // Load installed extensions
      await loadInstalledExtensions();

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Extension System Initialized',
        message: `Loaded ${registry.extensions.size} extensions`,
        timestamp: new Date().toISOString(),
        priority: 'low',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error('Failed to initialize extension system:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Extension System Error',
        message: 'Failed to initialize extension system',
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });
    }
  }, [projects, agents, generateCode, reviewCode, executeRequest, addNotification]);

  // Load built-in extensions
  const loadBuiltInExtensions = useCallback(async () => {
    const builtInExtensions: Extension[] = [
      {
        id: 'sentra.code-intelligence',
        name: 'Code Intelligence',
        version: '1.0.0',
        description: 'Advanced code analysis and suggestions powered by Claude',
        author: 'Sentra Team',
        category: 'code-analysis',
        manifest: {
          entry: 'code-intelligence/index.js',
          commands: [
            {
              id: 'codeIntelligence.analyzeComplexity',
              title: 'Analyze Code Complexity',
              description: 'Analyze code complexity and provide optimization suggestions',
              category: 'Analysis',
              handler: 'analyzeComplexity',
              parameters: [
                {
                  name: 'code',
                  type: 'selection',
                  required: true,
                  description: 'Code to analyze',
                },
              ],
            },
            {
              id: 'codeIntelligence.suggestRefactoring',
              title: 'Suggest Refactoring',
              description: 'Suggest refactoring opportunities',
              category: 'Analysis',
              handler: 'suggestRefactoring',
            },
          ],
          hooks: [
            {
              event: 'code.generate',
              handler: 'onCodeGenerate',
              priority: 10,
            },
          ],
          panels: [
            {
              id: 'codeIntelligence.insights',
              title: 'Code Insights',
              location: 'sidebar',
              component: 'CodeInsightsPanel',
              resizable: true,
            },
          ],
          tools: [
            {
              id: 'complexity-analyzer',
              name: 'Complexity Analyzer',
              description: 'Analyze code complexity metrics',
              category: 'analysis',
              handler: 'analyzeComplexity',
              parameters: [
                {
                  name: 'code',
                  type: 'string',
                  required: true,
                  description: 'Source code to analyze',
                },
              ],
              returnType: 'object',
              async: true,
              caching: {
                enabled: true,
                ttl: 300,
              },
            },
          ],
          apis: [],
        },
        status: 'installed',
        config: {
          enabled: true,
          settings: {},
          autoUpdate: true,
          updateChannel: 'stable',
          permissions: [],
        },
        permissions: [
          {
            type: 'file.read',
            description: 'Read project files for analysis',
            required: true,
            dangerous: false,
          },
        ],
        dependencies: [],
        metadata: {
          downloadCount: 0,
          rating: 5,
          reviews: 0,
          lastUpdated: new Date().toISOString(),
          size: 1024 * 50, // 50KB
          license: 'MIT',
          tags: ['code-analysis', 'ai', 'intelligence'],
        },
      },
      {
        id: 'sentra.test-generator',
        name: 'Test Generator',
        version: '1.0.0',
        description: 'Automatically generate comprehensive test suites',
        author: 'Sentra Team',
        category: 'testing',
        manifest: {
          entry: 'test-generator/index.js',
          commands: [
            {
              id: 'testGenerator.generateTests',
              title: 'Generate Tests',
              description: 'Generate test cases for selected code',
              category: 'Testing',
              handler: 'generateTests',
            },
            {
              id: 'testGenerator.generateMocks',
              title: 'Generate Mocks',
              description: 'Generate mock objects and stubs',
              category: 'Testing',
              handler: 'generateMocks',
            },
          ],
          hooks: [
            {
              event: 'code.generate',
              handler: 'onCodeGenerate',
              priority: 5,
            },
          ],
          panels: [
            {
              id: 'testGenerator.coverage',
              title: 'Test Coverage',
              location: 'bottom',
              component: 'TestCoveragePanel',
              resizable: true,
            },
          ],
          tools: [
            {
              id: 'test-generator',
              name: 'Test Generator',
              description: 'Generate test cases automatically',
              category: 'testing',
              handler: 'generateTests',
              parameters: [
                {
                  name: 'code',
                  type: 'string',
                  required: true,
                  description: 'Code to generate tests for',
                },
                {
                  name: 'framework',
                  type: 'string',
                  required: true,
                  description: 'Testing framework to use',
                },
              ],
              returnType: 'string',
              async: true,
              caching: {
                enabled: true,
                ttl: 600,
              },
            },
          ],
          apis: [],
        },
        status: 'installed',
        config: {
          enabled: true,
          settings: {
            defaultFramework: 'jest',
            coverageThreshold: 90,
          },
          autoUpdate: true,
          updateChannel: 'stable',
          permissions: [],
        },
        permissions: [
          {
            type: 'file.write',
            description: 'Write test files to project',
            required: true,
            dangerous: false,
          },
        ],
        dependencies: [],
        metadata: {
          downloadCount: 0,
          rating: 4.8,
          reviews: 0,
          lastUpdated: new Date().toISOString(),
          size: 1024 * 75, // 75KB
          license: 'MIT',
          tags: ['testing', 'automation', 'ai'],
        },
      },
    ];

    for (const extension of builtInExtensions) {
      await installExtension(extension, false);
    }
  }, []);

  // Load installed extensions from storage
  const loadInstalledExtensions = useCallback(async () => {
    try {
      const response = await fetch('/api/extensions');
      if (response.ok) {
        const installedExtensions = await response.json();
        for (const extension of installedExtensions) {
          await installExtension(extension.id, extension.manifest.version);
        }
      }
    } catch (error) {
      console.error('Failed to load installed extensions:', error);
    }
  }, []);

  // Install extension
  const installExtension = useCallback(async (
    extension: Extension,
    activate: boolean = true
  ): Promise<void> => {
    try {
      // Validate extension
      validateExtension(extension);

      // Check permissions
      for (const permission of extension.permissions) {
        if (permission.required && !hasPermission(permission.type)) {
          throw new Error(`Required permission not granted: ${permission.type}`);
        }
      }

      // Install dependencies
      for (const dependency of extension.dependencies) {
        if (!registry.extensions.has(dependency.id)) {
          if (!dependency.optional) {
            throw new Error(`Missing required dependency: ${dependency.id}`);
          }
        }
      }

      // Add to registry
      registry.extensions.set(extension.id, extension);
      
      // Register commands
      for (const command of extension.manifest.commands) {
        registry.commands.set(command.id, command);
      }

      // Register hooks
      for (const hook of extension.manifest.hooks) {
        const eventHooks = registry.hooks.get(hook.event) || [];
        eventHooks.push(hook);
        eventHooks.sort((a, b) => b.priority - a.priority);
        registry.hooks.set(hook.event, eventHooks);
      }

      // Register tools
      for (const tool of extension.manifest.tools) {
        registry.tools.set(tool.id, tool);
      }

      // Register APIs
      for (const api of extension.manifest.apis) {
        registry.apis.set(`${extension.id}:${api.path}`, api);
      }

      setRegistry({ ...registry });

      // Activate if requested
      if (activate) {
        await activateExtension(extension.id);
      }

      addNotification({
        id: `extension_${extension.id}`,
        type: 'success',
        title: 'Extension Installed',
        message: `${extension.name} has been installed successfully`,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error(`Failed to install extension ${extension.id}:`, error);
      throw error;
    }
  }, [registry, addNotification]);

  // Activate extension
  const activateExtension = useCallback(async (extensionId: string): Promise<void> => {
    const extension = registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    if (registry.activeExtensions.has(extensionId)) {
      return; // Already active
    }

    try {
      // Load extension module
      const module = await loadExtensionModule(extension);
      registry.loadedModules.set(extensionId, module);

      // Call activation hook
      if (module.activate && typeof module.activate === 'function') {
        await module.activate(createExtensionContext(extensionId));
      }

      // Execute activation hooks
      await executeHooks('extension.activate', { extensionId, extension });

      // Mark as active
      registry.activeExtensions.add(extensionId);
      
      // Update extension status
      extension.status = 'active';
      registry.extensions.set(extensionId, extension);

      setRegistry({ ...registry });

      addNotification({
        id: `activate_${extensionId}`,
        type: 'info',
        title: 'Extension Activated',
        message: `${extension.name} is now active`,
        timestamp: new Date().toISOString(),
        priority: 'low',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error(`Failed to activate extension ${extensionId}:`, error);
      extension.status = 'error';
      registry.extensions.set(extensionId, extension);
      setRegistry({ ...registry });
      throw error;
    }
  }, [registry, addNotification]);

  // Deactivate extension
  const deactivateExtension = useCallback(async (extensionId: string): Promise<void> => {
    const extension = registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    if (!registry.activeExtensions.has(extensionId)) {
      return; // Not active
    }

    try {
      // Get extension module
      const module = registry.loadedModules.get(extensionId);

      // Call deactivation hook
      if (module?.deactivate && typeof module.deactivate === 'function') {
        await module.deactivate();
      }

      // Execute deactivation hooks
      await executeHooks('extension.deactivate', { extensionId, extension });

      // Cleanup
      registry.activeExtensions.delete(extensionId);
      registry.loadedModules.delete(extensionId);

      // Dispose sandbox if exists
      const sandbox = sandboxes.current.get(extensionId);
      if (sandbox) {
        sandbox.terminate();
        sandboxes.current.delete(extensionId);
      }

      // Update extension status
      extension.status = 'inactive';
      registry.extensions.set(extensionId, extension);

      setRegistry({ ...registry });

    } catch (error) {
      console.error(`Failed to deactivate extension ${extensionId}:`, error);
      throw error;
    }
  }, [registry]);

  // Execute command
  const executeCommand = useCallback(async (
    commandId: string,
    args?: Record<string, any>
  ): Promise<any> => {
    const command = registry.commands.get(commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    const extensionId = commandId.split('.')[0];
    const extension = registry.extensions.get(extensionId);
    if (!extension || !registry.activeExtensions.has(extensionId)) {
      throw new Error(`Extension ${extensionId} not active`);
    }

    const module = registry.loadedModules.get(extensionId);
    if (!module) {
      throw new Error(`Extension module ${extensionId} not loaded`);
    }

    // Validate parameters
    if (command.parameters) {
      validateCommandParameters(command.parameters, args || {});
    }

    // Execute command handler
    const handlerFunction = module[command.handler];
    if (!handlerFunction || typeof handlerFunction !== 'function') {
      throw new Error(`Command handler ${command.handler} not found in ${extensionId}`);
    }

    return await handlerFunction(args, createExtensionContext(extensionId));
  }, [registry]);

  // Execute hooks
  const executeHooks = useCallback(async (
    event: HookEvent,
    data: any
  ): Promise<any[]> => {
    const hooks = registry.hooks.get(event) || [];
    const results: any[] = [];

    for (const hook of hooks) {
      const extensionId = hook.handler.split('.')[0] || registry.extensions.values().next().value?.id;
      if (!extensionId || !registry.activeExtensions.has(extensionId)) {
        continue;
      }

      // Check conditions
      if (hook.conditions && !evaluateHookConditions(hook.conditions, data)) {
        continue;
      }

      const module = registry.loadedModules.get(extensionId);
      if (!module) {
        continue;
      }

      const handlerFunction = module[hook.handler.split('.').pop() || hook.handler];
      if (handlerFunction && typeof handlerFunction === 'function') {
        try {
          const result = await handlerFunction(data, createExtensionContext(extensionId));
          results.push(result);
        } catch (error) {
          console.error(`Hook ${hook.handler} failed:`, error);
        }
      }
    }

    return results;
  }, [registry]);

  // Helper functions
  const createExtensionContext = (extensionId: string): ExtensionContext => {
    return {
      ...context!,
      extensionId,
    };
  };

  const loadExtensionModule = async (extension: Extension): Promise<any> => {
    // In a real implementation, this would load the actual extension module
    // For now, return a mock module
    return {
      activate: async (ctx: ExtensionContext) => {
        console.log(`Activating extension ${extension.id}`);
      },
      deactivate: async () => {
        console.log(`Deactivating extension ${extension.id}`);
      },
      // Mock handlers for built-in extensions
      analyzeComplexity: async (args: any) => ({
        complexity: 5,
        suggestions: ['Consider breaking down large functions'],
      }),
      suggestRefactoring: async (args: any) => ({
        suggestions: ['Extract method', 'Rename variable'],
      }),
      generateTests: async (args: any) => ({
        tests: 'describe("test", () => { it("should work", () => {}); })',
      }),
    };
  };

  const validateExtension = (extension: Extension): void => {
    if (!extension.id || !extension.name || !extension.version) {
      throw new Error('Extension must have id, name, and version');
    }
    
    if (!extension.manifest || !extension.manifest.entry) {
      throw new Error('Extension must have a valid manifest with entry point');
    }
  };

  const hasPermission = (permission: PermissionType): boolean => {
    // In a real implementation, check user permissions
    return true; // Simplified
  };

  const validateCommandParameters = (
    expected: CommandParameter[],
    provided: Record<string, any>
  ): void => {
    for (const param of expected) {
      if (param.required && !provided.hasOwnProperty(param.name)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }
    }
  };

  const evaluateHookConditions = (
    conditions: HookCondition[],
    data: any
  ): boolean => {
    return conditions.every(condition => {
      // Simplified condition evaluation
      return true;
    });
  };

  // API implementations
  const createWorkspaceAPI = () => ({
    openFile: async (path: string) => {
      console.log(`Opening file: ${path}`);
    },
    createFile: async (path: string, content: string) => {
      console.log(`Creating file: ${path}`);
    },
    readFile: async (path: string): Promise<string> => {
      return ''; // Mock implementation
    },
    writeFile: async (path: string, content: string) => {
      console.log(`Writing file: ${path}`);
    },
    deleteFile: async (path: string) => {
      console.log(`Deleting file: ${path}`);
    },
    listFiles: async (path: string): Promise<string[]> => {
      return []; // Mock implementation
    },
  });

  const createUIAPI = () => ({
    showMessage: (message: string, type: 'info' | 'warning' | 'error') => {
      addNotification({
        id: Date.now().toString(),
        type: type === 'warning' ? 'warning' : type === 'error' ? 'error' : 'info',
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message,
        timestamp: new Date().toISOString(),
        priority: type === 'error' ? 'high' : 'medium',
        ttsEnabled: type === 'error',
        crossDeviceSync: true,
      });
    },
    showPanel: (panelId: string) => {
      console.log(`Showing panel: ${panelId}`);
    },
    hidePanel: (panelId: string) => {
      console.log(`Hiding panel: ${panelId}`);
    },
    registerCommand: (command: ExtensionCommand) => {
      registry.commands.set(command.id, command);
      setRegistry({ ...registry });
    },
    createStatusBarItem: (text: string, priority: number = 0): StatusBarItem => ({
      text,
      priority,
      update: (newText: string) => {
        console.log(`Updating status bar: ${newText}`);
      },
      dispose: () => {
        console.log('Disposing status bar item');
      },
    }),
  });

  const createAgentsAPI = () => ({
    getAll: () => agents,
    getById: (id: string) => agents.find(a => a.id === id),
    sendMessage: async (agentId: string, message: string) => {
      console.log(`Sending message to agent ${agentId}: ${message}`);
    },
    subscribeToUpdates: (callback: (agent: Agent) => void) => {
      // Return unsubscribe function
      return () => {};
    },
  });

  const createProjectsAPI = () => ({
    getAll: () => projects,
    getCurrent: () => projects[0],
    create: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
      const newProject: Project = {
        ...project,
        id: `project_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newProject;
    },
    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
      const project = projects.find(p => p.id === id);
      if (!project) throw new Error('Project not found');
      return { ...project, ...updates, updatedAt: new Date().toISOString() };
    },
    delete: async (id: string) => {
      console.log(`Deleting project: ${id}`);
    },
  });

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // Extension management
    extensions: Array.from(registry.extensions.values()),
    activeExtensions: Array.from(registry.activeExtensions),
    installExtension,
    activateExtension,
    deactivateExtension,
    
    // Command execution
    commands: Array.from(registry.commands.values()),
    executeCommand,
    
    // Hooks
    executeHooks,
    
    // Tools and APIs
    tools: Array.from(registry.tools.values()),
    apis: Array.from(registry.apis.values()),
    
    // Status
    isInitialized: context !== null,
    context,
  };
};