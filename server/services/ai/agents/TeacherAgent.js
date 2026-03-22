import BaseAgent from './BaseAgent.js';
import { prisma } from '../../../db.js';

class TeacherAgent extends BaseAgent {
    constructor() {
        super('teacher');
    }

    async respondToUser(userId, userMessage, conversationHistory = [], language = 'en', conversationId = null) {
        console.log(`[Teacher] Responding to ${userId} in ${language}`);

        const context = await this.buildContext(userId, conversationId);

        const messages = [
            ...conversationHistory.map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        if (context) {
            messages.unshift({ role: 'system', content: context });
        }

        try {
            const rawResponse = await this.chat(messages);
            const parsed = await this.parse(rawResponse);

            if (!parsed.options || !Array.isArray(parsed.options) || parsed.options.length !== 3) {
                parsed.options = [
                    "Tell me more about that.",
                    "Can you give me an example?",
                    "Let's try a different approach."
                ];
            }

            return parsed;
        } catch (err) {
            console.error('[Teacher] Error:', err);
            return {
                response: "I'm having trouble thinking right now. Can you try again?",
                options: [
                    "Tell me more about that.",
                    "Can you give me an example?",
                    "Let's try a different approach."
                ],
                action: null
            };
        }
    }

    async buildContext(userId, conversationId) {
        let context = '';

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, age: true, description: true }
            });

            if (user) {
                context += `[USER CONTEXT]\n`;
                context += `Name: ${user.name}\n`;
                if (user.age) context += `Age: ${user.age}\n`;
                if (user.description) context += `Description: ${user.description}\n`;
            }

            const memory = await prisma.agoraUserMemory.findMany({
                where: { userId },
                orderBy: { lastConfirmed: 'desc' },
                take: 5
            });

            if (memory.length > 0) {
                context += `\n[USER MEMORY - AGORA]\n`;
                memory.forEach(m => {
                    context += `- ${m.traitKey}: ${m.traitValue}\n`;
                });
            }

            if (conversationId) {
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    select: { topicId: true, language: true }
                });

                if (conversation?.topicId) {
                    const topic = await prisma.topic.findUnique({
                        where: { id: conversation.topicId },
                        select: { title: true, category: true }
                    });

                    if (topic) {
                        context += `\n[CURRENT TOPIC]: ${topic.title}\n`;
                        if (topic.category) context += `Category: ${topic.category}\n`;
                    }
                }
            }

        } catch (err) {
            console.error('[Teacher] Error building context:', err);
        }

        return context;
    }

    async emitSignal(userId, signalType, signalData, conversationId = null) {
        try {
            await prisma.agoraPostActionBuffer.create({
                data: {
                    agentId: 'teacher',
                    userId,
                    signalType,
                    signalData: JSON.stringify(signalData),
                    conversationId
                }
            });
        } catch (err) {
            console.error('[Teacher] Error emitting signal:', err);
        }
    }
}

export default new TeacherAgent();
