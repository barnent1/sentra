/**
 * Base schema definitions for existing Sentra tables
 * These correspond to the existing PostgreSQL schema in services/api/db/schema.sql
 */
import type { ProjectContextId, TaskId } from '@sentra/types';
export declare const uuidGenerateV4: import("drizzle-orm").SQL<unknown>;
export declare const vector: (name: string, config?: {
    dimensions: number;
}) => import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    name: string;
    dataType: "custom";
    columnType: "PgCustomColumn";
    data: number[];
    driverParam: string;
    enumValues: undefined;
}>;
/**
 * Projects table - existing table from base schema
 */
export declare const projects: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "projects";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "projects";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "projects";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        repoUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "repo_url";
            tableName: "projects";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        description: import("drizzle-orm/pg-core").PgColumn<{
            name: "description";
            tableName: "projects";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "projects";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "projects";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Agents table - existing table from base schema
 */
export declare const agents: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "agents";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "agents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "agents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        role: import("drizzle-orm/pg-core").PgColumn<{
            name: "role";
            tableName: "agents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        prompt: import("drizzle-orm/pg-core").PgColumn<{
            name: "prompt";
            tableName: "agents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        config: import("drizzle-orm/pg-core").PgColumn<{
            name: "config";
            tableName: "agents";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        active: import("drizzle-orm/pg-core").PgColumn<{
            name: "active";
            tableName: "agents";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "agents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "agents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Tasks table - existing table from base schema
 */
export declare const tasks: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "tasks";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_id";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        spec: import("drizzle-orm/pg-core").PgColumn<{
            name: "spec";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        assignedAgent: import("drizzle-orm/pg-core").PgColumn<{
            name: "assigned_agent";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        parentTaskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "parent_task_id";
            tableName: "tasks";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        priority: import("drizzle-orm/pg-core").PgColumn<{
            name: "priority";
            tableName: "tasks";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "tasks";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "tasks";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "tasks";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Approvals table - existing table from base schema
 */
export declare const approvals: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "approvals";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_id";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        machineId: import("drizzle-orm/pg-core").PgColumn<{
            name: "machine_id";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        tmuxTarget: import("drizzle-orm/pg-core").PgColumn<{
            name: "tmux_target";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        command: import("drizzle-orm/pg-core").PgColumn<{
            name: "command";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        riskLevel: import("drizzle-orm/pg-core").PgColumn<{
            name: "risk_level";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        decisionReason: import("drizzle-orm/pg-core").PgColumn<{
            name: "decision_reason";
            tableName: "approvals";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "approvals";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        decidedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "decided_at";
            tableName: "approvals";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        expiresAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "expires_at";
            tableName: "approvals";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Events table - existing table from base schema
 */
export declare const events: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "events";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_id";
            tableName: "events";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        taskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "task_id";
            tableName: "events";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        approvalId: import("drizzle-orm/pg-core").PgColumn<{
            name: "approval_id";
            tableName: "events";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        eventType: import("drizzle-orm/pg-core").PgColumn<{
            name: "event_type";
            tableName: "events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        eventData: import("drizzle-orm/pg-core").PgColumn<{
            name: "event_data";
            tableName: "events";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        machineId: import("drizzle-orm/pg-core").PgColumn<{
            name: "machine_id";
            tableName: "events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "events";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Memory items table - existing table from base schema with vector embeddings
 */
export declare const memoryItems: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "memory_items";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_id";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        taskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "task_id";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        kind: import("drizzle-orm/pg-core").PgColumn<{
            name: "kind";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        content: import("drizzle-orm/pg-core").PgColumn<{
            name: "content";
            tableName: "memory_items";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        embedding: import("drizzle-orm/pg-core").PgColumn<{
            name: string;
            tableName: "memory_items";
            dataType: "custom";
            columnType: "PgCustomColumn";
            data: number[];
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "memory_items";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "memory_items";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "memory_items";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Sub-agents table - existing table from base schema
 */
export declare const subagents: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "subagents";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        taskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "task_id";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        machineId: import("drizzle-orm/pg-core").PgColumn<{
            name: "machine_id";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        tmuxTarget: import("drizzle-orm/pg-core").PgColumn<{
            name: "tmux_target";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        contextSummary: import("drizzle-orm/pg-core").PgColumn<{
            name: "context_summary";
            tableName: "subagents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "subagents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        lastSeen: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_seen";
            tableName: "subagents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=base.d.ts.map