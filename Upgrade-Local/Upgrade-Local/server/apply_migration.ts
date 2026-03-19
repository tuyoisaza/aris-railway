
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("No DATABASE_URL or SUPABASE_DB_URL found in .env");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        const migrationPath = path.resolve(__dirname, 'migrations/002_super_admin_debug.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Running migration:", migrationPath);
        await client.query(sql);
        console.log("Migration applied successfully!");

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

run();
