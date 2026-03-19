import { supabaseAdmin } from '../db.js';
import crypto from 'crypto';
import EventManager from './cognition/EventManager.js';

class TopicService {

    /**
     * Normalize a title for comparison by removing common stop words and special chars.
     */
    normalizeTitle(title) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/^(the|a|an)\s+/i, '') // Remove leading articles
            .replace(/\s+/g, ' ')           // Normalize spaces
            .trim();
    }

    /**
     * Creates a topic (or returns existing if match found - Re-encounter).
     * @param {object} params - { title, description, category, userId }
     * @returns {Promise<object>} - The topic
     */
    async createTopic({ title, description, category, userId }) {
        console.log(`[TopicService] 🔍🔍 STARTING TOPIC CREATION: "${title}" for user: ${userId}`);
        console.log(`[TopicService] 🔍🔍 CALL STACK:`, new Error().stack?.split('\n').slice(0, 4));
        
        // Immediate duplicate check before any processing
        if (!title || !title.trim()) {
            console.error('[TopicService] ❌ Cannot create topic with empty title');
            throw new Error('Topic title is required');
        }

        const cleanTitle = title.trim();
        const normalizedInput = this.normalizeTitle(cleanTitle);

        // EXTENSIVE duplicate check - all existing topics, not just recent
        console.log(`[TopicService] 🔍🔍 Checking for existing topics: "${normalizedInput}"`);
        const { data: allExistingTopics } = await supabaseAdmin
            .from('topics')
            .select('id, title, created_at')
            .eq('user_id', userId);

        const exactMatch = allExistingTopics?.find(t =>
            t.title.toLowerCase() === cleanTitle.toLowerCase()
        );

        const normalizedMatch = allExistingTopics?.find(t =>
            this.normalizeTitle(t.title) === normalizedInput
        );

        if (exactMatch) {
            console.log(`[TopicService] 🚫 EXACT MATCH FOUND - ID: ${exactMatch.id}, Created: ${exactMatch.created_at}`);
            return { ...exactMatch, isReencounter: true, prevented: 'exact_duplicate' };
        }

        if (normalizedMatch) {
            console.log(`[TopicService] 🚫 NORMALIZED MATCH FOUND - ID: ${normalizedMatch.id}, Created: ${normalizedMatch.created_at}`);
            return { ...normalizedMatch, isReencounter: true, prevented: 'normalized_duplicate' };
        }

        console.log(`[TopicService] 🔍🔍 NO DUPLICATES FOUND, proceeding with creation: "${cleanTitle}"`);

        try {
            console.log(`[TopicService] 🔍🔍 ATTEMPTING DATABASE INSERT: "${cleanTitle}"`);
            
            // 1. Try to insert first - database constraint will prevent exact duplicates
            const { data: newTopic, error: insertError } = await supabaseAdmin
                .from('topics')
                .insert([{
                    id: crypto.randomUUID(),
                    title: cleanTitle,
                    description: description || 'New topic',
                    category: category || 'General',
                    depth: 1,
                    max_depth: 7,
                    engagement: 0,
                    connections: 0,
                    user_id: userId
                }])
                .select()
                .single();

            if (!insertError && newTopic) {
                console.log(`[TopicService] ✅ SUCCESS: New topic created: "${cleanTitle}" (${newTopic.id}) at ${newTopic.created_at}`);
                
                // Emit Created Event
                EventManager.emitEvent(EventManager.EVENTS.TOPIC_CREATED, {
                    topicId: newTopic.id,
                    userId: userId,
                    title: newTopic.title
                });
                
                return newTopic;
            }

            // 2. If insert failed due to unique constraint, find existing topic
            if (insertError?.message?.includes('unique_topic_title_per_user') || 
                insertError?.code === '23505') {
            
                console.log(`[TopicService] 🧠 DATABASE CONSTRAINT TRIGGERED: Searching for existing: "${cleanTitle}"`);
                console.log(`[TopicService] 🔍🔍 INSERT ERROR DETAILS:`, {
                    message: insertError.message,
                    code: insertError.code,
                    details: insertError.details
                });
            
                const { data: existingTopics, error: fetchError } = await supabaseAdmin
                    .from('topics')
                    .select('*')
                    .eq('user_id', userId)
                    .ilike('title', cleanTitle)
                    .limit(1);
            
                if (fetchError) {
                    console.error('[TopicService] Fetch error after duplicate:', fetchError);
                    throw fetchError;
                }
            
                const existing = existingTopics?.[0];
                if (existing) {
                    console.log(`[TopicService] 🧠 SUCCESS: Re-encounter mapped! "${cleanTitle}" -> "${existing.title}" (${existing.id}) created: ${existing.created_at}`);

                    // Emit Revisited Event
                    EventManager.emitEvent(EventManager.EVENTS.TOPIC_REVISITED, {
                        topicId: existing.id,
                        userId: userId,
                        originalIntent: cleanTitle,
                        revisitedAt: new Date()
                    });

                    return { ...existing, isReencounter: true };
                } else {
                    console.error('[TopicService] ❌ CRITICAL: Constraint triggered but no existing topic found!');
                    throw new Error('Database constraint violation but no existing topic found');
                }
            }

            // 3. If we get here, there was an unexpected error
            console.error('[TopicService] ❌ Unexpected error in insert phase:', insertError);
            throw insertError || new Error('Unknown error in topic creation insert phase');

        } catch (error) {
            // Enhanced error logging for debugging race conditions
            console.error('[TopicService] ❌ Topic creation failed:', {
                error: error.message,
                title: cleanTitle,
                userId: userId,
                normalizedInput,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Link a user to a topic (Progress tracking).
     */
    async linkUserToTopic(userId, topicId, initialIntent) {
        const { data, error } = await supabaseAdmin
            .from('user_topic_progress')
            .upsert({
                user_id: userId,
                topic_id: topicId,
                initial_intent: initialIntent,
                last_active: new Date()
            }, { onConflict: 'user_id, topic_id' })
            .select()
            .single();

        if (error) {
            console.error('[TopicService] Link Error:', error.message);
            throw error;
        }
    }

    /**
     * Increment topic engagement score.
     */
    async incrementEngagement(topicId, userId, amount = 1) {
        const { data: progress } = await supabaseAdmin
            .from('user_topic_progress')
            .update({
                engagement_score: (progress.engagement_score || 0) + amount,
                last_active: new Date()
            })
            .eq('user_id', userId)
            .eq('topic_id', topicId);

        if (error) {
            console.error('[TopicService] Increment Error:', error.message);
            throw error;
        }
        return progress;
    }

    /**
     * Merge multiple topics into one.
     * DISABLED: Function disabled to prevent automatic topic creation
     */
    async mergeTopics(userId, sourceTopicIds) {
        console.log(`[TopicService] 🔍🔍 MERGE TOPICS CALLED - DISABLED TO PREVENT DUPLICATES`);
        console.log(`[TopicService] 🔍🔍 Source topic IDs:`, sourceTopicIds);
        
        // TEMPORARILY DISABLED TO DEBUG DUPLICATE TOPIC ISSUE
        if (!sourceTopicIds || sourceTopicIds.length < 2) {
            console.log(`[TopicService] ❌ Merge requires at least 2 topics, received: ${sourceTopicIds?.length || 0}`);
            throw new Error('At least two topics are required for a merge.');
        }

        console.log(`[TopicService] 🔍🔍 MERGE FUNCTION DISABLED - returning ${sourceTopicIds?.length || 0} existing topics without modification`);

        // DISABLED: Return existing topics without creating new ones
        const { data: sourceTopics, error: fetchErr } = await supabaseAdmin
            .from('topics')
            .select('*')
            .in('id', sourceTopicIds)
            .eq('user_id', userId);

        if (fetchErr || !sourceTopics || sourceTopics.length === 0) {
            throw new Error('Failed to fetch source topics.');
        }

        return sourceTopics || [];
    }

    /**
     * Update topic content (Enrichment).
     */
    async enrichTopic(topicId, contentObj) {
        const { data: topic, error: updateError } = await supabaseAdmin
            .from('topics')
            .update({
                content: contentObj,
                status: 'enriched',
                updated_at: new Date()
            })
            .eq('id', topicId)
            .select('user_id')
            .single();

        if (updateError) {
            console.error('[TopicService] Enrich Error:', updateError);
            throw updateError;
        }

        // Trigger next steps via JobQueue
        const jobQueue = (await import('./jobQueue.js')).default;
        jobQueue.addJob('content_enriched', { topicId, userId: topic.user_id });

        return topic;
    }

    /**
     * Save topic relationship edges.
     */
    async saveEdges(edges) {
        if (!edges || edges.length === 0) return;

        const edgeRows = edges.map(edge => ({
            source_topic_id: edge.source,
            target_topic_id: edge.target,
            label: edge.label,
            rationale: edge.rationale,
            created_at: new Date()
        }));

        const { data, error } = await supabaseAdmin
            .from('topic_edges')
            .insert(edgeRows)
            .select();

        if (error) {
            console.error('[TopicService] Save Edges Error:', error.message);
            throw error;
        }
        
        console.log(`[TopicService] 🔍🔍 SAVING ${edgeRows.length} edges...`);
        return data;
    }
}

export default new TopicService();