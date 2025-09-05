/**
 * TMUX Grid Layout Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages the 4-project grid layout within TMUX sessions,
 * handling panel positioning, resizing, and visual organization.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { PanelPosition, AgentActivityStatus, } from './types';
const execAsync = promisify(exec);
/**
 * Grid layout manager for 4-project TMUX sessions
 */
export class GridLayoutManager {
    config;
    layoutCache = new Map();
    constructor(config) {
        this.config = this.mergeDefaultConfig(config);
    }
    // ============================================================================
    // GRID LAYOUT CREATION AND MANAGEMENT
    // ============================================================================
    /**
     * Create 4-project grid layout for session
     */
    async createGridLayout(sessionId, sessionName, panels) {
        try {
            // Get terminal dimensions
            const dimensions = await this.getTerminalDimensions(sessionName);
            // Calculate panel layouts
            const panelLayouts = this.calculatePanelLayouts(panels, dimensions);
            // Apply layout to TMUX
            await this.applyTmuxLayout(sessionName, panelLayouts);
            // Create session grid layout
            const gridLayout = {
                sessionId,
                totalDimensions: dimensions,
                panels: panelLayouts,
                lastUpdated: new Date(),
            };
            // Cache layout
            this.layoutCache.set(sessionId, gridLayout);
            return gridLayout;
        }
        catch (error) {
            throw new Error(`Failed to create grid layout: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update grid layout for session
     */
    async updateGridLayout(sessionId, sessionName, updatedPanels) {
        const existingLayout = this.layoutCache.get(sessionId);
        if (!existingLayout) {
            throw new Error(`No existing layout found for session ${sessionId}`);
        }
        // Update panel layouts with new data
        const updatedPanelLayouts = existingLayout.panels.map((panelLayout, index) => {
            const updatedPanel = updatedPanels[index];
            if (!updatedPanel)
                return panelLayout;
            return {
                ...panelLayout,
                title: this.generatePanelTitle(updatedPanel),
                statusColor: this.getStatusColor(updatedPanel.projectActivity.status),
            };
        });
        // Apply visual updates
        await this.updatePanelVisuals(sessionName, updatedPanelLayouts);
        const updatedLayout = {
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
    async resizeGridLayout(sessionId, sessionName, newDimensions) {
        const existingLayout = this.layoutCache.get(sessionId);
        if (!existingLayout) {
            throw new Error(`No existing layout found for session ${sessionId}`);
        }
        // Recalculate panel layouts with new dimensions
        const resizedPanelLayouts = this.recalculatePanelLayouts(existingLayout.panels, newDimensions);
        // Apply new layout to TMUX
        await this.applyTmuxLayout(sessionName, resizedPanelLayouts);
        const resizedLayout = {
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
    calculatePanelLayouts(panels, totalDimensions) {
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
            this.createPanelLayout(panels[0], { x: panelPadding, y: panelPadding + titleBarHeight }, { width: panelWidth, height: panelHeight }, { top: true, bottom: false, left: true, right: false }),
            // Top-right panel
            this.createPanelLayout(panels[1], { x: panelPadding + panelWidth + borderWidth, y: panelPadding + titleBarHeight }, { width: panelWidth, height: panelHeight }, { top: true, bottom: false, left: false, right: true }),
            // Bottom-left panel
            this.createPanelLayout(panels[2], { x: panelPadding, y: panelPadding + titleBarHeight + panelHeight + borderWidth }, { width: panelWidth, height: panelHeight }, { top: false, bottom: true, left: true, right: false }),
            // Bottom-right panel
            this.createPanelLayout(panels[3], {
                x: panelPadding + panelWidth + borderWidth,
                y: panelPadding + titleBarHeight + panelHeight + borderWidth
            }, { width: panelWidth, height: panelHeight }, { top: false, bottom: true, left: false, right: true }),
        ];
    }
    /**
     * Create individual panel layout
     */
    createPanelLayout(panel, position, dimensions, borders) {
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
    recalculatePanelLayouts(existingLayouts, newDimensions) {
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
        }));
    }
    // ============================================================================
    // TMUX LAYOUT APPLICATION
    // ============================================================================
    /**
     * Apply calculated layout to TMUX session
     */
    async applyTmuxLayout(sessionName, panelLayouts) {
        try {
            // Apply tiled layout as base
            await execAsync(`tmux select-layout -t "${sessionName}" tiled`);
            // Resize each panel to calculated dimensions
            for (let i = 0; i < panelLayouts.length; i++) {
                const layout = panelLayouts[i];
                if (!layout)
                    continue;
                await this.resizePanel(sessionName, i, layout.dimensions);
            }
            // Apply visual styling
            await this.applyPanelStyling(sessionName, panelLayouts);
        }
        catch (error) {
            console.error(`Failed to apply TMUX layout: ${error}`);
            throw error;
        }
    }
    /**
     * Resize individual panel
     */
    async resizePanel(sessionName, panelIndex, dimensions) {
        try {
            // Resize width
            await execAsync(`tmux resize-pane -t "${sessionName}.${panelIndex}" -x ${dimensions.width}`);
            // Resize height
            await execAsync(`tmux resize-pane -t "${sessionName}.${panelIndex}" -y ${dimensions.height}`);
        }
        catch (error) {
            // Ignore resize errors - TMUX may not allow exact dimensions
            console.debug(`Panel resize warning for panel ${panelIndex}: ${error}`);
        }
    }
    /**
     * Apply visual styling to panels
     */
    async applyPanelStyling(sessionName, panelLayouts) {
        for (let i = 0; i < panelLayouts.length; i++) {
            const layout = panelLayouts[i];
            if (!layout)
                continue;
            try {
                // Set panel title
                await execAsync(`tmux select-pane -t "${sessionName}.${i}" -T "${layout.title}"`);
                // Set panel border color based on status
                await execAsync(`tmux select-pane -t "${sessionName}.${i}" -P "${layout.statusColor}"`);
            }
            catch (error) {
                console.debug(`Panel styling warning for panel ${i}: ${error}`);
            }
        }
    }
    /**
     * Update panel visuals without changing layout
     */
    async updatePanelVisuals(sessionName, panelLayouts) {
        for (let i = 0; i < panelLayouts.length; i++) {
            const layout = panelLayouts[i];
            if (!layout)
                continue;
            try {
                // Update title
                await execAsync(`tmux select-pane -t "${sessionName}.${i}" -T "${layout.title}"`);
                // Update border color
                await execAsync(`tmux select-pane -t "${sessionName}.${i}" -P "${layout.statusColor}"`);
            }
            catch (error) {
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
    async getTerminalDimensions(sessionName) {
        try {
            const { stdout: widthOutput } = await execAsync(`tmux display-message -t "${sessionName}" -p "#{client_width}"`);
            const { stdout: heightOutput } = await execAsync(`tmux display-message -t "${sessionName}" -p "#{client_height}"`);
            return {
                width: parseInt(widthOutput.trim(), 10) || 80,
                height: parseInt(heightOutput.trim(), 10) || 24,
            };
        }
        catch (error) {
            // Return default dimensions if unable to get from TMUX
            return { width: 80, height: 24 };
        }
    }
    /**
     * Generate panel title based on project activity
     */
    generatePanelTitle(panel) {
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
    extractProjectName(projectId) {
        // Simple extraction - in real implementation, might lookup from project registry
        const idStr = String(projectId);
        const parts = idStr.split('-');
        return parts[parts.length - 1] || 'Project';
    }
    /**
     * Get status color for panel border
     */
    getStatusColor(status) {
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
    getSessionLayout(sessionId) {
        return this.layoutCache.get(sessionId);
    }
    /**
     * Clear cached layout for session
     */
    clearSessionLayout(sessionId) {
        this.layoutCache.delete(sessionId);
    }
    /**
     * Get all cached layouts
     */
    getAllLayouts() {
        return Array.from(this.layoutCache.values());
    }
    // ============================================================================
    // CONFIGURATION MANAGEMENT
    // ============================================================================
    /**
     * Merge default configuration with provided config
     */
    mergeDefaultConfig(config) {
        const defaultConfig = {
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
    updateConfiguration(newConfig) {
        Object.assign(this.config, newConfig);
        // Invalidate cached layouts to force recalculation
        this.layoutCache.clear();
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    // ============================================================================
    // PANEL FOCUS AND SELECTION
    // ============================================================================
    /**
     * Focus specific panel in session
     */
    async focusPanel(sessionName, position) {
        const panelIndex = this.getPanelIndexFromPosition(position);
        await execAsync(`tmux select-pane -t "${sessionName}.${panelIndex}"`);
    }
    /**
     * Cycle through panels in session
     */
    async cyclePanels(sessionName, direction = 'next') {
        const flag = direction === 'next' ? '-t' : '-t';
        await execAsync(`tmux select-pane ${flag} "${sessionName}"`);
    }
    /**
     * Get panel index from position
     */
    getPanelIndexFromPosition(position) {
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
    clearAllLayouts() {
        this.layoutCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const layouts = Array.from(this.layoutCache.values());
        return {
            totalLayouts: layouts.length,
            oldestLayout: layouts.length > 0 ? new Date(Math.min(...layouts.map(l => l.lastUpdated.getTime()))) : null,
            newestLayout: layouts.length > 0 ? new Date(Math.max(...layouts.map(l => l.lastUpdated.getTime()))) : null,
            memoryUsage: JSON.stringify(layouts).length, // Rough memory usage estimate
        };
    }
}
//# sourceMappingURL=GridLayoutManager.js.map