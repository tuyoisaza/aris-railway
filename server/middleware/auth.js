import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';
import { sendError } from '../utils/responseHandler.js';

// Authentication middleware for JWT tokens
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            log('Auth', 'WARN', 'Middleware', 'Missing Authorization header');
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

        if (!token) {
            log('Auth', 'WARN', 'Middleware', 'Missing token');
            return res.status(401).json({ error: 'Token required' });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            log('Auth', 'WARN', 'Middleware', `Invalid token: ${error?.message}`);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user info to request
        req.user = user;
        
        next();
    } catch (err) {
        log('Auth', 'ERROR', 'Middleware', `Auth error: ${err.message}`);
        sendError(res, 'Internal verification error', 500);
    }
};