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

router.get('/:familyId/activity', requireAuth, async (req, res, next) => {
    try {
        const { familyId } = req.params;
        
        const [family, members, collaborationEvents] = await Promise.all([
            prisma.family.findUnique({
                where: { id: familyId },
                include: { members: { include: { user: true } } }
            }),
            prisma.familyMember.findMany({
                where: { familyId },
                include: { user: true },
                orderBy: { joinedAt: 'desc' }
            }),
            prisma.collaborationEvent.findMany({
                where: { familyId },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);

        if (!family) {
            return sendError(res, 'Family not found', 404);
        }

        const activity = {
            family,
            members,
            recentEvents: collaborationEvents,
            stats: {
                totalMembers: members.length,
                activeMembers: members.filter(m => m.active).length,
                totalSessions: collaborationEvents.length
            }
        };

        sendSuccess(res, activity);
    } catch (err) {
        next(err);
    }
});

router.delete('/members/:memberId', requireAuth, async (req, res, next) => {
    try {
        const { memberId } = req.params;
        
        const member = await prisma.familyMember.findUnique({
            where: { id: memberId },
            include: { family: true }
        });

        if (!member) {
            return sendError(res, 'Member not found', 404);
        }

        const adminCount = await prisma.familyMember.count({
            where: { familyId: member.familyId, role: 'Admin', active: true }
        });

        if (member.role === 'Admin' && adminCount <= 1) {
            return sendError(res, 'Cannot remove the last admin', 400);
        }

        await prisma.familyMember.delete({
            where: { id: memberId }
        });

        sendSuccess(res, { deleted: true });
    } catch (err) {
        next(err);
    }
});

router.get('/:familyId/members', requireAuth, async (req, res, next) => {
    try {
        const { familyId } = req.params;
        
        const members = await prisma.familyMember.findMany({
            where: { familyId },
            include: { user: true },
            orderBy: { joinedAt: 'asc' }
        });

        sendSuccess(res, members);
    } catch (err) {
        next(err);
    }
});

export default router;
