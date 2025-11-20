/**
 * GitHub Routes
 *
 * API routes for GitHub PR review functionality
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPullRequest,
  getPRDiff,
  approvePullRequest,
  requestChangesPullRequest,
  mergePullRequest,
} from '../controllers/github';

const router = express.Router();

// All GitHub routes require authentication
router.get('/pr/:owner/:repo/:number', authenticateToken, getPullRequest);
router.get('/pr/:owner/:repo/:number/diff', authenticateToken, getPRDiff);
router.post('/pr/:owner/:repo/:number/approve', authenticateToken, approvePullRequest);
router.post('/pr/:owner/:repo/:number/request-changes', authenticateToken, requestChangesPullRequest);
router.post('/pr/:owner/:repo/:number/merge', authenticateToken, mergePullRequest);

export default router;
