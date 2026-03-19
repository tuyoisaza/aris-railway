const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { tests } = require('./data_seed');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedQuestions() {
    console.log('Seeding questions...');

    // 1. Flatten Data
    const rows = [];
    let orderCounter = 1;

    for (const [axisId, questions] of Object.entries(tests)) {
        // Reset order for each axis? Or global? Usually per axis.
        let axisOrder = 1;
        for (const qObj of questions) {
            rows.push({
                axis_id: axisId,
                q: qObj.q,
                options: qObj.options, // array of objects
                sort_order: axisOrder++
            });
        }
    }

    console.log(`Prepared ${rows.length} question entries.`);

    // 2. Clear Table? (Optional - Safe for dev)
    const { error: deleteError } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Delete all. Supabase allows delete without where if enabled, or use neg id.
    // Better practice: delete by axis_id present in our map
    const axesToClear = Object.keys(tests);
    const { error: clearError } = await supabase.from('questions').delete().in('axis_id', axesToClear);

    if (clearError) {
        console.error('Error clearing old questions:', clearError.message);
    } else {
        console.log('Cleared existing questions for target axes.');
    }

    // 3. Insert
    const { error: insertError } = await supabase.from('questions').insert(rows);

    if (insertError) {
        console.error('Error seeding questions:', insertError.message);
    } else {
        console.log(`Successfully seeded ${rows.length} questions!`);
    }
}

seedQuestions();
