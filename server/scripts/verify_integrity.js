require('dotenv').config();
const { supabaseAdmin } = require('../db');

const REQUIRED_TABLES = [
    'users',
    'families',
    'family_members',
    'invitations',
    'topics',
    'resources',
    'user_topic_progress',
    'projects',
    'project_artifacts',
    'project_reflections',
    'project_comments',
    'conversations',
    'messages'
];

async function verifyIntegrity() {
    console.log('[Integrity] Starting Infrastructure Health Check...');
    let healthData = [];
    let useBasicMode = false;

    // 1. Try RPC Inspection
    try {
        const { data, error } = await supabaseAdmin.rpc('inspect_health');
        if (error) throw error;
        healthData = data;
        console.log('[Integrity] RPC Access: SUCCESS. Deep inspection enabled.');
    } catch (err) {
        console.warn('[Integrity] RPC Access: FAILED. Falling back to basic table checks.');
        // console.error(err);
        useBasicMode = true;
    }

    // 2. Analyze Results
    let missingTables = [];
    let insecureTables = [];

    if (useBasicMode) {
        console.log('[Integrity] Running Basic Existence Checks...');
        for (const table of REQUIRED_TABLES) {
            // Try to select 1 record (service role bypasses RLS, so should work if table exists)
            const { error } = await supabaseAdmin.from(table).select('id').limit(1);
            if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
                missingTables.push(table);
                console.error(`[Integrity] X Missing: ${table}`);
            } else if (error) {
                // Other error (e.g. column missing), still implies issue, but table likely exists
                console.warn(`[Integrity] ? Warning ${table}: ${error.message}`);
            } else {
                console.log(`[Integrity] ✓ Verified: ${table}`);
            }
        }
    } else {
        // Advanced Mode
        const dbTables = healthData.reduce((acc, t) => {
            acc[t.table_name] = t;
            return acc;
        }, {});

        for (const table of REQUIRED_TABLES) {
            const info = dbTables[table];
            if (!info) {
                missingTables.push(table);
                console.error(`[Integrity] X Missing: ${table}`);
            } else {
                console.log(`[Integrity] ✓ Found: ${table}`);
                if (!info.rls_enabled) {
                    insecureTables.push(table);
                    console.error(`[Integrity] ! Insecure (No RLS): ${table}`);
                }
            }
        }
    }

    // 3. Report
    console.log('\n----------------------------------------');
    console.log('HEALTH CHECK REPORT');
    console.log('----------------------------------------');

    if (missingTables.length === 0 && insecureTables.length === 0) {
        console.log('STATUS: [OPERATIONAL]');
        console.log('All core tables verified.');
        if (!useBasicMode) console.log('RLS Policies active on all tables.');
    } else {
        console.log('STATUS: [DEGRADED]');
        if (missingTables.length > 0) console.log('MISSING TABLES:', missingTables.join(', '));
        if (insecureTables.length > 0) console.log('INSECURE TABLES:', insecureTables.join(', '));
        process.exit(1);
    }
}

verifyIntegrity();
