const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('Setting up storage...');

    const bucketName = 'mentors';

    // 1. Create Bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log(`Bucket '${bucketName}' already exists.`);
        } else {
            console.error('Error creating bucket:', error);
            // Don't exit, might just need policies
        }
    } else {
        console.log(`Bucket '${bucketName}' created.`);
    }

    // 2. Set Policy (Public Read/Write) - RLS might block uploads even if public: true
    // Creating buckets via API usually sets some defaults, but let's be safe.
    // NOTE: Storage policies are often set via SQL, not JS client easily without custom SQL execution.
    // However, if we use Service Role in backend to upload, it's fine.
    // But we are uploading from FRONTEND (Anon Key).
    // So we need RLS policies on `storage.objects`.

    // Since we don't have a direct "create storage policy" JS method, we'll try to rely on the 'public: true' 
    // and hope Supabase defaults allow Authenticated users to upload.
    // If not, we might need to run a SQL migration. 
    // Let's print a warning.
    console.log('NOTE: Ensure RLS policies on storage.objects allow uploads for authenticated users.');
    console.log(`
    -- SQL to run if uploads fail:
    insert into storage.buckets (id, name, public) values ('mentors', 'mentors', true) on conflict (id) do nothing;

    create policy "Public Access" on storage.objects for select using ( bucket_id = 'mentors' );
    create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'mentors' and auth.role() = 'authenticated' );
    `);

}

setupStorage();
