#!/usr/bin/env node
/**
 * Example usage of Sentra Evolution API
 * This demonstrates how to start the API server with proper configuration
 */
/**
 * Main function to start the server
 */
declare function main(): Promise<void>;
/**
 * Example usage functions (for testing/demonstration)
 */
export declare class ApiExample {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    /**
     * Example: Check API health
     */
    checkHealth(): Promise<void>;
    /**
     * Example: Create a DNA pattern
     */
    createPattern(authToken: string): Promise<void>;
    /**
     * Example: WebSocket connection
     */
    connectWebSocket(authToken: string): void;
}
export default main;
//# sourceMappingURL=example.d.ts.map