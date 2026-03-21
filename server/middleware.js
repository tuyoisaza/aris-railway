import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from './db.js';
import { verifyToken } from './prisma/auth.js';
import { log } from './utils/logger.js';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: { error: 'Too many authentication attempts, please try again later.' }
});

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        log('API', 'WARN', 'Validation', `Validation failed: ${error.errors?.map(e => e.message).join(', ')}`);
        const details = error.errors?.map(e => ({ field: e.path.join('.'), message: e.message }));
        res.status(400).json({ error: 'Validation failed', details });
    }
};

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        log('Auth', 'WARN', 'Middleware', 'Missing Authorization header');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

    try {
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            log('Auth', 'WARN', 'Middleware', 'Invalid token');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            log('Auth', 'WARN', 'Middleware', 'User not found');
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        log('Auth', 'ERROR', 'Middleware', `Auth error: ${err.message}`);
        res.status(500).json({ error: 'Internal verification error' });
    }
};

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    log('API', 'ERROR', 'Unhandled', `${err.message}`);

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
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

export function sendSuccess(res, data, status = 200) {
    res.status(status).json({ data });
}

export function sendError(res, message, status = 400, details = null) {
    res.status(status).json({ error: message, details });
}

export const schemas = {
    conversation: z.object({
        userId: z.string().uuid(),
        title: z.string().optional(),
        topicId: z.string().uuid().optional().nullable(),
        language: z.string().default('en')
    }),
    message: z.object({
        conversationId: z.string().uuid(),
        role: z.enum(['user', 'assistant', 'system', 'ai']),
        content: z.string()
    }),
    summarize: z.object({
        conversationIds: z.array(z.string().uuid())
    }),
    moveChat: z.object({
        folderId: z.string().uuid().nullable()
    })
};
