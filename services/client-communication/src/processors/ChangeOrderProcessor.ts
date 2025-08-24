/**
 * Change Order Processor
 * Handles professional change request analysis and processing
 */

import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { ImpactAnalysisService } from '../services/ImpactAnalysisService';
import { TimelineService } from '../services/TimelineService';
import { CostCalculationService } from '../services/CostCalculationService';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

export interface ChangeRequest {
  id?: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  requestedBy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'email' | 'phone' | 'meeting' | 'portal' | 'voice';
  originalScope: string;
  requestedChanges: string;
  businessJustification?: string;
  deadline?: string;
}

export interface ChangeOrderAnalysis {
  changeRequestId: string;
  technicalImpact: TechnicalImpact;
  timelineImpact: TimelineImpact;
  costImpact: CostImpact;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  approvalRequired: boolean;
  stakeholders: string[];
  estimatedEffort: number; // hours
  confidenceLevel: number; // percentage
}

export interface TechnicalImpact {
  affectedComponents: string[];
  newComponents: string[];
  modifiedComponents: string[];
  deletedComponents: string[];
  architecturalChanges: string[];
  dependencyChanges: string[];
  testingImpact: string[];
  deploymentImpact: string[];
}

export interface TimelineImpact {
  originalDeliveryDate: string;
  revisedDeliveryDate: string;
  additionalDays: number;
  criticalPath: string[];
  milestoneAdjustments: MilestoneAdjustment[];
  resourceReallocation: ResourceReallocation[];
}

export interface CostImpact {
  developmentHours: number;
  qaHours: number;
  managementHours: number;
  totalAdditionalHours: number;
  hourlyRate: number;
  totalAdditionalCost: number;
  originalBudget: number;
  revisedBudget: number;
  budgetVariance: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  technicalRisks: string[];
  scheduleRisks: string[];
  budgetRisks: string[];
  qualityRisks: string[];
  mitigationStrategies: string[];
}

interface MilestoneAdjustment {
  milestone: string;
  originalDate: string;
  revisedDate: string;
  impact: string;
}

interface ResourceReallocation {
  resource: string;
  currentAllocation: number;
  revisedAllocation: number;
  justification: string;
}

export class ChangeOrderProcessor {
  private db: DatabaseService;
  private impactAnalysis: ImpactAnalysisService;
  private timelineService: TimelineService;
  private costCalculation: CostCalculationService;
  private openai: OpenAI;

  constructor() {
    this.db = new DatabaseService();
    this.impactAnalysis = new ImpactAnalysisService();
    this.timelineService = new TimelineService();
    this.costCalculation = new CostCalculationService();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Process incoming change request with comprehensive analysis
   */
  async processChangeRequest(request: ChangeRequest): Promise<ChangeOrderAnalysis> {
    try {
      logger.info(`Processing change request: ${request.title}`);

      // Generate unique ID if not provided
      const changeRequestId = request.id || uuidv4();

      // Store the change request
      await this.storeChangeRequest({ ...request, id: changeRequestId });

      // Perform comprehensive impact analysis
      const analysis = await this.performFullAnalysis(changeRequestId, request);

      // Store the analysis results
      await this.storeAnalysis(changeRequestId, analysis);

      // Trigger notifications to stakeholders
      await this.notifyStakeholders(changeRequestId, analysis);

      logger.info(`Change request analysis completed for: ${changeRequestId}`);
      
      return analysis;

    } catch (error) {
      logger.error('Error processing change request:', error);
      throw error;
    }
  }

  /**
   * Store change request in database
   */
  private async storeChangeRequest(request: ChangeRequest): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO change_requests (
          id, project_id, client_id, title, description, requested_by,
          priority, source, original_scope, requested_changes,
          business_justification, deadline, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NOW()
        )
      `, [
        request.id,
        request.projectId,
        request.clientId,
        request.title,
        request.description,
        request.requestedBy,
        request.priority,
        request.source,
        request.originalScope,
        request.requestedChanges,
        request.businessJustification,
        request.deadline
      ]);

      logger.info(`Change request stored: ${request.id}`);

    } catch (error) {
      logger.error('Error storing change request:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive analysis of change request
   */
  private async performFullAnalysis(
    changeRequestId: string, 
    request: ChangeRequest
  ): Promise<ChangeOrderAnalysis> {
    try {
      logger.info(`Performing full analysis for change request: ${changeRequestId}`);

      // Get current project context
      const projectContext = await this.getProjectContext(request.projectId);

      // Analyze technical impact using AI
      const technicalImpact = await this.analyzeTechnicalImpact(request, projectContext);

      // Calculate timeline impact
      const timelineImpact = await this.timelineService.calculateTimelineImpact(
        request.projectId,
        technicalImpact
      );

      // Calculate cost impact
      const costImpact = await this.costCalculation.calculateCostImpact(
        request.projectId,
        technicalImpact,
        timelineImpact
      );

      // Assess risks
      const riskAssessment = await this.assessRisks(
        request,
        technicalImpact,
        timelineImpact,
        costImpact
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        request,
        technicalImpact,
        timelineImpact,
        costImpact,
        riskAssessment
      );

      // Determine approval requirements
      const approvalRequired = this.determineApprovalRequired(
        costImpact,
        timelineImpact,
        riskAssessment
      );

      // Identify stakeholders
      const stakeholders = await this.identifyStakeholders(
        request.projectId,
        technicalImpact,
        costImpact
      );

      // Calculate estimated effort and confidence
      const estimatedEffort = technicalImpact.affectedComponents.length * 8 + 
                             technicalImpact.newComponents.length * 16;
      const confidenceLevel = this.calculateConfidenceLevel(
        technicalImpact,
        projectContext
      );

      return {
        changeRequestId,
        technicalImpact,
        timelineImpact,
        costImpact,
        riskAssessment,
        recommendations,
        approvalRequired,
        stakeholders,
        estimatedEffort,
        confidenceLevel
      };

    } catch (error) {
      logger.error('Error performing full analysis:', error);
      throw error;
    }
  }

  /**
   * Get project context for analysis
   */
  private async getProjectContext(projectId: string): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT 
          p.*,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
          ARRAY_AGG(DISTINCT t.category) as task_categories,
          ARRAY_AGG(DISTINCT a.name) as active_agents
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        LEFT JOIN agents a ON p.id = a.project_id AND a.status = 'active'
        WHERE p.id = $1
        GROUP BY p.id
      `, [projectId]);

      if (result.rows.length === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const project = result.rows[0];

      // Get current tech stack and architecture
      const techStackResult = await this.db.query(`
        SELECT metadata FROM projects WHERE id = $1
      `, [projectId]);

      const techStack = techStackResult.rows[0]?.metadata?.techStack || {};

      return {
        ...project,
        techStack,
        progress: project.total_tasks > 0 
          ? Math.round((project.completed_tasks / project.total_tasks) * 100)
          : 0
      };

    } catch (error) {
      logger.error('Error getting project context:', error);
      throw error;
    }
  }

  /**
   * Analyze technical impact using AI
   */
  private async analyzeTechnicalImpact(
    request: ChangeRequest,
    projectContext: any
  ): Promise<TechnicalImpact> {
    try {
      const prompt = `
Analyze the technical impact of this change request:

CHANGE REQUEST:
Title: ${request.title}
Description: ${request.description}
Original Scope: ${request.originalScope}
Requested Changes: ${request.requestedChanges}

PROJECT CONTEXT:
Name: ${projectContext.name}
Tech Stack: ${JSON.stringify(projectContext.techStack, null, 2)}
Progress: ${projectContext.progress}%
Task Categories: ${projectContext.task_categories?.join(', ') || 'None'}
Active Agents: ${projectContext.active_agents?.join(', ') || 'None'}

Provide detailed technical impact analysis:

{
  "affectedComponents": ["list of existing components that will be modified"],
  "newComponents": ["list of new components that need to be created"],
  "modifiedComponents": ["list of components requiring significant changes"],
  "deletedComponents": ["list of components that will be removed"],
  "architecturalChanges": ["list of architectural or design changes"],
  "dependencyChanges": ["list of dependency or integration changes"],
  "testingImpact": ["list of testing areas affected"],
  "deploymentImpact": ["list of deployment considerations"]
}

Be specific and focus on concrete technical impacts.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "You are an expert software architect analyzing technical impact of change requests. Always return valid JSON with specific, actionable technical details." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);

    } catch (error) {
      logger.error('Error analyzing technical impact:', error);
      
      // Fallback analysis
      return {
        affectedComponents: ['Unknown components'],
        newComponents: ['New features from change request'],
        modifiedComponents: ['Existing features requiring updates'],
        deletedComponents: [],
        architecturalChanges: ['Architecture adjustments may be needed'],
        dependencyChanges: ['Dependencies may need updates'],
        testingImpact: ['Comprehensive testing required'],
        deploymentImpact: ['Deployment process may need adjustments']
      };
    }
  }

  /**
   * Assess risks associated with the change request
   */
  private async assessRisks(
    request: ChangeRequest,
    technicalImpact: TechnicalImpact,
    timelineImpact: TimelineImpact,
    costImpact: CostImpact
  ): Promise<RiskAssessment> {
    try {
      const prompt = `
Assess the risks for this change request:

CHANGE REQUEST: ${request.title}
PRIORITY: ${request.priority}
TIMELINE IMPACT: ${timelineImpact.additionalDays} additional days
COST IMPACT: $${costImpact.totalAdditionalCost} additional cost
TECHNICAL COMPLEXITY: ${technicalImpact.affectedComponents.length} affected components

Provide comprehensive risk assessment:

{
  "overallRisk": "low|medium|high|critical",
  "technicalRisks": ["specific technical risks"],
  "scheduleRisks": ["schedule and timeline risks"],
  "budgetRisks": ["budget and cost risks"],
  "qualityRisks": ["quality and deliverable risks"],
  "mitigationStrategies": ["specific strategies to mitigate identified risks"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "You are an expert project risk analyst. Provide thorough, actionable risk assessments with specific mitigation strategies." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);

    } catch (error) {
      logger.error('Error assessing risks:', error);
      
      // Fallback risk assessment
      return {
        overallRisk: 'medium',
        technicalRisks: ['Implementation complexity', 'Integration challenges'],
        scheduleRisks: ['Potential delays', 'Resource availability'],
        budgetRisks: ['Cost overruns', 'Additional resources needed'],
        qualityRisks: ['Testing coverage', 'Regression issues'],
        mitigationStrategies: [
          'Detailed technical planning',
          'Phased implementation approach',
          'Comprehensive testing strategy',
          'Regular progress reviews'
        ]
      };
    }
  }

  /**
   * Generate recommendations for the change request
   */
  private async generateRecommendations(
    request: ChangeRequest,
    technicalImpact: TechnicalImpact,
    timelineImpact: TimelineImpact,
    costImpact: CostImpact,
    riskAssessment: RiskAssessment
  ): Promise<string[]> {
    try {
      const recommendations = [];

      // Business recommendations
      if (costImpact.budgetVariance > 20) {
        recommendations.push(`Consider phased implementation to manage ${costImpact.budgetVariance}% budget increase`);
      }

      if (timelineImpact.additionalDays > 14) {
        recommendations.push(`Significant timeline impact (${timelineImpact.additionalDays} days) - consider scope reduction`);
      }

      // Technical recommendations
      if (technicalImpact.newComponents.length > 3) {
        recommendations.push('Consider reusing existing components to reduce development effort');
      }

      if (riskAssessment.overallRisk === 'high' || riskAssessment.overallRisk === 'critical') {
        recommendations.push('Recommend prototype/proof of concept before full implementation');
      }

      // Risk-based recommendations
      if (riskAssessment.technicalRisks.length > 3) {
        recommendations.push('Technical review with senior architect recommended');
      }

      // Priority-based recommendations
      if (request.priority === 'critical') {
        recommendations.push('Fast-track approval process due to critical priority');
      } else if (request.priority === 'low') {
        recommendations.push('Consider deferring to next release cycle');
      }

      return recommendations.length > 0 ? recommendations : [
        'Change request appears feasible with manageable risk',
        'Proceed with standard approval process'
      ];

    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return ['Unable to generate recommendations at this time'];
    }
  }

  /**
   * Determine if approval is required
   */
  private determineApprovalRequired(
    costImpact: CostImpact,
    timelineImpact: TimelineImpact,
    riskAssessment: RiskAssessment
  ): boolean {
    // Approval required if:
    // - Budget increase > 10%
    // - Timeline increase > 7 days
    // - Risk level is high or critical
    
    return costImpact.budgetVariance > 10 ||
           timelineImpact.additionalDays > 7 ||
           riskAssessment.overallRisk === 'high' ||
           riskAssessment.overallRisk === 'critical';
  }

  /**
   * Identify stakeholders for approval process
   */
  private async identifyStakeholders(
    projectId: string,
    technicalImpact: TechnicalImpact,
    costImpact: CostImpact
  ): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          pm.role,
          u.email,
          u.full_name
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
        ORDER BY 
          CASE pm.role
            WHEN 'owner' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'developer' THEN 3
            ELSE 4
          END
      `, [projectId]);

      const stakeholders = result.rows.map(row => row.email);

      // Add additional stakeholders based on impact
      if (costImpact.budgetVariance > 25) {
        stakeholders.push('finance@company.com');
      }

      if (technicalImpact.architecturalChanges.length > 0) {
        stakeholders.push('architecture@company.com');
      }

      return stakeholders;

    } catch (error) {
      logger.error('Error identifying stakeholders:', error);
      return ['project-manager@company.com'];
    }
  }

  /**
   * Calculate confidence level of the analysis
   */
  private calculateConfidenceLevel(
    technicalImpact: TechnicalImpact,
    projectContext: any
  ): number {
    let confidence = 85; // Base confidence

    // Adjust based on project maturity
    if (projectContext.progress > 70) {
      confidence += 10; // More mature projects have better estimates
    } else if (projectContext.progress < 30) {
      confidence -= 15; // Less mature projects are harder to estimate
    }

    // Adjust based on technical complexity
    const totalComponents = technicalImpact.affectedComponents.length +
                           technicalImpact.newComponents.length +
                           technicalImpact.modifiedComponents.length;

    if (totalComponents > 10) {
      confidence -= 20; // Complex changes are harder to estimate
    } else if (totalComponents < 3) {
      confidence += 10; // Simple changes are easier to estimate
    }

    // Adjust based on architectural changes
    if (technicalImpact.architecturalChanges.length > 0) {
      confidence -= 15; // Architectural changes add uncertainty
    }

    return Math.max(50, Math.min(95, confidence));
  }

  /**
   * Store analysis results in database
   */
  private async storeAnalysis(
    changeRequestId: string,
    analysis: ChangeOrderAnalysis
  ): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO change_order_analyses (
          id, change_request_id, technical_impact, timeline_impact,
          cost_impact, risk_assessment, recommendations, approval_required,
          stakeholders, estimated_effort, confidence_level, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
      `, [
        changeRequestId,
        JSON.stringify(analysis.technicalImpact),
        JSON.stringify(analysis.timelineImpact),
        JSON.stringify(analysis.costImpact),
        JSON.stringify(analysis.riskAssessment),
        JSON.stringify(analysis.recommendations),
        analysis.approvalRequired,
        JSON.stringify(analysis.stakeholders),
        analysis.estimatedEffort,
        analysis.confidenceLevel
      ]);

      logger.info(`Analysis stored for change request: ${changeRequestId}`);

    } catch (error) {
      logger.error('Error storing analysis:', error);
      throw error;
    }
  }

  /**
   * Notify stakeholders of change request analysis
   */
  private async notifyStakeholders(
    changeRequestId: string,
    analysis: ChangeOrderAnalysis
  ): Promise<void> {
    try {
      logger.info(`Notifying stakeholders for change request: ${changeRequestId}`);
      
      // This would integrate with the email service to send notifications
      // For now, we'll log the notification
      
      logger.info(`Stakeholders to notify: ${analysis.stakeholders.join(', ')}`);
      logger.info(`Approval required: ${analysis.approvalRequired}`);
      
    } catch (error) {
      logger.error('Error notifying stakeholders:', error);
    }
  }
}