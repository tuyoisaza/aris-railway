import EventManager from '../EventManager.js';
import BadgeService from '../../BadgeService.js';
import { prisma } from '../../../db.js';

class GamificationListener {
    constructor() {
        console.log('[GamificationListener] Initializing...');
        this.setupListeners();
        console.log('[GamificationListener] Listeners ready');
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.AI_RESPONSE_COMPLETED, this.onAiResponse.bind(this));
    }

    async onAiResponse({ userId, conversationId, userContent }) {
        try {
            console.log(`[GamificationListener] Evaluating badges for user ${userId}...`);
            const encodedAlerts = await BadgeService.evaluate(userId, conversationId, userContent);

            if (encodedAlerts && encodedAlerts.length > 0) {
                console.log(`[GamificationListener] Triggered ${encodedAlerts.length} badge alerts.`);
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
            await prisma.message.create({
                data: {
                    conversationId,
                    role: 'system',
                    content: JSON.stringify(badgeData.action)
                }
            });

            await prisma.message.create({
                data: {
                    conversationId,
                    role: 'ai',
                    content: badgeData.message || "You've unlocked a new badge!"
                }
            });
        } else {
            await prisma.message.create({
                data: {
                    conversationId,
                    role: 'system',
                    content: alertText
                }
            });
        }
    }
}

export default new GamificationListener();
