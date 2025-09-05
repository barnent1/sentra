/**
 * TMUX Grid Layout Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This class manages the 4-project grid layout within TMUX sessions,
 * handling panel positioning, resizing, and visual organization.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  SessionId,
  PanelId,
  TMUXPanel,
  PanelPositionType,
  AgentActivityStatusType,
} from './types';
import {
  PanelPosition,
  AgentActivityStatus,
} from './types';
import type { ProjectContextId } from '@sentra/types';

const execAsync = promisify(exec);

/**
 * Grid layout configuration for 4-project display
 */
export interface GridLayoutConfiguration {
  readonly panelPadding: number;
  readonly borderWidth: number;
  readonly titleBarHeight: number;
  readonly statusBarHeight: number;
  readonly minimumPanelWidth: number;
  readonly minimumPanelHeight: number;
  readonly resizeIncrements: {
    readonly horizontal: number;
    readonly vertical: number;
  };
  readonly colors: {
    readonly activeBorder: string;
    readonly inactiveBorder: string;
    readonly errorBorder: string;
    readonly successBorder: string;
    readonly workingBorder: string;
  };
}

/**
 * Panel layout dimensions and positioning
 */
export interface PanelLayout {
  readonly panelId: PanelId;
  readonly position: PanelPositionType;
  readonly dimensions: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly borders: {
    readonly top: boolean;
    readonly bottom: boolean;
    readonly left: boolean;
    readonly right: boolean;
  };
  readonly title: string;
  readonly statusColor: string;
}

/**
 * Complete grid layout for a session
 */
export interface SessionGridLayout {
  readonly sessionId: SessionId;
  readonly totalDimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly panels: readonly [PanelLayout, PanelLayout, PanelLayout, PanelLayout];
  readonly lastUpdated: Date;
}

/**
 * Grid layout manager for 4-project TMUX sessions
 */
export class GridLayoutManager {
  private readonly config: GridLayoutConfiguration;
  private readonly layoutCache: Map<SessionId, SessionGridLayout> = new Map();

  constructor(config?: Partial<GridLayoutConfiguration>) {
    this.config = this.mergeDefaultConfig(config);
  }

  // ============================================================================
  // GRID LAYOUT CREATION AND MANAGEMENT
  // ============================================================================

  /**
   * Create 4-project grid layout for session
   */
  async createGridLayout(
    sessionId: SessionId,
    sessionName: string,
    panels: readonly [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel]
  ): Promise<SessionGridLayout> {
    try {
      // Get terminal dimensions
      const dimensions = await this.getTerminalDimensions(sessionName);
      
      // Calculate panel layouts
      const panelLayouts = this.calculatePanelLayouts(panels, dimensions);
      
      // Apply layout to TMUX
      await this.applyTmuxLayout(sessionName, panelLayouts);
      
      // Create session grid layout
      const gridLayout: SessionGridLayout = {
        sessionId,
        totalDimensions: dimensions,
        panels: panelLayouts,
        lastUpdated: new Date(),
      };

      // Cache layout
      this.layoutCache.set(sessionId, gridLayout);

      return gridLayout;
    } catch (error) {
      throw new Error(`Failed to create grid layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update grid layout for session
   */
  async updateGridLayout(
    sessionId: SessionId,
    sessionName: string,
    updatedPanels: readonly TMUXPanel[]
  ): Promise<SessionGridLayout> {
    const existingLayout = this.layoutCache.get(sessionId);
    if (!existingLayout) {
      throw new Error(`No existing layout found for session ${sessionId}`);
    }

    // Update panel layouts with new data
    const updatedPanelLayouts = existingLayout.panels.map((panelLayout, index) => {
      const updatedPanel = updatedPanels[index];
      if (!updatedPanel) return panelLayout;

      return {
        ...panelLayout,
        title: this.generatePanelTitle(updatedPanel),
        statusColor: this.getStatusColor(updatedPanel.projectActivity.status),
      };
    }) as [PanelLayout, PanelLayout, PanelLayout, PanelLayout];

    // Apply visual updates
    await this.updatePanelVisuals(sessionName, updatedPanelLayouts);

    const updatedLayout: SessionGridLayout = {
      ...existingLayout,
      panels: updatedPanelLayouts,
      lastUpdated: new Date(),
    };

    this.layoutCache.set(sessionId, updatedLayout);
    return updatedLayout;
  }

  /**
   * Resize grid layout to new dimensions
   */
  async resizeGridLayout(
    sessionId: SessionId,
    sessionName: string,
    newDimensions: { width: number; height: number }
  ): Promise<SessionGridLayout> {
    const existingLayout = this.layoutCache.get(sessionId);
    if (!existingLayout) {
      throw new Error(`No existing layout found for session ${sessionId}`);
    }

    // Recalculate panel layouts with new dimensions
    const resizedPanelLayouts = this.recalculatePanelLayouts(
      existingLayout.panels,
      newDimensions
    );

    // Apply new layout to TMUX
    await this.applyTmuxLayout(sessionName, resizedPanelLayouts);

    const resizedLayout: SessionGridLayout = {
      ...existingLayout,
      totalDimensions: newDimensions,
      panels: resizedPanelLayouts,
      lastUpdated: new Date(),
    };

    this.layoutCache.set(sessionId, resizedLayout);
    return resizedLayout;
  }

  // ============================================================================
  // PANEL LAYOUT CALCULATIONS
  // ============================================================================

  /**
   * Calculate layout for all 4 panels
   */
  private calculatePanelLayouts(
    panels: readonly [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel],
    totalDimensions: { width: number; height: number }
  ): [PanelLayout, PanelLayout, PanelLayout, PanelLayout] {
    const { width: totalWidth, height: totalHeight } = totalDimensions;
    const { panelPadding, borderWidth, titleBarHeight, statusBarHeight } = this.config;

    // Calculate available space
    const availableWidth = totalWidth - (panelPadding * 3) - (borderWidth * 3);
    const availableHeight = totalHeight - (panelPadding * 3) - (borderWidth * 3) - statusBarHeight;

    // Each panel gets half the available space
    const panelWidth = Math.floor(availableWidth / 2);
    const panelHeight = Math.floor((availableHeight - titleBarHeight) / 2);

    return [
      // Top-left panel
      this.createPanelLayout(
        panels[0],
        { x: panelPadding, y: panelPadding + titleBarHeight },
        { width: panelWidth, height: panelHeight },
        { top: true, bottom: false, left: true, right: false }
      ),
      // Top-right panel
      this.createPanelLayout(
        panels[1],
        { x: panelPadding + panelWidth + borderWidth, y: panelPadding + titleBarHeight },
        { width: panelWidth, height: panelHeight },
        { top: true, bottom: false, left: false, right: true }
      ),
      // Bottom-left panel
      this.createPanelLayout(
        panels[2],
        { x: panelPadding, y: panelPadding + titleBarHeight + panelHeight + borderWidth },
        { width: panelWidth, height: panelHeight },
        { top: false, bottom: true, left: true, right: false }
      ),
      // Bottom-right panel
      this.createPanelLayout(
        panels[3],
        { 
          x: panelPadding + panelWidth + borderWidth, 
          y: panelPadding + titleBarHeight + panelHeight + borderWidth 
        },
        { width: panelWidth, height: panelHeight },
        { top: false, bottom: true, left: false, right: true }
      ),
    ];
  }

  /**
   * Create individual panel layout
   */
  private createPanelLayout(
    panel: TMUXPanel,
    position: { x: number; y: number },
    dimensions: { width: number; height: number },
    borders: { top: boolean; bottom: boolean; left: boolean; right: boolean }
  ): PanelLayout {
    return {
      panelId: panel.id,
      position: panel.position,
      dimensions: {
        ...position,
        ...dimensions,
      },
      borders,
      title: this.generatePanelTitle(panel),
      statusColor: this.getStatusColor(panel.projectActivity.status),
    };
  }

  /**
   * Recalculate panel layouts for new dimensions
   */
  private recalculatePanelLayouts(
    existingLayouts: readonly [PanelLayout, PanelLayout, PanelLayout, PanelLayout],
    newDimensions: { width: number; height: number }
  ): [PanelLayout, PanelLayout, PanelLayout, PanelLayout] {
    const scaleFactorX = newDimensions.width / (existingLayouts[0].dimensions.width + existingLayouts[1].dimensions.width);
    const scaleFactorY = newDimensions.height / (existingLayouts[0].dimensions.height + existingLayouts[2].dimensions.height);

    return existingLayouts.map(layout => ({
      ...layout,
      dimensions: {
        x: Math.floor(layout.dimensions.x * scaleFactorX),
        y: Math.floor(layout.dimensions.y * scaleFactorY),
        width: Math.floor(layout.dimensions.width * scaleFactorX),
        height: Math.floor(layout.dimensions.height * scaleFactorY),
      },
    })) as [PanelLayout, PanelLayout, PanelLayout, PanelLayout];
  }

  // ============================================================================
  // TMUX LAYOUT APPLICATION
  // ============================================================================

  /**
   * Apply calculated layout to TMUX session
   */
  private async applyTmuxLayout(
    sessionName: string,
    panelLayouts: readonly [PanelLayout, PanelLayout, PanelLayout, PanelLayout]
  ): Promise<void> {
    try {
      // Apply tiled layout as base
      await execAsync(`tmux select-layout -t "${sessionName}" tiled`);

      // Resize each panel to calculated dimensions
      for (let i = 0; i < panelLayouts.length; i++) {
        const layout = panelLayouts[i];
        if (!layout) continue;
        await this.resizePanel(sessionName, i, layout.dimensions);
      }

      // Apply visual styling
      await this.applyPanelStyling(sessionName, panelLayouts);

    } catch (error) {
      console.error(`Failed to apply TMUX layout: ${error}`);
      throw error;
    }
  }

  /**
   * Resize individual panel
   */
  private async resizePanel(
    sessionName: string,
    panelIndex: number,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    try {
      // Resize width
      await execAsync(`tmux resize-pane -t "${sessionName}.${panelIndex}" -x ${dimensions.width}`);
      
      // Resize height
      await execAsync(`tmux resize-pane -t "${sessionName}.${panelIndex}" -y ${dimensions.height}`);
    } catch (error) {
      // Ignore resize errors - TMUX may not allow exact dimensions
      console.debug(`Panel resize warning for panel ${panelIndex}: ${error}`);
    }
  }

  /**
   * Apply visual styling to panels
   */
  private async applyPanelStyling(
    sessionName: string,
    panelLayouts: readonly PanelLayout[]
  ): Promise<void> {
    for (let i = 0; i < panelLayouts.length; i++) {
      const layout = panelLayouts[i];
      
      if (!layout) continue;
      
      try {
        // Set panel title
        await execAsync(`tmux select-pane -t "${sessionName}.${i}" -T "${layout.title}"`);
        
        // Set panel border color based on status
        await execAsync(`tmux select-pane -t "${sessionName}.${i}" -P "${layout.statusColor}"`);
      } catch (error) {
        console.debug(`Panel styling warning for panel ${i}: ${error}`);
      }
    }
  }

  /**
   * Update panel visuals without changing layout
   */
  private async updatePanelVisuals(
    sessionName: string,
    panelLayouts: readonly PanelLayout[]
  ): Promise<void> {
    for (let i = 0; i < panelLayouts.length; i++) {
      const layout = panelLayouts[i];
      
      if (!layout) continue;
      
      try {
        // Update title
        await execAsync(`tmux select-pane -t "${sessionName}.${i}" -T "${layout.title}"`);
        
        // Update border color
        await execAsync(`tmux select-pane -t "${sessionName}.${i}" -P "${layout.statusColor}"`);
      } catch (error) {
        console.debug(`Visual update warning for panel ${i}: ${error}`);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get terminal dimensions from TMUX
   */
  private async getTerminalDimensions(sessionName: string): Promise<{ width: number; height: number }> {
    try {
      const { stdout: widthOutput } = await execAsync(`tmux display-message -t "${sessionName}" -p "#{client_width}"`);
      const { stdout: heightOutput } = await execAsync(`tmux display-message -t "${sessionName}" -p "#{client_height}"`);
      
      return {
        width: parseInt(widthOutput.trim(), 10) || 80,
        height: parseInt(heightOutput.trim(), 10) || 24,
      };
    } catch (error) {
      // Return default dimensions if unable to get from TMUX
      return { width: 80, height: 24 };
    }
  }

  /**
   * Generate panel title based on project activity
   */
  private generatePanelTitle(panel: TMUXPanel): string {
    const project = this.extractProjectName(panel.projectActivity.projectId);
    const status = panel.projectActivity.status;
    const progress = panel.projectActivity.progressPercentage;

    if (progress > 0) {
      return `${project} [${status.toUpperCase()}] ${progress}%`;
    }
    
    return `${project} [${status.toUpperCase()}]`;
  }

  /**
   * Extract project name from project ID
   */
  private extractProjectName(projectId: ProjectContextId): string {
    // Simple extraction - in real implementation, might lookup from project registry
    const idStr = String(projectId);
    const parts = idStr.split('-');
    return parts[parts.length - 1] || 'Project';
  }

  /**
   * Get status color for panel border
   */
  private getStatusColor(status: AgentActivityStatusType): string {
    switch (status) {
      case AgentActivityStatus.WORKING:
        return this.config.colors.workingBorder;
      case AgentActivityStatus.ERROR:
        return this.config.colors.errorBorder;
      case AgentActivityStatus.COMPLETED:
        return this.config.colors.successBorder;
      case AgentActivityStatus.IDLE:
      case AgentActivityStatus.WAITING:
      case AgentActivityStatus.BLOCKED:
      default:
        return this.config.colors.inactiveBorder;
    }
  }

  /**
   * Get cached layout for session
   */
  getSessionLayout(sessionId: SessionId): SessionGridLayout | undefined {
    return this.layoutCache.get(sessionId);
  }

  /**
   * Clear cached layout for session
   */
  clearSessionLayout(sessionId: SessionId): void {
    this.layoutCache.delete(sessionId);
  }

  /**
   * Get all cached layouts
   */
  getAllLayouts(): readonly SessionGridLayout[] {
    return Array.from(this.layoutCache.values());
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  /**
   * Merge default configuration with provided config
   */
  private mergeDefaultConfig(config?: Partial<GridLayoutConfiguration>): GridLayoutConfiguration {
    const defaultConfig: GridLayoutConfiguration = {
      panelPadding: 1,
      borderWidth: 1,
      titleBarHeight: 2,
      statusBarHeight: 1,
      minimumPanelWidth: 20,
      minimumPanelHeight: 5,
      resizeIncrements: {
        horizontal: 5,
        vertical: 2,
      },
      colors: {
        activeBorder: 'bright-green',
        inactiveBorder: 'white',
        errorBorder: 'bright-red',
        successBorder: 'bright-cyan',
        workingBorder: 'bright-yellow',
      },
    };

    return { ...defaultConfig, ...config };
  }

  /**
   * Update layout configuration
   */
  updateConfiguration(newConfig: Partial<GridLayoutConfiguration>): void {
    Object.assign(this.config, newConfig);
    
    // Invalidate cached layouts to force recalculation
    this.layoutCache.clear();
  }

  /**
   * Get current configuration
   */
  getConfiguration(): GridLayoutConfiguration {
    return { ...this.config };
  }

  // ============================================================================
  // PANEL FOCUS AND SELECTION
  // ============================================================================

  /**
   * Focus specific panel in session
   */
  async focusPanel(sessionName: string, position: PanelPositionType): Promise<void> {
    const panelIndex = this.getPanelIndexFromPosition(position);
    await execAsync(`tmux select-pane -t "${sessionName}.${panelIndex}"`);
  }

  /**
   * Cycle through panels in session
   */
  async cyclePanels(sessionName: string, direction: 'next' | 'prev' = 'next'): Promise<void> {
    const flag = direction === 'next' ? '-t' : '-t';
    await execAsync(`tmux select-pane ${flag} "${sessionName}"`);
  }

  /**
   * Get panel index from position
   */
  private getPanelIndexFromPosition(position: PanelPositionType): number {
    switch (position) {
      case PanelPosition.TOP_LEFT: return 0;
      case PanelPosition.TOP_RIGHT: return 1;
      case PanelPosition.BOTTOM_LEFT: return 2;
      case PanelPosition.BOTTOM_RIGHT: return 3;
    }
  }

  // ============================================================================
  // CLEANUP AND RESOURCE MANAGEMENT
  // ============================================================================

  /**
   * Clear all cached layouts
   */
  clearAllLayouts(): void {
    this.layoutCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    readonly totalLayouts: number;
    readonly oldestLayout: Date | null;
    readonly newestLayout: Date | null;
    readonly memoryUsage: number;
  } {
    const layouts = Array.from(this.layoutCache.values());
    
    return {
      totalLayouts: layouts.length,
      oldestLayout: layouts.length > 0 ? new Date(Math.min(...layouts.map(l => l.lastUpdated.getTime()))) : null,
      newestLayout: layouts.length > 0 ? new Date(Math.max(...layouts.map(l => l.lastUpdated.getTime()))) : null,
      memoryUsage: JSON.stringify(layouts).length, // Rough memory usage estimate
    };
  }
}