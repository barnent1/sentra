# Database Documentation

This document describes the database architecture, setup, and usage for the Quetrex project.

## Overview

Quetrex uses **Prisma ORM** with:
- **SQLite** for local development (fast, file-based)
- **PostgreSQL** for production (scalable, cloud-ready)

## Database Schema

### Models

1. **User**
   - id: String (cuid)
   - email: String (unique)
   - name: String (optional)
   - createdAt: DateTime
   - updatedAt: DateTime

2. **Project**
   - id: String (cuid)
   - name: String
   - path: String
   - userId: String (foreign key)
   - settings: JSON (as string)
   - createdAt: DateTime
   - updatedAt: DateTime

3. **Agent**
   - id: String (cuid)
   - projectId: String (foreign key)
   - status: String (running, completed, failed)
   - startTime: DateTime
   - endTime: DateTime (optional)
   - logs: JSON array (as string)
   - error: String (optional)
   - createdAt: DateTime
   - updatedAt: DateTime

4. **Cost**
   - id: String (cuid)
   - projectId: String (foreign key)
   - amount: Float
   - model: String
   - provider: String (openai, anthropic)
   - inputTokens: Int (optional)
   - outputTokens: Int (optional)
   - timestamp: DateTime

5. **Activity**
   - id: String (cuid)
   - projectId: String (foreign key)
   - type: String (agent_started, agent_completed, agent_failed, cost_alert, etc.)
   - message: String
   - metadata: JSON (as string)
   - timestamp: DateTime

### Relationships

- User has many Projects
- Project has many Agents, Costs, and Activities
- Cascade delete: Deleting a User deletes their Projects; deleting a Project deletes its Agents, Costs, and Activities

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `prisma` - Prisma CLI
- `@prisma/client` - Prisma Client for database queries
- `dotenv` - Environment variable loading

### 2. Configure Environment

Create `.env` file (already exists):

```bash
# Development (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 3. Run Migrations

Apply database schema:

```bash
npm run db:migrate
```

This creates/updates the database tables to match the schema.

### 4. Seed Development Data (Optional)

Populate database with sample data:

```bash
npm run db:seed
```

This creates:
- 2 sample users
- 3 sample projects
- 3 sample agents (completed, running, failed)
- 5 cost records
- 6 activity records

## Usage

### Database Service

The `DatabaseService` class provides type-safe CRUD operations for all models.

```typescript
import { db } from '@/services/database';

// Create a user
const user = await db.createUser({
  email: 'user@example.com',
  name: 'Test User',
});

// Create a project
const project = await db.createProject({
  name: 'My Project',
  path: '/path/to/project',
  userId: user.id,
  settings: {
    notifications: { enabled: true, voice: true },
    theme: 'dark',
  },
});

// Get project with relations
const fullProject = await db.getProjectById(project.id, {
  includeUser: true,
  includeAgents: true,
  includeCosts: true,
  includeActivities: true,
});

// Track costs
await db.createCost({
  projectId: project.id,
  amount: 0.045,
  model: 'gpt-4o',
  provider: 'openai',
  inputTokens: 1500,
  outputTokens: 800,
});

// Get total project cost
const totalCost = await db.getTotalCostByProject(project.id);

// Create activity log
await db.createActivity({
  projectId: project.id,
  type: 'agent_started',
  message: 'Agent started working on issue #123',
  metadata: { issueNumber: 123, estimatedCost: 0.5 },
});

// Get recent activities for user
const recentActivities = await db.getRecentActivities(user.id, 10);
```

### Transactions

Use transactions for atomic operations:

```typescript
await db.transaction(async (tx) => {
  const project = await tx.project.create({
    data: { name: 'New Project', path: '/path', userId: user.id },
  });

  await tx.activity.create({
    data: {
      projectId: project.id,
      type: 'project_created',
      message: 'Project created',
    },
  });

  // Both operations succeed or both fail
});
```

### Bulk Operations

For performance-critical operations:

```typescript
// Bulk create costs (efficient for large batches)
await db.bulkCreateCosts([
  { projectId: project.id, amount: 0.01, model: 'gpt-4o', provider: 'openai' },
  { projectId: project.id, amount: 0.02, model: 'claude-sonnet-4-5', provider: 'anthropic' },
  // ... many more
]);

// Bulk create activities
await db.bulkCreateActivities([
  { projectId: project.id, type: 'agent_started', message: 'Agent 1 started' },
  { projectId: project.id, type: 'agent_started', message: 'Agent 2 started' },
  // ... many more
]);
```

## Development Commands

```bash
# Run migrations (apply schema changes)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (⚠️ DESTRUCTIVE - deletes all data)
npm run db:reset

# Open Prisma Studio (GUI for database)
npx prisma studio
```

## Testing

Tests use a separate SQLite database for isolation:

```typescript
// In tests
import { setupTestDatabase, clearTestDatabase } from '@/tests/setup/database.setup';

let prisma: PrismaClient;
let db: DatabaseService;

beforeAll(async () => {
  prisma = await setupTestDatabase();
  db = DatabaseService.createTestInstance(prisma);
});

beforeEach(async () => {
  await clearTestDatabase(prisma);
});
```

## Production Deployment

### PostgreSQL Setup

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE quetrex;
   CREATE USER quetrex_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE quetrex TO quetrex_user;
   ```

2. **Update environment variable**:
   ```bash
   DATABASE_URL="postgresql://quetrex_user:secure_password@localhost:5432/quetrex"
   ```

3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

### Connection Pooling

For production with many concurrent users, use connection pooling:

```typescript
// Production prisma client configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool for production
  pool: {
    min: 2,
    max: 10,
  },
});
```

## Migrations

### Creating Migrations

When you change the schema in `prisma/schema.prisma`:

```bash
# Create and apply migration
npm run db:migrate

# Or manually
npx prisma migrate dev --name describe_your_change
```

### Migration Best Practices

1. **Always test migrations** on a copy of production data
2. **Never edit migration files** after they've been applied
3. **Use descriptive names**: `add_user_preferences`, `create_billing_table`
4. **Backup production database** before applying migrations
5. **Deploy migrations** before deploying code changes

## Troubleshooting

### "Database does not exist"

Run migrations:
```bash
npm run db:migrate
```

### "Table not found"

Reset and recreate:
```bash
npm run db:reset
```

### "Connection refused"

Check DATABASE_URL in `.env` file.

### Test database issues

Remove test database and run tests again:
```bash
rm -f prisma/test.db
npm test
```

## Schema Changes

To modify the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update TypeScript types if needed
4. Update tests to match new schema
5. Update seed script if needed

## Performance Tips

1. **Use indexes** on frequently queried fields (already defined in schema)
2. **Use bulk operations** for inserting many records
3. **Use transactions** to reduce round trips
4. **Paginate** large result sets (use limit/offset)
5. **Select only needed fields** with Prisma's `select` option
6. **Use relations wisely** - only include when needed

## Reference

- [Prisma Documentation](https://www.prisma.io/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
