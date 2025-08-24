import { Router } from 'express';
import { body, param } from 'express-validator';
import { MFAController } from '../controllers/MFAController';
import { AuthController } from '../controllers/AuthController';
import { validationHandler } from '../middleware/validation';
import { SecurityMiddleware } from '../middleware/security';

const router = Router();
const mfaController = new MFAController();
const authController = new AuthController();
const securityMiddleware = new SecurityMiddleware();

// Setup MFA (TOTP) - requires authentication
router.post('/setup-totp',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  mfaController.setupTOTP
);

// Verify TOTP setup - requires authentication
router.post('/verify-totp-setup',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('token')
      .matches(/^\d{6}$/)
      .withMessage('TOTP token must be 6 digits'),
    body('secret')
      .notEmpty()
      .withMessage('TOTP secret is required')
  ],
  validationHandler,
  mfaController.verifyTOTPSetup
);

// Disable MFA - requires authentication and current password
router.post('/disable',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('password')
      .notEmpty()
      .withMessage('Current password is required'),
    body('confirmDisable')
      .equals('true')
      .withMessage('MFA disable confirmation is required')
  ],
  validationHandler,
  mfaController.disableMFA
);

// Generate new backup codes - requires authentication and MFA verification
router.post('/generate-backup-codes',
  authController.requireAuth,
  authController.requireMFA,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('password')
      .notEmpty()
      .withMessage('Current password is required')
  ],
  validationHandler,
  mfaController.generateBackupCodes
);

// Get MFA status - requires authentication
router.get('/status',
  authController.requireAuth,
  mfaController.getMFAStatus
);

// Verify backup code during login
router.post('/verify-backup-code',
  securityMiddleware.validateContentType(['application/json']),
  securityMiddleware.createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 backup code attempts per 5 minutes per session
    keyGenerator: (req) => `backup_code:${req.body.sessionId}`
  }),
  [
    body('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('backupCode')
      .matches(/^[A-Z0-9]{8}$/)
      .withMessage('Backup code must be 8 uppercase alphanumeric characters')
  ],
  validationHandler,
  mfaController.verifyBackupCode
);

// Get recovery options when MFA is lost
router.post('/recovery-options',
  securityMiddleware.validateContentType(['application/json']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  validationHandler,
  mfaController.getRecoveryOptions
);

// Initiate MFA recovery process
router.post('/initiate-recovery',
  securityMiddleware.createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2, // 2 recovery requests per 15 minutes per IP
    keyGenerator: (req) => `mfa_recovery:${req.ip}`
  }),
  securityMiddleware.validateContentType(['application/json']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('recoveryMethod')
      .isIn(['email', 'support'])
      .withMessage('Recovery method must be email or support')
  ],
  validationHandler,
  mfaController.initiateRecovery
);

// Complete MFA recovery with email verification
router.post('/complete-recovery',
  securityMiddleware.validateContentType(['application/json']),
  [
    body('recoveryToken')
      .notEmpty()
      .withMessage('Recovery token is required'),
    body('newPassword')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('confirmRecovery')
      .equals('true')
      .withMessage('Recovery confirmation is required')
  ],
  validationHandler,
  mfaController.completeRecovery
);

// Test TOTP token (for debugging in development)
if (process.env.NODE_ENV === 'development') {
  router.post('/test-totp',
    authController.requireAuth,
    securityMiddleware.validateContentType(['application/json']),
    [
      body('token')
        .matches(/^\d{6}$/)
        .withMessage('TOTP token must be 6 digits')
    ],
    validationHandler,
    mfaController.testTOTP
  );
}

export default router;