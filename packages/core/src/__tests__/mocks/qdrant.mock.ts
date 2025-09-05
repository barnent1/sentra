/**
 * Qdrant Client Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { jest } from '@jest/globals';
import type { 
  EvolutionDnaId,
  PatternTypeEnum,
  PerformanceMetrics,
  GeneticMarkers,
} from '../../types/evolution';

export interface MockQdrantPoint {
  readonly id: EvolutionDnaId;
  readonly vector: readonly number[];
  readonly payload: {
    readonly generation: number;
    readonly patternType: PatternTypeEnum;
    readonly successRate: number;
    readonly genetics: GeneticMarkers;
    readonly performance: PerformanceMetrics;
    readonly timestamp: string;
  };
}

export class MockQdrantClient {
  private points: Map<EvolutionDnaId, MockQdrantPoint> = new Map();
  private collections: Set<string> = new Set();

  // Collection Management
  recreateCollection = jest.fn().mockImplementation(async (collectionName: unknown, _config: unknown) => {
    const name = collectionName as string;
    this.collections.add(name);
    this.points.clear();
    return { status: 'ok' };
  });

  getCollection = jest.fn().mockImplementation(async (collectionName: unknown) => {
    const name = collectionName as string;
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }
    return {
      status: 'ok',
      result: {
        config: {
          params: {
            vectors: {
              size: 1536,
              distance: 'Cosine',
            },
          },
        },
        points_count: this.points.size,
      },
    };
  });

  // Point Operations
  upsert = jest.fn().mockImplementation(async (collectionName: unknown, data: unknown) => {
    const name = collectionName as string;
    const { points } = data as { points: MockQdrantPoint[] };
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }

    for (const point of points) {
      this.points.set(point.id, point);
    }

    return {
      status: 'ok',
      result: {
        operation_id: Math.random().toString(36),
        status: 'completed',
      },
    };
  });

  search = jest.fn().mockImplementation(async (
    collectionName: unknown,
    data: unknown
  ) => {
    const name = collectionName as string;
    const {
      limit = 10,
      with_payload = true,
    } = data as {
      vector: readonly number[];
      limit?: number;
      filter?: any;
      with_payload?: boolean;
    };
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }

    // Simulate vector similarity search
    const results = Array.from(this.points.values())
      .map(point => ({
        id: point.id,
        score: Math.random() * 0.5 + 0.5, // Random similarity score 0.5-1.0
        payload: with_payload ? point.payload : undefined,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      status: 'ok',
      result: results,
    };
  });

  retrieve = jest.fn().mockImplementation(async (
    collectionName: unknown,
    data: unknown
  ) => {
    const name = collectionName as string;
    const { ids, with_payload = true } = data as { ids: EvolutionDnaId[]; with_payload?: boolean };
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }

    const results = ids
      .map(id => this.points.get(id))
      .filter((point): point is MockQdrantPoint => point !== undefined)
      .map(point => ({
        id: point.id,
        payload: with_payload ? point.payload : undefined,
      }));

    return {
      status: 'ok',
      result: results,
    };
  });

  delete = jest.fn().mockImplementation(async (
    collectionName: unknown,
    data: unknown
  ) => {
    const name = collectionName as string;
    const { points } = data as { points: EvolutionDnaId[] };
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }

    for (const id of points) {
      this.points.delete(id);
    }

    return {
      status: 'ok',
      result: {
        operation_id: Math.random().toString(36),
        status: 'completed',
      },
    };
  });

  // Test utilities
  addTestPoint(point: MockQdrantPoint): void {
    this.points.set(point.id, point);
  }

  getPointCount(): number {
    return this.points.size;
  }

  clearPoints(): void {
    this.points.clear();
  }

  hasCollection(name: string): boolean {
    return this.collections.has(name);
  }
}

// Factory function for creating mock client
export const createMockQdrantClient = (): MockQdrantClient => {
  return new MockQdrantClient();
};

// Jest module mock
export const QdrantClient = jest.fn().mockImplementation(() => {
  return createMockQdrantClient();
});