import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { verifyToken } from "./prisma/auth.js";
import { socketServer } from "./websocket/socketServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app', '.railway.app', 'aris.tuyoisaza.com']
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

console.log("[Bootstrap] Environment Diagnostics:");
const envKeys = ["DATABASE_URL", "JWT_SECRET", "OPENAI_API_KEY", "STRIPE_SECRET_KEY", "VITE_STRIPE_PRICE_PLUS"];
envKeys.forEach(key => {
    const val = process.env[key];
    if (val) {
        if (key === "DATABASE_URL") {
            console.log(`  - ${key}: [SET] file:***/aris.db`);
        } else if (key.includes("KEY") || key.includes("SECRET")) {
            const masked = val.length > 8 ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : "****";
            console.log(`  - ${key}: [SET] ${masked}`);
        } else {
            console.log(`  - ${key}: [SET]`);
        }
    } else {
        console.log(`  - ${key}: [MISSING]`);
    }
});
console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  - PORT: ${process.env.PORT}`);

async function loadRoutes() {
    const { default: authRoutes } = await import('./routes/auth.js');
    const { default: chatRoutes } = await import('./routes/chat.js');
    const { default: topicsRoutes } = await import('./routes/topics.js');
    const { default: skillsRoutes } = await import('./routes/skills.js');
    const { default: projectsRoutes } = await import('./routes/projects.js');
    const { default: familiesRoutes } = await import('./routes/families.js');
    const { default: invitesRoutes } = await import('./routes/invites.js');
    const { default: adminRoutes } = await import('./routes/admin.js');
    const { default: settingsRoutes } = await import('./routes/settings.js');
    const { default: resourcesRoutes } = await import('./routes/resources.js');
    const { default: foldersRoutes } = await import('./routes/folders.js');
    const { default: collaborationRoutes } = await import('./routes/collaboration.js');
    const { default: agoraRoutes } = await import('./routes/agora.js');
    const { default: usersRoutes } = await import('./routes/users.js');
    const { default: billingRoutes } = await import('./routes/billing.js');

    app.use('/api/auth', authRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/topics', topicsRoutes);
    app.use('/api/skills', skillsRoutes);
    app.use('/api/projects', projectsRoutes);
    app.use('/api/families', familiesRoutes);
    app.use('/api/invites', invitesRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/resources', resourcesRoutes);
    app.use('/api/folders', foldersRoutes);
    app.use('/api/collaboration', collaborationRoutes);
    app.use('/api/agora', agoraRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/billing', billingRoutes);

    console.log('[Bootstrap] All routes loaded');
}

async function startServer() {
    try {
        await connectDatabase();
        console.log("[Bootstrap] Database connected");
        
        await loadRoutes();
        app.use(express.static(path.join(__dirname, "public")));
        
        app.get("/VERSION.txt", (_req, res) => {
            const versionPath = path.join(__dirname, "../VERSION");
            res.sendFile(versionPath);
        });
        
        app.get("/version", (_req, res) => {
            const versionPath = path.join(__dirname, "../VERSION");
            res.sendFile(versionPath);
        });
        
        app.get("*", (_req, res) => {
            const indexPath = path.join(__dirname, "public/index.html");
            res.sendFile(indexPath);
        });
        
        console.log("[Bootstrap] Full application loaded successfully");
        
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`[Bootstrap] ARIS server listening on port ${PORT}`);
            
            socketServer.initialize(server);
            console.log('[Bootstrap] WebSocket server initialized');
        });
    } catch (err) {
        console.error("[Bootstrap] Failed to load application:", err);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    console.log('[Bootstrap] Shutting down...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Bootstrap] Shutting down...');
    await disconnectDatabase();
    process.exit(0);
});
