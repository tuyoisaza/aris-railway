const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function comprehensiveInspection() {
    console.log('🔍 COMPREHENSIVE DATABASE INSPECTION\\n');
    console.log('=' .repeat(80));
    console.log('\\n📊 TABLES & ROW COUNTS\\n');

    const tables = [
        'profiles',
        'axes',
        'categories',
        'courses',
        'questions',
        'user_tests',
        'journal_entries',
        'subscriptions',
        'webhook_events',
        'mentors',
        'translations'
    ];

    const results = {};

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                results[table] = { status: '❌ ERROR', count: 0, error: error.message };
            } else {
                results[table] = { status: '✅ EXISTS', count: count || 0 };
            }
        } catch (e) {
            results[table] = { status: '🔴 FAILED', count: 0, error: e.message };
        }
    }

    // Display results
    for (const [table, result] of Object.entries(results)) {
        const countStr = result.count > 0 ? `${result.count} rows` : 'EMPTY';
        const statusIcon = result.count > 0 ? '✅' : '⚠️';
        console.log(`${statusIcon} ${table.padEnd(20)} : ${countStr.padEnd(15)} [${result.status}]`);
    }

    console.log('\\n' + '='.repeat(80));
    console.log('\\n🔐 RLS POLICY CHECK\\n');

    // Check RLS is enabled (by trying to access without service role)
    const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('Testing RLS on profiles (should be restricted):');
    const { data: profilesAnon, error: profilesError } = await anonClient
        .from('profiles')
        .select('*')
        .limit(1);
    
    if (profilesError || !profilesAnon || profilesAnon.length === 0) {
        console.log('  ✅ RLS ENABLED - Anonymous access correctly restricted');
    } else {
        console.log('  🔴 RLS ISSUE - Anonymous can read profiles!');
    }

    console.log('\\nTesting public access on courses (should be allowed):');
    const { data: coursesAnon, error: coursesError } = await anonClient
        .from('courses')
        .select('*')
        .limit(1);
    
    if (coursesAnon && coursesAnon.length > 0) {
        console.log('  ✅ PUBLIC READ - Courses accessible anonymously (correct)');
    } else {
        console.log('  ⚠️ PUBLIC READ - Courses may be restricted (check if intentional)');
    }

    console.log('\\n' + '='.repeat(80));
    console.log('\\n📈 CRITICAL DATA PRESENCE\\n');

    // Check critical data
    const criticalChecks = [
        { table: 'axes', expected: 3, name: 'Curriculum Axes' },
        { table: 'mentors', expected: 4, name: 'Mentors' },
        { table: 'questions', expected: 10, name: 'Diagnostic Questions' },
        { table: 'translations', expected: 100, name: 'Translation Keys (minimum)' }
    ];

    for (const check of criticalChecks) {
        const count = results[check.table]?.count || 0;
        if (count >= check.expected) {
            console.log(`✅ ${check.name}: ${count} (expected ${check.expected}+)`);
        } else if (count > 0) {
            console.log(`⚠️  ${check.name}: ${count} (expected ${check.expected}+) - INCOMPLETE`);
        } else {
            console.log(`🔴 ${check.name}: ${count} (expected ${check.expected}+) - MISSING`);
        }
    }

    console.log('\\n' + '='.repeat(80));
    console.log('\\n✅ Inspection Complete\\n');

    process.exit(0);
}

comprehensiveInspection().catch(e => {
    console.error('\\n💥 INSPECTION FAILED:', e.message);
    process.exit(1);
});
