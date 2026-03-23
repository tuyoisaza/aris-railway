import express from 'express';
import AgentService from '../../services/ai/AgentService.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const prompts = await AgentService.getAllAgents();
        sendSuccess(res, prompts);
    } catch (err) {
        next(err);
    }
});

router.put('/:agentId', requireAuth, requireAdmin, async (req, res, next) => {
    const { agentId } = req.params;
    const { promptText, model, temperature, name, active } = req.body;

    try {
        const updated = await AgentService.updatePrompt(agentId, {
            promptText,
            model,
            temperature,
            name,
            active
        });
        
        if (!updated) {
            return sendError(res, 'Prompt not found', 404);
        }

        sendSuccess(res, updated);
    } catch (err) {
        next(err);
    }
});

router.post('/chat', requireAuth, requireAdmin, async (req, res, next) => {
    const { agentId, message, history } = req.body;

    if (!agentId || !message) {
        return sendError(res, 'agentId and message are required', 400);
    }

    try {
        const AgentClass = await getAgentClass(agentId);
        if (!AgentClass) {
            return sendError(res, 'Agent not found', 404);
        }

        const agent = new AgentClass();
        let response;

        if (agentId === 'teacher') {
            response = await agent.respondToUser(req.user.id, message, history || [], 'en', null);
        } else if (agentId === 'thoth') {
            response = await agent.classify(message);
        } else {
            response = await agent.chat([{ role: 'user', content: message }]);
            if (typeof response === 'string') {
                response = await agent.parse(response);
            }
        }

        sendSuccess(res, { response });
    } catch (err) {
        console.error(`[Admin/Agents] Chat test error for ${agentId}:`, err);
        next(err);
    }
});

async function getAgentClass(agentId) {
    const agents = {
        'teacher': () => import('../../services/ai/agents/TeacherAgent.js').then(m => m.default),
        'cartographer': () => import('../../services/ai/agents/CartographerAgent.js').then(m => m.default),
        'cartographer_rel': () => import('../../services/ai/agents/CartographerAgent.js').then(m => m.default),
        'librarian': () => import('../../services/ai/agents/LibrarianAgent.js').then(m => m.default),
        'scout': () => import('../../services/ai/agents/ScoutAgent.js').then(m => m.default),
        'thoth': () => import('../../services/ai/agents/ThothAgent.js').then(m => m.default),
    };

    const loader = agents[agentId];
    if (!loader) return null;
    
    return await loader();
}

export default router;
