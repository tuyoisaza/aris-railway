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
        const progress = await prisma.userSkillProgress.findMany({
            where: { userId: req.user.id },
            include: { skill: true },
            orderBy: { lastPracticedAt: 'desc' }
        });
        sendSuccess(res, progress);
    } catch (err) {
        next(err);
    }
});

router.get('/all', requireAuth, async (req, res, next) => {
    try {
        const skills = await prisma.skill.findMany({
            orderBy: { title: 'asc' }
        });
        sendSuccess(res, skills);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, category, description } = req.body;
        
        let skill = await prisma.skill.findFirst({
            where: { title: { mode: 'insensitive', equals: title } }
        });

        if (!skill) {
            skill = await prisma.skill.create({
                data: { title, category: category || 'General', description }
            });
        }

        const progress = await prisma.userSkillProgress.create({
            data: {
                userId: req.user.id,
                skillId: skill.id,
                level: 1,
                xp: 0
            }
        });

        sendSuccess(res, { skill, progress }, 201);
    } catch (err) {
        if (err.code === 'P2002') {
            const existing = await prisma.skill.findFirst({
                where: { title: { mode: 'insensitive', equals: req.body.title } }
            });
            if (existing) {
                return sendSuccess(res, { skill: existing, message: 'Skill already exists' });
            }
        }
        next(err);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.userSkillProgress.delete({
            where: { id }
        });
        sendSuccess(res, { deleted: true });
    } catch (err) {
        next(err);
    }
});

router.delete('/', requireAuth, async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return sendError(res, 'ids array required', 400);
        }
        await prisma.userSkillProgress.deleteMany({
            where: { id: { in: ids } }
        });
        sendSuccess(res, { deleted: ids.length });
    } catch (err) {
        next(err);
    }
});

export default router;
