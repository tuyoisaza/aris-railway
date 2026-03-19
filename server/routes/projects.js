import express from 'express';
import { z } from 'zod';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';
import { ProjectArchitectService } from '../services/ProjectArchitectService.js';
import ConversationService from '../services/ConversationService.js';
import { supabaseAdmin } from '../db.js';

const router = express.Router();

// GET /api/projects/:userId
router.get('/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;

    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    try {
        const { data, error } = await req.userClient
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        log('API', 'ERROR', 'Projects', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/:projectId/architect - Populate project with Daedalus architecture
import DaedalusAgent from '../services/ai/agents/DaedalusAgent.js';

router.post('/:projectId/architect', requireAuth, async (req, res) => {
    const { projectId } = req.params;

    log('API', 'INFO', 'Projects', `Architecting project ${projectId} with Daedalus`);

    try {
        // 1. Fetch the project
        const { data: project, error: fetchError } = await req.userClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (fetchError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // 2. Call Daedalus to architect
        const architecture = await DaedalusAgent.architectFromProject(project);

        if (!architecture.project) {
            throw new Error('Daedalus did not return a valid project structure');
        }

        // 3. Update the project with architecture AND the new creative name
        const { data: updated, error: updateError } = await req.userClient
            .from('projects')
            .update({
                title: architecture.project.name || project.title,
                architecture: architecture.project,
                origin: architecture.project.origin || project.origin
            })
            .eq('id', projectId)
            .select()
            .single();

        if (updateError) throw updateError;

        log('API', 'INFO', 'Projects', `Project ${projectId} architected successfully`);
        res.json(updated);
    } catch (err) {
        log('API', 'ERROR', 'Projects', `Daedalus error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/from-skill


router.post('/from-skill', requireAuth, async (req, res) => {
    const { skillId, topicId, idea } = req.body;
    const userId = req.user.id;

    if (!skillId) return res.status(400).json({ error: 'Skill ID is required' });

    log('API', 'INFO', 'Projects', `Architecting project from skill ${skillId} for user ${userId}`);

    try {
        const project = await ProjectArchitectService.architectProject(userId, {
            skillId,
            topicId, // Optional?
            idea,
            level: 1 // default, fetch real level if needed but service fetches skill data anyway
        });
        res.json(project);
    } catch (err) {
        log('API', 'ERROR', 'Projects', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects
router.post('/', requireAuth, validate(schemas.createProject), async (req, res) => {
    const { userId, title, topicId, whyICare, intent, scope, doneWhen } = req.body;

    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Project title is required' });
    }

    log('API', 'INFO', 'Projects', `Creating project "${title}" for user: ${userId}`);

    try {
        // First, try to insert directly - database constraint will prevent duplicates
        const { data, error } = await req.userClient
            .from('projects')
            .insert([{
                user_id: userId,
                title: title.trim(),
                topic_id: topicId || null,
                why_i_care: whyICare,
                intent,
                // scope is now considered synonymous with intent for simplified logic, 
                // or we can allow it if passed. For now, populating scope with intent to keep DB compatible.
                scope: scope || intent,
                done_when: doneWhen,
                status: 'idea',
                artifacts: []
            }])
            .select()
            .single();

        if (!error && data) {
            log('API', 'INFO', 'Projects', `Successfully created project "${data.id}": ${data.title}`);
            res.json(data);
            return;
        }

        // If insert failed due to unique constraint, find existing project
        if (error?.message?.includes('unique_project_title_per_user') || 
            error?.code === '23505') {
            
            log('API', 'INFO', 'Projects', `Project "${title}" already exists, fetching existing`);
            
            const { data: existingProject, error: fetchError } = await req.userClient
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .ilike('title', title.trim())
                .single();

            if (fetchError) {
                log('API', 'ERROR', 'Projects', `Failed to fetch existing project: ${fetchError.message}`);
                res.status(500).json({ error: 'Failed to retrieve existing project' });
                return;
            }

            if (existingProject) {
                log('API', 'INFO', 'Projects', `Returning existing project "${existingProject.id}": ${existingProject.title}`);
                res.json(existingProject);
                return;
            }
        }

        // If we get here, there was an unexpected error
        throw error || new Error('Unknown error in project creation');
        
    } catch (err) {
        log('API', 'ERROR', 'Projects', `Project creation failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:projectId
router.put('/:projectId', requireAuth, validate(schemas.updateProject), async (req, res) => {
    const { projectId } = req.params;
    const updates = req.body;
    delete updates.projectId;

    log('API', 'INFO', 'Projects', `Updating project: ${projectId}`);

    try {
        const dbUpdates = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.whyICare) dbUpdates.why_i_care = updates.whyICare;
        if (updates.intent) dbUpdates.intent = updates.intent;
        if (updates.scope) dbUpdates.scope = updates.scope;
        if (updates.doneWhen) dbUpdates.done_when = updates.doneWhen;
        if (updates.artifacts) dbUpdates.artifacts = updates.artifacts;
        if (updates.reflections) dbUpdates.reflections = updates.reflections;

        const { data, error } = await req.userClient
            .from('projects')
            .update(dbUpdates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Projects', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;  // From middleware: req.user = user
    log('API', 'INFO', 'Projects', `Deleting project: ${projectId} for user: ${userId}`);

    try {
        // Delete with user_id filter to ensure RLS compatibility
        const { data, error } = await req.userClient
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId)
            .select();

        if (error) {
            log('API', 'ERROR', 'Projects', `Delete error: ${error.message}`);
            throw error;
        }

        // Check if any rows were actually deleted
        if (!data || data.length === 0) {
            log('API', 'WARN', 'Projects', `No project found or permission denied: ${projectId}`);
            return res.status(404).json({ error: 'Project not found or you do not have permission to delete it' });
        }

        log('API', 'INFO', 'Projects', `Successfully deleted project: ${projectId}`);
        res.json({ success: true, deleted: data });
    } catch (err) {
        log('API', 'ERROR', 'Projects', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ===================================
// SUB-RESOURCES
// ===================================

// ARTIFACTS
router.get('/:projectId/artifacts', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    try {
        const { data, error } = await req.userClient
            .from('project_artifacts')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        log('API', 'ERROR', 'Artifacts', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:projectId/artifacts', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    const { name, type, content } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    try {
        const { data, error } = await req.userClient
            .from('project_artifacts')
            .insert([{ project_id: projectId, name, type, content }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Artifacts', err.message);
        res.status(500).json({ error: err.message });
    }
});

// NOTE: This route was /api/projects/artifacts/:id in original? No.
// Original: app.delete('/api/projects/artifacts/:id', ...)
// Index logic mounted generic projects at /api/projects.
// So this delete path is awkward if mounted at /api/projects.
// It would be /api/projects/artifacts/:id.
// So: router.delete('/artifacts/:id', ...) ✅
router.delete('/artifacts/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await req.userClient
            .from('project_artifacts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        log('API', 'ERROR', 'Artifacts', err.message);
        res.status(500).json({ error: err.message });
    }
});

// REFLECTIONS
router.get('/:projectId/reflections', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    try {
        const { data, error } = await req.userClient
            .from('project_reflections')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        log('API', 'ERROR', 'Reflections', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:projectId/reflections', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    const { content, isPrivate } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        const { data, error } = await req.userClient
            .from('project_reflections')
            .insert([{
                project_id: projectId,
                content,
                is_private: isPrivate !== false // Default true
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Reflections', err.message);
        res.status(500).json({ error: err.message });
    }
});

// COMMENTS
router.get('/:projectId/comments', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    try {
        const { data, error } = await req.userClient
            .from('project_comments')
            .select('*, users(name, avatar)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        log('API', 'ERROR', 'Comments', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:projectId/comments', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        const { data, error } = await req.userClient
            .from('project_comments')
            .insert([{ project_id: projectId, user_id: userId, content }])
            .select('*, users(name, avatar)')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Comments', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/:projectId/conversation - Start or continue a conversation about this project
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';

router.post('/:projectId/conversation', requireAuth, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    log('API', 'INFO', 'Projects', `Starting/continuing conversation for project: ${projectId}`);

    try {
        // 1. Fetch the project
        const { data: project, error: fetchError } = await req.userClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // 2. Check if project already has a linked conversation
        if (project.conversation_id) {
            // Verify the conversation still exists
            const { data: existingConv } = await req.userClient
                .from('conversations')
                .select('id')
                .eq('id', project.conversation_id)
                .single();

            if (existingConv) {
                log('API', 'INFO', 'Projects', `Returning existing conversation ${project.conversation_id} for project ${projectId}`);
                return res.json({ conversationId: project.conversation_id, isNew: false });
            }
        }

        // 3. Prepare Context & Brief
        const architecture = project.architecture || {};
        const projectBrief = `Project: ${project.title}
        
What it's about: ${project.origin || project.why_i_care || 'No description'}

${architecture.claim ? `The Claim: ${architecture.claim}` : ''}
${architecture.constraint ? `The Constraint: ${architecture.constraint}` : ''}
${architecture.build ? `The Build: ${architecture.build}` : ''}
${architecture.finish_line ? `Finish Line: ${architecture.finish_line}` : ''}`.trim();

        const conversationTitle = `Project: ${project.title}`;
        const userBriefing = `I'm working on a project called "${project.title}".
        
Here is the brief:
${projectBrief}

Can you help me with this?`;

        const kickstartPrompt = `The user just sent you a project brief for "${project.title}".
        
        Analyze their brief and greet them warmly. 
        Offer 2-3 specific ways you could help based on the 'Claim', 'Constraint', or 'Build' details they provided.
        Keep it under 100 words. Be enthusiastic.`;

        // 4. Delegate to ConversationService
        const result = await ConversationService.startGuidedConversation({
            userId,
            title: conversationTitle,
            topicId: project.topic_id,
            brief: userBriefing,
            initialContext: kickstartPrompt,
            initialXp: 10 // Optional: XP for discussing project?
        });

        // 5. Link conversation to project if new/changed
        if (result.isNew || result.conversationId !== project.conversation_id) {
            await supabaseAdmin
                .from('projects')
                .update({ conversation_id: result.conversationId })
                .eq('id', projectId);
        }

        res.json(result);

    } catch (err) {
        log('API', 'ERROR', 'Projects', `Conversation error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

export default router;
