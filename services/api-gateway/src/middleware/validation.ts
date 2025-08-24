import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const validationErrors: any[] = [];

        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body);
            if (error) {
                validationErrors.push({
                    location: 'body',
                    messages: error.details.map(detail => detail.message),
                });
            }
        }

        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query);
            if (error) {
                validationErrors.push({
                    location: 'query',
                    messages: error.details.map(detail => detail.message),
                });
            }
        }

        // Validate route parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params);
            if (error) {
                validationErrors.push({
                    location: 'params',
                    messages: error.details.map(detail => detail.message),
                });
            }
        }

        if (validationErrors.length > 0) {
            logger.warn('Validation failed', {
                url: req.url,
                method: req.method,
                errors: validationErrors,
            });

            res.status(400).json({
                error: 'Validation Error',
                message: 'Request validation failed',
                details: validationErrors,
            });
            return;
        }

        next();
    };
};