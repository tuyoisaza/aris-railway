import express, { Request, Response } from 'express';
import { verifyAuth } from '../middleware/auth';
import { supabase } from '../db';
import { AIService } from '../services/ai';

const router = express.Router();

router.get('/journal', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Fetch last 10 journal entries
        const { data: entries, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Analyze with AI
        const analysis = await AIService.analyzeJournal(entries || []);

        res.json(analysis);
    } catch (error: any) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate analytics" });
    }
});

export default router;
