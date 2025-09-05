/**
 * Jest Test Setup for API Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */
declare global {
    var createTestServer: () => {
        server: any;
        request: any;
    };
    var createTestHeaders: (token?: string) => Record<string, string>;
    var createMockSocket: () => any;
}
export {};
//# sourceMappingURL=setup.d.ts.map