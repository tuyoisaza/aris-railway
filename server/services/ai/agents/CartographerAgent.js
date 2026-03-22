import BaseAgent from './BaseAgent.js';
import { prisma } from '../../../db.js';

class CartographerAgent extends BaseAgent {
    constructor() {
        super('cartographer');
    }

    async analyzeAndMap(conversationId, userId) {
        console.log(`[Cartographer] Analyzing conversation ${conversationId}`);

        try {
            const messages = await prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' }
            });

            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { user: true }
            });

            const conversationText = messages
                .filter(m => m.role === 'user')
                .map(m => m.content)
                .join('\n');

            if (!conversationText.trim()) {
                console.log(`[Cartographer] No user messages to analyze`);
                return null;
            }

            const analysis = await this.analyzeContent(conversationText, conversation);

            if (analysis.topics && analysis.topics.length > 0) {
                for (const topicData of analysis.topics) {
                    await this.createTopic(userId, topicData);
                }
            }

            return analysis;
        } catch (err) {
            console.error('[Cartographer] Error:', err);
            return null;
        }
    }

    async analyzeContent(text, conversation) {
        const messages = [
            { role: 'system', content: this.promptText || 'Analyze this conversation and extract key topics.' },
            { role: 'user', content: `Analyze this conversation and return JSON with topics:\n${text}` }
        ];

        try {
            const rawResponse = await this.chat(messages);
            return await this.parse(rawResponse);
        } catch (err) {
            console.error('[Cartographer] Analysis error:', err);
            return { topics: [] };
        }
    }

    async createTopic(userId, topicData) {
        try {
            const existingTopic = await prisma.topic.findFirst({
                where: {
                    title: { equals: topicData.name },
                    createdBy: userId
                }
            });

            if (existingTopic) {
                console.log(`[Cartographer] Topic already exists: ${topicData.name}`);
                return existingTopic;
            }

            const topic = await prisma.topic.create({
                data: {
                    title: topicData.name,
                    category: topicData.category || 'General',
                    description: topicData.description || '',
                    createdBy: userId
                }
            });

            console.log(`[Cartographer] Created topic: ${topic.title}`);
            return topic;
        } catch (err) {
            console.error('[Cartographer] Error creating topic:', err);
            return null;
        }
    }

    async analyzeTopicRelationships(topicId) {
        console.log(`[Cartographer] Analyzing relationships for topic ${topicId}`);

        try {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId }
            });

            if (!topic) return null;

            const existingTopics = await prisma.topic.findMany({
                where: {
                    id: { not: topicId }
                },
                take: 20
            });

            if (existingTopics.length === 0) return null;

            const relationshipPrompt = `Given the topic "${topic.title}" (${topic.category}), identify which topics from this list it relates to and what kind of relationship exists: ${existingTopics.map(t => t.title).join(', ')}. Return JSON with relationships array.`;

            const messages = [
                { role: 'system', content: 'You are a knowledge graph architect. Identify relationships between topics.' },
                { role: 'user', content: relationshipPrompt }
            ];

            const rawResponse = await this.chat(messages);
            const parsed = await this.parse(rawResponse);

            if (parsed.relationships && Array.isArray(parsed.relationships)) {
                for (const rel of parsed.relationships) {
                    const relatedTopic = existingTopics.find(t => 
                        t.title.toLowerCase().includes(rel.target.toLowerCase())
                    );

                    if (relatedTopic) {
                        await prisma.topicEdge.upsert({
                            where: {
                                sourceId_targetId: {
                                    sourceId: topicId,
                                    targetId: relatedTopic.id
                                }
                            },
                            create: {
                                sourceId: topicId,
                                targetId: relatedTopic.id,
                                type: rel.type || 'related',
                                weight: rel.weight || 1
                            },
                            update: {
                                type: rel.type || 'related',
                                weight: rel.weight || 1
                            }
                        });
                    }
                }
            }

            return parsed;
        } catch (err) {
            console.error('[Cartographer] Error analyzing relationships:', err);
            return null;
        }
    }
}

export default new CartographerAgent();
