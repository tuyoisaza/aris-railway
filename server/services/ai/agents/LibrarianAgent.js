import BaseAgent from './BaseAgent.js';
import { prisma } from '../../../db.js';

class LibrarianAgent extends BaseAgent {
    constructor() {
        super('librarian');
    }

    async enrichTopic(topicId) {
        console.log(`[Librarian] Enriching topic ${topicId}`);

        try {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId }
            });

            if (!topic) {
                console.log(`[Librarian] Topic not found: ${topicId}`);
                return null;
            }

            const enrichment = await this.generateEnrichment(topic);

            if (enrichment.content) {
                await prisma.topic.update({
                    where: { id: topicId },
                    data: {
                        content: enrichment.content,
                        description: enrichment.description || topic.description
                    }
                });
            }

            return enrichment;
        } catch (err) {
            console.error('[Librarian] Enrichment error:', err);
            return null;
        }
    }

    async generateEnrichment(topic) {
        const prompt = `Generate enrichment content for the topic "${topic.title}" (${topic.category || 'General'}).

Include:
- Key concepts (layers 1-7)
- Core definitions
- Key questions
- Coming concepts
- References (books, authors, films if relevant)

Return JSON with content and description.`;

        const messages = [
            { role: 'system', content: this.promptText || 'You are a librarian that enriches topics with content.' },
            { role: 'user', content: prompt }
        ];

        try {
            const rawResponse = await this.chat(messages);
            return await this.parse(rawResponse);
        } catch (err) {
            console.error('[Librarian] Generation error:', err);
            return { content: '', description: topic.description };
        }
    }
}

export default new LibrarianAgent();
