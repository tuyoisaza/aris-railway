import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/notifications', requireAuth, async (req, res, next) => {
    try {
        const notifications = await prisma.xpNotification.findMany({
            where: { userId: req.user.id, read: false },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        sendSuccess(res, notifications);
    } catch (err) {
        next(err);
    }
});

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const skills = await prisma.skill.findMany({
            orderBy: { title: 'asc' }
        });
        sendSuccess(res, skills);
    } catch (err) {
        next(err);
    }
});

router.get('/progress', requireAuth, async (req, res, next) => {
    try {
        const progress = await prisma.userSkillProgress.findMany({
            where: { userId: req.user.id }
        });
        sendSuccess(res, progress);
    } catch (err) {
        next(err);
    }
});

export default router;
