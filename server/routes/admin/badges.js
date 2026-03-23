import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const badges = await prisma.badge.findMany();
        sendSuccess(res, badges);
    } catch (err) {
        next(err);
    }
});

export default router;
