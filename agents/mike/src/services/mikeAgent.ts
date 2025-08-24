import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import * as schedule from 'node-schedule';
import { linearRegression } from 'regression';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../utils/config';
import { logger, pmLogger } from '../utils/logger';
import { MessageQueue } from '../utils/messageQueue';
import { ContextClient } from '../utils/contextClient';
import { TimelineIntelligence } from './timelineIntelligence';
import { ClientCommunication } from './clientCommunication';
import { StoryManager } from './storyManager';

export interface Task {
  id: string;
  type: string;
  data: any;
  timeout?: number;
  contextId?: string;
  startedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  progress: number;
  result?: any;
  error?: string;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'ready' | 'in_progress' | 'review' | 'done';
  assignedTo?: string;
  epic?: string;
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  businessValue: number;
  technicalRisk: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  businessGoal: string;
  successCriteria: string[];
  stories: string[];
  estimatedQuarters: number;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  owner: string;
  stakeholders: string[];
  createdAt: Date;
  targetCompletion?: Date;
}

export interface ProjectTimeline {
  projectId: string;
  milestones: Milestone[];
  phases: ProjectPhase[];
  dependencies: TaskDependency[];
  risks: ProjectRisk[];
  estimatedCompletion: Date;
  actualCompletion?: Date;
  confidenceLevel: number;
  lastUpdated: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  dependencies: string[];
  deliverables: string[];
  stakeholders: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'planned' | 'active' | 'completed' | 'delayed';
  tasks: string[];
  resources: string[];
  budget?: number;
}

export interface TaskDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag?: number; // in hours
}

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'business' | 'resource' | 'external';
  probability: number; // 0-1
  impact: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  contingency: string;
  owner: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved' | 'occurred';
}

export interface ClientUpdate {
  id: string;
  projectId: string;
  type: 'status_update' | 'milestone_report' | 'change_request' | 'issue_escalation';
  subject: string;
  content: string;
  recipients: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'read';
  attachments: string[];
}

export class MikeAgent extends EventEmitter {
  private anthropic: Anthropic;
  private activeTasks = new Map<string, Task>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private timelineIntelligence: TimelineIntelligence;
  private clientCommunication: ClientCommunication;
  private storyManager: StoryManager;
  private scheduledJobs = new Map<string, schedule.Job>();

  // In-memory storage (would be database in production)
  private projects = new Map<string, any>();
  private userStories = new Map<string, UserStory>();
  private epics = new Map<string, Epic>();
  private timelines = new Map<string, ProjectTimeline>();
  private clientUpdates = new Map<string, ClientUpdate>();

  constructor() {
    super();

    // Initialize Anthropic AI client with Mike's PM persona
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Mike agent');
    }

    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });

    // Initialize specialized services
    this.timelineIntelligence = new TimelineIntelligence();
    this.clientCommunication = new ClientCommunication(config.email);
    this.storyManager = new StoryManager();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Mike PM Agent with timeline intelligence...');

    try {
      // Setup message handlers for PM-specific tasks
      await this.setupMessageHandlers();

      // Initialize timeline intelligence system
      await this.timelineIntelligence.initialize();

      // Initialize client communication system
      await this.clientCommunication.initialize();

      // Setup automated reporting schedules
      await this.setupAutomatedReporting();

      // Start heartbeat
      this.startHeartbeat();

      logger.info('Mike PM Agent initialized successfully - Ready for project management');
    } catch (error) {
      logger.error('Failed to initialize Mike PM Agent:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Mike PM Agent...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Cancel all scheduled jobs
    for (const [jobId, job] of this.scheduledJobs) {
      job.cancel();
      logger.debug('Cancelled scheduled job:', { jobId });
    }
    this.scheduledJobs.clear();

    // Complete any active tasks
    for (const task of this.activeTasks.values()) {
      if (task.status === 'in_progress') {
        await this.failTask(task.id, new Error('Mike agent shutting down'));
      }
    }

    // Shutdown services
    await this.timelineIntelligence.shutdown();
    await this.clientCommunication.shutdown();

    logger.info('Mike PM Agent shutdown complete');
  }

  private async setupMessageHandlers(): Promise<void> {
    // Subscribe to PM-specific task messages
    await MessageQueue.subscribeToAgentTasks(async (message, routingKey) => {
      try {
        const { messageType, data } = message;
        
        switch (messageType) {
          case 'execute_task':
            await this.handleTaskExecution(data);
            break;
          case 'cancel_task':
            await this.handleTaskCancellation(data);
            break;
          case 'create_stories':
            await this.handleStoryCreationRequest(data);
            break;
          case 'update_timeline':
            await this.handleTimelineUpdateRequest(data);
            break;
          case 'client_communication':
            await this.handleClientCommunicationRequest(data);
            break;
          case 'milestone_check':
            await this.handleMilestoneCheck(data);
            break;
          case 'risk_assessment':
            await this.handleRiskAssessment(data);
            break;
          case 'get_status':
            await this.handleStatusRequest(data);
            break;
          default:
            logger.warn('Unknown message type for Mike PM Agent:', { messageType, routingKey });
        }
      } catch (error) {
        logger.error('Message handler error in Mike PM Agent:', { routingKey, error });
      }
    });

    // Subscribe to inter-agent coordination messages
    await MessageQueue.subscribeToAgentCoordination(async (message, routingKey) => {
      try {
        const { coordinationEvent, data, initiatingAgentId } = message;
        
        switch (coordinationEvent) {
          case 'task_completed':
            await this.handleAgentTaskCompletion(data, initiatingAgentId);
            break;
          case 'quality_gate_blocked':
            await this.handleQualityGateBlock(data, initiatingAgentId);
            break;
          case 'deployment_completed':
            await this.handleDeploymentCompletion(data, initiatingAgentId);
            break;
          default:
            logger.debug('Unknown coordination event for Mike:', { coordinationEvent, initiatingAgentId });
        }
      } catch (error) {
        logger.error('Coordination handler error in Mike PM Agent:', { routingKey, error });
      }
    });

    logger.info('Mike PM Agent message handlers setup complete');
  }

  private async setupAutomatedReporting(): Promise<void> {
    // Daily status updates (weekdays at 9 AM)
    const dailyStatusJob = schedule.scheduleJob('0 9 * * 1-5', async () => {
      try {
        await this.generateDailyStatusUpdates();
      } catch (error) {
        logger.error('Daily status update failed:', error);
      }
    });
    this.scheduledJobs.set('daily_status', dailyStatusJob);

    // Weekly milestone reports (Fridays at 4 PM)
    const weeklyReportJob = schedule.scheduleJob('0 16 * * 5', async () => {
      try {
        await this.generateWeeklyMilestoneReports();
      } catch (error) {
        logger.error('Weekly milestone report failed:', error);
      }
    });
    this.scheduledJobs.set('weekly_milestone', weeklyReportJob);

    // Monthly project health checks (1st of month at 10 AM)
    const monthlyHealthJob = schedule.scheduleJob('0 10 1 * *', async () => {
      try {
        await this.generateMonthlyHealthReports();
      } catch (error) {
        logger.error('Monthly health report failed:', error);
      }
    });
    this.scheduledJobs.set('monthly_health', monthlyHealthJob);

    // Risk assessment reviews (every 3 days at 2 PM)
    const riskReviewJob = schedule.scheduleJob('0 14 */3 * *', async () => {
      try {
        await this.performRiskReviews();
      } catch (error) {
        logger.error('Risk review failed:', error);
      }
    });
    this.scheduledJobs.set('risk_review', riskReviewJob);

    logger.info('Mike PM Agent automated reporting scheduled');
  }

  private async handleTaskExecution(taskData: any): Promise<void> {
    const { taskId, type, data, timeout } = taskData;
    
    try {
      logger.info('Mike starting PM task execution', { taskId, type });

      const task: Task = {
        id: taskId,
        type,
        data,
        timeout: timeout || config.tasks.taskTimeout,
        startedAt: new Date(),
        status: 'in_progress',
        progress: 0,
      };

      this.activeTasks.set(taskId, task);

      // Create PM-specific task context
      const contextId = await ContextClient.createTaskContext(
        taskId, 
        `mike_pm_${type}`, 
        { ...data, pmPersona: 'timeline_focused' }
      );
      task.contextId = contextId;

      // Execute PM task based on type
      const result = await this.executePMTask(task);

      // Complete task with PM insights
      await this.completeTask(taskId, result);

    } catch (error) {
      logger.error('Mike PM task execution failed:', { taskId, error });
      await this.failTask(taskId, error as Error);
    }
  }

  private async executePMTask(task: Task): Promise<any> {
    logger.info('Mike executing PM task', { taskId: task.id, type: task.type });

    try {
      switch (task.type) {
        case 'story_creation':
          return await this.performStoryCreation(task);
        case 'timeline_estimation':
          return await this.performTimelineEstimation(task);
        case 'milestone_planning':
          return await this.performMilestonePlanning(task);
        case 'risk_assessment':
          return await this.performRiskAssessment(task);
        case 'client_communication':
          return await this.performClientCommunication(task);
        case 'project_planning':
          return await this.performProjectPlanning(task);
        case 'resource_allocation':
          return await this.performResourceAllocation(task);
        case 'progress_tracking':
          return await this.performProgressTracking(task);
        case 'stakeholder_management':
          return await this.performStakeholderManagement(task);
        default:
          throw new Error(`Mike doesn't recognize PM task type: ${task.type}`);
      }
    } catch (error) {
      logger.error('Mike PM task execution error:', { taskId: task.id, type: task.type, error });
      throw error;
    }
  }

  private async performStoryCreation(task: Task): Promise<any> {
    const { requirements, projectContext, targetSprint } = task.data;
    
    this.updateTaskProgress(task.id, 10, 'Analyzing project requirements...');

    // Analyze requirements using AI
    const requirementsAnalysis = await this.analyzeRequirementsWithAI(requirements, projectContext);
    
    this.updateTaskProgress(task.id, 30, 'Identifying epics and user stories...');

    // Create epics and break them down into stories
    const epics = await this.createEpicsFromRequirements(requirementsAnalysis);
    const userStories = await this.createUserStoriesFromEpics(epics, projectContext);
    
    this.updateTaskProgress(task.id, 60, 'Estimating story points and complexity...');

    // Estimate and prioritize stories
    const estimatedStories = await this.estimateAndPrioritizeStories(userStories, projectContext);
    
    this.updateTaskProgress(task.id, 80, 'Optimizing story sequence...');

    // Optimize story sequence for development flow
    const optimizedSequence = await this.optimizeStorySequence(estimatedStories);
    
    // Generate timeline estimate
    const timelineEstimate = await this.timelineIntelligence.generateTimelineEstimate(optimizedSequence);
    
    this.updateTaskProgress(task.id, 95, 'Creating comprehensive story documentation...');

    // Store stories and epics
    for (const epic of epics) {
      this.epics.set(epic.id, epic);
    }
    for (const story of estimatedStories) {
      this.userStories.set(story.id, story);
    }

    const result = {
      taskId: task.id,
      projectId: projectContext.projectId,
      epics: epics,
      stories: estimatedStories,
      optimizedSequence: optimizedSequence,
      timelineEstimate: timelineEstimate,
      summary: {
        totalEpics: epics.length,
        totalStories: estimatedStories.length,
        totalStoryPoints: estimatedStories.reduce((sum, story) => sum + story.storyPoints, 0),
        estimatedWeeks: Math.ceil(timelineEstimate.estimatedHours / (40 * projectContext.teamSize || 1)),
        highPriorityStories: estimatedStories.filter(s => s.priority === 'high' || s.priority === 'critical').length,
      },
      createdBy: 'Mike',
      createdAt: new Date().toISOString(),
    };

    // Log PM activity
    pmLogger.storiesCreated(task.id, result.summary.totalStories, result.summary.totalStoryPoints);

    this.updateTaskProgress(task.id, 100, 'Story creation complete');

    return result;
  }

  private async performTimelineEstimation(task: Task): Promise<any> {
    const { stories, projectContext, constraints } = task.data;
    
    this.updateTaskProgress(task.id, 15, 'Analyzing historical data...');

    // Get historical completion data for similar stories
    const historicalData = await this.timelineIntelligence.getHistoricalCompletionData(stories);
    
    this.updateTaskProgress(task.id, 35, 'Calculating complexity factors...');

    // Analyze complexity factors
    const complexityAnalysis = await this.analyzeStoryComplexity(stories, projectContext);
    
    this.updateTaskProgress(task.id, 55, 'Applying machine learning models...');

    // Apply ML models for timeline prediction
    const mlPredictions = await this.timelineIntelligence.predictTimelines(stories, complexityAnalysis, historicalData);
    
    this.updateTaskProgress(task.id, 75, 'Incorporating project constraints...');

    // Apply constraints and risk factors
    const adjustedTimelines = this.applyConstraintsAndRisks(mlPredictions, constraints, projectContext);
    
    this.updateTaskProgress(task.id, 90, 'Generating timeline recommendations...');

    // Generate timeline recommendations
    const timeline = await this.generateTimelineRecommendations(adjustedTimelines, projectContext);
    
    const result = {
      taskId: task.id,
      projectId: projectContext.projectId,
      timeline: timeline,
      predictions: adjustedTimelines,
      confidenceLevel: this.calculateConfidenceLevel(mlPredictions, historicalData),
      risks: await this.identifyTimelineRisks(stories, timeline),
      recommendations: this.generateTimelineRecommendations(adjustedTimelines, projectContext),
      createdBy: 'Mike',
      createdAt: new Date().toISOString(),
    };

    // Store timeline
    this.timelines.set(timeline.projectId, timeline);

    pmLogger.timelineEstimated(task.id, result.timeline.estimatedCompletion, result.confidenceLevel);

    this.updateTaskProgress(task.id, 100, 'Timeline estimation complete');

    return result;
  }

  private async performClientCommunication(task: Task): Promise<any> {
    const { communicationType, recipients, projectId, urgency, customMessage } = task.data;
    
    this.updateTaskProgress(task.id, 20, 'Gathering project status...');

    // Gather current project status
    const projectStatus = await this.gatherProjectStatus(projectId);
    
    this.updateTaskProgress(task.id, 40, 'Generating communication content...');

    let content: string;
    let subject: string;

    switch (communicationType) {
      case 'status_update':
        content = await this.generateStatusUpdate(projectStatus, projectId);
        subject = `Project Status Update - ${projectStatus.projectName}`;
        break;
      case 'milestone_report':
        content = await this.generateMilestoneReport(projectStatus, projectId);
        subject = `Milestone Report - ${projectStatus.projectName}`;
        break;
      case 'change_request':
        content = await this.generateChangeRequestCommunication(projectStatus, customMessage);
        subject = `Change Request Update - ${projectStatus.projectName}`;
        break;
      case 'issue_escalation':
        content = await this.generateIssueEscalation(projectStatus, customMessage);
        subject = `URGENT: Issue Escalation - ${projectStatus.projectName}`;
        break;
      default:
        content = customMessage || 'Project update from Mike PM Agent';
        subject = `Project Update - ${projectStatus.projectName}`;
    }

    this.updateTaskProgress(task.id, 70, 'Sending client communication...');

    // Create and send client update
    const clientUpdate: ClientUpdate = {
      id: uuidv4(),
      projectId,
      type: communicationType,
      subject,
      content,
      recipients: recipients || [],
      priority: this.mapUrgencyToPriority(urgency),
      status: 'draft',
      attachments: [],
    };

    // Send the communication
    const sendResult = await this.clientCommunication.sendUpdate(clientUpdate);
    clientUpdate.status = sendResult.success ? 'sent' : 'draft';
    clientUpdate.sentAt = sendResult.success ? new Date() : undefined;

    // Store the communication
    this.clientUpdates.set(clientUpdate.id, clientUpdate);

    this.updateTaskProgress(task.id, 95, 'Logging communication activity...');

    const result = {
      taskId: task.id,
      communicationId: clientUpdate.id,
      type: communicationType,
      subject,
      recipients: recipients?.length || 0,
      success: sendResult.success,
      sentAt: clientUpdate.sentAt,
      errorMessage: sendResult.error,
      createdBy: 'Mike',
      createdAt: new Date().toISOString(),
    };

    pmLogger.clientCommunicationSent(task.id, communicationType, recipients?.length || 0, sendResult.success);

    this.updateTaskProgress(task.id, 100, 'Client communication complete');

    return result;
  }

  private async analyzeRequirementsWithAI(requirements: string, projectContext: any): Promise<any> {
    const prompt = this.buildRequirementsAnalysisPrompt(requirements, projectContext);
    
    const response = await this.anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const analysisText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    // Parse AI response into structured format
    return this.parseRequirementsAnalysis(analysisText);
  }

  private buildRequirementsAnalysisPrompt(requirements: string, projectContext: any): string {
    return `You are Mike, a senior project manager with 12+ years of experience managing complex software projects. You specialize in breaking down requirements into actionable epics and user stories with precise timeline estimation.

Project Context:
- Project: ${projectContext.projectName || 'Software Development Project'}
- Team Size: ${projectContext.teamSize || 'Unknown'}
- Technology Stack: ${projectContext.techStack?.join(', ') || 'Modern web development'}
- Timeline Constraints: ${projectContext.timelineConstraints || 'Standard development timeline'}
- Budget Constraints: ${projectContext.budgetConstraints || 'Standard budget'}

Requirements to Analyze:
${requirements}

Please perform a comprehensive requirements analysis and provide:

1. **Business Goals Identification**:
   - Primary business objectives
   - Success metrics
   - ROI expectations

2. **Epic Breakdown**:
   - Identify 3-7 major epics
   - Business value for each epic
   - Dependencies between epics
   - Risk assessment for each

3. **Functional Requirements**:
   - Core features required
   - Nice-to-have features
   - Integration requirements
   - Performance requirements

4. **Non-Functional Requirements**:
   - Scalability needs
   - Security requirements
   - Compliance requirements
   - Accessibility requirements

5. **Technical Considerations**:
   - Architecture implications
   - Third-party integrations
   - Data requirements
   - Infrastructure needs

6. **Risk Analysis**:
   - Technical risks
   - Business risks
   - Resource risks
   - Timeline risks

7. **Stakeholder Analysis**:
   - Primary stakeholders
   - Secondary stakeholders
   - Decision makers
   - Communication requirements

Please format your response as structured JSON for easy parsing.`;
  }

  private parseRequirementsAnalysis(analysisText: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(analysisText);
    } catch (error) {
      // Fallback to text parsing
      return {
        businessGoals: this.extractSection(analysisText, 'business goals', 'objectives'),
        epics: this.extractSection(analysisText, 'epics', 'epic'),
        functionalRequirements: this.extractSection(analysisText, 'functional', 'features'),
        nonFunctionalRequirements: this.extractSection(analysisText, 'non-functional', 'performance'),
        technicalConsiderations: this.extractSection(analysisText, 'technical', 'architecture'),
        risks: this.extractSection(analysisText, 'risks', 'risk'),
        stakeholders: this.extractSection(analysisText, 'stakeholder', 'stakeholder'),
      };
    }
  }

  private extractSection(text: string, ...keywords: string[]): string[] {
    const lines = text.split('\n');
    const section: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
          section.push(line.trim().substring(1).trim());
        } else if (line.trim() && !line.includes(':')) {
          section.push(line.trim());
        } else if (line.trim() === '') {
          // Continue in section
        } else {
          // New section started
          inSection = false;
        }
      }
    }
    
    return section;
  }

  private async createEpicsFromRequirements(analysis: any): Promise<Epic[]> {
    const epics: Epic[] = [];
    
    // Extract epics from analysis or create them based on business goals
    const epicData = analysis.epics || analysis.businessGoals || [];
    
    for (let i = 0; i < epicData.length; i++) {
      const epicInfo = typeof epicData[i] === 'string' ? { title: epicData[i] } : epicData[i];
      
      const epic: Epic = {
        id: uuidv4(),
        title: epicInfo.title || `Epic ${i + 1}`,
        description: epicInfo.description || epicInfo.title || `Epic ${i + 1}`,
        businessGoal: epicInfo.businessGoal || 'Enhance product value',
        successCriteria: epicInfo.successCriteria || ['Deliverable completed', 'Quality standards met'],
        stories: [],
        estimatedQuarters: Math.ceil((i + 1) * 0.5), // Rough estimate
        status: 'planning',
        owner: 'Product Owner',
        stakeholders: analysis.stakeholders || ['Product Owner', 'Development Team'],
        createdAt: new Date(),
      };
      
      epics.push(epic);
    }
    
    return epics;
  }

  private async createUserStoriesFromEpics(epics: Epic[], projectContext: any): Promise<UserStory[]> {
    const userStories: UserStory[] = [];
    
    for (const epic of epics) {
      // Generate stories for each epic using AI
      const storyPrompt = this.buildStoryGenerationPrompt(epic, projectContext);
      
      const response = await this.anthropic.messages.create({
        model: config.anthropic.model,
        max_tokens: 3000,
        messages: [{ role: 'user', content: storyPrompt }],
      });

      const storiesText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const parsedStories = this.parseGeneratedStories(storiesText, epic.id);
      
      userStories.push(...parsedStories);
      epic.stories.push(...parsedStories.map(s => s.id));
    }
    
    return userStories;
  }

  private buildStoryGenerationPrompt(epic: Epic, projectContext: any): string {
    return `Generate user stories for the following epic:

Epic: ${epic.title}
Description: ${epic.description}
Business Goal: ${epic.businessGoal}

Project Context:
- Technology: ${projectContext.techStack?.join(', ') || 'Modern web development'}
- Team: ${projectContext.teamSize || 3} developers
- Timeline: ${projectContext.timeline || 'Standard timeline'}

Generate 3-8 user stories that:
1. Follow the format: "As a [user type], I want [functionality] so that [benefit]"
2. Include acceptance criteria (3-5 criteria per story)
3. Are properly sized (can be completed in 1-2 sprints)
4. Have clear business value
5. Are testable and demonstrable

For each story, provide:
- Title
- User story description
- Acceptance criteria
- Complexity estimate (simple/moderate/complex/very_complex)
- Business value (1-10)
- Technical risk (1-10)

Format as structured JSON.`;
  }

  private parseGeneratedStories(storiesText: string, epicId: string): UserStory[] {
    const userStories: UserStory[] = [];
    
    try {
      const parsed = JSON.parse(storiesText);
      
      if (parsed.stories || Array.isArray(parsed)) {
        const stories = parsed.stories || parsed;
        
        for (const storyData of stories) {
          const story: UserStory = {
            id: uuidv4(),
            title: storyData.title || 'User Story',
            description: storyData.description || storyData.userStory || '',
            acceptanceCriteria: storyData.acceptanceCriteria || [],
            storyPoints: this.calculateStoryPoints(storyData.complexity || 'moderate'),
            priority: 'medium',
            status: 'backlog',
            epic: epicId,
            dependencies: [],
            estimatedHours: this.estimateHours(storyData.complexity || 'moderate'),
            complexity: storyData.complexity || 'moderate',
            businessValue: storyData.businessValue || 5,
            technicalRisk: storyData.technicalRisk || 3,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: this.generateStoryTags(storyData.title, storyData.description),
          };
          
          userStories.push(story);
        }
      }
    } catch (error) {
      logger.error('Failed to parse generated stories, creating default stories:', error);
      
      // Create a default story if parsing fails
      const story: UserStory = {
        id: uuidv4(),
        title: 'Epic Implementation Story',
        description: `Implement functionality for epic: ${epicId}`,
        acceptanceCriteria: ['Functionality implemented', 'Tests passing', 'Code reviewed'],
        storyPoints: 5,
        priority: 'medium',
        status: 'backlog',
        epic: epicId,
        dependencies: [],
        estimatedHours: 20,
        complexity: 'moderate',
        businessValue: 5,
        technicalRisk: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['epic-implementation'],
      };
      
      userStories.push(story);
    }
    
    return userStories;
  }

  private calculateStoryPoints(complexity: string): number {
    const pointsMap = {
      'simple': 2,
      'moderate': 5,
      'complex': 8,
      'very_complex': 13,
    };
    return pointsMap[complexity as keyof typeof pointsMap] || 5;
  }

  private estimateHours(complexity: string): number {
    const hoursMap = {
      'simple': 8,
      'moderate': 20,
      'complex': 40,
      'very_complex': 60,
    };
    return hoursMap[complexity as keyof typeof hoursMap] || 20;
  }

  private generateStoryTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    
    if (text.includes('ui') || text.includes('interface') || text.includes('frontend')) tags.push('ui');
    if (text.includes('api') || text.includes('backend') || text.includes('server')) tags.push('api');
    if (text.includes('database') || text.includes('data')) tags.push('database');
    if (text.includes('auth') || text.includes('login') || text.includes('security')) tags.push('authentication');
    if (text.includes('test') || text.includes('testing')) tags.push('testing');
    if (text.includes('deploy') || text.includes('infrastructure')) tags.push('deployment');
    
    return tags;
  }

  private async estimateAndPrioritizeStories(stories: UserStory[], projectContext: any): Promise<UserStory[]> {
    // Apply business value and risk scoring
    for (const story of stories) {
      // Calculate priority based on business value vs risk
      const priorityScore = story.businessValue - (story.technicalRisk * 0.5);
      
      if (priorityScore >= 8) story.priority = 'critical';
      else if (priorityScore >= 6) story.priority = 'high';
      else if (priorityScore >= 4) story.priority = 'medium';
      else story.priority = 'low';
      
      // Adjust estimates based on team experience and project context
      const experienceFactor = projectContext.teamExperience || 1.0;
      story.estimatedHours = Math.round(story.estimatedHours / experienceFactor);
    }
    
    return stories.sort((a, b) => {
      // Sort by priority first, then by business value
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.businessValue - a.businessValue;
    });
  }

  private async optimizeStorySequence(stories: UserStory[]): Promise<UserStory[]> {
    // Implement dependency-aware story sequencing
    const optimizedSequence: UserStory[] = [];
    const remaining = [...stories];
    const completed = new Set<string>();
    
    while (remaining.length > 0) {
      // Find stories with no remaining dependencies
      const readyStories = remaining.filter(story => 
        story.dependencies.every(dep => completed.has(dep))
      );
      
      if (readyStories.length === 0) {
        // Break potential circular dependencies by taking highest priority story
        const highestPriority = remaining.reduce((prev, current) => 
          this.getPriorityWeight(current.priority) > this.getPriorityWeight(prev.priority) ? current : prev
        );
        readyStories.push(highestPriority);
      }
      
      // Sort ready stories by priority and business value
      readyStories.sort((a, b) => {
        const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return b.businessValue - a.businessValue;
      });
      
      // Take the best story
      const nextStory = readyStories[0];
      optimizedSequence.push(nextStory);
      completed.add(nextStory.id);
      
      // Remove from remaining
      const index = remaining.indexOf(nextStory);
      remaining.splice(index, 1);
    }
    
    return optimizedSequence;
  }

  private getPriorityWeight(priority: string): number {
    const weights = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return weights[priority as keyof typeof weights] || 1;
  }

  // Placeholder methods for other PM functionalities
  private async performMilestonePlanning(task: Task): Promise<any> {
    return { message: 'Milestone planning functionality to be implemented' };
  }

  private async performRiskAssessment(task: Task): Promise<any> {
    return { message: 'Risk assessment functionality to be implemented' };
  }

  private async performProjectPlanning(task: Task): Promise<any> {
    return { message: 'Project planning functionality to be implemented' };
  }

  private async performResourceAllocation(task: Task): Promise<any> {
    return { message: 'Resource allocation functionality to be implemented' };
  }

  private async performProgressTracking(task: Task): Promise<any> {
    return { message: 'Progress tracking functionality to be implemented' };
  }

  private async performStakeholderManagement(task: Task): Promise<any> {
    return { message: 'Stakeholder management functionality to be implemented' };
  }

  // Utility and helper methods
  private updateTaskProgress(taskId: string, progress: number, message?: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      this.activeTasks.set(taskId, task);
    }

    MessageQueue.publishProgressUpdate(taskId, progress, message).catch(error => {
      logger.error('Failed to publish progress update from Mike:', { taskId, error });
    });

    logger.debug('Mike task progress updated', { taskId, progress, message });
  }

  private async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.result = result;
    task.progress = 100;

    if (task.contextId) {
      await ContextClient.completeTaskContext(task.contextId, result);
    }

    await MessageQueue.publishTaskResult(taskId, result, 'completed');

    this.activeTasks.delete(taskId);
    
    logger.info('Mike task completed', { taskId, type: task.type });
  }

  private async failTask(taskId: string, error: Error): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = error.message;

    if (task.contextId) {
      await ContextClient.failTaskContext(task.contextId, error);
    }

    await MessageQueue.publishTaskResult(taskId, { error: error.message }, 'failed');

    this.activeTasks.delete(taskId);
    
    logger.error('Mike task failed', { taskId, type: task.type, error: error.message });
  }

  // Event handlers for inter-agent coordination
  private async handleAgentTaskCompletion(data: any, agentId: string): Promise<void> {
    // Update timeline based on actual completion
    await this.timelineIntelligence.recordActualCompletion(data.taskId, data.actualDuration, agentId);
    pmLogger.taskCompletionRecorded(data.taskId, agentId, data.actualDuration);
  }

  private async handleQualityGateBlock(data: any, agentId: string): Promise<void> {
    // Handle quality gate blocks and update stakeholders
    const impact = await this.assessQualityBlockImpact(data);
    if (impact.requiresClientNotification) {
      await this.notifyStakeholdersOfQualityBlock(data, impact);
    }
    pmLogger.qualityGateBlocked(data.taskId, data.blockedBy, agentId);
  }

  private async handleDeploymentCompletion(data: any, agentId: string): Promise<void> {
    // Update milestone status and notify stakeholders
    await this.updateMilestoneProgress(data.deploymentId, 'completed');
    pmLogger.milestoneCompleted(data.deploymentId, agentId);
  }

  // Automated reporting methods
  private async generateDailyStatusUpdates(): Promise<void> {
    logger.info('Generating daily status updates...');
    
    for (const [projectId, project] of this.projects) {
      try {
        const statusUpdate = await this.gatherProjectStatus(projectId);
        await this.clientCommunication.sendDailyStatusUpdate(projectId, statusUpdate);
      } catch (error) {
        logger.error('Failed to generate daily status for project:', { projectId, error });
      }
    }
  }

  private async generateWeeklyMilestoneReports(): Promise<void> {
    logger.info('Generating weekly milestone reports...');
    // Implementation for weekly reports
  }

  private async generateMonthlyHealthReports(): Promise<void> {
    logger.info('Generating monthly health reports...');
    // Implementation for monthly health reports
  }

  private async performRiskReviews(): Promise<void> {
    logger.info('Performing risk reviews...');
    // Implementation for risk reviews
  }

  // Public API methods for routes
  public getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  public getTask(taskId: string): Task | undefined {
    return this.activeTasks.get(taskId);
  }

  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'in_progress') {
      await this.failTask(taskId, new Error('Task cancelled by user request'));
      return true;
    }
    return false;
  }

  public getProjectStatistics(): any {
    return {
      activeProjects: this.projects.size,
      totalStories: this.userStories.size,
      totalEpics: this.epics.size,
      activeTasks: this.activeTasks.size,
      scheduledReports: this.scheduledJobs.size,
    };
  }

  public getUserStories(projectId?: string): UserStory[] {
    const stories = Array.from(this.userStories.values());
    return projectId ? stories.filter(s => s.epic && this.epics.get(s.epic)?.id === projectId) : stories;
  }

  public getEpics(projectId?: string): Epic[] {
    const epics = Array.from(this.epics.values());
    return projectId ? epics.filter(e => e.id === projectId) : epics;
  }

  public getTimelines(): ProjectTimeline[] {
    return Array.from(this.timelines.values());
  }

  // Message handlers (continued)
  private async handleStoryCreationRequest(data: any): Promise<void> {
    await this.handleTaskExecution({ ...data, type: 'story_creation' });
  }

  private async handleTimelineUpdateRequest(data: any): Promise<void> {
    await this.handleTaskExecution({ ...data, type: 'timeline_estimation' });
  }

  private async handleClientCommunicationRequest(data: any): Promise<void> {
    await this.handleTaskExecution({ ...data, type: 'client_communication' });
  }

  private async handleMilestoneCheck(data: any): Promise<void> {
    // Check milestone progress and send updates
    const milestone = await this.getMilestoneStatus(data.milestoneId);
    if (milestone && milestone.status !== data.expectedStatus) {
      await this.notifyStakeholdersOfMilestoneChange(milestone, data);
    }
  }

  private async handleRiskAssessment(data: any): Promise<void> {
    await this.handleTaskExecution({ ...data, type: 'risk_assessment' });
  }

  private async handleTaskCancellation(data: any): Promise<void> {
    const { taskId } = data;
    const cancelled = await this.cancelTask(taskId);
    logger.info('Mike task cancellation request:', { taskId, cancelled });
  }

  private async handleStatusRequest(data: any): Promise<void> {
    const status = {
      agentId: config.agentId,
      agentName: 'Mike',
      agentType: 'pm',
      specialization: 'project_management_timeline_intelligence',
      activeTasks: Array.from(this.activeTasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        startedAt: task.startedAt,
      })),
      capabilities: [
        'story_creation_and_breakdown',
        'timeline_estimation_and_tracking',
        'client_communication_management',
        'milestone_planning_and_monitoring',
        'risk_assessment_and_mitigation',
        'resource_allocation_optimization',
        'stakeholder_management',
        'automated_reporting',
        'project_health_monitoring'
      ],
      projectStatistics: this.getProjectStatistics(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    logger.info('Mike status requested', status);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await MessageQueue.sendHeartbeat({
          agentType: 'pm',
          agentName: 'Mike',
          specialization: 'timeline_intelligence',
          activeTasks: this.activeTasks.size,
          activeProjects: this.projects.size,
          lastActivity: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Mike heartbeat failed:', error);
      }
    }, config.health.heartbeatInterval);

    logger.info('Mike heartbeat started');
  }

  // Placeholder implementations for missing methods
  private async analyzeStoryComplexity(stories: any[], projectContext: any): Promise<any> {
    return { averageComplexity: 'moderate', factors: [] };
  }

  private applyConstraintsAndRisks(predictions: any, constraints: any, projectContext: any): any {
    return predictions;
  }

  private generateTimelineRecommendations(timelines: any, projectContext: any): any {
    return { recommendations: [] };
  }

  private calculateConfidenceLevel(predictions: any, historicalData: any): number {
    return 0.8;
  }

  private async identifyTimelineRisks(stories: any[], timeline: any): Promise<any[]> {
    return [];
  }

  private async gatherProjectStatus(projectId: string): Promise<any> {
    return {
      projectId,
      projectName: `Project ${projectId}`,
      status: 'active',
      completion: 0.5,
    };
  }

  private async generateStatusUpdate(status: any, projectId: string): Promise<string> {
    return `Status update for project ${projectId}`;
  }

  private async generateMilestoneReport(status: any, projectId: string): Promise<string> {
    return `Milestone report for project ${projectId}`;
  }

  private async generateChangeRequestCommunication(status: any, message?: string): Promise<string> {
    return `Change request communication: ${message || 'Update required'}`;
  }

  private async generateIssueEscalation(status: any, message?: string): Promise<string> {
    return `Issue escalation: ${message || 'Urgent attention required'}`;
  }

  private mapUrgencyToPriority(urgency?: string): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'low': 'low',
      'normal': 'medium',
      'high': 'high',
      'urgent': 'urgent',
      'critical': 'urgent',
    };
    return mapping[urgency || 'normal'] || 'medium';
  }

  private async assessQualityBlockImpact(data: any): Promise<any> {
    return { requiresClientNotification: true };
  }

  private async notifyStakeholdersOfQualityBlock(data: any, impact: any): Promise<void> {
    // Implementation
  }

  private async updateMilestoneProgress(milestoneId: string, status: string): Promise<void> {
    // Implementation
  }

  private async getMilestoneStatus(milestoneId: string): Promise<any> {
    return null;
  }

  private async notifyStakeholdersOfMilestoneChange(milestone: any, data: any): Promise<void> {
    // Implementation
  }
}