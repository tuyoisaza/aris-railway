import { prisma } from '../db.js';
import TeacherAgent from './ai/agents/TeacherAgent.js';
import SkillService from './SkillService.js';

class ConversationService {

    async startGuidedConversation({ userId, title, topicId, brief, initialContext, initialXp, skillId, level }) {
        const existingConvs = await prisma.conversation.findMany({
            where: {
                userId,
                ...(topicId && { topicId }),
                title: { mode: 'insensitive', contains: title }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
        });

        const existingConv = existingConvs.length > 0 ? existingConvs[0] : null;
        let conversationId;
        let isNew = false;

        if (existingConv) {
            conversationId = existingConv.id;

            const count = await prisma.message.count({
                where: { conversationId }
            });

            if (count === 0) {
                console.log(`[ConversationService] detected zombie conversation ${conversationId}, reseeding...`);
                await this._seedConversation(conversationId, userId, brief, initialContext);
                isNew = true;
            }
        } else {
            const newConv = await prisma.conversation.create({
                data: {
                    userId,
                    title,
                    topicId: topicId || null,
                    language: 'en-US'
                }
            });
            conversationId = newConv.id;
            isNew = true;

            await this._seedConversation(conversationId, userId, brief, initialContext);
        }

        const EventManager = (await import('./cognition/EventManager.js')).default;
        EventManager.emitEvent(EventManager.EVENTS.CONVERSATION_STARTED, {
            userId,
            conversationId,
            isNew,
            skillId,
            level,
            initialXp,
            topicId
        });

        return { conversationId, isNew };
    }

    async _seedConversation(conversationId, userId, brief, systemContext) {
        await prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content: brief
            }
        });

        let aiPrompt = brief;
        if (systemContext) {
            const contextStr = typeof systemContext === 'object'
                ? JSON.stringify(systemContext)
                : String(systemContext);
            aiPrompt = `[CONTEXT]\n${contextStr}\n\n[USER REQUEST]\n${brief}`;
        }

        const aiResponse = await TeacherAgent.respondToUser(
            userId,
            aiPrompt,
            [],
            'en',
            false,
            conversationId
        );

        let responseText = aiResponse;
        try {
            JSON.parse(aiResponse);
        } catch (e) {
            console.log('[ConversationService] AI response is not JSON, using raw text');
        }

        await prisma.message.create({
            data: {
                conversationId,
                role: 'ai',
                content: responseText
            }
        });
    }
}

export default new ConversationService();
