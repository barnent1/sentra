/**
 * Event Hooks System - Disler-style monitoring hooks for agent activities
 * Following SENTRA project standards: strict TypeScript with branded types
 */
// ============================================================================
// EVENT HOOK MANAGER
// ============================================================================
/**
 * Event hook manager for registering and triggering observability hooks
 */
export class EventHookManager {
    preToolHooks = new Map();
    postToolHooks = new Map();
    decisionHooks = new Map();
    memoryHooks = new Map();
    pulseHooks = new Map();
    defaultConfig = {
        enabled: true,
        async: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
    };
    logger; // TODO: Type when logger is configured
    config;
    constructor(config, logger) {
        this.config = { ...this.defaultConfig, ...config };
        this.logger = logger;
    }
    // ============================================================================
    // HOOK REGISTRATION
    // ============================================================================
    /**
     * Register pre-tool execution hook
     */
    registerPreToolHook(id, handler) {
        this.preToolHooks.set(id, handler);
        this.logger?.debug('Registered pre-tool hook', { hookId: id });
    }
    /**
     * Register post-tool execution hook
     */
    registerPostToolHook(id, handler) {
        this.postToolHooks.set(id, handler);
        this.logger?.debug('Registered post-tool hook', { hookId: id });
    }
    /**
     * Register agent decision hook
     */
    registerDecisionHook(id, handler) {
        this.decisionHooks.set(id, handler);
        this.logger?.debug('Registered decision hook', { hookId: id });
    }
    /**
     * Register memory operation hook
     */
    registerMemoryHook(id, handler) {
        this.memoryHooks.set(id, handler);
        this.logger?.debug('Registered memory hook', { hookId: id });
    }
    /**
     * Register performance pulse hook
     */
    registerPulseHook(id, handler) {
        this.pulseHooks.set(id, handler);
        this.logger?.debug('Registered pulse hook', { hookId: id });
    }
    // ============================================================================
    // HOOK UNREGISTRATION
    // ============================================================================
    /**
     * Unregister hook by ID
     */
    unregisterHook(id) {
        const removed = this.preToolHooks.delete(id) ||
            this.postToolHooks.delete(id) ||
            this.decisionHooks.delete(id) ||
            this.memoryHooks.delete(id) ||
            this.pulseHooks.delete(id);
        if (removed) {
            this.logger?.debug('Unregistered hook', { hookId: id });
        }
        return removed;
    }
    /**
     * Clear all hooks
     */
    clearAllHooks() {
        this.preToolHooks.clear();
        this.postToolHooks.clear();
        this.decisionHooks.clear();
        this.memoryHooks.clear();
        this.pulseHooks.clear();
        this.logger?.debug('Cleared all hooks');
    }
    // ============================================================================
    // HOOK TRIGGERS
    // ============================================================================
    /**
     * Trigger pre-tool hooks
     */
    async triggerPreToolHooks(data) {
        if (!this.config.enabled)
            return;
        await this.executeHooks(this.preToolHooks, data, 'pre-tool');
    }
    /**
     * Trigger post-tool hooks
     */
    async triggerPostToolHooks(data) {
        if (!this.config.enabled)
            return;
        await this.executeHooks(this.postToolHooks, data, 'post-tool');
    }
    /**
     * Trigger decision hooks
     */
    async triggerDecisionHooks(data) {
        if (!this.config.enabled)
            return;
        await this.executeHooks(this.decisionHooks, data, 'decision');
    }
    /**
     * Trigger memory operation hooks
     */
    async triggerMemoryHooks(data) {
        if (!this.config.enabled)
            return;
        await this.executeHooks(this.memoryHooks, data, 'memory');
    }
    /**
     * Trigger performance pulse hooks
     */
    async triggerPulseHooks(data) {
        if (!this.config.enabled)
            return;
        await this.executeHooks(this.pulseHooks, data, 'pulse');
    }
    // ============================================================================
    // HOOK EXECUTION
    // ============================================================================
    /**
     * Execute hooks with error handling and retry logic
     */
    async executeHooks(hooks, data, hookType) {
        if (hooks.size === 0)
            return;
        const executions = Array.from(hooks.entries()).map(([hookId, handler]) => this.executeHookWithRetry(hookId, handler, data, hookType));
        if (this.config.async) {
            // Execute all hooks concurrently
            await Promise.allSettled(executions);
        }
        else {
            // Execute hooks sequentially
            for (const execution of executions) {
                await execution;
            }
        }
    }
    /**
     * Execute a single hook with retry logic
     */
    async executeHookWithRetry(hookId, handler, data, hookType) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Hook execution timeout')), this.config.timeout));
                await Promise.race([
                    Promise.resolve(handler(data)),
                    timeoutPromise,
                ]);
                this.logger?.debug('Hook executed successfully', {
                    hookId,
                    hookType,
                    attempt,
                });
                return; // Success
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.logger?.warn('Hook execution failed', {
                    hookId,
                    hookType,
                    attempt,
                    error: lastError.message,
                });
                if (attempt < this.config.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                }
            }
        }
        // All retries failed
        this.logger?.error('Hook execution failed after all retries', {
            hookId,
            hookType,
            maxRetries: this.config.maxRetries,
            error: lastError?.message,
        });
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Get hook statistics
     */
    getStats() {
        return {
            preToolHooks: this.preToolHooks.size,
            postToolHooks: this.postToolHooks.size,
            decisionHooks: this.decisionHooks.size,
            memoryHooks: this.memoryHooks.size,
            pulseHooks: this.pulseHooks.size,
            totalHooks: this.preToolHooks.size + this.postToolHooks.size +
                this.decisionHooks.size + this.memoryHooks.size +
                this.pulseHooks.size,
            enabled: this.config.enabled,
        };
    }
    /**
     * Enable/disable hooks
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        this.logger?.info('Hook system enabled status changed', { enabled });
    }
}
// ============================================================================
// HOOK DECORATORS AND UTILITIES
// ============================================================================
/**
 * Create a new session ID
 */
export const createSessionId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
};
/**
 * Create a new hook ID
 */
export const createHookId = (name) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${name}_${timestamp}_${random}`;
};
/**
 * Measure function execution time
 */
export const measureExecutionTime = async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
    return { result, duration };
};
/**
 * Memory usage tracker
 */
export const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
    };
};
//# sourceMappingURL=event-hooks.js.map