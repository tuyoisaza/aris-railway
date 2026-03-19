import { supabaseAdmin as supabase } from '../db.js';

async function seedActivity() {
    console.log('Seeding activity logs...');

    // 1. Get a user (Parent/Admin usually)
    const { data: users } = await supabase.from('users').select('id, email').limit(1);
    if (!users || users.length === 0) {
        console.error('No users found to seed.');
        return;
    }
    const userId = users[0].id;
    console.log(`Seeding for user: ${userId} (${users[0].email})`);

    // 2. Insert dummy logs
    const logs = [];
    for (let i = 0; i < 15; i++) {
        logs.push({
            user_id: userId,
            activity_type: 'skill_practice',
            details: { skill: 'Pottery', duration: 30 },
            created_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString() // Spread over 15 days
        });
    }

    const { error } = await supabase.from('activity_logs').insert(logs);

    if (error) {
        console.error('Seeding failed:', error);
    } else {
        console.log('Seeding successful: Added 15 logs.');
    }
    process.exit(0);
}

seedActivity();
