import express from 'express';
import { z } from 'zod';
import { log } from '../utils/logger.js';
import { requireAuth } from '../middleware.js';

const router = express.Router();

// GET /api/resources/:topicId
router.get('/:topicId', requireAuth, async (req, res) => {
    const { topicId } = req.params;

    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID format' });
    }

    try {
        const { data, error } = await req.userClient
            .from('resources')
            .select('*')
            .eq('topic_id', topicId);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Resources', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
