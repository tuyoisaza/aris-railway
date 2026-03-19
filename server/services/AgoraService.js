/**
 * AgoraService.js
 * 
 * Centralized state management for ARIS shared state architecture.
 * Provides read/write access to the three-layer Agora model.
 * 
 * Layer A: Stable User State (read-only for agents)
 * Layer B: User Memory Layer (read-only for agents, Ogma writes)
 * Layer C: Session Context (read/write by conversation system)
 */

import { supabaseAdmin } from '../db.js';

class AgoraService {
    constructor() {
        this.SIGNAL_TYPES = [
            'TOPIC_RECURRENCE',
            'CROSS_TOPIC_REUSE',
            'VOLUNTARY_CONTINUATION',
            'EXPRESSION_MODE_CHOSEN',
            'ENGAGEMENT_SIGNAL',
            'DISENGAGEMENT_SIGNAL',
            'REASONING_STYLE_OBSERVED',
            'DEPTH_PROGRESSION',
            'BRANCH_EXPLORATION'
        ];
    }

    // =========================================================================
    // SNAPSHOT (Phase 1 - Read)
    // =========================================================================

    /**
     * Get a complete read-only snapshot of the Agora for an agent.
     * This is the primary method agents use before execution.
     * 
     * @param {string} userId - User UUID
     * @param {string} sessionId - Optional session UUID for Layer C
     * @returns {Promise<Object>} Agora snapshot with all 3 layers
     */
    async getSnapshot(userId, sessionId = null) {
        try {
            const [stableState, userMemory, sessionContext] = await Promise.all([
                this.getStableState(userId),
                this.getUserMemory(userId),
                sessionId ? this.getSessionContext(sessionId) : null
            ]);

            return {
                layerA: stableState,
                layerB: userMemory,
                layerC: sessionContext,
                timestamp: new Date().toISOString(),
                userId
            };
        } catch (err) {
            console.error('[Agora] Error generating snapshot:', err);
            // Return safe defaults on failure
            return {
                layerA: this._defaultStableState(userId),
                layerB: [],
                layerC: null,
                timestamp: new Date().toISOString(),
                userId,
                error: err.message
            };
        }
    }

    // =========================================================================
    // LAYER A: Stable User State
    // =========================================================================

    /**
     * Get Layer A - Stable User State
     * This includes identity, permissions, and constraints.
     */
    async getStableState(userId) {
        const { data, error } = await supabaseAdmin
            .from('agora_stable_state')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If not found, create default state
            if (error.code === 'PGRST116') {
                return await this._createDefaultStableState(userId);
            }
            console.error('[Agora] Error fetching stable state:', error);
            return this._defaultStableState(userId);
        }

        return data;
    }

    /**
     * Update Layer A (restricted - only for auth/admin use)
     */
    async updateStableState(userId, updates) {
        const allowedFields = ['user_role', 'family_boundaries', 'consent_flags', 'subscription_tier', 'language_pref'];
        const safeUpdates = {};
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field];
            }
        }

        safeUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('agora_stable_state')
            .upsert({ user_id: userId, ...safeUpdates })
            .select()
            .single();

        if (error) {
            console.error('[Agora] Error updating stable state:', error);
            throw error;
        }

        return data;
    }

    _defaultStableState(userId) {
        return {
            user_id: userId,
            user_role: 'adult',
            family_boundaries: {},
            consent_flags: {
                memory_enabled: true,
                trait_inference: true,
                cross_session_learning: true
            },
            subscription_tier: 'free',
            language_pref: 'en'
        };
    }

    async _createDefaultStableState(userId) {
        const defaults = this._defaultStableState(userId);
        
        const { data, error } = await supabaseAdmin
            .from('agora_stable_state')
            .insert(defaults)
            .select()
            .single();

        if (error) {
            console.error('[Agora] Error creating default stable state:', error);
            return defaults;
        }

        return data;
    }

    // =========================================================================
    // LAYER B: User Memory Layer
    // =========================================================================

    /**
     * Get Layer B - User Memory (read for agents, transparency for users)
     * Returns all active memory traits for a user.
     */
    async getUserMemory(userId) {
        const { data, error } = await supabaseAdmin
            .from('agora_user_memory')
            .select('*')
            .eq('user_id', userId)
            .order('confidence', { ascending: false });

        if (error) {
            console.error('[Agora] Error fetching user memory:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get formatted memory for agent context injection
     * Returns human-readable summary of user traits
     */
    async getFormattedMemory(userId) {
        const memory = await this.getUserMemory(userId);
        
        if (!memory || memory.length === 0) {
            return null;
        }

        // Only include traits with confidence > 0.4
        const significantTraits = memory.filter(m => m.confidence > 0.4);
        
        if (significantTraits.length === 0) {
            return null;
        }

        const lines = significantTraits.map(m => 
            `- ${m.trait_value} (${Math.round(m.confidence * 100)}% confidence)`
        );

        return `[USER MEMORY - Inferred Tendencies]\n${lines.join('\n')}`;
    }

    /**
     * User correction endpoint - allows users to dispute traits
     * Immediately reduces confidence or removes the trait.
     */
    async correctMemory(userId, traitKey, correction) {
        // Get current memory
        const { data: current } = await supabaseAdmin
            .from('agora_user_memory')
            .select('*')
            .eq('user_id', userId)
            .eq('trait_key', traitKey)
            .single();

        if (!current) {
            throw new Error(`Trait '${traitKey}' not found`);
        }

        // Log the correction in audit
        await this._auditLog(userId, traitKey, 'CORRECTION', current, { correction });

        // Reduce confidence significantly or delete
        if (current.confidence <= 0.3) {
            // Delete if already low confidence
            await supabaseAdmin
                .from('agora_user_memory')
                .delete()
                .eq('id', current.id);
            
            return { action: 'deleted', traitKey };
        } else {
            // Reduce confidence by 50%
            const newConfidence = Math.max(0.1, current.confidence * 0.5);
            
            const { data } = await supabaseAdmin
                .from('agora_user_memory')
                .update({ 
                    confidence: newConfidence,
                    version: current.version + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', current.id)
                .select()
                .single();

            return { action: 'confidence_reduced', traitKey, newConfidence, data };
        }
    }

    // =========================================================================
    // LAYER C: Session Context
    // =========================================================================

    /**
     * Get Layer C - Current Session Context
     */
    async getSessionContext(sessionId) {
        const { data, error } = await supabaseAdmin
            .from('agora_session_context')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Agora] Error fetching session context:', error);
        }

        return data || null;
    }

    /**
     * Update or create session context
     * Called by conversation system during active sessions.
     */
    async updateSessionContext(userId, sessionId, updates) {
        const allowedFields = ['active_topic', 'current_posture', 'task_intent', 'constraints'];
        const safeUpdates = { user_id: userId, session_id: sessionId };
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field];
            }
        }

        safeUpdates.updated_at = new Date().toISOString();
        safeUpdates.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

        const { data, error } = await supabaseAdmin
            .from('agora_session_context')
            .upsert(safeUpdates, { onConflict: 'session_id' })
            .select()
            .single();

        if (error) {
            console.error('[Agora] Error updating session context:', error);
            throw error;
        }

        return data;
    }

    /**
     * Clear session context (on logout or session end)
     */
    async clearSessionContext(sessionId) {
        await supabaseAdmin
            .from('agora_session_context')
            .delete()
            .eq('session_id', sessionId);
    }

    // =========================================================================
    // POST-ACTION SUMMARY BUFFER (Phase 3 - Emit)
    // =========================================================================

    /**
     * Emit a post-action summary to the buffer.
     * Called by agents after execution to report signals.
     * 
     * @param {string} agentId - The agent emitting the signal
     * @param {string} userId - Target user
     * @param {string} signalType - One of SIGNAL_TYPES
     * @param {Object} signalData - Structured signal data
     * @param {string} conversationId - Optional conversation reference
     */
    async emitPostActionSummary(agentId, userId, signalType, signalData, conversationId = null) {
        if (!this.SIGNAL_TYPES.includes(signalType)) {
            console.warn(`[Agora] Unknown signal type: ${signalType}`);
        }

        const { data, error } = await supabaseAdmin
            .from('agora_post_action_buffer')
            .insert({
                agent_id: agentId,
                user_id: userId,
                signal_type: signalType,
                signal_data: signalData,
                conversation_id: conversationId,
                processed: false
            })
            .select()
            .single();

        if (error) {
            console.error('[Agora] Error emitting post-action summary:', error);
            throw error;
        }

        console.log(`[Agora] 📤 Signal emitted: ${signalType} from ${agentId}`);
        return data;
    }

    /**
     * Get unprocessed signals for Ogma
     */
    async getUnprocessedSignals(userId = null, limit = 100) {
        let query = supabaseAdmin
            .from('agora_post_action_buffer')
            .select('*')
            .eq('processed', false)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Agora] Error fetching unprocessed signals:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Mark signals as processed
     */
    async markSignalsProcessed(signalIds) {
        const { error } = await supabaseAdmin
            .from('agora_post_action_buffer')
            .update({ 
                processed: true, 
                processed_at: new Date().toISOString() 
            })
            .in('id', signalIds);

        if (error) {
            console.error('[Agora] Error marking signals processed:', error);
            throw error;
        }
    }

    // =========================================================================
    // OGMA MEMORY UPDATES (Layer B writes - Ogma only)
    // =========================================================================

    /**
     * Update or create a memory trait (Ogma only)
     * Creates an audit trail for all changes.
     */
    async updateMemoryTrait(userId, traitKey, traitValue, confidence = 0.5) {
        // Check existing
        const { data: existing } = await supabaseAdmin
            .from('agora_user_memory')
            .select('*')
            .eq('user_id', userId)
            .eq('trait_key', traitKey)
            .single();

        let result;
        let changeType;

        if (existing) {
            // Update existing trait
            changeType = 'UPDATE';
            const { data, error } = await supabaseAdmin
                .from('agora_user_memory')
                .update({
                    trait_value: traitValue,
                    confidence: Math.min(1.0, confidence),
                    last_confirmed: new Date().toISOString(),
                    decay_factor: 1.0, // Reset decay on confirmation
                    version: existing.version + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;

            // Audit log
            await this._auditLog(userId, traitKey, changeType, existing, result);
        } else {
            // Create new trait
            changeType = 'CREATE';
            const { data, error } = await supabaseAdmin
                .from('agora_user_memory')
                .insert({
                    user_id: userId,
                    trait_key: traitKey,
                    trait_value: traitValue,
                    confidence: Math.min(1.0, confidence),
                    last_confirmed: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            result = data;

            // Audit log
            await this._auditLog(userId, traitKey, changeType, null, result);
        }

        console.log(`[Agora] 🧠 Memory ${changeType}: ${traitKey} = "${traitValue}" (${confidence})`);
        return result;
    }

    /**
     * Apply decay to memory traits (Ogma maintenance)
     * Called periodically to reduce confidence on stale traits.
     */
    async applyDecay(userId, decayRate = 0.05) {
        const memory = await this.getUserMemory(userId);
        const now = new Date();
        const decayThresholdDays = 7; // Start decay after 7 days of inactivity

        for (const trait of memory) {
            const lastConfirmed = new Date(trait.last_confirmed);
            const daysSinceConfirm = (now - lastConfirmed) / (1000 * 60 * 60 * 24);

            if (daysSinceConfirm > decayThresholdDays) {
                const newConfidence = Math.max(0.1, trait.confidence - decayRate);
                
                if (newConfidence < 0.15) {
                    // Delete if decayed too much
                    await this._auditLog(userId, trait.trait_key, 'DELETE', trait, null);
                    await supabaseAdmin
                        .from('agora_user_memory')
                        .delete()
                        .eq('id', trait.id);
                    console.log(`[Agora] 🗑️ Deleted decayed trait: ${trait.trait_key}`);
                } else {
                    // Apply decay
                    await this._auditLog(userId, trait.trait_key, 'DECAY', 
                        { confidence: trait.confidence }, 
                        { confidence: newConfidence }
                    );
                    await supabaseAdmin
                        .from('agora_user_memory')
                        .update({
                            confidence: newConfidence,
                            decay_factor: trait.decay_factor * (1 - decayRate)
                        })
                        .eq('id', trait.id);
                }
            }
        }
    }

    // =========================================================================
    // AUDIT LOG
    // =========================================================================

    async _auditLog(userId, traitKey, changeType, oldValue, newValue, changedBy = 'ogma') {
        try {
            await supabaseAdmin
                .from('agora_memory_audit')
                .insert({
                    user_id: userId,
                    trait_key: traitKey,
                    change_type: changeType,
                    old_value: oldValue,
                    new_value: newValue,
                    changed_by: changedBy
                });
        } catch (err) {
            console.error('[Agora] Error writing audit log:', err);
        }
    }

    /**
     * Get audit history for a user
     */
    async getAuditHistory(userId, limit = 50) {
        const { data, error } = await supabaseAdmin
            .from('agora_memory_audit')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Agora] Error fetching audit history:', error);
            return [];
        }

        return data || [];
    }

    // =========================================================================
    // CONSENT CHECKS
    // =========================================================================

    /**
     * Check if memory features are enabled for user
     */
    async isMemoryEnabled(userId) {
        const state = await this.getStableState(userId);
        return state?.consent_flags?.memory_enabled ?? true;
    }

    /**
     * Check if trait inference is enabled
     */
    async isTraitInferenceEnabled(userId) {
        const state = await this.getStableState(userId);
        return state?.consent_flags?.trait_inference ?? true;
    }
}

// Singleton export
export default new AgoraService();
