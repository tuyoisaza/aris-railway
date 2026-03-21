import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.post('/pin', requireAuth, async (req, res, next) => {
    try {
        const { familyId, pin } = req.body;
        await prisma.family.update({
            where: { id: familyId },
            data: { pin }
        });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
