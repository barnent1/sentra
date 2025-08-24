import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import validator from 'validator';
import { logger, SecurityAuditLogger } from '../utils/logger';
import { RateLimiter } from '../utils/redis';

export class SecurityMiddleware {
  // Input sanitization middleware
  inputSanitization = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize query parameters
      if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            req.query[key] = validator.escape(value.trim());
          }
        }
      }

      // Sanitize URL parameters
      if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
          if (typeof value === 'string') {
            req.params[key] = validator.escape(value.trim());
          }
        }
      }

      // Don't sanitize request body here as it might break JSON structure
      // Body validation should be done in route handlers
      
      next();
    } catch (error) {
      logger.error('Input sanitization error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Request processing failed'
      });
    }
  };

  // XSS protection middleware
  xssProtection = (req: Request, res: Response, next: NextFunction): void => {
    const checkXSS = (obj: any, path: string = ''): boolean => {
      if (typeof obj === 'string') {
        // Common XSS patterns
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe\b[^>]*>/gi,
          /<object\b[^>]*>/gi,
          /<embed\b[^>]*>/gi,
          /<link\b[^>]*>/gi,
          /<meta\b[^>]*>/gi
        ];

        for (const pattern of xssPatterns) {
          if (pattern.test(obj)) {
            SecurityAuditLogger.logSecurityViolation({
              type: 'XSS_ATTEMPT',
              description: `XSS pattern detected in ${path}`,
              ipAddress: req.ip,
              severity: 'high',
              additionalData: {
                pattern: pattern.toString(),
                value: obj.substring(0, 100), // Log first 100 chars
                userAgent: req.get('user-agent'),
                path: req.path
              }
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (this.checkXSS(value, `${path}.${key}`)) {
            return true;
          }
        }
      }
      return false;
    };

    try {
      // Check request body for XSS
      if (req.body && this.checkXSS(req.body, 'body')) {
        res.status(400).json({
          error: 'Security Violation',
          message: 'Potential XSS attack detected',
          code: 'XSS_DETECTED'
        });
        return;
      }

      // Check query parameters for XSS
      if (req.query && this.checkXSS(req.query, 'query')) {
        res.status(400).json({
          error: 'Security Violation',
          message: 'Potential XSS attack detected',
          code: 'XSS_DETECTED'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('XSS protection error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Security check failed'
      });
    }
  };

  // SQL injection protection middleware
  sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
    const checkSQLInjection = (obj: any, path: string = ''): boolean => {
      if (typeof obj === 'string') {
        // Common SQL injection patterns
        const sqlPatterns = [
          /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
          /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
          /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
          /((\%27)|(\'))union/gi,
          /union(.*?)select/gi,
          /select(.*?)from/gi,
          /((\%27)|(\'))or(.*?)((\%27)|(\'))/gi,
          /exec(\s|\+)+(s|x)p\w+/gi,
          /(sp_executesql)/gi,
          /(xp_cmdshell)/gi,
          /(insert\s+into)/gi,
          /(delete\s+from)/gi,
          /(update\s+.*set)/gi,
          /(drop\s+table)/gi,
          /(create\s+table)/gi,
          /(alter\s+table)/gi
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(obj)) {
            SecurityAuditLogger.logSecurityViolation({
              type: 'SQL_INJECTION_ATTEMPT',
              description: `SQL injection pattern detected in ${path}`,
              ipAddress: req.ip,
              severity: 'critical',
              additionalData: {
                pattern: pattern.toString(),
                value: obj.substring(0, 100), // Log first 100 chars
                userAgent: req.get('user-agent'),
                path: req.path
              }
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (this.checkSQLInjection(value, `${path}.${key}`)) {
            return true;
          }
        }
      }
      return false;
    };

    try {
      // Check request body for SQL injection
      if (req.body && this.checkSQLInjection(req.body, 'body')) {
        res.status(400).json({
          error: 'Security Violation',
          message: 'Potential SQL injection detected',
          code: 'SQL_INJECTION_DETECTED'
        });
        return;
      }

      // Check query parameters for SQL injection
      if (req.query && this.checkSQLInjection(req.query, 'query')) {
        res.status(400).json({
          error: 'Security Violation',
          message: 'Potential SQL injection detected',
          code: 'SQL_INJECTION_DETECTED'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('SQL injection protection error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Security check failed'
      });
    }
  };

  // Rate limiting by IP and user
  createRateLimiter = (options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipIf?: (req: Request) => boolean;
  }) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (options.skipIf && options.skipIf(req)) {
          next();
          return;
        }

        const key = options.keyGenerator 
          ? options.keyGenerator(req)
          : `rate_limit:${req.ip}`;

        const windowSeconds = Math.floor(options.windowMs / 1000);
        const result = await RateLimiter.checkRateLimit(key, options.maxRequests, windowSeconds);

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });

        if (!result.allowed) {
          SecurityAuditLogger.logSecurityViolation({
            type: 'RATE_LIMIT_EXCEEDED',
            description: `Rate limit exceeded for key: ${key}`,
            ipAddress: req.ip,
            severity: 'medium',
            additionalData: {
              key,
              maxRequests: options.maxRequests,
              windowMs: options.windowMs,
              userAgent: req.get('user-agent'),
              path: req.path
            }
          });

          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
          return;
        }

        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // On error, allow the request to proceed to avoid blocking legitimate traffic
        next();
      }
    };
  };

  // IP whitelist/blacklist middleware
  createIPFilter = (options: {
    whitelist?: string[];
    blacklist?: string[];
    trustProxy?: boolean;
  }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const clientIP = options.trustProxy ? req.ip : req.connection.remoteAddress;
        
        if (!clientIP) {
          logger.warn('Unable to determine client IP address');
          next();
          return;
        }

        // Check blacklist first
        if (options.blacklist && options.blacklist.includes(clientIP)) {
          SecurityAuditLogger.logSecurityViolation({
            type: 'BLACKLISTED_IP_ACCESS',
            description: `Access attempt from blacklisted IP: ${clientIP}`,
            ipAddress: clientIP,
            severity: 'high',
            additionalData: {
              userAgent: req.get('user-agent'),
              path: req.path
            }
          });

          res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied from this IP address'
          });
          return;
        }

        // Check whitelist if configured
        if (options.whitelist && options.whitelist.length > 0) {
          if (!options.whitelist.includes(clientIP)) {
            SecurityAuditLogger.logSecurityViolation({
              type: 'NON_WHITELISTED_IP_ACCESS',
              description: `Access attempt from non-whitelisted IP: ${clientIP}`,
              ipAddress: clientIP,
              severity: 'medium',
              additionalData: {
                userAgent: req.get('user-agent'),
                path: req.path
              }
            });

            res.status(403).json({
              error: 'Forbidden',
              message: 'Access denied from this IP address'
            });
            return;
          }
        }

        next();
      } catch (error) {
        logger.error('IP filtering error:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Security check failed'
        });
      }
    };
  };

  // CSRF protection for state-changing operations
  csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    try {
      const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');

      if (!csrfToken) {
        SecurityAuditLogger.logSecurityViolation({
          type: 'MISSING_CSRF_TOKEN',
          description: 'CSRF token missing for state-changing request',
          ipAddress: req.ip,
          severity: 'medium',
          additionalData: {
            method: req.method,
            path: req.path,
            userAgent: req.get('user-agent')
          }
        });

        res.status(403).json({
          error: 'Forbidden',
          message: 'CSRF token required',
          code: 'CSRF_TOKEN_MISSING'
        });
        return;
      }

      // TODO: Implement CSRF token validation
      // For now, just check that a token is present
      if (typeof csrfToken !== 'string' || csrfToken.length < 16) {
        SecurityAuditLogger.logSecurityViolation({
          type: 'INVALID_CSRF_TOKEN',
          description: 'Invalid CSRF token format',
          ipAddress: req.ip,
          severity: 'high',
          additionalData: {
            method: req.method,
            path: req.path,
            userAgent: req.get('user-agent')
          }
        });

        res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid CSRF token',
          code: 'INVALID_CSRF_TOKEN'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('CSRF protection error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Security check failed'
      });
    }
  };

  // Content type validation
  validateContentType = (allowedTypes: string[] = ['application/json']) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip for GET and HEAD requests
      if (['GET', 'HEAD'].includes(req.method)) {
        next();
        return;
      }

      const contentType = req.get('content-type');
      
      if (!contentType) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Content-Type header required'
        });
        return;
      }

      const isValidType = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isValidType) {
        SecurityAuditLogger.logSecurityViolation({
          type: 'INVALID_CONTENT_TYPE',
          description: `Invalid content type: ${contentType}`,
          ipAddress: req.ip,
          severity: 'low',
          additionalData: {
            contentType,
            allowedTypes,
            path: req.path
          }
        });

        res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
        });
        return;
      }

      next();
    };
  };

  // Request size validation
  validateRequestSize = (maxSizeBytes: number = 10 * 1024 * 1024) => { // 10MB default
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.get('content-length') || '0', 10);

      if (contentLength > maxSizeBytes) {
        SecurityAuditLogger.logSecurityViolation({
          type: 'REQUEST_SIZE_EXCEEDED',
          description: `Request size exceeded limit: ${contentLength} bytes`,
          ipAddress: req.ip,
          severity: 'medium',
          additionalData: {
            contentLength,
            maxSizeBytes,
            path: req.path
          }
        });

        res.status(413).json({
          error: 'Payload Too Large',
          message: `Request size exceeds limit of ${maxSizeBytes} bytes`
        });
        return;
      }

      next();
    };
  };

  // Check for suspicious user agents
  private checkXSS = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi,
        /<link\b[^>]*>/gi,
        /<meta\b[^>]*>/gi
      ];

      return xssPatterns.some(pattern => pattern.test(obj));
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).some(([key, value]) => 
        this.checkXSS(value, `${path}.${key}`)
      );
    }
    return false;
  };

  private checkSQLInjection = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      const sqlPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
        /((\%27)|(\'))union/gi,
        /union(.*?)select/gi,
        /select(.*?)from/gi,
        /((\%27)|(\'))or(.*?)((\%27)|(\'))/gi,
        /exec(\s|\+)+(s|x)p\w+/gi,
        /(sp_executesql)/gi,
        /(xp_cmdshell)/gi
      ];

      return sqlPatterns.some(pattern => pattern.test(obj));
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).some(([key, value]) => 
        this.checkSQLInjection(value, `${path}.${key}`)
      );
    }
    return false;
  };
}