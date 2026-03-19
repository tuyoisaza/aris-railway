
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
    // English
    { lang: 'en', key: 'course_not_found', value: 'Course Not Found' },
    { lang: 'en', key: 'return_to_pensum', value: 'Return to Pensum' },
    { lang: 'en', key: 'back_to_pensum', value: 'Back to Pensum' },
    { lang: 'en', key: 'course_syllabus', value: 'Course Syllabus' },
    { lang: 'en', key: 'no_syllabus_content', value: 'No syllabus content available yet.' },
    { lang: 'en', key: 'course_status', value: 'Course Status' },
    { lang: 'en', key: 'active_enrollment', value: 'Active Enrollment' },
    { lang: 'en', key: 'resume_learning', value: 'Resume Learning' },
    { lang: 'en', key: 'class_not_created', value: 'This class hasn\'t been created yet.' },
    { lang: 'en', key: 'class_not_created_desc', value: 'The Architect has prepared the syllabus, but the deep content needs to be synthesized for you.' },
    { lang: 'en', key: 'create_experience', value: 'Create Experience Now' },
    { lang: 'en', key: 'synthesizing_experience', value: 'Synthesizing Experience...' },
    { lang: 'en', key: 'curated_resources', value: 'Curated Resources' },

    // Spanish
    { lang: 'es', key: 'course_not_found', value: 'Curso no encontrado' },
    { lang: 'es', key: 'return_to_pensum', value: 'Volver al Pensum' },
    { lang: 'es', key: 'back_to_pensum', value: 'Volver al Pensum' },
    { lang: 'es', key: 'course_syllabus', value: 'Temario del Curso' },
    { lang: 'es', key: 'no_syllabus_content', value: 'No hay contenido disponible aún.' },
    { lang: 'es', key: 'course_status', value: 'Estado del Curso' },
    { lang: 'es', key: 'active_enrollment', value: 'Inscripción Activa' },
    { lang: 'es', key: 'resume_learning', value: 'Continuar Aprendizaje' },
    { lang: 'es', key: 'class_not_created', value: 'Esta clase aún no ha sido creada.' },
    { lang: 'es', key: 'class_not_created_desc', value: 'El Arquitecto ha preparado el temario, pero el contenido profundo necesita ser sintetizado para ti.' },
    { lang: 'es', key: 'create_experience', value: 'Crear Experiencia Ahora' },
    { lang: 'es', key: 'synthesizing_experience', value: 'Sintetizando Experiencia...' },
    { lang: 'es', key: 'curated_resources', value: 'Recursos Curados' }
];

async function run() {
    console.log('Inserting translations...');

    for (const t of translations) {
        const { error } = await supabase
            .from('translations')
            .upsert(t, { onConflict: 'lang,key' });

        if (error) console.error('Error inserting', t.key, error.message);
    }

    console.log('Done!');
}

run();
