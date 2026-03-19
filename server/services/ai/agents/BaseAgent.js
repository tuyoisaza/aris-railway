import { supabaseAdmin } from '../../../db.js';
import { OpenAIProvider } from '../provider.js';
import AgoraService from '../../AgoraService.js';

// Singleton Provider Instance
const provider = new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_ORG_ID);

class BaseAgent {
    constructor(agentId) {
        this.agentId = agentId;
        this.provider = provider;
        this.systemPrompt = null;
        this.agoraSnapshot = null;  // Cached snapshot for current execution
        this.config = {
            model: 'gpt-4o',
            temperature: 0.7
        };
    }

    // =========================================================================
    // PHASE 1: Read Agora Snapshot
    // =========================================================================

    /**
     * Read Agora snapshot before execution.
     * This should be called at the start of any agent operation.
     * Returns a read-only snapshot of all 3 layers.
     */
    async readAgora(userId, sessionId = null) {
        try {
            this.agoraSnapshot = await AgoraService.getSnapshot(userId, sessionId);
            console.log(`[${this.agentId}] 📖 Agora snapshot loaded`);
            return this.agoraSnapshot;
        } catch (err) {
            console.error(`[${this.agentId}] Error reading Agora:`, err);
            this.agoraSnapshot = null;
            return null;
        }
    }

    /**
     * Build context string from Agora snapshot for system prompt injection.
     * Returns formatted context based on all available layers.
     */
    buildContextFromAgora() {
        if (!this.agoraSnapshot) {
            return '';
        }

        let context = '';
        const { layerA, layerB, layerC } = this.agoraSnapshot;

        // Layer A: Stable State
        if (layerA) {
            context += `\n[USER PROFILE]`;
            if (layerA.user_role) context += `\nRole: ${layerA.user_role}`;
            if (layerA.language_pref) context += `\nLanguage: ${layerA.language_pref}`;
            if (layerA.subscription_tier) context += `\nTier: ${layerA.subscription_tier}`;

            // Family boundaries (for child safety)
            if (layerA.family_boundaries && Object.keys(layerA.family_boundaries).length > 0) {
                context += `\nBoundaries: ${JSON.stringify(layerA.family_boundaries)}`;
            }
        }

        // Layer B: User Memory (inferred traits)
        if (layerB && layerB.length > 0) {
            const significantTraits = layerB.filter(m => m.confidence > 0.4);
            if (significantTraits.length > 0) {
                context += `\n\n[USER TENDENCIES - Inferred Patterns]`;
                for (const trait of significantTraits) {
                    context += `\n- ${trait.trait_value} (${Math.round(trait.confidence * 100)}% confidence)`;
                }
                context += `\nNOTE: These are probabilistic inferences. Adjust if user behavior contradicts.`;
            }
        }

        // Layer C: Session Context
        if (layerC) {
            context += `\n\n[SESSION CONTEXT]`;
            if (layerC.active_topic) context += `\nActive Topic: ${layerC.active_topic}`;
            if (layerC.current_posture) context += `\nPosture: ${layerC.current_posture}`;
            if (layerC.task_intent) context += `\nTask Intent: ${layerC.task_intent}`;
        }

        return context;
    }

    // =========================================================================
    // PHASE 3: Emit Post-Action Summary
    // =========================================================================

    /**
     * Emit a structured post-action summary to the Agora buffer.
     * Called after execution to report signals for Ogma processing.
     */
    async emitSummary(userId, signalType, signalData, conversationId = null) {
        try {
            await AgoraService.emitPostActionSummary(
                this.agentId,
                userId,
                signalType,
                signalData,
                conversationId
            );
            console.log(`[${this.agentId}] 📤 Emitted ${signalType} signal`);
        } catch (err) {
            console.error(`[${this.agentId}] Error emitting summary:`, err);
        }
    }

    /**
     * Helper to emit multiple signals at once
     */
    async emitMultipleSummaries(userId, signals, conversationId = null) {
        for (const { type, data } of signals) {
            await this.emitSummary(userId, type, data, conversationId);
        }
    }

    /**
     * Loads the latest prompt and config from DB
     */
    async loadSystemPrompt() {
        try {
            const { data, error } = await supabaseAdmin
                .from('system_prompts')
                .select('*')
                .eq('agent_id', this.agentId)
                .single();

            if (error || !data) {
                console.warn(`[BaseAgent] Could not load prompt for ${this.agentId}. Using fallback.`);
                return false;
            }

            this.systemPrompt = data.prompt_text;
            this.instructionText = data.instruction_text || ''; // Load reply/formatting instructions
            this.config = {
                model: data.model || 'gpt-4o',
                temperature: data.temperature || 0.7
            };
            return true;

        } catch (err) {
            console.error(`[BaseAgent] Error loading prompt: ${err.message}`);
            return false;
        }
    }

    /**
     * Common chat method
     */
    async chat(userMessage, history = []) {
        // Always load latest config to ensure Admin updates are reflected immediately
        await this.loadSystemPrompt();

        const messages = [
            { role: 'system', content: this.systemPrompt || 'You are a helpful AI.' },
            ...history,
            { role: 'user', content: userMessage }
        ];

        return await this.provider.chat(messages, this.config);
    }
}

export default BaseAgent;
