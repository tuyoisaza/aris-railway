import BaseAgent from './BaseAgent.js';

class ThothAgent extends BaseAgent {
    constructor() {
        super('thoth');
    }

    async classify(text) {
        try {
            const messages = [
                { role: 'user', content: text }
            ];

            const rawResponse = await this.chat(messages);
            const domain = rawResponse.trim();
            
            return { domain };
        } catch (err) {
            console.error('[Thoth] Classification error:', err);
            return { domain: 'General' };
        }
    }

    async classifyTopic(topicId, text) {
        const result = await this.classify(text);

        if (result.domain && result.domain !== 'General') {
            const { prisma } = await import('../../../db.js');
            await prisma.topic.update({
                where: { id: topicId },
                data: { category: result.domain }
            });
        }

        return result;
    }
}

export default new ThothAgent();
