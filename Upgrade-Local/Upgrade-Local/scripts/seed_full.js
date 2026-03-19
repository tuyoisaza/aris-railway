const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Missing Env Vars for Seeding");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const AXES = [
    { id: 'human', title_key: 'axis_human', desc_key: 'axis_human_desc', sort_order: 1 },
    { id: 'leadership', title_key: 'axis_leadership', desc_key: 'axis_leadership_desc', sort_order: 2 },
    { id: 'cocreation', title_key: 'axis_cocreation', desc_key: 'axis_cocreation_desc', sort_order: 3 }
];

const CATEGORIES = [
    // Human
    { axis_id: 'human', title: 'Ser', sort_order: 1 },
    { axis_id: 'human', title: 'Hacer', sort_order: 2 },
    { axis_id: 'human', title: 'Tener', sort_order: 3 },
    // Leadership
    { axis_id: 'leadership', title: 'Mindset de Líder', sort_order: 1 },
    { axis_id: 'leadership', title: 'Sistemas', sort_order: 2 },
    { axis_id: 'leadership', title: 'Desarrollo de Personas', sort_order: 3 },
    // Co-creation
    { axis_id: 'cocreation', title: 'Inteligencia Artificial', sort_order: 1 },
    { axis_id: 'cocreation', title: 'Prompting', sort_order: 2 },
    { axis_id: 'cocreation', title: 'Automatización', sort_order: 3 }
];

const PROTOTYPE_COURSES = [
    { cat_title: 'Ser', title: 'Identidad y Creencias', desc: 'Reescribe tu código fuente.' },
    { cat_title: 'Hacer', title: 'Productividad Mental', desc: 'Gestiona tu atención, no tu tiempo.' },
    { cat_title: 'Mindset de Líder', title: 'Liderazgo Servidor', desc: 'De jefe a arquitecto de contextos.' },
    { cat_title: 'Inteligencia Artificial', title: 'Co-creación Básica', desc: 'Tu primer copiloto.' }
];

const MENTORS = [
    { name: 'Tuyo Isaza', role: 'Conciencia y Liderazgo', description: 'Especialista en productividad mental.', image_url: 'img/mentor_placeholders.png', sort_order: 1 },
    { name: 'Juan Alvarez', role: 'Modelos Mentales', description: 'Experto en mensajes y cultura.', image_url: 'img/mentor_placeholders.png', sort_order: 2 },
    { name: 'Camilo Vera', role: 'Neuromarketing', description: 'Estratega en comportamiento humano.', image_url: 'img/mentor_placeholders.png', sort_order: 3 },
    { name: 'Andrés Jaramillo', role: 'Growth', description: 'Experto en estrategia de crecimiento.', image_url: 'img/mentor_placeholders.png', sort_order: 4 }
];

const TRANSLATIONS = [
    { lang: 'es', key: 'axis_human', value: 'Upgrade Humano' },
    { lang: 'es', key: 'axis_human_desc', value: 'Gobernarte a ti mismo antes de liderar.' },
    { lang: 'es', key: 'axis_leadership', value: 'Upgrade de Liderazgo' },
    { lang: 'es', key: 'axis_leadership_desc', value: 'Diseñar contextos y desarrollar personas.' },
    { lang: 'es', key: 'axis_cocreation', value: 'Upgrade de Co-creación' },
    { lang: 'es', key: 'axis_cocreation_desc', value: 'Amplificar criterio con IA.' },
    { lang: 'es', key: 'welcome_user', value: 'Hola, ' },
    { lang: 'es', key: 'start_test', value: 'Iniciar Test' },
    { lang: 'es', key: 'tab_tests', value: 'Diagnóstico' },
    { lang: 'es', key: 'tab_progress', value: 'Mi Progreso' },
    { lang: 'es', key: 'tab_courses', value: 'Mis Cursos' },
    { lang: 'es', key: 'tab_journal', value: 'Bitácora' },
    { lang: 'es', key: 'journal_no_entries', value: 'No hay entradas aún.' },
    { lang: 'es', key: 'level_basic', value: 'Nivel: Explorador' },
    { lang: 'es', key: 'feedback_basic', value: 'Estás en el inicio del camino. Enfócate en fundamentos.' },
    { lang: 'es', key: 'level_inter', value: 'Nivel: Constructor' },
    { lang: 'es', key: 'feedback_inter', value: 'Tienes bases sólidas. Es hora de aplicar sistemas.' },
    { lang: 'es', key: 'level_adv', value: 'Nivel: Arquitecto' },
    { lang: 'es', key: 'feedback_adv', value: 'Dominio alto. Busca trascender y enseñar.' },
    { lang: 'es', key: 'btn_login', value: 'Ingresar' }
];

const QUESTIONS = [
    // Human
    {
        axis: 'human', q: 'Cuando enfrentas un error personal, tú:', options: [
            { text: 'Buscas culpables externos', points: 1 },
            { text: 'Te criticas duramente', points: 3 },
            { text: 'Analizas el sistema que falló', points: 5 },
            { text: 'Lo usas para rediseñar tu proceso', points: 10 }
        ]
    },
    {
        axis: 'human', q: 'Tu relación con el tiempo es:', options: [
            { text: 'Siempre me falta', points: 1 },
            { text: 'Lo gestiono con agenda rígida', points: 3 },
            { text: 'Gestiono mi energía, no el tiempo', points: 7 },
            { text: 'Fluyo en presencia absoluta', points: 10 }
        ]
    },
    {
        axis: 'human', q: '¿Cómo defines tu propósito?', options: [
            { text: 'No lo tengo claro', points: 1 },
            { text: 'Tener éxito profesional', points: 3 },
            { text: 'Servir a otros con mis talentos', points: 7 },
            { text: 'Trascender el ego', points: 10 }
        ]
    },
    // Leadership
    {
        axis: 'leadership', q: 'Cuando tu equipo falla, tú:', options: [
            { text: 'Te molestas y corriges', points: 1 },
            { text: 'Explicas cómo hacerlo bien', points: 3 },
            { text: 'Preguntas qué aprendieron', points: 7 },
            { text: 'Revisas el contexto que creaste', points: 10 }
        ]
    },
    // Co-creation
    {
        axis: 'cocreation', q: '¿Qué es la IA para ti?', options: [
            { text: 'Una amenaza', points: 1 },
            { text: 'Una herramienta rápida', points: 3 },
            { text: 'Un copiloto intelectual', points: 7 },
            { text: 'Una extensión de mi mente', points: 10 }
        ]
    }
];


async function seed() {
    console.log('🌱 Starting Seed...');

    // 1. Clean (Optional - simplistic delete all for dev)
    // In production we might merge, but for Phase 3 we assume fresh start or overwrite.
    // Order matters for FK.
    await supabase.from('user_tests').delete().neq('score', -1);
    await supabase.from('courses').delete().neq('title', 'x');
    await supabase.from('categories').delete().neq('title', 'x');
    await supabase.from('questions').delete().neq('q', 'x');
    await supabase.from('axes').delete().neq('id', 'x');
    await supabase.from('mentors').delete().neq('name', 'x');
    await supabase.from('translations').delete().neq('key', 'x');

    console.log('   🧹 Tables Cleared');

    // 2. Axes
    const { error: errAxes } = await supabase.from('axes').insert(AXES);
    if (errAxes) console.error('Axes Error', errAxes);
    else console.log('   ✅ Axes Inserted');

    // 3. Categories
    // Need to fetch axes IDs if UUIDs? No, Axes uses text IDs.
    const { data: insertedCats, error: errCats } = await supabase.from('categories').insert(CATEGORIES).select();
    if (errCats) console.error('Cats Error', errCats);
    else console.log(`   ✅ Categories Inserted (${insertedCats.length})`);

    // 4. Courses
    // Link to categories
    const coursesToInsert = [];
    PROTOTYPE_COURSES.forEach(pc => {
        const cat = insertedCats.find(c => c.title === pc.cat_title);
        if (cat) {
            coursesToInsert.push({
                category_id: cat.id,
                title: pc.title,
                description: pc.desc,
                duration: '4 semanas',
                syllabus: [
                    { title: 'Intro', duration: '10m', desc: 'Bienvenida' },
                    { title: 'Concepto Central', duration: '20m', desc: 'Teoría' },
                    { title: 'Práctica', duration: '30m', desc: 'Ejercicio' }
                ],
                is_premium: false // Default free for MVP logic testing, or mixed.
            });
        }
    });

    if (coursesToInsert.length > 0) {
        const { error: errCourses } = await supabase.from('courses').insert(coursesToInsert);
        if (errCourses) console.error('Courses Error', errCourses);
        else console.log(`   ✅ Courses Inserted (${coursesToInsert.length})`);
    }

    // 5. Mentors
    const { error: errMen } = await supabase.from('mentors').insert(MENTORS);
    if (errMen) console.error('Mentors Error', errMen);
    else console.log('   ✅ Mentors Inserted');

    // 6. Translations
    const { error: errTrans } = await supabase.from('translations').upsert(TRANSLATIONS, { onConflict: 'lang,key' });
    if (errTrans) console.error('Trans Error', errTrans);
    else console.log('   ✅ Translations Inserted');

    // 7. Questions
    const questionsToInsert = QUESTIONS.map(q => ({
        axis_id: q.axis,
        q: q.q,
        options: q.options
    }));
    const { error: errQ } = await supabase.from('questions').insert(questionsToInsert);
    if (errQ) console.error('Questions Error', errQ);
    else console.log('   ✅ Questions Inserted');

    console.log('🎉 Seed Complete. Reality has been established.');
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
