const { supabase } = require('./server/db');

async function verifyPersistence() {
    console.log("=== STARTING PERSISTENCE AUDIT ===");

    // We'll use a test user ID. In a real scenario, we'd pick a real user or create a mock one.
    // For safety, let's just query limits to ensure tables are accessible and not erroring.

    try {
        // 1. Check Profiles
        console.log("\n[1] Checking Profiles...");
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
        if (pError) throw pError;
        console.log(`✅ Profiles Table Accessible. Count: ${profiles.length}`);

        // 2. Check User Tests
        console.log("\n[2] Checking User Tests...");
        const { data: tests, error: tError } = await supabase.from('user_tests').select('*').limit(1);
        if (tError) throw tError;
        console.log(`✅ User Tests Table Accessible. Count: ${tests.length}`);

        // 3. Check Journal Entries
        console.log("\n[3] Checking Journal Entries...");
        const { data: journal, error: jError } = await supabase.from('journal_entries').select('*').limit(1);
        if (jError) throw jError;
        console.log(`✅ Journal Entries Table Accessible. Count: ${journal.length}`);

        // 4. Check Subscriptions
        console.log("\n[4] Checking Subscriptions...");
        const { data: subs, error: sError } = await supabase.from('subscriptions').select('*').limit(1);
        if (sError) throw sError;
        console.log(`✅ Subscriptions Table Accessible. Count: ${subs.length}`);

        console.log("\n=== AUDIT COMPLETE: ALL TABLES ACCESSIBLE ===");

    } catch (e) {
        console.error("❌ AUDIT FAILED:", e.message);
    }
}

verifyPersistence();
