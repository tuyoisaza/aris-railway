import BaseAgent from './BaseAgent.js';
import { supabaseAdmin } from '../../../db.js';
import ThothAgent from './ThothAgent.js';
// ActionService & AgoraService imported dynamically to avoid circular dependencies

class TeacherAgent extends BaseAgent {
    constructor() {
        super('teacher');
    }

    async respondToUser(userId, userMessage, conversationHistory = [], language = 'en', skipTools = false, conversationId = null) {
        // Dynamic imports to avoid circular dependency
        const ActionService = (await import('../../ActionService.js')).default;
        const AgoraService = (await import('../../AgoraService.js')).default;

        console.log(`[Teacher] 🟢 Responding to ${userId} in ${language} (Format: JSON Triple)`);

        // =====================================================================
        // PHASE 1: Read Agora Snapshot & Build Context
        // =====================================================================

        let contextMsg = "";

        // 1. Consult Agora (Synthetic Memory)
        try {
            const agoraSnapshot = await AgoraService.getSnapshot(userId);
            const agoraContext = await AgoraService.getFormattedMemory(userId);

            if (agoraContext) {
                contextMsg += `\n\n${agoraContext}`;
            }
        } catch (e) {
            console.error('[Teacher] Error reading Agora:', e);
        }

        // 2. Load System Prompt (Base Personality)
        await this.loadSystemPrompt();

        // 3. User & Domain Context (Legacy/Supplement)
        try {
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('age, name, description, emoticon_usage')
                .eq('id', userId)
                .single();

            if (user) {
                contextMsg += `\n\n[USER CONTEXT]\nName: ${user.name}`;
                if (user.age) contextMsg += `\nAge: ${user.age}`;
                if (user.description) contextMsg += `\nDescription: ${user.description}`;

                // Emoji Preference
                if (user.emoticon_usage) {
                    const usage = user.emoticon_usage;
                    let emojiInstr = '';
                    if (usage === 'NONE') emojiInstr = 'Do NOT use emojis under any circumstances.';
                    else if (usage === 'LOW') emojiInstr = 'Use emojis very sparingly, only when absolutely necessary for clarity.';
                    else if (usage === 'MEDIUM') emojiInstr = 'Use emojis moderately to add tone, but don\'t overuse them.';
                    else if (usage === 'HIGH') emojiInstr = 'Use emojis liberally and expressively in every message.';

                    if (emojiInstr) contextMsg += `\nEMOJI USAGE: ${emojiInstr}`;
                }

                // contextMsg += `\nINSTRUCTION: Respond STRICTLY in ${language === 'es' ? 'Spanish' : language === 'pt' ? 'Portuguese' : 'English'}.`;
            }

            // Domain Context
            const domain = await ThothAgent.classifyDomain(userMessage);
            if (domain && domain !== 'General') {
                contextMsg += `\n[CURRENT TOPIC]: ${domain}`;
            }

        } catch (e) {
            console.error('[Teacher] Error fetching user context:', e);
        }

        // 4. Inject Available Actions
        try {
            const actions = await ActionService.getActions();
            const enabledActions = actions.filter(a => a.enabled);
            if (enabledActions.length > 0) {
                contextMsg += `\n\n[AVAILABLE ACTIONS]\n(See instructions for usage)\n`;
                enabledActions.forEach(a => {
                    contextMsg += `- Slug: "${a.slug}" | Name: "${a.name}" | Desc: ${a.description || 'No desc'}\n`;
                });
            }
        } catch (e) {
            console.error('[Teacher] Error injecting actions:', e);
        }

        // =====================================================================
        // PHASE 2: Prompt Engineering (JSON Enforcement)
        // =====================================================================

        // Use instruction text from DB (separated from "Soul")
        const jsonInstruction = this.instructionText || '';

        // =====================================================================
        // PHASE 3: Execution
        // =====================================================================

        try {
            const messages = [
                { role: 'system', content: (this.systemPrompt || 'You are ARIS, a helpful AI tutor.') + contextMsg + "\n\n" + jsonInstruction },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            // DEBUG: Log the end of the system prompt to verify instructions
            console.log('[TeacherDebug] System Prompt Tail:', messages[0].content.slice(-500));

            const chatOptions = {
                ...this.config,
                jsonMode: true,
                temperature: 0.7
            };

            let rawContent = await this.provider.chat(messages, chatOptions);

            // Cleanup: remove markdown blocks if model ignored instructions
            if (rawContent.startsWith('```json')) {
                rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (rawContent.startsWith('```')) {
                rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Parse JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(rawContent);
            } catch (e) {
                console.error('[Teacher] 🔴 Invalid JSON from model. Fallback to text.', rawContent);
                // Fallback structure
                parsedResponse = {
                    action: null,
                    response: rawContent || "I'm having a bit of trouble structuring my thoughts, but I'm listening.",
                    options: ["Tell me more about that.", "Explain the context.", "Let's switch topics."]
                };
            }

            // Validate Structure
            if (!parsedResponse.options || !Array.isArray(parsedResponse.options) || parsedResponse.options.length !== 3) {
                // Heal options if missing/broken
                parsedResponse.options = ["Tell me more.", "What is the history?", "Surprise me."];
            }

            // =====================================================================
            // PHASE 4: Action Execution
            // =====================================================================

            if (parsedResponse.action && parsedResponse.action.type) {
                // SPECIAL CASE: Milestones and Proposals are internal signals for artifacts
                if (parsedResponse.action.type === 'milestone' || parsedResponse.action.type === 'proposal') {
                    console.log(`[Teacher] 📍 Artifact Signal: ${parsedResponse.action.type}`);

// NEW: Automated Topic Creation for BRANCH milestones
                    if (parsedResponse.action.type === 'milestone' && parsedResponse.action.payload?.milestoneType === 'BRANCH') {
                        const topicTitle = parsedResponse.action.payload.topic;
                        if (topicTitle) {
                            console.log(`[Teacher] 🚀 Automating topic creation for: ${topicTitle}`);
                            try {
                                // Add milestone context to prevent duplicate creation
                                const executionResult = await ActionService.executeAction('topic', userId, userMessage, topicTitle);
                                if (executionResult && (executionResult.id || executionResult.url)) {
                                    parsedResponse.action.result_url = executionResult.url;
                                    console.log(`[Teacher] ✅ Topic action executed: ${executionResult.url}`);
                                    
                                    // Mark this topic as already processed to prevent duplicate creation
                                    parsedResponse.action.topicProcessed = true;
                                }
                            } catch (e) {
                                console.error('[Teacher] Failed to automate topic creation:', e.message);
                            }
                        }
                    }
                    // Do NOT block. Let it pass through so chat.js / UI can render the artifact as well.
                } else {
                    // Execute via ActionService
                    const executionResult = await ActionService.executeAction(
                        parsedResponse.action.type, // slug
                        userId,
                        parsedResponse.action.payload || {}, // payload
                        userMessage // intent (use the user message as context)
                    );

                    if (!executionResult.success) {
                        console.warn(`[Teacher] Action blocked/failed: ${parsedResponse.action.type} (${executionResult.reason || executionResult.error})`);
                        // If blocked, nullify action in response so frontend doesn't try to render it explicitly if it relied on it
                        parsedResponse.action = null;
                    } else {
                        console.log(`[Teacher] ✅ Action executed: ${parsedResponse.action.type}`);
                        if (executionResult.url) {
                            parsedResponse.action.result_url = executionResult.url;
                        }
                    }
                }
            }

            // =====================================================================
            // PHASE 5: Post-Action Signals (Agora Buffer)
            // =====================================================================

            try {
                if (parsedResponse.response && parsedResponse.response.length > 50) {
                    await AgoraService.emitPostActionSummary(this.agentId, userId, 'ENGAGEMENT_SIGNAL', {
                        level: 0.8,
                        domain: 'General', // TODO: Use actual classified domain
                        responseFormat: 'JSON_TRIPLE'
                    }, conversationId);
                }
            } catch (e) {
                console.error('[Teacher] Error emitting signals:', e);
            }

            console.log(`[Teacher] ✅ Response generated (JSON):`, JSON.stringify(parsedResponse).substring(0, 100) + "...");

            // Return stringified JSON (Frontend will parse)
            return JSON.stringify(parsedResponse);

        } catch (error) {
            console.error(`[Teacher] 🔴 Critical Error:`, error);
            // Fallback JSON
            return JSON.stringify({
                action: null,
                response: `I'm having trouble thinking right now. (Debug Error: ${error.message})`,
                options: ["Retry that.", "Check system status.", "Wait for a moment."]
            });
        }
    }
}

export default new TeacherAgent();
