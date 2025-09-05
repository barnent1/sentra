/**
 * TMUX WebSocket Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages real-time WebSocket connections for TMUX session monitoring,
 * broadcasting project activity updates, agent status changes, and system events.
 */
import { EventEmitter } from 'events';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessageType as WSMessageType, } from './types';
import { v4 as uuidv4 } from 'uuid';
/**
 * Real-time WebSocket manager for TMUX sessions
 */
export class WebSocketManager extends EventEmitter {
    server;
    wss;
    config;
    clients = new Map();
    activityStreams = new Map();
    messageQueue = new Map();
    rateLimiter = new Map();
    heartbeatInterval;
    stats;
    startTime;
    constructor(port, config) {
        super();
        this.config = this.mergeDefaultConfig(config);
        this.startTime = new Date();
        this.stats = this.initializeStats();
        // Create HTTP server and WebSocket server
        this.server = createServer();
        this.wss = new WebSocketServer({ server: this.server });
        this.initialize();
        this.startServer(port);
    }
    // ============================================================================
    // INITIALIZATION AND LIFECYCLE
    // ============================================================================
    initialize() {
        this.setupWebSocketHandlers();
        this.startHeartbeat();
        this.startStatsCollection();
        this.setupCleanupTimers();
    }
    setupWebSocketHandlers() {
        this.wss.on('connection', (socket, request) => {
            this.handleNewConnection(socket, request);
        });
        this.wss.on('error', (error) => {
            this.emit('server-error', error);
            this.stats = { ...this.stats, connectionErrors: this.stats.connectionErrors + 1 };
        });
    }
    startServer(port) {
        this.server.listen(port, () => {
            this.emit('server-started', { port });
            console.log(`WebSocket server started on port ${port}`);
        });
    }
    startHeartbeat() {
        if (!this.config.enableHeartbeat)
            return;
        this.heartbeatInterval = setInterval(() => {
            this.broadcastHeartbeat();
        }, this.config.heartbeatInterval);
    }
    startStatsCollection() {
        setInterval(() => {
            this.updateStats();
        }, 5000); // Update stats every 5 seconds
    }
    setupCleanupTimers() {
        // Clean up inactive connections
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 30000); // Every 30 seconds
        // Clean up message queues
        setInterval(() => {
            this.cleanupMessageQueues();
        }, 60000); // Every minute
    }
    // ============================================================================
    // CONNECTION MANAGEMENT
    // ============================================================================
    /**
     * Handle new WebSocket connection
     */
    handleNewConnection(socket, request) {
        if (this.clients.size >= this.config.maxConnections) {
            socket.close(1013, 'Maximum connections exceeded');
            return;
        }
        const connectionId = this.generateConnectionId();
        const clientInfo = this.extractClientInfo(request);
        const client = {
            connectionId,
            socket,
            subscribedSessions: [],
            subscribedPanels: [],
            connectionTime: new Date(),
            lastActivity: new Date(),
            clientInfo,
            permissions: this.determinePermissions(clientInfo),
        };
        this.clients.set(connectionId, client);
        this.messageQueue.set(connectionId, []);
        this.setupClientHandlers(client);
        this.emit('client-connected', client);
        this.sendWelcomeMessage(client);
    }
    /**
     * Setup handlers for individual client
     */
    setupClientHandlers(client) {
        const { socket, connectionId } = client;
        socket.on('message', (data) => {
            this.handleClientMessage(connectionId, data);
        });
        socket.on('close', (code, reason) => {
            this.handleClientDisconnection(connectionId, code, reason);
        });
        socket.on('error', (error) => {
            this.handleClientError(connectionId, error);
        });
        socket.on('pong', () => {
            this.updateClientActivity(connectionId);
        });
    }
    /**
     * Handle message from client
     */
    handleClientMessage(connectionId, data) {
        try {
            this.updateClientActivity(connectionId);
            if (!this.checkRateLimit(connectionId)) {
                this.sendErrorToClient(connectionId, 'RATE_LIMIT_EXCEEDED', 'Too many messages');
                return;
            }
            const messageStr = data.toString();
            const message = JSON.parse(messageStr);
            this.stats = {
                ...this.stats,
                totalMessagesReceived: this.stats.totalMessagesReceived + 1,
                totalBytesReceived: this.stats.totalBytesReceived + data.length,
            };
            this.processClientMessage(connectionId, message);
        }
        catch (error) {
            this.sendErrorToClient(connectionId, 'INVALID_MESSAGE', 'Failed to parse message');
        }
    }
    /**
     * Process parsed message from client
     */
    processClientMessage(connectionId, message) {
        const client = this.clients.get(connectionId);
        if (!client)
            return;
        switch (message.type) {
            case 'subscribe':
                this.handleSubscriptionRequest(connectionId, message.data);
                break;
            case 'unsubscribe':
                this.handleUnsubscriptionRequest(connectionId, message.data);
                break;
            case 'command':
                this.handleCommandRequest(connectionId, message.data);
                break;
            case 'ping':
                this.sendPongToClient(connectionId);
                break;
            default:
                this.sendErrorToClient(connectionId, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
        }
    }
    /**
     * Handle client disconnection
     */
    handleClientDisconnection(connectionId, code, reason) {
        const client = this.clients.get(connectionId);
        if (client) {
            this.emit('client-disconnected', { client, code, reason: reason.toString() });
            this.clients.delete(connectionId);
            this.messageQueue.delete(connectionId);
            this.rateLimiter.delete(connectionId);
        }
    }
    /**
     * Handle client error
     */
    handleClientError(connectionId, error) {
        const client = this.clients.get(connectionId);
        this.emit('client-error', { client, error });
        this.stats = { ...this.stats, connectionErrors: this.stats.connectionErrors + 1 };
    }
    // ============================================================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================================================
    /**
     * Handle subscription request from client
     */
    handleSubscriptionRequest(connectionId, subscriptionData) {
        const client = this.clients.get(connectionId);
        if (!client)
            return;
        const { sessionIds, panelIds } = subscriptionData;
        // Update client subscriptions
        const updatedClient = {
            ...client,
            subscribedSessions: sessionIds ? [...new Set([...client.subscribedSessions, ...sessionIds])] : client.subscribedSessions,
            subscribedPanels: panelIds ? [...new Set([...client.subscribedPanels, ...panelIds])] : client.subscribedPanels,
            lastActivity: new Date(),
        };
        this.clients.set(connectionId, updatedClient);
        // Send confirmation as heartbeat message (simplified for now)
        const confirmationMessage = {
            id: uuidv4(),
            type: WSMessageType.HEARTBEAT,
            timestamp: new Date(),
            sessionId: '',
            data: {
                sessionHealth: 'healthy',
                activePanels: updatedClient.subscribedPanels.length,
                totalConnections: this.clients.size,
            },
        };
        this.sendToClient(connectionId, confirmationMessage);
        this.emit('subscription-updated', { connectionId, subscriptions: subscriptionData });
    }
    /**
     * Handle unsubscription request from client
     */
    handleUnsubscriptionRequest(connectionId, unsubscriptionData) {
        const client = this.clients.get(connectionId);
        if (!client)
            return;
        const { sessionIds, panelIds } = unsubscriptionData;
        const updatedClient = {
            ...client,
            subscribedSessions: sessionIds
                ? client.subscribedSessions.filter(id => !sessionIds.includes(id))
                : client.subscribedSessions,
            subscribedPanels: panelIds
                ? client.subscribedPanels.filter(id => !panelIds.includes(id))
                : client.subscribedPanels,
            lastActivity: new Date(),
        };
        this.clients.set(connectionId, updatedClient);
        this.emit('subscription-removed', { connectionId, unsubscriptions: unsubscriptionData });
    }
    // ============================================================================
    // MESSAGE BROADCASTING
    // ============================================================================
    /**
     * Broadcast message to all relevant clients
     */
    broadcastMessage(message) {
        const relevantClients = this.findRelevantClients(message);
        for (const client of relevantClients) {
            this.sendToClient(client.connectionId, message);
        }
        this.emit('message-broadcasted', { message, clientCount: relevantClients.length });
    }
    /**
     * Find clients that should receive a specific message
     */
    findRelevantClients(message) {
        return Array.from(this.clients.values()).filter(client => {
            // Check if client has permission to receive updates
            if (!client.permissions.canReceiveUpdates)
                return false;
            // Check session subscription
            if (client.subscribedSessions.length > 0 && !client.subscribedSessions.includes(message.sessionId)) {
                return false;
            }
            // Check panel subscription (if message has panel data)
            if ('data' in message && message.data && 'panelId' in message.data) {
                if (client.subscribedPanels.length > 0 && !client.subscribedPanels.includes(message.data.panelId)) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Send message to specific client
     */
    sendToClient(connectionId, message) {
        const client = this.clients.get(connectionId);
        if (!client || client.socket.readyState !== WebSocket.OPEN)
            return;
        try {
            const messageStr = JSON.stringify(message);
            client.socket.send(messageStr);
            this.stats = {
                ...this.stats,
                totalMessagesSent: this.stats.totalMessagesSent + 1,
                totalBytesSent: this.stats.totalBytesSent + messageStr.length,
            };
        }
        catch (error) {
            this.handleClientError(connectionId, error);
        }
    }
    /**
     * Broadcast heartbeat to all clients
     */
    broadcastHeartbeat() {
        const heartbeatMessage = {
            id: uuidv4(),
            type: WSMessageType.HEARTBEAT,
            timestamp: new Date(),
            sessionId: '',
            data: {
                sessionHealth: 'healthy',
                activePanels: this.getActivePanelCount(),
                totalConnections: this.clients.size,
            },
        };
        this.broadcastMessage(heartbeatMessage);
    }
    // ============================================================================
    // ACTIVITY STREAMING
    // ============================================================================
    /**
     * Create activity stream for session monitoring
     */
    createActivityStream(config) {
        this.activityStreams.set(config.streamId, config);
        // Start streaming if active
        if (config.isActive) {
            this.startActivityStream(config.streamId);
        }
        return config.streamId;
    }
    /**
     * Start activity stream
     */
    startActivityStream(streamId) {
        const config = this.activityStreams.get(streamId);
        if (!config)
            return;
        const interval = setInterval(() => {
            // In a real implementation, this would fetch current activity data
            // For now, emit a placeholder activity update
            const activityMessage = {
                id: uuidv4(),
                type: WSMessageType.PROJECT_ACTIVITY_UPDATE,
                timestamp: new Date(),
                sessionId: config.sessionId,
                data: {
                    panelId: 'example-panel',
                    activity: {
                        projectId: 'example-project',
                        agentId: 'example-agent',
                        status: 'working',
                        lastUpdate: new Date(),
                        progressPercentage: Math.random() * 100,
                        outputBuffer: [`Activity update ${Date.now()}`],
                        errorBuffer: [],
                        resourceUsage: {
                            cpu: Math.random() * 100,
                            memory: Math.random() * 1000,
                            networkIO: Math.random() * 50,
                        },
                    },
                },
            };
            this.broadcastMessage(activityMessage);
        }, config.updateInterval);
        // Store interval for cleanup
        config.interval = interval;
    }
    /**
     * Stop activity stream
     */
    stopActivityStream(streamId) {
        const config = this.activityStreams.get(streamId);
        if (config && config.interval) {
            clearInterval(config.interval);
            delete config.interval;
        }
    }
    /**
     * Remove activity stream
     */
    removeActivityStream(streamId) {
        this.stopActivityStream(streamId);
        this.activityStreams.delete(streamId);
    }
    // ============================================================================
    // UTILITY AND HELPER METHODS
    // ============================================================================
    /**
     * Generate unique connection ID
     */
    generateConnectionId() {
        return uuidv4();
    }
    /**
     * Extract client information from request
     */
    extractClientInfo(request) {
        const userAgent = request.headers['user-agent'] || '';
        const ipAddress = request.socket.remoteAddress || '';
        let clientType = 'unknown';
        if (userAgent.includes('dashboard'))
            clientType = 'dashboard';
        else if (userAgent.includes('cli'))
            clientType = 'cli';
        else if (userAgent.includes('mobile'))
            clientType = 'mobile';
        else if (userAgent.includes('api'))
            clientType = 'api';
        return {
            userAgent,
            ipAddress,
            clientType,
        };
    }
    /**
     * Determine client permissions based on client info
     */
    determinePermissions(clientInfo) {
        // Simple permission system - in real implementation, would be more sophisticated
        return {
            canReceiveUpdates: true,
            canSendCommands: clientInfo.clientType === 'cli' || clientInfo.clientType === 'dashboard',
            canViewAllSessions: clientInfo.clientType === 'dashboard',
        };
    }
    /**
     * Update client activity timestamp
     */
    updateClientActivity(connectionId) {
        const client = this.clients.get(connectionId);
        if (client) {
            const updatedClient = {
                ...client,
                lastActivity: new Date(),
            };
            this.clients.set(connectionId, updatedClient);
        }
    }
    /**
     * Check rate limit for client
     */
    checkRateLimit(connectionId) {
        if (!this.config.rateLimiting.enabled)
            return true;
        const now = Date.now();
        const limit = this.rateLimiter.get(connectionId);
        if (!limit || now - limit.lastReset > 1000) {
            // Reset counter every second
            this.rateLimiter.set(connectionId, { count: 1, lastReset: now });
            return true;
        }
        if (limit.count < this.config.rateLimiting.messagesPerSecond) {
            this.rateLimiter.set(connectionId, { ...limit, count: limit.count + 1 });
            return true;
        }
        return false;
    }
    /**
     * Send error message to client
     */
    sendErrorToClient(connectionId, code, message) {
        const errorMessage = {
            id: uuidv4(),
            type: WSMessageType.ERROR_NOTIFICATION,
            timestamp: new Date(),
            sessionId: '',
            data: {
                errorCode: code,
                message,
                severity: 'medium',
            },
        };
        this.sendToClient(connectionId, errorMessage);
    }
    /**
     * Send pong response to client
     */
    sendPongToClient(connectionId) {
        const client = this.clients.get(connectionId);
        if (client && client.socket.readyState === WebSocket.OPEN) {
            client.socket.pong();
        }
    }
    /**
     * Send welcome message to new client
     */
    sendWelcomeMessage(client) {
        const welcomeMessage = {
            id: uuidv4(),
            type: WSMessageType.HEARTBEAT,
            timestamp: new Date(),
            sessionId: '',
            data: {
                sessionHealth: 'healthy',
                activePanels: this.getActivePanelCount(),
                totalConnections: this.clients.size,
            },
        };
        this.sendToClient(client.connectionId, welcomeMessage);
    }
    // ============================================================================
    // STATISTICS AND MONITORING
    // ============================================================================
    /**
     * Initialize statistics object
     */
    initializeStats() {
        return {
            connectedClients: 0,
            totalMessagesReceived: 0,
            totalMessagesSent: 0,
            totalBytesReceived: 0,
            totalBytesSent: 0,
            averageMessageSize: 0,
            connectionErrors: 0,
            activeSubscriptions: 0,
            uptime: 0,
            lastStatsUpdate: new Date(),
        };
    }
    /**
     * Update statistics
     */
    updateStats() {
        const totalMessages = this.stats.totalMessagesReceived + this.stats.totalMessagesSent;
        const totalBytes = this.stats.totalBytesReceived + this.stats.totalBytesSent;
        this.stats = {
            ...this.stats,
            connectedClients: this.clients.size,
            averageMessageSize: totalMessages > 0 ? totalBytes / totalMessages : 0,
            activeSubscriptions: this.countActiveSubscriptions(),
            uptime: Date.now() - this.startTime.getTime(),
            lastStatsUpdate: new Date(),
        };
        this.emit('stats-updated', this.stats);
    }
    /**
     * Count active subscriptions across all clients
     */
    countActiveSubscriptions() {
        return Array.from(this.clients.values()).reduce((count, client) => count + client.subscribedSessions.length + client.subscribedPanels.length, 0);
    }
    /**
     * Get current active panel count
     */
    getActivePanelCount() {
        // In real implementation, would get from session manager
        return Array.from(this.clients.values()).reduce((count, client) => count + client.subscribedPanels.length, 0);
    }
    /**
     * Clean up inactive connections
     */
    cleanupInactiveConnections() {
        const cutoffTime = Date.now() - this.config.connectionTimeout;
        const inactiveConnections = [];
        this.clients.forEach((client, connectionId) => {
            if (client.lastActivity.getTime() < cutoffTime || client.socket.readyState !== WebSocket.OPEN) {
                inactiveConnections.push(connectionId);
            }
        });
        inactiveConnections.forEach(connectionId => {
            const client = this.clients.get(connectionId);
            if (client) {
                client.socket.terminate();
                this.handleClientDisconnection(connectionId, 1000, Buffer.from('Inactive connection cleaned up'));
            }
        });
    }
    /**
     * Clean up message queues
     */
    cleanupMessageQueues() {
        this.messageQueue.forEach((queue, connectionId) => {
            if (queue.length > this.config.messageQueueSize) {
                // Keep only the most recent messages
                const trimmedQueue = queue.slice(-this.config.messageQueueSize);
                this.messageQueue.set(connectionId, trimmedQueue);
            }
        });
    }
    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================
    /**
     * Get current statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get connected clients
     */
    getConnectedClients() {
        return Array.from(this.clients.values());
    }
    /**
     * Get active activity streams
     */
    getActivityStreams() {
        return Array.from(this.activityStreams.values());
    }
    /**
     * Handle command request from client
     */
    handleCommandRequest(connectionId, commandData) {
        const client = this.clients.get(connectionId);
        if (!client || !client.permissions.canSendCommands) {
            this.sendErrorToClient(connectionId, 'UNAUTHORIZED', 'Client not authorized to send commands');
            return;
        }
        this.emit('command-received', { connectionId, command: commandData });
    }
    /**
     * Merge default configuration
     */
    mergeDefaultConfig(config) {
        const defaultConfig = {
            enableHeartbeat: true,
            heartbeatInterval: 30000,
            messageQueueSize: 100,
            connectionTimeout: 300000, // 5 minutes
            maxConnections: 100,
            compressionEnabled: true,
            rateLimiting: {
                enabled: true,
                messagesPerSecond: 10,
                burstSize: 20,
            },
        };
        return { ...defaultConfig, ...config };
    }
    /**
     * Cleanup and shutdown
     */
    async cleanup() {
        // Stop heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Stop all activity streams
        this.activityStreams.forEach((_, streamId) => {
            this.stopActivityStream(streamId);
        });
        // Close all client connections
        this.clients.forEach(client => {
            client.socket.close(1001, 'Server shutting down');
        });
        // Close WebSocket server
        this.wss.close();
        // Close HTTP server
        return new Promise((resolve) => {
            this.server.close(() => {
                this.emit('server-closed');
                resolve();
            });
        });
    }
}
//# sourceMappingURL=WebSocketManager.js.map