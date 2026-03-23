import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        sendSuccess(res, users);
    } catch (err) {
        next(err);
    }
});

export default router;
