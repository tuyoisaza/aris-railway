const { supabase } = require('./server/db');

const translations = [
    // --- Landing Page ---

    // Hero
    { lang: 'es', key: 'hero_title', value: 'Actualízate como persona, líder y co-creador' },
    { lang: 'en', key: 'hero_title', value: 'Upgrade yourself as a person, leader, and co-creator' },
    { lang: 'pt', key: 'hero_title', value: 'Atualize-se como pessoa, líder e cocriador' },

    { lang: 'es', key: 'hero_subtitle', value: 'Deja de operar con una versión mental que ya no es compatible con el mundo actual.' },
    { lang: 'en', key: 'hero_subtitle', value: 'Stop operating with a mental version that is no longer compatible with the current world.' },
    { lang: 'pt', key: 'hero_subtitle', value: 'Pare de operar com uma versão mental que já não é compatível com o mundo atual.' },

    { lang: 'es', key: 'btn_explore', value: 'Explorar el Upgrade!' },
    { lang: 'en', key: 'btn_explore', value: 'Explore the Upgrade!' },
    { lang: 'pt', key: 'btn_explore', value: 'Explorar o Upgrade!' },

    { lang: 'es', key: 'btn_view_pensum', value: 'Ver el pensum' },
    { lang: 'en', key: 'btn_view_pensum', value: 'View curriculum' },
    { lang: 'pt', key: 'btn_view_pensum', value: 'Ver currículo' },

    // Problem Section
    { lang: 'es', key: 'problem_title', value: 'El desfase no es técnico. Es mental.' },
    { lang: 'en', key: 'problem_title', value: 'The gap is not technical. It is mental.' },
    { lang: 'pt', key: 'problem_title', value: 'A lacuna não é técnica. É mental.' },

    { lang: 'es', key: 'problem_subtitle', value: 'Hoy no faltan herramientas. Falta claridad.' },
    { lang: 'en', key: 'problem_subtitle', value: 'Today there is no lack of tools. Clarity is missing.' },
    { lang: 'pt', key: 'problem_subtitle', value: 'Hoje não faltam ferramentas. Falta clareza.' },

    { lang: 'es', key: 'problem_1_title', value: 'Modelos mentales viejos' },
    { lang: 'en', key: 'problem_1_title', value: 'Old mental models' },
    { lang: 'pt', key: 'problem_1_title', value: 'Modelos mentais antigos' },

    { lang: 'es', key: 'problem_1_desc', value: 'Personas brillantes operan con versiones desactualizadas de sí mismas.' },
    { lang: 'en', key: 'problem_1_desc', value: 'Brilliant people operate with outdated versions of themselves.' },
    { lang: 'pt', key: 'problem_1_desc', value: 'Pessoas brilhantes operam com versões desatualizadas de si mesmas.' },

    { lang: 'es', key: 'problem_2_title', value: 'Liderazgo sin criterio' },
    { lang: 'en', key: 'problem_2_title', value: 'Leadership without judgment' },
    { lang: 'pt', key: 'problem_2_title', value: 'Liderança sem critérios' },

    { lang: 'es', key: 'problem_2_desc', value: 'Líderes bien intencionados generan fricción porque no han actualizado cómo interactúan.' },
    { lang: 'en', key: 'problem_2_desc', value: 'Well-intentioned leaders generate friction because they haven\'t updated how they interact.' },
    { lang: 'pt', key: 'problem_2_desc', value: 'Líderes bem-intencionados geram atrito porque não atualizaram a forma como interagem.' },

    { lang: 'es', key: 'problem_3_title', value: 'IA sin responsabilidad' },
    { lang: 'en', key: 'problem_3_title', value: 'AI without responsibility' },
    { lang: 'pt', key: 'problem_3_title', value: 'IA sem responsabilidade' },

    { lang: 'es', key: 'problem_3_desc', value: 'La inteligencia artificial se usa sin criterio, sin límites claros.' },
    { lang: 'en', key: 'problem_3_desc', value: 'Artificial intelligence is used without judgment, without clear limits.' },
    { lang: 'pt', key: 'problem_3_desc', value: 'A inteligência artificial é usada sem critérios, sem limites claros.' },

    // Pricing
    { lang: 'es', key: 'pricing_title', value: 'Planes' },
    { lang: 'en', key: 'pricing_title', value: 'Plans' },
    { lang: 'pt', key: 'pricing_title', value: 'Planos' },

    { lang: 'es', key: 'pricing_subtitle', value: 'Elige tu nivel de compromiso' },
    { lang: 'en', key: 'pricing_subtitle', value: 'Choose your level of commitment' },
    { lang: 'pt', key: 'pricing_subtitle', value: 'Escolha seu nível de compromisso' },

    { lang: 'es', key: 'plan_free', value: 'Gratis' },
    { lang: 'en', key: 'plan_free', value: 'Free' },
    { lang: 'pt', key: 'plan_free', value: 'Grátis' },

    { lang: 'es', key: 'btn_start', value: 'Comenzar' },
    { lang: 'en', key: 'btn_start', value: 'Start' },
    { lang: 'pt', key: 'btn_start', value: 'Começar' },

    { lang: 'es', key: 'btn_subscribe', value: 'Suscribirse' },
    { lang: 'en', key: 'btn_subscribe', value: 'Subscribe' },
    { lang: 'pt', key: 'btn_subscribe', value: 'Increver-se' },

    { lang: 'es', key: 'btn_contact', value: 'Contactar' },
    { lang: 'en', key: 'btn_contact', value: 'Contact' },
    { lang: 'pt', key: 'btn_contact', value: 'Contatar' }
];

async function seed() {
    console.log('Seeding content translations...');

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
