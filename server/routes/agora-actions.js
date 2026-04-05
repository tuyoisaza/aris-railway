import { prisma } from '../db.js';
import { sendSuccess, sendError } from './admin/middleware.js';
import ScoutAgent from '../services/ai/agents/ScoutAgent.js';
import ThothAgent from '../services/ai/agents/ThothAgent.js';
import DaedalusAgent from '../services/ai/agents/DaedalusAgent.js';
import LughAgent from '../services/ai/agents/LughAgent.js';
import SkillAgent from '../services/ai/agents/SkillAgent.js';

export async function handleTopicAction(req, res, payload, intent) {
    try {
        const { title, category, description } = payload;
        const userId = req.user.id;

        const topic = await prisma.topic.create({
            data: {
                title: title || 'New Topic',
                category: category || 'General',
                description: description || '',
                userId: userId
            }
        });

        try {
            await ScoutAgent.findResources(topic.id);
        } catch (e) {
            console.error('[AgoraActions] ScoutAgent error:', e);
        }

        try {
            await ThothAgent.classifyTopic(topic.id, title);
        } catch (e) {
            console.error('[AgoraActions] ThothAgent error:', e);
        }

        await saveToMemory(userId, 'topic_created', {
            topicId: topic.id,
            title: topic.title,
            category: topic.category
        });

        return sendSuccess(res, {
            success: true,
            url: `/topics/${topic.id}`,
            topic
        });
    } catch (err) {
        console.error('[AgoraActions] Topic error:', err);
        return sendError(res, 'Failed to create topic: ' + err.message, 500);
    }
}

export async function handleProjectAction(req, res, payload, intent) {
    try {
        const { title, description, topicId } = payload;
        const userId = req.user.id;

        const project = await prisma.project.create({
            data: {
                title: title || 'New Project',
                description: description || '',
                userId: userId,
                topicId: topicId || null,
                status: 'planning'
            }
        });

        let blueprint = null;
        try {
            blueprint = await DaedalusAgent.architectFromIntent(
                userId,
                title || 'New Project',
                description || '',
                null
            );

            if (blueprint) {
                await prisma.project.update({
                    where: { id: project.id },
                    data: {
                        metadata: JSON.stringify(blueprint)
                    }
                });
            }
        } catch (e) {
            console.error('[AgoraActions] DaedalusAgent error:', e);
        }

        await saveToMemory(userId, 'project_created', {
            projectId: project.id,
            title: project.title
        });

        return sendSuccess(res, {
            success: true,
            url: `/projects/${project.id}`,
            project,
            blueprint
        });
    } catch (err) {
        console.error('[AgoraActions] Project error:', err);
        return sendError(res, 'Failed to create project: ' + err.message, 500);
    }
}

export async function handleSkillAction(req, res, payload, intent) {
    try {
        const { name, category } = payload;
        const userId = req.user.id;

        const skill = await prisma.skill.create({
            data: {
                title: name || 'New Skill',
                category: category || 'General',
                description: '',
                userId: userId,
                level: 0,
                xp: 0
            }
        });

        let curriculum = null;
        try {
            curriculum = await LughAgent.generateCurriculum(name || 'New Skill', intent || '');

            if (curriculum) {
                await prisma.skill.update({
                    where: { id: skill.id },
                    data: {
                        metadata: JSON.stringify(curriculum)
                    }
                });
            }
        } catch (e) {
            console.error('[AgoraActions] LughAgent error:', e);
        }

        await saveToMemory(userId, 'skill_created', {
            skillId: skill.id,
            title: skill.title
        });

        return sendSuccess(res, {
            success: true,
            url: `/skills/${skill.id}`,
            skill,
            curriculum
        });
    } catch (err) {
        console.error('[AgoraActions] Skill error:', err);
        return sendError(res, 'Failed to create skill: ' + err.message, 500);
    }
}

export async function handleConversationAction(req, res, payload, intent) {
    try {
        const { title, language } = payload;
        const userId = req.user.id;

        const conversation = await prisma.conversation.create({
            data: {
                userId: userId,
                title: title || 'New Conversation',
                language: language || 'en'
            }
        });

        await saveToMemory(userId, 'conversation_started', {
            conversationId: conversation.id,
            title: conversation.title
        });

        return sendSuccess(res, {
            success: true,
            url: `/conversation/${conversation.id}`,
            conversation
        });
    } catch (err) {
        console.error('[AgoraActions] Conversation error:', err);
        return sendError(res, 'Failed to create conversation: ' + err.message, 500);
    }
}

async function saveToMemory(userId, eventType, data) {
    try {
        const traitKey = `${eventType}_${Date.now()}`;
        const memoryEntry = {
            type: eventType,
            data: data,
            timestamp: new Date().toISOString()
        };

        await prisma.agoraUserMemory.create({
            data: {
                userId: userId,
                traitKey: traitKey,
                traitValue: JSON.stringify(memoryEntry),
                confidence: 0.8
            }
        });
    } catch (err) {
        console.error('[AgoraActions] saveToMemory error:', err);
    }
}

export function getAvailableActions() {
    return [
        {
            slug: 'topic',
            name: 'Topic',
            description: 'Explore a new learning topic'
        },
        {
            slug: 'project',
            name: 'Project',
            description: 'Build something practical'
        },
        {
            slug: 'skill',
            name: 'Skill',
            description: 'Track a practical skill'
        },
        {
            slug: 'conversation',
            name: 'Conversation',
            description: 'Start a new conversation'
        }
    ];
}
