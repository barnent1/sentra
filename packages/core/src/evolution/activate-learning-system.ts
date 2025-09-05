#!/usr/bin/env node
/**
 * Evolutionary Learning System Activation Script
 * 
 * This script activates and demonstrates the complete evolutionary learning system,
 * showing agents learning and improving over time with cross-project knowledge transfer.
 * 
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { runEvolutionIntegrationTest } from './evolution-integration-test';

async function main(): Promise<void> {
  console.log('🧬 SENTRA EVOLUTIONARY LEARNING SYSTEM ACTIVATION');
  console.log('================================================\n');
  
  console.log('🎯 Mission: Activate and validate sophisticated evolutionary learning system');
  console.log('📋 Components: DNA evolution, cross-project learning, performance measurement');
  console.log('⚡ Goal: Demonstrate agents becoming smarter with experience\n');

  try {
    await runEvolutionIntegrationTest();
    
    console.log('\n🎉 EVOLUTIONARY LEARNING SYSTEM SUCCESSFULLY ACTIVATED!');
    console.log('✅ Agents can now learn and improve from each project');
    console.log('✅ Cross-project knowledge transfer is operational');
    console.log('✅ Performance metrics show measurable improvement');
    console.log('✅ Real-time learning events are broadcast via WebSocket');
    
  } catch (error) {
    console.error('\n❌ EVOLUTIONARY LEARNING SYSTEM ACTIVATION FAILED:');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;