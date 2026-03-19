import BaseAction from './BaseAction.js';
import ConversationService from '../services/ConversationService.js';

class ConversationAction extends BaseAction {

    async execute(userId, payload, intent) {
        // Conversation Action Logic
        // Intent = First message / brief
        // Payload = Hidden context

        if (!intent) {
            console.warn('[ConversationAction] Intent (brief) is empty.');
        }

        const context = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const title = `Guided: ${intent?.substring(0, 30) || 'Conversation'}`;

        // Delegate to ConversationService
        const result = await ConversationService.startGuidedConversation({
            userId,
            title,
            topicId: null,
            brief: intent,
            initialContext: context,
            initialXp: 5
        });

        return {
            url: `/conversation/${result.conversationId}`,
            message: 'Conversation started.'
        };
    }
}

export default new ConversationAction();
