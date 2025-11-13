// Cost routes
import { Router } from 'express'
import { createCost, getCosts } from '../controllers/costs'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// All cost routes require authentication
router.use(authenticateToken)

router.post('/', createCost)
router.get('/', getCosts)

export default router
