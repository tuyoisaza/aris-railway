import BaseAction from './BaseAction.js';
import CartographerAgent from '../services/ai/agents/CartographerAgent.js';

class TopicAction extends BaseAction {

    async execute(userId, payload, intent) {
        // Topic Action Logic
        // Title = Intent
        // Context = Payload

        const title = intent;
        if (!title) throw new Error('Topic action requires an intent (Topic Name).');

        // Prefer explicit intent, then payload description, then full payload if string, then default
        const context = intent || payload.description || (typeof payload === 'string' ? payload : 'Guided Action Creation');

        // Use Cartographer to create topic (handles domains etc)
        // Ensure userId is not needed for global topic creation, or handled by Cartographer?
        // Cartographer creates global topic.

        const topic = await CartographerAgent.createTopicWithDomain(userId, title, context);

        // Trigger Analysis (Async)
        CartographerAgent.analyzeTopicRelationships(topic.id)
            .catch(err => console.error("[TopicAction] Analysis Error:", err));

        return {
            url: `/topic/${topic.id}`, // Note: singular 'topic' to match frontend route
            message: 'Topic created and mapped.'
        };
    }
}

export default new TopicAction();
