"use strict";
/**
 * Authentication and Authorization middleware for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitConfig = exports.RateLimitConfig = exports.authenticateWebSocket = exports.optionalAuth = exports.authorize = exports.authenticate = exports.createAuthService = exports.getPermissionsForRole = exports.Permissions = exports.AuthError = exports.AuthService = void 0;
const tslib_1 = require("tslib");
const jwt = tslib_1.__importStar(require("jsonwebtoken"));
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const branded_fix_1 = require("../types/branded-fix");
const zod_1 = require("zod");
/**
 * Authentication service class
 */
class AuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate JWT token
     */
    generateToken = (payload) => {
        const options = {
            expiresIn: this.config.jwtExpiresIn,
            issuer: 'sentra-evolution-api',
            audience: 'sentra-clients',
        };
        return jwt.sign(payload, this.config.jwtSecret, options);
    };
    /**
     * Generate refresh token
     */
    generateRefreshToken = (userId) => {
        const options = {
            expiresIn: this.config.refreshTokenExpiresIn,
            issuer: 'sentra-evolution-api',
            audience: 'sentra-clients',
        };
        return jwt.sign({ userId: userId, type: 'refresh' }, this.config.jwtSecret, options);
    };
    /**
     * Verify and decode JWT token
     */
    verifyToken = (token) => {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret, {
                issuer: 'sentra-evolution-api',
                audience: 'sentra-clients',
            });
            // Validate the payload structure
            const payloadSchema = zod_1.z.object({
                userId: zod_1.z.string(),
                email: zod_1.z.string().email(),
                role: zod_1.z.enum(['admin', 'user', 'readonly']),
                permissions: zod_1.z.array(zod_1.z.string()),
                iat: zod_1.z.number(),
                exp: zod_1.z.number(),
            });
            const parsedPayload = payloadSchema.parse(decoded);
            // Convert string userId to branded UserId type
            return {
                ...parsedPayload,
                userId: (0, branded_fix_1.createUserId)(parsedPayload.userId),
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError('TOKEN_EXPIRED', 'Token has expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthError('INVALID_TOKEN', 'Invalid token');
            }
            else {
                throw new AuthError('AUTH_ERROR', 'Authentication failed');
            }
        }
    };
    /**
     * Hash password with bcrypt
     */
    hashPassword = async (password) => {
        return bcryptjs_1.default.hash(password, this.config.bcryptRounds);
    };
    /**
     * Compare password with hash
     */
    comparePassword = async (password, hash) => {
        return bcryptjs_1.default.compare(password, hash);
    };
}
exports.AuthService = AuthService;
/**
 * Custom authentication error class
 */
class AuthError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 401) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.AuthError = AuthError;
/**
 * Permission definitions for role-based access control
 */
exports.Permissions = {
    // Pattern management
    PATTERN_READ: 'pattern:read',
    PATTERN_CREATE: 'pattern:create',
    PATTERN_UPDATE: 'pattern:update',
    PATTERN_DELETE: 'pattern:delete',
    PATTERN_EVOLVE: 'pattern:evolve',
    // Agent management
    AGENT_READ: 'agent:read',
    AGENT_SPAWN: 'agent:spawn',
    AGENT_UPDATE: 'agent:update',
    AGENT_DELETE: 'agent:delete',
    AGENT_LEARN: 'agent:learn',
    // System monitoring
    METRICS_READ: 'metrics:read',
    EVENTS_READ: 'events:read',
    SYSTEM_HEALTH: 'system:health',
    // Administrative
    USER_MANAGE: 'user:manage',
    SYSTEM_CONFIG: 'system:config',
};
/**
 * Role-based permission mapping
 */
const RolePermissions = {
    admin: Object.values(exports.Permissions),
    user: [
        exports.Permissions.PATTERN_READ,
        exports.Permissions.PATTERN_CREATE,
        exports.Permissions.PATTERN_UPDATE,
        exports.Permissions.PATTERN_EVOLVE,
        exports.Permissions.AGENT_READ,
        exports.Permissions.AGENT_SPAWN,
        exports.Permissions.AGENT_UPDATE,
        exports.Permissions.AGENT_LEARN,
        exports.Permissions.METRICS_READ,
        exports.Permissions.EVENTS_READ,
    ],
    readonly: [
        exports.Permissions.PATTERN_READ,
        exports.Permissions.AGENT_READ,
        exports.Permissions.METRICS_READ,
        exports.Permissions.EVENTS_READ,
    ],
};
/**
 * Get permissions for a role
 */
const getPermissionsForRole = (role) => {
    return RolePermissions[role];
};
exports.getPermissionsForRole = getPermissionsForRole;
/**
 * Authentication middleware factory
 */
const createAuthService = (config) => {
    return new AuthService(config);
};
exports.createAuthService = createAuthService;
/**
 * JWT authentication middleware
 */
const authenticate = (authService) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AuthError('MISSING_TOKEN', 'Authorization token is required');
            }
            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const payload = authService.verifyToken(token);
            // Attach user to request (cast to bypass readonly restriction)
            req.user = payload;
            next();
        }
        catch (error) {
            if (error instanceof AuthError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                    },
                    timestamp: new Date(),
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                    },
                    timestamp: new Date(),
                });
            }
        }
    };
};
exports.authenticate = authenticate;
/**
 * Authorization middleware factory - checks if user has required permissions
 */
const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            const authenticatedReq = req;
            if (!authenticatedReq.user) {
                throw new AuthError('UNAUTHENTICATED', 'User not authenticated', 401);
            }
            const userPermissions = authenticatedReq.user.permissions;
            const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
            if (!hasPermission) {
                throw new AuthError('INSUFFICIENT_PERMISSIONS', `Required permissions: ${requiredPermissions.join(', ')}`, 403);
            }
            next();
        }
        catch (error) {
            if (error instanceof AuthError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                    },
                    timestamp: new Date(),
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                    },
                    timestamp: new Date(),
                });
            }
        }
    };
};
exports.authorize = authorize;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = (authService) => {
    return (req, _res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const payload = authService.verifyToken(token);
                req.user = payload;
            }
            next();
        }
        catch (error) {
            // Continue without authentication if token is invalid
            next();
        }
    };
};
exports.optionalAuth = optionalAuth;
/**
 * WebSocket authentication helper
 */
const authenticateWebSocket = (authService, token) => {
    return new Promise((resolve, reject) => {
        try {
            const payload = authService.verifyToken(token);
            resolve(payload);
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.authenticateWebSocket = authenticateWebSocket;
/**
 * Rate limiting configuration by user role
 */
exports.RateLimitConfig = {
    admin: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
    },
    user: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // 500 requests per window
    },
    readonly: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200, // 200 requests per window
    },
};
/**
 * Get rate limit configuration for user role
 */
const getRateLimitConfig = (role) => {
    return exports.RateLimitConfig[role ?? 'readonly'];
};
exports.getRateLimitConfig = getRateLimitConfig;
//# sourceMappingURL=auth.js.map