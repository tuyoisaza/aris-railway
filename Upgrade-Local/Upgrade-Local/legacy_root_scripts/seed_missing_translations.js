const { supabase } = require('./server/db');

const translations = [
    // Pensum Axes (Missed in previous seed)
    { key: 'axis_human', es: 'Upgrade Humano', en: 'Human Upgrade', pt: 'Upgrade Humano' },
    { key: 'axis_human_desc', es: 'Evalúa tu autoconocimiento y gestión emocional.', en: 'Evaluate your self-knowledge and emotional management.', pt: 'Avalie seu autoconhecimento e gestão emocional.' },
    { key: 'axis_leadership', es: 'Eje Liderazgo', en: 'Leadership Axis', pt: 'Eixo Liderança' },
    { key: 'axis_leadership_desc', es: 'Mide tu capacidad de influencia y desarrollo de equipos.', en: 'Measure your capacity for influence and team development.', pt: 'Meça sua capacidade de influência e desenvolvimento de equipes.' },
    { key: 'axis_cocreation', es: 'Eje Co-Creación', en: 'Co-Creation Axis', pt: 'Eixo Cocriação' },
    { key: 'axis_cocreation_desc', es: 'Explora tu integración con IA y nuevas tecnologías.', en: 'Explore your integration with AI and new technologies.', pt: 'Explore sua integração com IA e novas tecnologias.' },

    // Pricing Plan Features
    // Explorer
    { key: 'plan_explorer_feat_1', es: 'Acceso a contenido básico', en: 'Access to basic content', pt: 'Acesso a conteúdo básico' },
    { key: 'plan_explorer_feat_2', es: 'Tests de nivelación', en: 'Leveling tests', pt: 'Testes de nivelamento' },
    { key: 'plan_explorer_feat_3', es: 'Comunidad', en: 'Community', pt: 'Comunidade' },

    // Builder
    { key: 'plan_builder_feat_1', es: 'Todo en Explorer', en: 'Everything in Explorer', pt: 'Tudo no Explorer' },
    { key: 'plan_builder_feat_2', es: 'Cursos completos', en: 'Full courses', pt: 'Cursos completos' },
    { key: 'plan_builder_feat_3', es: 'Decision Journal', en: 'Decision Journal', pt: 'Diário de Decisões' },
    { key: 'plan_builder_feat_4', es: 'Sesiones en vivo', en: 'Live sessions', pt: 'Sessões ao vivo' },

    // Teams
    { key: 'plan_teams_feat_1', es: 'Todo en Builder', en: 'Everything in Builder', pt: 'Tudo no Builder' },
    { key: 'plan_teams_feat_2', es: '5 miembros', en: '5 members', pt: '5 membros' },
    { key: 'plan_teams_feat_3', es: 'Analytics de equipo', en: 'Team Analytics', pt: 'Analytics de equipe' },
    { key: 'plan_teams_feat_4', es: 'Soporte prioritario', en: 'Priority support', pt: 'Suporte prioritário' }
];

async function seed() {
    console.log('Seeding missing translations...');
    for (const item of translations) {
        const { key, ...langs } = item;
        for (const [lang, value] of Object.entries(langs)) {
            const { error } = await supabase
                .from('translations')
                .upsert({ lang, key, value }, { onConflict: 'lang, key' });
            if (error) console.error(`Error ${lang}.${key}:`, error);
        }
    }
    console.log('Done.');
}

seed();
