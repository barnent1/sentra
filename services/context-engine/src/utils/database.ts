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

  // Context-specific database operations
  async createContext(context: any): Promise<string> {
    const query = `
      INSERT INTO contexts (
        type, name, description, parent_id, project_id, user_id, 
        data, metadata, tags, is_active, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const values = [
      context.type,
      context.name,
      context.description,
      context.parentId,
      context.projectId,
      context.userId,
      JSON.stringify(context.data),
      JSON.stringify(context.metadata),
      context.tags,
      context.isActive,
      context.expiresAt,
    ];

    const result = await this.query<{ id: string }>(query, values);
    return result.rows[0]!.id;
  }

  async getContext(id: string): Promise<any> {
    const query = `
      SELECT * FROM contexts WHERE id = $1 AND is_active = true
    `;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateContext(id: string, updates: any): Promise<void> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'data' || key === 'metadata') {
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
      UPDATE contexts 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
    `;
    values.push(id);

    await this.query(query, values);
  }

  async createContextSnapshot(contextId: string, snapshotData: any, checksum: string): Promise<string> {
    const query = `
      INSERT INTO context_snapshots (context_id, snapshot_data, checksum, version)
      VALUES ($1, $2, $3, 
        (SELECT COALESCE(MAX(version), 0) + 1 FROM context_snapshots WHERE context_id = $1)
      )
      RETURNING id
    `;
    
    const result = await this.query<{ id: string }>(query, [
      contextId,
      JSON.stringify(snapshotData),
      checksum,
    ]);
    
    return result.rows[0]!.id;
  }

  async getContextSnapshots(contextId: string, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT * FROM context_snapshots 
      WHERE context_id = $1 
      ORDER BY version DESC 
      LIMIT $2
    `;
    const result = await this.query(query, [contextId, limit]);
    return result.rows;
  }

  async cleanupExpiredContexts(): Promise<number> {
    const query = `
      UPDATE contexts 
      SET is_active = false 
      WHERE expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP 
        AND is_active = true
    `;
    const result = await this.query(query);
    return result.rowCount || 0;
  }

  async getContextsByUser(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT * FROM contexts 
      WHERE user_id = $1 AND is_active = true
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getContextsByProject(projectId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT * FROM contexts 
      WHERE project_id = $1 AND is_active = true
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.query(query, [projectId, limit, offset]);
    return result.rows;
  }
}

export const DatabaseManager = new DatabaseManagerClass();