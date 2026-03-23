import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const folders = await prisma.folder.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'asc' }
        });
        sendSuccess(res, folders.map(f => ({ ...f, title: f.name })));
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, parentId } = req.body;
        const folder = await prisma.folder.create({
            data: {
                userId: req.user.id,
                name: title,
                parentId
            }
        });
        sendSuccess(res, { ...folder, title: folder.name });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const folder = await prisma.folder.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { name: req.body.title }
        });
        sendSuccess(res, { ...folder, title: folder.name });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.folder.delete({
            where: { id: req.params.id, userId: req.user.id }
        });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
