import express from 'express';
import { requireAuth, sendError, sendSuccess } from '../../middleware.js';
import ScoutAgent from '../../services/ai/agents/ScoutAgent.js';

const router = express.Router();

router.post('/research', requireAuth, async (req, res, next) => {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query || typeof query !== 'string') {
        return sendError(res, 'Query is required', 400);
    }

    try {
        const result = await ScoutAgent.webResearch(query, userId);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
});

router.get('/search', requireAuth, async (req, res, next) => {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || typeof q !== 'string') {
        return sendError(res, 'Query parameter "q" is required', 400);
    }

    try {
        const result = await ScoutAgent.webResearch(q, userId);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
});

export default router;
