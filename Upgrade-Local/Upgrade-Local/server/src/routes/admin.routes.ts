import express, { Request, Response } from 'express';
import { verifyAuth } from '../middleware/auth';
import { supabase } from '../db';
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';

const router = express.Router();

// Middleware to ensure Super Admin access
const verifySuperAdmin = (req: Request, res: Response, next: any) => {
    if (!req.user || !req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Super Admin access required' });
    }
    next();
};

router.use(verifyAuth);
router.use(verifySuperAdmin);

// --- User Management ---

// List Users
router.get('/users', async (req: Request, res: Response) => {
    try {
        const { plan, role, search, isSuperAdmin } = req.query;
        const users = await UserService.listUsers({
            plan: plan as string,
            isSuperAdmin: isSuperAdmin === 'true' ? true : isSuperAdmin === 'false' ? false : undefined,
            search: search as string
        });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create User
router.post('/users', async (req: Request, res: Response) => {
    try {
        const { email, fullName, plan, isSuperAdmin } = req.body;
        const newUser = await UserService.createUser({ email, fullName, plan, isSuperAdmin });
        res.json(newUser);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update User
router.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { plan, isSuperAdmin, fullName } = req.body;
        await UserService.updateUser(id, { plan, isSuperAdmin, fullName }, req.user.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User (Soft Delete/Ban)
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await UserService.deleteUser(id, req.user.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Reset Password
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await UserService.sendPasswordReset(id, req.user.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- System Settings & Logs ---

// Get Settings
router.get('/system/settings', async (req: Request, res: Response) => {
    try {
        const debugMode = await SystemService.isDebugMode();
        res.json({ debug_mode: debugMode });
        // Can expand to list all settings if needed
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Settings
router.put('/system/settings', async (req: Request, res: Response) => {
    try {
        const { settings } = req.body; // Expect { debug_mode: boolean, ... }

        for (const [key, value] of Object.entries(settings)) {
            await SystemService.updateSetting(key, value, req.user.id);
        }

        // Log the change
        await SystemService.log({
            level: 'warn',
            action: 'system:settings_update',
            userId: req.user.id,
            details: settings
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Logs
router.get('/system/logs', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
