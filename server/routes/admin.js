import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, sendSuccess, sendError } from '../middleware.js';
import AgentService from '../services/ai/AgentService.js';
import { log, getRecent, getLevel, setLevel } from '../utils/logger.js';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.plan !== 'pro') {
        return sendError(res, 'Admin access required', 403);
    }
    next();
};

router.get('/prompts', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const prompts = await AgentService.getAllAgents();
        sendSuccess(res, prompts);
    } catch (err) {
        next(err);
    }
});

router.put('/prompts/:agentId', requireAuth, requireAdmin, async (req, res, next) => {
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

router.post('/chat_test', requireAuth, requireAdmin, async (req, res, next) => {
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
        console.error(`[Admin] Chat test error for ${agentId}:`, err);
        next(err);
    }
});

async function getAgentClass(agentId) {
    const agents = {
        'teacher': () => import('../services/ai/agents/TeacherAgent.js').then(m => m.default),
        'cartographer': () => import('../services/ai/agents/CartographerAgent.js').then(m => m.default),
        'cartographer_rel': () => import('../services/ai/agents/CartographerAgent.js').then(m => m.default),
        'librarian': () => import('../services/ai/agents/LibrarianAgent.js').then(m => m.default),
        'scout': () => import('../services/ai/agents/ScoutAgent.js').then(m => m.default),
        'thoth': () => import('../services/ai/agents/ThothAgent.js').then(m => m.default),
    };

    const loader = agents[agentId];
    if (!loader) return null;
    
    return await loader();
}

router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true }
        });
        sendSuccess(res, users);
    } catch (err) {
        next(err);
    }
});

router.get('/badges', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const badges = await prisma.badge.findMany();
        sendSuccess(res, badges);
    } catch (err) {
        next(err);
    }
});

router.get('/services', requireAuth, requireAdmin, async (req, res) => {
    const services = [
        { name: 'Backend API', status: 'operational', message: 'Running' },
        { name: 'Database', status: 'operational', message: 'Connected' },
        { name: 'OpenAI API', status: process.env.OPENAI_API_KEY ? 'operational' : 'missing_config', message: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured' },
        { name: 'TeacherAgent', status: 'operational', message: 'Ready' },
        { name: 'CartographerAgent', status: 'operational', message: 'Ready' },
        { name: 'LibrarianAgent', status: 'operational', message: 'Ready' },
        { name: 'ScoutAgent', status: 'operational', message: 'Ready' },
        { name: 'ThothAgent', status: 'operational', message: 'Ready' },
    ];
    res.json(services);
});

router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const logs = getRecent(100);
        res.json(logs);
    } catch (err) {
        console.error('[Admin] Error getting logs:', err);
        res.json([]);
    }
});

router.get('/loglevel', requireAuth, requireAdmin, async (req, res) => {
    res.json({ level: getLevel() });
});

router.put('/loglevel', requireAuth, requireAdmin, async (req, res) => {
    const { level } = req.body;
    if (typeof level === 'number' && level >= 0 && level <= 5) {
        setLevel(level);
        sendSuccess(res, { level });
    } else {
        sendError(res, 'Invalid log level', 400);
    }
});

router.get('/settings/debug', requireAuth, requireAdmin, async (req, res) => {
    res.json({ enabled: getLevel() >= 4 });
});

router.put('/settings/debug', requireAuth, requireAdmin, async (req, res) => {
    const { enabled } = req.body;
    setLevel(enabled ? 4 : 2);
    sendSuccess(res, { enabled });
});

router.post('/restart', requireAuth, requireAdmin, async (req, res) => {
    try {
        const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'connected').catch(() => 'error');
        sendSuccess(res, {
            success: true,
            status: { database: dbStatus },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        sendError(res, 'Restart check failed', 500);
    }
});

router.get('/dump', requireAuth, requireAdmin, async (req, res) => {
    try {
        const dump = {};
        
        dump.users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, plan: true } });
        dump.topics = await prisma.topic.findMany({ select: { id: true, title: true, category: true } });
        dump.skills = await prisma.skill.findMany({ select: { id: true, title: true, category: true } });
        dump.badges = await prisma.badge.findMany({ select: { id: true, name: true, description: true } });
        dump.conversations = await prisma.conversation.count();
        dump.messages = await prisma.message.count();
        
        res.json(dump);
    } catch (err) {
        console.error('[Admin] Error dumping database:', err);
        res.status(500).json({ error: 'Failed to dump database' });
    }
});

router.get('/actions', requireAuth, requireAdmin, async (req, res) => {
    try {
        const actions = await prisma.action.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        sendSuccess(res, actions);
    } catch (err) {
        next(err);
    }
});

router.get('/activity', requireAuth, requireAdmin, async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        sendSuccess(res, logs);
    } catch (err) {
        next(err);
    }
});

export default router;
