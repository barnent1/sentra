/**
 * Authentication and Authorization middleware for Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { Request, Response, NextFunction } from 'express';
import type { UserId } from '@sentra/types';
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
export declare class AuthService {
    private readonly config;
    constructor(config: AuthConfig);
    /**
     * Generate JWT token
     */
    readonly generateToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
    /**
     * Generate refresh token
     */
    readonly generateRefreshToken: (userId: UserId) => string;
    /**
     * Verify and decode JWT token
     */
    readonly verifyToken: (token: string) => JwtPayload;
    /**
     * Hash password with bcrypt
     */
    readonly hashPassword: (password: string) => Promise<string>;
    /**
     * Compare password with hash
     */
    readonly comparePassword: (password: string, hash: string) => Promise<boolean>;
}
/**
 * Custom authentication error class
 */
export declare class AuthError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
/**
 * Permission definitions for role-based access control
 */
export declare const Permissions: {
    readonly PATTERN_READ: "pattern:read";
    readonly PATTERN_CREATE: "pattern:create";
    readonly PATTERN_UPDATE: "pattern:update";
    readonly PATTERN_DELETE: "pattern:delete";
    readonly PATTERN_EVOLVE: "pattern:evolve";
    readonly AGENT_READ: "agent:read";
    readonly AGENT_SPAWN: "agent:spawn";
    readonly AGENT_UPDATE: "agent:update";
    readonly AGENT_DELETE: "agent:delete";
    readonly AGENT_LEARN: "agent:learn";
    readonly METRICS_READ: "metrics:read";
    readonly EVENTS_READ: "events:read";
    readonly SYSTEM_HEALTH: "system:health";
    readonly USER_MANAGE: "user:manage";
    readonly SYSTEM_CONFIG: "system:config";
};
export type Permission = typeof Permissions[keyof typeof Permissions];
/**
 * Get permissions for a role
 */
export declare const getPermissionsForRole: (role: JwtPayload["role"]) => readonly Permission[];
/**
 * Authentication middleware factory
 */
export declare const createAuthService: (config: AuthConfig) => AuthService;
/**
 * JWT authentication middleware
 */
export declare const authenticate: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Authorization middleware factory - checks if user has required permissions
 */
export declare const authorize: (...requiredPermissions: Permission[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export declare const optionalAuth: (authService: AuthService) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * WebSocket authentication helper
 */
export declare const authenticateWebSocket: (authService: AuthService, token: string) => Promise<JwtPayload>;
/**
 * Rate limiting configuration by user role
 */
export declare const RateLimitConfig: {
    readonly admin: {
        readonly windowMs: number;
        readonly max: 1000;
    };
    readonly user: {
        readonly windowMs: number;
        readonly max: 500;
    };
    readonly readonly: {
        readonly windowMs: number;
        readonly max: 200;
    };
};
/**
 * Get rate limit configuration for user role
 */
export declare const getRateLimitConfig: (role?: JwtPayload["role"]) => {
    readonly windowMs: number;
    readonly max: 1000;
} | {
    readonly windowMs: number;
    readonly max: 500;
} | {
    readonly windowMs: number;
    readonly max: 200;
};
//# sourceMappingURL=auth.d.ts.map