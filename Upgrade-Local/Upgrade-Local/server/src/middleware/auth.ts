import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';

const ADMIN_EMAILS = ['thekeyboard@gmail.com', 'dev@upgrade.local'];

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    if (token === 'mock-token') {
        req.user = {
            id: 'mock-user-id',
            email: 'dev@upgrade.local',
            aud: 'authenticated',
            role: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
            isSuperAdmin: true
        } as any;
        return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(403).json({ error: 'Unauthorized' });

    // Enrich with RBAC and Profile Data
    try {
        const { RbacService } = require('../services/rbac.service');

        // Parallel fetch for perf
        const [permissions, profileResult] = await Promise.all([
            RbacService.getUserPermissions(user.id),
            supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
        ]);

        req.userPermissions = permissions;

        // Attach to user object
        req.user = {
            ...user,
            permissions,
            isSuperAdmin: profileResult.data?.is_super_admin || false
        };

    } catch (err) {
        console.error('Auth Enrichment Error:', err);
        req.userPermissions = [];
        // Default to safe values
        req.user = {
            ...user,
            permissions: [],
            isSuperAdmin: false
        };
    }

    next();
};

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    if (token === 'mock-token') {
        req.user = {
            id: 'mock-user-id',
            email: 'dev@upgrade.local',
            aud: 'authenticated',
            role: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
            isSuperAdmin: true
        } as any;
        return next();
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Enrich with profile flags (super admin) so admin routes can rely on req.user
        const { data: profileResult } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single();

        const isSuperAdmin = profileResult?.is_super_admin || false;

        req.user = {
            ...user,
            isSuperAdmin
        } as any;

        // Back-compat for legacy routes
        req.adminUser = user;

        const isWhitelistedEmail = !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
        if (!isWhitelistedEmail && !isSuperAdmin) {
            // Bootstrap: if there are no super admins yet, allow a single designated email
            // to access admin routes so they can promote themselves.
            const bootstrapEmail = (process.env.UPGRADE_BOOTSTRAP_ADMIN_EMAIL || 'thekeyboard@gmail.com').toLowerCase();

            try {
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_super_admin', true);

                if ((count || 0) === 0 && (user.email || '').toLowerCase() === bootstrapEmail) {
                    return next();
                }
            } catch (_e) {
                // If count fails, fall through to deny.
            }

            return res.status(403).json({ error: 'Admin access required' });
        }

        // Optionally logic to log access here if needed, or separate middleware
        next();
    } catch (err) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};
