require('dotenv').config();
const { supabaseAdmin } = require('./db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const sqlPath = path.join(__dirname, 'migrations', 'migration_language.sql');
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration: migration_language.sql');

        // Try RPC first
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('RPC Migration failed:', error);
            console.log('Attempting direct query fallback (unlikely to work without pg-native)...');
        } else {
            console.log('Migration successful via RPC');
        }
    } catch (e) {
        console.error("Migration Validation Error", e);
    }
};

runMigration();
