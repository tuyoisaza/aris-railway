import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireAuth } from '../middleware.js';
import { supabaseAdmin } from '../db.js';
import CartographerAgent from '../services/ai/agents/CartographerAgent.js';
import ThothAgent from '../services/ai/agents/ThothAgent.js';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';
import LibrarianAgent from '../services/ai/agents/LibrarianAgent.js';
import ConversationService from '../services/ConversationService.js';

const router = express.Router();

// Schema for progress update
const progressSchema = z.object({
    depth: z.number().int().min(1).max(7).optional(),
    engagement: z.number().int().min(0).optional()
});

/**
 * GET /api/topics/graph
 * Get D3-formatted graph data (Nodes & Links)
 */
router.get('/graph', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id; // User's own graph

        // 1. Fetch Topics & Relations (Only for this user)
        const { data: topics, error: topicsErr } = await supabaseAdmin
            .from('topics')
            .select('*')
            .eq('user_id', userId);

        if (topicsErr) throw topicsErr;

        // 2. Fetch User Progress
        const { data: progress, error: progressErr } = await req.userClient
            .from('user_topic_progress')
            .select('*')
            .eq('user_id', userId);

        const progressMap = new Map();
        if (progress) progress.forEach(p => progressMap.set(p.topic_id, p));

        // 3. Format for D3
        // Nodes: { id, group, radius, ...stats }
        // D3 Format
        const nodes = [];
        // const links = []; // Replaced by edge logic below

        topics.forEach(t => {
            const userP = progressMap.get(t.id);
            const depth = userP?.current_depth || 1;

            // Normalize existing bad data (e.g. POLITICS -> Politics)
            const rawName = t.title || t.name || '';
            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

            nodes.push({
                id: t.id,
                name: displayName,
                depth: depth,
                status: userP ? 'active' : 'locked',
                category: t.category || 'general'
            });
        });

        // 4. Fetch Real Edges from AI Table
        const { data: realEdges } = await supabaseAdmin
            .from('topic_edges')
            .select('*');

        // Create Map for fast lookup
        const edgeMap = new Map();
        if (realEdges) {
            realEdges.forEach(e => {
                // Bi-directional lookup keys
                edgeMap.set(`${e.source_topic_id}:${e.target_topic_id}`, e.label);
                edgeMap.set(`${e.target_topic_id}:${e.source_topic_id}`, e.label);
            });
        }

        const links = [];
        const relationshipWords = [
            'Influences', 'Evolves', 'Context', 'Basis', 'Contrast',
            'Harmony', 'Tension', 'Echo', 'Root', 'Spark',
            'Flow', 'Nexus', 'Bridge', 'Frame', 'Weave',
            'Anchors', 'Mirrors', 'Refines', 'Questions', 'Polarity'
        ];

        // Generate Full Mesh + Overlay AI Edges
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const id1 = nodes[i].id;
                const id2 = nodes[j].id;

                // Check if AI Edge exists
                let label = edgeMap.get(`${id1}:${id2}`);

                if (!label) {
                    // Fallback to Deterministic
                    const comboId = id1 + id2;
                    let hash = 0;
                    for (let k = 0; k < comboId.length; k++) {
                        hash = ((hash << 5) - hash) + comboId.charCodeAt(k);
                        hash |= 0;
                    }
                    const wordIndex = Math.abs(hash) % relationshipWords.length;
                    label = relationshipWords[wordIndex];
                }

                links.push({
                    source: id1,
                    target: id2,
                    value: 1,
                    label: label
                });
            }
        }

        res.json({ nodes, links });

    } catch (err) {
        console.error('[Topics] Graph Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/topics/:topicId/conversation
 * Start a conversation about this topic (User-Driven Context)
 */
router.post('/:topicId/conversation', requireAuth, async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id; // Corrected from req.user (middleware attaches user object)

    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID' });
    }

    try {
        // 1. Check for existing conversation for this topic/user DO NOT REUSE for now per plan (keep simple 1:1 map check if exists, else create)
        // Actually, plan said "Analogy: Projects map 1:1. Let's do 1:1 for now".
        // So if one exists, return it.
        const { data: existingConv } = await req.userClient
            .from('conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('topic_id', topicId)
            .maybeSingle();

        if (existingConv) {
            console.log(`[Topics] Returning existing conversation ${existingConv.id}`);
            return res.json({ conversationId: existingConv.id, isNew: false });
        }

        // 2. Fetch Topic Details for Context
        const { data: topic } = await supabaseAdmin
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();

        if (!topic) return res.status(404).json({ error: 'Topic not found' });

        // 3. Prepare Context & Brief
        const cleanTitle = toSentenceCase(topic.title || topic.name);
        const conversationTitle = `Topic: ${cleanTitle}`;

        const userBriefing = `I'm interested in exploring the topic '${cleanTitle}'.
        
Can you help me understand it better? How might it relate to my other interests?`;

        const kickstartPrompt = `The user wants to explore the topic "${cleanTitle}".
        
        Act as a knowledgeable guide.
        1. Acknowledge their interest warmly.
        2. Give a 1-sentence "hook" or definition of the topic.
        3. Ask an open-ended question to gauge their current understanding or specific angle of interest.
        Keep it concise and conversational.`;

        // 4. Delegate to ConversationService
        const result = await ConversationService.startGuidedConversation({
            userId,
            title: conversationTitle,
            topicId: topicId,
            brief: userBriefing,
            initialContext: kickstartPrompt,
            initialXp: 5 // Smaller XP for just topic exploration?
        });

        // 5. Update topic engagement to match XP award
        const { error: engagementError } = await supabaseAdmin
            .from('topics')
            .update({ 
                engagement: (topic.engagement || 0) + 5,
                updated_at: new Date().toISOString()
            })
            .eq('id', topicId);

        if (engagementError) {
            console.error('[Topics] Failed to update engagement:', engagementError);
        } else {
            console.log(`[Topics] Updated topic ${topicId} engagement: ${(topic.engagement || 0)} → ${(topic.engagement || 0) + 5}`);
        }

        res.json(result);

    } catch (err) {
        console.error('[Topics] Conversation Start Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Helper for Sentence Case
const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
router.post('/remap', requireAuth, async (req, res) => {
    // ... existing ...
});

/**
 * POST /api/topics/:topicId/enrich
 * Manually trigger content enrichment
 */
router.post('/:topicId/enrich', requireAuth, async (req, res) => {
    const { topicId } = req.params;
    try {
        console.log(`[Topics] Manual Enrich triggered for ${topicId}`);
        // User wants immediate feedback, so we await it.
        await LibrarianAgent.enrichTopic(topicId, true);
        res.json({ success: true });
    } catch (err) {
        console.error('[Topics] Enrich Error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/topics
 * Create a new topic
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        const cleanTitle = toSentenceCase(title);

        // Using TopicService + Cartographer Analysis (Hypothesis)
        let domain = 'General';

        // 1. Get Agent Hypothesis (Read Only)
        try {
            const analysis = await CartographerAgent.proposeTopicDomain(cleanTitle, 'New topic');
            domain = analysis.domain;
        } catch (e) {
            console.warn('[Topics] Agent analysis failed, falling back to General:', e);
        }

        // 2. Execute Write (Service)
        // Note: TopicService handles existence check internally too, but route did it above. 
        // We can rely on service.
        const TopicService = (await import('../services/TopicService.js')).default;

        const data = await TopicService.createTopic({
            title: cleanTitle,
            description: 'New topic',
            category: domain,
            userId: req.user.id
        });

        console.log(`[Topics] Created topic: ${cleanTitle}`);

        // Trigger Agent (Fire & Forget via Event Listeners ideally, but for now manual trigger to ensure graph update)
        // ideally we move "analyzeTopicRelationships" to a listener too.
        // For Phase 4 compliance: We will leave relationship analysis here for a moment OR move it to listener.
        // The plan said "Create TopicListener". Let's rely on Event TOPIC_CREATED handled by listener (Next step).

        res.json(data);
    } catch (err) {
        console.error('[Topics] Create Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/topics
 * GET /api/topics
 * List all topics (Public/Shared)
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { userId } = req.query;
        let targetUserId = req.user.id; // Default to self

        // If specific user requested
        if (userId && userId !== req.user.id) {
            // Check Parent permission
            const { data: isParent, error: checkErr } = await req.userClient.rpc('is_parent_of_user', {
                target_user_id: userId
            });

            if (checkErr || !isParent) {
                return res.status(403).json({ error: 'Permission denied' });
            }
            targetUserId = userId;
        }

        // 1. Fetch Topics (User-scoped)
        const { data: topics, error: topicsErr } = await supabaseAdmin
            .from('topics')
            .select('*')
            .eq('user_id', targetUserId);
        if (topicsErr) throw topicsErr;

        // 2. Fetch Progress for Target User
        const { data: progress, error: progressErr } = await req.userClient
            .from('user_topic_progress')
            .select('*')
            .eq('user_id', targetUserId);

        // Note: It's okay if progress is empty/null, just means user hasn't started anything.
        if (progressErr && progressErr.code !== 'PGRST116') {
            console.warn("[Topics] Progress fetch warning:", progressErr.message);
        }

        // 3. Fetch Message Counts (Steps) for these topics
        // We join conversations with messages to count steps per topic
        const { data: messageCounts, error: countErr } = await supabaseAdmin
            .from('conversations')
            .select('topic_id, messages!inner(count)')
            .eq('user_id', targetUserId)
            .not('topic_id', 'is', null);

        // Wait, supabase join count might be tricky. Let's do a simpler approach or a raw RPC if needed.
        // Actually, we can just fetch all messages for conversations linked to topics for this user.
        const { data: msgData, error: msgDataErr } = await supabaseAdmin
            .from('messages')
            .select('id, conversation_id, conversations!inner(topic_id)')
            .eq('conversations.user_id', targetUserId)
            .not('conversations.topic_id', 'is', null);

        const stepMap = new Map();
        if (msgData) {
            msgData.forEach(m => {
                const tId = m.conversations.topic_id;
                stepMap.set(tId, (stepMap.get(tId) || 0) + 1);
            });
        }

        // 4. Merge Progress into Topics
        const progressMap = new Map();
        if (progress) {
            progress.forEach(p => progressMap.set(p.topic_id, p));
        }

        const mergedTopics = topics.map(topic => {
            const userP = progressMap.get(topic.id);
            const engagement = userP?.engagement_score || 0;
            const level = Math.floor(engagement / 100) + 1;
            const steps = stepMap.get(topic.id) || 0;

            return {
                ...topic,
                depth: userP?.current_depth || 1,
                engagement: engagement,
                level: level,
                steps: steps,
                xpToNext: 100 - (engagement % 100)
            };
        });

        res.json(mergedTopics || []);
    } catch (err) {
        console.error('[Topics] List Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/topics/:topicId
 * Get detailed topic info
 */
router.get('/:topicId', requireAuth, async (req, res) => {
    const { topicId } = req.params;

    // Validate UUID
    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID' });
    }

    try {
        const { data, error } = await req.userClient
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Topics] Get Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/topics/:topicId/progress
 * Get user's progress for a specific topic
 */
router.get('/:topicId/progress', requireAuth, async (req, res) => {
    const { topicId } = req.params;
    const { userId } = req.query;

    let targetUserId = req.user.id;
    if (userId && userId !== req.user.id) {
        const { data: isParent, error: checkErr } = await req.userClient.rpc('is_parent_of_user', { target_user_id: userId });
        if (checkErr || !isParent) return res.status(403).json({ error: 'Permission denied' });
        targetUserId = userId;
    }

    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID' });
    }

    try {
        const { data, error } = await req.userClient
            .from('user_topic_progress')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('topic_id', topicId)
            .single();

        // If no progress found, return null or a default object.
        // Returning null allows the frontend to know it's "fresh".
        // But for ease of use, let's return a default object if 406/NotFound?
        // Actually, Supabase .single() returns error if no rows.

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            throw error;
        }

        if (!data) {
            return res.json({
                current_depth: 0,
                engagement_score: 0,
                isNew: true
            });
        }

        res.json(data);
    } catch (err) {
        console.error('[Topics] Get Progress Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/topics/:topicId/progress
 * Update or Upsert user's progress
 */
router.post('/:topicId/progress', requireAuth, async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id;

    // Validate Body
    const validation = progressSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
    }
    const { depth, engagement } = validation.data;

    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID' });
    }

    try {
        // Upsert logic
        // We need to check if exists, or just use upsert if we have PK.
        // PK is (user_id, topic_id).

        const updates = {
            user_id: userId,
            topic_id: topicId,
            last_active: new Date()
        };
        if (depth !== undefined) updates.current_depth = depth;
        if (engagement !== undefined) updates.engagement_score = engagement;

        const { data, error } = await req.userClient
            .from('user_topic_progress')
            .upsert(updates, { onConflict: 'user_id, topic_id' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Topics] Update Progress Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/topics/:topicId
 * Delete a topic (and its progress)
 */
router.delete('/:topicId', requireAuth, async (req, res) => {
    const { topicId } = req.params;

    if (!z.string().uuid().safeParse(topicId).success) {
        return res.status(400).json({ error: 'Invalid topic ID' });
    }

    try {
        console.log(`[Topics] Deleting topic ${topicId} for user ${req.user.id}`);

        // 1. Cleanup related records to prevent FK constraint failures
        // a. Delete Progress Rows
        const { error: progressError } = await supabaseAdmin
            .from('user_topic_progress')
            .delete()
            .eq('topic_id', topicId);

        if (progressError) console.warn('[Topics] Progress cleanup warning:', progressError.message);

        // b. Delete Topic Edges (These don't have FK ON DELETE CASCADE in the migration)
        const { error: edgeError } = await supabaseAdmin
            .from('topic_edges')
            .delete()
            .or(`source_topic_id.eq.${topicId},target_topic_id.eq.${topicId}`);

        if (edgeError) console.warn('[Topics] Edges cleanup warning:', edgeError.message);

        // c. Nullify Project associations (Projects shouldn't be deleted, just unlinked)
        const { error: projectError } = await supabaseAdmin
            .from('projects')
            .update({ origin_topic_id: null })
            .eq('origin_topic_id', topicId);

        if (projectError) console.warn('[Topics] Project unlinking warning:', projectError.message);

        // d. Nullify Conversation associations
        const { error: convError } = await supabaseAdmin
            .from('conversations')
            .update({ topic_id: null })
            .eq('topic_id', topicId);

        if (convError) console.warn('[Topics] Conversation unlinking warning:', convError.message);

        // 2. Delete the Topic
        // Using supabaseAdmin to BYPASS RLS
        const { error } = await supabaseAdmin
            .from('topics')
            .delete()
            .eq('id', topicId);

        if (error) {
            console.error('[Topics] DB Delete Error:', error);
            throw error;
        }

        console.log(`[Topics] Successfully deleted topic ${topicId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('[Topics] Delete Critical Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/topics/merge
 * Merge multiple topics into one
 */
router.post('/merge', requireAuth, async (req, res) => {
    const { topicIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(topicIds) || topicIds.length < 2) {
        return res.status(400).json({ error: 'At least two topic IDs are required.' });
    }

    try {
        const TopicService = (await import('../services/TopicService.js')).default;
        const result = await TopicService.mergeTopics(userId, topicIds);
        res.json(result);
    } catch (err) {
        console.error('[Topics] Merge Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
