/**
 * Database Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { jest } from '@jest/globals';
export class MockDrizzleDB {
    patterns = new Map();
    results = new Map();
    // Evolution Patterns Table Mock
    evolutionPatterns = {
        insert: jest.fn().mockImplementation(async (data) => {
            const typedData = data;
            const pattern = {
                id: (typedData.id || `pattern-${Date.now()}`),
                generation: typedData.generation || 1,
                parentId: typedData.parentId || null,
                patternType: typedData.patternType || 'adaptive',
                genetics: typedData.genetics || {
                    complexity: 0.5,
                    adaptability: 0.5,
                    successRate: 0.5,
                    transferability: 0.5,
                    stability: 0.5,
                    novelty: 0.5,
                    patternRecognition: 0.5,
                    errorRecovery: 0.5,
                    communicationClarity: 0.5,
                    learningVelocity: 0.5,
                    resourceEfficiency: 0.5,
                    collaborationAffinity: 0.5,
                    riskTolerance: 0.5,
                    thoroughness: 0.5,
                    creativity: 0.5,
                    persistence: 0.5,
                    empathy: 0.5,
                    pragmatism: 0.5,
                },
                performance: typedData.performance || {
                    successRate: 0.5,
                    averageTaskCompletionTime: 100,
                    codeQualityScore: 0.5,
                    userSatisfactionRating: 0.5,
                    adaptationSpeed: 0.5,
                    errorRecoveryRate: 0.5,
                    knowledgeRetention: 0.5,
                    crossDomainTransfer: 0.5,
                    computationalEfficiency: 0.5,
                    responseLatency: 100,
                    throughput: 50,
                    resourceUtilization: 0.5,
                    bugIntroductionRate: 0.01,
                    testCoverage: 0.8,
                    documentationQuality: 0.5,
                    maintainabilityScore: 0.5,
                    communicationEffectiveness: 0.5,
                    teamIntegration: 0.5,
                    feedbackIncorporation: 0.5,
                    conflictResolution: 0.5,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.patterns.set(pattern.id, pattern);
            return [pattern];
        }),
        findFirst: jest.fn().mockImplementation(async (args) => {
            const { where } = args;
            if (where?.id) {
                return this.patterns.get(where.id) || null;
            }
            return Array.from(this.patterns.values())[0] || null;
        }),
        findMany: jest.fn().mockImplementation(async (args) => {
            const { where, limit, orderBy } = args || {};
            let results = Array.from(this.patterns.values());
            if (where?.generation) {
                results = results.filter(p => p.generation === where.generation);
            }
            if (orderBy?.createdAt === 'desc') {
                results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }
            if (limit) {
                results = results.slice(0, limit);
            }
            return results;
        }),
        update: jest.fn().mockImplementation(async (args) => {
            const { where, data } = args;
            const existing = this.patterns.get(where.id);
            if (!existing) {
                throw new Error(`Pattern with id ${where.id} not found`);
            }
            const updated = {
                ...existing,
                ...data,
                updatedAt: new Date(),
            };
            this.patterns.set(where.id, updated);
            return updated;
        }),
        delete: jest.fn().mockImplementation(async (args) => {
            const { where } = args;
            const deleted = this.patterns.get(where.id);
            if (deleted) {
                this.patterns.delete(where.id);
                return deleted;
            }
            throw new Error(`Pattern with id ${where.id} not found`);
        }),
    };
    // Evolution Results Table Mock
    evolutionResults = {
        insert: jest.fn().mockImplementation(async (data) => {
            const typedData = data;
            const result = {
                id: typedData.id || `result-${Date.now()}`,
                patternId: typedData.patternId || 'pattern-1',
                generation: typedData.generation || 1,
                metrics: typedData.metrics || {
                    successRate: 0.5,
                    averageTaskCompletionTime: 100,
                    codeQualityScore: 0.5,
                    userSatisfactionRating: 0.5,
                    adaptationSpeed: 0.5,
                    errorRecoveryRate: 0.5,
                    knowledgeRetention: 0.5,
                    crossDomainTransfer: 0.5,
                    computationalEfficiency: 0.5,
                    responseLatency: 100,
                    throughput: 50,
                    resourceUtilization: 0.5,
                    bugIntroductionRate: 0.01,
                    testCoverage: 0.8,
                    documentationQuality: 0.5,
                    maintainabilityScore: 0.5,
                    communicationEffectiveness: 0.5,
                    teamIntegration: 0.5,
                    feedbackIncorporation: 0.5,
                    conflictResolution: 0.5,
                },
                feedback: typedData.feedback || 'Test feedback',
                createdAt: new Date(),
            };
            this.results.set(result.id, result);
            return [result];
        }),
        findMany: jest.fn().mockImplementation(async (args) => {
            const { where, limit } = args || {};
            let results = Array.from(this.results.values());
            if (where?.patternId) {
                results = results.filter(r => r.patternId === where.patternId);
            }
            if (limit) {
                results = results.slice(0, limit);
            }
            return results;
        }),
    };
    // Transaction Mock
    transaction = jest.fn().mockImplementation(async (callback) => {
        const typedCallback = callback;
        // In a real implementation, this would handle rollback/commit
        // For testing, we just execute the callback
        return await typedCallback(this);
    });
    // Test utilities
    clearAllData() {
        this.patterns.clear();
        this.results.clear();
    }
    getPatternCount() {
        return this.patterns.size;
    }
    getResultCount() {
        return this.results.size;
    }
    addTestPattern(pattern) {
        this.patterns.set(pattern.id, pattern);
    }
    addTestResult(result) {
        this.results.set(result.id, result);
    }
}
// Factory function for creating mock database
export const createMockDatabase = () => {
    return new MockDrizzleDB();
};
// Mock postgres connection - bypassing strict typing for jest mocks
export const mockPostgres = jest.fn().mockImplementation(() => {
    // @ts-ignore - jest mock typing complexity
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    // @ts-ignore - jest mock typing complexity
    const mockEnd = jest.fn().mockResolvedValue(undefined);
    return { query: mockQuery, end: mockEnd };
});
//# sourceMappingURL=database.mock.js.map