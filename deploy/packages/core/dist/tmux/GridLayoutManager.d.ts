/**
 * TMUX Grid Layout Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages the 4-project grid layout within TMUX sessions,
 * handling panel positioning, resizing, and visual organization.
 */
import type { SessionId, PanelId, TMUXPanel, PanelPositionType } from './types';
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
export declare class GridLayoutManager {
    private readonly config;
    private readonly layoutCache;
    constructor(config?: Partial<GridLayoutConfiguration>);
    /**
     * Create 4-project grid layout for session
     */
    createGridLayout(sessionId: SessionId, sessionName: string, panels: readonly [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel]): Promise<SessionGridLayout>;
    /**
     * Update grid layout for session
     */
    updateGridLayout(sessionId: SessionId, sessionName: string, updatedPanels: readonly TMUXPanel[]): Promise<SessionGridLayout>;
    /**
     * Resize grid layout to new dimensions
     */
    resizeGridLayout(sessionId: SessionId, sessionName: string, newDimensions: {
        width: number;
        height: number;
    }): Promise<SessionGridLayout>;
    /**
     * Calculate layout for all 4 panels
     */
    private calculatePanelLayouts;
    /**
     * Create individual panel layout
     */
    private createPanelLayout;
    /**
     * Recalculate panel layouts for new dimensions
     */
    private recalculatePanelLayouts;
    /**
     * Apply calculated layout to TMUX session
     */
    private applyTmuxLayout;
    /**
     * Resize individual panel
     */
    private resizePanel;
    /**
     * Apply visual styling to panels
     */
    private applyPanelStyling;
    /**
     * Update panel visuals without changing layout
     */
    private updatePanelVisuals;
    /**
     * Get terminal dimensions from TMUX
     */
    private getTerminalDimensions;
    /**
     * Generate panel title based on project activity
     */
    private generatePanelTitle;
    /**
     * Extract project name from project ID
     */
    private extractProjectName;
    /**
     * Get status color for panel border
     */
    private getStatusColor;
    /**
     * Get cached layout for session
     */
    getSessionLayout(sessionId: SessionId): SessionGridLayout | undefined;
    /**
     * Clear cached layout for session
     */
    clearSessionLayout(sessionId: SessionId): void;
    /**
     * Get all cached layouts
     */
    getAllLayouts(): readonly SessionGridLayout[];
    /**
     * Merge default configuration with provided config
     */
    private mergeDefaultConfig;
    /**
     * Update layout configuration
     */
    updateConfiguration(newConfig: Partial<GridLayoutConfiguration>): void;
    /**
     * Get current configuration
     */
    getConfiguration(): GridLayoutConfiguration;
    /**
     * Focus specific panel in session
     */
    focusPanel(sessionName: string, position: PanelPositionType): Promise<void>;
    /**
     * Cycle through panels in session
     */
    cyclePanels(sessionName: string, direction?: 'next' | 'prev'): Promise<void>;
    /**
     * Get panel index from position
     */
    private getPanelIndexFromPosition;
    /**
     * Clear all cached layouts
     */
    clearAllLayouts(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        readonly totalLayouts: number;
        readonly oldestLayout: Date | null;
        readonly newestLayout: Date | null;
        readonly memoryUsage: number;
    };
}
//# sourceMappingURL=GridLayoutManager.d.ts.map