import BaseAction from './BaseAction.js';
import { supabaseAdmin } from '../db.js';

class ProjectAction extends BaseAction {

    async execute(userId, payload, intent) {
        // Project Action Logic
        // Title = Intent (or default)
        // Description/Intent = Payload

        const title = intent || 'New Guided Project';
        const description = typeof payload === 'string' ? payload : JSON.stringify(payload);

        // Create Project (Status: idea)
        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .insert([{
                user_id: userId,
                title: title,
                intent: description,
                status: 'idea', // Start as idea
                why_i_care: 'Created via Guided Action',
                artifacts: []
            }])
            .select()
            .single();

        if (error) {
            console.error('[ProjectAction] Creation Error:', error);
            throw new Error(`Failed to create project: ${error.message}`);
        }

        return {
            url: `/projects/${project.id}`,
            message: 'Project idea created.'
        };
    }
}

export default new ProjectAction();
