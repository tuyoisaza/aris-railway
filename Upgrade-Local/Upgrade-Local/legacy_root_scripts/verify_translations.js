const { supabase } = require('./server/db');

async function check() {
    console.log('Checking translations...');
    const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('lang', 'es');

    if (error) console.error(error);
    else console.log('ES Translations found:', data.length);

    if (data?.length > 0) {
        console.log('Sample:', data[0]);
    }
}

check();
