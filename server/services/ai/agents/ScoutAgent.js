import BaseAgent from './BaseAgent.js';
import { prisma } from '../../../db.js';
import WebResearchService from '../../WebResearchService.js';

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

    async webResearch(query, userId = null) {
        console.log(`[Scout] Performing web research for: ${query}`);

        try {
            const researchResult = await WebResearchService.researchAndSummarize(query);
            
            if (userId) {
                await this.saveToMemory(userId, query, researchResult);
            }

            return researchResult;
        } catch (err) {
            console.error('[Scout] Web research error:', err);
            return {
                query,
                summary: 'An error occurred while researching.',
                sources: [],
                error: err.message
            };
        }
    }

    async saveToMemory(userId, query, researchResult) {
        try {
            const memoryEntry = {
                type: 'web_research',
                query: query,
                summary: researchResult.summary,
                sources: researchResult.sources,
                timestamp: new Date().toISOString()
            };

            await prisma.agoraUserMemory.create({
                data: {
                    userId: userId,
                    traitType: 'web_research',
                    traitName: query.substring(0, 100),
                    traitValue: JSON.stringify(memoryEntry),
                    metadata: JSON.stringify({
                        source: 'web_search',
                        resultCount: researchResult.sources?.length || 0
                    })
                }
            });

            console.log(`[Scout] Saved research to memory for user ${userId}`);
        } catch (err) {
            console.error('[Scout] Error saving to memory:', err);
        }
    }
}

export default new ScoutAgent();
