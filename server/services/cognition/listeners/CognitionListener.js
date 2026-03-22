import EventManager from '../EventManager.js';
import { prisma } from '../../../db.js';
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
            const isMilestone = aiResponse.isMilestone || (aiResponse.action && aiResponse.action.type === 'milestone');
            if (isMilestone) {
                await this.handleMilestone(userId, conversationId, aiResponse);
            }

            const isProposal = aiResponse.isProposal || (aiResponse.action && aiResponse.action.type === 'proposal');
            if (isProposal) {
                await this.handleProposal(userId, conversationId, aiResponse);
            }
        } catch (err) {
            console.error('[CognitionListener] Error processing cognitive artifacts:', err);
        }
    }

    async handleMilestone(userId, conversationId, aiResponse) {
        console.log(`[CognitionListener] Processing Milestone for Conv ${conversationId}`);

        const milestoneType = aiResponse.milestoneType || aiResponse.action?.payload?.type || 'DEPTH';
        const topic = aiResponse.topic || aiResponse.action?.payload?.topic || 'General';

        const milestonePayload = {
            type: 'milestone',
            milestoneType: milestoneType,
            topic: topic,
            display: `${milestoneType}: ${topic}`
        };

        await prisma.message.create({
            data: {
                conversationId,
                role: 'system',
                content: JSON.stringify(milestonePayload)
            }
        });

        jobQueue.addJob('milestone_triggered', {
            conversationId,
            userId,
            milestoneType: milestoneType,
            topic: topic
        });
    }

    async handleProposal(userId, conversationId, aiResponse) {
        console.log(`[CognitionListener] Processing Proposal for Conv ${conversationId}`);

        const projectData = aiResponse.projectData || aiResponse.action?.payload || {};
        const proposalPayload = {
            type: 'proposal',
            projectData: projectData
        };

        await prisma.message.create({
            data: {
                conversationId,
                role: 'system',
                content: JSON.stringify(proposalPayload)
            }
        });

        await prisma.message.create({
            data: {
                conversationId,
                role: 'ai',
                content: `I've drafted a project idea for you based on our chat: **${projectData.title || 'Project'}**. You can start it whenever you're ready.`
            }
        });
    }
}

export default new CognitionListener();
