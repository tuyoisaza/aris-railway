/**
 * Agora API Routes
 * 
 * Transparency endpoints for user memory inspection and correction.
 * Per specification: Memory must never be hidden, absolute, or irreversible.
 */

import express from 'express';
import { requireAuth } from '../middleware.js';
import AgoraService from '../services/AgoraService.js';
import OgmaAgent from '../services/ai/agents/OgmaAgent.js';
import SkillService from '../services/SkillService.js';

const router = express.Router();

// ============================================================================
// USER-FACING ENDPOINTS (Transparency)
// ============================================================================

/**
 * GET /api/agora/memory
 * Retrieve user's Layer B memory (human-readable inferred traits)
 */
router.get('/memory', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const memory = await AgoraService.getUserMemory(userId);

        // Format for human readability
        const formattedMemory = memory.map(m => ({
            key: m.trait_key,
            value: m.trait_value,
            confidence: Math.round(m.confidence * 100),
            lastConfirmed: m.last_confirmed,
            canCorrect: true
        }));

        res.json({
            userId,
            traits: formattedMemory,
            note: 'These are probabilistic inferences based on your usage patterns. You can correct any of these.'
        });
    } catch (err) {
        console.error('[Agora API] Error fetching memory:', err);
        res.status(500).json({ error: 'Failed to retrieve memory' });
    }
});

/**
 * PUT /api/agora/memory/:traitKey
 * Submit a correction to a memory trait
 * Immediately reduces confidence or removes the trait
 */
router.put('/memory/:traitKey', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { traitKey } = req.params;
        const { correction, reason } = req.body;

        const result = await AgoraService.correctMemory(userId, traitKey, correction);

        res.json({
            success: true,
            action: result.action,
            message: result.action === 'deleted'
                ? 'Trait has been removed based on your feedback.'
                : `Trait confidence reduced to ${Math.round(result.newConfidence * 100)}%`,
            traitKey
        });
    } catch (err) {
        console.error('[Agora API] Error correcting memory:', err);
        res.status(500).json({ error: err.message || 'Failed to correct memory' });
    }
});

/**
 * GET /api/agora/audit
 * View change history for user's memory
 */
router.get('/audit', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        const history = await AgoraService.getAuditHistory(userId, limit);

        res.json({
            userId,
            changes: history,
            count: history.length
        });
    } catch (err) {
        console.error('[Agora API] Error fetching audit:', err);
        res.status(500).json({ error: 'Failed to retrieve audit history' });
    }
});

/**
 * GET /api/agora/profile
 * Get user's Layer A stable state (identity/permissions)
 */
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const state = await AgoraService.getStableState(userId);

        res.json({
            userId,
            role: state.user_role,
            language: state.language_pref,
            tier: state.subscription_tier,
            consent: state.consent_flags
        });
    } catch (err) {
        console.error('[Agora API] Error fetching profile:', err);
        res.status(500).json({ error: 'Failed to retrieve profile' });
    }
});

/**
 * PUT /api/agora/consent
 * Update user consent flags
 */
router.put('/consent', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { memory_enabled, trait_inference, cross_session_learning } = req.body;

        const consentFlags = {};
        if (typeof memory_enabled === 'boolean') consentFlags.memory_enabled = memory_enabled;
        if (typeof trait_inference === 'boolean') consentFlags.trait_inference = trait_inference;
        if (typeof cross_session_learning === 'boolean') consentFlags.cross_session_learning = cross_session_learning;

        const updated = await AgoraService.updateStableState(userId, {
            consent_flags: consentFlags
        });

        res.json({
            success: true,
            consent: updated.consent_flags
        });
    } catch (err) {
        console.error('[Agora API] Error updating consent:', err);
        res.status(500).json({ error: 'Failed to update consent' });
    }
});

// ============================================================================
// DEBUG / ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/agora/snapshot
 * Debug endpoint: Get full Agora snapshot for current user
 */
router.get('/snapshot', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionId = req.query.sessionId || null;

        const snapshot = await AgoraService.getSnapshot(userId, sessionId);

        res.json(snapshot);
    } catch (err) {
        console.error('[Agora API] Error fetching snapshot:', err);
        res.status(500).json({ error: 'Failed to retrieve snapshot' });
    }
});

/**
 * POST /api/agora/process
 * Trigger Ogma processing for current user (admin/debug)
 */
router.post('/process', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await OgmaAgent.processBuffer(userId);

        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('[Agora API] Error processing signals:', err);
        res.status(500).json({ error: 'Failed to process signals' });
    }
});

/**
 * GET /api/agora/signals
 * Debug: View unprocessed signals for current user
 */
router.get('/signals', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const signals = await AgoraService.getUnprocessedSignals(userId, 50);

        res.json({
            userId,
            pending: signals.length,
            signals
        });
    } catch (err) {
        console.error('[Agora API] Error fetching signals:', err);
        res.status(500).json({ error: 'Failed to retrieve signals' });
    }
});

/**
 * Agentic Actions - Standardized Execution via ActionService
 * All actions now go through ActionService which enforces AGORA consultation.
 */

import ActionService from '../services/ActionService.js';

/**
 * GET /api/agora/actions
 * Get all available actions (for frontend dropdown, TeacherAgent, etc.)
 */
router.get('/actions', async (req, res) => {
    try {
        const actions = await ActionService.getActions();
        res.json({ success: true, actions });
    } catch (err) {
        console.error('[Agora API] Failed to get actions:', err);
        res.status(500).json({ error: 'Failed to load actions' });
    }
});

/**
 * POST /api/agora/action
 * Execute an action via ActionService (AGORA lifecycle enforced)
 */
router.post('/action', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, payload, intent } = req.body;

        console.log(`[Agora Action] Executing ${type} for user ${userId}`);

        // ActionService handles:
        // 1. Action lookup
        // 2. Agent resolution
        // 3. AGORA snapshot read
        // 4. Execution
        // 5. AGORA signal emit
        const result = await ActionService.executeAction(type, userId, payload, intent);

        res.json({
            success: true,
            ...result
        });

    } catch (err) {
        console.error('[Agora API] Action execution failed:', err);
        res.status(500).json({ error: err.message || 'Action failed' });
    }
});

/**
 * Admin endpoints for action management
 */
router.get('/actions/admin', requireAuth, async (req, res) => {
    try {
        // Include disabled actions for admin
        const actions = await ActionService.getActions(true);
        res.json({ success: true, actions });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load actions' });
    }
});

router.post('/actions/admin', requireAuth, async (req, res) => {
    try {
        const action = await ActionService.createAction(req.body);
        res.json({ success: true, action });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/actions/admin/:id', requireAuth, async (req, res) => {
    try {
        const action = await ActionService.updateAction(req.params.id, req.body);
        res.json({ success: true, action });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/actions/admin/:id', requireAuth, async (req, res) => {
    try {
        await ActionService.deleteAction(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

