import express from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { log } from '../utils/logger.js';
import { generateToken } from '../prisma/auth.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get('/google', (req, res) => {
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

router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        log('Auth', 'ERROR', 'GoogleOAuth', `OAuth error: ${error}`);
        return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}?auth_error=no_code`);
    }

    try {
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
            log('Auth', 'ERROR', 'GoogleOAuth', 'No access token received');
            return res.redirect(`${FRONTEND_URL}?auth_error=token_error`);
        }

        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const userInfo = await userInfoResponse.json();

        if (!userInfo.email) {
            log('Auth', 'ERROR', 'GoogleOAuth', 'No email in user info');
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
            log('Auth', 'INFO', 'GoogleOAuth', `Created new user: ${user.email}`);
        }

        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        log('Auth', 'INFO', 'GoogleOAuth', `User logged in: ${user.email}`);

        res.redirect(`${FRONTEND_URL}?auth_token=${token}&auth_user=${encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
        })}`);

    } catch (err) {
        log('Auth', 'ERROR', 'GoogleOAuth', err.message);
        res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(err.message)}`);
    }
});

export default router;
