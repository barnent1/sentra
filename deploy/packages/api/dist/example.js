#!/usr/bin/env node
"use strict";
/**
 * Example usage of Sentra Evolution API
 * This demonstrates how to start the API server with proper configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExample = void 0;
const index_1 = require("./index");
/**
 * Example environment configuration
 */
const exampleConfig = {
    nodeEnv: 'development',
    database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        database: process.env['DB_NAME'] || 'sentra_evolution',
        username: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'password',
        ssl: process.env['DB_SSL'] === 'true',
        maxConnections: 20,
    },
    api: {
        port: parseInt(process.env['API_PORT'] || '3001', 10),
        host: process.env['API_HOST'] || '0.0.0.0',
        corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    },
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        format: process.env['LOG_FORMAT'] || 'pretty',
    },
};
/**
 * Example server configuration overrides
 */
const serverOverrides = {
    auth: {
        jwtSecret: process.env['JWT_SECRET'] || 'super-secret-development-key-change-in-production',
        jwtExpiresIn: '24h',
        refreshTokenExpiresIn: '7d',
        bcryptRounds: 12,
    },
    websocket: {
        cors: {
            origin: [...exampleConfig.api.corsOrigins],
            methods: ['GET', 'POST'],
        },
        connectionTimeout: 30000, // 30 seconds
        maxConnections: 100,
        heartbeatInterval: 60000, // 1 minute
    },
    rateLimit: {
        enabled: false, // Disabled for development
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
    },
};
/**
 * Main function to start the server
 */
async function main() {
    console.log('🧬 Starting Sentra Evolution API...');
    console.log('Environment:', exampleConfig.nodeEnv);
    console.log('Port:', exampleConfig.api.port);
    console.log('Host:', exampleConfig.api.host);
    try {
        // Create API server instance
        const api = (0, index_1.createEvolutionApi)(exampleConfig, serverOverrides);
        // Start the server
        await api.start();
        console.log('✅ Sentra Evolution API is running!');
        console.log('📖 API Documentation: http://localhost:' + exampleConfig.api.port + '/api');
        console.log('🏥 Health Check: http://localhost:' + exampleConfig.api.port + '/health');
        console.log('📊 Metrics: http://localhost:' + exampleConfig.api.port + '/api/metrics');
        console.log('🔌 WebSocket: ws://localhost:' + exampleConfig.api.port + '/socket.io');
        console.log('');
        console.log('Available API Endpoints:');
        console.log('  POST /api/evolution/patterns/evolve   - Evolve DNA pattern');
        console.log('  GET  /api/evolution/patterns          - List DNA patterns');
        console.log('  POST /api/evolution/patterns          - Create DNA pattern');
        console.log('  GET  /api/evolution/patterns/:id      - Get DNA pattern details');
        console.log('  PUT  /api/evolution/patterns/:id      - Update DNA pattern');
        console.log('  POST /api/evolution/agents/spawn      - Spawn agent instance');
        console.log('  GET  /api/evolution/agents            - List agent instances');
        console.log('  PUT  /api/evolution/agents/:id/learn  - Record learning outcome');
        console.log('');
        console.log('WebSocket Events:');
        console.log('  pattern:evolved     - DNA pattern evolution completed');
        console.log('  agent:status        - Agent status updates');
        console.log('  learning:outcome    - Learning outcome recorded');
        console.log('  metrics:update      - Performance metrics update');
        console.log('  system:health       - System health status');
        console.log('');
        console.log('Press Ctrl+C to stop the server');
        // Keep the process alive
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await api.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await api.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start Sentra Evolution API:', error);
        process.exit(1);
    }
}
/**
 * Example usage functions (for testing/demonstration)
 */
class ApiExample {
    baseUrl;
    constructor(baseUrl = `http://localhost:${exampleConfig.api.port}`) {
        this.baseUrl = baseUrl;
    }
    /**
     * Example: Check API health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            console.log('Health Check Result:', JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Health check failed:', error);
        }
    }
    /**
     * Example: Create a DNA pattern
     */
    async createPattern(authToken) {
        try {
            const patternData = {
                patternType: 'analytical',
                genetics: {
                    patternRecognition: 0.8,
                    adaptabilityScore: 0.7,
                    communicationStyle: 'detailed',
                    problemSolvingApproach: 'systematic',
                    collaborationPreference: 'team-based',
                },
                projectContext: {
                    projectType: 'web-app',
                    techStack: ['typescript', 'react', 'node.js'],
                    complexity: 'medium',
                    teamSize: 5,
                    timeline: '3 months',
                    requirements: ['responsive design', 'authentication', 'real-time updates'],
                },
                metadata: {
                    description: 'Example DNA pattern for web application development',
                    tags: ['web', 'frontend', 'typescript'],
                },
            };
            const response = await fetch(`${this.baseUrl}/api/evolution/patterns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(patternData),
            });
            const data = await response.json();
            console.log('Pattern Creation Result:', JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Pattern creation failed:', error);
        }
    }
    /**
     * Example: WebSocket connection
     */
    connectWebSocket(authToken) {
        // This is a basic example - in real usage you'd use socket.io-client
        console.log('WebSocket Example:');
        console.log('To connect to WebSocket, use socket.io-client:');
        console.log('');
        console.log('import io from "socket.io-client";');
        console.log('');
        console.log('const socket = io("' + this.baseUrl + '");');
        console.log('');
        console.log('socket.emit("authenticate", { token: "' + authToken + '", type: "auth" });');
        console.log('');
        console.log('socket.on("authenticated", (data) => {');
        console.log('  console.log("Authenticated:", data);');
        console.log('  socket.emit("subscribe", { type: "subscribe", channels: ["pattern:evolved", "agent:status"] });');
        console.log('});');
        console.log('');
        console.log('socket.on("pattern:evolved", (data) => {');
        console.log('  console.log("Pattern evolved:", data);');
        console.log('});');
    }
}
exports.ApiExample = ApiExample;
// Run the example if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
exports.default = main;
//# sourceMappingURL=example.js.map