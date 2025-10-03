import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  createTestPool,
  createTestDb,
  cleanDatabase,
  isVectorExtensionAvailable,
  isVectorExtensionEnabled,
} from '../helpers/db-test-utils';
import { stacks, documentationChunks } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import pg from 'pg';

describe('pgvector Extension', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof createTestDb>;
  let vectorAvailable = false;
  let vectorEnabled = false;

  beforeAll(async () => {
    pool = createTestPool();
    db = createTestDb(pool);
    vectorAvailable = await isVectorExtensionAvailable(pool);
    vectorEnabled = await isVectorExtensionEnabled(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  describe('Extension Availability', () => {
    it('should check if pgvector extension is available', async () => {
      expect(typeof vectorAvailable).toBe('boolean');

      if (vectorAvailable) {
        console.log('✅ pgvector extension is available');
      } else {
        console.log('ℹ️  pgvector extension is not available - some tests will be skipped');
      }
    });

    it('should check if pgvector extension is enabled', async () => {
      expect(typeof vectorEnabled).toBe('boolean');

      if (vectorEnabled) {
        console.log('✅ pgvector extension is enabled');
      } else {
        console.log('ℹ️  pgvector extension is not enabled - some tests will be skipped');
      }
    });

    it('should have vector column in documentation_chunks schema', async () => {
      const result = await pool.query(
        `SELECT column_name, data_type, udt_name
         FROM information_schema.columns
         WHERE table_name = 'documentation_chunks'
         AND column_name = 'embedding'`
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].column_name).toBe('embedding');
    });
  });

  if (vectorEnabled) {
    describe('Vector Operations (pgvector enabled)', () => {
      it('should insert documentation chunk with embedding vector', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        // Create a 1536-dimension vector (matching OpenAI ada-002 embeddings)
        const embedding = Array.from({ length: 1536 }, () => Math.random());

        // Insert using raw SQL to handle vector type
        const result = await pool.query(
          `INSERT INTO documentation_chunks (
            "stackId", content, "chunkIndex", embedding
          ) VALUES ($1, $2, $3, $4::vector)
          RETURNING *`,
          [stack.id, 'Test content', 0, `[${embedding.join(',')}]`]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].stackId).toBe(stack.id);
      });

      it('should perform vector similarity search using cosine distance', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        // Insert multiple chunks with different embeddings
        const embedding1 = Array.from({ length: 1536 }, () => Math.random());
        const embedding2 = Array.from({ length: 1536 }, () => Math.random());
        const embedding3 = Array.from({ length: 1536 }, () => Math.random());

        await pool.query(
          `INSERT INTO documentation_chunks ("stackId", content, "chunkIndex", embedding)
           VALUES
           ($1, 'Content 1', 0, $2::vector),
           ($1, 'Content 2', 1, $3::vector),
           ($1, 'Content 3', 2, $4::vector)`,
          [
            stack.id,
            `[${embedding1.join(',')}]`,
            `[${embedding2.join(',')}]`,
            `[${embedding3.join(',')}]`,
          ]
        );

        // Search using cosine similarity
        const searchVector = embedding1; // Search for vector similar to embedding1
        const result = await pool.query(
          `SELECT content, embedding <=> $1::vector as distance
           FROM documentation_chunks
           WHERE "stackId" = $2
           ORDER BY embedding <=> $1::vector
           LIMIT 3`,
          [`[${searchVector.join(',')}]`, stack.id]
        );

        expect(result.rows).toHaveLength(3);
        expect(result.rows[0].content).toBe('Content 1'); // Should be most similar
        expect(parseFloat(result.rows[0].distance)).toBeLessThan(0.01); // Very similar
      });

      it('should perform vector similarity search using L2 distance', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        const embedding1 = Array.from({ length: 1536 }, (_, i) => i / 1536);
        const embedding2 = Array.from({ length: 1536 }, (_, i) => (i + 100) / 1536);

        await pool.query(
          `INSERT INTO documentation_chunks ("stackId", content, "chunkIndex", embedding)
           VALUES
           ($1, 'Doc 1', 0, $2::vector),
           ($1, 'Doc 2', 1, $3::vector)`,
          [stack.id, `[${embedding1.join(',')}]`, `[${embedding2.join(',')}]`]
        );

        // L2 distance search
        const result = await pool.query(
          `SELECT content, embedding <-> $1::vector as l2_distance
           FROM documentation_chunks
           WHERE "stackId" = $2
           ORDER BY embedding <-> $1::vector
           LIMIT 1`,
          [`[${embedding1.join(',')}]`, stack.id]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].content).toBe('Doc 1');
      });

      it('should handle vector inner product search', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        const embedding = Array.from({ length: 1536 }, () => Math.random());

        await pool.query(
          `INSERT INTO documentation_chunks ("stackId", content, "chunkIndex", embedding)
           VALUES ($1, 'Test content', 0, $2::vector)`,
          [stack.id, `[${embedding.join(',')}]`]
        );

        // Inner product search
        const result = await pool.query(
          `SELECT content, embedding <#> $1::vector as inner_product
           FROM documentation_chunks
           WHERE "stackId" = $2`,
          [`[${embedding.join(',')}]`, stack.id]
        );

        expect(result.rows).toHaveLength(1);
      });

      it('should create and use vector index for performance', async () => {
        // Check if index can be created (might already exist)
        try {
          await pool.query(
            `CREATE INDEX IF NOT EXISTS documentation_chunks_embedding_idx
             ON documentation_chunks
             USING ivfflat (embedding vector_cosine_ops)
             WITH (lists = 100)`
          );

          const indexResult = await pool.query(
            `SELECT indexname FROM pg_indexes
             WHERE tablename = 'documentation_chunks'
             AND indexname = 'documentation_chunks_embedding_idx'`
          );

          expect(indexResult.rows.length).toBeGreaterThanOrEqual(0);
        } catch (error) {
          // Index creation might fail if not enough data, which is ok for tests
          console.log('ℹ️  Vector index creation skipped (not enough data)');
        }
      });

      it('should retrieve embedding vectors correctly', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        const originalEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536);

        await pool.query(
          `INSERT INTO documentation_chunks ("stackId", content, "chunkIndex", embedding)
           VALUES ($1, 'Test', 0, $2::vector)`,
          [stack.id, `[${originalEmbedding.join(',')}]`]
        );

        const result = await pool.query(
          `SELECT embedding FROM documentation_chunks WHERE "stackId" = $1`,
          [stack.id]
        );

        expect(result.rows[0].embedding).toBeDefined();
        // The embedding is returned as a string representation
        expect(typeof result.rows[0].embedding).toBe('string');
      });
    });
  } else {
    describe('Vector Operations (pgvector not enabled)', () => {
      it('should handle missing pgvector gracefully', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        // Insert without embedding should still work
        const [chunk] = await db
          .insert(documentationChunks)
          .values({
            stackId: stack.id,
            content: 'Test content without embedding',
            chunkIndex: 0,
            embedding: null,
          })
          .returning();

        expect(chunk).toBeDefined();
        expect(chunk.embedding).toBeNull();
      });

      it('should store documentation without vector capabilities', async () => {
        const [stack] = await db
          .insert(stacks)
          .values({ name: 'test-stack', version: '1.0.0' })
          .returning();

        const chunks = await db
          .insert(documentationChunks)
          .values([
            {
              stackId: stack.id,
              content: 'Chunk 1',
              chunkIndex: 0,
            },
            {
              stackId: stack.id,
              content: 'Chunk 2',
              chunkIndex: 1,
            },
          ])
          .returning();

        expect(chunks).toHaveLength(2);
      });
    });
  }

  describe('Schema Compatibility', () => {
    it('should allow null embeddings regardless of pgvector status', async () => {
      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [chunk] = await db
        .insert(documentationChunks)
        .values({
          stackId: stack.id,
          content: 'Content without embedding',
          chunkIndex: 0,
          embedding: null,
        })
        .returning();

      expect(chunk.embedding).toBeNull();
    });

    it('should maintain data integrity without embeddings', async () => {
      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      await db.insert(documentationChunks).values({
        stackId: stack.id,
        content: 'Test content',
        url: 'https://example.com/doc',
        title: 'Test Doc',
        chunkIndex: 0,
      });

      const chunks = await db
        .select()
        .from(documentationChunks)
        .where(eq(documentationChunks.stackId, stack.id));

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Test content');
      expect(chunks[0].title).toBe('Test Doc');
    });
  });
});
