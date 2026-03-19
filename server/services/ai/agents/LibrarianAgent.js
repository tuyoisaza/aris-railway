import BaseAgent from './BaseAgent.js';
import { supabaseAdmin } from '../../../db.js';

class LibrarianAgent extends BaseAgent {
    constructor() {
        super('librarian');
    }

    /**
     * Triggered by 'topic_created' job
     */
    async enrichTopic(topicId, force = false) {
        try {
            // 1. Fetch Topic
            const { data: topic, error } = await supabaseAdmin
                .from('topics')
                .select('*')
                .eq('id', topicId)
                .single();

            if (error || !topic) throw new Error(`Topic not found: ${topicId}`);

            // Skip if already has content, unless forced
            if (topic.content && !force) {
                console.log(`[Librarian] Topic "${topic.title}" already has content. Skipping.`);
                return;
            }

            console.log(`[Librarian] Generating content for topic: ${topic.title}`);

            await this.loadSystemPrompt();

            // 2. Generate Content
            const config = { ...this.config, jsonMode: true };
            const finalSystemPrompt = (this.systemPrompt || 'You represent the Library of Alexandria.') + "\n\n" + (this.instructionText || '');
            const messages = [
                { role: 'system', content: finalSystemPrompt },
                {
                    role: 'user',
                    content: `Enrich the topic: "${topic.title}". \nContext: ${topic.description || 'No description provided.'}`
                }
            ];

            const contentStr = await this.provider.chat(messages, config);
            console.log(`[Librarian] Generated JSON content length: ${contentStr.length}`);

            let contentObj;
            try {
                contentObj = JSON.parse(contentStr);
            } catch (parseErr) {
                console.error('[Librarian] JSON Parse Error:', parseErr);
                // Optionally try to fix or cleaner fallback
                return;
            }

            // 3. Return Content (Service handles persistence)
            return contentObj;

        } catch (err) {
            console.error(`[Librarian] Error enriching topic ${topicId}:`, err);
            return null;
        }
    }

    async summarize(conversationsContent) {
        console.log(`[Librarian] Summarizing ${conversationsContent.length} chars of content`);

        await this.loadSystemPrompt();

        const instructions = `
You are an expert archivist and synthesizer. 
Your task is to create a concise but comprehensive summary of the provided conversation logs.
Focus on key insights, decisions, and valid information. Ignore chit-chat.
Format the output as a clear Markdown report with:
- Main Topics
- Key Details
- Action Items (if any)
`;

        const messages = [
            { role: 'system', content: this.systemPrompt || 'You are a helpful AI.' },
            { role: 'user', content: `${instructions}\n\nTOPICS TO SUMMARIZE:\n${conversationsContent}` }
        ];

        return await this.provider.chat(messages, this.config);
    }
    /**
     * Generate personalized content for a specific user and intent within a topic.
     */
    async generatePersonalizedContent(topicId, userId, userContext) {
        if (!userContext || !userId) return;
        const contextPreview = userContext.length > 50 ? userContext.slice(0, 50) + '...' : userContext;
        console.log(`[Librarian] 🎨 Generating personalized content for context: "${contextPreview}" inside topic ${topicId}`);

        try {
            await this.loadSystemPrompt();

            // 1. Fetch Topic Context
            const { data: topic } = await supabaseAdmin.from('topics').select('title, description').eq('id', topicId).single();
            if (!topic) return;

            // 2. Generate
            const config = { ...this.config, jsonMode: true };
            const finalSystemPrompt = (this.systemPrompt || 'You represent the Library of Alexandria.') + "\n\n" + (this.instructionText || '');
            const messages = [
                { role: 'system', content: finalSystemPrompt },
                {
                    role: 'user',
                    content: `The user has provided the following Context/Intent for their learning:
                    
                    USER CONTEXT:
                    """
                    ${userContext.slice(0, 2000)} 
                    """
                    (Context truncated to 2000 chars if longer)
                    
                    This maps to the Knowledge Domain: "${topic.title}".
                    
                    Create a PERSONALIZED learning path that bridges this specific User Context to the broader domain "${topic.title}".`
                }
            ];

            const contentStr = await this.provider.chat(messages, config);
            let contentObj;
            try {
                contentObj = JSON.parse(contentStr);
            } catch (e) {
                console.error('[Librarian] Personalization JSON Error:', e);
                return;
            }

            // 3. Update User Progress
            const { error } = await supabaseAdmin
                .from('user_topic_progress')
                .update({ personalized_content: contentObj })
                .eq('user_id', userId)
                .eq('topic_id', topicId);

            if (error) console.error('[Librarian] Error saving personalized content:', error.message);
            else console.log(`[Librarian] ✅ Personalized content saved for ${userId}`);

        } catch (err) {
            console.error('[Librarian] Personalization Logic Error:', err);
        }
    }
}

export default new LibrarianAgent();
