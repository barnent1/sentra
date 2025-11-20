// Dashboard routes
import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// All dashboard routes require authentication
router.use(authenticateToken)

router.get('/', getDashboard)

export default router
