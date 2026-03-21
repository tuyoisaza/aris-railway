import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { name } = req.body;
        
        const family = await prisma.family.create({
            data: { name }
        });

        await prisma.familyMember.create({
            data: {
                familyId: family.id,
                userId: req.user.id,
                role: 'Admin'
            }
        });

        sendSuccess(res, family);
    } catch (err) {
        next(err);
    }
});

router.get('/:userId', requireAuth, async (req, res, next) => {
    try {
        const member = await prisma.familyMember.findFirst({
            where: { userId: req.params.userId }
        });

        if (!member) {
            return sendSuccess(res, null);
        }

        const family = await prisma.family.findUnique({
            where: { id: member.familyId },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });

        sendSuccess(res, family);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const { pin, name } = req.body;
        const family = await prisma.family.update({
            where: { id: req.params.id },
            data: { pin, name }
        });
        sendSuccess(res, family);
    } catch (err) {
        next(err);
    }
});

export default router;
