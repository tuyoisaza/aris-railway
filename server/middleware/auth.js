import { prisma } from '../db.js';
import { log } from '../utils/logger.js';
import { sendError } from '../utils/responseHandler.js';
import { verifyToken, extractToken } from '../prisma/auth.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            log('Auth', 'WARN', 'Middleware', 'Missing token');
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            log('Auth', 'WARN', 'Middleware', 'Invalid token');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                plan: true
            }
        });

        if (!user) {
            log('Auth', 'WARN', 'Middleware', 'User not found');
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        log('Auth', 'ERROR', 'Middleware', `Auth error: ${err.message}`);
        sendError(res, 'Internal verification error', 500);
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token);
            if (decoded && decoded.userId) {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        plan: true
                    }
                });
                if (user) {
                    req.user = user;
                }
            }
        }
        next();
    } catch (err) {
        log('Auth', 'ERROR', 'Middleware', `Optional auth error: ${err.message}`);
        next();
    }
};
