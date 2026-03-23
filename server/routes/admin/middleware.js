import { requireAuth, sendSuccess, sendError } from '../../middleware.js';

export const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.plan !== 'pro') {
        return sendError(res, 'Admin access required', 403);
    }
    next();
};

export { requireAuth, sendSuccess, sendError };
