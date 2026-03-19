const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { mentorsData } = require('./data_seed');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMentors() {
    console.log('Seeding mentors...');

    // 1. Prepare Data
    // mentorsData has: { id, name, roleKey, descKey, img }
    // DB schema expects: { id (uuid or text?), name, specialty (role), bio (desc), image_url }
    // Let's create UUIDs if the table uses UUID PK, or usage strict IDs. 
    // Looking at `api.js` (lines 394), the insert uses { name, specialty, bio, image_url }.
    // Let's assume ID is auto-gen or we can omit it if not strict. 
    // However, `data_seed.js` has IDs like "tuyo", "juan".
    // If table uses UUIDs, we should let it autogen or provide valid UUIDs.
    // If table uses text IDs, we can use "tuyo".
    // Let's check schema.sql? Inspecting `api.js` line 416 `delete().eq('id', id)` implies id usage.

    // Simplest approach: Map the data to the columns we saw in `api.js` POST /admin/mentors
    const rows = mentorsData.map(m => ({
        // We probably shouldn't force ID unless we know the schema type. Safe to let DB gen it if UUID. 
        // But if we want idempotency, we might checking by name.
        name: m.name,
        role: m.roleKey,
        description: m.descKey,
        image_url: m.img
    }));

    console.log(`Prepared ${rows.length} mentor entries.`);

    // 2. Clear Table (Optional)
    const { error: deleteError } = await supabase.from('mentors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
        console.error('Error clearing old mentors:', deleteError.message);
    } else {
        console.log('Cleared existing mentors.');
    }

    // 3. Insert
    const { error: insertError } = await supabase.from('mentors').insert(rows);

    if (insertError) {
        console.error('Error seeding mentors:', insertError.message);
    } else {
        console.log(`Successfully seeded ${rows.length} mentors!`);
    }
}

seedMentors();
