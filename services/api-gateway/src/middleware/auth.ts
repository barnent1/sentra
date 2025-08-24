import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
        role: string;
    };
}

export const authMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token not provided',
            });
            return;
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        // Attach user information to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
        };

        // Log successful authentication
        logger.debug('User authenticated successfully', {
            userId: req.user.id,
            username: req.user.username,
            endpoint: req.path,
        });

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn('Token expired', {
                endpoint: req.path,
                userAgent: req.get('user-agent'),
                ip: req.ip,
            });
            
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn('Invalid token', {
                endpoint: req.path,
                userAgent: req.get('user-agent'),
                ip: req.ip,
            });
            
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
            return;
        }

        logger.error('Authentication error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: req.path,
            userAgent: req.get('user-agent'),
            ip: req.ip,
        });

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication service error',
        });
    }
};

export const optionalAuthMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No auth header provided, continue without authentication
        next();
        return;
    }

    // Auth header provided, attempt authentication
    authMiddleware(req, res, next);
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Insufficient permissions', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                endpoint: req.path,
            });

            res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                requiredRoles: roles,
                userRole: req.user.role,
            });
            return;
        }

        next();
    };
};

export const requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }

        // TODO: Implement permission checking logic
        // For now, allow all authenticated users
        next();
    };
};

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'API key required',
        });
        return;
    }

    // TODO: Implement API key validation
    // For now, accept any non-empty API key
    if (apiKey.trim() === '') {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key',
        });
        return;
    }

    next();
};