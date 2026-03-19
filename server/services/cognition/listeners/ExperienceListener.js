import EventManager from '../EventManager.js';
import SkillService from '../../SkillService.js';
import { socketServer } from '../../websocket/socketServer.js';

class ExperienceListener {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.CONVERSATION_STARTED, this.onConversationStarted.bind(this));
    }

    async onConversationStarted({ userId, conversationId, isNew, skillId, level, initialXp, topicId }) {
        // Award XP for any conversation with biology in title
        if (initialXp || this.isBiologyConversation(skillId, topicId)) {
            let xpAmount = initialXp || 5; // Default 5 XP for biology conversations
            let targetSkillId = skillId;
            let targetLevel = level || 1;

            // If no explicit skillId, find biology skill
            if (!targetSkillId) {
                targetSkillId = await this.findBiologySkill();
                if (!targetSkillId) {
                    console.log('[ExperienceListener] ❌ No biology skill found to award XP');
                    return;
                }
            }

            console.log(`[ExperienceListener] 🌟 Awarding ${xpAmount} XP for Skill ${targetSkillId} (Level ${targetLevel})`);
            try {
                await SkillService.awardPracticeXP(userId, targetSkillId, targetLevel, xpAmount);
                
                // Broadcast XP notification via WebSocket
                socketServer.broadcastXPGain(userId, {
                    xpAmount,
                    skillId: targetSkillId,
                    level: targetLevel,
                    source: topicId ? 'topic' : 'conversation',
                    topicId
                });
                
                // Store XP notification for frontend to retrieve
                try {
                    const { createClient } = require('@supabase/supabase-js');
                    const supabase = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL,
                        process.env.SUPABASE_SERVICE_KEY
                    );
                    
                    await supabase.from('xp_notifications').insert([{
                        user_id: userId,
                        xp_amount: xpAmount,
                        source: topicId ? 'topic' : 'conversation',
                        skill_id: targetSkillId,
                        level: targetLevel,
                        topic_id: topicId,
                        created_at: new Date().toISOString(),
                        read: false
                    }]);
                    
                    console.log(`[ExperienceListener] 📢 XP notification stored and broadcast: +${xpAmount} XP`);
                } catch (notifError) {
                    console.error('[ExperienceListener] Failed to store XP notification:', notifError);
                }
                
            } catch (err) {
                console.error('[ExperienceListener] Failed to award XP:', err);
            }
        }
    }

    isBiologyConversation(skillId, topicId) {
        // For now, award XP for all conversations to test the system
        // TODO: Add conversation title checking logic here
        return true;
    }

    async findBiologySkill() {
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY
            );
            
            const { data: skill } = await supabase
                .from('skills')
                .select('*')
                .ilike('name', '%biology%')
                .single();
            
            return skill?.id;
        } catch (error) {
            console.error('[ExperienceListener] Failed to find biology skill:', error);
            return null;
        }
    }
}

export default new ExperienceListener();
