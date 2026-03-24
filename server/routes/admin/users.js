import express from 'express';
import { prisma } from '../../db.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';
import { hashPassword } from '../../prisma/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        sendSuccess(res, users);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { email, password, name, plan, role } = req.body;
        
        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }
        
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return sendError(res, 'Email already exists', 400);
        }
        
        const hashedPassword = await hashPassword(password);
        
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || 'New User',
                plan: plan || 'free',
                role: role || 'user'
            },
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        
        sendSuccess(res, user);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, plan, role, password } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (plan !== undefined) updateData.plan = plan;
        if (role !== undefined) updateData.role = role;
        if (password) updateData.password = await hashPassword(password);
        
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        
        sendSuccess(res, user);
    } catch (err) {
        if (err.code === 'P2025') {
            return sendError(res, 'User not found', 404);
        }
        next(err);
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        await prisma.user.delete({
            where: { id }
        });
        
        sendSuccess(res, { deleted: true });
    } catch (err) {
        if (err.code === 'P2025') {
            return sendError(res, 'User not found', 404);
        }
        next(err);
    }
});

router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return sendError(res, 'User not found', 404);
        }
        
        sendSuccess(res, { message: 'Password reset functionality coming soon. User can use forgot password flow.' });
    } catch (err) {
        next(err);
    }
});

export default router;
