// Agent routes
import { Router } from 'express'
import { getAgents } from '../controllers/dashboard'
import { streamAgentLogs } from '../controllers/logs'
import { authenticateToken, authenticateSSE } from '../middleware/auth'

const router = Router()

// List agents - standard auth
router.get('/', authenticateToken, getAgents)

// Stream logs - SSE auth (supports query param token)
router.get('/:agentId/logs/stream', authenticateSSE, streamAgentLogs)

export default router
