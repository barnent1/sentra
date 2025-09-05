#!/usr/bin/env tsx
/**
 * Main database seeding script for Sentra Evolutionary Agent System
 * Runs all seed scripts in proper order
 */
import { testConnection } from './utils/connection';
import { runEvolutionSeeds } from './seeds/evolution-seed';
async function runAllSeeds() {
    console.log('🌱 Starting database seeding...');
    try {
        // Test database connection first
        const connectionOk = await testConnection();
        if (!connectionOk) {
            throw new Error('Database connection failed');
        }
        console.log('✅ Database connection verified');
        // Run evolution-specific seeds
        await runEvolutionSeeds();
        console.log('🎉 All seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}
// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllSeeds();
}
//# sourceMappingURL=seed.js.map