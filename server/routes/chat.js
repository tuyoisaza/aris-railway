import express from 'express';
import { z } from 'zod';
import { log } from '../utils/logger.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';
import jobQueue from '../services/jobQueue.js';
import ConversationService from '../services/ConversationService.js';
import EventManager from '../services/cognition/EventManager.js';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';
import LibrarianAgent from '../services/ai/agents/LibrarianAgent.js';

const router = express.Router();

// GET /api/chat/folders/:userId
router.get('/folders/:userId', requireAuth, async (req, res, next) => {
    const { userId } = req.params;

    if (userId !== req.user.id) {
        return sendError(res, 'Unauthorized: ID mismatch', 403);
    }

    if (!z.string().uuid().safeParse(userId).success) {
        return sendError(res, 'Invalid user ID format', 400);
    }

    try {
        const { data, error } = await req.userClient
            .from('conversations')
            .select('*, messages(*)') // Select all to avoid missing 'content' column error
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            log('Chat', 'WARN', 'Conversations', error.message);
            return sendSuccess(res, []);
        }
        sendSuccess(res, data || []);
    } catch (err) {
        next(err);
    }
});

// POST /api/chat/conversation
// TEMP DEBUG BYPASS: requireAuth removed if header present, but we need req.user.
// So we must MOCK req.user if bypass is used.
router.post('/conversation', requireAuth, validate(schemas.conversation), async (req, res, next) => {
    const { userId, title, topicId, language, brief, initialContext } = req.body;

    if (userId !== req.user.id) {
        return sendError(res, 'Unauthorized: ID mismatch', 403);
    }

    try {
        // Guided Conversation Flow
        if (brief || initialContext) {
            const result = await ConversationService.startGuidedConversation({
                userId,
                title: title || 'Guided Conversation',
                topicId,
                brief,
                initialContext // will be passed as system context
            });
            return sendSuccess(res, result);
        }

        const { data, error } = await req.userClient
            .from('conversations')
            .insert([{ user_id: userId, title, topic_id: topicId, language }])
            .select()
            .single();

        if (error) throw error;
        
        // XP awarding is now handled by the event-driven ExperienceListener
        // This keeps logic consistent and prevents conflicts
        sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
});

// PUT /api/chat/conversation/:id
router.put('/conversation/:id', requireAuth, async (req, res, next) => {
    const { id } = req.params;
    const { title, language, is_archived } = req.body;
    const userId = req.user.id;

    if (title === undefined && language === undefined && is_archived === undefined) {
        return sendError(res, 'No updates provided', 400);
    }

    try {
        const updates = { updated_at: new Date() };
        if (title !== undefined) updates.title = title;
        if (language !== undefined) updates.language = language;
        if (is_archived !== undefined) updates.is_archived = is_archived;

        const { data, error } = await req.userClient
            .from('conversations')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/chat/conversation/:id
router.delete('/conversation/:id', requireAuth, async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const { error } = await req.userClient
            .from('conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        sendSuccess(res, { success: true });
    } catch (err) {
        next(err);
    }
});

// POST /api/chat/message
router.post('/message', requireAuth, validate(schemas.message), async (req, res, next) => {
    const { conversationId, role, content } = req.body;
    const userId = req.user.id;

    if (role !== 'user') {
        return sendError(res, 'Only user messages can be submitted directly.', 400);
    }

    try {
        // 1. Save User Message
        let userMsg, userError;
        try {
            const res = await req.userClient
                .from('messages')
                .insert([{ conversation_id: conversationId, role: 'user', text: content }])
                .select()
                .single();
            userMsg = res.data;
            userError = res.error;

            if (userError && userError.message.includes('Could not find the \'content\' column')) {
                // Fallback for legacy schema
                log('API', 'WARN', 'Chat', 'Column content not found, trying text column...');
                const retryRes = await req.userClient
                    .from('messages')
                    .insert([{ conversation_id: conversationId, role: 'user', text: content }])
                    .select()
                    .single();
                userMsg = retryRes.data;
                userError = retryRes.error;
            }
        } catch (e) {
            userError = e;
        }

        if (userError) throw userError;

        // 2. Fetch History for Context (Last 10 messages)
        const { data: historyData } = await req.userClient
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .neq('id', userMsg.id)
            .order('created_at', { ascending: false })
            .limit(10);

        const history = (historyData || []).reverse().map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content || msg.text
        }));

        // 2.5. Fetch Conversation Language
        const { data: convMeta } = await req.userClient
            .from('conversations')
            .select('language')
            .eq('id', conversationId)
            .single();

        const conversationLanguage = convMeta?.language || 'en';

        // 3. Generate AI Response using Teacher Agent
        const aiResponseRaw = await TeacherAgent.respondToUser(userId, content, history, conversationLanguage);

        let aiResponse = {};
        try {
            aiResponse = typeof aiResponseRaw === 'string' ? JSON.parse(aiResponseRaw) : aiResponseRaw;
        } catch (e) {
            // If not JSON, treat as plain text response
            aiResponse = { response: aiResponseRaw };
        }

        // 4. Save AI/System Message
        let aiMsg, aiError, milestoneMsg;
        try {
            // Check for Milestone or Proposal in the Action or Root property (Legacy support)
            const isMilestone = aiResponse.isMilestone || (aiResponse.action && aiResponse.action.type === 'milestone');
            const isProposal = aiResponse.isProposal || (aiResponse.action && aiResponse.action.type === 'proposal');

            if (isMilestone) {
                const milestoneType = aiResponse.milestoneType || aiResponse.action?.payload?.milestoneType || aiResponse.action?.payload?.type || 'DEPTH';
                const topic = aiResponse.topic || aiResponse.action?.payload?.topic || 'General';

                // Skip milestone processing if TeacherAgent already handled BRANCH milestone
                if (milestoneType === 'BRANCH' && aiResponse.action?.topicProcessed) {
                    console.log(`[Chat] BRANCH milestone already processed by TeacherAgent, skipping duplicate processing`);

                    // Still create the system message for UI display, but don't trigger job queue
                    const milestonePayload = {
                        type: 'milestone',
                        milestoneType: milestoneType,
                        topic: topic,
                        display: `${milestoneType}: ${topic}`
                    };

                    const res = await req.userClient
                        .from('messages')
                        .insert([{
                            conversation_id: conversationId,
                            role: 'system',
                            text: JSON.stringify(milestonePayload)
                        }])
                        .select()
                        .single();

                    milestoneMsg = res.data;
                } else {
                    const milestonePayload = {
                        type: 'milestone',
                        milestoneType: milestoneType,
                        topic: topic,
                        display: `${milestoneType}: ${topic}`
                    };

                    const res = await req.userClient
                        .from('messages')
                        .insert([{
                            conversation_id: conversationId,
                            role: 'system',
                            text: JSON.stringify(milestonePayload)
                        }])
                        .select()
                        .single();

                    milestoneMsg = res.data;

                    jobQueue.addJob('milestone_triggered', {
                        conversationId,
                        userId,
                        milestoneType: aiResponse.milestoneType,
                        topic: aiResponse.topic
                    });
                }

                // Removed redundant TeacherAgent call that caused double-rendering (and double-cost)
                // We use the original response, but strip the action since it's now a system message.
                const aiResponseForDb = { ...aiResponse };
                // Nullify the action so the frontend doesn't parse it as a milestone again
                aiResponseForDb.action = null;

                const textRes = await req.userClient
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        role: 'ai',
                        text: JSON.stringify(aiResponseForDb)
                    }])
                    .select()
                    .single();

                aiMsg = textRes.data;
                aiError = textRes.error;

            } else if (isProposal) {
                // Handle Project Proposal
                const projectData = aiResponse.projectData || aiResponse.action?.payload || {};
                const proposalPayload = {
                    type: 'proposal',
                    projectData: projectData
                };

                const res = await req.userClient
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        role: 'system',
                        text: JSON.stringify(proposalPayload)
                    }])
                    .select()
                    .single();

                // We use aiResponseRaw if it contains the introduction text as part of the V2 triple
                const aiResponseForDb = typeof aiResponseRaw === 'string' ? JSON.parse(aiResponseRaw) : { ...aiResponseRaw };
                aiResponseForDb.action = null; // Strip action to prevent double render

                const introRes = await req.userClient
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        role: 'ai',
                        text: JSON.stringify(aiResponseForDb)
                    }])
                    .select()
                    .single();

                milestoneMsg = res.data; // Reusing variable for system message part
                aiMsg = introRes.data;

            } else {
                const aiContent = aiResponseRaw;
                const res = await req.userClient
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        role: 'ai',
                        text: aiContent
                    }])
                    .select()
                    .single();
                aiMsg = res.data;
                aiError = res.error;
            }
        } catch (e) {
            aiError = e;
        }

        if (aiError) throw aiError;

        // 5. Trigger Background Cognitive Loop
        jobQueue.addJob('conversation_updated', {
            conversationId,
            userId,
            lastMessageId: userMsg.id
        });

        // 6. Emit Cognitive Events (Facts)
        EventManager.emitEvent(EventManager.EVENTS.AI_RESPONSE_COMPLETED, {
            userId,
            conversationId,
            userContent: content,
            aiResponse: aiResponse // Pass the full response for listeners to analyze (milestones, proposals)
        });

        const responseMessages = [userMsg];
        if (milestoneMsg) responseMessages.push(milestoneMsg);
        if (aiMsg) responseMessages.push(aiMsg);

        sendSuccess(res, {
            userMessage: userMsg,
            aiMessage: aiMsg,
            messages: responseMessages
        });

    } catch (err) {
        next(err);
    }
});

// POST /api/chat/summary
router.post('/summary', requireAuth, validate(schemas.summarize), async (req, res, next) => {
    const { conversationIds } = req.body;

    if (conversationIds.length === 0) {
        return sendError(res, 'No conversations selected', 400);
    }

    try {
        log('Chat', 'INFO', 'Summarize', `Generating summary for ${conversationIds.length} chats`);

        const { data: messages, error } = await req.userClient
            .from('messages')
            .select('role, text, created_at, conversation_id')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            return sendSuccess(res, { summary: "No content found to summarize." });
        }

        const chats = {};
        messages.forEach(msg => {
            if (!chats[msg.conversation_id]) chats[msg.conversation_id] = [];
            const content = msg.text || '';
            const role = msg.role === 'user' ? 'User' : 'AI';
            chats[msg.conversation_id].push(`${role}: ${content}`);
        });

        let fullText = "";
        for (const [id, msgs] of Object.entries(chats)) {
            fullText += `\n--- Conversation ${id} ---\n`;
            fullText += msgs.join('\n');
        }

        const summary = await LibrarianAgent.summarize(fullText);
        sendSuccess(res, { summary });

    } catch (err) {
        next(err);
    }
});

// PUT /api/chat/conversation/:id/move
router.put('/conversation/:id/move', requireAuth, validate(schemas.moveChat), async (req, res, next) => {
    try {
        const { folderId } = req.body;
        const { data, error } = await req.userClient
            .from('conversations')
            .update({ folder_id: folderId })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
});

export default router;
