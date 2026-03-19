import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { log } from '../../utils/logger.js';
import { apiLimiter, errorHandler } from './middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================
// CONFIGURATION
// ============================================================
const isProduction = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : (
    isProduction
      ? ['https://aris.app', 'https://www.aris.app']
      : ['http://localhost:3000']
  );

log('API', 'INFO', 'Config', `Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  log('API', 'INFO', 'Request', `${req.method} ${req.url}`);
  next();
});

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ============================================================
// ROUTES
// ============================================================
import adminRoutes from '../../routes/admin.js';
import authRoutes from '../../routes/auth.js';
import usersRoutes from '../../routes/users.js';
import familiesRoutes from '../../routes/families.js';
import settingsRoutes from '../../routes/settings.js';
import invitesRoutes from '../../routes/invites.js';
import chatRoutes from '../../routes/chat.js';
import foldersRoutes from '../../routes/folders.js';
import projectsRoutes from '../../routes/projects.js';
import resourcesRoutes from '../../routes/resources.js';
import topicsRoutes from '../../routes/topics.js';
import skillsRoutes from '../../routes/skills.js';
import billingRoutes from '../../routes/billing.js';
import agoraRoutes from '../../routes/agora.js';
import collaborationRoutes from '../../routes/collaboration.js';

// API ROUTES
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', usersRoutes);
app.use('/api/family', familiesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', invitesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api', billingRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/collaboration', collaborationRoutes);

// ============================================================
// HEALTH CHECKS (important for Cloud Run)
// ============================================================
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ============================================================
// STATIC FILES & SPA FALLBACK
// ============================================================
// Docker structure: /app/server/scripts/maintenance/index.js
// Frontend at: /app/server/public (../../public from here)
import fs from 'fs';

const staticPath = path.join(__dirname, '../../public');

// Verify frontend files exist
if (fs.existsSync(path.join(staticPath, 'index.html'))) {
  log('API', 'INFO', 'Static', `Serving frontend from: ${staticPath}`);
} else {
  log('API', 'WARN', 'Static', `Frontend not found at: ${staticPath}`);
}

// Mount static files but don't interfere with API routes
app.use('/assets', express.static(staticPath + '/assets'));
// SPA fallback - only for non-API routes
app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found. Check deployment.');
  }
});

// Static files - Mount AFTER fallback to avoid interfering with API routes
app.use(express.static(staticPath));

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(errorHandler);

// ============================================================
// EXPORT ONLY — DO NOT START SERVER HERE
// ============================================================
export default app;
