const { supabase } = require('../server/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    console.log('🚧 Attempting to apply migration via RPC (if configured)...');

    // SQL to add columns safely
    const sql = `
    DO $$ 
    BEGIN 
        BEGIN
            ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'published';
        EXCEPTION
            WHEN duplicate_column THEN null;
        END;
        BEGIN
            ALTER TABLE public.courses ADD COLUMN origin_topic TEXT;
        EXCEPTION
            WHEN duplicate_column THEN null;
        END;
        BEGIN
            ALTER TABLE public.courses ADD COLUMN ai_metadata JSONB;
        EXCEPTION
            WHEN duplicate_column THEN null;
        END;
    END $$;
    `;

    try {
        // Try to call a generic 'exec_sql' RPC function if it exists (common pattern)
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('RPC Failed:', error);
            console.log('⚠️  Cannot run DDL via client. Please execute the following SQL in your Supabase Dashboard SQL Editor:');
            console.log('\n' + sql + '\n');
        } else {
            console.log('✅ Migration applied successfully via RPC!');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

applyMigration();
