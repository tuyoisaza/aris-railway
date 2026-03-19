const { supabase } = require('./server/db');

const translations = [
    // Spanish
    { lang: 'es', key: 'nav_home', value: 'Inicio' },
    { lang: 'es', key: 'nav_pricing', value: 'Precios' },
    { lang: 'es', key: 'btn_login', value: 'Entrar' },

    // English
    { lang: 'en', key: 'nav_home', value: 'Home' },
    { lang: 'en', key: 'nav_pricing', value: 'Pricing' },
    { lang: 'en', key: 'btn_login', value: 'Login' },

    // Portuguese
    { lang: 'pt', key: 'nav_home', value: 'Início' },
    { lang: 'pt', key: 'nav_pricing', value: 'Preços' },
    { lang: 'pt', key: 'btn_login', value: 'Entrar' }
];

async function seed() {
    console.log('Seeding translations...');

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
