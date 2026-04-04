import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.put('/preferences', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { preferences: JSON.stringify(req.body.preferences) }
        });
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
});

router.put('/avatar', requireAuth, async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar }
        });
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
});

router.put('/role', requireAuth, async (req, res, next) => {
    try {
        const { role, plan } = req.body;
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (plan !== undefined) updateData.plan = plan;
        
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: { id: true, email: true, name: true, role: true, plan: true }
        });
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, email: true, avatar: true, plan: true }
        });
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
});

export default router;
