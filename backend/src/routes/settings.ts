/**
 * Settings Routes
 *
 * API routes for user settings management
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSettings, updateSettings, validateKeys } from '../controllers/settings';

const router = express.Router();

// All settings routes require authentication
router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, updateSettings);
router.post('/validate', authenticateToken, validateKeys);

export default router;
