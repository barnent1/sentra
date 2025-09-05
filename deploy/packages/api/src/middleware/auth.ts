/**
 * Authentication and Authorization middleware for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserId } from '@sentra/types';
import { createUserId } from '../types/branded-fix';
import { z } from 'zod';

/**
 * JWT payload interface with branded types
 */
export interface JwtPayload {
  readonly userId: UserId;
  readonly email: string;
  readonly role: 'admin' | 'user' | 'readonly';
  readonly permissions: readonly string[];
  readonly iat: number;
  readonly exp: number;
}

/**
 * Extended Express Request with user context
 */
export interface AuthenticatedRequest extends Request {
  readonly user: JwtPayload;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly refreshTokenExpiresIn: string;
  readonly bcryptRounds: number;
}

/**
 * Authentication service class
 */
export class AuthService {
  private readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Generate JWT token
   */
  public readonly generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    const options: jwt.SignOptions = {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'sentra-evolution-api',
      audience: 'sentra-clients',
    } as jwt.SignOptions;
    return jwt.sign(payload as Record<string, any>, this.config.jwtSecret, options);
  };

  /**
   * Generate refresh token
   */
  public readonly generateRefreshToken = (userId: UserId): string => {
    const options: jwt.SignOptions = {
      expiresIn: this.config.refreshTokenExpiresIn,
      issuer: 'sentra-evolution-api',
      audience: 'sentra-clients',
    } as jwt.SignOptions;
    return jwt.sign({ userId: userId as string, type: 'refresh' }, this.config.jwtSecret, options);
  };

  /**
   * Verify and decode JWT token
   */
  public readonly verifyToken = (token: string): JwtPayload => {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: 'sentra-evolution-api',
        audience: 'sentra-clients',
      }) as JwtPayload;

      // Validate the payload structure
      const payloadSchema = z.object({
        userId: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'user', 'readonly']),
        permissions: z.array(z.string()),
        iat: z.number(),
        exp: z.number(),
      });

      const parsedPayload = payloadSchema.parse(decoded);
      // Convert string userId to branded UserId type
      return {
        ...parsedPayload,
        userId: createUserId(parsedPayload.userId),
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('TOKEN_EXPIRED', 'Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('INVALID_TOKEN', 'Invalid token');
      } else {
        throw new AuthError('AUTH_ERROR', 'Authentication failed');
      }
    }
  };

  /**
   * Hash password with bcrypt
   */
  public readonly hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, this.config.bcryptRounds);
  };

  /**
   * Compare password with hash
   */
  public readonly comparePassword = async (
    password: string,
    hash: string
  ): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  };
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Permission definitions for role-based access control
 */
export const Permissions = {
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
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Role-based permission mapping
 */
const RolePermissions: Record<JwtPayload['role'], readonly Permission[]> = {
  admin: Object.values(Permissions),
  user: [
    Permissions.PATTERN_READ,
    Permissions.PATTERN_CREATE,
    Permissions.PATTERN_UPDATE,
    Permissions.PATTERN_EVOLVE,
    Permissions.AGENT_READ,
    Permissions.AGENT_SPAWN,
    Permissions.AGENT_UPDATE,
    Permissions.AGENT_LEARN,
    Permissions.METRICS_READ,
    Permissions.EVENTS_READ,
  ],
  readonly: [
    Permissions.PATTERN_READ,
    Permissions.AGENT_READ,
    Permissions.METRICS_READ,
    Permissions.EVENTS_READ,
  ],
} as const;

/**
 * Get permissions for a role
 */
export const getPermissionsForRole = (role: JwtPayload['role']): readonly Permission[] => {
  return RolePermissions[role];
};

/**
 * Authentication middleware factory
 */
export const createAuthService = (config: AuthConfig): AuthService => {
  return new AuthService(config);
};

/**
 * JWT authentication middleware
 */
export const authenticate = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('MISSING_TOKEN', 'Authorization token is required');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = authService.verifyToken(token);

      // Attach user to request (cast to bypass readonly restriction)
      (req as any).user = payload;

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date(),
        });
      } else {
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

/**
 * Authorization middleware factory - checks if user has required permissions
 */
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (!authenticatedReq.user) {
        throw new AuthError('UNAUTHENTICATED', 'User not authenticated', 401);
      }

      const userPermissions = authenticatedReq.user.permissions;
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AuthError(
          'INSUFFICIENT_PERMISSIONS',
          `Required permissions: ${requiredPermissions.join(', ')}`,
          403
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date(),
        });
      } else {
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

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = (authService: AuthService) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = authService.verifyToken(token);
        (req as any).user = payload;
      }

      next();
    } catch (error) {
      // Continue without authentication if token is invalid
      next();
    }
  };
};

/**
 * WebSocket authentication helper
 */
export const authenticateWebSocket = (
  authService: AuthService,
  token: string
): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    try {
      const payload = authService.verifyToken(token);
      resolve(payload);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Rate limiting configuration by user role
 */
export const RateLimitConfig = {
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
} as const;

/**
 * Get rate limit configuration for user role
 */
export const getRateLimitConfig = (role?: JwtPayload['role']) => {
  return RateLimitConfig[role ?? 'readonly'];
};