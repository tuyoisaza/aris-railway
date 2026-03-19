
const { createClient } = require('@supabase/supabase-js');
const { pensum } = require('./data_seed');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    const axesData = [
        { id: 'human', title_key: 'axis_human', desc_key: 'axis_human_desc', sort_order: 1 },
        { id: 'leadership', title_key: 'axis_leadership', desc_key: 'axis_leadership_desc', sort_order: 2 },
        { id: 'cocreation', title_key: 'axis_cocreation', desc_key: 'axis_cocreation_desc', sort_order: 3 }
    ];

    console.log('Seeding Axes...');
    const { error: axesError } = await supabase.from('axes').upsert(axesData);
    if (axesError) {
        console.error('Error seeding axes:', axesError);
        return;
    }

    let allCategories = [];
    let sortOrder = 1;

    // Extract categories
    for (const axisKey in pensum) {
        const axis = pensum[axisKey];
        if (axis.categories) {
            axis.categories.forEach((cat, index) => {
                allCategories.push({
                    id: cat.id,
                    axis_id: axis.id,
                    title: cat.title,
                    sort_order: index + 1
                });
            });
        }
    }

    console.log(`Seeding ${allCategories.length} Categories...`);
    const { error: catError } = await supabase.from('categories').upsert(allCategories);
    if (catError) {
        console.error('Error seeding categories:', catError);
    } else {
        console.log('Categories seeded successfully!');
    }
}

seed();
