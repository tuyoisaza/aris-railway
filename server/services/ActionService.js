/**
 * ActionService.js
 * 
 * Central service for managing and executing Agentic Actions.
 * Enforces the standard lifecycle:
 * 1. Read AGORA snapshot
 * 2. Execute action with agent
 * 3. Emit signals back to AGORA
 */

import { supabaseAdmin } from '../db.js';

// Import all agents (these are singletons - already instantiated)
import TeacherAgent from './ai/agents/TeacherAgent.js';
import LughAgent from './ai/agents/LughAgent.js';
import DaedalusAgent from './ai/agents/DaedalusAgent.js';
import CartographerAgent from './ai/agents/CartographerAgent.js';
import LibrarianAgent from './ai/agents/LibrarianAgent.js';

// Agent Registry - Maps agent_id to agent singleton
// Note: All agents are exported as singletons (already instantiated)
const AGENTS = {
    'teacher': TeacherAgent,
    'lugh': LughAgent,
    'daedalus': DaedalusAgent,
    'cartographer': CartographerAgent,
    'librarian': LibrarianAgent
    // Future: 'recommender': RecommenderAgent
};

class ActionService {
    constructor() {
        this.actionsCache = null;
        this.cacheExpiry = null;
        this.CACHE_TTL = 60000; // 1 minute cache
    }

    /**
     * Get all enabled actions from database.
     * Cached for performance.
     */
    async getActions(includeDisabled = false) {
        // Check cache
        if (this.actionsCache && this.cacheExpiry > Date.now()) {
            return includeDisabled
                ? this.actionsCache
                : this.actionsCache.filter(a => a.enabled);
        }

        try {
            const { data, error } = await supabaseAdmin
                .from('actions')
                .select('*')
                .order('name');

            if (error) throw error;

            this.actionsCache = data || [];
            this.cacheExpiry = Date.now() + this.CACHE_TTL;

            return includeDisabled
                ? this.actionsCache
                : this.actionsCache.filter(a => a.enabled);

        } catch (err) {
            console.error('[ActionService] Failed to load actions:', err);
            return [];
        }
    }

    /**
     * Get a single action by slug.
     */
    async getAction(slug) {
        const actions = await this.getActions(true);
        return actions.find(a => a.slug === slug);
    }

    /**
     * Get the agent instance for an action.
     */
    getAgent(agentId) {
        const agent = AGENTS[agentId];
        if (!agent) {
            console.warn(`[ActionService] Unknown agent: ${agentId}`);
            return null;
        }
        return agent;
    }

    /**
     * Invalidate cache (call after admin updates)
     */
    invalidateCache() {
        this.actionsCache = null;
        this.cacheExpiry = null;
    }

    /**
     * Execute an action with the full AGORA lifecycle.
     * 
     * @param {string} slug - Action identifier
     * @param {string} userId - User ID
     * @param {any} payload - Action payload/context
     * @param {string} intent - User intent
     * @returns {Promise<{url: string, message?: string}>}
     */
    async executeAction(slug, userId, payload, intent) {
        console.log(`[ActionService] Executing action: ${slug} for user ${userId}`);

        // 1. Get action definition
        const actionDef = await this.getAction(slug);
        if (!actionDef) {
            throw new Error(`Unknown action: ${slug}`);
        }
        if (!actionDef.enabled) {
            throw new Error(`Action '${slug}' is currently disabled`);
        }

        // 2. Get agent
        const agent = this.getAgent(actionDef.agent_id);
        if (!agent) {
            throw new Error(`Agent not found for action: ${slug}`);
        }

        // 3. Read AGORA (if agent supports it)
        let agoraContext = '';
        if (typeof agent.readAgora === 'function') {
            console.log(`[ActionService] Reading AGORA for action: ${slug}`);
            await agent.readAgora(userId);
            agoraContext = agent.buildContextFromAgora ? agent.buildContextFromAgora() : '';
        } else {
            console.warn(`[ActionService] Agent ${actionDef.agent_id} does not implement readAgora`);
        }

        // 4. Execute action based on type
        let result;
        switch (slug) {
            case 'conversation':
                result = await this._executeConversation(userId, payload, intent, agent, agoraContext);
                break;
            case 'skill':
                result = await this._executeSkill(userId, payload, intent, agent, agoraContext);
                break;
            case 'project':
                result = await this._executeProject(userId, payload, intent, agent, agoraContext);
                break;
            case 'topic':
                result = await this._executeTopic(userId, payload, intent, agent, agoraContext);
                break;
            default:
                // Generic execution for future actions
                result = await this._executeGeneric(actionDef, userId, payload, intent, agent, agoraContext);
        }

        // 5. Emit signal to AGORA
        if (typeof agent.emitSummary === 'function') {
            await agent.emitSummary(userId, 'ACTION_COMPLETED', {
                action: slug,
                intent: intent,
                resultId: result.id || result.url
            });
        }

        // 6. Format result URL
        const url = actionDef.result_route.replace(':id', result.id || result.skillId || result.conversationId || result.topicId || result.projectId);

        return {
            url,
            message: result.message || `${actionDef.name} completed.`,
            id: result.id
        };
    }

    // =========================================================================
    // Action Implementations
    // =========================================================================

    async _executeConversation(userId, payload, intent, agent, agoraContext) {
        const ConversationService = (await import('./ConversationService.js')).default;

        const context = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const title = `Guided: ${intent?.substring(0, 30) || 'Conversation'}`;

        const result = await ConversationService.startGuidedConversation({
            userId,
            title,
            topicId: null,
            brief: intent,
            initialContext: `${context}\n\n${agoraContext}`,
            initialXp: 5
        });

        return { conversationId: result.conversationId, message: 'Conversation started.' };
    }

    async _executeSkill(userId, payload, intent, agent, agoraContext) {
        const SkillService = (await import('./SkillService.js')).default;

        // Include AGORA context in the skill creation
        const enrichedContext = `${payload}\n\n[LEARNER CONTEXT]\n${agoraContext}`;

        const result = await SkillService.createGuidedSkill(userId, intent, enrichedContext);
        return { skillId: result.skillId, message: 'Skill created.' };
    }

    async _executeProject(userId, payload, intent, agent, agoraContext) {
        // Use DaedalusAgent for intelligent project creation
        const title = intent || 'New Guided Project';
        const description = typeof payload === 'string' ? payload : JSON.stringify(payload);

        // If Daedalus supports architectProject with context
        if (typeof agent.architectFromIntent === 'function') {
            const project = await agent.architectFromIntent(userId, intent, description, agoraContext);
            return { projectId: project.id, message: 'Project architected.' };
        }

        // Fallback: Direct DB insert (legacy)
        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .insert([{
                user_id: userId,
                title: title,
                intent: description,
                status: 'idea',
                why_i_care: 'Created via Guided Action',
                artifacts: []
            }])
            .select()
            .single();

        if (error) throw error;
        return { projectId: project.id, message: 'Project idea created.' };
    }

    async _executeTopic(userId, payload, intent, agent, agoraContext) {
        const title = intent;
        if (!title) throw new Error('Topic action requires an intent (Topic Name).');

        const baseContext = typeof payload === 'string' ? payload : 'Guided Action Creation';
        const context = `${baseContext}\n\n[AGORA CONTEXT]\n${agoraContext}`;

        // CartographerAgent.createTopicWithDomain(userId, title, description)
        const topic = await agent.createTopicWithDomain(userId, title, context);

        // Async analysis
        if (typeof agent.analyzeTopicRelationships === 'function') {
            agent.analyzeTopicRelationships(topic.id)
                .catch(err => console.error("[ActionService] Topic analysis error:", err));
        }

        return { topicId: topic.id, message: 'Topic created and mapped.' };
    }

    async _executeGeneric(actionDef, userId, payload, intent, agent, agoraContext) {
        // Generic handler for future actions
        // The agent should have an `executeAction` method
        if (typeof agent.executeAction === 'function') {
            return await agent.executeAction(userId, payload, intent, agoraContext);
        }

        // If no generic handler, return error
        throw new Error(`Action ${actionDef.slug} has no implementation`);
    }

    // =========================================================================
    // Admin Methods
    // =========================================================================

    async createAction(actionData) {
        const { data, error } = await supabaseAdmin
            .from('actions')
            .insert([actionData])
            .select()
            .single();

        if (error) throw error;
        this.invalidateCache();
        return data;
    }

    async updateAction(id, updates) {
        const { data, error } = await supabaseAdmin
            .from('actions')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        this.invalidateCache();
        return data;
    }

    async deleteAction(id) {
        const { error } = await supabaseAdmin
            .from('actions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        this.invalidateCache();
    }
}

export default new ActionService();
