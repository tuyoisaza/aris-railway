const { supabase } = require('./server/db');

const translations = [
    // Levels
    { key: 'level_beginner', es: 'Nivel Inicial', en: 'Beginner Level', pt: 'Nível Inicial' },
    { key: 'level_intermediate', es: 'Nivel Intermedio', en: 'Intermediate Level', pt: 'Nível Intermediário' },
    { key: 'level_advanced', es: 'Nivel Avanzado', en: 'Advanced Level', pt: 'Nível Avançado' },
    { key: 'level_expert', es: 'Nivel Experto', en: 'Expert Level', pt: 'Nível Expert' },
];

async function seed() {
    console.log('Seeding level translations...');
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
