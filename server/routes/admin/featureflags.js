import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { scope } = req.query;
        const where = scope ? { scope: String(scope) } : {};
        const flags = await prisma.featureFlag.findMany({ where });
        sendSuccess(res, flags);
    } catch (err) {
        next(err);
    }
});

router.get('/check/:name', requireAuth, async (req, res, next) => {
    try {
        const { name } = req.params;
        const { userId, tenantId } = req.user;
        
        const flag = await prisma.featureFlag.findFirst({
            where: {
                name,
                OR: [
                    { scope: 'GLOBAL' },
                    { scope: 'TENANT', tenantId },
                    { scope: 'USER', userId },
                ],
            },
        });

        const enabled = flag?.enabled && (!flag.expiresAt || flag.expiresAt > new Date());
        sendSuccess(res, { enabled, flag });
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, description, scope, enabled, tenantId, userId, expiresAt, reviewDate, metadata } = req.body;
        
        const existing = await prisma.featureFlag.findUnique({ where: { name } });
        if (existing) {
            return sendError(res, 'Flag with this name already exists', 400);
        }

        const flag = await prisma.featureFlag.create({
            data: {
                name,
                description,
                scope: scope || 'GLOBAL',
                enabled: enabled ?? false,
                tenantId,
                userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                reviewDate: reviewDate ? new Date(reviewDate) : null,
                metadata: metadata || '{}',
            },
        });
        sendSuccess(res, flag);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, scope, enabled, tenantId, userId, expiresAt, reviewDate, metadata } = req.body;

        const flag = await prisma.featureFlag.update({
            where: { id },
            data: {
                name,
                description,
                scope,
                enabled,
                tenantId,
                userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                reviewDate: reviewDate ? new Date(reviewDate) : null,
                metadata,
            },
        });
        sendSuccess(res, flag);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.featureFlag.delete({ where: { id } });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
