import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const actions = await prisma.action.findMany({
            where: { type: { startsWith: 'guided_' } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        sendSuccess(res, actions);
    } catch (err) {
        next(err);
    }
});

export default router;
