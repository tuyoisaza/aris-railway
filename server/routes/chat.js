import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, validate, sendError, sendSuccess } from '../middleware.js';
import { schemas } from '../middleware.js';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';

const router = express.Router();

router.get('/folders/:userId', requireAuth, async (req, res, next) => {
    const { userId } = req.params;

    if (userId !== req.user.id) {
        return sendError(res, 'Unauthorized: ID mismatch', 403);
    }

    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId },
            include: { messages: true },
            orderBy: { updatedAt: 'desc' }
        });
        sendSuccess(res, conversations || []);
    } catch (err) {
        next(err);
    }
});

router.post('/conversation', requireAuth, validate(schemas.conversation), async (req, res, next) => {
    const { userId, title, topicId, language } = req.body;

    if (userId !== req.user.id) {
        return sendError(res, 'Unauthorized: ID mismatch', 403);
    }

    try {
        const conversation = await prisma.conversation.create({
            data: {
                userId,
                title: title || 'New Conversation',
                topicId,
                language: language || 'en'
            }
        });
        sendSuccess(res, conversation);
    } catch (err) {
        next(err);
    }
});

router.put('/conversation/:id', requireAuth, async (req, res, next) => {
    const { id } = req.params;
    const { title, language, is_archived } = req.body;
    const userId = req.user.id;

    try {
        const updates = { updatedAt: new Date() };
        if (title !== undefined) updates.title = title;
        if (language !== undefined) updates.language = language;
        if (is_archived !== undefined) updates.isArchived = is_archived;

        const conversation = await prisma.conversation.update({
            where: { id, userId },
            data: updates
        });
        sendSuccess(res, conversation);
    } catch (err) {
        next(err);
    }
});

router.delete('/conversation/:id', requireAuth, async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await prisma.conversation.delete({
            where: { id, userId }
        });
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

router.post('/message', requireAuth, validate(schemas.message), async (req, res, next) => {
    const { conversationId, role, content } = req.body;
    const userId = req.user.id;

    if (role !== 'user') {
        return sendError(res, 'Only user messages can be submitted directly.', 400);
    }

    try {
        const userMsg = await prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content
            }
        });

        const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        const conversationLanguage = conversation?.language || 'en';

        const aiResponse = await TeacherAgent.respondToUser(
            userId,
            content,
            history.map(m => ({ role: m.role, content: m.content })),
            conversationLanguage,
            conversationId
        );

        const aiMsg = await prisma.message.create({
            data: {
                conversationId,
                role: 'ai',
                content: JSON.stringify(aiResponse)
            }
        });

        sendSuccess(res, {
            userMessage: userMsg,
            aiMessage: aiMsg,
            messages: [userMsg, aiMsg]
        });
    } catch (err) {
        next(err);
    }
});

router.post('/summary', requireAuth, validate(schemas.summarize), async (req, res, next) => {
    const { conversationIds } = req.body;

    if (conversationIds.length === 0) {
        return sendError(res, 'No conversations selected', 400);
    }

    try {
        const messages = await prisma.message.findMany({
            where: { conversationId: { in: conversationIds } },
            orderBy: { createdAt: 'asc' }
        });

        if (!messages.length) {
            return sendSuccess(res, { summary: 'No content found to summarize.' });
        }

        let summary = 'Summary of conversations: ';
        messages.forEach(msg => {
            const role = msg.role === 'user' ? 'User' : 'AI';
            summary += `${role}: ${msg.content.substring(0, 200)}... `;
        });

        sendSuccess(res, { summary });
    } catch (err) {
        next(err);
    }
});

router.put('/conversation/:id/move', requireAuth, validate(schemas.moveChat), async (req, res, next) => {
    const { id } = req.params;
    const { folderId } = req.body;

    try {
        const conversation = await prisma.conversation.update({
            where: { id },
            data: { folderId }
        });
        sendSuccess(res, conversation);
    } catch (err) {
        next(err);
    }
});

export default router;
