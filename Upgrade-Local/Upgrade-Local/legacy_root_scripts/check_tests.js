const { supabase } = require('./server/db');

async function check() {
    console.log('Checking user_tests table...');
    const { data, error } = await supabase
        .from('user_tests')
        .select('*');

    if (error) console.error(error);
    else {
        console.log('Total Test Records:', data.length);
        console.log('Sample:', data[0]);
    }
}

check();
