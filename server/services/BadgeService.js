import { supabaseAdmin } from '../db.js';

class BadgeService {
    /**
     * Evaluate if any badges should be awarded based on context.
     * @param {string} userId
     * @param {string} conversationId
     * @param {string} currentMessageText
     * @returns {Promise<Array<string>>} - List of alert messages
     */
    async evaluate(userId, conversationId, currentMessageText = '') {
        console.log(`[BadgeService] 🕵️ Evaluating badges for User: ${userId}`);
        try {
            // 1. Fetch all badges (we'll handle active check in code)
            const { data: badges, error } = await supabaseAdmin
                .from('badges')
                .select('*');

            if (error) console.error('[BadgeService] DB Error:', error);
            console.log(`[BadgeService] Found ${badges?.length || 0} badges.`);

            if (!badges || badges.length === 0) return [];

            // 2. Count user's total conversations and messages
            const { data: userConversations } = await supabaseAdmin
                .from('conversations')
                .select('id')
                .eq('user_id', userId);

            const convCount = userConversations?.length || 0;

            const { data: userMessages } = await supabaseAdmin
                .from('messages')
                .select('id')
                .eq('author_id', userId);

            const msgCount = userMessages?.length || 0;

            // 3. Get existing user badges
            const { data: userBadges } = await supabaseAdmin
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', userId);

            const earnedBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id));

            // 4. Evaluate each badge
            const alerts = [];

            for (const badge of badges) {
                // Skip already earned badges
                if (earnedBadgeIds.has(badge.id)) continue;

                // Parse criteria (default to empty object)
                let criteria = {};
                try {
                    if (badge.criteria && typeof badge.criteria === 'string') {
                        criteria = JSON.parse(badge.criteria);
                    } else if (badge.criteria && typeof badge.criteria === 'object') {
                        criteria = badge.criteria;
                    }
                } catch (e) {
                    criteria = {};
                }

                let triggered = false;
                const badgeType = criteria.type || badge.category || 'milestone';

                // Check trigger conditions
                switch (badgeType) {
                    case 'first_conversation':
                        // Trigger when user has their first conversation
                        if (convCount === 1) {
                            triggered = true;
                        }
                        break;

                    case 'conversation_count':
                        // Trigger when reaching conversation count threshold
                        const convThreshold = criteria.count || 5;
                        if (convCount >= convThreshold) {
                            triggered = true;
                        }
                        break;

                    case 'message_count':
                        // Trigger when reaching message count threshold
                        const msgThreshold = criteria.count || 10;
                        if (msgCount >= msgThreshold) {
                            triggered = true;
                        }
                        break;

                    case 'topic_learned':
                        // Check if user learned a specific topic
                        if (criteria.topicName && currentMessageText?.toLowerCase().includes(criteria.topicName.toLowerCase())) {
                            triggered = true;
                        }
                        break;

                    case 'keyword':
                        // Trigger on keyword in message
                        const keyword = criteria.keyword?.toLowerCase();
                        if (keyword && currentMessageText?.toLowerCase().includes(keyword)) {
                            triggered = true;
                        }
                        break;

                    case 'milestone':
                    default:
                        // Default: check conversation count for milestone badges
                        const threshold = criteria.count || 5;
                        if (convCount >= threshold) {
                            triggered = true;
                        }
                        break;
                }

                if (triggered) {
                    console.log(`[BadgeService] 🎉 Awarding badge: ${badge.name}`);

                    // Award the badge
                    await supabaseAdmin
                        .from('user_badges')
                        .insert({
                            user_id: userId,
                            badge_id: badge.id,
                            metadata: JSON.stringify({ awardedAt: new Date().toISOString() })
                        });

                    // Return alert
                    alerts.push(JSON.stringify({
                        type: 'BADGE',
                        action: { type: 'show_badge', payload: badge },
                        message: badge.description || `You earned the ${badge.name} badge!`
                    }));
                }
            }

            return alerts;

        } catch (err) {
            console.error('[BadgeService] Evaluation Error:', err);
            return [];
        }
    }

    /**
     * Award a badge to a user directly
     * @param {string} userId
     * @param {string} badgeId
     */
    async awardBadge(userId, badgeId) {
        try {
            await supabaseAdmin
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badgeId,
                    metadata: JSON.stringify({ awardedAt: new Date().toISOString() })
                });
            return true;
        } catch (err) {
            console.error('[BadgeService] Award Error:', err);
            return false;
        }
    }

    /**
     * Get all badges for a user
     * @param {string} userId
     */
    async getUserBadges(userId) {
        try {
            const { data: userBadges, error } = await supabaseAdmin
                .from('user_badges')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const badgeIds = (userBadges || []).map(ub => ub.badge_id);

            if (badgeIds.length === 0) return [];

            const { data: badges, error: badgeError } = await supabaseAdmin
                .from('badges')
                .select('*')
                .in('id', badgeIds);

            if (badgeError) throw badgeError;

            return (userBadges || []).map(ub => {
                const badge = badges?.find(b => b.id === ub.badge_id);
                return {
                    ...badge,
                    earnedAt: ub.earnedAt,
                    metadata: ub.metadata
                };
            });
        } catch (err) {
            console.error('[BadgeService] Get User Badges Error:', err);
            return [];
        }
    }

    /**
     * Get available badges (not yet earned by user)
     * @param {string} userId
     */
    async getAvailableBadges(userId) {
        try {
            const { data: userBadges } = await supabaseAdmin
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', userId);

            const earnedBadgeIds = (userBadges || []).map(ub => ub.badge_id);

            const { data: allBadges, error } = await supabaseAdmin
                .from('badges')
                .select('*');

            if (error) throw error;

            return (allBadges || []).filter(badge => !earnedBadgeIds.includes(badge.id));
        } catch (err) {
            console.error('[BadgeService] Get Available Badges Error:', err);
            return [];
        }
    }
}

export default new BadgeService();
