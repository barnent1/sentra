import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

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

export class StoryManager extends EventEmitter {
  private stories = new Map<string, UserStory>();
  private storyRelationships = new Map<string, string[]>(); // story -> dependent stories

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Story Manager...');
    // Load existing stories from storage
    await this.loadStoriesFromStorage();
    logger.info('Story Manager initialized');
  }

  async createStory(storyData: Partial<UserStory>): Promise<UserStory> {
    const story: UserStory = {
      id: storyData.id || this.generateStoryId(),
      title: storyData.title || 'New Story',
      description: storyData.description || '',
      acceptanceCriteria: storyData.acceptanceCriteria || [],
      storyPoints: storyData.storyPoints || 0,
      priority: storyData.priority || 'medium',
      status: storyData.status || 'backlog',
      dependencies: storyData.dependencies || [],
      estimatedHours: storyData.estimatedHours || 0,
      complexity: storyData.complexity || 'moderate',
      businessValue: storyData.businessValue || 5,
      technicalRisk: storyData.technicalRisk || 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: storyData.tags || [],
      ...storyData,
    };

    this.stories.set(story.id, story);
    this.emit('storyCreated', story);
    
    logger.debug('Story created', { storyId: story.id, title: story.title });
    return story;
  }

  async updateStory(storyId: string, updates: Partial<UserStory>): Promise<UserStory | null> {
    const story = this.stories.get(storyId);
    if (!story) return null;

    const updatedStory = {
      ...story,
      ...updates,
      updatedAt: new Date(),
    };

    this.stories.set(storyId, updatedStory);
    this.emit('storyUpdated', updatedStory, story);

    logger.debug('Story updated', { storyId, updates: Object.keys(updates) });
    return updatedStory;
  }

  async deleteStory(storyId: string): Promise<boolean> {
    const story = this.stories.get(storyId);
    if (!story) return false;

    // Check for dependencies
    const dependentStories = this.findDependentStories(storyId);
    if (dependentStories.length > 0) {
      logger.warn('Cannot delete story with dependencies', { 
        storyId, 
        dependentStories: dependentStories.map(s => s.id) 
      });
      return false;
    }

    this.stories.delete(storyId);
    this.storyRelationships.delete(storyId);
    this.emit('storyDeleted', story);

    logger.debug('Story deleted', { storyId });
    return true;
  }

  getStory(storyId: string): UserStory | null {
    return this.stories.get(storyId) || null;
  }

  getAllStories(): UserStory[] {
    return Array.from(this.stories.values());
  }

  getStoriesByStatus(status: UserStory['status']): UserStory[] {
    return Array.from(this.stories.values()).filter(s => s.status === status);
  }

  getStoriesByPriority(priority: UserStory['priority']): UserStory[] {
    return Array.from(this.stories.values()).filter(s => s.priority === priority);
  }

  getStoriesByEpic(epicId: string): UserStory[] {
    return Array.from(this.stories.values()).filter(s => s.epic === epicId);
  }

  findDependentStories(storyId: string): UserStory[] {
    return Array.from(this.stories.values()).filter(s => 
      s.dependencies.includes(storyId)
    );
  }

  validateStoryDependencies(story: UserStory): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if dependencies exist
    for (const depId of story.dependencies) {
      if (!this.stories.has(depId)) {
        issues.push(`Dependency story ${depId} does not exist`);
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(story.id, story.dependencies)) {
      issues.push('Circular dependency detected');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private hasCircularDependency(storyId: string, dependencies: string[], visited: Set<string> = new Set()): boolean {
    if (visited.has(storyId)) return true;
    
    visited.add(storyId);
    
    for (const depId of dependencies) {
      const depStory = this.stories.get(depId);
      if (depStory && this.hasCircularDependency(depId, depStory.dependencies, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }

  calculateStoryMetrics(): any {
    const stories = Array.from(this.stories.values());
    
    return {
      total: stories.length,
      byStatus: this.groupBy(stories, 'status'),
      byPriority: this.groupBy(stories, 'priority'),
      byComplexity: this.groupBy(stories, 'complexity'),
      totalStoryPoints: stories.reduce((sum, s) => sum + s.storyPoints, 0),
      totalEstimatedHours: stories.reduce((sum, s) => sum + s.estimatedHours, 0),
      averageBusinessValue: stories.reduce((sum, s) => sum + s.businessValue, 0) / stories.length,
      averageTechnicalRisk: stories.reduce((sum, s) => sum + s.technicalRisk, 0) / stories.length,
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private generateStoryId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `story-${timestamp}-${random}`;
  }

  private async loadStoriesFromStorage(): Promise<void> {
    // In production, this would load from database
    logger.debug('Loading stories from storage...');
    // Mock implementation - stories would be loaded from persistent storage
  }
}