import BaseAgent from './BaseAgent.js';
import { supabaseAdmin } from '../../../db.js';

class ScoutAgent extends BaseAgent {
    constructor() {
        super('scout');
    }

    /**
     * Triggered by 'content_enriched' job
     */
    async findResources({ topicId }) {
        try {
            const { data: topic, error } = await supabaseAdmin
                .from('topics')
                .select('*')
                .eq('id', topicId)
                .single();

            if (error || !topic) {
                console.error(`[Scout] Topic ${topicId} not found.`);
                return;
            }

            console.log(`[Scout] Finding resources for: ${topic.title}`);

            await this.loadSystemPrompt();

            // Force JSON
            const config = { ...this.config, jsonMode: true };
            const finalSystemPrompt = (this.systemPrompt || 'You are a research scout.') + "\n\n" + (this.instructionText || '');

            const messages = [
                { role: 'system', content: finalSystemPrompt },
                { role: 'user', content: `Find 3 high-quality external resources (Books, Papers, Videos) for the topic: "${topic.title}".` }
            ];

            const response = await this.provider.chat(messages, config);
            let result;
            try {
                result = JSON.parse(response);
            } catch (e) {
                console.error('[Scout] JSON Parse Error:', e);
                return;
            }

            if (result.resources && result.resources.length > 0) {
                const resourcesToInsert = result.resources.map(r => ({
                    topic_id: topicId,
                    title: r.title,
                    type: r.type, // Ensure it matches enum if strict, else might error. Schema had enum.
                    url: r.url,
                    metadata: { description: r.description },
                    view_status: 'Available'
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('resources')
                    .insert(resourcesToInsert);

                if (insertError) {
                    console.error('[Scout] DB Insert Error:', insertError.message);
                } else {
                    console.log(`[Scout] Added ${result.resources.length} resources for ${topic.title}`);
                }
            }

        } catch (err) {
            console.error(`[Scout] Error processing topic ${topicId}:`, err);
        }
    }

    async researchQuery(query) {
        // ... legacy method ...
        console.log(`[Scout] Researching: ${query}`);
        return await this.provider.chat([{ role: 'user', content: query }], this.config);
    }
}

export default new ScoutAgent();
