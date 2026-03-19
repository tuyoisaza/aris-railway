import EventManager from '../EventManager.js';
import CartographerAgent from '../../ai/agents/CartographerAgent.js';
import TopicService from '../../TopicService.js';
import jobQueue from '../../jobQueue.js';

class TopicListener {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.TOPIC_CREATED, this.onTopicCreated.bind(this));
        EventManager.on(EventManager.EVENTS.TOPIC_REVISITED, this.onTopicRevisited.bind(this));
    }

    async onTopicCreated({ topicId, userId, title }) {
        console.log(`[TopicListener] 🆕 Topic Created: "${title}" (ID: ${topicId}). Scheduling analysis...`);

        // 1. Schedule Background Jobs
        jobQueue.addJob('topic_created', { topicId, userId });

        // 2. Trigger Relationship Analysis (Async)
        this.runRelationshipAnalysis(topicId).catch(err =>
            console.error('[TopicListener] Analysis Error:', err)
        );
    }

    async onTopicRevisited({ topicId, userId, originalIntent }) {
        console.log(`[TopicListener] 🧠 Topic Revisited: "${originalIntent}" (ID: ${topicId}). Awarding Engagement...`);
        try {
            await TopicService.incrementEngagement(topicId, userId, 10);
        } catch (err) {
            console.error('[TopicListener] Reward Error:', err);
        }
    }

    async runRelationshipAnalysis(topicId) {
        // This logic was previously inside CartographerAgent.analyzeTopicRelationships (Side Effect Version)
        // We need to refactor CartographerAgent.analyzeTopicRelationships to be PURE first?
        // OR we just use the agent here if we haven't refactored that method yet.
        // Wait, the plan said "Decouple Cartographer PERSISTENCE".
        // Let's modify CartographerAgent.analyzeTopicRelationships to RETURN edges, not save them.

        // REFACTOR ON THE FLY: We need to modify CartographerAgent to return edges.
        // But for now, let's assume CartographerAgent.analyzeTopicRelationships is still dirty.
        // Actually, looking at previous steps... I only refactored createTopic and analyzeAndMap.
        // I did NOT refactor analyzeTopicRelationships yet.

        const edges = await CartographerAgent.analyzeTopicRelationships(topicId);

        if (edges && Array.isArray(edges)) {
            await TopicService.saveEdges(edges);
        }
    }
}

export default new TopicListener();
