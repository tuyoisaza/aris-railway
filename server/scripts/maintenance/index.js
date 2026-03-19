import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app', '.railway.app']
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
        const { prisma } = await import('./prisma/client.js');
        const { verifyPassword, generateToken } = await import('./prisma/auth.js');
        
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
        const { prisma } = await import('./prisma/client.js');
        const { hashPassword, generateToken } = await import('./prisma/auth.js');
        
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
