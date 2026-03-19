import { supabaseAdmin } from '../db.js';

class BadgeService {
    /**
     * Evaluate if any badges should be awarded based on context.
     * @param {string} userId
     * @param {string} conversationId
     * @returns {Promise<Array<string>>} - List of alert messages triggers
     */
    async evaluate(userId, conversationId, currentMessageText = '') {
        console.log(`[BadgeService] 🕵️ Evaluating badges for User: ${userId}, Msg: "${currentMessageText}"`);
        try {
            // 1. Fetch active badges
            const { data: badges, error } = await supabaseAdmin
                .from('badges')
                .select('*')
                .eq('is_active', true);

            if (error) console.error('[BadgeService] DB Error:', error);
            console.log(`[BadgeService] Found ${badges?.length || 0} active badges.`);

            if (!badges || badges.length === 0) return [];

            // 2. Fetch context (Count) if needed
            let messageCount = 0;
            const countBadges = badges.filter(b => b.trigger_type === 'interaction_count');

            if (countBadges.length > 0) {
                // Count user messages only (Interactions)
                const { count, error } = await supabaseAdmin
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conversationId)
                    .eq('role', 'user');

                if (!error) messageCount = count;
            }

            const alerts = [];

            for (const badge of badges) {
                let triggered = false;

                // CHECK: Interaction Count
                if (badge.trigger_type === 'interaction_count') {
                    const threshold = badge.trigger_condition.count;
                    // Trigger exactly on the threshold
                    if (messageCount === threshold) {
                        triggered = true;
                    }
                }

                // CHECK: Keyword Trigger
                if (badge.trigger_type === 'keyword' && currentMessageText) {
                    const keyword = badge.trigger_condition.keyword?.toLowerCase();
                    const hasMatch = keyword && currentMessageText.toLowerCase().includes(keyword);
                    console.log(`[BadgeService] Checking "${badge.name}" keyword: "${keyword}" vs "${currentMessageText}" -> Match: ${hasMatch}`);
                    if (hasMatch) {
                        triggered = true;
                    }
                }

                if (triggered) {
                    // Render Template
                    let msg = badge.message_template || `Badge: ${badge.name}`;
                    msg = msg.replace(/{{count}}/g, messageCount);

                    if (badge.category === 'badge') {
                        // For Badges: Check existence
                        const { data: existing } = await supabaseAdmin
                            .from('user_badges')
                            .select('id')
                            .match({ user_id: userId, badge_id: badge.id })
                            .maybeSingle(); // safely check existence

                        // Always trigger for keywords (testing), otherwise only if new
                        const shouldTrigger = !existing || badge.trigger_type === 'keyword';

                        if (shouldTrigger) {
                            if (!existing) {
                                // Award the badge (First time)
                                await supabaseAdmin
                                    .from('user_badges')
                                    .insert({ user_id: userId, badge_id: badge.id });
                            } else if (badge.trigger_type === 'keyword') {
                                // Just update last_active for repeat triggers
                                await supabaseAdmin
                                    .from('user_badges')
                                    .update({ last_active: new Date() })
                                    .eq('id', existing.id);
                            }

                            // Add structured alert (Action + Message)
                            // We return a JSON string so it can be parsed downstream or by frontend
                            alerts.push(JSON.stringify({
                                type: 'BADGE',
                                action: { type: 'show_badge', payload: badge },
                                message: msg
                            }));
                        }
                    } else {
                        // For Warnings: Always trigger (ephemeral)
                        alerts.push(JSON.stringify({
                            type: 'WARNING',
                            message: msg
                        }));
                    }
                }
            }

            return alerts;

        } catch (err) {
            console.error('[BadgeService] Evaluation Error:', err);
            return [];
        }
    }
    /**
     * Award XP to a Region Badge (creating it if needed).
     * @param {string} userId
     * @param {string} domain - e.g. "Cooking"
     * @param {string} region - e.g. "Baking"
     * @param {string} topicName - e.g. "Muffins"
     * @param {number} weight - Base weight (1-10)
     */
    async awardRegionXP(userId, domain, region, topicName, weight = 1) {
        try {
            console.log(`[BadgeService] 🎓 Awarding XP: ${domain} > ${region} (${topicName})`);

            // 1. Log the Topic Event (Idempotency check could go here based on topic interactions)
            // We use the weight as base XP
            const xpAmount = weight * 10; // Simplified scale: 1 -> 10xp

            await supabaseAdmin.from('topic_events').insert({
                user_id: userId,
                topic_name: topicName,
                domain: domain,
                region: region,
                weight: weight,
                xp_value: xpAmount
            });

            // 2. Find or Create the Badge
            // We need to find the badge definition for this Region.
            // If we are dynamically creating badges from Regions, we need to check if a badge exists with name=Region.
            let { data: badge } = await supabaseAdmin
                .from('badges')
                .select('*')
                .eq('name', region)
                .eq('domain', domain) // Ensure it matches domain if schema allows
                .maybeSingle();

            if (!badge) {
                // Auto-provision Mechanism: If no badge exists for this Region, create one?
                // Or maybe we map to a "General" badge?
                // For now, let's assume we create a hidden tracking badge.
                const { data: newBadge, error } = await supabaseAdmin
                    .from('badges')
                    .insert({
                        name: region,
                        description: `Mastery in ${region}`,
                        domain: domain,
                        region: region,
                        category: 'badge',
                        trigger_type: 'xp',
                        is_active: true,
                        icon: 'default_region.png'
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('[BadgeService] Failed to provision badge:', error);
                    return;
                }
                badge = newBadge;
            }

            // 3. Update User Badge Progress
            const { data: userBadge } = await supabaseAdmin
                .from('user_badges')
                .select('*')
                .match({ user_id: userId, badge_id: badge.id })
                .maybeSingle();

            if (userBadge) {
                // Update XP
                const newXP = (userBadge.xp || 0) + xpAmount;
                // Simple Level Curve: Level = sqrt(XP / 100) or just linear steps
                // Let's say 100 XP per level for simplicity
                const newLevel = Math.floor(newXP / 100) + 1;

                await supabaseAdmin
                    .from('user_badges')
                    .update({
                        xp: newXP,
                        level: newLevel,
                        last_active: new Date()
                    })
                    .eq('id', userBadge.id);

                if (newLevel > (userBadge.level || 1)) {
                    console.log(`[BadgeService] 🆙 Level Up: ${region} -> ${newLevel}`);
                }
            } else {
                // CHECK CONDITIONS BEFORE AWARDING
                let canAward = true;

                // 1. Check Interaction Count Condition
                if (badge.trigger_condition && badge.trigger_condition.min_interactions) {
                    const threshold = badge.trigger_condition.min_interactions;

                    // Count events for this region
                    const { count } = await supabaseAdmin
                        .from('topic_events')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .eq('region', region);

                    if ((count || 0) < threshold) {
                        console.log(`[BadgeService] ⏳ Badge Pending: ${region} (${count}/${threshold})`);
                        canAward = false;
                    }
                }

                if (canAward) {
                    // Grant Badge
                    await supabaseAdmin
                        .from('user_badges')
                        .insert({
                            user_id: userId,
                            badge_id: badge.id,
                            xp: xpAmount,
                            level: 1,
                            last_active: new Date()
                        });
                    console.log(`[BadgeService] 🆕 Badge Discovered: ${region}`);
                }
            }

        } catch (err) {
            console.error('[BadgeService] XP Award Error:', err);
        }
    }

    /**
     * Get all badges for a domain to provide context.
     * @param {string} userId
     * @param {string} domain
     */
    async getBadgesByDomain(userId, domain) {
        try {
            // Join user_badges with badges
            const { data: userBadges, error } = await supabaseAdmin
                .from('user_badges')
                .select(`
                    xp, 
                    level, 
                    last_active,
                    badges!inner ( name, domain, region, description )
                `)
                .eq('user_id', userId)
                .eq('badges.domain', domain) // inner join filter
                .order('xp', { ascending: false });

            if (error) throw error;
            return userBadges.map(ub => ({
                name: ub.badges.name,
                region: ub.badges.region,
                level: ub.level,
                xp: ub.xp,
                last_active: ub.last_active
            }));

        } catch (err) {
            console.error('[BadgeService] Get Context Error:', err);
            return [];
        }
    }
}

export default new BadgeService();
