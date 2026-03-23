import express from 'express';
import { prisma } from '../../db.js';
import { log, getRecent, getLevel, setLevel } from '../../utils/logger.js';
import { requireAuth, requireAdmin, sendSuccess, sendError } from './middleware.js';

const router = express.Router();

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
        console.error('[Admin/SystemStatus] Error getting logs:', err);
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

router.get('/restart', requireAuth, requireAdmin, async (req, res) => {
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
        console.error('[Admin/SystemStatus] Error dumping database:', err);
        res.status(500).json({ error: 'Failed to dump database' });
    }
});

export default router;
