import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validationHandler } from '../middleware/validation';
import { SecurityMiddleware } from '../middleware/security';

const router = Router();
const authController = new AuthController();
const securityMiddleware = new SecurityMiddleware();

// User registration
router.post('/register',
  securityMiddleware.validateContentType(['application/json']),
  securityMiddleware.validateRequestSize(1024 * 1024), // 1MB limit
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens'),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('First name must be less than 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    body('acceptTerms')
      .equals('true')
      .withMessage('Terms of service must be accepted')
  ],
  validationHandler,
  authController.register
);

// User login
router.post('/login',
  securityMiddleware.validateContentType(['application/json']),
  securityMiddleware.createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes per IP
    keyGenerator: (req) => `login:${req.ip}:${req.body.email || 'unknown'}`
  }),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('deviceInfo')
      .optional()
      .isObject()
      .withMessage('Device info must be an object'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean')
  ],
  validationHandler,
  authController.login
);

// Verify MFA
router.post('/verify-mfa',
  securityMiddleware.validateContentType(['application/json']),
  securityMiddleware.createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 MFA attempts per 5 minutes per session
    keyGenerator: (req) => `mfa:${req.body.sessionId}`
  }),
  [
    body('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required'),
    body('token')
      .matches(/^\d{6}$/)
      .withMessage('MFA token must be 6 digits'),
    body('method')
      .isIn(['totp', 'backup_code'])
      .withMessage('MFA method must be totp or backup_code')
  ],
  validationHandler,
  authController.verifyMFA
);

// Refresh token
router.post('/refresh',
  securityMiddleware.validateContentType(['application/json']),
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  validationHandler,
  authController.refreshToken
);

// Logout
router.post('/logout',
  authController.logout
);

// Logout from all devices
router.post('/logout-all',
  authController.logoutAll
);

// Request password reset
router.post('/forgot-password',
  securityMiddleware.createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // 3 password reset requests per 15 minutes per IP
    keyGenerator: (req) => `password_reset:${req.ip}`
  }),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  validationHandler,
  authController.forgotPassword
);

// Reset password
router.post('/reset-password',
  securityMiddleware.validateContentType(['application/json']),
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character')
  ],
  validationHandler,
  authController.resetPassword
);

// Change password (authenticated)
router.post('/change-password',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character')
  ],
  validationHandler,
  authController.changePassword
);

// Verify email
router.get('/verify-email/:token',
  [
    param('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ],
  validationHandler,
  authController.verifyEmail
);

// Resend email verification
router.post('/resend-verification',
  securityMiddleware.createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 2, // 2 verification emails per 5 minutes per IP
    keyGenerator: (req) => `email_verification:${req.ip}`
  }),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  validationHandler,
  authController.resendVerification
);

// Get user profile (authenticated)
router.get('/profile',
  authController.requireAuth,
  authController.getProfile
);

// Update user profile (authenticated)
router.put('/profile',
  authController.requireAuth,
  securityMiddleware.validateContentType(['application/json']),
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('First name must be less than 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object')
  ],
  validationHandler,
  authController.updateProfile
);

// Get user sessions (authenticated)
router.get('/sessions',
  authController.requireAuth,
  authController.getSessions
);

// Revoke specific session (authenticated)
router.delete('/sessions/:sessionId',
  authController.requireAuth,
  [
    param('sessionId')
      .isUUID()
      .withMessage('Valid session ID is required')
  ],
  validationHandler,
  authController.revokeSession
);

// Get security events (authenticated)
router.get('/security-events',
  authController.requireAuth,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('Offset must be non-negative'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be low, medium, high, or critical')
  ],
  validationHandler,
  authController.getSecurityEvents
);

// Check username availability
router.get('/check-username/:username',
  securityMiddleware.createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10, // 10 checks per minute per IP
    keyGenerator: (req) => `username_check:${req.ip}`
  }),
  [
    param('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens')
  ],
  validationHandler,
  authController.checkUsername
);

// Check email availability
router.get('/check-email/:email',
  securityMiddleware.createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10, // 10 checks per minute per IP
    keyGenerator: (req) => `email_check:${req.ip}`
  }),
  [
    param('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  validationHandler,
  authController.checkEmail
);

export default router;