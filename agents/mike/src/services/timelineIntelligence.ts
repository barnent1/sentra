import { EventEmitter } from 'events';
import { linearRegression, exponentialRegression } from 'regression';
import moment from 'moment-timezone';
import { logger } from '../utils/logger';

export interface TimelineData {
  taskId: string;
  storyPoints: number;
  complexity: string;
  estimatedHours: number;
  actualHours?: number;
  startDate: Date;
  endDate?: Date;
  agentId: string;
  projectType: string;
  teamSize: number;
  dependencies: number;
  blockers: number;
}

export interface TimelinePrediction {
  taskId: string;
  predictedHours: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  riskFactors: string[];
  accuracy: number;
}

export interface ProjectVelocity {
  projectId: string;
  sprintsCompleted: number;
  averageVelocity: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  predictedVelocity: number;
  lastUpdated: Date;
}

export class TimelineIntelligence extends EventEmitter {
  private historicalData: Map<string, TimelineData[]> = new Map();
  private velocityData: Map<string, ProjectVelocity> = new Map();
  private learningModels: Map<string, any> = new Map();
  private predictionAccuracy: Map<string, number> = new Map();

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Timeline Intelligence system...');

    try {
      // Load historical data from storage
      await this.loadHistoricalData();

      // Build initial prediction models
      await this.buildPredictionModels();

      // Initialize velocity tracking
      await this.initializeVelocityTracking();

      logger.info('Timeline Intelligence system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Timeline Intelligence:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Timeline Intelligence system...');
    
    // Save models and data
    await this.saveModelsAndData();
    
    // Clear memory
    this.historicalData.clear();
    this.velocityData.clear();
    this.learningModels.clear();
    
    logger.info('Timeline Intelligence system shutdown complete');
  }

  async recordActualCompletion(
    taskId: string,
    actualHours: number,
    agentId: string,
    additionalData?: any
  ): Promise<void> {
    try {
      // Find the original timeline data
      for (const [projectId, projectData] of this.historicalData) {
        const task = projectData.find(t => t.taskId === taskId);
        if (task) {
          task.actualHours = actualHours;
          task.endDate = new Date();

          // Calculate accuracy of prediction
          const prediction = task.estimatedHours;
          const accuracy = this.calculateAccuracy(prediction, actualHours);
          this.predictionAccuracy.set(taskId, accuracy);

          // Update models with new data
          await this.updatePredictionModels(projectId, task);

          // Update project velocity
          await this.updateProjectVelocity(projectId, task);

          logger.info('Timeline data recorded successfully', {
            taskId,
            estimatedHours: task.estimatedHours,
            actualHours,
            accuracy,
            agentId,
          });

          // Emit learning event
          this.emit('timelineLearning', {
            taskId,
            prediction,
            actual: actualHours,
            accuracy,
            projectId,
          });

          return;
        }
      }

      logger.warn('Task not found for timeline recording:', { taskId, agentId });
    } catch (error) {
      logger.error('Failed to record actual completion:', { taskId, error });
    }
  }

  async generateTimelineEstimate(stories: any[]): Promise<any> {
    try {
      const estimates = [];
      let totalEstimatedHours = 0;
      let totalStoryPoints = 0;

      for (const story of stories) {
        const prediction = await this.predictStoryCompletion(story);
        estimates.push(prediction);
        totalEstimatedHours += prediction.predictedHours;
        totalStoryPoints += story.storyPoints || 0;
      }

      const timeline = {
        projectId: this.generateProjectId(stories),
        stories: estimates,
        summary: {
          totalStories: stories.length,
          totalStoryPoints,
          totalEstimatedHours,
          estimatedWeeks: Math.ceil(totalEstimatedHours / 40), // Assuming 40-hour work week
          confidenceLevel: this.calculateOverallConfidence(estimates),
        },
        phases: this.generateProjectPhases(estimates),
        milestones: this.generateMilestones(estimates),
        risks: this.identifyTimelineRisks(estimates),
        createdAt: new Date().toISOString(),
      };

      return timeline;
    } catch (error) {
      logger.error('Failed to generate timeline estimate:', error);
      throw error;
    }
  }

  async predictTimelines(
    stories: any[],
    complexityAnalysis: any,
    historicalData: any
  ): Promise<TimelinePrediction[]> {
    const predictions: TimelinePrediction[] = [];

    for (const story of stories) {
      try {
        const prediction = await this.predictStoryCompletion(story, complexityAnalysis, historicalData);
        predictions.push(prediction);
      } catch (error) {
        logger.error('Failed to predict timeline for story:', { storyId: story.id, error });
        
        // Fallback prediction
        predictions.push({
          taskId: story.id,
          predictedHours: story.estimatedHours || 20,
          confidenceInterval: { lower: 16, upper: 24 },
          riskFactors: ['prediction_error'],
          accuracy: 0.5,
        });
      }
    }

    return predictions;
  }

  async getHistoricalCompletionData(stories: any[]): Promise<any> {
    const historicalSummary = {
      totalTasks: 0,
      averageAccuracy: 0,
      commonPatterns: [],
      velocityTrends: [],
    };

    // Aggregate historical data
    let totalAccuracy = 0;
    let taskCount = 0;

    for (const [projectId, projectData] of this.historicalData) {
      for (const task of projectData) {
        if (task.actualHours) {
          const accuracy = this.calculateAccuracy(task.estimatedHours, task.actualHours);
          totalAccuracy += accuracy;
          taskCount++;
        }
      }
    }

    if (taskCount > 0) {
      historicalSummary.averageAccuracy = totalAccuracy / taskCount;
      historicalSummary.totalTasks = taskCount;
    }

    // Identify common patterns
    historicalSummary.commonPatterns = this.identifyHistoricalPatterns();
    
    // Get velocity trends
    historicalSummary.velocityTrends = Array.from(this.velocityData.values());

    return historicalSummary;
  }

  private async predictStoryCompletion(
    story: any,
    complexityAnalysis?: any,
    historicalData?: any
  ): Promise<TimelinePrediction> {
    // Get base estimate
    let baseEstimate = story.estimatedHours || this.calculateBaseEstimate(story);

    // Apply complexity factors
    const complexityFactor = this.calculateComplexityFactor(story, complexityAnalysis);
    baseEstimate *= complexityFactor;

    // Apply historical learning
    const historicalFactor = await this.getHistoricalFactor(story);
    baseEstimate *= historicalFactor;

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(baseEstimate, story);

    // Identify risk factors
    const riskFactors = this.identifyStoryRiskFactors(story);

    // Calculate prediction accuracy based on similar past tasks
    const accuracy = await this.calculatePredictionAccuracy(story);

    return {
      taskId: story.id,
      predictedHours: Math.round(baseEstimate),
      confidenceInterval: {
        lower: Math.round(confidenceInterval.lower),
        upper: Math.round(confidenceInterval.upper),
      },
      riskFactors,
      accuracy,
    };
  }

  private calculateBaseEstimate(story: any): number {
    // Story point to hours conversion
    const storyPointHours: Record<number, number> = {
      1: 4,
      2: 8,
      3: 12,
      5: 20,
      8: 32,
      13: 52,
    };

    return storyPointHours[story.storyPoints] || (story.storyPoints * 4);
  }

  private calculateComplexityFactor(story: any, complexityAnalysis?: any): number {
    const complexityMultipliers = {
      'simple': 0.8,
      'moderate': 1.0,
      'complex': 1.5,
      'very_complex': 2.2,
    };

    let baseFactor = complexityMultipliers[story.complexity] || 1.0;

    // Apply additional complexity analysis if available
    if (complexityAnalysis) {
      if (complexityAnalysis.integrationComplexity === 'high') baseFactor *= 1.3;
      if (complexityAnalysis.dataComplexity === 'high') baseFactor *= 1.2;
      if (complexityAnalysis.uiComplexity === 'high') baseFactor *= 1.15;
    }

    return baseFactor;
  }

  private async getHistoricalFactor(story: any): Promise<number> {
    // Find similar stories in historical data
    const similarStories = this.findSimilarStories(story);
    
    if (similarStories.length === 0) return 1.0;

    // Calculate average accuracy of similar stories
    let totalFactor = 0;
    let count = 0;

    for (const similar of similarStories) {
      if (similar.actualHours && similar.estimatedHours) {
        const factor = similar.actualHours / similar.estimatedHours;
        totalFactor += factor;
        count++;
      }
    }

    return count > 0 ? totalFactor / count : 1.0;
  }

  private findSimilarStories(story: any): TimelineData[] {
    const similarStories: TimelineData[] = [];

    for (const [, projectData] of this.historicalData) {
      for (const task of projectData) {
        let similarity = 0;

        // Compare complexity
        if (task.complexity === story.complexity) similarity += 0.3;

        // Compare story points
        if (Math.abs(task.storyPoints - (story.storyPoints || 0)) <= 2) similarity += 0.3;

        // Compare project type (if available)
        if (task.projectType === story.projectType) similarity += 0.2;

        // Compare dependencies
        if (Math.abs(task.dependencies - (story.dependencies?.length || 0)) <= 1) similarity += 0.2;

        if (similarity >= 0.5) {
          similarStories.push(task);
        }
      }
    }

    return similarStories.sort((a, b) => {
      const aAccuracy = this.calculateAccuracy(a.estimatedHours, a.actualHours || a.estimatedHours);
      const bAccuracy = this.calculateAccuracy(b.estimatedHours, b.actualHours || b.estimatedHours);
      return bAccuracy - aAccuracy;
    }).slice(0, 10); // Top 10 most similar and accurate
  }

  private calculateConfidenceInterval(estimate: number, story: any): { lower: number; upper: number } {
    // Base confidence interval is ±20%
    let variability = 0.2;

    // Adjust based on complexity
    const complexityVariability = {
      'simple': 0.1,
      'moderate': 0.15,
      'complex': 0.25,
      'very_complex': 0.4,
    };

    variability = complexityVariability[story.complexity] || 0.2;

    // Adjust based on dependencies
    if (story.dependencies && story.dependencies.length > 3) {
      variability *= 1.3;
    }

    return {
      lower: estimate * (1 - variability),
      upper: estimate * (1 + variability),
    };
  }

  private identifyStoryRiskFactors(story: any): string[] {
    const riskFactors: string[] = [];

    if (story.complexity === 'very_complex') {
      riskFactors.push('high_complexity');
    }

    if (story.dependencies && story.dependencies.length > 3) {
      riskFactors.push('multiple_dependencies');
    }

    if (story.technicalRisk && story.technicalRisk > 7) {
      riskFactors.push('high_technical_risk');
    }

    if (story.tags && story.tags.includes('integration')) {
      riskFactors.push('integration_complexity');
    }

    if (story.tags && story.tags.includes('database')) {
      riskFactors.push('data_migration_risk');
    }

    if (story.acceptanceCriteria && story.acceptanceCriteria.length > 8) {
      riskFactors.push('complex_acceptance_criteria');
    }

    return riskFactors;
  }

  private async calculatePredictionAccuracy(story: any): Promise<number> {
    const similarStories = this.findSimilarStories(story);
    
    if (similarStories.length === 0) return 0.7; // Default accuracy

    let totalAccuracy = 0;
    let count = 0;

    for (const similar of similarStories) {
      if (similar.actualHours) {
        const accuracy = this.calculateAccuracy(similar.estimatedHours, similar.actualHours);
        totalAccuracy += accuracy;
        count++;
      }
    }

    return count > 0 ? totalAccuracy / count : 0.7;
  }

  private calculateAccuracy(estimated: number, actual: number): number {
    if (estimated === 0) return 0;
    const error = Math.abs(estimated - actual) / estimated;
    return Math.max(0, 1 - error);
  }

  private calculateOverallConfidence(predictions: TimelinePrediction[]): number {
    if (predictions.length === 0) return 0.5;

    const totalAccuracy = predictions.reduce((sum, p) => sum + p.accuracy, 0);
    return totalAccuracy / predictions.length;
  }

  private generateProjectPhases(estimates: TimelinePrediction[]): any[] {
    // Simple phase generation - would be more sophisticated in production
    const totalHours = estimates.reduce((sum, e) => sum + e.predictedHours, 0);
    const phases = [
      {
        id: 'planning',
        name: 'Planning & Design',
        estimatedHours: Math.round(totalHours * 0.15),
        startWeek: 1,
        endWeek: 2,
      },
      {
        id: 'development',
        name: 'Development',
        estimatedHours: Math.round(totalHours * 0.65),
        startWeek: 3,
        endWeek: Math.ceil(totalHours * 0.65 / 40) + 2,
      },
      {
        id: 'testing',
        name: 'Testing & QA',
        estimatedHours: Math.round(totalHours * 0.15),
        startWeek: Math.ceil(totalHours * 0.65 / 40) + 3,
        endWeek: Math.ceil(totalHours * 0.8 / 40) + 3,
      },
      {
        id: 'deployment',
        name: 'Deployment & Launch',
        estimatedHours: Math.round(totalHours * 0.05),
        startWeek: Math.ceil(totalHours * 0.8 / 40) + 4,
        endWeek: Math.ceil(totalHours / 40) + 4,
      },
    ];

    return phases;
  }

  private generateMilestones(estimates: TimelinePrediction[]): any[] {
    const totalHours = estimates.reduce((sum, e) => sum + e.predictedHours, 0);
    const startDate = moment();

    return [
      {
        id: 'design_complete',
        title: 'Design Phase Complete',
        targetDate: startDate.clone().add(2, 'weeks').toDate(),
        description: 'All design and planning artifacts completed',
      },
      {
        id: 'mvp_complete',
        title: 'MVP Development Complete',
        targetDate: startDate.clone().add(Math.ceil(totalHours * 0.4 / 40), 'weeks').toDate(),
        description: 'Minimum viable product functionality implemented',
      },
      {
        id: 'feature_complete',
        title: 'Feature Complete',
        targetDate: startDate.clone().add(Math.ceil(totalHours * 0.8 / 40), 'weeks').toDate(),
        description: 'All planned features implemented and tested',
      },
      {
        id: 'production_ready',
        title: 'Production Ready',
        targetDate: startDate.clone().add(Math.ceil(totalHours / 40) + 1, 'weeks').toDate(),
        description: 'Application ready for production deployment',
      },
    ];
  }

  private identifyTimelineRisks(estimates: TimelinePrediction[]): any[] {
    const risks = [];

    // Identify stories with low confidence
    const lowConfidenceStories = estimates.filter(e => e.accuracy < 0.6);
    if (lowConfidenceStories.length > 0) {
      risks.push({
        id: 'low_prediction_confidence',
        title: 'Low Prediction Confidence',
        description: `${lowConfidenceStories.length} stories have low prediction confidence`,
        probability: 0.7,
        impact: 0.6,
      });
    }

    // Identify stories with high risk factors
    const highRiskStories = estimates.filter(e => e.riskFactors.length > 2);
    if (highRiskStories.length > 0) {
      risks.push({
        id: 'high_risk_stories',
        title: 'High Risk Stories',
        description: `${highRiskStories.length} stories have multiple risk factors`,
        probability: 0.6,
        impact: 0.8,
      });
    }

    // Check for dependencies
    const dependentStories = estimates.filter(e => 
      e.riskFactors.includes('multiple_dependencies')
    );
    if (dependentStories.length > 0) {
      risks.push({
        id: 'dependency_risk',
        title: 'Complex Dependencies',
        description: 'Multiple stories have complex dependency chains',
        probability: 0.5,
        impact: 0.7,
      });
    }

    return risks;
  }

  private generateProjectId(stories: any[]): string {
    // Generate a project ID based on story content
    const firstStory = stories[0];
    const projectPrefix = firstStory?.tags?.[0] || 'project';
    return `${projectPrefix}_${Date.now()}`;
  }

  private async updatePredictionModels(projectId: string, completedTask: TimelineData): Promise<void> {
    try {
      // Get project data
      const projectData = this.historicalData.get(projectId) || [];
      
      // Prepare data for regression
      const completedTasks = projectData.filter(t => t.actualHours);
      
      if (completedTasks.length < 3) return; // Need minimum data points

      // Build regression model for story point to hours conversion
      const storyPointData = completedTasks.map(t => [t.storyPoints, t.actualHours!]);
      const storyPointRegression = linearRegression(storyPointData);

      // Store updated model
      this.learningModels.set(`${projectId}_storypoints`, storyPointRegression);

      // Build complexity factor model
      const complexityData = completedTasks.map(t => {
        const complexityScore = this.getComplexityScore(t.complexity);
        return [complexityScore, t.actualHours! / t.estimatedHours];
      });

      if (complexityData.length >= 3) {
        const complexityRegression = linearRegression(complexityData);
        this.learningModels.set(`${projectId}_complexity`, complexityRegression);
      }

      logger.debug('Prediction models updated', { projectId, taskCount: completedTasks.length });
    } catch (error) {
      logger.error('Failed to update prediction models:', { projectId, error });
    }
  }

  private getComplexityScore(complexity: string): number {
    const scores = { 'simple': 1, 'moderate': 2, 'complex': 3, 'very_complex': 4 };
    return scores[complexity] || 2;
  }

  private async updateProjectVelocity(projectId: string, completedTask: TimelineData): Promise<void> {
    try {
      let velocity = this.velocityData.get(projectId);
      
      if (!velocity) {
        velocity = {
          projectId,
          sprintsCompleted: 0,
          averageVelocity: 0,
          velocityTrend: 'stable',
          predictedVelocity: 0,
          lastUpdated: new Date(),
        };
        this.velocityData.set(projectId, velocity);
      }

      // Update velocity calculation
      const projectData = this.historicalData.get(projectId) || [];
      const completedTasks = projectData.filter(t => t.actualHours);
      const totalStoryPoints = completedTasks.reduce((sum, t) => sum + t.storyPoints, 0);
      const uniqueWeeks = new Set(completedTasks.map(t => 
        moment(t.endDate).format('YYYY-WW')
      )).size;

      if (uniqueWeeks > 0) {
        const newVelocity = totalStoryPoints / uniqueWeeks;
        const oldVelocity = velocity.averageVelocity;
        
        // Update average with exponential smoothing
        velocity.averageVelocity = oldVelocity * 0.7 + newVelocity * 0.3;
        
        // Determine trend
        if (Math.abs(newVelocity - oldVelocity) < 0.1) {
          velocity.velocityTrend = 'stable';
        } else if (newVelocity > oldVelocity) {
          velocity.velocityTrend = 'increasing';
        } else {
          velocity.velocityTrend = 'decreasing';
        }

        velocity.predictedVelocity = velocity.averageVelocity;
        velocity.sprintsCompleted = uniqueWeeks;
        velocity.lastUpdated = new Date();
        
        logger.debug('Project velocity updated', { 
          projectId, 
          velocity: velocity.averageVelocity,
          trend: velocity.velocityTrend 
        });
      }
    } catch (error) {
      logger.error('Failed to update project velocity:', { projectId, error });
    }
  }

  private identifyHistoricalPatterns(): string[] {
    const patterns: string[] = [];
    
    // Analyze accuracy patterns
    const accuracies = Array.from(this.predictionAccuracy.values());
    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    
    if (avgAccuracy > 0.8) {
      patterns.push('high_prediction_accuracy');
    } else if (avgAccuracy < 0.6) {
      patterns.push('low_prediction_accuracy');
    }

    // Analyze complexity patterns
    let complexTasksOverrun = 0;
    let totalComplexTasks = 0;

    for (const [, projectData] of this.historicalData) {
      for (const task of projectData) {
        if (task.complexity === 'complex' || task.complexity === 'very_complex') {
          totalComplexTasks++;
          if (task.actualHours && task.actualHours > task.estimatedHours * 1.2) {
            complexTasksOverrun++;
          }
        }
      }
    }

    if (totalComplexTasks > 0 && complexTasksOverrun / totalComplexTasks > 0.6) {
      patterns.push('complex_tasks_often_overrun');
    }

    return patterns;
  }

  private async loadHistoricalData(): Promise<void> {
    // In production, this would load from database
    logger.debug('Loading historical timeline data...');
    
    // Mock some historical data for demonstration
    const mockData: TimelineData[] = [
      {
        taskId: 'task-001',
        storyPoints: 5,
        complexity: 'moderate',
        estimatedHours: 20,
        actualHours: 22,
        startDate: moment().subtract(2, 'weeks').toDate(),
        endDate: moment().subtract(1, 'weeks').toDate(),
        agentId: 'james',
        projectType: 'web_app',
        teamSize: 3,
        dependencies: 1,
        blockers: 0,
      },
      {
        taskId: 'task-002',
        storyPoints: 8,
        complexity: 'complex',
        estimatedHours: 32,
        actualHours: 45,
        startDate: moment().subtract(3, 'weeks').toDate(),
        endDate: moment().subtract(2, 'weeks').toDate(),
        agentId: 'james',
        projectType: 'web_app',
        teamSize: 3,
        dependencies: 2,
        blockers: 1,
      },
    ];

    this.historicalData.set('mock_project', mockData);
  }

  private async buildPredictionModels(): Promise<void> {
    logger.debug('Building initial prediction models...');
    
    // Build models for each project with sufficient data
    for (const [projectId, projectData] of this.historicalData) {
      await this.updatePredictionModels(projectId, projectData[0]);
    }
  }

  private async initializeVelocityTracking(): Promise<void> {
    logger.debug('Initializing velocity tracking...');
    
    // Initialize velocity for existing projects
    for (const [projectId, projectData] of this.historicalData) {
      if (projectData.length > 0) {
        await this.updateProjectVelocity(projectId, projectData[0]);
      }
    }
  }

  private async saveModelsAndData(): Promise<void> {
    logger.debug('Saving timeline intelligence models and data...');
    
    // In production, this would save to persistent storage
    // For now, just log the data that would be saved
    logger.info('Timeline Intelligence data summary:', {
      historicalProjects: this.historicalData.size,
      predictionModels: this.learningModels.size,
      velocityProjects: this.velocityData.size,
      predictionAccuracies: this.predictionAccuracy.size,
    });
  }
}