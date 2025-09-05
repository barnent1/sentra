/**
 * WebSocket Bridge for Real-time Evolution Updates
 *
 * This module connects the evolution system to WebSocket streams for real-time
 * updates to dashboard, mobile, and TMUX interfaces.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
export const EvolutionWebSocketMessageType = {
    // DNA Evolution Events
    DNA_CREATED: 'dna_created',
    DNA_EVOLVED: 'dna_evolved',
    DNA_MUTATED: 'dna_mutated',
    PATTERN_LEARNED: 'pattern_learned',
    // Cross-project Learning
    CROSS_PROJECT_PATTERN_IDENTIFIED: 'cross_project_pattern_identified',
    PATTERN_TRANSFER_INITIATED: 'pattern_transfer_initiated',
    PATTERN_TRANSFER_COMPLETED: 'pattern_transfer_completed',
    // Real-time Metrics
    METRICS_UPDATE: 'metrics_update',
    DASHBOARD_UPDATE: 'dashboard_update',
    ALERT_TRIGGERED: 'alert_triggered',
    TREND_DETECTED: 'trend_detected',
    // Agent Updates
    AGENT_DNA_INITIALIZED: 'agent_dna_initialized',
    AGENT_PERFORMANCE_UPDATE: 'agent_performance_update',
    AGENT_EVOLUTION_PROGRESS: 'agent_evolution_progress',
    // System Updates
    SYSTEM_HEALTH_UPDATE: 'system_health_update',
    EVOLUTION_STATISTICS: 'evolution_statistics',
    // Subscription Management
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
    // Error Handling
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
};
// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================
export const EvolutionSubscriptionType = {
    ALL_EVENTS: 'all_events',
    DNA_EVOLUTION: 'dna_evolution',
    CROSS_PROJECT_LEARNING: 'cross_project_learning',
    METRICS_UPDATES: 'metrics_updates',
    ALERTS: 'alerts',
    AGENT_SPECIFIC: 'agent_specific',
    PROJECT_SPECIFIC: 'project_specific',
    DASHBOARD: 'dashboard',
    SYSTEM_HEALTH: 'system_health',
};
// ============================================================================
// WEBSOCKET BRIDGE SERVICE
// ============================================================================
export class EvolutionWebSocketBridge extends EventEmitter {
    connections = new Map();
    messageQueue = new Map();
    heartbeatInterval;
    cleanupInterval;
    constructor() {
        super();
        this.startHeartbeat();
        this.startCleanup();
    }
    /**
     * Register a new WebSocket connection
     */
    registerConnection(connectionId, clientType = 'unknown', metadata = {}) {
        const connection = {
            id: connectionId,
            subscriptions: [],
            connectedAt: new Date(),
            lastActivity: new Date(),
            clientType,
            metadata,
        };
        this.connections.set(connectionId, connection);
        this.messageQueue.set(connectionId, []);
        this.emit('connection_registered', { connectionId, clientType });
        // Send connection confirmation
        this.sendMessage(connectionId, {
            type: EvolutionWebSocketMessageType.SUBSCRIPTION_CONFIRMED,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            connectionId,
            data: { subscriptions: [] },
        });
    }
    /**
     * Remove a WebSocket connection
     */
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.delete(connectionId);
            this.messageQueue.delete(connectionId);
            this.emit('connection_removed', {
                connectionId,
                duration: Date.now() - connection.connectedAt.getTime()
            });
        }
    }
    /**
     * Update connection subscriptions
     */
    updateSubscriptions(connectionId, subscriptions) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.sendError(connectionId, 'CONNECTION_NOT_FOUND', 'Connection not found');
            return;
        }
        const updatedConnection = {
            ...connection,
            subscriptions,
            lastActivity: new Date(),
        };
        this.connections.set(connectionId, updatedConnection);
        // Confirm subscription update
        this.sendMessage(connectionId, {
            type: EvolutionWebSocketMessageType.SUBSCRIPTION_CONFIRMED,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            connectionId,
            data: { subscriptions },
        });
        this.emit('subscriptions_updated', { connectionId, subscriptions });
    }
    /**
     * Broadcast DNA evolution event
     */
    broadcastDnaEvolution(data) {
        const message = {
            type: EvolutionWebSocketMessageType.DNA_EVOLVED,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.DNA_EVOLUTION,
            ],
            filters: {
                agentId: data.agentId,
                projectId: data.projectId,
                dnaId: data.evolvedDnaId,
            },
        });
    }
    /**
     * Broadcast cross-project pattern identified
     */
    broadcastCrossProjectPattern(data) {
        const message = {
            type: EvolutionWebSocketMessageType.CROSS_PROJECT_PATTERN_IDENTIFIED,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.CROSS_PROJECT_LEARNING,
            ],
            filters: {
                projectId: data.sourceProject, // Will also match targetProject in filtering logic
            },
        });
    }
    /**
     * Broadcast metrics update
     */
    broadcastMetricsUpdate(metricsUpdate) {
        const message = {
            type: EvolutionWebSocketMessageType.METRICS_UPDATE,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data: metricsUpdate,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.METRICS_UPDATES,
            ],
        });
    }
    /**
     * Broadcast dashboard update
     */
    broadcastDashboardUpdate(dashboard) {
        const message = {
            type: EvolutionWebSocketMessageType.DASHBOARD_UPDATE,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data: dashboard,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.DASHBOARD,
                EvolutionSubscriptionType.METRICS_UPDATES,
            ],
        });
    }
    /**
     * Broadcast alert
     */
    broadcastAlert(alert) {
        const message = {
            type: EvolutionWebSocketMessageType.ALERT_TRIGGERED,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data: alert,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.ALERTS,
            ],
            filters: {
                ...(alert.projectId && { projectId: alert.projectId }),
                ...(alert.agentId && { agentId: alert.agentId }),
            },
            alertSeverity: alert.severity,
        });
    }
    /**
     * Broadcast agent performance update
     */
    broadcastAgentPerformance(data) {
        const message = {
            type: EvolutionWebSocketMessageType.AGENT_PERFORMANCE_UPDATE,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.AGENT_SPECIFIC,
            ],
            filters: {
                agentId: data.agentId,
                projectId: data.projectId,
                dnaId: data.dnaId,
            },
        });
    }
    /**
     * Broadcast system health update
     */
    broadcastSystemHealth(data) {
        const message = {
            type: EvolutionWebSocketMessageType.SYSTEM_HEALTH_UPDATE,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            data,
        };
        this.broadcastToSubscribers(message, {
            subscriptionTypes: [
                EvolutionSubscriptionType.ALL_EVENTS,
                EvolutionSubscriptionType.SYSTEM_HEALTH,
            ],
        });
    }
    /**
     * Get connection statistics
     */
    getConnectionStats() {
        const connections = Array.from(this.connections.values());
        const now = Date.now();
        const connectionsByType = connections.reduce((acc, conn) => {
            acc[conn.clientType] = (acc[conn.clientType] ?? 0) + 1;
            return acc;
        }, {});
        const subscriptionStats = connections.reduce((acc, conn) => {
            for (const sub of conn.subscriptions) {
                acc[sub.type] = (acc[sub.type] ?? 0) + 1;
            }
            return acc;
        }, {});
        const totalConnectionTime = connections.reduce((sum, conn) => sum + (now - conn.connectedAt.getTime()), 0);
        const averageConnectionTime = connections.length > 0
            ? totalConnectionTime / connections.length
            : 0;
        return {
            totalConnections: connections.length,
            connectionsByType,
            subscriptionStats,
            averageConnectionTime,
        };
    }
    /**
     * Get queued messages for a connection
     */
    getQueuedMessages(connectionId) {
        return this.messageQueue.get(connectionId) ?? [];
    }
    /**
     * Clear message queue for a connection
     */
    clearMessageQueue(connectionId) {
        this.messageQueue.set(connectionId, []);
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    broadcastToSubscribers(message, criteria) {
        for (const [connectionId, connection] of this.connections.entries()) {
            if (this.shouldReceiveMessage(connection, message, criteria)) {
                this.sendMessage(connectionId, message);
            }
        }
    }
    shouldReceiveMessage(connection, message, criteria) {
        // Check if connection has matching subscription types
        const hasMatchingSubscription = connection.subscriptions.some(sub => criteria.subscriptionTypes.includes(sub.type));
        if (!hasMatchingSubscription)
            return false;
        // Apply filters if specified
        for (const subscription of connection.subscriptions) {
            if (!criteria.subscriptionTypes.includes(subscription.type))
                continue;
            const filters = subscription.filters;
            if (!filters)
                return true; // No filters means accept all
            // Check agent filter
            if (filters.agentId && criteria.filters?.agentId !== filters.agentId) {
                continue;
            }
            // Check project filter
            if (filters.projectId && criteria.filters?.projectId !== filters.projectId) {
                // For cross-project messages, check both source and target
                if (message.type === EvolutionWebSocketMessageType.CROSS_PROJECT_PATTERN_IDENTIFIED) {
                    const data = message.data;
                    if (data.sourceProject !== filters.projectId && data.targetProject !== filters.projectId) {
                        continue;
                    }
                }
                else {
                    continue;
                }
            }
            // Check DNA filter
            if (filters.dnaId && criteria.filters?.dnaId !== filters.dnaId) {
                continue;
            }
            // Check alert severity filter
            if (criteria.alertSeverity && filters.alertSeverities &&
                !filters.alertSeverities.includes(criteria.alertSeverity)) {
                continue;
            }
            // If we reach here, all filters match
            return true;
        }
        return false;
    }
    sendMessage(connectionId, message) {
        const queue = this.messageQueue.get(connectionId);
        if (!queue)
            return;
        // Add to queue (in production, this would send via actual WebSocket)
        queue.push({
            ...message,
            connectionId,
        });
        // Limit queue size to prevent memory issues
        if (queue.length > 100) {
            queue.splice(0, queue.length - 100);
        }
        // Update connection activity
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.set(connectionId, {
                ...connection,
                lastActivity: new Date(),
            });
        }
        this.emit('message_sent', { connectionId, messageType: message.type });
    }
    sendError(connectionId, code, message) {
        const errorMessage = {
            type: EvolutionWebSocketMessageType.ERROR,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            connectionId,
            data: {
                code,
                message,
            },
        };
        this.sendMessage(connectionId, errorMessage);
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const heartbeatMessage = {
                type: EvolutionWebSocketMessageType.HEARTBEAT,
                id: this.generateMessageId(),
                timestamp: new Date().toISOString(),
                data: {
                    serverTime: new Date().toISOString(),
                    activeConnections: this.connections.size,
                },
            };
            // Send heartbeat to all connections
            for (const connectionId of this.connections.keys()) {
                this.sendMessage(connectionId, heartbeatMessage);
            }
        }, 30000); // 30 seconds
    }
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const maxInactivity = 5 * 60 * 1000; // 5 minutes
            // Remove inactive connections
            for (const [connectionId, connection] of this.connections.entries()) {
                if (now - connection.lastActivity.getTime() > maxInactivity) {
                    this.removeConnection(connectionId);
                }
            }
            // Clean up message queues
            for (const [connectionId, queue] of this.messageQueue.entries()) {
                if (!this.connections.has(connectionId)) {
                    this.messageQueue.delete(connectionId);
                }
                else if (queue.length > 50) {
                    // Keep only recent messages
                    queue.splice(0, queue.length - 50);
                }
            }
        }, 60000); // 1 minute
    }
    /**
     * Clean up resources
     */
    destroy() {
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
        if (this.cleanupInterval)
            clearInterval(this.cleanupInterval);
        this.connections.clear();
        this.messageQueue.clear();
        this.removeAllListeners();
    }
}
export default EvolutionWebSocketBridge;
//# sourceMappingURL=websocket-bridge.js.map