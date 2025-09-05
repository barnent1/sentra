/**
 * Basic test for DNA Evolution System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { TestDNAEngine } from './test-engine';
import { ProjectContext } from '../types';

/**
 * Run basic evolution test
 */
export async function runEvolutionTest() {
  console.log('🧬 Starting DNA Evolution Test...');

  const engine = new TestDNAEngine();

  // Create test project context
  const testContext: ProjectContext = {
    id: 'ctx_test' as any,
    projectType: 'web-app',
    techStack: ['typescript', 'react', 'node'],
    complexity: 'medium',
    teamSize: 3,
    timeline: '3 months',
    requirements: ['responsive design', 'api integration'],
    industryDomain: 'web development',
    regulatoryCompliance: [],
    performanceRequirements: {
      maxResponseTime: 2000,
      minThroughput: 100,
      availabilityTarget: 0.99,
      errorRateThreshold: 0.01,
    },
    scalabilityNeeds: {
      expectedGrowthRate: 1.5,
      peakLoadCapacity: 1000,
      dataVolumeGrowth: '100MB/month',
      horizontalScaling: true,
    },
    securityRequirements: {
      authenticationMethod: 'jwt',
      encryptionRequirements: ['TLS'],
      auditingNeeds: 'basic',
      dataPrivacyLevel: 'internal',
    },
    developmentStage: 'mvp',
    testingStrategy: 'unit',
    deploymentStrategy: 'ci-cd',
    monitoringNeeds: 'basic',
  };

  try {
    // Generate test DNA pattern
    console.log('📝 Generating test DNA pattern...');
    const testDNA = await engine.generateTestPattern(testContext);
    console.log(`✅ Generated DNA: ${testDNA.id} (fitness: ${testDNA.fitnessScore})`);
    console.log(`   Pattern Type: ${testDNA.patternType}`);
    console.log(`   Generation: ${testDNA.generation}`);

    // Test evolution
    console.log('🔄 Testing evolution process...');
    const evolutionResult = await engine.testEvolution(testDNA);
    console.log(`${evolutionResult.success ? '✅' : '❌'} Evolution result: ${evolutionResult.reasoning}`);

    // Get metrics
    console.log('📊 Getting test metrics...');
    const metrics = engine.getTestMetrics();
    console.log(`📈 Status: ${metrics.status}, Processing time: ${metrics.averageProcessingTime}ms`);

    console.log('🎉 DNA Evolution Test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ DNA Evolution Test failed:', error);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  runEvolutionTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}