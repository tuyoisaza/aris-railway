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
    log('Auth', 'WARN', 'OAuth', 'Google OAuth not configured - using local auth');
    res.status(501).json({ error: 'Google OAuth not configured' });
});

export default router;
