/// <reference path="./types/express.d.ts" />
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import logger from './logger';
import { supabase } from './db';

// Import local modules (types needed eventually)
// Using imports, but casting to any for now to avoid compilation errors if not converted
// Ideally, these should be fully typed.
import requestLogger from './middleware/requestLogger';
import webhookRouter from './routes/webhooks';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 8080;

logger.info('Starting Upgrade Platform server', { port: PORT, env: process.env.NODE_ENV || 'development' });

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net" // Supabase library
            ],
            scriptSrcElem: [
                "'self'",
                "https://cdn.jsdelivr.net", // Supabase library
                "https://js.stripe.com" // Stripe.js (for future use)
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://upload.wikimedia.org", // Google logo
                "https://*.supabase.co", // Supabase avatars
                "https://lh3.googleusercontent.com" // Google profile pictures
            ],
            connectSrc: [
                "'self'",
                "https://*.supabase.co", // Supabase API
                "https://sqsulxcdpgrlwisdogoo.supabase.co", // Specific Supabase project
                "https://cdn.jsdelivr.net" // CDN for script module loading
            ],
            styleSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "'unsafe-inline'"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            frameSrc: [
                "https://js.stripe.com" // Stripe Checkout iframe
            ],
            scriptSrcAttr: [
                "'unsafe-inline'" // Required for one onclick handler in index.html
            ]
        }
    }
}));

// CORS - Restrict to known origins
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://upgrade-os.com'])
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000, // Limit each IP to 5000 requests per windowMs
    message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10, // Limit each IP to 10 requests per minute
    message: { error: 'Too many attempts, please try again later.', code: 'RATE_LIMIT_EXCEEDED_STRICT' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply strict limit to sensitive routes
app.use('/api/invites', strictLimiter);

app.use('/api', limiter);

// Request logging
app.use(requestLogger as any);

// --- STRIPE WEBHOOK (Must be before express.json()) ---
// Mount webhook router with RAW body parser specifically
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter as any);

app.use(express.json());

// Serve static files from the React client build
const staticPath = path.join(__dirname, '../../client/dist');

app.use(express.static(staticPath));

app.use('/api', apiRoutes as any);

// Health Check with database connectivity test
app.get('/health', async (req: Request, res: Response) => {
    try {
        // Test database connection
        const { error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            (logger as any).logError('Health check DB query failed', error);
            return res.status(503).json({
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message
            });
        }

        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        (logger as any).logError('Health check failed', error);
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

// Fallback for SPA routing - send index.html for unknown routes if not an API call
app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
    logger.info(`Server successfully started`, { port: PORT });
});
