import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, name: true } } }
            }),
            prisma.auditLog.count({ where })
        ]);

        sendSuccess(res, {
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        next(err);
    }
});

router.get('/actions', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const actions = await prisma.auditLog.findMany({
            select: { action: true },
            distinct: ['action']
        });
        sendSuccess(res, actions.map(a => a.action));
    } catch (err) {
        next(err);
    }
});

router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const log = await prisma.auditLog.findUnique({
            where: { id },
            include: { user: { select: { id: true, email: true, name: true } } }
        });
        if (!log) return sendError(res, 'Audit log not found', 404);
        sendSuccess(res, log);
    } catch (err) {
        next(err);
    }
});

export default router;
