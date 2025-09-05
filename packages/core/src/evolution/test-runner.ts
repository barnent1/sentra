/**
 * Simple Test Runner for Evolution Integration
 * 
 * This file tests the evolution integration without depending on the full build
 */

import { runEvolutionIntegrationTest } from './evolution-integration-test';

async function main() {
  console.log('🧬 Starting Evolution Integration Test Runner...\n');
  
  try {
    await runEvolutionIntegrationTest();
    console.log('\n✅ Evolution integration test completed successfully!');
  } catch (error) {
    console.error('\n❌ Evolution integration test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}