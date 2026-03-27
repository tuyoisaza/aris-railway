import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/:familyId', requireAuth, async (req, res, next) => {
    try {
        const invites = await prisma.invitation.findMany({
            where: { familyId: req.params.familyId }
        });
        sendSuccess(res, invites);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { familyId, email } = req.body;
        const token = Math.random().toString(36).substring(2);
        
        const invite = await prisma.invitation.create({
            data: {
                familyId,
                email,
                token,
                createdBy: req.user.id
            }
        });
        sendSuccess(res, invite);
    } catch (err) {
        next(err);
    }
});

router.post('/:token/accept', requireAuth, async (req, res, next) => {
    try {
        const invite = await prisma.invitation.findUnique({
            where: { token: req.params.token },
            include: { family: true }
        });

        if (!invite || invite.status !== 'Pending') {
            return sendError(res, 'Invalid invitation', 400);
        }

        await prisma.familyMember.create({
            data: {
                familyId: invite.familyId,
                userId: req.user.id,
                role: 'Child'
            }
        });

        await prisma.invitation.update({
            where: { id: invite.id },
            data: { status: 'Accepted' }
        });

        sendSuccess(res, { success: true, familyName: invite.family.name });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.invitation.delete({ where: { id: req.params.id } });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
