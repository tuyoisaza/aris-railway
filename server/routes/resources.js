import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/:topicId', requireAuth, async (req, res, next) => {
    try {
        const resources = await prisma.resource.findMany({
            where: { topicId: req.params.topicId }
        });
        sendSuccess(res, resources);
    } catch (err) {
        next(err);
    }
});

export default router;
