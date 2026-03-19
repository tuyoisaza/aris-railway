import EventManager from '../EventManager.js';
import BadgeService from '../../BadgeService.js';
import { supabaseAdmin } from '../../../db.js';

class GamificationListener {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.AI_RESPONSE_COMPLETED, this.onAiResponse.bind(this));
    }

    async onAiResponse({ userId, conversationId, userContent }) {
        // Run badge evaluation decoupled from the main response loop
        try {
            console.log(`[GamificationListener] 🏅 Evaluating badges for user ${userId}...`);
            const encodedAlerts = await BadgeService.evaluate(userId, conversationId, userContent);

            if (encodedAlerts && encodedAlerts.length > 0) {
                console.log(`[GamificationListener] 🚨 Triggered ${encodedAlerts.length} badge alerts.`);
                for (const alertText of encodedAlerts) {
                    await this.processBadgeAlert(conversationId, alertText);
                }
            }
        } catch (err) {
            console.error('[GamificationListener] Error processing badges:', err);
        }
    }

    async processBadgeAlert(conversationId, alertText) {
        let badgeData = null;
        try {
            badgeData = JSON.parse(alertText);
        } catch (e) {
            badgeData = null;
        }

        if (badgeData && badgeData.type === 'BADGE') {
            // 1. System Message (Artifact Trigger)
            await supabaseAdmin.from('messages').insert([{
                conversation_id: conversationId,
                role: 'system',
                text: JSON.stringify(badgeData.action)
            }]);

            // 2. AI Chat Message (Notification)
            await supabaseAdmin.from('messages').insert([{
                conversation_id: conversationId,
                role: 'ai',
                text: badgeData.message || "You've unlocked a new badge!"
            }]);
        } else {
            // Fallback for generic alerts
            await supabaseAdmin.from('messages').insert([{
                conversation_id: conversationId,
                role: 'system',
                text: alertText
            }]);
        }
    }
}

export default new GamificationListener();
