require('dotenv').config({ path: 'server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seedTopics() {
    console.log('Seeding Topics...');

    // Check if topics exist
    const { data: existing } = await supabase.from('topics').select('id, title').eq('title', 'Quantum Physics').single();

    if (existing) {
        console.log(`Topic "Quantum Physics" already exists: ${existing.id}`);
        return existing.id;
    }

    const { data, error } = await supabase.from('topics').insert([{
        title: 'Quantum Physics',
        category: 'Physics',
        description: 'The study of matter and energy at the most fundamental level.',
        depth: 1,
        max_depth: 7,
        engagement: 0,
        connections: 0
    }]).select().single();

    if (error) {
        console.error('Error seeding topic:', error);
        return null;
    }

    console.log(`Created topic: ${data.id}`);
    return data.id;
}

seedTopics();
