/**
 * Check course data in database
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCourse() {
    const courseId = 'gen_1768533213216_cafe';

    console.log(`Checking course: ${courseId}\n`);

    const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (error) {
        console.error('Error fetching course:', error);
        return;
    }

    if (!course) {
        console.log('Course not found!');
        return;
    }

    console.log('Course Title:', course.title);
    console.log('Course ID:', course.id);
    console.log('Origin Topic:', course.origin_topic);
    console.log('Created At:', course.created_at);
    console.log('Updated At:', course.updated_at);
    console.log('Category ID:', course.category_id);
    console.log('Syllabus items:', course.syllabus?.length || 0);
    console.log('\n--- Syllabus Content Status ---\n');

    if (course.syllabus) {
        course.syllabus.forEach((item, index) => {
            const hasContent = item.content && Object.keys(item.content).length > 0;
            console.log(`Step ${index}: "${item.title}" - Content: ${hasContent ? 'YES' : 'NO'}`);
            if (hasContent) {
                console.log(`  - Has markdown_content: ${!!item.content.markdown_content}`);
                console.log(`  - Has resources: ${Array.isArray(item.content.resources) ? item.content.resources.length : 0}`);
            }
        });
    }
}

checkCourse().catch(console.error);
