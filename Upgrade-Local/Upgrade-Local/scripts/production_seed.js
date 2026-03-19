const { createClient } = require('@supabase/supabase-js');
const { mentorsData, translations, pensum, levelingTest } = require('../server/data_seed.js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 PRODUCTION DATABASE SEEDING');
console.log('================================\n');

async function seedProduction() {
    let successCount = 0;
    let errorCount = 0;

    // STEP 1: Seed Translations
    console.log('[1/6] Seeding Translations...');
    try {
        const translationRows = [];
        for (const [lang, keys] of Object.entries(translations)) {
            for (const [key, value] of Object.entries(keys)) {
                translationRows.push({ lang, key, value });
            }
        }

        console.log(`   Found ${translationRows.length} translation keys`);

        const { error } = await supabase
            .from('translations')
            .upsert(translationRows, { onConflict: 'lang,key', ignoreDuplicates: false });

        if (error) throw error;
        console.log(`   ✅ ${translationRows.length} translations seeded\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Translation seeding failed:`, error.message);
        errorCount++;
    }

    // STEP 2: Seed Mentors
    console.log('[2/6] Seeding Mentors...');
    try {
        // Schema has: name, role, description, image_url
        const mentorsFormatted = mentorsData.map(m => ({
            name: m.name,
            role: m.roleKey, // Store key for now
            description: m.descKey, // Store key for now
            image_url: m.img
        }));

        const { error } = await supabase
            .from('mentors')
            .upsert(mentorsFormatted, { onConflict: 'name', ignoreDuplicates: false });

        if (error) throw error;
        console.log(`   ✅ ${mentorsFormatted.length} mentors seeded\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Mentor seeding failed:`, error.message);
        errorCount++;
    }

    // STEP 3: Seed Axes
    console.log('[3/6] Seeding Axes...');
    try {
        const axesData = Object.entries(pensum).map(([key, axis], index) => ({
            id: axis.id,
            title_key: axis.title_key,
            desc_key: axis.desc_key,
            sort_order: index + 1
        }));

        const { error } = await supabase
            .from('axes')
            .upsert(axesData, { onConflict: 'id', ignoreDuplicates: false });

        if (error) throw error;
        console.log(`   ✅ ${axesData.length} axes seeded\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Axes seeding failed:`, error.message);
        errorCount++;
    }

    // STEP 4: Seed Categories (first delete old ones with string IDs, then insert)
    console.log('[4/6] Seeding Categories...');
    try {
        // Delete existing categories since we can't use text IDs
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const categoriesData = [];
        Object.values(pensum).forEach(axis => {
            axis.categories.forEach((cat, index) => {
                categoriesData.push({
                    // Don't specify id, let database generate UUID
                    axis_id: axis.id,
                    title: cat.title,
                    sort_order: index + 1
                });
            });
        });

        const { data, error } = await supabase
            .from('categories')
            .insert(categoriesData)
            .select();

        if (error) throw error;
        console.log(`   ✅ ${categoriesData.length} categories seeded\n`);

        // Save category mapping: old ID -> new UUID
        global.categoryMapping = {};
        let catIndex = 0;
        Object.values(pensum).forEach(axis => {
            axis.categories.forEach(cat => {
                global.categoryMapping[cat.id] = data[catIndex].id;
                catIndex++;
            });
        });

        successCount++;
    } catch (error) {
        console.error(`   ❌ Category seeding failed:`, error.message);
        errorCount++;
    }

    // STEP 5: Seed Courses
    console.log('[5/6] Seeding Courses...');
    try {
        // Delete existing courses first
        await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const coursesData = [];
        Object.values(pensum).forEach(axis => {
            axis.categories.forEach(cat => {
                cat.courses.forEach((course, index) => {
                    coursesData.push({
                        category_id: global.categoryMapping[cat.id],
                        title: course.title,
                        description: course.desc, // 'desc' field maps to 'description' column
                        duration: course.duration,
                        syllabus: course.syllabus, // Already an object array
                        sort_order: index + 1
                    });
                });
            });
        });

        const { error } = await supabase
            .from('courses')
            .insert(coursesData);

        if (error) throw error;
        console.log(`   ✅ ${coursesData.length} courses seeded\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Course seeding failed:`, error.message);
        errorCount++;
    }

    // STEP 6: Seed Leveling Test Questions
    console.log('[6/6] Seeding Leveling Test Questions...');
    try {
        // Delete existing questions first
        await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Schema has: axis_id, q, options (JSONB), sort_order
        const questionsData = levelingTest.map((question, index) => ({
            axis_id: null, // Leveling test applies to all axes
            q: question.q,
            options: question.options, // Already an array of objects
            sort_order: index + 1
        }));

        const { error } = await supabase
            .from('questions')
            .insert(questionsData);

        if (error) throw error;
        console.log(`   ✅ ${questionsData.length} questions seeded\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Question seeding failed:`, error.message);
        errorCount++;
    }

    // SUMMARY
    console.log('================================');
    console.log('📊 SEEDING SUMMARY');
    console.log(`   Successful: ${successCount}/6`);
    console.log(`   Failed: ${errorCount}/6`);

    if (errorCount === 0) {
        console.log('\n✅ PRODUCTION SEED COMPLETE\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  SEEDING COMPLETED WITH ERRORS\n');
        process.exit(1);
    }
}

seedProduction().catch(e => {
    console.error('\n💥 FATAL ERROR:', e.message);
    console.error(e);
    process.exit(1);
});
