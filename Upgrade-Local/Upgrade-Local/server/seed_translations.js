/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { translations } = require('./data_seed');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTranslations() {
    console.log('Seeding translations...');

    const rows = [];
    for (const [lang, keys] of Object.entries(translations)) {
        for (const [key, value] of Object.entries(keys)) {
            rows.push({ lang, key, value });
        }
    }

    console.log(`Prepared ${rows.length} translation entries.`);

    // Batch Upsert
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        // We assume a unique constraint on (lang, key) exists. 
        // If not, we might get duplicates. 
        // If the table doesn't exist, this will fail.
        const { error } = await supabase.from('translations').upsert(batch, { onConflict: 'lang, key' });

        if (error) {
            console.error('Error seeding batch:', error.message);
            // If table missing, stop.
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.error('CRITICAL: Table "translations" does not exist.');
                process.exit(1);
            }
        } else {
            successCount += batch.length;
        }
    }

    console.log(`Successfully seeded ${successCount} translations!`);
}

seedTranslations();
