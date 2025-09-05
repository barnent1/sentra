/**
 * Type compatibility fixes for branded types
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { EvolutionDnaId, AgentInstanceId, TaskId, UserId } from '@sentra/types';
/**
 * Helper functions to create branded IDs with proper type compatibility
 */
export declare const createEvolutionDnaId: (value: string) => EvolutionDnaId;
export declare const createAgentInstanceId: (value: string) => AgentInstanceId;
export declare const createTaskId: (value: string) => TaskId;
export declare const createUserId: (value: string) => UserId;
/**
 * Type guards for branded types
 */
export declare const isEvolutionDnaId: (value: unknown) => value is EvolutionDnaId;
export declare const isAgentInstanceId: (value: unknown) => value is AgentInstanceId;
export declare const isTaskId: (value: unknown) => value is TaskId;
export declare const isUserId: (value: unknown) => value is UserId;
//# sourceMappingURL=branded-fix.d.ts.map