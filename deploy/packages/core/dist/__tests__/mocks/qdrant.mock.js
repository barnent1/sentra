/**
 * Qdrant Client Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { jest } from '@jest/globals';
export class MockQdrantClient {
    points = new Map();
    collections = new Set();
    // Collection Management
    recreateCollection = jest.fn().mockImplementation(async (collectionName, _config) => {
        const name = collectionName;
        this.collections.add(name);
        this.points.clear();
        return { status: 'ok' };
    });
    getCollection = jest.fn().mockImplementation(async (collectionName) => {
        const name = collectionName;
        if (!this.collections.has(name)) {
            throw new Error(`Collection ${name} not found`);
        }
        return {
            status: 'ok',
            result: {
                config: {
                    params: {
                        vectors: {
                            size: 1536,
                            distance: 'Cosine',
                        },
                    },
                },
                points_count: this.points.size,
            },
        };
    });
    // Point Operations
    upsert = jest.fn().mockImplementation(async (collectionName, data) => {
        const name = collectionName;
        const { points } = data;
        if (!this.collections.has(name)) {
            throw new Error(`Collection ${name} not found`);
        }
        for (const point of points) {
            this.points.set(point.id, point);
        }
        return {
            status: 'ok',
            result: {
                operation_id: Math.random().toString(36),
                status: 'completed',
            },
        };
    });
    search = jest.fn().mockImplementation(async (collectionName, data) => {
        const name = collectionName;
        const { limit = 10, with_payload = true, } = data;
        if (!this.collections.has(name)) {
            throw new Error(`Collection ${name} not found`);
        }
        // Simulate vector similarity search
        const results = Array.from(this.points.values())
            .map(point => ({
            id: point.id,
            score: Math.random() * 0.5 + 0.5, // Random similarity score 0.5-1.0
            payload: with_payload ? point.payload : undefined,
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return {
            status: 'ok',
            result: results,
        };
    });
    retrieve = jest.fn().mockImplementation(async (collectionName, data) => {
        const name = collectionName;
        const { ids, with_payload = true } = data;
        if (!this.collections.has(name)) {
            throw new Error(`Collection ${name} not found`);
        }
        const results = ids
            .map(id => this.points.get(id))
            .filter((point) => point !== undefined)
            .map(point => ({
            id: point.id,
            payload: with_payload ? point.payload : undefined,
        }));
        return {
            status: 'ok',
            result: results,
        };
    });
    delete = jest.fn().mockImplementation(async (collectionName, data) => {
        const name = collectionName;
        const { points } = data;
        if (!this.collections.has(name)) {
            throw new Error(`Collection ${name} not found`);
        }
        for (const id of points) {
            this.points.delete(id);
        }
        return {
            status: 'ok',
            result: {
                operation_id: Math.random().toString(36),
                status: 'completed',
            },
        };
    });
    // Test utilities
    addTestPoint(point) {
        this.points.set(point.id, point);
    }
    getPointCount() {
        return this.points.size;
    }
    clearPoints() {
        this.points.clear();
    }
    hasCollection(name) {
        return this.collections.has(name);
    }
}
// Factory function for creating mock client
export const createMockQdrantClient = () => {
    return new MockQdrantClient();
};
// Jest module mock
export const QdrantClient = jest.fn().mockImplementation(() => {
    return createMockQdrantClient();
});
//# sourceMappingURL=qdrant.mock.js.map