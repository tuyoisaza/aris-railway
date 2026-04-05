import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';
import {
    handleTopicAction,
    handleProjectAction,
    handleSkillAction,
    handleConversationAction,
    getAvailableActions
} from './agora-actions.js';

const router = express.Router();

router.get('/memory', requireAuth, async (req, res, next) => {
    try {
        const memory = await prisma.agoraUserMemory.findMany({
            where: { userId: req.user.id }
        });
        sendSuccess(res, { traits: memory });
    } catch (err) {
        next(err);
    }
});

router.put('/memory/:key', requireAuth, async (req, res, next) => {
    try {
        const { value, delete: shouldDelete } = req.body;
        
        if (shouldDelete) {
            await prisma.agoraUserMemory.deleteMany({
                where: { userId: req.user.id, traitKey: req.params.key }
            });
        } else {
            await prisma.agoraUserMemory.upsert({
                where: { userId_traitKey: { userId: req.user.id, traitKey: req.params.key } },
                update: { traitValue: value, lastConfirmed: new Date() },
                create: { userId: req.user.id, traitKey: req.params.key, traitValue: value }
            });
        }
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

router.get('/actions', requireAuth, async (req, res) => {
    sendSuccess(res, { actions: getAvailableActions() });
});

router.post('/action', requireAuth, async (req, res, next) => {
    try {
        const { type, payload, intent } = req.body;

        if (!type) {
            return sendError(res, 'Action type is required', 400);
        }

        console.log(`[Agora] Executing guided action: ${type}`, { intent, payload });

        switch (type) {
            case 'topic':
                return await handleTopicAction(req, res, payload || {}, intent);
            case 'project':
                return await handleProjectAction(req, res, payload || {}, intent);
            case 'skill':
                return await handleSkillAction(req, res, payload || {}, intent);
            case 'conversation':
                return await handleConversationAction(req, res, payload || {}, intent);
            default:
                return sendError(res, `Unknown action type: ${type}`, 400);
        }
    } catch (err) {
        console.error('[Agora] Action error:', err);
        next(err);
    }
});

export default router;
