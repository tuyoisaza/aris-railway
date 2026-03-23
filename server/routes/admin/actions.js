import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const actions = await prisma.action.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        sendSuccess(res, actions);
    } catch (err) {
        next(err);
    }
});

router.get('/activity', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        sendSuccess(res, logs);
    } catch (err) {
        next(err);
    }
});

export default router;
