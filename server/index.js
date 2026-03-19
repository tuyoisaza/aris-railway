import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { socketServer } from "./websocket/socketServer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root or server folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // Fallback to CWD .env

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

let appReady = false;

// ---- Health endpoint (Cloud Run) - responds immediately ----
app.get("/health", (_req, res) => {
    res.status(200).send("OK");
});

// ---- Startup Diagnostics ----
console.log("[Bootstrap] Environment Diagnostics:");
const envKeys = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_KEY"
];
envKeys.forEach(key => {
    const val = process.env[key];
    if (val) {
        const masked = val.length > 8 ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : "****";
        console.log(`  - ${key}: [SET] ${masked}`);
    } else {
        console.log(`  - ${key}: [MISSING]`);
    }
});
console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  - PORT: ${process.env.PORT}`);

// ---- Defer all other requests until app is ready ----
app.use((req, res, next) => {
    if (appReady) {
        next();
    } else {
        // App still loading, wait and retry
        const checkReady = setInterval(() => {
            if (appReady) {
                clearInterval(checkReady);
                next();
            }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
            clearInterval(checkReady);
            if (!appReady) {
                res.status(503).send("Application still initializing...");
            }
        }, 30000);
    }
});

// ---- Start listening IMMEDIATELY (Cloud Run requirement) ----
server.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Bootstrap] ARIS server listening on port ${PORT}`);
    
    // Initialize WebSocket server after HTTP server is ready
    socketServer.initialize(server);
    console.log("[Bootstrap] WebSocket server initialized");

    // ---- Load full app AFTER listen ----
    try {
        const { default: fullApp } = await import("./scripts/maintenance/index.js");

        // Mount the full app (API routes, static files, SPA fallback)
        app.use(fullApp);

        appReady = true;
        console.log("[Bootstrap] Full application loaded successfully");
    } catch (err) {
        console.error("[Bootstrap] Failed to load full application:", err);

        // Fallback: serve static files directly
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
