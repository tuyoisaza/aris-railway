const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log('🔍 Inspecting Tables...');

    // Check Axes
    const { data: axes, error } = await supabase.from('axes').select('*').limit(1);
    if (error) console.error('Axes Error:', error);
    else console.log('Axes Columns:', axes.length > 0 ? Object.keys(axes[0]) : 'Table Empty but exists');

    // Check Categories
    const { data: cats, error: errC } = await supabase.from('categories').select('*').limit(1);
    if (errC) console.error('Categories Error:', errC);
    else console.log('Categories Columns:', cats.length > 0 ? Object.keys(cats[0]) : 'Table Empty but exists');

    process.exit(0);
}

inspect();
