/**
 * Qdrant Client Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { EvolutionDnaId, PatternTypeEnum, PerformanceMetrics, GeneticMarkers } from '../../types/evolution';
export interface MockQdrantPoint {
    readonly id: EvolutionDnaId;
    readonly vector: readonly number[];
    readonly payload: {
        readonly generation: number;
        readonly patternType: PatternTypeEnum;
        readonly successRate: number;
        readonly genetics: GeneticMarkers;
        readonly performance: PerformanceMetrics;
        readonly timestamp: string;
    };
}
export declare class MockQdrantClient {
    private points;
    private collections;
    recreateCollection: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getCollection: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    upsert: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    search: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    retrieve: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    delete: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    addTestPoint(point: MockQdrantPoint): void;
    getPointCount(): number;
    clearPoints(): void;
    hasCollection(name: string): boolean;
}
export declare const createMockQdrantClient: () => MockQdrantClient;
export declare const QdrantClient: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
//# sourceMappingURL=qdrant.mock.d.ts.map