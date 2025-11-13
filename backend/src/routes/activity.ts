// Activity routes
import { Router } from 'express'
import { createActivity, getActivities } from '../controllers/activity'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// All activity routes require authentication
router.use(authenticateToken)

router.post('/', createActivity)
router.get('/', getActivities)

export default router
