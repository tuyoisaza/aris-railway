import { supabaseAdmin } from '../db.js';
import LughAgent from './ai/agents/LughAgent.js';

class SkillService {
    /**
     * Records a skill usage/demonstration.
     * Ensures the Skill and Sub-Skill exist (Nodes) and are connected (Edges).
     * Updates User Progress.
     */
    /**
     * Creates a skill from a specific user intent/action (Guided Action).
     * @param {string} userId
     * @param {string} rawName - The intent or name provided
     * @param {string} context - The massive payload or description
     */
    async createGuidedSkill(userId, rawName, context) {
        console.log(`[SkillService] Creating guided skill: ${rawName}`);

        // 1. Create the skill (or get existing) with the context as description
        // Use rawName as title initially, Lugh will fix it.
        // Use 'General' as category to satisfy DB constraint (was 'Guided')
        console.log(`[SkillService] createGuidedSkill ctx type: ${typeof context}, length: ${context?.length}`);
        if (typeof context !== 'string') console.log('[SkillService] WARNING: Context is not a string:', JSON.stringify(context));

        const skillId = await this._ensureSkill(rawName, 'General', 1, context);

        // 2. Ensure user tracks it
        await this._updateUserProgress(userId, skillId, 1, 0);

        return { skillId };
    }

    async recordSkill(userId, skillData) {
        const { parentSkill, subSkill, level, xp } = skillData;

        // 1. Ensure Parent Skill Exists
        const parentId = await this._ensureSkill(parentSkill, 'General');

        // 2. Ensure Sub-Skill Exists (if different)
        let subId = parentId;
        if (subSkill && subSkill !== parentSkill && subSkill !== 'General') {
            subId = await this._ensureSkill(subSkill, 'Technical', 2); // Default depth 2 for sub

            // 3. Ensure Edge (Parent -> Sub)
            await this._ensureEdge(parentId, subId, 'sub_skill');
        }

        // 4. Update User Progress (for the Sub-Skill, or specific node)
        await this._updateUserProgress(userId, subId, level, xp);

        return { parentId, subId };
    }

    async _ensureSkill(title, category = 'General', defaultDepth = 1, description = '') {
        // Check if exists
        const { data: existing } = await supabaseAdmin
            .from('skills')
            .select('id')
            .ilike('title', title) // Case insensitive look up
            .single();

        if (existing) return existing.id;

        // Create
        const { data: newSkill, error } = await supabaseAdmin
            .from('skills')
            .insert({
                title: title,
                category,
                depth: defaultDepth,
                description: description // Save description
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating skill:', error);
            throw error;
        }

        // Background Trigger Lugh to generate content
        // We do NOT await this, letting it run in background
        console.log(`[SkillService] 🪄 Triggering background Lugh generation for: ${title}`);
        LughAgent.generateCurriculum(title, description)
            .then(content => this.updateSkillContent(newSkill.id, content))
            .then(() => console.log(`[SkillService] ✅ Lugh content saved for: ${title}`))
            .catch(err => console.error(`[SkillService] ❌ Lugh generation failed for ${title}:`, err));

        return newSkill.id;
    }

    async _ensureEdge(sourceId, targetId, type = 'sub_skill') {
        const { data: existing } = await supabaseAdmin
            .from('skill_edges')
            .select('id')
            .eq('source_id', sourceId)
            .eq('target_id', targetId)
            .single();

        if (existing) return;

        await supabaseAdmin.from('skill_edges').insert({ source_id: sourceId, target_id: targetId, type });
    }

    async _updateUserProgress(userId, skillId, assessedLevel, xpAmount) {
        // Get current
        const { data: current } = await supabaseAdmin
            .from('user_skill_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('skill_id', skillId)
            .single();

        let newLevel = assessedLevel;
        let newXp = xpAmount;

        if (current) {
            // Logic: XP accumulates. Level is max(current, assessed)
            newXp = (current.xp || 0) + xpAmount;
            newLevel = Math.max(current.level || 0, assessedLevel);

            await supabaseAdmin
                .from('user_skill_progress')
                .update({ xp: newXp, level: newLevel, last_practiced_at: new Date() })
                .eq('id', current.id);
        } else {
            await supabaseAdmin
                .from('user_skill_progress')
                .insert({
                    user_id: userId,
                    skill_id: skillId,
                    level: newLevel,
                    xp: newXp,
                    last_practiced_at: new Date()
                });
        }
    }

    async updateSkillContent(skillId, content) {
        const updates = { content: content };

        // If Lugh refined the name, update the title
        if (content.skillName) {
            updates.title = content.skillName;
            console.log(`[SkillService] Updating title to: ${content.skillName}`);
        }

        const { error } = await supabaseAdmin
            .from('skills')
            .update(updates)
            .eq('id', skillId);

        if (error) {
            console.error('Error updating skill content:', error);
            throw error;
        }
        return true;
    }
    /**
     * Awards XP for practicing a skill (e.g. starting a conversation).
     */
    async awardPracticeXP(userId, skillId, level, xpAmount) {
        return this._updateUserProgress(userId, skillId, level, xpAmount);
    }
}

export default new SkillService();
