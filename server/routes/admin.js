import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.plan !== 'pro') {
        return sendError(res, 'Admin access required', 403);
    }
    next();
};

router.get('/prompts', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const prompts = await prisma.systemPrompt.findMany({
            orderBy: { name: 'asc' }
        });
        sendSuccess(res, prompts);
    } catch (err) {
        next(err);
    }
});

router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        sendSuccess(res, users);
    } catch (err) {
        next(err);
    }
});

router.get('/badges', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const badges = await prisma.badge.findMany();
        sendSuccess(res, badges);
    } catch (err) {
        next(err);
    }
});

router.get('/services', requireAuth, requireAdmin, async (req, res) => {
    const services = [
        { name: 'Backend API', status: 'operational', message: 'Running' },
        { name: 'Database', status: 'operational', message: 'Connected' },
        { name: 'OpenAI API', status: process.env.OPENAI_API_KEY ? 'operational' : 'missing_config', message: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured' },
    ];
    res.json(services);
});

export default router;
