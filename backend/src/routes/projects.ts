// Project routes
import { Router } from 'express'
import {
  getProjects,
  createProject,
  getProjectById,
  deleteProject,
} from '../controllers/projects'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// All project routes require authentication
router.use(authenticateToken)

router.get('/', getProjects)
router.post('/', createProject)
router.get('/:id', getProjectById)
router.delete('/:id', deleteProject)

export default router
