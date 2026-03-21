import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app', '.railway.app', 'aris.tuyoisaza.com']
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.some(o => origin.includes(o))) {
            callback(null, true);
        } else if (!isProduction) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

const API_BASE = '/api';

app.post(`${API_BASE}/auth/login`, async (req, res) => {
    const { email, password } = req.body;
    try {
        const { prisma } = await import('../../prisma/client.js');
        const { verifyPassword, generateToken } = await import('../../prisma/auth.js');
        
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const valid = await verifyPassword(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken({ userId: user.id, email: user.email });
        
        res.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            session: { access_token: token }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post(`${API_BASE}/auth/signup`, async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const { prisma } = await import('../../prisma/client.js');
        const { hashPassword, generateToken } = await import('../../prisma/auth.js');
        
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const hashed = await hashPassword(password);
        const user = await prisma.user.create({
            data: { email, password: hashed, name: name || 'New User' }
        });
        
        const token = generateToken({ userId: user.id, email: user.email });
        
        res.json({
            user: { id: user.id, email: user.email, name: user.name },
            session: { access_token: token }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.get(`${API_BASE}/health`, (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.get(`${API_BASE}/auth/google`, async (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({ error: 'Google OAuth not configured' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    oauthUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'openid email profile');
    oauthUrl.searchParams.set('state', state);
    oauthUrl.searchParams.set('access_type', 'online');
    oauthUrl.searchParams.set('prompt', 'select_account');

    res.json({ url: oauthUrl.toString() });
});

app.get(`${API_BASE}/auth/google/callback`, async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        console.error('[Auth] Google OAuth error:', error);
        return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}?auth_error=no_code`);
    }

    try {
        const { prisma } = await import('../../prisma/client.js');
        const { generateToken } = await import('../../prisma/auth.js');

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: GOOGLE_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            return res.redirect(`${FRONTEND_URL}?auth_error=token_error`);
        }

        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const userInfo = await userInfoResponse.json();

        if (!userInfo.email) {
            return res.redirect(`${FRONTEND_URL}?auth_error=no_email`);
        }

        let user = await prisma.user.findUnique({
            where: { email: userInfo.email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userInfo.email,
                    name: userInfo.name || userInfo.email.split('@')[0],
                    avatar: userInfo.picture || null,
                    plan: 'free',
                    role: 'user'
                }
            });
            console.log('[Auth] Created new user via Google:', user.email);
        }

        const token = generateToken({ userId: user.id, email: user.email });

        console.log('[Auth] Google login success:', user.email);

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
        };
        const redirectUrl = FRONTEND_URL + '?auth_token=' + token + '&auth_user=' + encodeURIComponent(JSON.stringify(userData));
        res.redirect(redirectUrl);

    } catch (err) {
        console.error('[Auth] Google OAuth error:', err.message);
        res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(err.message)}`);
    }
});

app.use(express.static(path.join(__dirname, '../../public')));

app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../../public/index.html');
    res.sendFile(indexPath);
});

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
};

app.use(errorHandler);

export default app;
