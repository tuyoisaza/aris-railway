import { EventEmitter } from 'events';
import { supabaseAdmin } from '../db.js';
import CartographerAgent from './ai/agents/CartographerAgent.js';
import LibrarianAgent from './ai/agents/LibrarianAgent.js';
import ScoutAgent from './ai/agents/ScoutAgent.js';
import OgmaAgent from './ai/agents/OgmaAgent.js';

class JobQueue extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Allow multiple agents to listen

        // --- Event Listeners ---
        this.on('conversation_updated', this.handleConversationUpdate.bind(this));
        this.on('topic_created', this.handleTopicCreated.bind(this));
        this.on('content_enriched', this.handleContentEnriched.bind(this));
        this.on('milestone_triggered', this.handleMilestoneTriggered.bind(this));
        this.on('ogma_checkpoint', this.handleOgmaCheckpoint.bind(this));
        this.on('research_triggered', this.handleResearchTriggered.bind(this));
    }

    /**
     * Emit a job event safely
     */
    addJob(eventName, payload) {
        console.log(`[JobQueue] Queuing job: ${eventName}`, payload?.conversationId || '');

        // Execute on next tick to ensure current stack finishes
        setImmediate(() => {
            try {
                this.emit(eventName, payload);
            } catch (err) {
                console.error(`[JobQueue] Error emitting ${eventName}:`, err);
            }
        });
    }

    // =========================================================================
    // HANDLERS
    // =========================================================================

    /**
     * 1. CARTOGRAPHER: Checks if map needs updating
     */
    async handleConversationUpdate({ conversationId, userId }) {
        try {
            // Count messages to see if we hit threshold (e.g. every 5 user messages)
            // But for MVP, maybe we just do it? No, that's expensive.
            // Let's count total messages.
            const { count, error } = await supabaseAdmin
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId);

            if (error) throw error;

            console.log(`[JobQueue] Conversation ${conversationId} has ${count} messages.`);

// Trigger every 4 messages (2 turns) to ensure it hits on even counts
            // But only if no recent BRANCH milestones to prevent duplicate topics
            const recentMessages = await supabaseAdmin
                .from('messages')
                .select('text, created_at')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(10);

            const hasRecentBranchMilestone = recentMessages?.some(msg => 
                msg.text && msg.text.includes('milestoneType') && msg.text.includes('BRANCH')
            );

            if (count > 0 && count % 4 === 0 && !hasRecentBranchMilestone) {
                console.log(`[JobQueue] Triggering Cartographer for ${conversationId}`);
                await CartographerAgent.analyzeAndMap(conversationId, userId);
            } else if (hasRecentBranchMilestone) {
                console.log(`[JobQueue] Skipping Cartographer due to recent BRANCH milestone in ${conversationId}`);
            }

        } catch (err) {
            console.error(`[JobQueue] Cartographer Handler Error:`, err);
        }
    }

    /**
     * 2. CARTOGRAPHER: Analyze relationships when a new topic is created
     */
    async handleTopicCreated({ topicId, userId }) {
        console.log(`[JobQueue] Triggering Cartographer for Topic Relationships: ${topicId}`);

        // Analyze relationships between this new topic and existing ones
        await CartographerAgent.analyzeTopicRelationships(topicId);

        // Dispatch next step for content enrichment (Librarian)
        try {
            const TopicService = (await import('./TopicService.js')).default;

            // 1. Get Content (Pure)
            const content = await LibrarianAgent.enrichTopic(topicId);

            // 2. Save (Service)
            if (content) {
                await TopicService.enrichTopic(topicId, content);
            }
        } catch (err) {
            console.error('[JobQueue] Librarian Orchestration Error:', err);
        }
    }

    /**
    * 3. SCOUT: Checks if topic needs external resources
    */
    async handleContentEnriched({ topicId, userId }) {
        console.log(`[JobQueue] Triggering Scout for Topic ${topicId}`);
        // await ScoutAgent.findResources(topicId);
    }

/**
     * 4. MILESTONE TRIGGER: Immediate Cartographer Run
     */
    async handleMilestoneTriggered({ conversationId, userId, milestoneType, topic }) {
        console.log(`[JobQueue] 🏆 Milestone (${milestoneType}) for ${topic}. Triggering Immediate Cartographer.`);

        // For BRANCH milestones, skip automatic Cartographer analysis since TeacherAgent already creates the topic
        // This prevents duplicate topic creation via multiple paths
        if (milestoneType === 'BRANCH') {
            console.log(`[JobQueue] 🚫 Skipping Cartographer for BRANCH milestone to prevent duplicate topic creation`);
            
            // Still trigger Ogma to process any pending signals after milestone
            this.addJob('ogma_checkpoint', { userId });
            return;
        }

        // For other milestone types (DEPTH, etc.), run Cartographer to ensure the map reflects this new milestone
        await CartographerAgent.analyzeAndMap(conversationId, userId);

        // Trigger Ogma to process any pending signals after milestone
        this.addJob('ogma_checkpoint', { userId });
    }

    /**
     * 5. OGMA CHECKPOINT: Process pending memory signals
     * Triggered after milestones or periodically
     */
    async handleOgmaCheckpoint({ userId }) {
        try {
            console.log(`[JobQueue] 🧠 Ogma checkpoint for user: ${userId || 'ALL'}`);

            if (userId) {
                await OgmaAgent.processBuffer(userId);
            } else {
                await OgmaAgent.processAllUsers();
            }
        } catch (err) {
            console.error(`[JobQueue] Ogma Handler Error:`, err);
        }
    }

    /**
     * 6. RESEARCH: Trigger web research on a topic
     */
    async handleResearchTriggered({ conversationId, userId, query }) {
        try {
            console.log(`[JobQueue] 🔍 Web research triggered for user ${userId}: "${query}"`);
            await ScoutAgent.webResearch(query, userId);
        } catch (err) {
            console.error(`[JobQueue] Research Handler Error:`, err);
        }
    }
}

// Singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
