# Sentra Backend API

Express.js backend server providing cloud features for the Sentra AI Agent Control Center.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: User registration, login, and profile management
- **Project Management**: Create, list, and manage AI agent projects
- **Cost Tracking**: Track and analyze AI model usage costs
- **Activity Logging**: Record and query project activity events

## Architecture

- **Framework**: Express 5.x with TypeScript
- **Database**: Prisma ORM with SQLite (PostgreSQL-ready)
- **Authentication**: JWT tokens with refresh token support
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Vitest with Supertest (49 integration tests)

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info (authenticated)

### Projects (`/api/projects`)

- `GET /` - List user's projects (authenticated)
- `POST /` - Create new project (authenticated)
- `GET /:id` - Get project by ID (authenticated)
- `DELETE /:id` - Delete project (authenticated)

### Costs (`/api/costs`)

- `POST /` - Log cost entry (authenticated)
- `GET /` - Get costs with optional projectId filter (authenticated)

### Activity (`/api/activity`)

- `POST /` - Log activity event (authenticated)
- `GET /` - Get activity with optional projectId filter (authenticated)

## Development

### Setup

```bash
# Install dependencies (from project root)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET
# - DATABASE_URL

# Run database migrations
npm run db:migrate
```

### Running

```bash
# Development mode (auto-reload)
npm run backend:dev

# Production build
npm run backend:build
npm run backend:start
```

### Testing

```bash
# Run all backend tests
npm run test:backend

# Run tests in watch mode
npm run test -- backend/

# Run tests with coverage
npm run test:coverage -- backend/
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts           # Express app setup
│   ├── controllers/        # Business logic
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── costs.ts
│   │   └── activity.ts
│   ├── routes/             # API routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── costs.ts
│   │   └── activity.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   └── types/              # TypeScript types
│       └── index.ts
├── test-setup.ts           # Test utilities
└── tsconfig.json           # TypeScript config
```

## Security Features

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT access tokens (1 hour expiry)
- Refresh tokens (7 day expiry)
- Token validation on protected routes

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### API Security
- Helmet for security headers
- CORS enabled
- Rate limiting (100 requests per 15 minutes)
- Input validation on all endpoints

## Environment Variables

Required:
- `JWT_SECRET` - Secret for signing JWT tokens
- `DATABASE_URL` - Prisma database connection URL

Optional:
- `JWT_REFRESH_SECRET` - Separate secret for refresh tokens (defaults to JWT_SECRET)
- `PORT` - Server port (default: 3001)

## Testing

The backend has 49 comprehensive integration tests covering:

### Authentication Tests (24 tests)
- User registration (valid/invalid email, weak password, duplicates)
- User login (valid/invalid credentials)
- Token refresh (valid/invalid tokens)
- Current user endpoint (with/without auth)

### Project Tests (15 tests)
- List projects (empty, multiple, ownership)
- Create projects (valid/invalid data)
- Get project by ID (access control)
- Delete project (access control)

### Cost & Activity Tests (10 tests)
- Create cost/activity entries
- Get costs/activities with filtering
- Access control validation

## API Response Formats

### Success Response
```typescript
{
  // Endpoint-specific data
  user?: { id, email, name }
  project?: { id, name, path, userId, settings, createdAt, updatedAt }
  projects?: Project[]
  cost?: { id, projectId, amount, model, provider, inputTokens, outputTokens, timestamp }
  costs?: Cost[]
  activity?: { id, projectId, type, message, metadata, timestamp }
  activities?: Activity[]
}
```

### Error Response
```typescript
{
  error: string
  details?: any  // Optional error details
}
```

## Integration with Frontend

The backend is designed to be consumed by:

1. **Tauri Desktop App** - Native macOS/Windows/Linux apps
2. **Next.js Web App** - Browser-based interface
3. **Mobile Apps** (future) - iOS/Android apps

All endpoints return JSON and use standard HTTP status codes.

## Production Deployment

### Database Migration

For production, migrate from SQLite to PostgreSQL:

1. Update Prisma schema datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update DATABASE_URL:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

3. Run migrations:
```bash
npm run db:migrate
```

### Build and Deploy

```bash
# Build TypeScript
npm run backend:build

# Run production server
NODE_ENV=production npm run backend:start
```

### Environment Setup

- Set strong JWT secrets (use random 64-character strings)
- Enable HTTPS (use reverse proxy like nginx)
- Set up monitoring and logging
- Configure CORS for your domains only
- Increase rate limits if needed

## Contributing

Follow TDD approach:
1. Write tests FIRST
2. Verify tests FAIL
3. Write implementation
4. Verify tests PASS
5. Refactor as needed

All code must:
- Pass TypeScript strict mode
- Have 90%+ test coverage
- Follow existing code style
- Include JSDoc comments

---

**Created**: 2025-11-13
**Branch**: Created by Glen Barnhardt with the help of Claude Code
