import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const badges = await prisma.badge.findMany();
        sendSuccess(res, badges);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, description, icon, xpReward, category, criteria, active } = req.body;
        
        if (!name) {
            return sendError(res, 'Name is required', 400);
        }
        
        const badge = await prisma.badge.create({
            data: {
                name,
                description: description || '',
                icon: icon || '🏆',
                xpReward: xpReward || 0,
                category: category || 'badge',
                criteria: criteria || null,
                active: active ?? true
            }
        });
        
        sendSuccess(res, badge);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, icon, xpReward, category, criteria, active } = req.body;
        
        const badge = await prisma.badge.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(icon !== undefined && { icon }),
                ...(xpReward !== undefined && { xpReward }),
                ...(category !== undefined && { category }),
                ...(criteria !== undefined && { criteria }),
                ...(active !== undefined && { active })
            }
        });
        
        sendSuccess(res, badge);
    } catch (err) {
        if (err.code === 'P2025') {
            return sendError(res, 'Badge not found', 404);
        }
        next(err);
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        await prisma.badge.delete({
            where: { id }
        });
        
        sendSuccess(res, { deleted: true });
    } catch (err) {
        if (err.code === 'P2025') {
            return sendError(res, 'Badge not found', 404);
        }
        next(err);
    }
});

export default router;
