import EventManager from '../EventManager.js';
import { supabaseAdmin } from '../../../db.js';
import jobQueue from '../../jobQueue.js';

class CognitionListener {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventManager.on(EventManager.EVENTS.AI_RESPONSE_COMPLETED, this.onAiResponse.bind(this));
    }

    async onAiResponse({ userId, conversationId, userContent, aiResponse }) {
        if (!aiResponse) return;

        try {
            // 1. Check for MILESTONES
            // Legacy V1 check contained isMilestone, V2 uses action.type
            const isMilestone = aiResponse.isMilestone || (aiResponse.action && aiResponse.action.type === 'milestone');

            if (isMilestone) {
                await this.handleMilestone(userId, conversationId, aiResponse);
            }

            // 2. Check for PROJECT PROPOSALS
            const isProposal = aiResponse.isProposal || (aiResponse.action && aiResponse.action.type === 'proposal');

            if (isProposal) {
                await this.handleProposal(userId, conversationId, aiResponse);
            }

        } catch (err) {
            console.error('[CognitionListener] Error processing cognitive artifacts:', err);
        }
    }

    async handleMilestone(userId, conversationId, aiResponse) {
        console.log(`[CognitionListener] 📍 Processing Milestone for Conv ${conversationId}`);

        const milestoneType = aiResponse.milestoneType || aiResponse.action?.payload?.type || 'DEPTH';
        const topic = aiResponse.topic || aiResponse.action?.payload?.topic || 'General';

        const milestonePayload = {
            type: 'milestone',
            milestoneType: milestoneType,
            topic: topic,
            display: `${milestoneType}: ${topic}`
        };

        // Insert System Message (Artifact)
        await supabaseAdmin.from('messages').insert([{
            conversation_id: conversationId,
            role: 'system',
            text: JSON.stringify(milestonePayload)
        }]);

        // Trigger Background Job
        jobQueue.addJob('milestone_triggered', {
            conversationId,
            userId,
            milestoneType: milestoneType,
            topic: topic
        });
    }

    async handleProposal(userId, conversationId, aiResponse) {
        console.log(`[CognitionListener] 💡 Processing Proposal for Conv ${conversationId}`);

        const projectData = aiResponse.projectData || aiResponse.action?.payload || {};
        const proposalPayload = {
            type: 'proposal',
            projectData: projectData
        };

        // Insert System Message (Artifact)
        await supabaseAdmin.from('messages').insert([{
            conversation_id: conversationId,
            role: 'system',
            text: JSON.stringify(proposalPayload)
        }]);

        // Insert AI Intro Message (if not already handled by the stream, but usually proposals need a wrapper)
        // In the original chat.js, we added a specific "I've drafted a project..." message.
        // We should replicate that or let the AI's natural response handle it.
        // Original logic explicitly added it:
        await supabaseAdmin.from('messages').insert([{
            conversation_id: conversationId,
            role: 'ai',
            text: `I've drafted a project idea for you based on our chat: **${projectData.title || 'Project'}**. You can start it whenever you're ready.`
        }]);
    }
}

export default new CognitionListener();
