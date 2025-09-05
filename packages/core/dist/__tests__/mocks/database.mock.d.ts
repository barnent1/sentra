/**
 * Database Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { EvolutionDnaId, PatternTypeEnum, PerformanceMetrics, GeneticMarkers } from '../../types/evolution';
export interface MockEvolutionPattern {
    readonly id: EvolutionDnaId;
    readonly generation: number;
    readonly parentId: EvolutionDnaId | null;
    readonly patternType: PatternTypeEnum;
    readonly genetics: GeneticMarkers;
    readonly performance: PerformanceMetrics;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export interface MockEvolutionResult {
    readonly id: string;
    readonly patternId: EvolutionDnaId;
    readonly generation: number;
    readonly metrics: PerformanceMetrics;
    readonly feedback: string;
    readonly createdAt: Date;
}
export declare class MockDrizzleDB {
    private patterns;
    private results;
    evolutionPatterns: {
        insert: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        findFirst: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        findMany: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        update: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        delete: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    };
    evolutionResults: {
        insert: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        findMany: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    };
    transaction: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearAllData(): void;
    getPatternCount(): number;
    getResultCount(): number;
    addTestPattern(pattern: MockEvolutionPattern): void;
    addTestResult(result: MockEvolutionResult): void;
}
export declare const createMockDatabase: () => MockDrizzleDB;
export declare const mockPostgres: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
//# sourceMappingURL=database.mock.d.ts.map