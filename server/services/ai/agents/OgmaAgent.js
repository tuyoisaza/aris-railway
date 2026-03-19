/**
 * OgmaAgent.js
 * 
 * Memory Custodian Agent for ARIS.
 * 
 * Responsibilities:
 * - Process buffered post-action summaries from all agents
 * - Aggregate signals across time to infer user traits
 * - Apply decay to stale memory entries
 * - Update Layer B (User Memory) with versioned changes
 * 
 * Rules (per specification):
 * - Never act on a single signal
 * - Require cross-context confirmation (minimum 3 signals)
 * - Never infer beliefs or values
 * - Prefer softening over deletion for decay
 */

import { supabaseAdmin } from '../../../db.js';
import AgoraService from '../../AgoraService.js';

class OgmaAgent {
    constructor() {
        this.agentId = 'ogma';

        // Minimum signals required before creating a trait
        this.SIGNAL_THRESHOLD = 3;

        // Minimum days between signals for valid cross-context confirmation
        this.CROSS_CONTEXT_DAYS = 1;

        // Trait key mappings from signal types
        this.SIGNAL_TO_TRAIT = {
            'TOPIC_RECURRENCE': 'topic_affinity',
            'CROSS_TOPIC_REUSE': 'reasoning_style',
            'VOLUNTARY_CONTINUATION': 'persistence_pattern',
            'EXPRESSION_MODE_CHOSEN': 'expression_preference',
            'ENGAGEMENT_SIGNAL': 'engagement_pattern',
            'DISENGAGEMENT_SIGNAL': 'disengagement_pattern',
            'REASONING_STYLE_OBSERVED': 'reasoning_style',
            'DEPTH_PROGRESSION': 'depth_preference',
            'BRANCH_EXPLORATION': 'exploration_style'
        };
    }

    // =========================================================================
    // MAIN PROCESSING LOOP
    // =========================================================================

    /**
     * Process all unprocessed signals for a user.
     * This is the main entry point for Ogma processing.
     * 
     * @param {string} userId - User to process signals for
     * @returns {Promise<Object>} Processing results
     */
    async processBuffer(userId) {
        console.log(`[Ogma] 🔍 Processing signal buffer for user: ${userId}`);

        // Check if trait inference is enabled
        const canInfer = await AgoraService.isTraitInferenceEnabled(userId);
        if (!canInfer) {
            console.log(`[Ogma] ⏭️ Trait inference disabled for user ${userId}`);
            return { skipped: true, reason: 'trait_inference_disabled' };
        }

        // Get unprocessed signals
        const signals = await AgoraService.getUnprocessedSignals(userId);

        if (signals.length === 0) {
            console.log(`[Ogma] ✅ No signals to process`);
            return { processed: 0, traits_updated: 0 };
        }

        console.log(`[Ogma] 📥 Found ${signals.length} unprocessed signals`);

        // Group signals by type
        const signalGroups = this._groupSignals(signals);

        // Process each signal type
        const results = {
            processed: signals.length,
            traits_updated: 0,
            traits_created: 0,
            signals_below_threshold: 0
        };

        for (const [signalType, groupedSignals] of Object.entries(signalGroups)) {
            const traitResult = await this._processSignalGroup(userId, signalType, groupedSignals);

            if (traitResult.created) results.traits_created++;
            if (traitResult.updated) results.traits_updated++;
            if (traitResult.below_threshold) results.signals_below_threshold++;
        }

        // Mark all signals as processed
        const signalIds = signals.map(s => s.id);
        await AgoraService.markSignalsProcessed(signalIds);

        console.log(`[Ogma] ✅ Processing complete:`, results);
        return results;
    }

    /**
     * Process signals for all users with pending signals.
     * Called periodically by job queue.
     */
    async processAllUsers() {
        console.log(`[Ogma] 🔄 Starting batch processing for all users`);

        // Get unique users with unprocessed signals
        const { data: users, error } = await supabaseAdmin
            .from('agora_post_action_buffer')
            .select('user_id')
            .eq('processed', false);

        if (error) {
            console.error('[Ogma] Error fetching users:', error);
            return { error: error.message };
        }

        const uniqueUsers = [...new Set(users.map(u => u.user_id))];
        console.log(`[Ogma] 👥 Found ${uniqueUsers.length} users with pending signals`);

        const results = [];
        for (const userId of uniqueUsers) {
            try {
                const result = await this.processBuffer(userId);
                results.push({ userId, ...result });
            } catch (err) {
                console.error(`[Ogma] Error processing user ${userId}:`, err);
                results.push({ userId, error: err.message });
            }
        }

        return { users_processed: uniqueUsers.length, results };
    }

    // =========================================================================
    // SIGNAL AGGREGATION
    // =========================================================================

    /**
     * Group signals by type for aggregation
     */
    _groupSignals(signals) {
        const groups = {};

        for (const signal of signals) {
            if (!groups[signal.signal_type]) {
                groups[signal.signal_type] = [];
            }
            groups[signal.signal_type].push(signal);
        }

        return groups;
    }

    /**
     * Process a group of signals of the same type
     */
    async _processSignalGroup(userId, signalType, signals) {
        const traitKey = this.SIGNAL_TO_TRAIT[signalType];

        if (!traitKey) {
            console.warn(`[Ogma] Unknown signal type mapping: ${signalType}`);
            return { below_threshold: true };
        }

        // Check if we have enough signals (repetition threshold)
        if (signals.length < this.SIGNAL_THRESHOLD) {
            console.log(`[Ogma] ⏳ ${signalType}: ${signals.length}/${this.SIGNAL_THRESHOLD} signals (below threshold)`);
            return { below_threshold: true };
        }

        // Check for cross-context confirmation
        const hasCrossContext = this._hasCrossContextConfirmation(signals);
        if (!hasCrossContext) {
            console.log(`[Ogma] ⏳ ${signalType}: Signals lack cross-context confirmation`);
            return { below_threshold: true };
        }

        // Aggregate signal data to create trait value
        const traitValue = this._aggregateToTraitValue(signalType, signals);

        // Calculate confidence based on signal count and consistency
        const confidence = this._calculateConfidence(signals);

        // Update memory
        const existingMemory = await this._getExistingTrait(userId, traitKey);

        await AgoraService.updateMemoryTrait(userId, traitKey, traitValue, confidence);

        return existingMemory ? { updated: true } : { created: true };
    }

    /**
     * Check if signals span multiple contexts (different days/conversations)
     */
    _hasCrossContextConfirmation(signals) {
        if (signals.length < 2) return false;

        // Check if signals span different days
        const dates = signals.map(s => new Date(s.created_at).toDateString());
        const uniqueDates = [...new Set(dates)];

        if (uniqueDates.length >= 2) return true;

        // Check if signals come from different conversations
        const conversations = signals.map(s => s.conversation_id).filter(Boolean);
        const uniqueConversations = [...new Set(conversations)];

        return uniqueConversations.length >= 2;
    }

    /**
     * Aggregate signals into a human-readable trait value
     * Uses tentative language per specification
     */
    _aggregateToTraitValue(signalType, signals) {
        // Extract common patterns from signal data
        const patterns = signals.map(s => s.signal_data);

        switch (signalType) {
            case 'TOPIC_RECURRENCE': {
                const topics = patterns.map(p => p.topic).filter(Boolean);
                const topicCounts = this._countOccurrences(topics);
                const topTopic = Object.entries(topicCounts)
                    .sort((a, b) => b[1] - a[1])[0];

                return topTopic
                    ? `Tends to return to ${topTopic[0]} across sessions`
                    : 'Shows interest in recurring topics';
            }

            case 'CROSS_TOPIC_REUSE': {
                const concepts = patterns.map(p => p.concept).filter(Boolean);
                const topConcept = this._mostFrequent(concepts);

                return topConcept
                    ? `Often applies ${topConcept} concepts across different domains`
                    : 'Tends to transfer concepts between topics';
            }

            case 'VOLUNTARY_CONTINUATION': {
                return 'Demonstrates persistence in returning to projects unprompted';
            }

            case 'EXPRESSION_MODE_CHOSEN': {
                const modes = patterns.map(p => p.mode).filter(Boolean);
                const topMode = this._mostFrequent(modes);

                return topMode
                    ? `Prefers ${topMode} expression mode`
                    : 'Shows consistent expression preferences';
            }

            case 'ENGAGEMENT_SIGNAL': {
                const levels = patterns.map(p => p.level).filter(Boolean);
                const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

                if (avgLevel > 0.7) return 'Shows high engagement during learning sessions';
                if (avgLevel > 0.4) return 'Maintains moderate engagement during sessions';
                return 'Engagement varies across sessions';
            }

            case 'DISENGAGEMENT_SIGNAL': {
                const triggers = patterns.map(p => p.trigger).filter(Boolean);
                const topTrigger = this._mostFrequent(triggers);

                return topTrigger
                    ? `Tends to disengage when encountering ${topTrigger}`
                    : 'Shows patterns of topic abandonment';
            }

            case 'REASONING_STYLE_OBSERVED': {
                const styles = patterns.map(p => p.style).filter(Boolean);
                const topStyle = this._mostFrequent(styles);

                return topStyle
                    ? `Often reasons using ${topStyle} rather than other approaches`
                    : 'Shows consistent reasoning patterns';
            }

            case 'DEPTH_PROGRESSION': {
                const directions = patterns.map(p => p.direction).filter(Boolean);
                const goesDeep = directions.filter(d => d === 'deeper').length > directions.length / 2;

                return goesDeep
                    ? 'Tends to explore topics in depth rather than breadth'
                    : 'Prefers breadth over depth in topic exploration';
            }

            case 'BRANCH_EXPLORATION': {
                return 'Demonstrates tendency to explore tangential topics';
            }

            default:
                return `Shows pattern in ${signalType.toLowerCase().replace(/_/g, ' ')}`;
        }
    }

    /**
     * Calculate confidence based on signal characteristics
     */
    _calculateConfidence(signals) {
        // Base confidence from signal count
        let confidence = Math.min(0.9, 0.3 + (signals.length * 0.1));

        // Boost for cross-day confirmation
        const dates = signals.map(s => new Date(s.created_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        if (uniqueDates.length >= 3) confidence += 0.1;

        // Boost for multiple agent sources
        const agents = signals.map(s => s.agent_id);
        const uniqueAgents = [...new Set(agents)];
        if (uniqueAgents.length >= 2) confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    // =========================================================================
    // DECAY MANAGEMENT
    // =========================================================================

    /**
     * Apply decay to all stale memory entries for a user.
     * Called periodically (e.g., daily) by job queue.
     */
    async applyDecay(userId) {
        console.log(`[Ogma] 🕐 Applying decay for user: ${userId}`);
        await AgoraService.applyDecay(userId);
    }

    /**
     * Apply decay for all users
     */
    async applyDecayAllUsers() {
        console.log(`[Ogma] 🕐 Applying decay for all users`);

        const { data: users, error } = await supabaseAdmin
            .from('agora_user_memory')
            .select('user_id');

        if (error) {
            console.error('[Ogma] Error fetching users for decay:', error);
            return { error: error.message };
        }

        const uniqueUsers = [...new Set(users.map(u => u.user_id))];

        for (const userId of uniqueUsers) {
            await this.applyDecay(userId);
        }

        return { users_processed: uniqueUsers.length };
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    async _getExistingTrait(userId, traitKey) {
        const { data } = await supabaseAdmin
            .from('agora_user_memory')
            .select('*')
            .eq('user_id', userId)
            .eq('trait_key', traitKey)
            .single();

        return data;
    }

    _countOccurrences(arr) {
        return arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    }

    _mostFrequent(arr) {
        if (!arr || arr.length === 0) return null;

        const counts = this._countOccurrences(arr);
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
    }
}

// Singleton export
export default new OgmaAgent();
