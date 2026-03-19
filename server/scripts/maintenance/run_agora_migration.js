/**
 * Run Agora Migration
 * ES Module compatible migration runner
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationFile = process.argv[2] || 'agora_schema.sql';
    const sqlPath = path.join(__dirname, 'migrations', migrationFile);

    if (!fs.existsSync(sqlPath)) {
        console.error(`❌ Migration file not found: ${sqlPath}`);
        process.exit(1);
    }

    console.log(`📋 Running migration: ${migrationFile}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
        .split(/;[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });

            if (error) {
                // Try raw query as fallback
                const { error: rawError } = await supabase.from('_').select().limit(0);
                if (rawError && rawError.message.includes('does not exist')) {
                    // Expected, table doesn't exist yet
                }
                console.log(`   ⚠️ [${i + 1}/${statements.length}] RPC failed, may need manual execution`);
                console.log(`      ${preview}`);
                errorCount++;
            } else {
                console.log(`   ✅ [${i + 1}/${statements.length}] ${preview}`);
                successCount++;
            }
        } catch (e) {
            console.log(`   ❌ [${i + 1}/${statements.length}] ${e.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Migration Complete: ${successCount} succeeded, ${errorCount} need manual review`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
        console.log('\n⚠️ Some statements failed. You may need to run the SQL directly in Supabase:');
        console.log('   1. Go to your Supabase Dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log(`   3. Paste contents of: ${sqlPath}`);
        console.log('   4. Click "Run"');
    }
}

runMigration().catch(console.error);
