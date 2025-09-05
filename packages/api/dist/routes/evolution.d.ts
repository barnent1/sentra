/**
 * Evolution API routes for pattern evolution and agent management
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { Router } from 'express';
import { TestDNAEngine } from '@sentra/core';
interface VectorDatabaseService {
    [key: string]: any;
}
import { AuthService } from '../middleware/auth';
/**
 * Service dependencies interface
 */
export interface EvolutionServiceDependencies {
    readonly dnaEngine: TestDNAEngine;
    readonly vectorStore: VectorDatabaseService;
    readonly database: any;
    readonly logger: any;
    readonly authService: AuthService;
}
/**
 * Create evolution router with injected dependencies
 */
export declare const createEvolutionRouter: (deps: EvolutionServiceDependencies) => Router;
export default createEvolutionRouter;
//# sourceMappingURL=evolution.d.ts.map