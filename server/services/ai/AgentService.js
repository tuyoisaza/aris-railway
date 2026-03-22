import { prisma } from '../db.js';

const AGENT_CACHE_TTL = 300000;

class AgentService {
    constructor() {
        this.promptCache = new Map();
    }

    async getPrompt(agentId) {
        const now = Date.now();
        const cached = this.promptCache.get(agentId);

        if (cached && (now - cached.timestamp) < AGENT_CACHE_TTL) {
            return cached.data;
        }

        try {
            const prompt = await prisma.systemPrompt.findUnique({
                where: { agentId }
            });

            if (prompt) {
                this.promptCache.set(agentId, {
                    data: {
                        promptText: prompt.promptText,
                        model: prompt.model,
                        temperature: prompt.temperature
                    },
                    timestamp: now
                });
                return this.promptCache.get(agentId).data;
            }

            return null;
        } catch (err) {
            console.error(`[AgentService] Error loading prompt for ${agentId}:`, err);
            return null;
        }
    }

    async updatePrompt(agentId, data) {
        try {
            const updated = await prisma.systemPrompt.update({
                where: { agentId },
                data: {
                    promptText: data.promptText ?? undefined,
                    model: data.model ?? undefined,
                    temperature: data.temperature ?? undefined,
                    name: data.name ?? undefined,
                    active: data.active ?? undefined
                }
            });

            this.promptCache.delete(agentId);
            return updated;
        } catch (err) {
            console.error(`[AgentService] Error updating prompt for ${agentId}:`, err);
            throw err;
        }
    }

    async getAllAgents() {
        try {
            return await prisma.systemPrompt.findMany({
                orderBy: { name: 'asc' }
            });
        } catch (err) {
            console.error('[AgentService] Error loading all agents:', err);
            return [];
        }
    }

    clearCache(agentId = null) {
        if (agentId) {
            this.promptCache.delete(agentId);
        } else {
            this.promptCache.clear();
        }
    }
}

export default new AgentService();
