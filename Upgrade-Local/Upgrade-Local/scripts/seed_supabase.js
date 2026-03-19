const { supabase } = require('../server/db');
const { mentorsData, translations, pensum, levelingTest } = require('../server/data_seed');

async function seed() {
    console.log('🌱 Starting Supabase Seed...');

    // 1. Mentors
    console.log('Writing Mentors...');
    for (const m of mentorsData) {
        const { error } = await supabase.from('mentors').upsert({
            id: m.id,
            name: m.name,
            role: m.roleKey,        // Fixed column name
            description: m.descKey, // Fixed column name
            image_url: m.img
        });
        if (error) console.error(`Error on mentor ${m.id}:`, error.message);
    }

    // 2. Translations
    console.log('Writing Translations...');
    for (const [lang, keys] of Object.entries(translations)) {
        const payload = Object.entries(keys).map(([k, v]) => ({
            lang,
            key: k,
            value: v
        }));
        // Insert in chunks if needed, but here list is small
        const { error } = await supabase.from('translations').upsert(payload, { onConflict: 'lang,key' });
        if (error) console.error(`Error on translations ${lang}:`, error.message);
    }

    // 3. Pensum (Axes, Categories, Courses)
    console.log('Writing Pensum...');
    for (const axis of Object.values(pensum)) {
        // Axis
        const { error: axisErr } = await supabase.from('axes').upsert({
            id: axis.id,
            title_key: axis.title_key,
            desc_key: axis.desc_key
        });
        if (axisErr) console.error(`Error axis ${axis.id}:`, axisErr.message);

        // Categories
        for (const cat of axis.categories) {
            const { error: catErr } = await supabase.from('categories').upsert({
                id: cat.id,
                axis_id: axis.id,
                title: cat.title
            });
            if (catErr) console.error(`Error category ${cat.id}:`, catErr.message);

            // Courses
            const coursesPayload = cat.courses.map(c => ({
                id: c.id,
                category_id: cat.id,
                title: c.title,
                duration: c.duration,
                description: c.desc,
                syllabus: c.syllabus
            }));
            const { error: courseErr } = await supabase.from('courses').upsert(coursesPayload);
            if (courseErr) console.error(`Error courses for ${cat.id}:`, courseErr.message);
        }
    }

    // 4. Questions
    console.log('Writing Questions...');
    if (levelingTest && levelingTest.length > 0) {
        const axes = ['human', 'leadership', 'cocreation'];

        for (const axis of axes) {
            console.log(`Writing questions for axis: ${axis}...`);
            let i = 0;
            for (const qData of levelingTest) {
                i++;
                // Check if exists by text AND axis to avoid duplicates
                const { data: existing } = await supabase
                    .from('questions')
                    .select('id')
                    .eq('q', qData.q)
                    .eq('axis_id', axis)
                    .maybeSingle();

                if (existing) {
                    // Update
                    const { error } = await supabase
                        .from('questions')
                        .update({
                            options: qData.options,
                            sort_order: i
                        })
                        .eq('id', existing.id);
                    if (error) console.error(`Error updating question "${qData.q}" for ${axis}:`, error.message);
                } else {
                    // Insert
                    const { error } = await supabase
                        .from('questions')
                        .insert({
                            q: qData.q,
                            options: qData.options,
                            axis_id: axis,
                            sort_order: i
                        });
                    if (error) console.error(`Error inserting question "${qData.q}" for ${axis}:`, error.message);
                }
            }
        }
    } else {
        console.warn('⚠️ No levelingTest data found in import.');
    }
}

seed().catch(err => console.error("Fatal Error:", err));
