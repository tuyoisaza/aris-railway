
import { EventEmitter } from 'events';

class EventManager extends EventEmitter {
    constructor() {
        super();
        this.EVENTS = {
            CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
            AI_RESPONSE_COMPLETED: 'AI_RESPONSE_COMPLETED',
            CONVERSATION_STARTED: 'CONVERSATION_STARTED',
            TOPIC_CREATED: 'TOPIC_CREATED',
            TOPIC_REVISITED: 'TOPIC_REVISITED',
            XP_AWARDED: 'XP_AWARDED',
            GUIDED_ACTION_SUGGESTED: 'GUIDED_ACTION_SUGGESTED'
        };
    }

    emitEvent(event, payload) {
        console.log(`[EventManager] 📡 Emitting: ${event}`, payload?.conversationId ? `(Conv: ${payload.conversationId})` : '');
        this.emit(event, payload);
    }
}

export default new EventManager();
