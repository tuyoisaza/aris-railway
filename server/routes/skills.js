import express from 'express';
import { supabaseAdmin } from '../db.js';
import LughAgent from '../services/ai/agents/LughAgent.js';
import SkillService from '../services/SkillService.js';
import { log } from '../utils/logger.js';
import { requireAuth } from '../middleware.js';

import { z } from 'zod';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';
import ConversationService from '../services/ConversationService.js';

// Helper for Sentence Case
const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const router = express.Router();

// Generate curriculum for a skill
router.post('/:id/generate', requireAuth, async (req, res) => {

    try {
        const { id } = req.params;
        log('API', 'INFO', 'Skills', `Generating content for skill ${id}`);

        // 1. Get skill details
        const { data: skill, error } = await supabaseAdmin
            .from('skills')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // 2. Generate content using Lugh
        // Pass description/context if available
        const content = await LughAgent.generateCurriculum(skill.title, skill.description);

        // 3. Save content
        await SkillService.updateSkillContent(id, content);

        res.json({ content });
    } catch (err) {
        log('API', 'ERROR', 'Skills', `Error generating content: ${err.message}`);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

/**
 * POST /api/skills/:id/levels/:level/conversation
 * Start a conversation about a specific mastery level
 */
router.post('/:id/levels/:level/conversation', requireAuth, async (req, res) => {
    const { id, level } = req.params;
    const userId = req.user.id;
    const levelNum = parseInt(level);

    try {
        // 1. Fetch Skill Content
        const { data: skill, error } = await supabaseAdmin
            .from('skills')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !skill) return res.status(404).json({ error: 'Skill not found' });

        // 2. Find the specific level data
        const levels = skill.content?.levels || [];
        const levelData = levels.find(l => l.level === levelNum);

        if (!levelData) return res.status(404).json({ error: 'Level not found' });

        // 3. Prepare Context & Brief
        // FIXED: Include Skill Title to avoid collisions between skills with same level names
        const conversationTitle = `Level ${levelNum}: ${levelData.name} (${skill.title})`;

        const userBriefing = `Hey ARIS, I'm trying to develop this skill: ${skill.title}. Talk to me about ${levelData.name} (Level ${levelNum}). Here is the description: ${levelData.description}. The expected output is: ${levelData.expectedResult}. Can you guide me through this?`;

        const kickstartPrompt = `
You are ARIS, an expert mentor. The user is starting mastery level ${levelNum} ("${levelData.name}") for the skill "${skill.title}".
Description: ${levelData.description}
Expected Output: ${levelData.expectedResult}

Your goal:
1. Acknowledge their focus on this specific level.
2. Briefly explain why this level is critical.
3. Propose a small immediate thought exercise or question to check their readiness.
Keep it encouraging and concise.
        `.trim();

        // 4. Delegate to ConversationService
        const result = await ConversationService.startGuidedConversation({
            userId,
            title: conversationTitle,
            topicId: skill.topic_id,
            brief: userBriefing,
            initialContext: kickstartPrompt,
            initialXp: 10,
            skillId: id,
            level: levelNum
        });

        res.json(result);

    } catch (err) {
        console.error('[Skills] Conversation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/skills/progress - Get user's skill progress
router.get('/progress', requireAuth, async (req, res) => {
    try {
        const { data, error } = await req.userClient
            .from('user_skill_progress')
            .select(`
                *,
                skills(id, title, category, description)
            `)
            .eq('user_id', req.user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        
        // Format for frontend
        const skills = data?.map(item => ({
            ...item.skills,
            xp: item.xp,
            level: item.level,
            skill_id: item.skill_id,
            skill_name: item.skills.title
        })) || [];

        res.json(skills);
    } catch (err) {
        console.error('[Skills] Progress Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/skills/notifications - Get user's XP notifications
router.get('/notifications', requireAuth, async (req, res) => {
    try {
        const { data, error } = await req.userClient
            .from('xp_notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Mark as read
        if (data && data.length > 0) {
            await req.userClient
                .from('xp_notifications')
                .update({ read: true })
                .eq('user_id', req.user.id)
                .eq('read', false);
        }

        res.json(data || []);
    } catch (err) {
        console.error('[Skills] Notifications Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
