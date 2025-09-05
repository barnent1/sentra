/**
 * Playwright Global Setup
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');
  
  // Set environment variables for testing
  process.env['NODE_ENV'] = 'test';
  process.env['VITE_API_BASE_URL'] = 'http://localhost:3001/api';
  process.env['VITE_WS_URL'] = 'http://localhost:3001';
  
  // Launch browser for setup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for API server to be ready
    console.log('⏳ Waiting for API server...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await page.goto('http://localhost:3001/health');
        if (response?.status() === 200) {
          console.log('✅ API server is ready');
          break;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await page.waitForTimeout(2000);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('API server failed to start within timeout');
    }
    
    // Wait for Dashboard to be ready
    console.log('⏳ Waiting for Dashboard...');
    attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await page.goto('http://localhost:3000');
        if (response?.status() === 200) {
          console.log('✅ Dashboard is ready');
          break;
        }
      } catch (error) {
        // Dashboard not ready yet
      }
      
      await page.waitForTimeout(2000);
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Dashboard failed to start within timeout');
    }
    
    // Initialize test data
    console.log('📊 Initializing test data...');
    
    // Create some test patterns for E2E testing
    const testPatterns = [
      {
        context: {
          projectName: 'e2e-test-project',
          language: 'typescript',
          framework: 'vue',
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
      },
      {
        context: {
          projectName: 'e2e-optimization-project',
          language: 'javascript',
          framework: 'react',
          requirements: ['maintainability', 'testability'],
          constraints: ['cpu-optimized'],
          targetMetrics: {
            responseTime: 150,
            throughput: 1500,
            errorRate: 0.005,
            resourceUtilization: 0.7,
            scalabilityIndex: 0.95,
          },
        },
      },
    ];
    
    for (const pattern of testPatterns) {
      try {
        const response = await page.request.post('http://localhost:3001/api/evolution/patterns', {
          data: pattern,
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok()) {
          console.warn(`Failed to create test pattern: ${response.status()}`);
        }
      } catch (error) {
        console.warn('Failed to create test pattern:', error);
      }
    }
    
    console.log('✅ E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ E2E test environment setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;