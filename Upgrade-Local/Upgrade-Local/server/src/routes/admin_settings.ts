import express, { Request, Response } from 'express';
import { supabase } from '../db';
import { verifyAdmin } from '../middleware/auth';

const router = express.Router();

// GET all settings
router.get('/', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (error) throw error;

        // Convert array to object for easier frontend consumption
        const settingsMap: Record<string, any> = {};
        if (data) {
            data.forEach((item: any) => {
                settingsMap[item.key] = item.value;
            });
        }

        res.json(settingsMap);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET specific setting
router.get('/:key', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', req.params.key)
            .maybeSingle();

        if (error) throw error;
        res.json(data ? data.value : null);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// UPSERT setting
router.post('/:key', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const userId = req.adminUser.id;

        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString(),
                updated_by: userId
            })
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;

