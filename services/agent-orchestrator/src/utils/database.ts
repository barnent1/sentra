import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from './config';
import { logger } from './logger';

class DatabaseManagerClass {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeout,
        connectionTimeoutMillis: config.database.connectionTimeout,
        ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database disconnected');
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        text,
        duration,
        rows: result.rowCount,
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed:', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  // Agent-specific database operations
  async createAgent(agent: any): Promise<string> {
    const query = `
      INSERT INTO agents (
        name, type, version, status, configuration, capabilities, resource_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      agent.name,
      agent.type,
      agent.version,
      agent.status,
      JSON.stringify(agent.configuration),
      agent.capabilities,
      JSON.stringify(agent.resourceRequirements),
    ];

    const result = await this.query<{ id: string }>(query, values);
    return result.rows[0]!.id;
  }

  async getAgent(id: string): Promise<any> {
    const query = `
      SELECT * FROM agents WHERE id = $1
    `;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateAgent(id: string, updates: any): Promise<void> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'configuration' || key === 'resourceRequirements') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }

    if (fields.length === 0) return;

    const query = `
      UPDATE agents 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
    `;
    values.push(id);

    await this.query(query, values);
  }

  async updateAgentHeartbeat(agentId: string): Promise<void> {
    const query = `
      UPDATE agents 
      SET last_heartbeat = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await this.query(query, [agentId]);
  }

  async getActiveAgents(): Promise<any[]> {
    const query = `
      SELECT * FROM agents 
      WHERE status IN ('idle', 'active', 'busy')
      ORDER BY created_at ASC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async createTask(task: any): Promise<string> {
    const query = `
      INSERT INTO tasks (
        title, description, status, priority, project_id, assigned_to, 
        created_by, estimated_hours, tags, metadata, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const values = [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.projectId,
      task.assignedTo,
      task.createdBy,
      task.estimatedHours,
      task.tags,
      JSON.stringify(task.metadata),
      task.dueDate,
    ];

    const result = await this.query<{ id: string }>(query, values);
    return result.rows[0]!.id;
  }

  async createAgentTask(agentTask: any): Promise<string> {
    const query = `
      INSERT INTO agent_tasks (
        agent_id, task_id, status, input_data, output_data, error_details
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const values = [
      agentTask.agentId,
      agentTask.taskId,
      agentTask.status,
      JSON.stringify(agentTask.inputData),
      JSON.stringify(agentTask.outputData),
      agentTask.errorDetails,
    ];

    const result = await this.query<{ id: string }>(query, values);
    return result.rows[0]!.id;
  }

  async updateAgentTask(id: string, updates: any): Promise<void> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'inputData' || key === 'outputData') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }

    if (fields.length === 0) return;

    const query = `
      UPDATE agent_tasks 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
    `;
    values.push(id);

    await this.query(query, values);
  }

  async getAgentTasks(agentId: string, status?: string): Promise<any[]> {
    let query = `
      SELECT at.*, t.title, t.description, t.priority 
      FROM agent_tasks at
      JOIN tasks t ON at.task_id = t.id
      WHERE at.agent_id = $1
    `;
    const params = [agentId];

    if (status) {
      query += ` AND at.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY at.created_at DESC`;

    const result = await this.query(query, params);
    return result.rows;
  }

  async getPendingTasks(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE status = 'pending' 
      ORDER BY priority DESC, created_at ASC
      LIMIT $1
    `;
    const result = await this.query(query, [limit]);
    return result.rows;
  }

  async getTasksByProject(projectId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE project_id = $1 
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.query(query, [projectId, limit]);
    return result.rows;
  }

  async getAgentsByType(type: string): Promise<any[]> {
    const query = `
      SELECT * FROM agents 
      WHERE type = $1 
      ORDER BY last_heartbeat DESC NULLS LAST
    `;
    const result = await this.query(query, [type]);
    return result.rows;
  }
}

export const DatabaseManager = new DatabaseManagerClass();