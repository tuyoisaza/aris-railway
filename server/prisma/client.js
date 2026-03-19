import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('[DB] CRITICAL: Missing DATABASE_URL environment variable');
    console.error('[DB] Please set DATABASE_URL in your .env file');
    console.warn('[DB] Server will continue to run, but database features will fail.');
}

export const prisma = new PrismaClient({
    datasources: databaseUrl ? {
        db: {
            url: databaseUrl
        }
    } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export default prisma;

export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('[DB] Connected to SQLite database');
    } catch (error) {
        console.error('[DB] Failed to connect to database:', error);
        throw error;
    }
}

export async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        console.log('[DB] Disconnected from database');
    } catch (error) {
        console.error('[DB] Error disconnecting from database:', error);
    }
}

process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
});
