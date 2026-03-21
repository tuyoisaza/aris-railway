import express from 'express';
import { prisma } from '../db.js';
import { log } from '../utils/logger.js';
import { authLimiter, validate } from '../middleware.js';
import { schemas } from '../schemas.js';
import { hashPassword, verifyPassword, generateToken } from '../prisma/auth.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000'];

router.post('/reset-request', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    log('Auth', 'INFO', 'ResetRequest', `Password reset requested for: ${email}`);
    res.json({ success: true, message: 'Password reset functionality coming soon.' });
});

router.post('/signup', authLimiter, async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    log('Auth', 'INFO', 'Signup', `Attempt for: ${email}`);

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            log('Auth', 'WARN', 'Signup', `Email already exists: ${email}`);
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await hashPassword(password);
        
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || 'New User',
                plan: 'free',
                role: 'user'
            }
        });

        log('Auth', 'INFO', 'Signup', `Success for user: ${user.id}`);

        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan
            },
            session: {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            }
        });

    } catch (err) {
        log('Auth', 'ERROR', 'Signup', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    log('Auth', 'INFO', 'Login', `Attempt for: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.password) {
            log('Auth', 'WARN', 'Login', `User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await verifyPassword(password, user.password);
        
        if (!validPassword) {
            log('Auth', 'WARN', 'Login', `Invalid password for: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastSeen: new Date() }
        });

        log('Auth', 'INFO', 'Login', `Success for user: ${user.id}`);

        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan,
                avatar: user.avatar
            },
            session: {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            }
        });

    } catch (err) {
        log('Auth', 'ERROR', 'Login', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/google', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL}/api/auth/google/callback`;
    const frontendUrl = process.env.FRONTEND_URL || 'https://aris.tuyoisaza.com';

    if (!clientId) {
        log('Auth', 'WARN', 'OAuth', 'Google OAuth not configured - missing GOOGLE_CLIENT_ID');
        return res.status(501).json({ error: 'Google OAuth not configured' });
    }

    const scopes = encodeURIComponent('email profile');
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`;

    log('Auth', 'INFO', 'OAuth', 'Redirecting to Google OAuth');
    res.json({ url: authUrl });
});

router.get('/google/callback', async (req, res) => {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'https://aris.tuyoisaza.com';

    if (error) {
        log('Auth', 'WARN', 'OAuth', `Google OAuth error: ${error}`);
        return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        log('Auth', 'ERROR', 'OAuth', 'No authorization code received');
        return res.redirect(`${frontendUrl}?auth_error=no_code`);
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${frontendUrl}/api/auth/google/callback`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            log('Auth', 'ERROR', 'OAuth', 'Failed to get access token');
            return res.redirect(`${frontendUrl}?auth_error=token_failed`);
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const googleUser = await userRes.json();

        if (!googleUser.email) {
            log('Auth', 'ERROR', 'OAuth', 'Failed to get user info');
            return res.redirect(`${frontendUrl}?auth_error=user_info_failed`);
        }

        let user = await prisma.user.findUnique({
            where: { email: googleUser.email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name || googleUser.email.split('@')[0],
                    plan: 'free',
                    role: 'user'
                }
            });
            log('Auth', 'INFO', 'OAuth', `New user created via Google: ${user.email}`);
        } else {
            log('Auth', 'INFO', 'OAuth', `Google login success: ${user.email}`);
        }

        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        res.redirect(`${frontendUrl}?auth_token=${token}&auth_user=${encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
            avatar: user.avatar
        }))}`);

    } catch (err) {
        log('Auth', 'ERROR', 'OAuth', `Callback error: ${err.message}`);
        res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message)}`);
    }
});

export default router;
