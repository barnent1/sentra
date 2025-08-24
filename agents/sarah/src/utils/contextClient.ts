import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import { logger } from './logger';

export interface TaskContext {
  id: string;
  taskId: string;
  taskType: string;
  agentId: string;
  createdAt: string;
  lastModified: string;
  status: 'active' | 'completed' | 'failed';
  data: any;
}

export interface ConversationEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
  filePath?: string;
}

export interface QualityAssessment {
  qualityScore: number;
  approved: boolean;
  issues: any[];
  recommendations: string[];
  timestamp: string;
}

export class ContextClient {
  private static instance: ContextClient;
  private httpClient: AxiosInstance;

  private constructor() {
    this.httpClient = axios.create({
      baseURL: config.contextEngine.url,
      timeout: config.contextEngine.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `sarah-qa-agent/${config.agentId}`,
        'X-Agent-Type': config.agentType,
        'X-Agent-Name': config.agentName,
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        logger.debug('Context Engine request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          agentId: config.agentId,
        });
        return config;
      },
      (error) => {
        logger.error('Context Engine request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug('Context Engine response:', {
          status: response.status,
          url: response.config.url,
          agentId: config.agentId,
        });
        return response;
      },
      (error) => {
        logger.error('Context Engine response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          agentId: config.agentId,
        });
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): ContextClient {
    if (!ContextClient.instance) {
      ContextClient.instance = new ContextClient();
    }
    return ContextClient.instance;
  }

  async createTaskContext(taskId: string, taskType: string, taskData: any): Promise<string> {
    try {
      const response = await this.httpClient.post('/api/context', {
        taskId,
        taskType,
        agentId: config.agentId,
        agentType: config.agentType,
        data: {
          ...taskData,
          reviewerPersona: 'adversarial',
          qualityStandards: config.qualityAssurance,
          sarahSpecializations: [
            'security_vulnerability_detection',
            'typescript_compliance_enforcement', 
            'architecture_pattern_validation',
            'performance_bottleneck_identification',
            'code_complexity_analysis'
          ]
        },
      });

      const contextId = response.data.contextId;
      
      // Add initial context entry
      await this.addConversationEntry(
        contextId,
        'system',
        `Sarah QA Agent initialized for ${taskType} review. Zero-tolerance quality enforcement active.`
      );

      logger.info('Sarah created task context:', { taskId, contextId, taskType });
      return contextId;
      
    } catch (error) {
      logger.error('Failed to create task context:', { taskId, taskType, error });
      throw new Error(`Context creation failed: ${error}`);
    }
  }

  async addConversationEntry(contextId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/conversation`, {
        role,
        content,
        timestamp: new Date().toISOString(),
        agentId: config.agentId,
        agentType: config.agentType,
      });

      logger.debug('Sarah added conversation entry:', { contextId, role, contentLength: content.length });
      
    } catch (error) {
      logger.error('Failed to add conversation entry:', { contextId, role, error });
      // Don't throw - conversation logging is not critical
    }
  }

  async addCodeSnippet(contextId: string, language: string, code: string, description?: string, filePath?: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/code`, {
        language,
        code,
        description,
        filePath,
        timestamp: new Date().toISOString(),
        agentId: config.agentId,
        reviewedBy: 'sarah',
      });

      logger.debug('Sarah added code snippet:', { contextId, language, filePath, codeLength: code.length });
      
    } catch (error) {
      logger.error('Failed to add code snippet:', { contextId, filePath, error });
    }
  }

  async addQualityAssessment(contextId: string, assessment: QualityAssessment): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/quality`, {
        ...assessment,
        reviewedBy: 'sarah',
        reviewType: 'adversarial',
        agentId: config.agentId,
      });

      logger.info('Sarah added quality assessment:', { 
        contextId, 
        approved: assessment.approved, 
        qualityScore: assessment.qualityScore,
        issueCount: assessment.issues.length 
      });
      
    } catch (error) {
      logger.error('Failed to add quality assessment:', { contextId, error });
    }
  }

  async recordSecurityFindings(contextId: string, vulnerabilities: any[]): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/security`, {
        vulnerabilities,
        scanDate: new Date().toISOString(),
        scannedBy: 'sarah',
        scanType: 'static_analysis',
        agentId: config.agentId,
        criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
        highCount: vulnerabilities.filter(v => v.severity === 'high').length,
      });

      logger.info('Sarah recorded security findings:', { 
        contextId, 
        vulnerabilityCount: vulnerabilities.length,
        criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length
      });
      
    } catch (error) {
      logger.error('Failed to record security findings:', { contextId, error });
    }
  }

  async recordPerformanceAnalysis(contextId: string, analysis: any): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/performance`, {
        ...analysis,
        analyzedBy: 'sarah',
        analysisDate: new Date().toISOString(),
        agentId: config.agentId,
      });

      logger.debug('Sarah recorded performance analysis:', { contextId, performanceScore: analysis.score });
      
    } catch (error) {
      logger.error('Failed to record performance analysis:', { contextId, error });
    }
  }

  async recordArchitectureReview(contextId: string, architectureIssues: any[]): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/architecture`, {
        issues: architectureIssues,
        reviewDate: new Date().toISOString(),
        reviewedBy: 'sarah',
        agentId: config.agentId,
        violationCount: architectureIssues.length,
        criticalViolations: architectureIssues.filter(i => i.severity === 'critical').length,
      });

      logger.info('Sarah recorded architecture review:', { 
        contextId, 
        issueCount: architectureIssues.length,
        criticalViolations: architectureIssues.filter(i => i.severity === 'critical').length
      });
      
    } catch (error) {
      logger.error('Failed to record architecture review:', { contextId, error });
    }
  }

  async trackFileChange(contextId: string, filePath: string, changeType: 'created' | 'modified' | 'deleted', content?: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/file-change`, {
        filePath,
        changeType,
        content,
        timestamp: new Date().toISOString(),
        trackedBy: config.agentId,
      });

      logger.debug('Sarah tracked file change:', { contextId, filePath, changeType });
      
    } catch (error) {
      logger.error('Failed to track file change:', { contextId, filePath, changeType, error });
    }
  }

  async recordDecision(contextId: string, decision: string, reasoning: string, alternatives?: string[]): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/decision`, {
        decision,
        reasoning,
        alternatives: alternatives || [],
        timestamp: new Date().toISOString(),
        decidedBy: config.agentId,
        decisionType: 'quality_assessment',
      });

      logger.debug('Sarah recorded decision:', { contextId, decision });
      
    } catch (error) {
      logger.error('Failed to record decision:', { contextId, decision, error });
    }
  }

  async completeTaskContext(contextId: string, result: any): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/complete`, {
        result,
        completedAt: new Date().toISOString(),
        agentId: config.agentId,
        status: 'completed',
      });

      // Create context snapshot for completed review
      await this.createContextSnapshot(contextId, 'review_completed');

      logger.info('Sarah completed task context:', { contextId, approved: result.approved });
      
    } catch (error) {
      logger.error('Failed to complete task context:', { contextId, error });
    }
  }

  async failTaskContext(contextId: string, error: Error): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/fail`, {
        error: {
          message: error.message,
          stack: error.stack,
        },
        failedAt: new Date().toISOString(),
        agentId: config.agentId,
        status: 'failed',
      });

      logger.error('Sarah failed task context:', { contextId, error: error.message });
      
    } catch (contextError) {
      logger.error('Failed to mark task context as failed:', { contextId, error: contextError });
    }
  }

  async createContextSnapshot(contextId: string, reason: string): Promise<string> {
    try {
      const response = await this.httpClient.post(`/api/context/${contextId}/snapshot`, {
        reason,
        createdBy: config.agentId,
        timestamp: new Date().toISOString(),
      });

      const snapshotId = response.data.snapshotId;
      logger.debug('Sarah created context snapshot:', { contextId, snapshotId, reason });
      return snapshotId;
      
    } catch (error) {
      logger.error('Failed to create context snapshot:', { contextId, reason, error });
      throw error;
    }
  }

  async getTaskContext(contextId: string): Promise<TaskContext> {
    try {
      const response = await this.httpClient.get(`/api/context/${contextId}`);
      return response.data;
      
    } catch (error) {
      logger.error('Failed to get task context:', { contextId, error });
      throw error;
    }
  }

  async searchContextHistory(query: string, contextType?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        query,
        agentId: config.agentId,
        ...(contextType && { contextType }),
      });

      const response = await this.httpClient.get(`/api/context/search?${params}`);
      return response.data.results;
      
    } catch (error) {
      logger.error('Failed to search context history:', { query, error });
      return [];
    }
  }

  async getReviewHistory(filePath?: string, limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        reviewedBy: config.agentId,
        limit: limit.toString(),
        ...(filePath && { filePath }),
      });

      const response = await this.httpClient.get(`/api/context/reviews?${params}`);
      return response.data.reviews;
      
    } catch (error) {
      logger.error('Failed to get review history:', { filePath, error });
      return [];
    }
  }

  async shareContextWithAgent(contextId: string, targetAgentId: string, shareType: 'read' | 'write' = 'read'): Promise<void> {
    try {
      await this.httpClient.post(`/api/context/${contextId}/share`, {
        targetAgentId,
        shareType,
        sharedBy: config.agentId,
        timestamp: new Date().toISOString(),
      });

      logger.debug('Sarah shared context with agent:', { contextId, targetAgentId, shareType });
      
    } catch (error) {
      logger.error('Failed to share context with agent:', { contextId, targetAgentId, error });
      throw error;
    }
  }
}

// Export singleton instance
const contextClientInstance = ContextClient.getInstance();
export { contextClientInstance as ContextClient };