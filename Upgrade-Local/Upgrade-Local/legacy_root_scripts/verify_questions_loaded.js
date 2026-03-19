const { supabase } = require('./server/db');

async function verify() {
    console.log('Verifying Questions...');
    const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting questions:', error);
    } else {
        console.log(`Total Questions in DB: ${count}`);
    }

    const { data: questions } = await supabase
        .from('questions')
        .select('q, options')
        .limit(3);

    console.log('Sample Questions:', JSON.stringify(questions, null, 2));
}

verify();
