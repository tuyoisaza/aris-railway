import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/sessions', requireAuth, async (req, res, next) => {
    try {
        const member = await prisma.familyMember.findFirst({
            where: { userId: req.user.id }
        });
        
        if (!member) return sendSuccess(res, []);

        const sessions = await prisma.collaborativeSession.findMany({
            where: { familyId: member.familyId },
            orderBy: { createdAt: 'desc' }
        });
        sendSuccess(res, sessions);
    } catch (err) {
        next(err);
    }
});

export default router;
