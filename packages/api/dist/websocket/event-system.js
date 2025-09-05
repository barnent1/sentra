"use strict";
/**
 * WebSocket event system for real-time Evolution API updates
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionEventBroadcaster = exports.WebSocketEvents = void 0;
const socket_io_1 = require("socket.io");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../schemas/validation");
/**
 * WebSocket event types
 */
exports.WebSocketEvents = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    // Authentication
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    // Subscription management
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    SUBSCRIBED: 'subscribed',
    UNSUBSCRIBED: 'unsubscribed',
    // Evolution events
    PATTERN_EVOLVED: 'pattern:evolved',
    PATTERN_CREATED: 'pattern:created',
    PATTERN_UPDATED: 'pattern:updated',
    PATTERN_DELETED: 'pattern:deleted',
    // Agent events
    AGENT_STATUS: 'agent:status',
    AGENT_SPAWNED: 'agent:spawned',
    AGENT_UPDATED: 'agent:updated',
    AGENT_ARCHIVED: 'agent:archived',
    // Learning events
    LEARNING_OUTCOME: 'learning:outcome',
    LEARNING_PATTERN_DISCOVERED: 'learning:pattern_discovered',
    // Metrics events
    METRICS_UPDATE: 'metrics:update',
    PERFORMANCE_ALERT: 'performance:alert',
    // System events
    SYSTEM_HEALTH: 'system:health',
    SYSTEM_MAINTENANCE: 'system:maintenance',
};
/**
 * Event broadcasting service
 */
class EvolutionEventBroadcaster {
    io;
    authService;
    clients;
    config;
    logger; // TODO: Type when logger is configured
    heartbeatInterval;
    constructor(httpServer, authService, config, logger) {
        this.authService = authService;
        this.config = config;
        this.logger = logger;
        this.clients = new Map();
        // Initialize Socket.IO server
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: config.cors.origin,
                methods: config.cors.methods,
                credentials: true,
            },
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
                skipMiddlewares: true,
            },
            transports: ['websocket', 'polling'],
        });
        this.setupEventHandlers();
        this.startHeartbeat();
    }
    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers = () => {
        this.io.on(exports.WebSocketEvents.CONNECTION, this.handleConnection);
        this.io.engine.on('connection_error', (err) => {
            this.logger?.error('WebSocket connection error', { error: err.message });
        });
    };
    /**
     * Handle new WebSocket connection
     */
    handleConnection = (socket) => {
        this.logger?.info('WebSocket connection attempt', { socketId: socket.id });
        // Set connection timeout
        const timeoutId = setTimeout(() => {
            if (!this.clients.has(socket.id)) {
                socket.emit(exports.WebSocketEvents.ERROR, {
                    code: 'AUTH_TIMEOUT',
                    message: 'Authentication timeout',
                });
                socket.disconnect(true);
            }
        }, this.config.connectionTimeout);
        // Handle authentication
        socket.on(exports.WebSocketEvents.AUTHENTICATE, async (data) => {
            clearTimeout(timeoutId);
            await this.handleAuthentication(socket, data);
        });
        // Handle disconnect
        socket.on(exports.WebSocketEvents.DISCONNECT, (reason) => {
            this.handleDisconnection(socket, reason);
        });
        // Handle generic errors
        socket.on(exports.WebSocketEvents.ERROR, (error) => {
            this.logger?.error('WebSocket error', {
                socketId: socket.id,
                error: error.message || error
            });
        });
    };
    /**
     * Handle client authentication
     */
    handleAuthentication = async (socket, data) => {
        try {
            // Validate authentication message
            const authMessage = validation_1.WebSocketMessageSchema.parse(data);
            if (authMessage.type !== 'auth') {
                throw new Error('Expected authentication message');
            }
            // Authenticate user
            const user = await (0, auth_1.authenticateWebSocket)(this.authService, authMessage.token);
            // Check connection limits
            if (this.clients.size >= this.config.maxConnections) {
                socket.emit(exports.WebSocketEvents.ERROR, {
                    code: 'MAX_CONNECTIONS',
                    message: 'Maximum connections exceeded',
                });
                socket.disconnect(true);
                return;
            }
            // Store client information
            const client = {
                socket,
                user,
                connectedAt: new Date(),
                subscriptions: new Set(),
                lastActivity: new Date(),
            };
            this.clients.set(socket.id, client);
            // Set up authenticated event handlers
            this.setupAuthenticatedHandlers(socket);
            // Notify client of successful authentication
            socket.emit(exports.WebSocketEvents.AUTHENTICATED, {
                userId: user.userId,
                permissions: user.permissions,
                timestamp: new Date(),
            });
            this.logger?.info('WebSocket client authenticated', {
                socketId: socket.id,
                userId: user.userId,
                role: user.role,
            });
        }
        catch (error) {
            this.logger?.warn('WebSocket authentication failed', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            socket.emit(exports.WebSocketEvents.ERROR, {
                code: 'AUTH_FAILED',
                message: 'Authentication failed',
            });
            socket.disconnect(true);
        }
    };
    /**
     * Setup event handlers for authenticated clients
     */
    setupAuthenticatedHandlers = (socket) => {
        // Handle subscription requests
        socket.on(exports.WebSocketEvents.SUBSCRIBE, (data) => {
            this.handleSubscription(socket, data, 'subscribe');
        });
        // Handle unsubscription requests
        socket.on(exports.WebSocketEvents.UNSUBSCRIBE, (data) => {
            this.handleSubscription(socket, data, 'unsubscribe');
        });
        // Update last activity
        socket.onAny(() => {
            const client = this.clients.get(socket.id);
            if (client) {
                this.clients.set(socket.id, {
                    ...client,
                    lastActivity: new Date(),
                });
            }
        });
    };
    /**
     * Handle subscription/unsubscription requests
     */
    handleSubscription = (socket, data, action) => {
        try {
            const client = this.clients.get(socket.id);
            if (!client) {
                return;
            }
            const message = validation_1.WebSocketMessageSchema.parse(data);
            if (message.type !== action) {
                throw new Error(`Expected ${action} message`);
            }
            const channels = message.channels || [];
            // Validate channels against user permissions
            const allowedChannels = this.getAllowedChannels(client.user);
            const validChannels = channels.filter(channel => allowedChannels.includes(channel));
            if (action === 'subscribe') {
                // Join socket rooms for channels
                validChannels.forEach(channel => {
                    socket.join(channel);
                    client.subscriptions.add(channel);
                });
                socket.emit(exports.WebSocketEvents.SUBSCRIBED, {
                    channels: validChannels,
                    timestamp: new Date(),
                });
            }
            else {
                // Leave socket rooms for channels
                validChannels.forEach(channel => {
                    socket.leave(channel);
                    client.subscriptions.delete(channel);
                });
                socket.emit(exports.WebSocketEvents.UNSUBSCRIBED, {
                    channels: validChannels,
                    timestamp: new Date(),
                });
            }
            this.logger?.info(`WebSocket client ${action}d`, {
                socketId: socket.id,
                userId: client.user.userId,
                channels: validChannels,
            });
        }
        catch (error) {
            socket.emit(exports.WebSocketEvents.ERROR, {
                code: 'SUBSCRIPTION_ERROR',
                message: error instanceof Error ? error.message : 'Subscription failed',
            });
        }
    };
    /**
     * Get allowed channels based on user permissions
     */
    getAllowedChannels = (user) => {
        const allChannels = [
            'pattern:evolved',
            'pattern:created',
            'pattern:updated',
            'agent:status',
            'agent:spawned',
            'learning:outcome',
            'metrics:update',
            'system:health',
        ];
        // Admin users can access all channels
        if (user.role === 'admin') {
            return allChannels;
        }
        // Regular users can access most channels except system management
        if (user.role === 'user') {
            return allChannels.filter(channel => !channel.startsWith('system:') || channel === 'system:health');
        }
        // Readonly users can only access read events
        return [
            'pattern:evolved',
            'agent:status',
            'metrics:update',
            'system:health',
        ];
    };
    /**
     * Handle client disconnection
     */
    handleDisconnection = (socket, reason) => {
        const client = this.clients.get(socket.id);
        if (client) {
            this.logger?.info('WebSocket client disconnected', {
                socketId: socket.id,
                userId: client.user.userId,
                reason,
                duration: Date.now() - client.connectedAt.getTime(),
            });
            this.clients.delete(socket.id);
        }
    };
    /**
     * Start heartbeat to check connection health
     */
    startHeartbeat = () => {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const staleThreshold = 5 * 60 * 1000; // 5 minutes
            for (const [socketId, client] of this.clients.entries()) {
                const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
                if (timeSinceActivity > staleThreshold) {
                    this.logger?.warn('Disconnecting stale WebSocket client', {
                        socketId,
                        userId: client.user.userId,
                        timeSinceActivity,
                    });
                    client.socket.disconnect(true);
                    this.clients.delete(socketId);
                }
            }
        }, this.config.heartbeatInterval);
    };
    /**
     * Event broadcasting methods
     */
    broadcastPatternEvolved = (payload) => {
        this.io.to('pattern:evolved').emit(exports.WebSocketEvents.PATTERN_EVOLVED, payload);
        this.logger?.debug('Broadcasted pattern evolved event', {
            parentDnaId: payload.parentDnaId,
            childDnaId: payload.childDnaId,
        });
    };
    broadcastAgentStatus = (payload) => {
        this.io.to('agent:status').emit(exports.WebSocketEvents.AGENT_STATUS, payload);
        this.logger?.debug('Broadcasted agent status event', {
            agentId: payload.agentId,
            status: payload.status,
        });
    };
    broadcastLearningOutcome = (payload) => {
        this.io.to('learning:outcome').emit(exports.WebSocketEvents.LEARNING_OUTCOME, payload);
        this.logger?.debug('Broadcasted learning outcome event', {
            outcomeId: payload.outcomeId,
            agentId: payload.agentId,
        });
    };
    broadcastMetricsUpdate = (payload) => {
        this.io.to('metrics:update').emit(exports.WebSocketEvents.METRICS_UPDATE, payload);
        this.logger?.debug('Broadcasted metrics update event', {
            timestamp: payload.timestamp,
            metricCount: Object.keys(payload.metrics).length,
        });
    };
    broadcastSystemHealth = (payload) => {
        this.io.to('system:health').emit(exports.WebSocketEvents.SYSTEM_HEALTH, payload);
        this.logger?.debug('Broadcasted system health event', {
            status: payload.status,
            componentCount: Object.keys(payload.components).length,
        });
    };
    /**
     * Get connection statistics
     */
    getStats = () => {
        const stats = {
            totalConnections: this.clients.size,
            connectionsByRole: {},
            subscriptionsByChannel: {},
        };
        for (const client of this.clients.values()) {
            // Count by role
            stats.connectionsByRole[client.user.role] =
                (stats.connectionsByRole[client.user.role] || 0) + 1;
            // Count subscriptions by channel
            for (const channel of client.subscriptions) {
                stats.subscriptionsByChannel[channel] =
                    (stats.subscriptionsByChannel[channel] || 0) + 1;
            }
        }
        return stats;
    };
    /**
     * Shutdown the WebSocket server
     */
    shutdown = () => {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        // Disconnect all clients
        for (const client of this.clients.values()) {
            client.socket.disconnect(true);
        }
        this.clients.clear();
        this.io.close();
        this.logger?.info('WebSocket server shutdown complete');
    };
}
exports.EvolutionEventBroadcaster = EvolutionEventBroadcaster;
//# sourceMappingURL=event-system.js.map