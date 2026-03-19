const { supabase } = require('./server/db');

async function verifyAll() {
    console.log('🔍 Verifying Full Database Seed...');

    const tables = ['mentors', 'translations', 'axes', 'categories', 'courses', 'questions'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Error verifying ${table}:`, error.message);
        } else {
            console.log(`✅ ${table}: ${count} rows`);
        }
    }

    // Spot check a Mentor to see if 'role' and 'description' are correct
    const { data: mentor } = await supabase.from('mentors').select('*').limit(1).single();
    if (mentor) {
        console.log('Sample Mentor:', { id: mentor.id, role: mentor.role, desc_preview: mentor.description?.substring(0, 20) + '...' });
    }
}

verifyAll();
