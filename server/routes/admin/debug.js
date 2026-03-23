import express from 'express';
import { requireAuth, requireAdmin, sendSuccess } from './middleware.js';
import debugService from '../../services/debug/DebugService.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
    const isActive = await debugService.isDebugActive();
    const sessions = await debugService.getActiveSessions();
    res.json({ 
        enabled: isActive, 
        sessions: sessions.map(s => ({
            id: s.id,
            scope: s.scope,
            reason: s.reason,
            expiresAt: s.expiresAt,
            activatedAt: s.activatedAt,
            metadata: s.metadata
        }))
    });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { scope = 'ADMIN', durationMinutes = 15, reason } = req.body;
    const userId = req.user?.id;
    
    const session = await debugService.activateDebug(userId, scope, durationMinutes, reason);
    sendSuccess(res, { 
        session: {
            id: session.id,
            scope: session.scope,
            expiresAt: session.expiresAt
        }
    });
});

router.delete('/', requireAuth, requireAdmin, async (req, res) => {
    const { sessionId } = req.body;
    
    if (sessionId) {
        await debugService.deactivateDebug(sessionId);
    } else {
        await debugService.deactivateAllDebug();
    }
    sendSuccess(res, { disabled: true });
});

router.get('/sessions', requireAuth, requireAdmin, async (req, res) => {
    const sessions = await debugService.getAllSessions(true);
    res.json({ sessions });
});

router.delete('/sessions/:id', requireAuth, requireAdmin, async (req, res) => {
    await debugService.deactivateDebug(req.params.id);
    sendSuccess(res, { deleted: true });
});

export default router;
