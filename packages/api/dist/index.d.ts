/**
 * Sentra Evolution API Server - Enhanced API Layer Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { EnvironmentConfig } from '@sentra/types';
import { PerformanceLogger } from './logger/config';
import { EvolutionEventBroadcaster, type WebSocketConfig } from './websocket/event-system';
/**
 * Server configuration interface
 */
export interface ServerConfig {
    readonly environment: EnvironmentConfig;
    readonly auth: {
        readonly jwtSecret: string;
        readonly jwtExpiresIn: string;
        readonly refreshTokenExpiresIn: string;
        readonly bcryptRounds: number;
    };
    readonly websocket: WebSocketConfig;
    readonly rateLimit: {
        readonly enabled: boolean;
        readonly windowMs: number;
        readonly maxRequests: number;
    };
}
/**
 * Enhanced Sentra Evolution API Server
 */
export declare class SentraEvolutionApi {
    private readonly config;
    private readonly app;
    private readonly httpServer;
    private readonly logger;
    private readonly authService;
    private readonly performanceLogger;
    private readonly dnaEngine;
    private readonly vectorStore;
    private eventBroadcaster?;
    constructor(config: ServerConfig);
    /**
     * Setup Express middleware
     */
    private readonly setupMiddleware;
    /**
     * Setup API routes
     */
    private readonly setupRoutes;
    /**
     * Setup WebSocket server
     */
    private readonly setupWebSocket;
    /**
     * Setup error handling
     */
    private readonly setupErrorHandling;
    /**
     * Start the server
     */
    readonly start: () => Promise<void>;
    /**
     * Stop the server gracefully
     */
    readonly stop: () => Promise<void>;
    /**
     * Graceful shutdown handler
     */
    private readonly gracefulShutdown;
    /**
     * Get event broadcaster for external use
     */
    readonly getEventBroadcaster: () => EvolutionEventBroadcaster | undefined;
    /**
     * Get performance logger for external use
     */
    readonly getPerformanceLogger: () => PerformanceLogger;
}
/**
 * Factory function to create server with default configuration
 */
export declare const createEvolutionApi: (environment: EnvironmentConfig, overrides?: Partial<ServerConfig>) => SentraEvolutionApi;
export default SentraEvolutionApi;
//# sourceMappingURL=index.d.ts.map