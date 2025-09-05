"use strict";
/**
 * Type compatibility fixes for branded types
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserId = exports.isTaskId = exports.isAgentInstanceId = exports.isEvolutionDnaId = exports.createUserId = exports.createTaskId = exports.createAgentInstanceId = exports.createEvolutionDnaId = void 0;
/**
 * Helper functions to create branded IDs with proper type compatibility
 */
const createEvolutionDnaId = (value) => {
    return value;
};
exports.createEvolutionDnaId = createEvolutionDnaId;
const createAgentInstanceId = (value) => {
    return value;
};
exports.createAgentInstanceId = createAgentInstanceId;
const createTaskId = (value) => {
    return value;
};
exports.createTaskId = createTaskId;
const createUserId = (value) => {
    return value;
};
exports.createUserId = createUserId;
/**
 * Type guards for branded types
 */
const isEvolutionDnaId = (value) => {
    return typeof value === 'string' && value.length > 0;
};
exports.isEvolutionDnaId = isEvolutionDnaId;
const isAgentInstanceId = (value) => {
    return typeof value === 'string' && value.length > 0;
};
exports.isAgentInstanceId = isAgentInstanceId;
const isTaskId = (value) => {
    return typeof value === 'string' && value.length > 0;
};
exports.isTaskId = isTaskId;
const isUserId = (value) => {
    return typeof value === 'string' && value.length > 0;
};
exports.isUserId = isUserId;
//# sourceMappingURL=branded-fix.js.map