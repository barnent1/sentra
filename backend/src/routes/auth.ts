// Auth routes
import { Router } from 'express'
import { register, login, refreshToken, getCurrentUser } from '../controllers/auth'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refreshToken)
router.get('/me', authenticateToken, getCurrentUser)

export default router
