
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

async function seedCourses() {
    console.log('Starting Course Seed...');

    let allCourses = [];

    for (const axisKey in pensum) {
        const axis = pensum[axisKey];
        if (axis.categories) {
            axis.categories.forEach(cat => {
                if (cat.courses) {
                    cat.courses.forEach((course, index) => {
                        allCourses.push({
                            id: course.id,
                            category_id: cat.id,
                            title: course.title,
                            description: course.desc,
                            duration: course.duration,
                            syllabus: course.syllabus, // JSONB
                            sort_order: index + 1,
                            status: 'published',
                            origin_topic: 'Seed Data'
                        });
                    });
                }
            });
        }
    }

    console.log(`Found ${allCourses.length} courses to seed.`);

    // Upsert in batches of 50 just in case
    const batchSize = 50;
    for (let i = 0; i < allCourses.length; i += batchSize) {
        const batch = allCourses.slice(i, i + batchSize);
        const { error } = await supabase.from('courses').upsert(batch);
        if (error) {
            console.error('Error seeding batch:', error);
        } else {
            console.log(`Seeded batch ${i / batchSize + 1}`);
        }
    }

    console.log('Course seeding complete!');
}

seedCourses();
