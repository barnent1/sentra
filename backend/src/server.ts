// Sentra Backend API Server
// Express server for cloud features (authentication, projects, costs, activity)
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/error-handler'

// Routes
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import projectRoutes from './routes/projects'
import agentRoutes from './routes/agents'
import costRoutes from './routes/costs'
import activityRoutes from './routes/activity'
import settingsRoutes from './routes/settings'
import githubRoutes from './routes/github'

// Environment validation
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'ENCRYPTION_SECRET']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`)
    process.exit(1)
  }
}

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express()

  // Security middleware
  app.use(helmet()) // Security headers
  app.use(cors()) // CORS support

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later',
  })
  app.use('/api/', limiter)

  // Body parsing
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Logging
  app.use(requestLogger)

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/agents', agentRoutes)
  app.use('/api/costs', costRoutes)
  app.use('/api/activity', activityRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/github', githubRoutes)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

/**
 * Start the server
 */
export function startServer(port: number = 3001): void {
  const app = createApp()

  app.listen(port, () => {
    console.log(`🚀 Sentra Backend API Server running on port ${port}`)
    console.log(`   Health check: http://localhost:${port}/health`)
    console.log(`   API endpoint: http://localhost:${port}/api`)
  })
}

// Start server if running directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001', 10)
  startServer(port)
}
