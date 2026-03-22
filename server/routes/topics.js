import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const topics = await prisma.topic.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        sendSuccess(res, topics);
    } catch (err) {
        next(err);
    }
});

router.get('/graph', requireAuth, async (req, res, next) => {
    try {
        const topics = await prisma.topic.findMany();
        const edges = await prisma.topicEdge.findMany();
        sendSuccess(res, { nodes: topics, links: edges });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const topic = await prisma.topic.findUnique({
            where: { id: req.params.id },
            include: { resources: true, edgesFrom: true, edgesTo: true }
        });
        if (!topic) return sendError(res, 'Topic not found', 404);
        sendSuccess(res, topic);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, category, description, content, instruction, depth, maxDepth } = req.body;
        const topic = await prisma.topic.create({
            data: {
                title,
                category,
                description,
                content,
                instruction,
                depth: depth || 1,
                maxDepth: maxDepth || 7,
                createdBy: req.user.id
            }
        });
        sendSuccess(res, topic);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.topic.delete({ where: { id: req.params.id } });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

router.get('/progress/:userId', requireAuth, async (req, res, next) => {
    try {
        const progress = await prisma.userTopicProgress.findMany({
            where: { userId: req.params.userId }
        });
        sendSuccess(res, progress);
    } catch (err) {
        next(err);
    }
});

export default router;
