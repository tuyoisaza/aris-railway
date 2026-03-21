import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

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

export default router;
