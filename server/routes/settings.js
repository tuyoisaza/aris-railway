import express from 'express';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const router = express.Router();

// POST /api/settings/pin
router.post('/pin', requireAuth, validate(schemas.pin), async (req, res) => {
    const { familyId, pin } = req.body;
    log('API', 'INFO', 'Settings', `PIN update for family: ${familyId}`);

    try {
        const { error } = await req.userClient
            .from('families')
            .update({ pin })
            .eq('id', familyId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        log('API', 'ERROR', 'Settings', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
