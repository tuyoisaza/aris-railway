import EventManager from '../EventManager.js';
import { prisma } from '../../../db.js';
import jobQueue from '../../jobQueue.js';
import ActionRegistry from '../../ActionRegistry.js';

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

            const isResearch = aiResponse.action && aiResponse.action.type === 'research';
            if (isResearch) {
                await this.handleResearch(userId, conversationId, aiResponse);
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

    async handleResearch(userId, conversationId, aiResponse) {
        console.log(`[CognitionListener] Processing Research for Conv ${conversationId}`);

        const researchQuery = aiResponse.action?.payload?.query || userContent;
        const researchPayload = {
            type: 'research',
            query: researchQuery,
            status: 'researching'
        };

        await prisma.message.create({
            data: {
                conversationId,
                role: 'system',
                content: JSON.stringify(researchPayload)
            }
        });

        jobQueue.addJob('research_triggered', {
            conversationId,
            userId,
            query: researchQuery
        });

        const result = await ActionRegistry.execute('research:web', userId, {
            query: researchQuery,
            conversationId
        });

        const resultPayload = {
            type: 'research_result',
            query: researchQuery,
            summary: result.summary,
            sources: result.sources
        };

        await prisma.message.create({
            data: {
                conversationId,
                role: 'system',
                content: JSON.stringify(resultPayload)
            }
        });

        const sourcesText = result.sources?.length > 0
            ? `\n\n**Sources:**\n${result.sources.slice(0, 3).map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join('\n')}`
            : '';

        await prisma.message.create({
            data: {
                conversationId,
                role: 'ai',
                content: `I did some research on "${researchQuery}" and found:\n\n${result.summary}${sourcesText}`
            }
        });
    }
}

export default new CognitionListener();
