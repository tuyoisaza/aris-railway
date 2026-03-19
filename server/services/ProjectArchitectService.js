import { DaedalusAgent } from './ai/agents/DaedalusAgent.js';
import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';

const daedalus = new DaedalusAgent();

export const ProjectArchitectService = {
    /**
     * Architects a project based on user intent and skill context.
     * @param {string} userId - The user ID
     * @param {object} context - { topicId, skillId, idea, level }
     * @returns {Promise<object>} - The created project with architecture
     */
    async architectProject(userId, { topicId, skillId, idea, level }) {
        log('Service', 'INFO', 'ProjectArchitect', `Architecting project for user ${userId} on skill ${skillId}`);

        try {
            // 1. Fetch Skill Data
            // "topics" relation does not exist on skills table based on migrations.
            // We use skill title/category as proxy for topic context.
            const { data: skillData, error: skillError } = await supabaseAdmin
                .from('skills')
                .select('title, category, depth')
                .eq('id', skillId)
                .single();

            if (skillError) throw new Error(`Skill not found: ${skillError.message}`);

            const skillTitle = skillData.title;
            const topicContext = { title: skillData.category || 'General' }; // Fallback context

            // 2. Call Daedalus Agent
            log('Service', 'INFO', 'ProjectArchitect', 'Consulting Daedalus...');
            const architecture = await daedalus.architectProject(
                topicContext,
                skillData.depth || 1,
                { title: skillTitle },
                idea
            );

            // 3. Create Project Record
            // We map Daedalus output to our DB schema
            const projectData = {
                user_id: userId,
                title: architecture.project.name,
                origin: architecture.project.origin,
                intent: idea, // User's original raw idea
                // The task says "Project from Skill page" -> usually implies 'Active' intent.
                // Daedalus designs it, so we set to 'active' so they can start building.
                status: 'active',

                // Daedalus Fields mapping to JSONB 'architecture'
                architecture: architecture.project,

                // Legacy/Compat mappings if needed
                why_i_care: architecture.project.origin,
                done_when: architecture.project.finish_line,

                // Linkages
                topic_id: topicId,
                skill_id: skillId
            };

            const { data: newProject, error: createError } = await supabaseAdmin
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (createError) throw createError;

            log('Service', 'INFO', 'ProjectArchitect', `Project created: ${newProject.id}`);
            return newProject;

        } catch (error) {
            log('Service', 'ERROR', 'ProjectArchitect', error.message);
            throw error;
        }
    }
};
