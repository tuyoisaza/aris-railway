import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { supabaseAdmin, createUserClient } from './db.js';
import { log } from '../../utils/logger.js';
import { sendError } from '../../utils/responseHandler.js';
import AppError from '../../utils/errors.js';

// ============================================================
// RATE LIMITERS
// ============================================================

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // [DEV] Set to 1000 for verified testing
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Restart trigger
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: { error: 'Too many authentication attempts, please try again later.' }
});

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        log('API', 'WARN', 'Validation', `Validation failed: ${error.errors?.map(e => e.message).join(', ')}`);
        const details = error.errors?.map(e => ({ field: e.path.join('.'), message: e.message }));
        sendError(res, 'Validation failed', 400, details);
    }
};

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        log('Auth', 'WARN', 'Middleware', 'Missing Authorization header');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        // 1. Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            log('Auth', 'WARN', 'Middleware', `Invalid token: ${error?.message}`);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // 2. Attach User
        req.user = user;

        // 3. Create RLS-scoped Client
        // This client triggers RLS policies as this specific user
        req.userClient = createUserClient(token);

        next();
    } catch (err) {
        log('Auth', 'ERROR', 'Middleware', `Auth error: ${err.message}`);
        sendError(res, 'Internal verification error', 500);
    }
};

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    log('API', 'ERROR', 'Unhandled', `${err.message} ${err.stack || ''}`);

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};
