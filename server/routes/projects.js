import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/:userId', requireAuth, async (req, res, next) => {
    if (req.params.userId !== req.user.id) {
        return sendError(res, 'Unauthorized', 403);
    }
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        sendSuccess(res, projects);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, whyText, scopeText, originTopicId } = req.body;
        const project = await prisma.project.create({
            data: {
                userId: req.user.id,
                title,
                whyText,
                scopeText,
                originTopicId
            }
        });
        sendSuccess(res, project);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const project = await prisma.project.update({
            where: { id: req.params.id, userId: req.user.id },
            data: req.body
        });
        sendSuccess(res, project);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.project.delete({
            where: { id: req.params.id, userId: req.user.id }
        });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
