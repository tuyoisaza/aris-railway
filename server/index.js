import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { socketServer } from "./websocket/socketServer.js";
import { connectDatabase, disconnectDatabase } from "./prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

let appReady = false;

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

console.log("[Bootstrap] Environment Diagnostics:");
const envKeys = [
    "DATABASE_URL",
    "JWT_SECRET",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "VITE_STRIPE_PRICE_PLUS"
];
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

app.use((req, res, next) => {
    if (appReady) {
        next();
    } else {
        const checkReady = setInterval(() => {
            if (appReady) {
                clearInterval(checkReady);
                next();
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkReady);
            if (!appReady) {
                res.status(503).send("Application still initializing...");
            }
        }, 30000);
    }
});

server.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Bootstrap] ARIS server listening on port ${PORT}`);
    
    socketServer.initialize(server);
    console.log("[Bootstrap] WebSocket server initialized");

    try {
        await connectDatabase();
        console.log("[Bootstrap] Database connected");
        
        const { default: fullApp } = await import("./scripts/maintenance/index.js");
        app.use(fullApp);
        
        appReady = true;
        console.log("[Bootstrap] Full application loaded successfully");
    } catch (err) {
        console.error("[Bootstrap] Failed to load full application:", err);

        const publicPath = path.join(__dirname, "public");

        if (fs.existsSync(path.join(publicPath, "index.html"))) {
            app.use(express.static(publicPath));
            app.get("*", (_req, res) => {
                res.sendFile(path.join(publicPath, "index.html"));
            });
            console.log("[Bootstrap] Fallback: serving static files from", publicPath);
        } else {
            app.get("*", (_req, res) => {
                res.status(500).send(`Application error: ${err.message}`);
            });
        }

        appReady = true;
    }
});

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
