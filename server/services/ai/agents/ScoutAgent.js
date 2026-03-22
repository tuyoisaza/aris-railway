import BaseAgent from './BaseAgent.js';
import { prisma } from '../../../db.js';

class ScoutAgent extends BaseAgent {
    constructor() {
        super('scout');
    }

    async findResources(topicId) {
        console.log(`[Scout] Finding resources for topic ${topicId}`);

        try {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId }
            });

            if (!topic) {
                console.log(`[Scout] Topic not found: ${topicId}`);
                return null;
            }

            const resources = await this.research(topic);

            if (resources && resources.length > 0) {
                for (const resource of resources) {
                    await prisma.resource.create({
                        data: {
                            topicId,
                            title: resource.title,
                            type: resource.type || 'article',
                            url: resource.url || null,
                            metadata: JSON.stringify({
                                author: resource.author,
                                description: resource.description
                            })
                        }
                    });
                }
            }

            return resources;
        } catch (err) {
            console.error('[Scout] Research error:', err);
            return null;
        }
    }

    async research(topic) {
        const prompt = `Find 3 high-quality external resources (books, articles, videos, or thinkers) for learning about "${topic.title}" (${topic.category || 'General'}).

For each resource provide:
- title
- type (book, article, video, thinker)
- url (if applicable)
- author
- description (why this resource is valuable)

Return JSON array of resources.`;

        const messages = [
            { role: 'system', content: this.promptText || 'You are a scout that researches external resources.' },
            { role: 'user', content: prompt }
        ];

        try {
            const rawResponse = await this.chat(messages);
            const parsed = await this.parse(rawResponse);
            
            if (Array.isArray(parsed)) {
                return parsed;
            }
            if (parsed.resources && Array.isArray(parsed.resources)) {
                return parsed.resources;
            }
            return [];
        } catch (err) {
            console.error('[Scout] Research parse error:', err);
            return [];
        }
    }
}

export default new ScoutAgent();
