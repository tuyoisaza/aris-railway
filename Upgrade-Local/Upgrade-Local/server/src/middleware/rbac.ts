import { Request, Response, NextFunction } from 'express';
import { RbacService } from '../services/rbac.service';

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Permissions should have been attached by auth middleware, 
            // but if not (or if cached stale), check again or use attached.
            // Using attached:
            const userPermissions = req.userPermissions || [];

            if (userPermissions.includes(permission)) {
                return next();
            }

            // Fallback: Check DB if not on request (e.g. if auth middleware didn't run fully or different path)
            // But prefer strict reliance on auth middleware for performance.

            // Allow Superadmin override via email whitelist (temporary bridge)
            const ADMIN_EMAILS = ['thetboard@gmail.com', 'dev@upgrade.local'];
            if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                return next();
            }

            return res.status(403).json({ error: `Missing permission: ${permission}` });

        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
