/**
 * Jest Test Setup for Core Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */
declare global {
    var createTestTimeout: (ms?: number) => Promise<void>;
    var measurePerformance: <T>(fn: () => Promise<T>) => Promise<{
        result: T;
        duration: number;
    }>;
}
export {};
//# sourceMappingURL=setup.d.ts.map