require('dotenv').config({ path: 'server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createBucket() {
    console.log('Creating "avatars" bucket...');

    const { data, error } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1048576, // 1MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Bucket "avatars" already exists.');
        } else {
            console.error('❌ Failed to create bucket:', error);
        }
    } else {
        console.log('✅ Bucket "avatars" created successfully.');
    }
}

createBucket();
