import EventManager from '../EventManager.js';
import SkillService from '../../SkillService.js';
import { socketServer } from '../../../websocket/socketServer.js';
import { prisma } from '../../../db.js';

class ExperienceListener {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.CONVERSATION_STARTED, this.onConversationStarted.bind(this));
    }

    async onConversationStarted({ userId, conversationId, isNew, skillId, level, initialXp, topicId }) {
        if (initialXp || this.isBiologyConversation(skillId, topicId)) {
            let xpAmount = initialXp || 5;
            let targetSkillId = skillId;
            let targetLevel = level || 1;

            if (!targetSkillId) {
                targetSkillId = await this.findBiologySkill();
                if (!targetSkillId) {
                    console.log('[ExperienceListener] No biology skill found to award XP');
                    return;
                }
            }

            console.log(`[ExperienceListener] Awarding ${xpAmount} XP for Skill ${targetSkillId} (Level ${targetLevel})`);
            try {
                await SkillService.awardPracticeXP(userId, targetSkillId, targetLevel, xpAmount);
                
                socketServer.broadcastXPGain(userId, {
                    xpAmount,
                    skillId: targetSkillId,
                    level: targetLevel,
                    source: topicId ? 'topic' : 'conversation',
                    topicId
                });
                
                await prisma.xpNotification.create({
                    data: {
                        userId,
                        xpAmount,
                        source: topicId ? 'topic' : 'conversation',
                        skillId: targetSkillId,
                        level: targetLevel,
                        topicId,
                        read: false
                    }
                });
                
                console.log(`[ExperienceListener] XP notification stored and broadcast: +${xpAmount} XP`);
            } catch (err) {
                console.error('[ExperienceListener] Failed to award XP:', err);
            }
        }
    }

    isBiologyConversation(skillId, topicId) {
        return true;
    }

    async findBiologySkill() {
        try {
            const skill = await prisma.skill.findFirst({
                where: {
                    title: { mode: 'insensitive', contains: 'biology' }
                }
            });
            return skill?.id;
        } catch (error) {
            console.error('[ExperienceListener] Failed to find biology skill:', error);
            return null;
        }
    }
}

export default new ExperienceListener();
