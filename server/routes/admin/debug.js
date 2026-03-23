import express from 'express';
import { getLevel, setLevel } from '../../utils/logger.js';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    res.json({ enabled: getLevel() >= 4 });
});

router.put('/', requireAuth, requireAdmin, async (req, res) => {
    const { enabled } = req.body;
    setLevel(enabled ? 4 : 2);
    sendSuccess(res, { enabled });
});

export default router;
