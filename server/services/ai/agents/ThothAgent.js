import BaseAgent from './BaseAgent.js';

/**
 * ThothAgent: The Organizer
 * Classifies any input text, topic, or conversation fragment into a 
 * high-level Knowledge Domain using KOS (Knowledge Organization System)
 * principles grounded in ISO 25964.
 */
class ThothAgent extends BaseAgent {
    constructor() {
        super('thoth');
    }

    /**
     * Classify a topic or text into a high-level Knowledge Domain.
     * @param {string} input - The topic name, text, or conversation fragment to classify.
     * @returns {Promise<string>} - The classified Domain (single word/phrase).
     */
    /**
     * Classify topology (Domain + Region + Weight) for a topic.
     * @param {string} input - Topic name or description.
     * @returns {Promise<{domain: string, region: string, weight: number}>}
     */
    async classifyTopology(input, context = '') {
        console.log(`[Thoth] 📐 Analyzing topology for: "${input}" (Context length: ${context?.length || 0})`);

        await this.loadSystemPrompt();

        const inputStr = `Input: "${input}"\nContext: "${context ? context.slice(0, 500) : 'None'}"`;

        const fallbackPrompt = "You are Thoth, the Keeper of Knowledge. Classify the input concept into a Topology.";
        const fallbackInstr = "Return JSON: { \"domain\": \"High-Level Academic Domain\", \"region\": \"Sub-Cluster\", \"weight\": 1-10 }";

        const finalSystemPrompt = (this.systemPrompt || fallbackPrompt) + "\n\n" + (this.instructionText || fallbackInstr);

        const messages = [
            { role: 'system', content: finalSystemPrompt },
            { role: 'user', content: `Classify: ${input}\n${inputStr}` }
        ];

        const config = { ...this.config, jsonMode: true };

        try {
            const responseJson = await this.provider.chat(messages, config);
            const result = JSON.parse(responseJson);

            console.log(`[Thoth] 📐 Result: ${result.domain} > ${result.region} (Weight: ${result.weight})`);
            return {
                domain: result.domain || 'General',
                region: result.region || 'General',
                weight: result.weight || 1
            };
        } catch (error) {
            console.error('[Thoth] Error classifying topology:', error);
            // Fallback
            return { domain: 'General', region: 'General', weight: 1 };
        }
    }

    /**
     * Classify a topic or text into a high-level Knowledge Domain.
     * @param {string} input - The topic name, text, or conversation fragment to classify.
     * @returns {Promise<string>} - The classified Domain (single word/phrase).
     */
    async classifyDomain(input) {
        // Reuse topology for consistency if possible, or keep simple
        // For backward compatibility and speed, we might keep the old one, 
        // but to ensure Domain consistency, we should probably use the same logic.
        // Let's just wrap classifyTopology.
        const topo = await this.classifyTopology(input);
        return topo.domain;
    }
}

export default new ThothAgent();
