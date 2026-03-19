import express from 'express';
import net from 'net';
import { supabaseAdmin } from '../db.js';
import { getLogs, setLogLevel, getLogLevel, LEVELS, log } from '../utils/logger.js';
import { requireAuth } from '../middleware.js';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';
import CartographerAgent from '../services/ai/agents/CartographerAgent.js';
import LibrarianAgent from '../services/ai/agents/LibrarianAgent.js';
import ScoutAgent from '../services/ai/agents/ScoutAgent.js';
import ThothAgent from '../services/ai/agents/ThothAgent.js';
import BaseAgent from '../services/ai/agents/BaseAgent.js';
import { LoggingService } from '../services/LoggingService.js';

const router = express.Router();

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('is_super_admin')
            .eq('id', req.user.id)
            .single();

        if (error || !user || !user.is_super_admin) {
            log('Admin', 'WARN', 'Auth', `Unauthorized admin access attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Super Admin access required' });
        }
        next();
    } catch (err) {
        log('Admin', 'ERROR', 'Auth', err.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

// Map string IDs to instances
const agents = {
    teacher: TeacherAgent,
    cartographer: CartographerAgent,
    cartographer_rel: new BaseAgent('cartographer_rel'), // Generic instance for prompt testing
    librarian: LibrarianAgent,
    scout: ScoutAgent,
    thoth: ThothAgent
};

// GET /api/admin/prompts - List all prompts
router.get('/prompts', requireAuth, requireAdmin, async (req, res) => {

    try {
        const { data, error } = await supabaseAdmin
            .from('system_prompts')
            .select('*')
            .order('agent_id');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/prompts/:agentId - Update prompt
router.put('/prompts/:agentId', requireAuth, requireAdmin, async (req, res) => {
    const { agentId } = req.params;
    const { prompt_text, instruction_text, model, temperature } = req.body;

    console.log(`[Admin] Updating prompt for ${agentId}`, { prompt_text: prompt_text?.substring(0, 20) + '...', model, temperature });

    try {
        const { data, error } = await supabaseAdmin
            .from('system_prompts')
            .update({ prompt_text, instruction_text, model, temperature, updated_at: new Date() })
            .eq('agent_id', agentId)
            .select()
            .single();

        if (error) {
            console.error('[Admin] Update Error:', error);
            throw error;
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/chat_test - Test an agent
router.post('/chat_test', requireAuth, requireAdmin, async (req, res) => {
    const { agentId, message, history } = req.body;
    const agent = agents[agentId];

    if (!agent) {
        return res.status(400).json({ error: 'Invalid agent ID' });
    }

    try {
        // Use the agent's chat method
        // Note for Cartographer/Librarian/Scout we might need specific methods, 
        // but BaseAgent.chat is generic enough for testing "persona".
        // history should be an array of { role, content }
        const response = await agent.chat(message, history || []);
        res.json({ response });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/restart - Soft restart services
router.post('/restart', requireAuth, requireAdmin, async (req, res) => {
    console.log('[Admin] Received soft restart request');

    try {
        // 1. Reload Environment Variables
        const result = require('dotenv').config({ override: true });

        if (result.error) {
            console.warn('[Admin] Dotenv reload warning:', result.error.message);
        } else {
            console.log('[Admin] Environment variables reloaded');
        }

        // 2. Quick Health Check
        const status = {
            database: 'unknown',
            config: 'reloaded',
            timestamp: new Date().toISOString()
        };

        try {
            const { error } = await supabaseAdmin.from('users').select('id').limit(1);
            status.database = error ? 'error' : 'connected';
        } catch (e) {
            status.database = 'error';
        }

        console.log('[Admin] Soft restart complete', status);
        res.json({ success: true, status });

    } catch (err) {
        console.error('[Admin] Restart failed:', err);
        res.status(500).json({ error: 'Restart failed', details: err.message });
    }
});

// Helper: Check local port
const checkPort = (port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(400); // Fast check
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
};

// GET /api/admin/services - Check system status
router.get('/services', requireAuth, requireAdmin, async (req, res) => {
    const services = [];

    // 1. Backend API (Self)
    const backendPort = process.env.PORT || 3000;
    const backendAlive = await checkPort(backendPort);
    services.push({
        name: `Backend API (Port ${backendPort})`,
        status: backendAlive ? 'operational' : 'error',
        message: backendAlive ? 'Responding to TCP' : 'Port not accessible',
        link: `http://localhost:${backendPort}`
    });

    // 2. Database
    try {
        const { error } = await supabaseAdmin.from('users').select('id').limit(1);
        services.push({
            name: 'Supabase Database',
            status: error ? 'error' : 'operational',
            message: error ? error.message : 'Connected',
            link: process.env.SUPABASE_URL
        });
    } catch (e) {
        services.push({ name: 'Supabase Database', status: 'error', message: e.message });
    }

    // 3. External APIs (Env check)
    services.push({
        name: 'OpenAI API',
        status: process.env.OPENAI_API_KEY ? 'operational' : 'missing_config',
        message: process.env.OPENAI_API_KEY ? 'Key configured' : 'Missing OPENAI_API_KEY',
        link: 'https://platform.openai.com'
    });

    services.push({
        name: 'Stripe',
        status: process.env.STRIPE_SECRET_KEY ? 'operational' : 'missing_config',
        message: process.env.STRIPE_SECRET_KEY ? 'Key configured' : 'Missing STRIPE_SECRET_KEY',
        link: 'https://dashboard.stripe.com/test/payments'
    });

    services.push({
        name: 'Resend Email',
        status: process.env.RESEND_API_KEY ? 'operational' : 'missing_config',
        message: process.env.RESEND_API_KEY ? 'Key configured' : 'Missing RESEND_API_KEY',
        link: 'https://resend.com/emails'
    });

    // 4. Frontend Clients (Scan 5173-5175)
    for (let p = 5173; p <= 5175; p++) {
        const isAlive = await checkPort(p);
        if (isAlive) {
            services.push({
                name: `Frontend Client (Port ${p})`,
                status: 'operational',
                message: 'Active Vite Server',
                link: `http://localhost:${p}`
            });
        }
    }

    res.json(services);
});

// GET /api/admin/dump - Download Complete Database
router.get('/dump', requireAuth, requireAdmin, async (req, res) => {
    console.log('[Admin] Generating database dump...');
    try {
        const tables = [
            'users', 'families', 'family_members', 'invitations',
            'conversations', 'messages', 'topics', 'resources',
            'projects', 'system_prompts'
        ];

        const dump = {};

        // Parallel fetch for speed
        await Promise.all(tables.map(async (table) => {
            const { data, error } = await supabaseAdmin.from(table).select('*');
            if (error) {
                console.warn(`[Admin] Failed to dump table ${table}:`, error.message);
                dump[table] = { error: error.message };
            } else {
                dump[table] = data;
            }
        }));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `aris_db_dump_${timestamp}.json`;

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/json');
        res.json(dump);

    } catch (err) {
        console.error('[Admin] Dump failed:', err);
        res.status(500).json({ error: 'Dump failed', details: err.message });
    }
});

// GET /api/admin/logs - Get recent logs
router.get('/logs', requireAuth, requireAdmin, (req, res) => {
    res.json(getLogs().reverse()); // Newest first
});

// GET /api/admin/loglevel - Get current level
router.get('/loglevel', requireAuth, requireAdmin, (req, res) => {
    res.json({ level: getLogLevel() });
});

// PUT /api/admin/loglevel - Set log level
router.put('/loglevel', requireAuth, requireAdmin, (req, res) => {
    const { level } = req.body;
    setLogLevel(level);
    res.json({ success: true, level: getLogLevel() });
});


// ============================================================
// BADGES CRUD
// ============================================================

// GET /api/admin/badges - List badges
router.get('/badges', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('badges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/badges - Create badge
router.post('/badges', requireAuth, requireAdmin, async (req, res) => {
    const { name, description, icon, trigger_type, trigger_condition, message_template, is_active, category } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('badges')
            .insert([{ name, description, icon, trigger_type, trigger_condition, message_template, is_active, category }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/badges/:id - Update badge
router.put('/badges/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('badges')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/badges/:id - Delete badge
router.delete('/badges/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('badges')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ============================================================
// SYSTEM DEBUG & LOGS
// ============================================================

// GET /api/admin/settings/debug - Get global debug status
router.get('/settings/debug', requireAuth, requireAdmin, async (req, res) => {
    const isDebug = await LoggingService.getDebugMode();
    res.json({ global_debug: isDebug });
});

// PUT /api/admin/settings/debug - Toggle global debug
router.put('/settings/debug', requireAuth, requireAdmin, async (req, res) => {
    const { enabled } = req.body;
    const result = await LoggingService.setDebugMode(enabled, req.user.id);

    if (result.success) {
        LoggingService.log('DEBUG_TOGGLE', req.user, 'SUCCESS', { enabled });
        res.json({ success: true, global_debug: enabled });
    } else {
        res.status(500).json({ error: `Failed to update debug mode: ${result.error}` });
    }
});

// GET /api/admin/system_logs - Get persistent system logs
router.get('/system_logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('system_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ============================================================
// USER MANAGEMENT (Super Admin)
// ============================================================

// GET /api/admin/users - List users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, plan, is_super_admin, created_at, last_seen')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users - Create User
router.post('/users', requireAuth, requireAdmin, async (req, res) => {
    const { email, password, name, plan, is_super_admin } = req.body;

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: { data: { name: name || 'User' } }
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Create Profile
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: authData.user.email,
                    name: name || 'New User',
                    plan: plan || 'free',
                    is_super_admin: !!is_super_admin
                }]);

            if (profileError) throw profileError;

            LoggingService.log('USER_CREATE', req.user, 'SUCCESS', { target_user: email, plan, is_super_admin });
            res.json({ success: true, user: authData.user });
        } else {
            throw new Error('User creation failed');
        }

    } catch (err) {
        LoggingService.log('USER_CREATE', req.user, 'FAILURE', { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/admin/users/:id - Update User
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { plan, is_super_admin, name } = req.body;

    try {
        const updates = {};
        if (plan !== undefined) updates.plan = plan;
        if (is_super_admin !== undefined) updates.is_super_admin = is_super_admin;
        if (name !== undefined) updates.name = name;

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        LoggingService.log('USER_UPDATE', req.user, 'SUCCESS', { target_user_id: id, updates });
        res.json(data);
    } catch (err) {
        LoggingService.log('USER_UPDATE', req.user, 'FAILURE', { target_user_id: id, error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id - Delete User
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Delete from users public table
        const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
        if (dbError) throw dbError;

        // Delete auth user
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        LoggingService.log('USER_DELETE', req.user, 'SUCCESS', { target_user_id: id });
        res.json({ success: true });
    } catch (err) {
        LoggingService.log('USER_DELETE', req.user, 'FAILURE', { target_user_id: id, error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users/:id/reset-password - Trigger Reset Email
router.post('/users/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Get email first
        const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', id).single();
        if (!user) throw new Error('User not found');

        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
            redirectTo: 'https://aris.app/update-password'
        });

        if (error) throw error;

        LoggingService.log('USER_RESET_PWD', req.user, 'SUCCESS', { target_user_id: id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/migrate/user-isolation - Execute User Isolation Migration
router.post('/migrate/user-isolation', requireAuth, requireAdmin, async (req, res) => {
    console.log('[Admin] Executing user isolation migration...');

    try {
        // NOTE: Supabase client doesn't support raw SQL (ADD COLUMN). 
        // Schema changes must be done manually via Supabase Dashboard SQL Editor.
        // This endpoint only handles data migration (adopting orphans).

        // Step 1: Adopt orphaned records to the first admin user
        const { data: firstUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (firstUser) {
            // Update topics
            await supabaseAdmin
                .from('topics')
                .update({ user_id: firstUser.id })
                .is('user_id', null);

            // Update skills  
            await supabaseAdmin
                .from('skills')
                .update({ user_id: firstUser.id })
                .is('user_id', null);

            console.log(`[Admin] Adopted orphans to user ${firstUser.id}`);
        }

        LoggingService.log('MIGRATION', req.user, 'SUCCESS', { migration: 'user_isolation' });
        res.json({
            success: true,
            message: 'Migration executed. User isolation active.',
            admin_user_id: firstUser?.id
        });

    } catch (err) {
        console.error('[Admin] Migration Error:', err);
        LoggingService.log('MIGRATION', req.user, 'FAILURE', { migration: 'user_isolation', error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/migrate/reassign-topics - Reassign all topics to a specific user
router.post('/migrate/reassign-topics', requireAuth, requireAdmin, async (req, res) => {
    console.log('[Admin] Reassigning topics...');
    const { targetUserId } = req.body;

    try {
        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId is required' });
        }

        // Reassign ALL topics to the target user
        const { error: topicsError, count: topicsCount } = await supabaseAdmin
            .from('topics')
            .update({ user_id: targetUserId });

        if (topicsError) {
            throw topicsError;
        }

        // Reassign ALL skills to the target user  
        const { error: skillsError, count: skillsCount } = await supabaseAdmin
            .from('skills')
            .update({ user_id: targetUserId });

        if (skillsError) {
            throw skillsError;
        }

        LoggingService.log('MIGRATION', req.user, 'SUCCESS', { migration: 'reassign_topics', targetUserId });
        res.json({
            success: true,
            message: `Reassigned all topics and skills to user ${targetUserId}`,
            topics_updated: topicsCount,
            skills_updated: skillsCount
        });

    } catch (err) {
        console.error('[Admin] Reassign Error:', err);
        LoggingService.log('MIGRATION', req.user, 'FAILURE', { migration: 'reassign_topics', error: err.message });
        res.status(500).json({ error: err.message });
    }
});

export default router;
