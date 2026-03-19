import express from 'express';
import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';
import { authLimiter, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000'];

// POST /api/auth/reset-request
router.post('/reset-request', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: isProduction
                ? 'https://aris.app/update-password'
                : 'http://localhost:5173/update-password',
        });

        if (error) throw error;

        res.json({ success: true, message: 'Password reset link sent.' });
    } catch (err) {
        log('Auth', 'ERROR', 'Reset', err.message);
        // Do not leak existence of email
        res.json({ success: true, message: 'If this email exists, a link was sent.' });
    }
});

// POST /api/auth/signup
router.post('/signup', authLimiter, validate(schemas.signup), async (req, res) => {
    const { email, password, name } = req.body;
    log('Auth', 'INFO', 'Signup', `Attempt for: ${email}`);

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: { data: { name: name || 'User' } }
        });

        if (authError) {
            log('Auth', 'ERROR', 'Signup', `Supabase signUp error: ${authError.message}`);
            throw authError;
        }

        log('Auth', 'INFO', 'Signup', `Success for user: ${authData.user?.id}`);

        if (authData.user) {
            // 2. Create Public User Record
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: authData.user.email,
                    name: name || 'New User',
                    plan: 'free',
                    is_super_admin: false
                }]);

            if (profileError) {
                log('Auth', 'WARN', 'Signup', `Profile creation failed: ${profileError.message}`);
            }
        }

        res.json({ user: authData.user, session: authData.session });

    } catch (err) {
        log('Auth', 'ERROR', 'Signup', err.message);
        res.status(400).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
    const { email, password } = req.body;
    log('Auth', 'INFO', 'Login', `Attempt for: ${email}`);

    try {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        log('Auth', 'INFO', 'Login', `Success for user: ${data.user.id}`);

        // Fetch public user details
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('*, is_super_admin')
            .eq('id', data.user.id)
            .single();

        res.json({
            user: { ...data.user, ...userProfile },
            session: data.session
        });

    } catch (err) {
        log('Auth', 'ERROR', 'Login', err.message);
        res.status(401).json({ error: err.message });
    }
});

// GET /api/auth/google
router.get('/google', async (req, res) => {
    try {
        const redirectUrl = req.headers.origin || ALLOWED_ORIGINS[0];
        log('Auth', 'INFO', 'OAuth', `Google OAuth redirect URL: ${redirectUrl}`);

        const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });

        if (error) throw error;
        res.json({ url: data.url });
    } catch (err) {
        log('Auth', 'ERROR', 'OAuth', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
