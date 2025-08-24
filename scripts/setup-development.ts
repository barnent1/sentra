#!/usr/bin/env ts-node

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DevelopmentSetup {
  private projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up SENTRA Development Environment\n');

    try {
      // Step 1: Verify prerequisites
      await this.verifyPrerequisites();

      // Step 2: Install dependencies
      await this.installDependencies();

      // Step 3: Setup environment files
      await this.setupEnvironmentFiles();

      // Step 4: Initialize databases
      await this.initializeDatabases();

      // Step 5: Build services
      await this.buildServices();

      // Step 6: Create initial configuration
      await this.createInitialConfiguration();

      console.log('\n✅ Development environment setup complete!');
      console.log('\nNext steps:');
      console.log('1. Start the infrastructure: docker-compose up -d postgres redis rabbitmq');
      console.log('2. Start the services: npm run dev in each service directory');
      console.log('3. Run tests: npm run test:framework in scripts directory');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  private async verifyPrerequisites(): Promise<void> {
    console.log('📋 Verifying prerequisites...');

    const requirements = [
      { name: 'Node.js', command: 'node --version', minVersion: 'v18' },
      { name: 'npm', command: 'npm --version', minVersion: '8' },
      { name: 'Docker', command: 'docker --version', minVersion: '20' },
      { name: 'Docker Compose', command: 'docker-compose --version', minVersion: '2' },
      { name: 'Git', command: 'git --version', minVersion: '2' },
    ];

    for (const req of requirements) {
      try {
        const { stdout } = await execAsync(req.command);
        console.log(`  ✅ ${req.name}: ${stdout.trim()}`);
      } catch (error) {
        throw new Error(`Missing prerequisite: ${req.name}`);
      }
    }
  }

  private async installDependencies(): Promise<void> {
    console.log('\n📦 Installing dependencies...');

    const services = [
      'services/context-engine',
      'services/agent-orchestrator',
      'services/quality-guardian',
      'agents/james',
      'shared/types',
      'scripts',
    ];

    for (const service of services) {
      const servicePath = path.join(this.projectRoot, service);
      
      if (await fs.pathExists(path.join(servicePath, 'package.json'))) {
        console.log(`  📦 Installing dependencies for ${service}...`);
        
        try {
          await execAsync('npm ci', { cwd: servicePath });
          console.log(`  ✅ Dependencies installed for ${service}`);
        } catch (error) {
          console.log(`  ⚠️  Failed to install dependencies for ${service}, trying npm install...`);
          try {
            await execAsync('npm install', { cwd: servicePath });
            console.log(`  ✅ Dependencies installed for ${service} (fallback)`);
          } catch (fallbackError) {
            console.error(`  ❌ Failed to install dependencies for ${service}:`, fallbackError);
          }
        }
      }
    }
  }

  private async setupEnvironmentFiles(): Promise<void> {
    console.log('\n⚙️  Setting up environment files...');

    const envTemplate = `# SENTRA Development Environment Configuration
NODE_ENV=development

# Database Configuration
POSTGRES_PASSWORD=sentra_dev_pass
DATABASE_URL=postgresql://sentra_user:sentra_dev_pass@localhost:5433/sentra

# Redis Configuration
REDIS_PASSWORD=sentra_dev_redis
REDIS_URL=redis://:sentra_dev_redis@localhost:6379

# RabbitMQ Configuration
RABBITMQ_PASSWORD=sentra_dev_rabbit
RABBITMQ_URL=amqp://sentra:sentra_dev_rabbit@localhost:5672

# Security
JWT_SECRET=sentra-dev-jwt-secret-change-in-production
VAULT_ROOT_TOKEN=sentra-dev-token

# External APIs (configure as needed)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Monitoring
GRAFANA_PASSWORD=sentra_admin
PGADMIN_PASSWORD=sentra_admin

# Agent Configuration
MAX_CONCURRENT_AGENTS=5
CONTEXT_RETENTION_HOURS=24
ENABLE_QUALITY_GATES=true

# Context Engine
MAX_CONTEXT_SIZE_MB=50
ENABLE_COMPRESSION=true
SNAPSHOT_INTERVAL_MINUTES=15

# Documentation Cache
DOC_REFRESH_INTERVAL_HOURS=24
ENABLE_PATTERN_EXTRACTION=true

# Quality Gates
MIN_TEST_COVERAGE=80
ENABLE_STRICT_QUALITY_GATES=true
`;

    const envPath = path.join(this.projectRoot, '.env');
    
    if (!(await fs.pathExists(envPath))) {
      await fs.writeFile(envPath, envTemplate);
      console.log('  ✅ Created .env file');
    } else {
      console.log('  ⚠️  .env file already exists, skipping');
    }

    // Create .env.example
    await fs.writeFile(path.join(this.projectRoot, '.env.example'), envTemplate);
    console.log('  ✅ Created .env.example file');
  }

  private async initializeDatabases(): Promise<void> {
    console.log('\n🗄️  Database initialization...');

    // Check if Docker containers are running
    try {
      await execAsync('docker ps --filter name=sentra-postgres --format "{{.Names}}"', { cwd: this.projectRoot });
      console.log('  ℹ️  Database containers should be started with: docker-compose up -d postgres redis rabbitmq');
    } catch (error) {
      console.log('  ℹ️  Database containers not running. Use: docker-compose up -d postgres redis rabbitmq');
    }

    // Create database initialization check script
    const dbCheckScript = `#!/bin/bash
# Database readiness check script
echo "Waiting for PostgreSQL to be ready..."
until docker exec sentra-postgres pg_isready -U sentra_user -d sentra; do
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Waiting for Redis to be ready..."
until docker exec sentra-redis redis-cli ping; do
  sleep 2
done
echo "Redis is ready!"

echo "Waiting for RabbitMQ to be ready..."
until docker exec sentra-rabbitmq rabbitmqctl status; do
  sleep 2
done
echo "RabbitMQ is ready!"

echo "All databases are ready!"
`;

    await fs.writeFile(path.join(this.projectRoot, 'scripts/wait-for-databases.sh'), dbCheckScript);
    await fs.chmod(path.join(this.projectRoot, 'scripts/wait-for-databases.sh'), '755');
    console.log('  ✅ Created database readiness check script');
  }

  private async buildServices(): Promise<void> {
    console.log('\n🔨 Building services...');

    const services = [
      'shared/types',
      'services/context-engine',
      'services/agent-orchestrator',
      'services/quality-guardian',
      'agents/james',
    ];

    for (const service of services) {
      const servicePath = path.join(this.projectRoot, service);
      
      if (await fs.pathExists(path.join(servicePath, 'tsconfig.json'))) {
        console.log(`  🔨 Building ${service}...`);
        
        try {
          await execAsync('npm run build', { cwd: servicePath });
          console.log(`  ✅ Built ${service}`);
        } catch (error) {
          console.log(`  ⚠️  Build failed for ${service}:`, (error as Error).message);
        }
      }
    }
  }

  private async createInitialConfiguration(): Promise<void> {
    console.log('\n⚙️  Creating initial configuration...');

    // Create development configuration files
    const configs = {
      'config/development.json': {
        agents: {
          james: {
            enabled: true,
            maxInstances: 3,
            resourceLimits: {
              memory: '512m',
              cpu: '0.5',
            },
          },
        },
        qualityGates: {
          enforceTests: true,
          minCoverage: 80,
          allowPrisma: false,
          requireDrizzle: true,
        },
        documentation: {
          autoRefresh: true,
          sources: ['nextjs', 'react', 'typescript', 'drizzle'],
        },
      },
      'config/agent-definitions.json': [
        {
          name: 'James Development Agent',
          type: 'code_analyzer',
          version: '1.0.0',
          imageName: 'sentra/james-agent:latest',
          capabilities: [
            'code_analysis',
            'code_generation',
            'context_preservation',
            'documentation_generation',
            'testing',
            'refactoring',
          ],
          resourceRequirements: {
            memory: '512m',
            cpu: '0.5',
          },
          configuration: {
            WORKSPACE_ROOT: '/tmp/james-workspace',
            ENABLE_FILE_WATCHING: 'true',
            MAX_CONTEXT_SIZE_MB: '50',
          },
        },
      ],
    };

    for (const [filePath, content] of Object.entries(configs)) {
      const fullPath = path.join(this.projectRoot, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeJson(fullPath, content, { spaces: 2 });
      console.log(`  ✅ Created ${filePath}`);
    }

    // Create development scripts
    const scripts = {
      'scripts/dev-start.sh': `#!/bin/bash
# Development startup script
echo "Starting SENTRA development environment..."

# Start infrastructure
echo "Starting infrastructure services..."
docker-compose up -d postgres redis rabbitmq vault

# Wait for services to be ready
echo "Waiting for services to be ready..."
./scripts/wait-for-databases.sh

echo "Infrastructure ready! You can now start the application services:"
echo ""
echo "Context Engine:      cd services/context-engine && npm run dev"
echo "Agent Orchestrator:  cd services/agent-orchestrator && npm run dev"
echo "Quality Guardian:    cd services/quality-guardian && npm run dev"
echo ""
echo "To run tests:        cd scripts && npm run test:framework"
`,
      'scripts/dev-stop.sh': `#!/bin/bash
# Development shutdown script
echo "Stopping SENTRA development environment..."
docker-compose down
echo "Development environment stopped."
`,
    };

    for (const [scriptPath, content] of Object.entries(scripts)) {
      const fullPath = path.join(this.projectRoot, scriptPath);
      await fs.writeFile(fullPath, content);
      await fs.chmod(fullPath, '755');
      console.log(`  ✅ Created ${scriptPath}`);
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new DevelopmentSetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { DevelopmentSetup };