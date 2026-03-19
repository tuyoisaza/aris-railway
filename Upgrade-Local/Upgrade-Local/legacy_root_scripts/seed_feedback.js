const { supabase } = require('./server/db');

const translations = [
    // Test Feedback
    { key: 'feedback_beginner', es: 'Tienes oportunidades significativas de desarrollo. Recomendamos enfocarte en los fundamentos.', en: 'You have significant development opportunities. We recommend focusing on the fundamentals.', pt: 'Você tem oportunidades significativas de desenvolvimento. Recomendamos focar nos fundamentos.' },
    { key: 'feedback_intermediate', es: 'Tienes una base sólida. Es momento de profundizar tus habilidades.', en: 'You have a solid foundation. It is time to deepen your skills.', pt: 'Você tem uma base sólida. É hora de aprofundar suas habilidades.' },
    { key: 'feedback_advanced', es: 'Demuestras competencias fuertes. Continúa refinando tu expertise.', en: 'You demonstrate strong competencies. Continue refining your expertise.', pt: 'Você demonstra fortes competências. Continue refinando sua expertise.' },
    { key: 'feedback_expert', es: '¡Excelente! Eres un referente en esta área. Considera compartir tu conocimiento.', en: 'Excellent! You are a benchmark in this area. Consider sharing your knowledge.', pt: 'Excelente! Você é uma referência nesta área. Considere compartilhar seu conhecimento.' },
];

async function seed() {
    console.log('Seeding feedback translations...');
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
