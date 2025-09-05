/**
 * Load Testing for Concurrent Operations
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';
import type {
  EvolutionDnaId,
  CodeDNA,
  PatternTypeEnum,
} from '@sentra/types';

// Import server setup
import { createEvolutionServer } from '../../index';

/**
 * Load test configuration
 */
const LOAD_TEST_CONFIG = {
  CONCURRENT_USERS: 10,
  REQUESTS_PER_USER: 20,
  RAMP_UP_TIME: 5000, // 5 seconds
  TEST_DURATION: 30000, // 30 seconds
  MAX_RESPONSE_TIME: 2000, // 2 seconds
  ERROR_RATE_THRESHOLD: 0.05, // 5%
} as const;

/**
 * Load test metrics collector
 */
class LoadTestMetrics {
  private metrics: {
    requests: number;
    successes: number;
    failures: number;
    responseTimes: number[];
    errors: Error[];
    startTime: number;
  } = {
    requests: 0,
    successes: 0,
    failures: 0,
    responseTimes: [],
    errors: [],
    startTime: 0,
  };

  start(): void {
    this.metrics.startTime = performance.now();
  }

  recordRequest(responseTime: number, error?: Error): void {
    this.metrics.requests++;
    this.metrics.responseTimes.push(responseTime);
    
    if (error) {
      this.metrics.failures++;
      this.metrics.errors.push(error);
    } else {
      this.metrics.successes++;
    }
  }

  getReport(): {
    totalRequests: number;
    successRate: number;
    errorRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    requestsPerSecond: number;
    duration: number;
    errors: string[];
  } {
    const duration = performance.now() - this.metrics.startTime;
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      totalRequests: this.metrics.requests,
      successRate: this.metrics.successes / this.metrics.requests,
      errorRate: this.metrics.failures / this.metrics.requests,
      avgResponseTime: this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimes.length || 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      maxResponseTime: Math.max(...this.metrics.responseTimes, 0),
      minResponseTime: Math.min(...this.metrics.responseTimes, Infinity) || 0,
      requestsPerSecond: (this.metrics.requests / duration) * 1000,
      duration: duration,
      errors: this.metrics.errors.map(e => e.message),
    };
  }
}

/**
 * Simulated user behavior
 */
class VirtualUser {
  private userId: number;
  private baseUrl: string;
  private metrics: LoadTestMetrics;

  constructor(userId: number, baseUrl: string, metrics: LoadTestMetrics) {
    this.userId = userId;
    this.baseUrl = baseUrl;
    this.metrics = metrics;
  }

  async simulateUserJourney(): Promise<void> {
    const scenarios = [
      () => this.createPattern(),
      () => this.searchPatterns(),
      () => this.getPatternDetails(),
      () => this.evolvePattern(),
      () => this.getMetrics(),
    ];

    // Execute random scenarios
    const numScenarios = 3 + Math.floor(Math.random() * 3); // 3-5 scenarios per user
    
    for (let i = 0; i < numScenarios; i++) {
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      try {
        const startTime = performance.now();
        await scenario();
        const responseTime = performance.now() - startTime;
        this.metrics.recordRequest(responseTime);
        
        // Random delay between requests (0.5-2 seconds)
        await this.delay(500 + Math.random() * 1500);
      } catch (error) {
        const responseTime = performance.now() - startTime;
        this.metrics.recordRequest(responseTime, error as Error);
      }
    }
  }

  private async createPattern(): Promise<void> {
    const response = await request(this.baseUrl)
      .post('/api/evolution/patterns')
      .send({
        context: {
          projectName: `load-test-${this.userId}-${Date.now()}`,
          language: 'typescript',
          framework: 'express',
          requirements: ['performance', 'scalability'],
          constraints: ['memory-limited'],
          targetMetrics: {
            responseTime: 200,
            throughput: 1000,
            errorRate: 0.01,
            resourceUtilization: 0.8,
            scalabilityIndex: 0.9,
          },
        },
      })
      .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);

    if (response.status !== 201) {
      throw new Error(`Create pattern failed: ${response.status}`);
    }
  }

  private async searchPatterns(): Promise<void> {
    const queryPattern: CodeDNA = {
      id: `search-query-${this.userId}` as EvolutionDnaId,
      generation: 1,
      parentId: null,
      patternType: 'optimization' as PatternTypeEnum,
      code: 'function search() { return "load test"; }',
      genetics: {
        successRate: Math.random(),
        adaptationRate: Math.random(),
        complexityIndex: Math.random(),
        diversityScore: Math.random(),
        stabilityFactor: Math.random(),
      },
      performance: {
        responseTime: 100 + Math.random() * 100,
        throughput: 50 + Math.random() * 100,
        errorRate: Math.random() * 0.05,
        resourceUtilization: Math.random(),
        scalabilityIndex: Math.random(),
      },
      metadata: {
        description: 'Load test search query',
        tags: ['load-test'],
        author: 'load-test',
        version: '1.0.0',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response = await request(this.baseUrl)
      .post('/api/evolution/patterns/search')
      .send({
        queryPattern,
        options: {
          limit: 10,
          threshold: 0.7,
        },
      })
      .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);

    if (response.status !== 200) {
      throw new Error(`Search patterns failed: ${response.status}`);
    }
  }

  private async getPatternDetails(): Promise<void> {
    // Use a known pattern ID or create one first
    const patternId = `load-test-pattern-${this.userId}`;
    
    const response = await request(this.baseUrl)
      .get(`/api/evolution/patterns/${patternId}`)
      .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);

    // 404 is acceptable here as we might not have created this pattern
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Get pattern details failed: ${response.status}`);
    }
  }

  private async evolvePattern(): Promise<void> {
    const patternId = `evolution-target-${this.userId}`;
    
    const response = await request(this.baseUrl)
      .post(`/api/evolution/patterns/${patternId}/evolve`)
      .send({
        evolutionParams: {
          mutationRate: 0.1,
          crossoverRate: 0.3,
          targetImprovement: 0.1,
        },
        feedback: {
          performanceFeedback: 'Load test evolution',
          userRating: 3,
        },
      })
      .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);

    // 404 is acceptable here as we might not have this pattern
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Evolve pattern failed: ${response.status}`);
    }
  }

  private async getMetrics(): Promise<void> {
    const response = await request(this.baseUrl)
      .get('/api/evolution/metrics')
      .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);

    if (response.status !== 200) {
      throw new Error(`Get metrics failed: ${response.status}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

describe('Load Testing - Concurrent Operations', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Start test server
    const port = 3001;
    server = await createEvolutionServer({
      port,
      environment: 'test',
    });
    
    baseUrl = `http://localhost:${port}`;
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 30000);

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Pattern Creation Load Test', () => {
    it('should handle concurrent pattern creation requests', async () => {
      const metrics = new LoadTestMetrics();
      metrics.start();

      const concurrentRequests = 20;
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(baseUrl)
          .post('/api/evolution/patterns')
          .send({
            context: {
              projectName: `concurrent-test-${i}`,
              language: 'typescript',
              framework: 'express',
              requirements: ['performance'],
              constraints: [],
              targetMetrics: {
                responseTime: 200,
                throughput: 1000,
                errorRate: 0.01,
                resourceUtilization: 0.8,
                scalabilityIndex: 0.9,
              },
            },
          })
          .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME)
          .then(response => {
            const responseTime = Date.now(); // Simplified timing
            metrics.recordRequest(responseTime, response.status !== 201 ? new Error(`HTTP ${response.status}`) : undefined);
            return response;
          })
          .catch(error => {
            const responseTime = Date.now(); // Simplified timing
            metrics.recordRequest(responseTime, error);
            throw error;
          })
      );

      const results = await Promise.allSettled(promises);
      const report = metrics.getReport();

      console.log('Concurrent Pattern Creation Report:', report);

      // Validate results
      expect(report.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(report.avgResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
      expect(report.successRate).toBeGreaterThan(0.95); // 95% success rate

      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThanOrEqual(concurrentRequests * 0.9);
    });
  });

  describe('Mixed Workload Test', () => {
    it('should handle mixed API operations under load', async () => {
      const metrics = new LoadTestMetrics();
      metrics.start();

      const virtualUsers: VirtualUser[] = [];
      
      // Create virtual users
      for (let i = 0; i < LOAD_TEST_CONFIG.CONCURRENT_USERS; i++) {
        virtualUsers.push(new VirtualUser(i, baseUrl, metrics));
      }

      // Start all users with staggered timing (ramp-up)
      const userPromises = virtualUsers.map((user, index) => {
        const delay = (LOAD_TEST_CONFIG.RAMP_UP_TIME / LOAD_TEST_CONFIG.CONCURRENT_USERS) * index;
        return new Promise<void>(resolve => {
          setTimeout(async () => {
            try {
              await user.simulateUserJourney();
            } catch (error) {
              console.warn(`User ${index} encountered error:`, error);
            }
            resolve();
          }, delay);
        });
      });

      // Wait for all users to complete their journeys
      await Promise.all(userPromises);
      
      const report = metrics.getReport();
      console.log('Mixed Workload Test Report:', report);

      // Validate load test results
      expect(report.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(report.avgResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
      expect(report.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME * 1.5);
      expect(report.successRate).toBeGreaterThan(0.9); // 90% success rate

      // Performance requirements
      expect(report.requestsPerSecond).toBeGreaterThan(5); // Minimum throughput
      expect(report.totalRequests).toBeGreaterThan(LOAD_TEST_CONFIG.CONCURRENT_USERS * 3); // Each user should make multiple requests
    }, 60000); // 1 minute timeout for load test
  });

  describe('Stress Test - High Concurrency', () => {
    it('should maintain stability under extreme load', async () => {
      const metrics = new LoadTestMetrics();
      metrics.start();

      const extremeLoad = {
        concurrentRequests: 50,
        requestsPerBatch: 10,
        batches: 5,
      };

      const allPromises: Promise<any>[] = [];

      // Create multiple batches of concurrent requests
      for (let batch = 0; batch < extremeLoad.batches; batch++) {
        const batchPromises = Array.from({ length: extremeLoad.concurrentRequests }, (_, i) => {
          const requestIndex = batch * extremeLoad.concurrentRequests + i;
          
          return request(baseUrl)
            .post('/api/evolution/patterns')
            .send({
              context: {
                projectName: `stress-test-${requestIndex}`,
                language: 'typescript',
                framework: 'vue',
                requirements: ['scalability'],
                constraints: ['cpu-optimized'],
                targetMetrics: {
                  responseTime: 150,
                  throughput: 1500,
                  errorRate: 0.005,
                  resourceUtilization: 0.7,
                  scalabilityIndex: 0.95,
                },
              },
            })
            .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME * 2) // Increased timeout for stress test
            .then(response => {
              const responseTime = Date.now(); // Simplified timing
              metrics.recordRequest(responseTime, response.status !== 201 ? new Error(`HTTP ${response.status}`) : undefined);
              return response;
            })
            .catch(error => {
              const responseTime = Date.now(); // Simplified timing  
              metrics.recordRequest(responseTime, error);
              return null; // Don't fail the entire test for individual request failures
            });
        });

        allPromises.push(...batchPromises);

        // Small delay between batches to simulate real-world patterns
        if (batch < extremeLoad.batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(allPromises);
      const report = metrics.getReport();

      console.log('Stress Test Report:', report);

      // Stress test allows for higher error rates but should still maintain basic functionality
      expect(report.errorRate).toBeLessThan(0.15); // 15% error rate acceptable under extreme load
      expect(report.successRate).toBeGreaterThan(0.7); // 70% success rate minimum
      expect(report.totalRequests).toBe(extremeLoad.concurrentRequests * extremeLoad.batches);

      // System should not crash completely
      const fulfilledRequests = results.filter(r => r.status === 'fulfilled').length;
      expect(fulfilledRequests).toBeGreaterThan(0);

      // Log system behavior under stress
      console.log(`Stress test completed: ${fulfilledRequests}/${results.length} requests fulfilled`);
    }, 120000); // 2 minute timeout for stress test
  });

  describe('Endurance Test', () => {
    it('should maintain performance over extended period', async () => {
      const metrics = new LoadTestMetrics();
      metrics.start();

      const enduranceConfig = {
        duration: 60000, // 1 minute
        requestsPerSecond: 2,
        concurrentUsers: 3,
      };

      const totalExpectedRequests = Math.floor(enduranceConfig.duration / 1000) * enduranceConfig.requestsPerSecond;
      let completedRequests = 0;

      const startTime = Date.now();
      const interval = setInterval(async () => {
        if (Date.now() - startTime >= enduranceConfig.duration) {
          clearInterval(interval);
          return;
        }

        // Send concurrent requests
        const concurrentPromises = Array.from({ length: enduranceConfig.concurrentUsers }, () =>
          request(baseUrl)
            .get('/api/evolution/metrics')
            .timeout(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME)
            .then(response => {
              const responseTime = Date.now(); // Simplified timing
              metrics.recordRequest(responseTime, response.status !== 200 ? new Error(`HTTP ${response.status}`) : undefined);
              completedRequests++;
              return response;
            })
            .catch(error => {
              const responseTime = Date.now(); // Simplified timing
              metrics.recordRequest(responseTime, error);
              completedRequests++;
              return null;
            })
        );

        await Promise.allSettled(concurrentPromises);
      }, 1000 / enduranceConfig.requestsPerSecond);

      // Wait for endurance test to complete
      await new Promise(resolve => setTimeout(resolve, enduranceConfig.duration + 2000));

      const report = metrics.getReport();
      console.log('Endurance Test Report:', report);

      // Endurance test should show consistent performance
      expect(report.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(report.avgResponseTime).toBeLessThan(LOAD_TEST_CONFIG.MAX_RESPONSE_TIME);
      expect(report.successRate).toBeGreaterThan(0.95);

      // Should complete most of the expected requests
      expect(completedRequests).toBeGreaterThanOrEqual(totalExpectedRequests * 0.8);

      // Performance should remain stable (no significant degradation)
      const firstHalfTime = report.responseTimes.slice(0, Math.floor(report.responseTimes.length / 2));
      const secondHalfTime = report.responseTimes.slice(Math.floor(report.responseTimes.length / 2));
      
      const firstHalfAvg = firstHalfTime.reduce((sum, time) => sum + time, 0) / firstHalfTime.length;
      const secondHalfAvg = secondHalfTime.reduce((sum, time) => sum + time, 0) / secondHalfTime.length;
      
      // Second half should not be more than 50% slower than first half
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);

      console.log(`Endurance test performance stability - First half: ${firstHalfAvg.toFixed(2)}ms, Second half: ${secondHalfAvg.toFixed(2)}ms`);
    }, 90000); // 1.5 minute timeout for endurance test
  });
});