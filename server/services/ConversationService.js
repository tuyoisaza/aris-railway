import { supabaseAdmin } from '../db.js';
import TeacherAgent from './ai/agents/TeacherAgent.js';
import SkillService from './SkillService.js';

class ConversationService {

    /**
     * Starts or resumes a guided conversation.
     * 1. Checks for existing conversation by title.
     * 2. If exists but empty (zombie), seeds it.
     * 3. If new, creates and seeds it.
     * 4. Awards XP if specified.
     */
    async startGuidedConversation({ userId, title, topicId, brief, initialContext, initialXp, skillId, level }) {
        // 1. Check for Existing
        // 1. Check for Existing
        let query = supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('user_id', userId);

        if (topicId) {
            query = query.eq('topic_id', topicId);
        }

        // Always check title to distinguish multiple conversations within same topic (e.g. Skills)
        // Always check title to distinguish multiple conversations within same topic (e.g. Skills)
        query = query.ilike('title', title)
            .order('updated_at', { ascending: false })
            .limit(1);

        const { data: existingConvs, error: findError } = await query;
        if (findError) console.error('[ConversationService] Find Error:', findError);

        const existingConv = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;

        let conversationId;
        let isNew = false;

        if (existingConv) {
            conversationId = existingConv.id;

            // Check for Zombie State (Empty Conversation)
            const { count } = await supabaseAdmin
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId);

            if (count === 0) {
                console.log(`[ConversationService] detected zombie conversation ${conversationId}, reseeding...`);
                await this._seedConversation(conversationId, userId, brief, initialContext);
                isNew = true; // Treat as new for UI purposes (it's a fresh start)
            }
        } else {
            // Create New
            const { data: newConv, error } = await supabaseAdmin
                .from('conversations')
                .insert([{
                    user_id: userId,
                    title: title,
                    topic_id: topicId || null,
                    language: 'en-US'
                }])
                .select()
                .single();

            if (error) throw error;
            conversationId = newConv.id;
            isNew = true;

            await this._seedConversation(conversationId, userId, brief, initialContext);
        }

        // Emit Event for Side Effects (XP, Analytics, etc.)
        const EventManager = (await import('./cognition/EventManager.js')).default;
        EventManager.emitEvent(EventManager.EVENTS.CONVERSATION_STARTED, {
            userId,
            conversationId,
            isNew,
            skillId,
            level,
            initialXp, // Passed to listener to handle award
            topicId // Include for XP notifications
        });

        return { conversationId, isNew };
    }

    async _seedConversation(conversationId, userId, brief, systemContext) {
        // 1. Insert User Brief
        const { error: userMsgError } = await supabaseAdmin
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                role: 'user',
                text: brief
            }]);

        if (userMsgError) {
            console.error('[ConversationService] Failed to insert user brief:', userMsgError);
            throw userMsgError;
        }

        // 2. Prepare History/Context for AI
        // We merged context into the user message to ensure the AI attends to it 
        // without confusing valid system prompt ordering.
        const history = [];

        // 3. Generate Reply
        // Combine context + brief for the AI, but only save brief to DB (already done)
        let aiPrompt = brief;
        if (systemContext) {
            const contextStr = typeof systemContext === 'object'
                ? JSON.stringify(systemContext)
                : String(systemContext);
            aiPrompt = `[CONTEXT]\n${contextStr}\n\n[USER REQUEST]\n${brief}`;
        }

        const aiResponse = await TeacherAgent.respondToUser(
            userId,
            aiPrompt,
            history,
            'en',
            false,
            conversationId
        );

        // 4. Parse V2 JSON Response (Extract human-readable text)
        // We now store the full JSON to preserve 'options' and 'action' for the frontend.
        let responseText = aiResponse;
        try {
            // Validate it is JSON, but keep the raw string
            JSON.parse(aiResponse);
        } catch (e) {
            console.log('[ConversationService] AI response is not JSON, using raw text');
        }

        // 5. Save AI Reply (with parsed text, not raw JSON)
        const { error: aiMsgError } = await supabaseAdmin
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                role: 'ai',
                text: responseText
            }]);

        if (aiMsgError) {
            console.error('[ConversationService] Failed to insert AI reply:', aiMsgError);
            throw aiMsgError;
        }
    }
}

export default new ConversationService();
