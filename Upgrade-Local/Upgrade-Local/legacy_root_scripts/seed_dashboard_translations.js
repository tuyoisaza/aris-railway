const { supabase } = require('./server/db');

const translations = [
    // --- Dashboard ---

    // General
    { lang: 'es', key: 'dashboard_welcome', value: 'Bienvenido, {name}!' },
    { lang: 'en', key: 'dashboard_welcome', value: 'Welcome, {name}!' },
    { lang: 'pt', key: 'dashboard_welcome', value: 'Bem-vindo, {name}!' },

    // Tabs
    { lang: 'es', key: 'tab_tests', value: 'Tests de Nivelación' },
    { lang: 'en', key: 'tab_tests', value: 'Leveling Tests' },
    { lang: 'pt', key: 'tab_tests', value: 'Testes de Nivelamento' },

    { lang: 'es', key: 'tab_progress', value: 'Mi Progreso' },
    { lang: 'en', key: 'tab_progress', value: 'My Progress' },
    { lang: 'pt', key: 'tab_progress', value: 'Meu Progresso' },

    { lang: 'es', key: 'tab_courses', value: 'Mis Cursos' },
    { lang: 'en', key: 'tab_courses', value: 'My Courses' },
    { lang: 'pt', key: 'tab_courses', value: 'Meus Cursos' },

    { lang: 'es', key: 'tab_journal', value: 'Decision Journal' },
    { lang: 'en', key: 'tab_journal', value: 'Decision Journal' },
    { lang: 'pt', key: 'tab_journal', value: 'Diário de Decisões' },

    // Axis - Human
    { lang: 'es', key: 'axis_human', value: 'Eje Humano' },
    { lang: 'en', key: 'axis_human', value: 'Human Axis' },
    { lang: 'pt', key: 'axis_human', value: 'Eixo Humano' },

    { lang: 'es', key: 'axis_human_desc', value: 'Evalúa tu autoconocimiento y gestión emocional.' },
    { lang: 'en', key: 'axis_human_desc', value: 'Assesses your self-awareness and emotional management.' },
    { lang: 'pt', key: 'axis_human_desc', value: 'Avalia seu autoconhecimento e gestão emocional.' },

    // Axis - Leadership
    { lang: 'es', key: 'axis_leadership', value: 'Eje Liderazgo' },
    { lang: 'en', key: 'axis_leadership', value: 'Leadership Axis' },
    { lang: 'pt', key: 'axis_leadership', value: 'Eixo Liderança' },

    { lang: 'es', key: 'axis_leadership_desc', value: 'Mide tu capacidad de influencia y desarrollo de equipos.' },
    { lang: 'en', key: 'axis_leadership_desc', value: 'Measures your capacity for influence and team development.' },
    { lang: 'pt', key: 'axis_leadership_desc', value: 'Mede sua capacidade de influência e desenvolvimento de equipes.' },

    // Axis - CoCreation
    { lang: 'es', key: 'axis_cocreation', value: 'Eje Co-Creación' },
    { lang: 'en', key: 'axis_cocreation', value: 'Co-Creation Axis' },
    { lang: 'pt', key: 'axis_cocreation', value: 'Eixo Cocriação' },

    { lang: 'es', key: 'axis_cocreation_desc', value: 'Explora tu integración con IA y nuevas tecnologías.' },
    { lang: 'en', key: 'axis_cocreation_desc', value: 'Explores your integration with AI and new technologies.' },
    { lang: 'pt', key: 'axis_cocreation_desc', value: 'Explora sua integração com IA e novas tecnologias.' },

    // Tests Tab
    { lang: 'es', key: 'btn_start_test', value: 'Comenzar Test' },
    { lang: 'en', key: 'btn_start_test', value: 'Start Test' },
    { lang: 'pt', key: 'btn_start_test', value: 'Iniciar Teste' },

    { lang: 'es', key: 'btn_retake_test', value: 'Retomar Test' },
    { lang: 'en', key: 'btn_retake_test', value: 'Retake Test' },
    { lang: 'pt', key: 'btn_retake_test', value: 'Refazer Teste' },

    { lang: 'es', key: 'score_label', value: 'Puntaje' },
    { lang: 'en', key: 'score_label', value: 'Score' },
    { lang: 'pt', key: 'score_label', value: 'Pontuação' },

    // Progress Tab
    { lang: 'es', key: 'progress_title', value: 'Tu Progreso General' },
    { lang: 'en', key: 'progress_title', value: 'Your Overall Progress' },
    { lang: 'pt', key: 'progress_title', value: 'Seu Progresso Geral' },

    // Note: Simple interpolation for now, backend could handle format string
    { lang: 'es', key: 'progress_completed', value: 'Has completado' },
    { lang: 'en', key: 'progress_completed', value: 'You have completed' },
    { lang: 'pt', key: 'progress_completed', value: 'Você completou' },

    { lang: 'es', key: 'progress_of', value: 'de' },
    { lang: 'en', key: 'progress_of', value: 'of' },
    { lang: 'pt', key: 'progress_of', value: 'de' },

    { lang: 'es', key: 'progress_evaluations', value: 'evaluaciones' },
    { lang: 'en', key: 'progress_evaluations', value: 'evaluations' },
    { lang: 'pt', key: 'progress_evaluations', value: 'avaliações' },

    { lang: 'es', key: 'status_not_completed', value: 'No completado' },
    { lang: 'en', key: 'status_not_completed', value: 'Not completed' },
    { lang: 'pt', key: 'status_not_completed', value: 'Não concluído' },

    // Courses Tab
    { lang: 'es', key: 'courses_empty_title', value: 'Mis Cursos' },
    { lang: 'en', key: 'courses_empty_title', value: 'My Courses' },
    { lang: 'pt', key: 'courses_empty_title', value: 'Meus Cursos' },

    { lang: 'es', key: 'courses_empty_desc', value: 'Completa las evaluaciones de diagnóstico para recibir recomendaciones personalizadas de cursos.' },
    { lang: 'en', key: 'courses_empty_desc', value: 'Complete the diagnostic assessments to receive personalized course recommendations.' },
    { lang: 'pt', key: 'courses_empty_desc', value: 'Complete as avaliações de diagnóstico para receber recomendações personalizadas de cursos.' },

    // Journal Tab
    { lang: 'es', key: 'journal_title', value: 'Decision Journal' },
    { lang: 'en', key: 'journal_title', value: 'Decision Journal' },
    { lang: 'pt', key: 'journal_title', value: 'Diário de Decisões' },

    { lang: 'es', key: 'btn_new_entry', value: 'Nueva' },
    { lang: 'en', key: 'btn_new_entry', value: 'New' },
    { lang: 'pt', key: 'btn_new_entry', value: 'Nova' },

    { lang: 'es', key: 'journal_empty_desc', value: 'No tienes entradas en tu journal. Comienza documentando una decisión importante.' },
    { lang: 'en', key: 'journal_empty_desc', value: 'You have no entries in your journal. Start by documenting an important decision.' },
    { lang: 'pt', key: 'journal_empty_desc', value: 'Você não tem entradas no seu diário. Comece documentando uma decisão importante.' },

    { lang: 'es', key: 'journal_review_date', value: 'Revisar:' },
    { lang: 'en', key: 'journal_review_date', value: 'Review:' },
    { lang: 'pt', key: 'journal_review_date', value: 'Revisar:' },

    { lang: 'es', key: 'label_context', value: 'Contexto:' },
    { lang: 'en', key: 'label_context', value: 'Context:' },
    { lang: 'pt', key: 'label_context', value: 'Contexto:' },

    { lang: 'es', key: 'label_outcome', value: 'Resultado:' },
    { lang: 'en', key: 'label_outcome', value: 'Outcome:' },
    { lang: 'pt', key: 'label_outcome', value: 'Resultado:' },
];

async function seed() {
    console.log('Seeding Dashboard translations...');

    for (const t of translations) {
        const { error } = await supabase
            .from('translations')
            .upsert(t, { onConflict: 'lang, key' });

        if (error) console.error('Error:', error);
        else console.log(`Inserted: ${t.key} (${t.lang})`);
    }

    console.log('Done!');
}

seed();
