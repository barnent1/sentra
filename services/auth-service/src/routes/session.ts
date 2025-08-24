import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { SessionController } from '../controllers/SessionController';
import { AuthController } from '../controllers/AuthController';
import { validationHandler } from '../middleware/validation';
import { SecurityMiddleware } from '../middleware/security';

const router = Router();
const sessionController = new SessionController();
const authController = new AuthController();
const securityMiddleware = new SecurityMiddleware();

// Get current session info (authenticated)
router.get('/current',
  authController.requireAuth,
  sessionController.getCurrentSession
);

// Get all user sessions (authenticated)
router.get('/list',
  authController.requireAuth,
  [
    query('includeInactive')
      .optional()
      .isBoolean()
      .toBoolean()
      .withMessage('includeInactive must be a boolean'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .toInt()
      .withMessage('Limit must be between 1 and 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('Offset must be non-negative')
  ],
  validationHandler,
  sessionController.getUserSessions
);

// Extend current session (authenticated)
router.post('/extend',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('extendBy')
      .optional()
      .isInt({ min: 300, max: 86400 }) // 5 minutes to 24 hours
      .withMessage('Extension must be between 5 minutes and 24 hours (in seconds)')
  ],
  validationHandler,
  sessionController.extendSession
);

// Revoke specific session (authenticated)
router.delete('/:sessionId',
  authController.requireAuth,
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required')
  ],
  validationHandler,
  sessionController.revokeSession
);

// Revoke all other sessions (authenticated)
router.delete('/revoke/others',
  authController.requireAuth,
  sessionController.revokeOtherSessions
);

// Revoke all sessions (authenticated)
router.delete('/revoke/all',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('password')
      .notEmpty()
      .withMessage('Current password is required'),
    body('confirmRevoke')
      .equals('true')
      .withMessage('Revoke confirmation is required')
  ],
  validationHandler,
  sessionController.revokeAllSessions
);

// Report suspicious session (authenticated)
router.post('/:sessionId/report',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('reason')
      .isIn(['unauthorized_access', 'suspicious_location', 'unknown_device', 'other'])
      .withMessage('Reason must be one of: unauthorized_access, suspicious_location, unknown_device, other'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  validationHandler,
  sessionController.reportSuspiciousSession
);

// Get session activity (authenticated)
router.get('/:sessionId/activity',
  authController.requireAuth,
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('Offset must be non-negative')
  ],
  validationHandler,
  sessionController.getSessionActivity
);

// Update session metadata (authenticated)
router.patch('/:sessionId/metadata',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('deviceType')
      .optional()
      .isIn(['desktop', 'mobile', 'tablet', 'other'])
      .withMessage('Device type must be desktop, mobile, tablet, or other'),
    body('timezone')
      .optional()
      .matches(/^[A-Za-z]+\/[A-Za-z_]+$/)
      .withMessage('Timezone must be in format Region/City')
  ],
  validationHandler,
  sessionController.updateSessionMetadata
);

// Lock session (requires MFA)
router.post('/:sessionId/lock',
  authController.requireAuth,
  authController.requireMFA,
  securityMiddleware.validateContentType(['application/json']),
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reason must be less than 200 characters')
  ],
  validationHandler,
  sessionController.lockSession
);

// Unlock session (requires MFA)
router.post('/:sessionId/unlock',
  authController.requireAuth,
  authController.requireMFA,
  securityMiddleware.validateContentType(['application/json']),
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required')
  ],
  validationHandler,
  sessionController.unlockSession
);

// Get session statistics (authenticated)
router.get('/stats/summary',
  authController.requireAuth,
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Period must be day, week, month, or year')
  ],
  validationHandler,
  sessionController.getSessionStats
);

// Export session history (authenticated, requires MFA)
router.get('/export/history',
  authController.requireAuth,
  authController.requireMFA,
  [
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
    query('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('End date must be in ISO 8601 format')
  ],
  validationHandler,
  sessionController.exportSessionHistory
);

export default router;