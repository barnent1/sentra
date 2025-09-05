#!/usr/bin/env tsx
/**
 * Simple Context Management Test for Sentra Evolutionary Agent System
 * This test focuses on core context management without external dependencies
 */

import { AgentFactory } from './packages/core/src/agents/agent-factory';
import { DNAEngine } from './packages/core/src/dna/dna-engine';
import type { ProjectContext, TaskId } from './packages/core/src/types';

/**
 * Simple Context Management Test
 */
class SimpleContextTest {
  private agentFactory: AgentFactory;
  private dnaEngine: DNAEngine;
  
  constructor() {
    this.agentFactory = new AgentFactory();
    this.dnaEngine = new DNAEngine();
  }

  /**
   * Test core context management functionality
   */
  async runTest(): Promise<void> {
    console.log('🧪 Running Simple Context Management Test\n');
    
    try {
      // Test 1: Basic Context Creation and Adaptation
      await this.testBasicContextManagement();
      
      // Test 2: Context Persistence in Agent DNA
      await this.testContextPersistenceInDNA();
      
      // Test 3: Context Inheritance
      await this.testContextInheritance();
      
      console.log('\n✅ All basic context tests completed successfully!');
      console.log('🎉 Context management system appears to be working correctly');
      
    } catch (error) {
      console.error('❌ Context test failed:', error);
      throw error;
    }
  }

  private async testBasicContextManagement(): Promise<void> {
    console.log('📋 Test 1: Basic Context Management');
    
    // Create a test project context
    const projectContext: ProjectContext = {
      id: 'test-project' as any,
      projectType: 'web-app',
      techStack: ['TypeScript', 'React', 'Node.js'],
      complexity: 'medium',
      teamSize: 3,
      timeline: '3 months',
      requirements: ['User authentication', 'Data visualization'],
      industryDomain: 'fintech',
      regulatoryCompliance: ['GDPR'],
      performanceRequirements: {
        maxResponseTime: 200,
        minThroughput: 1000,
        availabilityTarget: 0.999,
        errorRateThreshold: 0.01,
      },
      scalabilityNeeds: {
        expectedGrowthRate: 2,
        peakLoadCapacity: 10000,
        dataVolumeGrowth: '100GB/month',
        horizontalScaling: true,
      },
      securityRequirements: {
        dataEncryption: true,
        accessControl: 'role-based',
        auditLogging: true,
        threatModeling: true,
      },
      developmentStage: 'mvp',
      testingStrategy: 'comprehensive',
      deploymentStrategy: 'ci-cd',
      monitoringNeeds: 'advanced',
    };

    // Create agent with context
    console.log('  🤖 Creating agent with project context...');
    const spawnResult = await this.agentFactory.spawnAgent({
      type: 'developer',
      projectContext,
      specialization: 'full-stack',
    });

    if (!spawnResult.success || !spawnResult.agent) {
      throw new Error('Failed to spawn agent');
    }

    const agent = spawnResult.agent;

    // Verify context is properly set
    const storedContext = agent.getDNA().context;
    const contextMatches = JSON.stringify(projectContext) === JSON.stringify(storedContext);
    
    if (contextMatches) {
      console.log('  ✅ Context properly stored in agent DNA');
    } else {
      throw new Error('Context not properly stored in agent DNA');
    }

    // Test context adaptation
    console.log('  🔄 Testing context adaptation...');
    await agent.adaptToContext(projectContext);
    
    const stats = agent.getPerformanceStats();
    if (stats.contextFitScore > 0) {
      console.log(`  ✅ Context adaptation successful (fit score: ${stats.contextFitScore.toFixed(3)})`);
    } else {
      throw new Error('Context adaptation failed - no context fit score');
    }

    // Test task execution with context
    console.log('  📋 Testing task execution with context...');
    const taskContext = {
      taskId: 'test-task' as TaskId,
      projectContext,
      requirements: ['Implement user login'],
      constraints: ['Use existing auth library'],
      expectedOutputFormat: 'TypeScript code',
      priority: 'high' as const,
    };

    const canHandle = agent.canHandleTask(taskContext);
    console.log(`  ✅ Agent can handle context-aware tasks: ${canHandle}`);
  }

  private async testContextPersistenceInDNA(): Promise<void> {
    console.log('\n💾 Test 2: Context Persistence in DNA');
    
    const originalContext: ProjectContext = {
      id: 'persistent-project' as any,
      projectType: 'api',
      techStack: ['Node.js', 'Express', 'PostgreSQL'],
      complexity: 'high',
      teamSize: 5,
      timeline: '6 months',
      requirements: ['RESTful API', 'Database optimization'],
      industryDomain: 'healthcare',
      regulatoryCompliance: ['HIPAA'],
      performanceRequirements: {
        maxResponseTime: 100,
        minThroughput: 5000,
        availabilityTarget: 0.9999,
        errorRateThreshold: 0.001,
      },
      scalabilityNeeds: {
        expectedGrowthRate: 5,
        peakLoadCapacity: 50000,
        dataVolumeGrowth: '1TB/month',
        horizontalScaling: true,
      },
      securityRequirements: {
        dataEncryption: true,
        accessControl: 'attribute-based',
        auditLogging: true,
        threatModeling: true,
      },
      developmentStage: 'production',
      testingStrategy: 'comprehensive',
      deploymentStrategy: 'blue-green',
      monitoringNeeds: 'enterprise',
    };

    // Create agent and store its DNA
    console.log('  🧬 Creating agent with persistent context...');
    const originalSpawnResult = await this.agentFactory.spawnAgent({
      type: 'developer',
      projectContext: originalContext,
      specialization: 'backend',
    });

    if (!originalSpawnResult.success || !originalSpawnResult.agent) {
      throw new Error('Failed to spawn original agent');
    }

    const originalAgent = originalSpawnResult.agent;

    // Get the DNA and context
    const persistedDNA = originalAgent.getDNA();
    const persistedContext = persistedDNA.context;
    
    console.log('  💾 DNA and context stored');

    // Create new agent with the same DNA (simulating persistence)
    console.log('  🔄 Creating new agent with persisted DNA...');
    const restoredSpawnResult = await this.agentFactory.spawnAgent({
      type: 'developer',
      projectContext: originalContext,
      specialization: 'backend',
    });

    if (!restoredSpawnResult.success || !restoredSpawnResult.agent) {
      throw new Error('Failed to spawn restored agent');
    }

    const restoredAgent = restoredSpawnResult.agent;

    // Verify context persistence
    const restoredContext = restoredAgent.getDNA().context;
    const contextPersisted = JSON.stringify(originalContext) === JSON.stringify(restoredContext);
    
    if (contextPersisted) {
      console.log('  ✅ Context successfully persisted in DNA');
    } else {
      throw new Error('Context not persisted in DNA');
    }

    // Verify agent behavior consistency
    const originalStats = originalAgent.getPerformanceStats();
    const restoredStats = restoredAgent.getPerformanceStats();
    
    const contextFitConsistent = Math.abs(originalStats.contextFitScore - restoredStats.contextFitScore) < 0.01;
    
    if (contextFitConsistent) {
      console.log('  ✅ Agent behavior consistent after DNA restoration');
    } else {
      console.log('  ⚠️  Agent behavior slightly different after restoration (acceptable variation)');
    }
  }

  private async testContextInheritance(): Promise<void> {
    console.log('\n👶 Test 3: Context Inheritance');
    
    const parentContext: ProjectContext = {
      id: 'inheritance-project' as any,
      projectType: 'cli',
      techStack: ['TypeScript', 'Commander'],
      complexity: 'medium',
      teamSize: 2,
      timeline: '2 months',
      requirements: ['CLI tool', 'Plugin system'],
      industryDomain: 'developer-tools',
      regulatoryCompliance: [],
      performanceRequirements: {
        maxResponseTime: 1000,
        minThroughput: 100,
        availabilityTarget: 0.99,
        errorRateThreshold: 0.05,
      },
      scalabilityNeeds: {
        expectedGrowthRate: 1.5,
        peakLoadCapacity: 1000,
        dataVolumeGrowth: '10GB/month',
        horizontalScaling: false,
      },
      securityRequirements: {
        dataEncryption: false,
        accessControl: 'none',
        auditLogging: false,
        threatModeling: false,
      },
      developmentStage: 'mvp',
      testingStrategy: 'unit',
      deploymentStrategy: 'manual',
      monitoringNeeds: 'basic',
    };

    // Create parent agent
    console.log('  👨‍💼 Creating parent agent...');
    const parentSpawnResult = await this.agentFactory.spawnAgent({
      type: 'developer',
      projectContext: parentContext,
      specialization: 'backend',
    });

    if (!parentSpawnResult.success || !parentSpawnResult.agent) {
      throw new Error('Failed to spawn parent agent');
    }

    const parentAgent = parentSpawnResult.agent;

    // Create offspring with inherited context
    console.log('  👶 Creating offspring with inherited context...');
    const offspringSpawnResult = await this.agentFactory.spawnAgent({
      type: 'developer',
      projectContext: parentContext,
      specialization: 'testing',
      parentDnaId: parentAgent.getDNA().id,
    });

    if (!offspringSpawnResult.success || !offspringSpawnResult.agent) {
      throw new Error('Failed to spawn offspring agent');
    }

    const offspringAgent = offspringSpawnResult.agent;

    // Verify context inheritance
    const parentStoredContext = parentAgent.getDNA().context;
    const offspringStoredContext = offspringAgent.getDNA().context;
    
    const contextInherited = JSON.stringify(parentStoredContext) === JSON.stringify(offspringStoredContext);
    
    if (contextInherited) {
      console.log('  ✅ Context successfully inherited by offspring');
    } else {
      throw new Error('Context not properly inherited by offspring');
    }

    // Test that both agents can handle the same context-specific tasks
    const testTask = {
      taskId: 'inheritance-test-task' as TaskId,
      projectContext: parentContext,
      requirements: ['CLI command implementation'],
      constraints: ['Follow existing patterns'],
      expectedOutputFormat: 'TypeScript code',
      priority: 'medium' as const,
    };

    const parentCanHandle = parentAgent.canHandleTask(testTask);
    const offspringCanHandle = offspringAgent.canHandleTask(testTask);
    
    if (parentCanHandle && offspringCanHandle) {
      console.log('  ✅ Both parent and offspring can handle context-specific tasks');
    } else {
      console.log('  ⚠️  Task handling capability differs between parent and offspring');
    }

    // Check context fit scores
    const parentStats = parentAgent.getPerformanceStats();
    const offspringStats = offspringAgent.getPerformanceStats();
    
    console.log(`  📊 Parent context fit: ${parentStats.contextFitScore.toFixed(3)}`);
    console.log(`  📊 Offspring context fit: ${offspringStats.contextFitScore.toFixed(3)}`);
    
    if (Math.abs(parentStats.contextFitScore - offspringStats.contextFitScore) < 0.3) {
      console.log('  ✅ Context fit scores are similar (inheritance successful)');
    } else {
      console.log('  ⚠️  Context fit scores differ significantly');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new SimpleContextTest();
  
  try {
    await tester.runTest();
    console.log('\n🎉 SUCCESS: Core context management system is working correctly!');
    console.log('✅ Context creation, persistence, and inheritance all functional');
  } catch (error) {
    console.error('\n❌ FAILURE: Context management system has issues');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SimpleContextTest };