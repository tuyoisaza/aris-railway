import { prisma } from '../../../db.js';

const PROMPT_CACHE_TTL = 60000;

class BaseAgent {
    constructor(agentId) {
        this.agentId = agentId;
        this.promptCache = null;
        this.promptCacheTime = 0;
    }

    async loadPrompt() {
        const now = Date.now();
        
        if (this.promptCache && (now - this.promptCacheTime) < PROMPT_CACHE_TTL) {
            return this.promptCache;
        }

        try {
            const systemPrompt = await prisma.systemPrompt.findUnique({
                where: { agentId: this.agentId }
            });

            if (!systemPrompt) {
                console.warn(`[BaseAgent] No prompt found for agent: ${this.agentId}`);
                return null;
            }

            this.promptCache = {
                promptText: systemPrompt.promptText,
                model: systemPrompt.model || 'gpt-4o',
                temperature: systemPrompt.temperature || 0.7
            };
            this.promptCacheTime = now;

            return this.promptCache;
        } catch (err) {
            console.error(`[BaseAgent] Error loading prompt for ${this.agentId}:`, err);
            return null;
        }
    }

    async chat(messages, options = {}) {
        const promptData = await this.loadPrompt();
        
        if (!promptData) {
            throw new Error(`Failed to load prompt for agent: ${this.agentId}`);
        }

        const openai = await this.getOpenAIClient();
        
        const systemMessage = {
            role: 'system',
            content: promptData.promptText
        };

        const allMessages = [systemMessage, ...messages];

        const completion = await openai.chat.completions.create({
            model: promptData.model,
            messages: allMessages,
            temperature: options.temperature ?? promptData.temperature,
            max_tokens: options.maxTokens ?? 2000
        });

        return completion.choices[0]?.message?.content || '';
    }

    async parse(rawResponse) {
        let cleanedResponse = rawResponse.trim();
        
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
            return JSON.parse(cleanedResponse);
        } catch (err) {
            console.warn(`[BaseAgent] Failed to parse JSON for ${this.agentId}:`, err.message);
            return { response: cleanedResponse };
        }
    }

    async getOpenAIClient() {
        const { default: OpenAI } = await import('openai');
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    clearCache() {
        this.promptCache = null;
        this.promptCacheTime = 0;
    }
}

export default BaseAgent;
